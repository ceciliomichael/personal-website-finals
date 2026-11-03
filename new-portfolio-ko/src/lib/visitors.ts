import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { sections } from "@/data/portfolio";
import { getDatabase } from "./db";

export type VisitorProfile = {
  id: string;
  visitorNumber: string;
  displayName: string;
  visitedSectionIds: string[];
  unlockedAchievementIds: string[];
};

export type VisitorActivity =
  | { type: "enter" }
  | { type: "section"; sectionId: string }
  | { type: "time" };

type Queryable = Pool | PoolClient;
type VisitorRow = {
  id: string;
  visitor_number: string;
  display_name: string;
};

const sectionIds = new Set(sections.map((section) => section.id));
const SESSION_UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validSessionId(value: unknown): value is string {
  return typeof value === "string" && SESSION_UUID_V4.test(value);
}

export function readSessionId(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const sessionId = authorization.slice(7).trim();
  return validSessionId(sessionId) ? sessionId : null;
}

export function normalizeDisplayName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const displayName = value.trim().replace(/\s+/g, " ");
  const length = Array.from(displayName).length;
  const hasControlCharacter = Array.from(displayName).some((character) => {
    const code = character.codePointAt(0);
    return code !== undefined && (code < 32 || code === 127);
  });

  if (length < 1 || length > 20 || hasControlCharacter) {
    return null;
  }

  return displayName;
}

export function validActivity(value: unknown): value is VisitorActivity {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  if (value.type === "enter" || value.type === "time") {
    return true;
  }

  if (value.type === "section" && "sectionId" in value) {
    return (
      typeof value.sectionId === "string" && sectionIds.has(value.sectionId)
    );
  }

  return false;
}

export function hashSession(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

async function hydrateProfile(
  database: Queryable,
  visitor: VisitorRow,
): Promise<VisitorProfile> {
  const [visits, achievements] = await Promise.all([
    database.query<{ section_id: string }>(
      "SELECT section_id FROM visitor_section_visits WHERE visitor_id = $1 ORDER BY visited_at, section_id",
      [visitor.id],
    ),
    database.query<{ achievement_id: string }>(
      "SELECT achievement_id FROM visitor_achievements WHERE visitor_id = $1 ORDER BY unlocked_at, achievement_id",
      [visitor.id],
    ),
  ]);

  return {
    id: visitor.id,
    visitorNumber: visitor.visitor_number,
    displayName: visitor.display_name,
    visitedSectionIds: visits.rows.map((row) => row.section_id),
    unlockedAchievementIds: achievements.rows.map((row) => row.achievement_id),
  };
}

export async function createVisitor(
  sessionId: string,
  displayName: string,
): Promise<VisitorProfile> {
  const database = getDatabase();
  const sessionHash = hashSession(sessionId);

  // A repeated request with the same secret is idempotent, even if the first
  // response was lost. Names are intentionally not unique.
  const inserted = await database.query<VisitorRow>(
    `INSERT INTO visitors (session_hash, display_name)
     VALUES ($1, $2)
     ON CONFLICT (session_hash) DO NOTHING
     RETURNING id, visitor_number, display_name`,
    [sessionHash, displayName],
  );

  let visitor = inserted.rows[0];
  if (!visitor) {
    const existing = await database.query<VisitorRow>(
      "SELECT id, visitor_number, display_name FROM visitors WHERE session_hash = $1",
      [sessionHash],
    );
    visitor = existing.rows[0];
  }

  if (!visitor) {
    throw new Error("Visitor creation could not be completed.");
  }

  return hydrateProfile(database, visitor);
}

export async function getVisitor(
  sessionId: string,
): Promise<VisitorProfile | null> {
  const database = getDatabase();
  const result = await database.query<VisitorRow>(
    "SELECT id, visitor_number, display_name FROM visitors WHERE session_hash = $1",
    [hashSession(sessionId)],
  );
  const visitor = result.rows[0];

  return visitor ? hydrateProfile(database, visitor) : null;
}

export async function updateVisitorName(
  sessionId: string,
  displayName: string,
): Promise<VisitorProfile | null> {
  const database = getDatabase();
  const result = await database.query<VisitorRow>(
    `UPDATE visitors
     SET display_name = $1, updated_at = now()
     WHERE session_hash = $2
     RETURNING id, visitor_number, display_name`,
    [displayName, hashSession(sessionId)],
  );
  const visitor = result.rows[0];

  if (!visitor) return null;
  const profile = await hydrateProfile(database, visitor);
  await database.query("SELECT pg_notify('orbital_community', $1)", [
    JSON.stringify({
      type: "identity",
      visitorNumber: visitor.visitor_number,
      displayName: visitor.display_name,
    }),
  ]);
  return profile;
}

export async function recordVisitorActivity(
  sessionId: string,
  activity: VisitorActivity,
): Promise<{ profile: VisitorProfile; newAchievementIds: string[] } | null> {
  const client = await getDatabase().connect();
  const newAchievementIds: string[] = [];

  try {
    await client.query("BEGIN");

    // The row lock makes concurrent section visits and achievements consistent
    // for this visitor, while other visitors can continue independently.
    const result = await client.query<
      VisitorRow & { first_explored_at: Date | null }
    >(
      `SELECT id, visitor_number, display_name, first_explored_at
       FROM visitors WHERE session_hash = $1 FOR UPDATE`,
      [hashSession(sessionId)],
    );
    const visitor = result.rows[0];

    if (!visitor) {
      await client.query("ROLLBACK");
      return null;
    }

    async function grantAchievement(achievementId: string): Promise<void> {
      const unlocked = await client.query<{ achievement_id: string }>(
        `INSERT INTO visitor_achievements (visitor_id, achievement_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING achievement_id`,
        [visitor.id, achievementId],
      );

      if (unlocked.rowCount) {
        newAchievementIds.push(achievementId);
      }
    }

    if (activity.type === "enter" || activity.type === "section") {
      await client.query(
        `UPDATE visitors
         SET first_explored_at = COALESCE(first_explored_at, now())
         WHERE id = $1`,
        [visitor.id],
      );
      await grantAchievement("first_visit");
    }

    if (activity.type === "section") {
      await client.query(
        `INSERT INTO visitor_section_visits (visitor_id, section_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [visitor.id, activity.sectionId],
      );

      const visits = await client.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM visitor_section_visits WHERE visitor_id = $1",
        [visitor.id],
      );
      const count = Number(visits.rows[0].count);

      if (count >= 5) {
        await grantAchievement("explorer");
      }
      if (count >= 3) {
        await grantAchievement("trailblazer");
      }
      if (count >= sectionIds.size) {
        await grantAchievement("completionist");
      }
    }

    if (
      activity.type === "time" &&
      visitor.first_explored_at &&
      Date.now() - new Date(visitor.first_explored_at).getTime() >=
        5 * 60 * 1000
    ) {
      await grantAchievement("curious_mind");
    }

    const profile = await hydrateProfile(client, visitor);
    await client.query("COMMIT");
    return { profile, newAchievementIds };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
