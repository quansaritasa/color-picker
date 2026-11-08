/**
 * WCAG 2.1 contrast math for the pairing suggestions.
 * Pure functions only: colors are `{ r, g, b, a }` from `color.js`, and a
 * translucent side is composited over the other one before measuring, because
 * that is what the screen actually shows.
 */

import { formatHex, parseHex } from './color.js';

const CHANNEL_MIN = 0.03928;

/** sRGB channel (0-255) → linear light, per WCAG relative luminance. */
const linear = (value) => {
  const c = value / 255;
  return c <= CHANNEL_MIN ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance, 0 (black) to 1 (white). Alpha is ignored. */
export function relativeLuminance({ r, g, b }) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** The opaque color seen when `color` is painted over `surface`. */
export function compositeOver(color, surface) {
  const a = Math.min(1, Math.max(0, color.a ?? 1));
  if (a >= 1) return { r: color.r, g: color.g, b: color.b };
  const mix = (fg, bg) => Math.round(fg * a + bg * (1 - a));
  return { r: mix(color.r, surface.r), g: mix(color.g, surface.g), b: mix(color.b, surface.b) };
}

/** Contrast ratio 1-21 between two colors. A translucent side is composited. */
export function contrastRatio(a, b) {
  let fg = a;
  let bg = b;
  if ((fg.a ?? 1) < 1) fg = compositeOver(fg, bg);
  else if ((bg.a ?? 1) < 1) bg = compositeOver(bg, fg);
  const la = relativeLuminance(fg);
  const lb = relativeLuminance(bg);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Verdict for a ratio: `AAA` (7:1), `AA` (4.5:1), `AA-large` (3:1, large text
 * only) or `fail`. `largeText` opens the 3:1 tier; the 4.5:1 one is always on.
 */
export function wcagLevel(ratio, { largeText = false } = {}) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return largeText ? 'AA-large' : 'fail';
  return 'fail';
}

/** `4.6:1`, one decimal — the form the panel and the README show. */
export function formatRatio(ratio) {
  return `${(Math.round(ratio * 10) / 10).toFixed(1)}:1`;
}

/**
 * Readable partners for `color`, best first. Candidates may be hex strings or
 * `{ r, g, b, a }`; results keep the exact ratio so callers can format it, and
 * anything under `minRatio` (4.5:1, normal text) is dropped.
 */
export function suggestPartners(color, candidates = [], { limit = 3, minRatio = 4.5 } = {}) {
  const seen = new Set();
  const ranked = [];
  for (const candidate of candidates) {
    const rgba = typeof candidate === 'string' ? parseHex(candidate) : candidate;
    if (!rgba) continue;
    const hex = formatHex(rgba);
    if (seen.has(hex)) continue;
    seen.add(hex);
    const ratio = contrastRatio(color, rgba);
    if (ratio < minRatio) continue;
    ranked.push({ hex, ratio, level: wcagLevel(ratio) });
  }
  return ranked.sort((x, y) => y.ratio - x.ratio).slice(0, limit);
}
