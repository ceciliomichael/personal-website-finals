import {
  createVisitor,
  normalizeDisplayName,
  validSessionId,
} from "@/lib/visitors";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof input !== "object" || input === null) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const body = input as Record<string, unknown>;
  const displayName = normalizeDisplayName(body.name);

  if (!displayName || !validSessionId(body.sessionId)) {
    return Response.json(
      {
        error:
          "A name (1–20 characters) and valid visitor session are required.",
      },
      { status: 400 },
    );
  }

  try {
    const profile = await createVisitor(body.sessionId, displayName);
    return Response.json(profile, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Could not save your visitor profile. Please try again." },
      { status: 503 },
    );
  }
}
