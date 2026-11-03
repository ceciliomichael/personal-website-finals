import type { CSSProperties } from "react";

const stars = Array.from({ length: 90 }, (_, index) => {
  const seed = (index * 9301 + 49297) % 233280;
  const seedY = (index * 21701 + 16913) % 233280;

  return {
    id: index,
    left: `${(seed / 233280) * 100}%`,
    top: `${(seedY / 233280) * 100}%`,
    size: index % 13 === 0 ? 2.5 : index % 4 === 0 ? 1.7 : 1,
    duration: `${4 + (index % 7)}s`,
    delay: `${-(index % 9)}s`,
  };
});

export function SpaceBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="orbital-aura absolute inset-0" />
      <div className="orbital-grid absolute inset-0 opacity-70" />
      <div className="orbital-grain absolute inset-0" />
      {stars.map((star) => (
        <span
          key={star.id}
          className="orbital-star"
          style={
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              "--twinkle-duration": star.duration,
            } as CSSProperties
          }
        />
      ))}
      <div className="orbital-lens absolute inset-0" />
    </div>
  );
}
