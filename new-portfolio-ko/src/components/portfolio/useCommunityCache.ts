"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getFeedbackFeed,
  getLobbyMessages,
  getOnlineVisitors,
  getOwnFeedback,
  reviseFeedback,
  sendFeedback,
  sendLobbyMessage,
} from "@/lib/community-client";
import type { PublicFeedback } from "@/lib/feedback";
import type { LobbyMessage } from "@/lib/lobby";
import type { CommunityEvent } from "@/lib/realtime";

const CACHE_KEY = "orbital.community-cache.v1";

type CommunityState = {
  feedback: PublicFeedback[];
  lobby: LobbyMessage[];
  mine: PublicFeedback | null;
  feedbackReady: boolean;
  lobbyReady: boolean;
  feedbackError: string;
  lobbyError: string;
  online: number | null;
};

const emptyState: CommunityState = {
  feedback: [],
  lobby: [],
  mine: null,
  feedbackReady: false,
  lobbyReady: false,
  feedbackError: "",
  lobbyError: "",
  online: null,
};

function mergeMessages(
  existing: LobbyMessage[],
  updates: LobbyMessage[],
): LobbyMessage[] {
  const indexed = new Map(existing.map((message) => [message.id, message]));
  for (const message of updates) indexed.set(message.id, message);
  return Array.from(indexed.values())
    .sort((a, b) => {
      const left = BigInt(a.id);
      const right = BigInt(b.id);
      return left < right ? -1 : left > right ? 1 : 0;
    })
    .slice(-20);
}

function mergeFeedback(
  existing: PublicFeedback[],
  updates: PublicFeedback[],
): PublicFeedback[] {
  const indexed = new Map(existing.map((post) => [post.id, post]));
  for (const post of updates) {
    const old = indexed.get(post.id);
    if (!old || Date.parse(post.updatedAt) >= Date.parse(old.updatedAt)) {
      indexed.set(post.id, post);
    }
  }
  return Array.from(indexed.values())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 100);
}

function readCache(ownerId: string): CommunityState {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return { ...emptyState };
    const saved: unknown = JSON.parse(raw);
    if (
      !saved ||
      typeof saved !== "object" ||
      !("ownerId" in saved) ||
      saved.ownerId !== ownerId
    ) {
      return { ...emptyState };
    }

    const snapshot = saved as {
      lobby?: LobbyMessage[];
      feedback?: PublicFeedback[];
      mine?: PublicFeedback | null;
      lobbyReady?: boolean;
      feedbackReady?: boolean;
    };

    return {
      ...emptyState,
      lobby: Array.isArray(snapshot.lobby) ? snapshot.lobby : [],
      feedback: Array.isArray(snapshot.feedback) ? snapshot.feedback : [],
      mine: snapshot.mine ?? null,
      lobbyReady: snapshot.lobbyReady === true,
      feedbackReady: snapshot.feedbackReady === true,
    };
  } catch {
    return { ...emptyState };
  }
}

