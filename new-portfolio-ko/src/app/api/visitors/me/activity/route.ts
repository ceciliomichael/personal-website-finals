import {
  readSessionId,
  recordVisitorActivity,
  validActivity,
} from "@/lib/visitors";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const sessionId = readSessionId(request);
  if (!sessionId) {
    return Response.json(
      { error: "Visitor session required." },
      { status: 401 },
    );
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!validActivity(input)) {
    return Response.json(
      { error: "Invalid visitor activity." },
      { status: 400 },
    );
  }

  try {
    const result = await recordVisitorActivity(sessionId, input);
    if (!result) {
      return Response.json(
        { error: "Visitor profile not found." },
        { status: 401 },
      );
    }

    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Your progress could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
