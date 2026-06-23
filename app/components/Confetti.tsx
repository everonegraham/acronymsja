"use client";

import { useMemo } from "react";

// Brand-leaning festive palette.
const COLORS = ["#2a4d69", "#81b29a", "#fdf0a8", "#adc2d2", "#e07a5f", "#f2cc8f"];

// Deterministic pseudo-random in [0, 1) from a seed — pure (no Math.random), so
// it's safe to call during render and produces no SSR/client hydration mismatch.
const rand = (seed: number) => {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
};

// A one-shot confetti burst: a fixed, non-interactive overlay of colored pieces
// that fall and spin once, then fade (CSS `confetti-fall`). Layout per piece is
// derived deterministically from its index, so it's stable across re-renders.
export default function Confetti({ count = 90 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: rand(i + 1) * 100,
        delay: rand(i + 2) * 0.7,
        duration: 2.6 + rand(i + 3) * 2,
        color: COLORS[i % COLORS.length],
        width: 6 + rand(i + 4) * 6,
        rounded: rand(i + 5) > 0.5,
      })),
    [count],
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: `${p.width}px`,
            height: `${p.width * 0.45 + 3}px`,
            backgroundColor: p.color,
            borderRadius: p.rounded ? "9999px" : "1px",
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
