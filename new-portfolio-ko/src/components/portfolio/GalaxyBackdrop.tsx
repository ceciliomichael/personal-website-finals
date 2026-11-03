"use client";

import { useEffect, useState } from "react";

type ShootingStar = {
  id: number;
  left: string;
  top: string;
  angle: number;
};

function seeded(seed: number) {
  let hash = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

const stars = Array.from({ length: 115 }, (_, index) => ({
  id: index,
  left: `${seeded(index + 17) * 100}%`,
  top: `${seeded(index + 4029) * 100}%`,
  size: index % 11 === 0 ? 2.5 : 1.2,
  delay: `${-(index % 8)}s`,
}));

export function GalaxyBackdrop() {
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  useEffect(() => {
    let nextId = 0;
    const timeouts = new Set<number>();

    const interval = window.setInterval(() => {
      if (Math.random() > 0.48) return;

      const id = ++nextId;
      setShootingStars((current) => [
        ...current,
        {
          id,
          left: `${Math.random() * 62}%`,
          top: `${Math.random() * 44}%`,
          angle: Math.random() * 34,
        },
      ]);

      const timeout = window.setTimeout(() => {
        setShootingStars((current) => current.filter((star) => star.id !== id));
        timeouts.delete(timeout);
      }, 2400);
      timeouts.add(timeout);
    }, 3200);

    return () => {
      window.clearInterval(interval);
      for (const timeout of timeouts) window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className="orbital-galaxy-background pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="orbital-grid absolute inset-0 opacity-40" />
      {stars.map((star) => (
        <span
          key={star.id}
          className="orbital-star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
        />
      ))}
      {shootingStars.map((star) => (
        <span
          key={star.id}
          className="orbital-shooting-star"
          style={{
            left: star.left,
            top: star.top,
            rotate: `${star.angle}deg`,
          }}
        />
      ))}
      <div className="absolute top-[10%] left-[12%] h-[260px] w-[260px] rounded-full bg-[#6a54ac] opacity-8 blur-[95px]" />
      <div className="absolute right-[2%] bottom-[5%] h-[340px] w-[340px] rounded-full bg-[#385a9d] opacity-10 blur-[120px]" />
    </div>
  );
}
