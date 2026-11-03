import {
  getVisitor,
  normalizeDisplayName,
  readSessionId,
  updateVisitorName,
} from "@/lib/visitors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  const sessionId = readSessionId(request);
  if (!sessionId) {
    return Response.json(
      { error: "Visitor session required." },
      { status: 401, headers: noStore },
    );
  }

  try {
    const profile = await getVisitor(sessionId);
    if (!profile) {
      return Response.json(
        { error: "Visitor profile not found." },
        { status: 401, headers: noStore },
      );
    }
    return Response.json(profile, { headers: noStore });
  } catch {
    return Response.json(
      { error: "Could not load your profile. Please try again." },
      { status: 503, headers: noStore },
    );
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const sessionId = readSessionId(request);
  if (!sessionId) {
    return Response.json(
      { error: "Visitor session required." },
      { status: 401, headers: noStore },
    );
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400, headers: noStore },
    );
  }

  if (typeof input !== "object" || input === null) {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400, headers: noStore },
    );
  }

  const displayName = normalizeDisplayName(
    (input as Record<string, unknown>).name,
  );
  if (!displayName) {
    return Response.json(
      { error: "Your name must contain 1–20 characters." },
      { status: 400, headers: noStore },
    );
  }

  try {
    const profile = await updateVisitorName(sessionId, displayName);
    if (!profile) {
      return Response.json(
        { error: "Visitor profile not found." },
        { status: 401, headers: noStore },
      );
    }
    return Response.json(profile, { headers: noStore });
  } catch {
    return Response.json(
      { error: "Could not update your profile. Please try again." },
      { status: 503, headers: noStore },
    );
  }
}
