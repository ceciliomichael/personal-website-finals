import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import { Pool } from "pg";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function hashSession(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function api(path, { token, method = "GET", body } = {}) {
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

async function openEventStream() {
  const abortController = new AbortController();
  const response = await fetch(new URL("/api/events", baseUrl), {
    signal: abortController.signal,
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/event-stream/);

  const received = new Set();
  const pending = new Map();
  const reader = response.body.getReader();

  const backgroundRead = (async () => {
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let end = buffer.indexOf("\n\n");
        while (end >= 0) {
          const block = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);

          for (const channel of ["feedback", "lobby"]) {
            if (!block.includes(`event: ${channel}`)) continue;
            received.add(channel);

            for (const complete of pending.get(channel) ?? []) {
              complete();
            }
            pending.delete(channel);
          }
          end = buffer.indexOf("\n\n");
        }
      }
    } catch {
      // Abort closes the stream after the test finishes.
    }
  })();

  return {
    async waitFor(channel) {
      if (received.has(channel)) return;
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error(`No realtime event received for ${channel}.`)),
          10000,
        );

        const complete = () => {
          clearTimeout(timeout);
          resolve();
        };
        pending.set(channel, [...(pending.get(channel) ?? []), complete]);
      });
    },
    async close() {
      abortController.abort();
      await backgroundRead;
    },
  };
}

