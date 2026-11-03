import { CommunityError } from "@/lib/community";
import { countOnlineVisitors, markVisitorOnline } from "@/lib/presence";
import { readSessionId } from "@/lib/visitors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(): Promise<Response> {
  try {
    const online = await countOnlineVisitors();
    return Response.json({ online }, { headers });
  } catch {
    return Response.json(
      { error: "Online visitor count is currently unavailable." },
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

  try {
    const online = await markVisitorOnline(sessionId);
    return Response.json({ online }, { headers });
  } catch (error) {
    if (error instanceof CommunityError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    }
    return Response.json(
      { error: "Could not update your online status." },
      { status: 503, headers },
    );
  }
}
