"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Achievement } from "@/data/portfolio";

export function AchievementToast({
  achievement,
}: {
  achievement: Achievement;
}) {
  const Icon = achievement.icon;

  return (
    <motion.aside
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, x: 45, y: 14 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 35 }}
      transition={{ type: "spring", damping: 25, stiffness: 260 }}
      className="orbital-glass fixed right-4 bottom-4 left-4 z-[1100] flex max-w-[370px] items-center gap-4 rounded-[20px] p-4 shadow-[0_18px_65px_rgba(0,0,0,.4)] sm:right-7 sm:bottom-7 sm:left-auto sm:p-5"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] border border-orbit/25 bg-orbit/12 text-orbit">
        <Icon className="text-[1.35rem]" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          <Sparkles size={11} className="text-orbit" />
          <span className="font-mono text-[9px] tracking-[.14em] text-orbit uppercase">
            Discovery unlocked
          </span>
        </div>
        <h3 className="font-display text-[15px] font-semibold text-white">
          {achievement.title}
        </h3>
        <p className="mt-1 text-[11px] leading-[1.6] text-[#a1adc4]">
          {achievement.description}
        </p>
      </div>
    </motion.aside>
  );
}
