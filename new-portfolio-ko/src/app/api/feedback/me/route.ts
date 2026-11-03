import { CommunityError } from "@/lib/community";
import { editFeedback, getMyFeedback } from "@/lib/feedback";
import { readSessionId } from "@/lib/visitors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  const sessionId = readSessionId(request);
  if (!sessionId) {
    return Response.json(
      { error: "Visitor session required." },
      { status: 401, headers },
    );
  }

  try {
    const feedback = await getMyFeedback(sessionId);
    return Response.json({ feedback }, { headers });
  } catch (error) {
    if (error instanceof CommunityError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    }
    return Response.json(
      { error: "Could not load your feedback." },
      { status: 503, headers },
    );
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const sessionId = readSessionId(request);
  if (!sessionId) {
    return Response.json(
      { error: "Visitor session required." },
      { status: 401, headers },
    );
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400, headers },
    );
  }

  try {
    const body =
      typeof input === "object" && input !== null && "body" in input
        ? input.body
        : undefined;
    const feedback = await editFeedback(sessionId, body);
    return Response.json({ feedback }, { headers });
  } catch (error) {
    if (error instanceof CommunityError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    }
    return Response.json(
      { error: "Could not edit feedback. Please try again." },
      { status: 503, headers },
    );
  }
}
