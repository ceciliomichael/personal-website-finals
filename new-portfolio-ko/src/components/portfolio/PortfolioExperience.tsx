"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  achievements,
  type PortfolioSection,
  sections,
} from "@/data/portfolio";
import { markOnline } from "@/lib/community-client";
import {
  registerVisitor,
  renameVisitor,
  restoreVisitor,
  trackVisitorActivity,
  VISITOR_SESSION_STORAGE_KEY,
  VisitorApiError,
} from "@/lib/visitor-client";
import type { VisitorActivity, VisitorProfile } from "@/lib/visitors";
import { AchievementToast } from "./AchievementToast";
import { ExploreGalaxy } from "./ExploreGalaxy";
import { NebulaJourney } from "./NebulaJourney";
import { ProfileScreen } from "./ProfileScreen";
import { SectionModal } from "./SectionModal";
import { SpaceBackdrop } from "./SpaceBackdrop";
import { useCommunityCache } from "./useCommunityCache";
import { WelcomeScreen } from "./WelcomeScreen";

type ExperiencePhase =
  | "restoring"
  | "restore-error"
  | "welcome"
  | "journey"
  | "galaxy"
  | "profile";

function mergeProgress(
  current: VisitorProfile | null,
  incoming: VisitorProfile,
): VisitorProfile {
  if (!current || current.id !== incoming.id) {
    return incoming;
  }

  return {
    ...current,
    visitedSectionIds: [
      ...new Set([...current.visitedSectionIds, ...incoming.visitedSectionIds]),
    ],
    unlockedAchievementIds: [
      ...new Set([
        ...current.unlockedAchievementIds,
        ...incoming.unlockedAchievementIds,
      ]),
    ],
  };
}

