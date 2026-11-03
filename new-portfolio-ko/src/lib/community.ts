import type { Pool, PoolClient } from "pg";
import type { CommunityEvent } from "./realtime";
import { hashSession } from "./visitors";

export type Queryable = Pool | PoolClient;

export class CommunityError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CommunityError";
  }
}

export function normalizeCommunityText(value: unknown, max: number): string {
  if (typeof value !== "string") {
    throw new CommunityError(400, "A text message is required.");
  }

  const content = value.trim().replace(/\r\n?/g, "\n");

  const hasControlCharacter = Array.from(content).some((character) => {
    const code = character.codePointAt(0);
    return code !== undefined && (code < 32 || code === 127) && code !== 10;
  });

  if (
    hasControlCharacter ||
    content.length < 1 ||
    Array.from(content).length > max
  ) {
    throw new CommunityError(
      400,
      `Message must contain 1–${max} characters and no control characters.`,
    );
  }

  return content;
}

export async function findVisitorId(
  database: Queryable,
  sessionId: string,
): Promise<string> {
  const result = await database.query<{ id: string }>(
    "SELECT id FROM visitors WHERE session_hash = $1",
    [hashSession(sessionId)],
  );

  if (!result.rows[0]) {
    throw new CommunityError(401, "Visitor session not found.");
  }

  return result.rows[0].id;
}

export async function publishCommunityUpdate(
  database: Queryable,
  event: CommunityEvent,
): Promise<void> {
  // PostgreSQL delivers this notification after its surrounding transaction commits.
  await database.query("SELECT pg_notify('orbital_community', $1)", [
    JSON.stringify(event),
  ]);
}
