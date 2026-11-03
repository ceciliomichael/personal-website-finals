import {
  CommunityError,
  findVisitorId,
  normalizeCommunityText,
  publishCommunityUpdate,
} from "./community";
import { getDatabase } from "./db";

export type LobbyMessage = {
  id: string;
  authorName: string;
  authorNumber: string;
  body: string;
  createdAt: string;
};

type MessageRow = {
  id: string;
  author_name: string;
  author_number: string;
  body: string;
  created_at: Date;
};

function toLobbyMessage(row: MessageRow): LobbyMessage {
  return {
    id: row.id,
    authorName: row.author_name,
    authorNumber: row.author_number,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function listLobbyMessages(
  afterId?: string,
): Promise<LobbyMessage[]> {
  const result = await getDatabase().query<MessageRow>(
    `SELECT recent.id::text, recent.body, recent.created_at,
            visitors.display_name AS author_name,
            visitors.visitor_number::text AS author_number
     FROM (
       SELECT id, visitor_id, body, created_at
       FROM lobby_messages
       WHERE ($1::bigint IS NULL OR id > $1::bigint)
       ORDER BY id DESC LIMIT 20
     ) recent
     JOIN visitors ON visitors.id = recent.visitor_id
     ORDER BY recent.id ASC`,
    [afterId ?? null],
  );

  return result.rows.map(toLobbyMessage);
}

export async function postLobbyMessage(
  sessionId: string,
  rawBody: unknown,
): Promise<{ message: LobbyMessage; newAchievementIds: string[] }> {
  const body = normalizeCommunityText(rawBody, 500);
  const client = await getDatabase().connect();

  try {
    await client.query("BEGIN");

    // Serialize inserts and pruning across all processes. This guarantees
    // that the shared lobby never keeps more than the latest 20 messages.
    await client.query("SELECT pg_advisory_xact_lock(73159203)");
    const visitorId = await findVisitorId(client, sessionId);
    const lastMessage = await client.query<{ created_at: Date }>(
      "SELECT created_at FROM lobby_messages WHERE visitor_id = $1 ORDER BY id DESC LIMIT 1",
      [visitorId],
    );

    if (
      lastMessage.rows[0] &&
      Date.now() - new Date(lastMessage.rows[0].created_at).getTime() < 1000
    ) {
      throw new CommunityError(
        429,
        "Please wait a moment before sending another message.",
      );
    }

    const inserted = await client.query<MessageRow>(
      `WITH inserted AS (
         INSERT INTO lobby_messages (visitor_id, body)
         VALUES ($1, $2)
         RETURNING id, visitor_id, body, created_at
       )
       SELECT inserted.id::text, inserted.body, inserted.created_at,
              visitors.display_name AS author_name,
              visitors.visitor_number::text AS author_number
       FROM inserted JOIN visitors ON visitors.id = inserted.visitor_id`,
      [visitorId, body],
    );

    await client.query(
      `DELETE FROM lobby_messages
       WHERE id IN (
         SELECT id FROM lobby_messages ORDER BY id DESC OFFSET 20
       )`,
    );

    const unlock = await client.query(
      `INSERT INTO visitor_achievements (visitor_id, achievement_id)
       VALUES ($1, 'first_message')
       ON CONFLICT DO NOTHING RETURNING achievement_id`,
      [visitorId],
    );

    const message = toLobbyMessage(inserted.rows[0]);
    await publishCommunityUpdate(client, { type: "lobby", message });
    await client.query("COMMIT");

    return {
      message,
      newAchievementIds: unlock.rowCount ? ["first_message"] : [],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
