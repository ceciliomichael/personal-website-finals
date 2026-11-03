"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Compass,
  LoaderCircle,
  Orbit,
  Pencil,
  Sparkles,
  UserRound,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { achievements, sections } from "@/data/portfolio";
import type { VisitorProfile } from "@/lib/visitors";

type ProfileScreenProps = {
  profile: VisitorProfile;
  onSaveName: (name: string) => Promise<void>;
  onBack: () => void;
};

function statusForAchievement(
  id: string,
  requiredVisits: number | undefined,
  profile: VisitorProfile,
): string {
  if (profile.unlockedAchievementIds.includes(id)) return "Unlocked";
  if (requiredVisits) {
    return `${Math.min(profile.visitedSectionIds.length, requiredVisits)} / ${requiredVisits} sections`;
  }
  if (id === "curious_mind") return "Explore for 5 minutes";
  if (id === "feedback_giver") return "Share your feedback";
  if (id === "first_message") return "Say hello in the lobby";
  return "Not yet discovered";
}

export function ProfileScreen({
  profile,
  onSaveName,
  onBack,
}: ProfileScreenProps) {
  const [name, setName] = useState(profile.displayName);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile.displayName);
  }, [profile.displayName]);

  useEffect(() => {
    if (editing) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editing]);

  const unlocked = profile.unlockedAchievementIds.length;
  const total = achievements.length;
  const visited = profile.visitedSectionIds.length;
  const progressPercent = Math.round((unlocked / total) * 100);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || saving || !editing) return;
    if (name.trim() === profile.displayName) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSaveName(name.trim());
      setEditing(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update your display name.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.section
      aria-labelledby="profile-title"
      className="relative z-10 min-h-dvh w-full px-4 pt-5 pb-14 sm:px-8 sm:pt-7 lg:px-12"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto max-w-[1040px]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-orbit/30 bg-orbit/10">
              <Orbit size={21} className="text-orbit" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-[-.04em] text-white">
              ORBITAL<span className="text-orbit">.</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-semibold text-[#e7e7fa] transition-colors hover:border-orbit/50 hover:bg-white/10 sm:px-5"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to the stars
          </button>
        </header>

        <div className="relative mt-8 overflow-hidden rounded-[26px] border border-white/13 bg-[#10162acd] px-5 py-7 sm:px-9 sm:py-9 lg:px-11">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-48 -right-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(157,119,243,.24),rgba(97,110,240,.08)_48%,transparent_72%)] blur-[22px]"
          />
          <div className="relative">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[.17em] text-[#c3bff4] uppercase">
                <Sparkles size={13} aria-hidden="true" />
                Your constellation identity
              </span>

              <div className="mt-6 flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-orbit/30 bg-orbit/12 text-orbit sm:h-20 sm:w-20">
                  <UserRound size={33} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <form
                    onSubmit={saveName}
                    className="flex min-w-0 max-w-full items-center gap-2"
                  >
                    <h1
                      id="profile-title"
                      aria-label={`Profile: ${profile.displayName}`}
                      className="min-w-0 max-w-[calc(100%-3rem)] break-words font-display text-[clamp(1.85rem,4vw,3.2rem)] leading-[1.1] font-semibold tracking-[-.055em] text-white"
                    >
                      {editing ? (
                        <span className="inline-grid max-w-full min-w-[3ch] align-middle">
                          <span
                            aria-hidden="true"
                            className="invisible col-start-1 row-start-1 whitespace-pre border-b px-0 py-1"
                          >
                            {name || "Enter your name"}
                          </span>
                          <label
                            htmlFor="profile-display-name"
                            className="sr-only"
                          >
                            Display name
                          </label>
                          <input
                            ref={nameInputRef}
                            id="profile-display-name"
                            type="text"
                            value={name}
                            placeholder="Enter your name"
                            maxLength={20}
                            autoComplete="nickname"
                            required
                            disabled={saving}
                            onChange={(event) => {
                              setName(event.target.value);
                              setError("");
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                setName(profile.displayName);
                                setEditing(false);
                                setError("");
                              }
                            }}
                            className="col-start-1 row-start-1 w-full min-w-0 border-b border-[#b9b5ff] bg-transparent px-0 py-1 font-inherit text-inherit outline-none placeholder:text-[#8490ae] focus:ring-0 disabled:opacity-60"
                          />
                        </span>
                      ) : (
                        profile.displayName
                      )}
                    </h1>
                    {editing ? (
                      <button
                        type="submit"
                        aria-label="Save display name"
                        title="Save name"
                        disabled={saving || !name.trim()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#cbc8ff] text-[#121629] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {saving ? (
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Check
                            size={19}
                            strokeWidth={2.3}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Edit display name"
                        title="Edit display name"
                        onClick={() => setEditing(true)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#b9b5ff] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#c6c0ff]"
                      >
                        <Pencil size={19} aria-hidden="true" />
                      </button>
                    )}
                  </form>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#9ca9c6]">
                      Explorer ID
                    </span>
                    <span className="rounded-full border border-orbit/30 bg-orbit/12 px-2.5 py-1 font-mono text-xs font-semibold text-[#d1ccff]">
                      #{profile.visitorNumber}
                    </span>
                  </div>
                  {error && (
                    <p role="alert" className="mt-3 text-xs text-[#ffbfc6]">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-white/10 bg-[#11172acc] p-5">
            <p className="font-mono text-[10px] tracking-[.1em] text-[#9daac7] uppercase">
              Constellations visited
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-white">
              {visited}{" "}
              <span className="text-base text-[#969fb9]">
                / {sections.length}
              </span>
            </p>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-[#11172acc] p-5">
            <p className="font-mono text-[10px] tracking-[.1em] text-[#9daac7] uppercase">
              Achievements earned
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-white">
              {unlocked}{" "}
              <span className="text-base text-[#969fb9]">/ {total}</span>
            </p>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-[#11172acc] p-5">
            <p className="font-mono text-[10px] tracking-[.1em] text-[#9daac7] uppercase">
              Discovery progress
            </p>
            <p className="mt-3 font-display text-3xl font-semibold text-white">
              {progressPercent}
              <span className="ml-0.5 text-base text-[#969fb9]">%</span>
            </p>
            <div
              role="progressbar"
              aria-label="Achievement discovery progress"
              aria-valuenow={unlocked}
              aria-valuemax={total}
              aria-valuemin={0}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full rounded-full bg-[#b9b5ff] transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <section aria-labelledby="profile-achievements-title" className="mt-11">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <span className="font-mono text-[10px] tracking-[.15em] text-[#b3b0d9] uppercase">
                Your milestones
              </span>
              <h2
                id="profile-achievements-title"
                className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-[-.045em] text-white"
              >
                Achievements
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 text-xs text-[#aebbd3]">
              <Compass size={15} aria-hidden="true" />
              Keep exploring to unlock more
            </span>
          </div>

          <div className="mt-5 grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              const isUnlocked = profile.unlockedAchievementIds.includes(
                achievement.id,
              );
              const status = statusForAchievement(
                achievement.id,
                achievement.requiredVisits,
                profile,
              );

              return (
                <motion.article
                  key={achievement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(index * 0.035, 0.2),
                  }}
                  className={`relative flex min-h-[168px] flex-col rounded-[18px] border p-5 ${isUnlocked ? "border-orbit/35 bg-[#292348a6]" : "border-white/10 bg-[#101727bc]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-[13px] ${isUnlocked ? "bg-orbit/18 text-[#d7d0ff]" : "bg-white/5 text-[#8794af]"}`}
                    >
                      <Icon className="text-xl" aria-hidden="true" />
                    </span>
                    <span
                      className={`font-mono text-[10px] tracking-[.07em] ${isUnlocked ? "text-[#c9c4fa]" : "text-[#8d9ab3]"}`}
                    >
                      {isUnlocked ? "UNLOCKED" : "UNDISCOVERED"}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">
                    {achievement.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#abb7cc]">
                    {achievement.description}
                  </p>
                  <div className="mt-auto pt-4">
                    <p className="font-mono text-[10px] text-[#b4bce0]">
                      {status}
                    </p>
                    {achievement.requiredVisits && !isUnlocked && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#b9b5ff]"
                          style={{
                            width: `${Math.round(
                              (Math.min(visited, achievement.requiredVisits) /
                                achievement.requiredVisits) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      </div>
    </motion.section>
  );
}
