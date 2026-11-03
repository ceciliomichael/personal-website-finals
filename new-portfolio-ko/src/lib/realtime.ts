import { Client } from "pg";
import type { PublicFeedback } from "./feedback";
import type { LobbyMessage } from "./lobby";

export type CommunityEvent =
  | { type: "feedback"; feedback: PublicFeedback }
  | { type: "lobby"; message: LobbyMessage }
  | { type: "presence" }
  | { type: "identity"; visitorNumber: string; displayName: string }
  | { type: "sync" };

const subscribers = new Set<(event: CommunityEvent) => void>();

let listener: Client | null = null;
let connecting: Promise<void> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function broadcast(event: CommunityEvent): void {
  for (const subscriber of subscribers) {
    subscriber(event);
  }
}

function queueReconnect(): void {
  if (reconnectTimer || subscribers.size === 0) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void ensureRealtimeListener().catch(queueReconnect);
  }, 2500);
}

async function connect(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const connection = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  function disconnect(): void {
    if (listener !== connection) return;

    listener = null;
    queueReconnect();
  }

  connection.on("notification", (notification) => {
    if (notification.channel !== "orbital_community") return;
    try {
      const event: unknown = JSON.parse(notification.payload ?? "null");
      if (event && typeof event === "object" && "type" in event) {
        const type = event.type;
        if (
          type === "feedback" ||
          type === "lobby" ||
          type === "presence" ||
          type === "identity"
        ) {
          broadcast(event as CommunityEvent);
        }
      }
    } catch {
      // Ignore malformed database notifications.
    }
  });
  connection.on("error", disconnect);
  connection.on("end", disconnect);

  try {
    await connection.connect();
    await connection.query("LISTEN orbital_community");
    listener = connection;
    // A reconnect may have missed notifications. Prompt subscribers to
    // refresh their public feeds after reconnecting.
    broadcast({ type: "sync" });
  } catch (error) {
    await connection.end().catch(() => {});
    throw error;
  }
}

export async function ensureRealtimeListener(): Promise<void> {
  if (listener) return;
  if (!connecting) {
    connecting = connect().finally(() => {
      connecting = null;
    });
  }

  await connecting;
}

export function subscribeRealtime(
  callback: (event: CommunityEvent) => void,
): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}
