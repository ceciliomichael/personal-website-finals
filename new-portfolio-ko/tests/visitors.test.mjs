import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import { Pool } from "pg";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const sections = [
  "about",
  "ai-expertise",
  "technical-skills",
  "development",
  "projects",
  "hobbies",
  "goals",
  "gallery",
  "feedback",
  "lobby",
];

function hashed(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return { status: response.status, data: await response.json() };
}

test("visitors have private sessions, unique global numbers and saved achievements", async (t) => {
  assert.ok(
    process.env.DATABASE_URL,
    "Set DATABASE_URL to run integration tests.",
  );

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tokens = [randomUUID(), randomUUID(), randomUUID()];

  t.after(async () => {
    try {
      await pool.query(
        "DELETE FROM visitors WHERE session_hash = ANY($1::char(64)[])",
        [tokens.map(hashed)],
      );
    } finally {
      await pool.end();
    }
  });

  const created = [];
  for (const [index, name] of ["Michael", "Michael", "Bob"].entries()) {
    const result = await request("/api/visitors", {
      method: "POST",
      body: { sessionId: tokens[index], name },
    });

    assert.equal(result.status, 201);
    assert.equal(result.data.displayName, name);
    assert.match(result.data.id, /^[0-9a-f-]{36}$/);
    assert.match(result.data.visitorNumber, /^[1-9][0-9]*$/);
    assert.equal("sessionId" in result.data, false);
    created.push(result.data);
  }

  assert.equal(new Set(created.map((profile) => profile.id)).size, 3);

  const rows = await pool.query(
    `SELECT id, visitor_number, display_name, session_hash
     FROM visitors WHERE session_hash = ANY($1::char(64)[])
     ORDER BY visitor_number`,
    [tokens.map(hashed)],
  );
  assert.equal(rows.rowCount, 3);
  assert.ok(
    BigInt(rows.rows[0].visitor_number) < BigInt(rows.rows[1].visitor_number),
  );
  assert.ok(
    BigInt(rows.rows[1].visitor_number) < BigInt(rows.rows[2].visitor_number),
  );
  assert.deepEqual(
    rows.rows.map((row) => row.display_name),
    ["Michael", "Michael", "Bob"],
  );
  assert.equal(rows.rows[0].session_hash.trim(), hashed(tokens[0]));
  assert.notEqual(rows.rows[0].session_hash.trim(), tokens[0]);

  const again = await request("/api/visitors", {
    method: "POST",
    body: { sessionId: tokens[0], name: "Different name" },
  });
  assert.equal(again.status, 201);
  assert.equal(again.data.id, created[0].id);
  assert.equal(again.data.displayName, "Michael");

  const invalidSession = await request("/api/visitors/me", {
    token: randomUUID(),
  });
  assert.equal(invalidSession.status, 401);

  const missingSession = await request("/api/visitors/me");
  assert.equal(missingSession.status, 401);

  const renamed = await request("/api/visitors/me", {
    method: "PATCH",
    token: tokens[0],
    body: { name: "Michael Updated" },
  });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.data.id, created[0].id);
  assert.equal(renamed.data.displayName, "Michael Updated");

  const enter = await request("/api/visitors/me/activity", {
    method: "POST",
    token: tokens[0],
    body: { type: "enter" },
  });
  assert.equal(enter.status, 200);
  assert.ok(enter.data.newAchievementIds.includes("first_visit"));

  const invalidSection = await request("/api/visitors/me/activity", {
    method: "POST",
    token: tokens[0],
    body: { type: "section", sectionId: "not-a-real-node" },
  });
  assert.equal(invalidSection.status, 400);

  for (const sectionId of sections.slice(0, 5)) {
    const response = await request("/api/visitors/me/activity", {
      method: "POST",
      token: tokens[0],
      body: { type: "section", sectionId },
    });
    assert.equal(response.status, 200);
  }

  let restored = await request("/api/visitors/me", { token: tokens[0] });
  assert.equal(restored.status, 200);
  assert.equal(restored.data.displayName, "Michael Updated");
  assert.equal(restored.data.visitedSectionIds.length, 5);
  assert.ok(restored.data.unlockedAchievementIds.includes("explorer"));
  assert.ok(restored.data.unlockedAchievementIds.includes("trailblazer"));

  for (const sectionId of sections.slice(5)) {
    const response = await request("/api/visitors/me/activity", {
      method: "POST",
      token: tokens[0],
      body: { type: "section", sectionId },
    });
    assert.equal(response.status, 200);
  }

  restored = await request("/api/visitors/me", { token: tokens[0] });
  assert.equal(restored.data.visitedSectionIds.length, sections.length);
  assert.ok(restored.data.unlockedAchievementIds.includes("completionist"));

  const tooSoon = await request("/api/visitors/me/activity", {
    method: "POST",
    token: tokens[0],
    body: { type: "time" },
  });
  assert.equal(tooSoon.status, 200);
  assert.equal(tooSoon.data.newAchievementIds.includes("curious_mind"), false);

  // Move only this disposable test visitor's start time to verify the timeout
  // rule without making the integration test take five minutes.
  await pool.query(
    "UPDATE visitors SET first_explored_at = now() - interval '6 minutes' WHERE id = $1",
    [created[0].id],
  );
  const timed = await request("/api/visitors/me/activity", {
    method: "POST",
    token: tokens[0],
    body: { type: "time" },
  });
  assert.equal(timed.status, 200);
  assert.ok(timed.data.newAchievementIds.includes("curious_mind"));

  const once = await request("/api/visitors/me/activity", {
    method: "POST",
    token: tokens[0],
    body: { type: "time" },
  });
  assert.equal(once.status, 200);
  assert.deepEqual(once.data.newAchievementIds, []);
});
