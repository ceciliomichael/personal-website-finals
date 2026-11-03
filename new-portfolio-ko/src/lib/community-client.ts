import type { PublicFeedback } from "./feedback";
import type { LobbyMessage } from "./lobby";

export class CommunityApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CommunityApiError";
  }
}

async function requestCommunity<T>(
  url: string,
  options: { token?: string; method?: string; body?: unknown } = {},
): Promise<T> {
  const headers = new Headers();
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Request failed. Please try again.";

    throw new CommunityApiError(message, response.status);
  }

  return data as T;
}

export function getFeedbackFeed(): Promise<{ feedback: PublicFeedback[] }> {
  return requestCommunity("/api/feedback");
}

export function getOwnFeedback(
  token: string,
): Promise<{ feedback: PublicFeedback | null }> {
  return requestCommunity("/api/feedback/me", { token });
}

export function sendFeedback(
  token: string,
  body: string,
): Promise<{ feedback: PublicFeedback; newAchievementIds: string[] }> {
  return requestCommunity("/api/feedback", {
    token,
    method: "POST",
    body: { body },
  });
}

export function reviseFeedback(
  token: string,
  body: string,
): Promise<{ feedback: PublicFeedback }> {
  return requestCommunity("/api/feedback/me", {
    token,
    method: "PATCH",
    body: { body },
  });
}

export function getLobbyMessages(
  afterId?: string,
): Promise<{ messages: LobbyMessage[] }> {
  return requestCommunity(
    afterId ? `/api/lobby?after=${encodeURIComponent(afterId)}` : "/api/lobby",
  );
}

export function sendLobbyMessage(
  token: string,
  body: string,
): Promise<{ message: LobbyMessage; newAchievementIds: string[] }> {
  return requestCommunity("/api/lobby", {
    token,
    method: "POST",
    body: { body },
  });
}

export function getOnlineVisitors(): Promise<{ online: number }> {
  return requestCommunity("/api/presence");
}

export function markOnline(token: string): Promise<{ online: number }> {
  return requestCommunity("/api/presence", {
    token,
    method: "POST",
  });
}
