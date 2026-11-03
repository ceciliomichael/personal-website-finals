"use client";

import { motion } from "framer-motion";
import { ArrowRight, Orbit } from "lucide-react";
import { type FormEvent, useState } from "react";

type WelcomeScreenProps = {
  onNameSubmit: (name: string) => Promise<void>;
};

export function WelcomeScreen({ onNameSubmit }: WelcomeScreenProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const visitorName = name.trim();
    if (!visitorName || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      await onNameSubmit(visitorName);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not create your profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-label="Enter the constellation"
      className="relative z-10 flex min-h-dvh items-center justify-center overflow-hidden px-5 py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[min(82vw,680px)] w-[min(82vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(116,81,210,.24)_0%,rgba(67,91,190,.09)_43%,transparent_72%)] blur-[30px]"
      />
      <motion.div
        className="relative w-full max-w-[480px] text-center"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-10 flex flex-col items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-[19px] border border-orbit/35 bg-orbit/10 shadow-[0_0_40px_rgba(185,181,255,.12)]">
            <Orbit
              className="h-7 w-7 text-orbit"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </span>
          <span className="font-display text-[13px] font-bold tracking-[.24em] text-[#d9d6ff] uppercase">
            Orbital
          </span>
        </div>

        <p className="mb-4 font-mono text-[10px] tracking-[.2em] text-orbit uppercase">
          A universe to discover
        </p>
        <h1 className="font-display text-[clamp(2.8rem,7vw,4.5rem)] leading-[1.06] font-semibold tracking-[-.065em] text-white">
          What should I
          <br />
          <span className="orbital-gradient-text">call you?</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[340px] text-sm leading-7 text-[#a3afc6]">
          Enter your name and explore Michael&apos;s constellation.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4 text-left">
          <label
            htmlFor="visitor-name"
            className="block font-mono text-[11px] tracking-[.12em] text-[#c7cee4] uppercase"
          >
            Your name
          </label>
          <input
            id="visitor-name"
            name="visitor-name"
            type="text"
            value={name}
            maxLength={20}
            required
            autoComplete="nickname"
            placeholder="Enter your name..."
            onChange={(event) => setName(event.target.value)}
            className="h-15 w-full rounded-2xl border border-[#777ba080] bg-[#11172acd] px-5 text-[16px] text-white outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#72809c] focus:border-orbit/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="group flex h-15 w-full items-center justify-center gap-3 rounded-2xl bg-[#cbc8ff] font-display text-[15px] font-semibold text-[#111124] transition-all duration-300 hover:bg-white hover:shadow-[0_0_40px_rgba(185,181,255,.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#cbc8ff] disabled:hover:shadow-none"
          >
            {submitting ? "Creating your profile..." : "Begin exploring"}
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
          {error && (
            <p
              role="alert"
              className="text-center text-xs leading-6 text-[#ffbdc7]"
            >
              {error}
            </p>
          )}
        </form>

        <div className="mt-9 flex items-center justify-center gap-3 font-mono text-[10px] tracking-[.1em] text-[#7f8aa8]">
          <span className="h-px w-7 bg-orbit/25" aria-hidden="true" />
          NO PASSWORD REQUIRED
          <span className="h-px w-7 bg-orbit/25" aria-hidden="true" />
        </div>
      </motion.div>
    </section>
  );
}