export function useCommunityCache(
  sessionId: string | null,
  ownerId: string | null,
  onAchievementsEarned: (ids: string[]) => void,
) {
  const [state, setState] = useState<CommunityState>(emptyState);
  const stateRef = useRef(state);
  const ownerRef = useRef<string | null>(null);

  const change = useCallback(
    (edit: (previous: CommunityState) => CommunityState) => {
      const next = edit(stateRef.current);
      stateRef.current = next;
      setState(next);

      if (ownerRef.current) {
        try {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              ownerId: ownerRef.current,
              lobby: next.lobby,
              feedback: next.feedback,
              mine: next.mine,
              lobbyReady: next.lobbyReady,
              feedbackReady: next.feedbackReady,
            }),
          );
        } catch {
          // Storage may be unavailable or full. In-memory caching still works.
        }
      }
    },
    [],
  );

  const refreshLobby = useCallback(async () => {
    const lastId = stateRef.current.lobby.at(-1)?.id;
    try {
      const result = await getLobbyMessages(lastId);
      change((previous) => ({
        ...previous,
        lobby: mergeMessages(previous.lobby, result.messages),
        lobbyReady: true,
        lobbyError: "",
      }));
    } catch (cause) {
      change((previous) => ({
        ...previous,
        lobbyError:
          cause instanceof Error ? cause.message : "Could not load the lobby.",
      }));
    }
  }, [change]);

  const refreshFeedback = useCallback(
    async (token: string) => {
      try {
        const [feed, mine] = await Promise.all([
          getFeedbackFeed(),
          getOwnFeedback(token),
        ]);
        change((previous) => ({
          ...previous,
          feedback: mergeFeedback(previous.feedback, feed.feedback),
          mine: mine.feedback,
          feedbackReady: true,
          feedbackError: "",
        }));
      } catch (cause) {
        change((previous) => ({
          ...previous,
          feedbackError:
            cause instanceof Error ? cause.message : "Could not load feedback.",
        }));
      }
    },
    [change],
  );

  const refreshOnline = useCallback(async () => {
    try {
      const response = await getOnlineVisitors();
      change((previous) => ({ ...previous, online: response.online }));
    } catch {
      change((previous) => ({ ...previous, online: null }));
    }
  }, [change]);

  const renameAuthor = useCallback(
    (visitorNumber: string, displayName: string) => {
      change((previous) => ({
        ...previous,
        lobby: previous.lobby.map((message) =>
          message.authorNumber === visitorNumber
            ? { ...message, authorName: displayName }
            : message,
        ),
        feedback: previous.feedback.map((post) =>
          post.authorNumber === visitorNumber
            ? { ...post, authorName: displayName }
            : post,
        ),
        mine:
          previous.mine?.authorNumber === visitorNumber
            ? { ...previous.mine, authorName: displayName }
            : previous.mine,
      }));
    },
    [change],
  );

  useEffect(() => {
    if (!sessionId || !ownerId) return;
    const token = sessionId;
    let active = true;

    const restored = readCache(ownerId);
    ownerRef.current = ownerId;
    stateRef.current = restored;
    setState(restored);

    void refreshLobby();
    void refreshFeedback(token);
    void refreshOnline();

    const source = new EventSource("/api/events");
    let openedBefore = false;

    function synchronize() {
      if (!active) return;
      void refreshLobby();
      void refreshFeedback(token);
      void refreshOnline();
    }

    source.addEventListener("open", () => {
      if (openedBefore) synchronize();
      openedBefore = true;
    });

    function onCommunityEvent(event: Event) {
      if (!active || !(event instanceof MessageEvent)) return;
      let parsed: CommunityEvent;

      try {
        parsed = JSON.parse(event.data) as CommunityEvent;
      } catch {
        return;
      }

      if (parsed.type === "lobby" && parsed.message?.id) {
        change((previous) => ({
          ...previous,
          lobby: mergeMessages(previous.lobby, [parsed.message]),
          lobbyReady: true,
        }));
      } else if (parsed.type === "feedback" && parsed.feedback?.id) {
        change((previous) => ({
          ...previous,
          feedback: mergeFeedback(previous.feedback, [parsed.feedback]),
          mine:
            parsed.feedback.id === ownerId ? parsed.feedback : previous.mine,
          feedbackReady: true,
        }));
      } else if (
        parsed.type === "identity" &&
        parsed.visitorNumber &&
        typeof parsed.displayName === "string"
      ) {
        renameAuthor(parsed.visitorNumber, parsed.displayName);
      } else if (parsed.type === "presence") {
        void refreshOnline();
      } else if (parsed.type === "sync") {
        synchronize();
      }
    }

    for (const type of ["lobby", "feedback", "identity", "presence", "sync"]) {
      source.addEventListener(type, onCommunityEvent);
    }

    const lobbyReconcile = window.setInterval(() => {
      if (!document.hidden) void refreshLobby();
    }, 60000);
    const feedbackReconcile = window.setInterval(() => {
      if (!document.hidden) void refreshFeedback(token);
    }, 120000);
    const onVisible = () => {
      if (!document.hidden) synchronize();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      source.close();
      for (const type of [
        "lobby",
        "feedback",
        "identity",
        "presence",
        "sync",
      ]) {
        source.removeEventListener(type, onCommunityEvent);
      }
      window.clearInterval(lobbyReconcile);
      window.clearInterval(feedbackReconcile);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [
    sessionId,
    ownerId,
    change,
    refreshFeedback,
    refreshLobby,
    refreshOnline,
    renameAuthor,
  ]);

  const postFeedback = useCallback(
    async (body: string) => {
      if (!sessionId) throw new Error("Visitor session unavailable.");
      const response = await sendFeedback(sessionId, body);
      change((previous) => ({
        ...previous,
        feedback: mergeFeedback(previous.feedback, [response.feedback]),
        mine: response.feedback,
        feedbackReady: true,
      }));
      onAchievementsEarned(response.newAchievementIds);
      return response.feedback;
    },
    [sessionId, change, onAchievementsEarned],
  );

  const editFeedback = useCallback(
    async (body: string) => {
      if (!sessionId) throw new Error("Visitor session unavailable.");
      const response = await reviseFeedback(sessionId, body);
      change((previous) => ({
        ...previous,
        feedback: mergeFeedback(previous.feedback, [response.feedback]),
        mine: response.feedback,
        feedbackReady: true,
      }));
      return response.feedback;
    },
    [sessionId, change],
  );

  const postMessage = useCallback(
    async (body: string) => {
      if (!sessionId) throw new Error("Visitor session unavailable.");
      const response = await sendLobbyMessage(sessionId, body);
      change((previous) => ({
        ...previous,
        lobby: mergeMessages(previous.lobby, [response.message]),
        lobbyReady: true,
      }));
      onAchievementsEarned(response.newAchievementIds);
    },
    [sessionId, change, onAchievementsEarned],
  );

  return {
    ...state,
    postFeedback,
    editFeedback,
    postMessage,
    refreshOnline,
    renameAuthor,
  };
}

export type CommunityCache = ReturnType<typeof useCommunityCache>;
