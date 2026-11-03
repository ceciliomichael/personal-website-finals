"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageSquareText, Pencil, Send, Signal } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { CommunityCache } from "./useCommunityCache";

type FeedbackProps = {
  community: CommunityCache;
  displayName: string;
  visitorNumber: string;
};

function relativeTime(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FeedbackFeed({
  community,
  displayName,
  visitorNumber,
}: FeedbackProps) {
  const posts = community.feedback;
  const mine = community.mine;
  const loading = !community.feedbackReady;
  const [draft, setDraft] = useState(mine?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const draftChanged = useRef(false);

  useEffect(() => {
    if (!draftChanged.current) setDraft(mine?.body ?? "");
  }, [mine?.body]);

  const editsRemaining = 3 - (mine?.editCount ?? 0);
  const unchanged = draft.trim() === (mine?.body ?? "");
  const canSubmit =
    !saving && !!draft.trim() && (!mine || (editsRemaining > 0 && !unchanged));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (mine) {
        const feedback = await community.editFeedback(draft.trim());
        setDraft(feedback.body);
        setNotice("Your feedback was updated.");
      } else {
        const feedback = await community.postFeedback(draft.trim());
        setDraft(feedback.body);
        setNotice("Your feedback is now public.");
      }
      draftChanged.current = false;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save your feedback.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <span className="archive-kicker">
          <Signal size={14} aria-hidden="true" /> Live guestbook
        </span>
        <h3 className="mt-3 font-display text-[clamp(1.55rem,3vw,2rem)] font-semibold tracking-[-.045em] text-white">
          Share a signal.
        </h3>
        <p className="mt-2 text-[13px] leading-6 text-[#aebbd2]">
          One public feedback post per explorer. You can revise your post up to
          three times.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="border-b border-white/10 pb-7">
        <p className="mb-3 text-xs text-[#aebbd2]">
          Posting as{" "}
          <span className="font-semibold text-white">
            {displayName}#{visitorNumber}
          </span>
        </p>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="public-feedback-message"
            className="font-display text-sm font-semibold text-white"
          >
            {mine ? "Your published feedback" : "Write your feedback"}
          </label>
          {mine && (
            <span className="font-mono text-[10px] text-[#aab5d0]">
              {mine.editCount} / 3 edits used
            </span>
          )}
        </div>
        <textarea
          id="public-feedback-message"
          value={draft}
          onChange={(event) => {
            draftChanged.current = true;
            setDraft(event.target.value);
            setNotice("");
          }}
          maxLength={1600}
          rows={4}
          disabled={saving || (!!mine && editsRemaining === 0)}
          placeholder="What did you think of the portfolio?"
          className="archive-input w-full resize-y rounded-[14px] p-4 text-sm leading-7 outline-none transition-colors focus:border-orbit/60 focus:ring-2 focus:ring-orbit/20 disabled:opacity-60"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] text-[#8390ac]">
            {draft.length} / 1600 characters
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#cbc8ff] px-5 text-xs font-semibold text-[#13152a] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {mine ? (
              <Pencil size={14} aria-hidden="true" />
            ) : (
              <Send size={14} aria-hidden="true" />
            )}
            {saving ? "Saving..." : mine ? "Update feedback" : "Post feedback"}
          </button>
        </div>
        {mine && editsRemaining === 0 && (
          <p className="mt-3 text-xs text-[#b3bdd2]">
            You have used all three edits. Your feedback is now final.
          </p>
        )}
        <AnimatePresence>
          {notice && (
            <motion.p
              role="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-center gap-2 text-xs text-[#b9ffb5]"
            >
              <Check size={14} aria-hidden="true" /> {notice}
            </motion.p>
          )}
        </AnimatePresence>
        {(error || community.feedbackError) && (
          <p role="alert" className="mt-3 text-xs text-[#ffbfc6]">
            {error || community.feedbackError}
          </p>
        )}
      </form>

      <section aria-label="Public feedback posts">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h4 className="font-display text-lg font-semibold text-white">
            From the community
          </h4>
          <span className="font-mono text-[10px] text-[#9aa9c4]">
            {posts.length} recent posts
          </span>
        </div>

        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-[#a7b5cd]">
            Loading feedback...
          </p>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border-t border-white/10 py-12 text-center">
            <MessageSquareText
              size={24}
              className="text-[#a9a4d8]"
              aria-hidden="true"
            />
            <p className="text-sm text-[#aab8cf]">
              No posts yet. Be the first to leave a signal.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {posts.map((post) => (
              <article key={post.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-[#d9d3ff]">
                      {post.authorName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-[13px] font-semibold text-white">
                      {post.authorName}#{post.authorNumber}
                    </span>
                    {mine?.id === post.id && (
                      <span className="rounded-full border border-orbit/30 px-2 py-0.5 font-mono text-[9px] text-[#bfbaff]">
                        YOU
                      </span>
                    )}
                  </div>
                  <time
                    dateTime={post.updatedAt}
                    className="font-mono text-[10px] text-[#8f9db9]"
                  >
                    {relativeTime(post.updatedAt)}
                    {post.editCount > 0 ? " · edited" : ""}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-[1.8] text-[#ced7eb]">
                  {post.body}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
