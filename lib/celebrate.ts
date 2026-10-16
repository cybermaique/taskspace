"use client";

import confetti from "canvas-confetti";

/** Resolves any CSS color (e.g. oklch) to hex, since confetti only parses hex. */
function resolveCssColor(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/** A short, restrained burst used when work gets finished. */
export function celebrate(origin?: { x: number; y: number }) {
  const primary = resolveCssColor(
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
  );
  void confetti({
    particleCount: 70,
    spread: 70,
    startVelocity: 32,
    gravity: 0.9,
    scalar: 0.85,
    ticks: 160,
    origin: origin ?? { x: 0.5, y: 0.65 },
    colors: [primary ?? "#14b8a6", "#34d399", "#facc15", "#ffffff"],
    disableForReducedMotion: true,
    zIndex: 120,
  });
}