export function PortfolioExperience() {
  const [phase, setPhase] = useState<ExperiencePhase>("restoring");
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [activeSection, setActiveSection] = useState<PortfolioSection | null>(
    null,
  );
  const [visibleAchievementId, setVisibleAchievementId] = useState<
    string | null
  >(null);

  const unlockedRef = useRef(new Set<string>());
  const achievementTimerRef = useRef<number | null>(null);

  const restoreSavedVisitor = useCallback(async () => {
    setPhase("restoring");
    setRestoreError("");

    let storedSession: string | null;
    try {
      storedSession = window.localStorage.getItem(VISITOR_SESSION_STORAGE_KEY);
    } catch {
      setRestoreError("Enable browser storage to keep your visitor profile.");
      setPhase("restore-error");
      return;
    }

    if (!storedSession) {
      setPhase("welcome");
      return;
    }

    try {
      const savedProfile = await restoreVisitor(storedSession);
      setProfile(savedProfile);
      setSessionId(storedSession);
      unlockedRef.current = new Set(savedProfile.unlockedAchievementIds);
      setPhase("journey");
    } catch (error) {
      if (error instanceof VisitorApiError && error.status === 401) {
        window.localStorage.removeItem(VISITOR_SESSION_STORAGE_KEY);
        setSessionId(null);
        setProfile(null);
        setPhase("welcome");
        return;
      }

      setRestoreError(
        error instanceof Error
          ? error.message
          : "Could not load your saved visitor profile.",
      );
      setPhase("restore-error");
    }
  }, []);

  useEffect(() => {
    void restoreSavedVisitor();
  }, [restoreSavedVisitor]);

  const unlockAchievement = useCallback((id: string) => {
    if (unlockedRef.current.has(id)) return;

    unlockedRef.current.add(id);
    setVisibleAchievementId(id);

    if (achievementTimerRef.current !== null) {
      window.clearTimeout(achievementTimerRef.current);
    }
    achievementTimerRef.current = window.setTimeout(() => {
      setVisibleAchievementId(null);
    }, 4700);
  }, []);

  const handleCommunityAchievements = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      setProfile((current) => {
        if (!current) return current;
        return {
          ...current,
          unlockedAchievementIds: [
            ...new Set([...current.unlockedAchievementIds, ...ids]),
          ],
        };
      });
      for (const id of ids) unlockAchievement(id);
    },
    [unlockAchievement],
  );

  // Mount a single realtime connection as soon as the visitor is known.
  // Preloading starts during the nebula animation, before either node opens.
  const community = useCommunityCache(
    sessionId,
    profile?.id ?? null,
    handleCommunityAchievements,
  );

  const recordActivity = useCallback(
    async (activity: VisitorActivity) => {
      if (!sessionId) return;

      try {
        const result = await trackVisitorActivity(sessionId, activity);

        // Two requests can complete out of order. Keep every server-verified
        // visit and unlock rather than replacing newer state with older state.
        setProfile((current) => mergeProgress(current, result.profile));
        for (const id of result.newAchievementIds) {
          unlockAchievement(id);
        }
        setProgressError("");
      } catch {
        setProgressError(
          "Your latest progress could not be saved. Please reconnect.",
        );
      }
    },
    [sessionId, unlockAchievement],
  );

  useEffect(() => {
    if (phase !== "galaxy" || !sessionId) return;

    void recordActivity({ type: "enter" });
    const timer = window.setTimeout(
      () => {
        void recordActivity({ type: "time" });
      },
      5 * 60 * 1000,
    );

    return () => window.clearTimeout(timer);
  }, [phase, sessionId, recordActivity]);

  useEffect(() => {
    if (!sessionId) return;
    const token = sessionId;

    function heartbeat() {
      if (document.visibilityState !== "visible") return;
      void markOnline(token).catch(() => {
        // Presence is best effort; a failed heartbeat will expire naturally.
      });
    }

    heartbeat();
    const interval = window.setInterval(heartbeat, 15_000);
    document.addEventListener("visibilitychange", heartbeat);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", heartbeat);
    };
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (achievementTimerRef.current !== null) {
        window.clearTimeout(achievementTimerRef.current);
      }
    };
  }, []);

  async function handleEntry(name: string): Promise<void> {
    let token: string;

    try {
      token =
        window.localStorage.getItem(VISITOR_SESSION_STORAGE_KEY) ??
        window.crypto.randomUUID();
      // Save before contacting the API so a retry after a lost response uses
      // the same identity rather than allocating a second visitor number.
      window.localStorage.setItem(VISITOR_SESSION_STORAGE_KEY, token);
    } catch {
      throw new Error(
        "Browser storage is required to save your visitor profile.",
      );
    }

    const created = await registerVisitor(token, name);
    setSessionId(token);
    setProfile(created);
    unlockedRef.current = new Set(created.unlockedAchievementIds);
    setActiveSection(null);
    setPhase("journey");
  }

  const finishJourney = useCallback(() => {
    setPhase("galaxy");
  }, []);

  function handleSectionOpen(section: PortfolioSection) {
    setActiveSection(section);
    void recordActivity({ type: "section", sectionId: section.id });
  }

  async function handleNameUpdate(name: string): Promise<void> {
    if (!sessionId) {
      throw new Error("Visitor session is unavailable.");
    }

    const updated = await renameVisitor(sessionId, name);
    community.renameAuthor(updated.visitorNumber, updated.displayName);
    setProfile((current) => ({
      ...mergeProgress(current, updated),
      displayName: updated.displayName,
    }));
  }

  const visibleAchievement = achievements.find(
    (achievement) => achievement.id === visibleAchievementId,
  );

  if (phase === "restoring" || phase === "restore-error") {
    return (
      <main className="orbital-world relative flex min-h-dvh items-center justify-center px-5">
        <SpaceBackdrop />
        <section className="relative z-10 mx-auto max-w-[420px] text-center">
          {phase === "restoring" ? (
            <p role="status" className="font-display text-lg text-[#d4d4f1]">
              Loading your visitor profile...
            </p>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold text-white">
                Could not restore your profile
              </h1>
              <p role="alert" className="mt-4 text-sm leading-7 text-[#b9c3d7]">
                {restoreError}
              </p>
              <button
                type="button"
                onClick={() => void restoreSavedVisitor()}
                className="mt-7 rounded-full bg-[#cbc8ff] px-6 py-3 text-sm font-semibold text-[#101429] transition-colors hover:bg-white"
              >
                Retry connection
              </button>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="orbital-world relative min-h-dvh w-full overflow-hidden">
      {(phase === "welcome" || phase === "profile") && <SpaceBackdrop />}

      <AnimatePresence mode="wait" initial={false}>
        {phase === "welcome" ? (
          <motion.div
            key="welcome"
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.12 }}
            transition={{ duration: 0.42, ease: "easeInOut" }}
          >
            <WelcomeScreen onNameSubmit={handleEntry} />
          </motion.div>
        ) : phase === "profile" && profile ? (
          <ProfileScreen
            key="profile-screen"
            profile={profile}
            onSaveName={handleNameUpdate}
            onBack={() => setPhase("galaxy")}
          />
        ) : (
          <motion.div
            key="galaxy"
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            aria-hidden={phase === "journey"}
            inert={phase === "journey"}
          >
            <ExploreGalaxy
              sections={sections}
              visitorName={profile?.displayName ?? ""}
              activeSection={activeSection}
              onSelectSection={handleSectionOpen}
              onOpenProfile={() => setPhase("profile")}
            />
            {progressError && (
              <p
                role="status"
                className="pointer-events-none fixed top-[82px] left-1/2 z-[100] w-[min(90vw,420px)] -translate-x-1/2 rounded-xl border border-rose-300/25 bg-[#311928ec] p-3 text-center text-xs text-rose-100"
              >
                {progressError}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "journey" && (
          <NebulaJourney
            key="nebula-journey"
            visitorName={profile?.displayName ?? ""}
            onComplete={finishJourney}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSection && sessionId && (
          <SectionModal
            key={activeSection.id}
            section={activeSection}
            community={community}
            visitorName={profile?.displayName ?? ""}
            visitorNumber={profile?.visitorNumber ?? ""}
            onClose={() => setActiveSection(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visibleAchievement && (
          <AchievementToast
            key={visibleAchievement.id}
            achievement={visibleAchievement}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
