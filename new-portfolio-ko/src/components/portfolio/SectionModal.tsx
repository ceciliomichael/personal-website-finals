"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Orbit } from "lucide-react";
import { type CSSProperties, useEffect, useRef } from "react";
import { type PortfolioSection, sections } from "@/data/portfolio";
import { FeedbackFeed } from "./FeedbackFeed";
import { LobbyChat } from "./LobbyChat";
import { SectionModalNarratives } from "./SectionModalNarratives";
import { SectionModalShowcases } from "./SectionModalShowcases";
import type { CommunityCache } from "./useCommunityCache";

type SectionModalProps = {
  section: PortfolioSection;
  community: CommunityCache;
  visitorName: string;
  visitorNumber: string;
  onClose: () => void;
};

const narrativeIds = new Set([
  "about",
  "ai-expertise",
  "development",
  "technical-skills",
]);
const showcaseIds = new Set(["projects", "hobbies", "goals", "gallery"]);

function SectionDetails({
  section,
  community,
  visitorName,
  visitorNumber,
}: Omit<SectionModalProps, "onClose">) {
  if (narrativeIds.has(section.id)) {
    return <SectionModalNarratives section={section} />;
  }

  if (showcaseIds.has(section.id)) {
    return <SectionModalShowcases section={section} />;
  }

  if (section.id === "feedback") {
    return (
      <FeedbackFeed
        community={community}
        displayName={visitorName}
        visitorNumber={visitorNumber}
      />
    );
  }

  return (
    <LobbyChat
      community={community}
      displayName={visitorName}
      visitorNumber={visitorNumber}
    />
  );
}

export function SectionModal({
  section,
  community,
  visitorName,
  visitorNumber,
  onClose,
}: SectionModalProps) {
  const Icon = section.icon;
  const backRef = useRef<HTMLButtonElement>(null);
  const sectionIndex = sections.findIndex((entry) => entry.id === section.id);
  const sectionNumber = String(sectionIndex + 1).padStart(2, "0");
  const sectionTotal = String(sections.length).padStart(2, "0");

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    backRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (event.key === "Tab") {
        const dialog = backRef.current?.closest('[role="dialog"]');
        if (!dialog) return;

        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled)",
          ),
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  const accentStyle = {
    "--archive-color": section.color,
  } as CSSProperties;

  return (
    <motion.div
      role="presentation"
      className="orbital-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-dialog-title"
        aria-describedby="section-dialog-description"
        data-archive-section={section.id}
        style={accentStyle}
        initial={{ opacity: 0, y: 24, scale: 0.975 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className={`archive-shell relative flex max-h-[94dvh] w-full max-w-[1000px] min-w-0 flex-col overflow-hidden rounded-[20px] lg:max-h-[min(92dvh,900px)] lg:flex-row lg:rounded-[24px] ${section.id === "lobby" ? "h-[min(90dvh,760px)]" : ""}`}
      >
        <div
          className="archive-shell-glow pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
        <div
          className="archive-shell-trace pointer-events-none absolute inset-x-0 top-0 z-[3] h-px"
          aria-hidden="true"
        />

        <header className="archive-rail relative z-[2] flex shrink-0 flex-col overflow-hidden border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6 lg:w-[260px] lg:border-r lg:border-b-0 lg:p-7">
          <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[.17em] text-[#b6bfd4] uppercase">
            <Orbit
              size={16}
              aria-hidden="true"
              className="archive-text-accent"
            />
            Orbital / Archive
          </div>

          <div className="mt-5 flex items-center gap-4 lg:mt-9 lg:block">
            <div className="archive-icon-basin relative flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[15px] lg:h-[64px] lg:w-[64px] lg:rounded-[18px]">
              <Icon
                aria-hidden="true"
                className="relative z-[1] text-[1.35rem] lg:text-[1.65rem]"
              />
            </div>
            <div className="lg:mt-5">
              <span className="font-mono text-[10px] tracking-[.17em] text-[#bbc1dc] uppercase">
                Constellation {sectionNumber} / {sectionTotal}
              </span>
              <h2
                id="section-dialog-title"
                className="archive-heading mt-1.5 font-display text-[clamp(1.45rem,3vw,2.35rem)] leading-[1.08] font-semibold tracking-[-.055em] text-white lg:mt-4"
              >
                {section.content.title}
              </h2>
            </div>
          </div>

          <p
            id="section-dialog-description"
            className="mt-4 text-[12px] leading-[1.75] text-[#b5bdd2] sm:text-[13px] lg:mt-6 lg:leading-[1.9]"
          >
            {section.content.description}
          </p>
        </header>

        <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className={`archive-scroll min-h-0 flex-1 ${section.id === "lobby" ? "overflow-hidden" : "overflow-x-hidden overflow-y-auto p-5 sm:p-7 lg:p-8"}`}
          >
            <SectionDetails
              section={section}
              community={community}
              visitorName={visitorName}
              visitorNumber={visitorNumber}
            />
          </div>

          <footer className="flex shrink-0 items-center justify-end border-t border-white/10 px-5 py-4 sm:px-7 lg:px-8">
            <button
              ref={backRef}
              type="button"
              onClick={onClose}
              className="archive-return inline-flex min-h-9 items-center gap-2 rounded-lg px-2 font-display text-[12px] font-medium"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to the stars
            </button>
          </footer>
        </div>
      </motion.div>
    </motion.div>
  );
}
