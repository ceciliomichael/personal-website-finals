import {
  type CommunityEvent,
  ensureRealtimeListener,
  subscribeRealtime,
} from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    await ensureRealtimeListener();
  } catch {
    return Response.json(
      { error: "Live updates are currently unavailable." },
      { status: 503 },
    );
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      function write(message: string): void {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(message));
        } catch {
          cleanup();
        }
      }

      const unsubscribe = subscribeRealtime((event: CommunityEvent) => {
        write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      });

      const keepAlive = setInterval(() => {
        write(": heartbeat\n\n");
      }, 20000);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        unsubscribe();
        request.signal.removeEventListener("abort", cleanup);
        try {
          controller.close();
        } catch {
          // Connection may already have been closed.
        }
      };

      request.signal.addEventListener("abort", cleanup, { once: true });
      write("retry: 2000\n: connected\n\n");
      if (request.signal.aborted) cleanup();
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