test("public feedback limits, live events, and 20-message lobby retention", async (t) => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must be configured.");
  const appHost = new URL(baseUrl).hostname;
  const databaseHost = new URL(process.env.DATABASE_URL).hostname;
  assert.ok(
    ["127.0.0.1", "localhost"].includes(appHost) &&
      ["127.0.0.1", "localhost"].includes(databaseHost),
    "Community integration tests may only run against a local development server and database.",
  );

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sessions = [randomUUID(), randomUUID()];
  let eventStream;

  t.after(async () => {
    if (eventStream) await eventStream.close();
    try {
      await pool.query(
        "DELETE FROM visitors WHERE session_hash = ANY($1::char(64)[])",
        [sessions.map(hashSession)],
      );
    } finally {
      await pool.end();
    }
  });

  const baseline = await pool.query(
    "SELECT COUNT(*)::integer AS count FROM lobby_messages",
  );
  assert.equal(
    baseline.rows[0].count,
    0,
    "Lobby retention tests require an empty local lobby to avoid pruning actual visitor messages.",
  );

  const visitorNumbers = [];
  for (const [index, name] of [
    "SignalTester",
    "SecondSignalTester",
  ].entries()) {
    const result = await api("/api/visitors", {
      method: "POST",
      body: { sessionId: sessions[index], name },
    });
    assert.equal(result.status, 201);
    visitorNumbers.push(result.data.visitorNumber);
  }

  eventStream = await openEventStream();

  const [firstAttempt, duplicateAttempt] = await Promise.all([
    api("/api/feedback", {
      method: "POST",
      token: sessions[0],
      body: { body: "Feedback from tab A" },
    }),
    api("/api/feedback", {
      method: "POST",
      token: sessions[0],
      body: { body: "Feedback from tab B" },
    }),
  ]);

  assert.deepEqual(
    [firstAttempt.status, duplicateAttempt.status].sort(),
    [201, 409],
    "The database must allow only one feedback row per visitor.",
  );

  await eventStream.waitFor("feedback");

  let mine = await api("/api/feedback/me", { token: sessions[0] });
  assert.equal(mine.status, 200);
  assert.equal(mine.data.feedback.authorName, "SignalTester");
  assert.equal(mine.data.feedback.authorNumber, visitorNumbers[0]);
  assert.equal(mine.data.feedback.editCount, 0);
  assert.ok(
    ["Feedback from tab A", "Feedback from tab B"].includes(
      mine.data.feedback.body,
    ),
  );

  const otherUser = await api("/api/feedback/me", {
    method: "PATCH",
    token: sessions[1],
    body: { body: "Attempt to edit someone else's post" },
  });
  assert.equal(otherUser.status, 404);

  const publicFeed = await api("/api/feedback");
  assert.equal(publicFeed.status, 200);
  assert.ok(
    publicFeed.data.feedback.some((item) => item.authorName === "SignalTester"),
  );
  assert.ok(
    publicFeed.data.feedback.some(
      (item) =>
        item.authorName === "SignalTester" &&
        item.authorNumber === visitorNumbers[0],
    ),
  );

  for (let index = 1; index <= 2; index += 1) {
    const update = await api("/api/feedback/me", {
      method: "PATCH",
      token: sessions[0],
      body: { body: `Edited feedback revision ${index}` },
    });
    assert.equal(update.status, 200);
    assert.equal(update.data.feedback.editCount, index);
  }

  const [thirdA, thirdB] = await Promise.all([
    api("/api/feedback/me", {
      method: "PATCH",
      token: sessions[0],
      body: { body: "Final edit A" },
    }),
    api("/api/feedback/me", {
      method: "PATCH",
      token: sessions[0],
      body: { body: "Final edit B" },
    }),
  ]);
  assert.deepEqual([thirdA.status, thirdB.status].sort(), [200, 409]);

  const fourth = await api("/api/feedback/me", {
    method: "PATCH",
    token: sessions[0],
    body: { body: "Fourth edit should be rejected" },
  });
  assert.equal(fourth.status, 409);

  mine = await api("/api/feedback/me", { token: sessions[0] });
  assert.equal(mine.data.feedback.editCount, 3);

  const identity = await api("/api/visitors/me", { token: sessions[0] });
  assert.ok(identity.data.unlockedAchievementIds.includes("feedback_giver"));
  assert.equal(
    (await api("/api/feedback", { token: sessions[1] })).status,
    200,
  );

  const oversized = await api("/api/lobby", {
    method: "POST",
    token: sessions[0],
    body: { body: "x".repeat(501) },
  });
  assert.equal(oversized.status, 400);
  assert.equal(
    (await api("/api/lobby", { method: "POST", body: { body: "anonymous" } }))
      .status,
    401,
  );

  for (let index = 0; index < 21; index += 1) {
    const token = sessions[index % 2];
    const result = await api("/api/lobby", {
      method: "POST",
      token,
      body: {
        body: `Community test message ${String(index).padStart(2, "0")}`,
      },
    });
    assert.equal(result.status, 201, JSON.stringify(result));
    assert.equal(result.data.message.authorNumber, visitorNumbers[index % 2]);
    if (index === 0 || index === 1) {
      assert.ok(result.data.newAchievementIds.includes("first_message"));
    }
    if (index === 0) {
      await eventStream.waitFor("lobby");
    }
    if (index % 2 === 1) {
      await pause(1100);
    }
  }

  const feed = await api("/api/lobby");
  assert.equal(feed.status, 200);
  assert.equal(feed.data.messages.length, 20);
  assert.equal(feed.data.messages[0].body, "Community test message 01");
  assert.equal(feed.data.messages[19].body, "Community test message 20");
  assert.equal(feed.data.messages[0].authorNumber, visitorNumbers[1]);
  assert.equal(feed.data.messages[19].authorNumber, visitorNumbers[0]);
  assert.equal(
    (await pool.query("SELECT COUNT(*)::integer AS count FROM lobby_messages"))
      .rows[0].count,
    20,
  );

  const saved = await api("/api/visitors/me", { token: sessions[0] });
  assert.ok(saved.data.unlockedAchievementIds.includes("first_message"));

  const cooldown = await api("/api/lobby", {
    method: "POST",
    token: sessions[0],
    body: { body: "Message too soon" },
  });
  assert.equal(cooldown.status, 429);

  console.log(
    "Community API: feedback one-post/three-edit rules, SSE, lobby retention and achievements passed.",
  );
});
