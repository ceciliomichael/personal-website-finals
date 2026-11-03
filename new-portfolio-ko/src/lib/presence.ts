import { findVisitorId, publishCommunityUpdate } from "./community";
import { getDatabase } from "./db";

const STALE_AFTER_SECONDS = 60;

export async function countOnlineVisitors(): Promise<number> {
  const client = await getDatabase().connect();

  try {
    await client.query("BEGIN");

    const expired = await client.query(
      `DELETE FROM visitor_presence
       WHERE last_seen < now() - ($1::int * interval '1 second')`,
      [STALE_AFTER_SECONDS],
    );

    const result = await client.query<{ online: number }>(
      "SELECT COUNT(*)::int AS online FROM visitor_presence",
    );

    if (expired.rowCount) {
      await publishCommunityUpdate(client, { type: "presence" });
    }

    await client.query("COMMIT");
    return result.rows[0].online;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function markVisitorOnline(sessionId: string): Promise<number> {
  const client = await getDatabase().connect();

  try {
    await client.query("BEGIN");
    const visitorId = await findVisitorId(client, sessionId);

    const expired = await client.query(
      `DELETE FROM visitor_presence
       WHERE last_seen < now() - ($1::int * interval '1 second')`,
      [STALE_AFTER_SECONDS],
    );

    const inserted = await client.query(
      `INSERT INTO visitor_presence (visitor_id)
       VALUES ($1)
       ON CONFLICT DO NOTHING
       RETURNING visitor_id`,
      [visitorId],
    );

    if (!inserted.rowCount) {
      await client.query(
        "UPDATE visitor_presence SET last_seen = now() WHERE visitor_id = $1",
        [visitorId],
      );
    }

    const result = await client.query<{ online: number }>(
      "SELECT COUNT(*)::int AS online FROM visitor_presence",
    );

    if (inserted.rowCount || expired.rowCount) {
      await publishCommunityUpdate(client, { type: "presence" });
    }

    await client.query("COMMIT");
    return result.rows[0].online;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
