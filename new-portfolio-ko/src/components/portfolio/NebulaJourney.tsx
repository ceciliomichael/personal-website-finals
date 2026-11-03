"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Orbit, Sparkles } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";

type NebulaJourneyProps = {
  visitorName: string;
  onComplete: () => void;
};

function random(seed: number) {
  let hash = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

const flightStars = Array.from({ length: 86 }, (_, id) => {
  const angle = id * 2.399963229728653;
  const distance = 75 + random(id + 126) * 60;

  return {
    id,
    x: `${(Math.cos(angle) * distance).toFixed(2)}vw`,
    y: `${(Math.sin(angle) * distance).toFixed(2)}vh`,
    angle: `${((angle * 180) / Math.PI).toFixed(2)}deg`,
    delay: `${(-random(id + 409) * 2.6).toFixed(2)}s`,
    duration: `${(1.7 + random(id + 88) * 1.5).toFixed(2)}s`,
    color: id % 7 === 0 ? "#b9b5ff" : id % 11 === 0 ? "#9dd9ff" : "#f2eeff",
  };
});

export function NebulaJourney({ visitorName, onComplete }: NebulaJourneyProps) {
  const prefersReducedMotion = useReducedMotion();
  const [approaching, setApproaching] = useState(false);
  const duration = prefersReducedMotion ? 500 : 4400;

  useEffect(() => {
    const statusTimer = window.setTimeout(
      () => setApproaching(true),
      prefersReducedMotion ? 100 : 2550,
    );
    const completeTimer = window.setTimeout(onComplete, duration);

    return () => {
      window.clearTimeout(statusTimer);
      window.clearTimeout(completeTimer);
    };
  }, [duration, onComplete, prefersReducedMotion]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Traveling through the nebula to your constellation"
      className="nebula-journey fixed inset-0 z-[120] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 1, 0] }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{
        duration: duration / 1000,
        times: [0, 0.52, 0.8, 1],
        ease: "easeInOut",
      }}
    >
      <div className="nebula-journey-sky absolute inset-0" aria-hidden="true">
        <div className="nebula-journey-cloud nebula-journey-cloud--violet" />
        <div className="nebula-journey-cloud nebula-journey-cloud--blue" />
        <div className="nebula-journey-cloud nebula-journey-cloud--rose" />
        <div className="nebula-journey-portal nebula-journey-portal--first" />
        <div className="nebula-journey-portal nebula-journey-portal--second" />
        <div className="nebula-journey-portal nebula-journey-portal--third" />
        <div className="nebula-journey-stars">
          {flightStars.map((star) => (
            <span
              key={star.id}
              className="nebula-journey-star"
              style={
                {
                  "--flight-x": star.x,
                  "--flight-y": star.y,
                  "--flight-angle": star.angle,
                  "--flight-delay": star.delay,
                  "--flight-duration": star.duration,
                  "--flight-color": star.color,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="nebula-warp-system" aria-hidden="true">
          <span className="nebula-warp-halo" />
          <span className="nebula-warp-ring nebula-warp-ring--outer" />
          <span className="nebula-warp-ring nebula-warp-ring--middle" />
          <span className="nebula-warp-ring nebula-warp-ring--inner" />
          <span className="nebula-warp-flare nebula-warp-flare--horizontal" />
          <span className="nebula-warp-flare nebula-warp-flare--vertical" />
          <span className="nebula-warp-core" />
        </div>
        <div className="nebula-journey-vignette absolute inset-0" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[9%] flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-[#090e25a8] px-4 py-2 font-mono text-[10px] tracking-[.18em] text-[#dad9ff] backdrop-blur-lg">
          <Orbit size={14} className="text-orbit" aria-hidden="true" />
          ORBITAL / IN TRANSIT
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[12%] flex flex-col items-center px-6 text-center sm:bottom-[14%]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center"
        >
          <Sparkles
            className="mb-4 h-5 w-5 text-[#dcd5ff]"
            aria-hidden="true"
          />
          <p className="font-display text-[clamp(1.25rem,3vw,1.7rem)] font-semibold tracking-[-.04em] text-white">
            {approaching
              ? "Your constellation is ahead"
              : `Through the nebula, ${visitorName}`}
          </p>
          <p className="mt-2 font-mono text-[10px] tracking-[.16em] text-[#c0b8e9] uppercase">
            {approaching
              ? "Preparing the star map"
              : "Traveling beyond the ordinary"}
          </p>
        </motion.div>
        <div
          aria-hidden="true"
          className="mt-6 h-[3px] w-[min(240px,70vw)] overflow-hidden rounded-full bg-white/20"
        >
          <div className="nebula-journey-progress h-full rounded-full bg-[#c9beff]" />
        </div>
      </div>
    </motion.div>
  );
}
