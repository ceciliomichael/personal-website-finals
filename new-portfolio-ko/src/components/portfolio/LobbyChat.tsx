"use client";

import { ArrowUpRight, MessageCircle, Radio, Send } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { CommunityCache } from "./useCommunityCache";

type LobbyProps = {
  community: CommunityCache;
  displayName: string;
  visitorNumber: string;
};

function messageTime(date: string): string {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LobbyChat({
  community,
  displayName,
  visitorNumber,
}: LobbyProps) {
  const messages = community.lobby;
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const loading = !community.lobbyReady;
  const online = community.online;
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    const interval = window.setInterval(() => {
      void community.refreshOnline();
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [community.refreshOnline]);

  useEffect(() => {
    if (!lastMessageId) return;
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [lastMessageId]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || sending) return;

    setSending(true);
    setError("");

    try {
      await community.postMessage(draft.trim());
      setDraft("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not send your message.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex items-center gap-3">
          <Radio size={20} className="archive-text-accent" aria-hidden="true" />
          <div>
            <h3 className="font-display text-[1.15rem] font-semibold text-white">
              Visitor chat
            </h3>
            <p className="mt-1 font-mono text-[10px] tracking-[.08em] text-[#a5b8d0] uppercase">
              Shared lobby · live updates
            </p>
          </div>
        </div>
        <span
          role="status"
          aria-label={
            online === null
              ? "Online count unavailable"
              : `${online} visitors online`
          }
          className="inline-flex items-center gap-2 rounded-full border border-[#a8a3e8]/25 bg-[#b9b5ff]/8 px-3 py-1.5 font-mono text-[10px] text-[#c9c6f0]"
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#b9ffb5]"
            aria-hidden="true"
          />
          Online {online ?? "—"}
        </span>
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-label="Lobby messages"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-5 py-6 sm:px-7"
      >
        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-[#a5b2cb]">
            Connecting to the lobby...
          </p>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-4 text-center">
            <MessageCircle
              size={34}
              strokeWidth={1.4}
              className="text-[#bcb6dc]"
              aria-hidden="true"
            />
            <h4 className="mt-5 font-display text-xl font-semibold tracking-[-.04em] text-white">
              Start the conversation.
            </h4>
            <p className="mt-3 max-w-[310px] text-sm leading-7 text-[#a5b1c8]">
              Say hello to fellow explorers.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 font-display text-xs font-semibold text-[#d9d3ff]">
                {message.authorName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xs font-semibold text-[#f0efff]">
                    {message.authorName}#{message.authorNumber}
                  </span>
                  <time
                    dateTime={message.createdAt}
                    className="font-mono text-[10px] text-[#8c9ab5]"
                  >
                    {messageTime(message.createdAt)}
                  </time>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-[1.75] text-[#c6d1e5]">
                  {message.body}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-7 sm:py-5"
      >
        {(error || community.lobbyError) && (
          <p role="alert" className="mb-3 text-xs leading-5 text-[#ffbdc9]">
            {error || community.lobbyError}
          </p>
        )}
        <p className="mb-3 flex items-center justify-between gap-3 text-[11px] text-[#9baac4]">
          <span>
            Speaking as {displayName}#{visitorNumber}
          </span>
          <span className="font-mono text-[10px]">{draft.length}/500</span>
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={500}
            aria-label="Lobby message"
            placeholder="Send a message..."
            className="archive-input h-12 min-w-0 flex-1 rounded-[13px] px-4 text-sm outline-none transition-colors focus:border-orbit/60 focus:ring-2 focus:ring-orbit/20"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send lobby message"
            title="Send message"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-[#cbc8ff] text-[#15162a] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {sending ? (
              <ArrowUpRight
                size={18}
                className="animate-pulse"
                aria-hidden="true"
              />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
