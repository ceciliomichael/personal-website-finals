import type { VisitorActivity, VisitorProfile } from "./visitors";

export const VISITOR_SESSION_STORAGE_KEY = "orbital.visitor-session.v1";

export class VisitorApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "VisitorApiError";
  }
}

async function requestProfile<T>(
  url: string,
  options: { sessionId?: string; method?: string; body?: unknown } = {},
): Promise<T> {
  const headers = new Headers();

  if (options.sessionId) {
    headers.set("Authorization", `Bearer ${options.sessionId}`);
  }
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

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
        : "The request failed. Please try again.";

    throw new VisitorApiError(message, response.status);
  }

  return data as T;
}

export function registerVisitor(
  sessionId: string,
  name: string,
): Promise<VisitorProfile> {
  return requestProfile("/api/visitors", {
    method: "POST",
    body: { sessionId, name },
  });
}

export function restoreVisitor(sessionId: string): Promise<VisitorProfile> {
  return requestProfile("/api/visitors/me", { sessionId });
}

export function renameVisitor(
  sessionId: string,
  name: string,
): Promise<VisitorProfile> {
  return requestProfile("/api/visitors/me", {
    method: "PATCH",
    sessionId,
    body: { name },
  });
}

export function trackVisitorActivity(
  sessionId: string,
  activity: VisitorActivity,
): Promise<{ profile: VisitorProfile; newAchievementIds: string[] }> {
  return requestProfile("/api/visitors/me/activity", {
    method: "POST",
    sessionId,
    body: activity,
  });
}
