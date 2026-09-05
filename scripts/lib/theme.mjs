// Shared palette, fonts, filters and helpers for every generated SVG.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const C = {
  bg: "#030712", cyan: "#00F5FF", mag: "#FF00FF", lime: "#D7FF37",
  text: "#F8FAFC", muted: "#94A3B8", line: "#1E293B", panel: "#0b1224",
};

// Light-scheme counterpart (used by header-light / footer-light via <picture>).
export const L = {
  bg: "#F4F6FB", bg2: "#E6EBF7", text: "#0B1020", muted: "#4B5563", line: "#CBD5E1",
  cyan: "#0891B2", mag: "#C026D3", lime: "#4D7C0F", grid: "#4F46E5",
};

const FONT_B64 = readFileSync(join(ROOT, "assets", "fonts", "orbitron.woff2")).toString("base64");

export const fontFace =
  `@font-face{font-family:'Orbitron';src:url(data:font/woff2;base64,${FONT_B64}) format('woff2');font-weight:400 900;font-style:normal}`;

export const fontsCss =
  `.orb{font-family:'Orbitron','Segoe UI',Roboto,Helvetica,Arial,sans-serif}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace}
.serif{font-family:Georgia,'Times New Roman',Times,serif}`;

// Animations off for people who asked their OS for less motion. Static end-states are set per file.
export const reducedMotion = (extra = "") =>
  `@media (prefers-reduced-motion:reduce){*{animation:none!important}${extra}}`;

export function filters(cyan = C.cyan, mag = C.mag) {
  return `
<filter id="neonCyan" x="-30%" y="-60%" width="160%" height="220%">
  <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="blur"/>
  <feFlood flood-color="${cyan}" flood-opacity=".85"/>
  <feComposite in2="blur" operator="in" result="glow"/>
  <feMerge><feMergeNode in="glow"/><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="neonMag" x="-30%" y="-60%" width="160%" height="220%">
  <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
  <feFlood flood-color="${mag}" flood-opacity=".9"/>
  <feComposite in2="blur" operator="in" result="glow"/>
  <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="10" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="lineGlow" x="-10%" y="-400%" width="120%" height="900%">
  <feGaussianBlur stdDeviation="3" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="blur4" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#ffffff" opacity=".05"/></pattern>`;
}

export function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const fmt = (n) => Number(n || 0).toLocaleString("en-US");
export const fmtK = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K" : String(n));

export function relTime(iso, now = Date.now()) {
  if (!iso) return "n/a";
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export const corners = (x, y, sx, sy, color, size = 26) =>
  `<path d="M${x} ${y + size * sy} V${y} H${x + size * sx}" fill="none" stroke="${color}" stroke-width="2" opacity=".75"/>`;
