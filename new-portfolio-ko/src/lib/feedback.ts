import type { PoolClient } from "pg";
import {
  CommunityError,
  findVisitorId,
  normalizeCommunityText,
  publishCommunityUpdate,
} from "./community";
import { getDatabase } from "./db";

export type PublicFeedback = {
  id: string;
  authorName: string;
  authorNumber: string;
  body: string;
  editCount: number;
  createdAt: string;
  updatedAt: string;
};

type FeedbackRow = {
  id: string;
  author_name: string;
  author_number: string;
  body: string;
  edit_count: number;
  created_at: Date;
  updated_at: Date;
};

function toPublicFeedback(row: FeedbackRow): PublicFeedback {
  return {
    id: row.id,
    authorName: row.author_name,
    authorNumber: row.author_number,
    body: row.body,
    editCount: row.edit_count,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function readFeedbackForVisitor(
  client: PoolClient,
  visitorId: string,
): Promise<PublicFeedback | null> {
  const result = await client.query<FeedbackRow>(
    `SELECT f.visitor_id AS id, v.display_name AS author_name,
            v.visitor_number::text AS author_number, f.body,
            f.edit_count, f.created_at, f.updated_at
     FROM visitor_feedback f JOIN visitors v ON v.id = f.visitor_id
     WHERE f.visitor_id = $1`,
    [visitorId],
  );
  return result.rows[0] ? toPublicFeedback(result.rows[0]) : null;
}

export async function listPublicFeedback(): Promise<PublicFeedback[]> {
  const result = await getDatabase().query<FeedbackRow>(
    `SELECT f.visitor_id AS id, v.display_name AS author_name,
            v.visitor_number::text AS author_number, f.body,
            f.edit_count, f.created_at, f.updated_at
     FROM visitor_feedback f
     JOIN visitors v ON v.id = f.visitor_id
     ORDER BY f.created_at DESC, f.visitor_id DESC
     LIMIT 100`,
  );
  return result.rows.map(toPublicFeedback);
}

export async function getMyFeedback(
  sessionId: string,
): Promise<PublicFeedback | null> {
  const client = await getDatabase().connect();
  try {
    const visitorId = await findVisitorId(client, sessionId);
    return await readFeedbackForVisitor(client, visitorId);
  } finally {
    client.release();
  }
}

export async function publishFeedback(
  sessionId: string,
  rawBody: unknown,
): Promise<{ feedback: PublicFeedback; newAchievementIds: string[] }> {
  const body = normalizeCommunityText(rawBody, 1600);
  const client = await getDatabase().connect();

  try {
    await client.query("BEGIN");
    const visitorId = await findVisitorId(client, sessionId);

    // The unique visitor_id key prevents duplicate feedback even when the
    // visitor submits from two tabs at the same moment.
    const insert = await client.query(
      `INSERT INTO visitor_feedback (visitor_id, body) VALUES ($1, $2)
       ON CONFLICT (visitor_id) DO NOTHING RETURNING visitor_id`,
      [visitorId, body],
    );

    if (!insert.rowCount) {
      throw new CommunityError(
        409,
        "You have already posted feedback. You can edit it up to 3 times.",
      );
    }

    const unlock = await client.query(
      `INSERT INTO visitor_achievements (visitor_id, achievement_id)
       VALUES ($1, 'feedback_giver')
       ON CONFLICT DO NOTHING RETURNING achievement_id`,
      [visitorId],
    );
    const feedback = await readFeedbackForVisitor(client, visitorId);

    if (!feedback) {
      throw new Error("Feedback was not available after creation.");
    }

    await publishCommunityUpdate(client, { type: "feedback", feedback });
    await client.query("COMMIT");

    return {
      feedback,
      newAchievementIds: unlock.rowCount ? ["feedback_giver"] : [],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function editFeedback(
  sessionId: string,
  rawBody: unknown,
): Promise<PublicFeedback> {
  const body = normalizeCommunityText(rawBody, 1600);
  const client = await getDatabase().connect();

  try {
    await client.query("BEGIN");
    const visitorId = await findVisitorId(client, sessionId);

    const updated = await client.query(
      `UPDATE visitor_feedback
       SET body = $2, edit_count = edit_count + 1, updated_at = now()
       WHERE visitor_id = $1 AND edit_count < 3 AND body IS DISTINCT FROM $2
       RETURNING visitor_id`,
      [visitorId, body],
    );

    const feedback = await readFeedbackForVisitor(client, visitorId);
    if (!feedback) {
      throw new CommunityError(404, "Post feedback before trying to edit it.");
    }
    if (!updated.rowCount && feedback.body !== body) {
      throw new CommunityError(409, "You have used all 3 feedback edits.");
    }

    if (updated.rowCount) {
      await publishCommunityUpdate(client, { type: "feedback", feedback });
    }

    await client.query("COMMIT");
    return feedback;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
