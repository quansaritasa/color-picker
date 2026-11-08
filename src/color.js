/**
 * Color math for the picker. Pure functions only, no DOM, no module-level state.
 * Colors are `{ r, g, b, a }`: r/g/b in 0-255, a in 0-1.
 */

const HEX_RE = /^[0-9a-f]+$/i;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round255 = (n) => clamp(Math.round(n), 0, 255);
const toHex2 = (n) => round255(n).toString(16).padStart(2, '0').toUpperCase();

/**
 * Parse `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA` (the `#` is optional).
 * Returns `{ r, g, b, a }` or `null` when the string is not a valid hex color.
 */
export function parseHex(value) {
  if (typeof value !== 'string') return null;
  const h = value.trim().replace(/^#/, '');
  if (![3, 4, 6, 8].includes(h.length) || !HEX_RE.test(h)) return null;
  const full = h.length <= 4 ? [...h].map((c) => c + c).join('') : h;
  const at = (i) => parseInt(full.slice(i, i + 2), 16);
  return {
    r: at(0),
    g: at(2),
    b: at(4),
    a: full.length === 8 ? at(6) / 255 : 1,
  };
}

/** Format `{ r, g, b, a }` as uppercase hex; alpha is omitted at a >= 0.999. */
export function formatHex({ r, g, b, a = 1 }) {
  const base = `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
  return a >= 0.999 ? base : base + toHex2(a * 255);
}

/** Normalize any accepted hex string, or return null. */
export function normalizeHex(value) {
  const rgba = parseHex(value);
  return rgba ? formatHex(rgba) : null;
}

/** `{ r, g, b }` → `{ h: 0-360, s: 0-100, v: 0-100 }`. */
export function rgbToHsv({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}

/** `{ h: 0-360, s: 0-100, v: 0-100 }` → `{ r, g, b }`. */
export function hsvToRgb(h, s, v) {
  const hue = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const vn = clamp(v, 0, 100) / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = vn - c;
  let rgb;
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 };
}

/** `{ r, g, b }` → `{ h: 0-360, s: 0-100, l: 0-100 }`. */
export function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

/** `{ h: 0-360, s: 0-100, l: 0-100 }` → `{ r, g, b }`. */
export function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = ln - c / 2;
  let rgb;
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 };
}

/** Return a copy of `color` with the given alpha, clamped to 0-1. */
export function withAlpha(color, a) {
  return { ...color, a: clamp(Number(a) || 0, 0, 1) };
}

/** Shortest distance between two colors, max |Δ| per channel r/g/b. */
export function channelDelta(a, b) {
  return Math.max(
    Math.abs(a.r - b.r),
    Math.abs(a.g - b.g),
    Math.abs(a.b - b.b),
  );
}
