"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import { PhotoboothStudio } from "./PhotoboothStudio";

type PhotoboothModalProps = {
  onClose: () => void;
};

export function PhotoboothModal({ onClose }: PhotoboothModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const openerId = window.matchMedia("(min-width: 1024px)").matches
      ? "section-photobooth"
      : "mobile-section-photobooth";
    const previousFocus =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : document.getElementById(openerId);
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    dialogRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], input:not(:disabled):not([hidden]), textarea:not(:disabled)",
        ),
      ).filter((element) => element.getClientRects().length > 0);

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (
          document.activeElement === first ||
          document.activeElement === dialog
        ) {
          event.preventDefault();
          (last ?? dialog).focus();
        }
      } else if (
        document.activeElement === last ||
        document.activeElement === dialog
      ) {
        event.preventDefault();
        (first ?? dialog).focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <motion.div
      role="presentation"
      className="orbital-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-[2vh] md:p-[3vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="photobooth-title"
        className="relative flex h-dvh w-screen min-w-0 flex-col overflow-hidden border border-[#f0a6d2]/15 bg-[#080c17] shadow-[0_28px_90px_rgba(0,0,0,.65)] outline-none focus:outline-none sm:h-[94dvh] sm:w-[96vw] sm:max-w-[1120px] sm:rounded-[22px]"
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="flex min-h-[56px] shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0e1320] px-4 py-2.5 sm:px-6">
          <div className="min-w-0">
            <h2
              id="photobooth-title"
              className="font-display text-base font-semibold tracking-[-.03em] text-white sm:text-lg"
            >
              Orbit Booth
            </h2>
            <p className="font-mono text-[10px] tracking-[.1em] text-[#d59cbf]">
              PHOTO STUDIO
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-3 text-xs font-semibold text-[#e8e4f3] transition-colors hover:border-[#f0a6d2]/55 hover:bg-white/10 sm:px-4"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to stars
          </button>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-4 sm:px-6 sm:pt-5">
          <PhotoboothStudio />
        </div>
      </motion.div>
    </motion.div>
  );
}
