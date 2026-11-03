import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import { Pool } from "pg";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";

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

test("online count tracks distinct active visitors and expires stale sessions", async (t) => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must be configured.");
  assert.ok(
    ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname) &&
      ["localhost", "127.0.0.1"].includes(
        new URL(process.env.DATABASE_URL).hostname,
      ),
    "Presence tests must run against local development services.",
  );

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tokens = [randomUUID(), randomUUID()];
  const controller = new AbortController();

  t.after(async () => {
    controller.abort();
    try {
      await pool.query(
        "DELETE FROM visitors WHERE session_hash = ANY($1::char(64)[])",
        [
          tokens.map((token) =>
            createHash("sha256").update(token).digest("hex"),
          ),
        ],
      );
    } finally {
      await pool.end();
    }
  });

  const baseline = await request("/api/presence");
  assert.equal(baseline.status, 200);
  assert.equal(typeof baseline.data.online, "number");
  const startingCount = baseline.data.online;

  const unauthorized = await request("/api/presence", { method: "POST" });
  assert.equal(unauthorized.status, 401);

  for (const name of ["OnlineAlpha", "OnlineBeta"]) {
    const index = name === "OnlineAlpha" ? 0 : 1;
    const response = await request("/api/visitors", {
      method: "POST",
      body: { name, sessionId: tokens[index] },
    });
    assert.equal(response.status, 201);
  }

  const streamResponse = await fetch(new URL("/api/events", baseUrl), {
    signal: controller.signal,
  });
  assert.equal(streamResponse.status, 200);
  const reader = streamResponse.body.getReader();

  const presenceUpdate = (async () => {
    const decoder = new TextDecoder();
    let received = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) throw new Error("The SSE stream ended unexpectedly.");
      received += decoder.decode(value, { stream: true });
      if (received.includes("event: presence")) return;
    }
  })();

  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const first = await request("/api/presence", {
      method: "POST",
      token: tokens[0],
    });
    assert.equal(first.status, 200);
    assert.equal(first.data.online, startingCount + 1);

    await presenceUpdate;

    const repeated = await request("/api/presence", {
      method: "POST",
      token: tokens[0],
    });
    assert.equal(repeated.status, 200);
    assert.equal(repeated.data.online, startingCount + 1);

    const second = await request("/api/presence", {
      method: "POST",
      token: tokens[1],
    });
    assert.equal(second.status, 200);
    assert.equal(second.data.online, startingCount + 2);

    const visitor = await pool.query(
      "SELECT id FROM visitors WHERE session_hash = $1",
      [createHash("sha256").update(tokens[1]).digest("hex")],
    );

    await pool.query(
      "UPDATE visitor_presence SET last_seen = now() - interval '70 seconds' WHERE visitor_id = $1",
      [visitor.rows[0].id],
    );

    const expired = await request("/api/presence");
    assert.equal(expired.status, 200);
    assert.equal(expired.data.online, startingCount + 1);

    const restored = await request("/api/presence", {
      method: "POST",
      token: tokens[1],
    });
    assert.equal(restored.status, 200);
    assert.equal(restored.data.online, startingCount + 2);
  } finally {
    clearTimeout(timeout);
    controller.abort();
    await reader.cancel().catch(() => {});
  }
});
