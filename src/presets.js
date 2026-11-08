/**
 * Preset palettes, verbatim from `sop.md` §4 (high contrast / text) and §5
 * (low contrast / background). Uppercase hex, spec order. Where `sop.md` and
 * `reference/modern-color-picker.html` disagree the spec wins (`Pastel` differs).
 */

export const DEFAULT_PRESETS = {
  highContrast: {
    Cool: ['#111827', '#1F2937', '#334155', '#475569', '#64748B', '#0F766E', '#115E59'],
    Blue: ['#1E3A8A', '#1D4ED8', '#2563EB', '#1E40AF', '#0369A1', '#075985', '#0C4A6E'],
    Hot: ['#991B1B', '#DC2626', '#E11D48', '#BE123C', '#C2410C', '#EA580C', '#9A3412'],
    Purple: ['#581C87', '#7E22CE', '#9333EA', '#6B21A8', '#6D28D9', '#5B21B6'],
    Green: ['#14532D', '#166534', '#15803D', '#047857', '#0F766E', '#065F46', '#3F6212'],
    Neutral: ['#000000', '#262626', '#404040', '#525252', '#737373', '#A3A3A3', '#FFFFFF'],
  },
  lowContrast: {
    Cool: ['#F0FDFA', '#CCFBF1', '#99F6E4', '#E6FFFB', '#D1FAE5', '#ECFDF5'],
    Blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#E0F2FE', '#BAE6FD', '#F0F9FF'],
    Warm: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FEF3C7', '#FDE68A', '#FFFBEB'],
    Neutral: ['#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#FAFAFA', '#F5F5F5'],
    Pastel: ['#FCE7F3', '#FBCFE8', '#F3E8FF', '#EDE9FE', '#FCE7F3', '#FFE4E6'],
    Green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#D1FAE5', '#ECFCCB', '#F7FEE7'],
  },
};

/**
 * Build a fresh presets object: the shipped palettes first, then `override`.
 * A category the override names **replaces** the shipped palette of that name
 * (spec §9's own example — `highContrast: { Cool: [...] }` — must take effect);
 * a name the defaults do not have is added after the shipped ones. Every array
 * is copied, so neither `defaults` nor the caller's config is mutated.
 */
export function mergePresets(defaults, override = {}) {
  const out = {};
  for (const mode of Object.keys(defaults)) {
    const merged = { ...defaults[mode], ...(override[mode] || {}) };
    out[mode] = Object.fromEntries(
      Object.entries(merged).map(([name, colors]) => [name, [...colors]]),
    );
  }
  return out;
}

/** Category names for one mode, in insertion order. */
export function categoriesOf(presets, mode) {
  return Object.keys(presets[mode] || {});
}
