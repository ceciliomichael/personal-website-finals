import { CommunityError } from "@/lib/community";
import { listLobbyMessages, postLobbyMessage } from "@/lib/lobby";
import { readSessionId } from "@/lib/visitors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  const after = new URL(request.url).searchParams.get("after");
  if (
    after !== null &&
    (!/^[0-9]{1,19}$/.test(after) ||
      BigInt(after) > BigInt("9223372036854775807"))
  ) {
    return Response.json(
      { error: "Invalid message cursor." },
      { status: 400, headers },
    );
  }
  try {
    const messages = await listLobbyMessages(after ?? undefined);
    return Response.json({ messages }, { headers });
  } catch {
    return Response.json(
      { error: "Lobby messages are currently unavailable." },
      { status: 503, headers },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
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
    const result = await postLobbyMessage(sessionId, body);
    return Response.json(result, { status: 201, headers });
  } catch (error) {
    if (error instanceof CommunityError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    }
    return Response.json(
      { error: "Could not send message. Please try again." },
      { status: 503, headers },
    );
  }
}
