/**
 * Preset palettes, verbatim from `sop.md` §4 (`text` set) and §5 (`panel` set).
 * Uppercase hex, spec order. Where `sop.md` and
 * `reference/modern-color-picker.html` disagree the spec wins (`Pastel` differs).
 *
 * A set is only a *hint*: both sets are always on screen and a swatch writes the
 * slot the editor is showing, so any colour is valid for any slot.
 */

export const PRESET_SETS = {
  text: {
    Cool: ['#111827', '#1F2937', '#334155', '#475569', '#64748B', '#0F766E', '#115E59'],
    Blue: ['#1E3A8A', '#1D4ED8', '#2563EB', '#1E40AF', '#0369A1', '#075985', '#0C4A6E'],
    Hot: ['#991B1B', '#DC2626', '#E11D48', '#BE123C', '#C2410C', '#EA580C', '#9A3412'],
    Purple: ['#581C87', '#7E22CE', '#9333EA', '#6B21A8', '#6D28D9', '#5B21B6'],
    Green: ['#14532D', '#166534', '#15803D', '#047857', '#0F766E', '#065F46', '#3F6212'],
    Neutral: ['#000000', '#262626', '#404040', '#525252', '#737373', '#A3A3A3', '#FFFFFF'],
  },
  panel: {
    Cool: ['#F0FDFA', '#CCFBF1', '#99F6E4', '#E6FFFB', '#D1FAE5', '#ECFDF5'],
    Blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#E0F2FE', '#BAE6FD', '#F0F9FF'],
    Warm: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FEF3C7', '#FDE68A', '#FFFBEB'],
    Neutral: ['#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#FAFAFA', '#F5F5F5'],
    Pastel: ['#FCE7F3', '#FBCFE8', '#F3E8FF', '#EDE9FE', '#FCE7F3', '#FFE4E6'],
    Green: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#D1FAE5', '#ECFCCB', '#F7FEE7'],
  },
};

/**
 * One palette, shipped categories first then `override`.
 * A category the override names **replaces** the shipped one and keeps its
 * position; a new name is appended. Every array is copied, so neither the
 * shipped tables nor the caller's config is mutated.
 */
export function mergePalette(base = {}, override = {}) {
  const merged = { ...base, ...override };
  return Object.fromEntries(
    Object.entries(merged).map(([name, colors]) => [name, [...colors]]),
  );
}

/**
 * The two palettes the panel always offers. They are suggestions, not owners:
 * a swatch click writes whichever slot the editor is showing, so a pale panel
 * colour can be applied to text when that is what the host wants.
 */
export const PRESET_GROUPS = {
  text: {
    label: 'Text colour presets',
    symbol: 'Aa',
    hint: 'Designed for text, icons, and foreground elements.',
  },
  panel: {
    label: 'Panel colour presets',
    symbol: '▰',
    hint: 'Soft colors for panels, chips, and badges.',
  },
};

/** Groups in display order; the panel renders one section per entry. */
export const GROUP_KEYS = ['text', 'panel'];

/** The palette the other group offers — used by the contrast suggestions. */
export const OTHER_GROUP = { text: 'panel', panel: 'text' };

/** Category names for one palette, in insertion order. */
export function categoriesOf(palette = {}) {
  return Object.keys(palette);
}
