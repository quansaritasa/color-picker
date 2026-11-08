/**
 * Option defaults and color normalization for `ColorPicker`.
 * Kept out of the class so the class file stays inside the 200-line rule.
 */

import { formatHex, normalizeHex, parseHex } from './color.js';

export const TABS = ['highContrast', 'lowContrast'];

export const DEFAULTS = {
  container: null,
  initialColors: { highContrast: '#0F766E', lowContrast: '#CCFBF1' },
  activeTab: 'highContrast',
  showAlpha: true,
  showContrastSuggestions: false,
  theme: 'light',
  presets: null,
  classNames: '',
  labels: {},
  onChange: null,
  onApply: null,
  onCancel: null,
  onOpen: null,
  onClose: null,
};

/**
 * One predicate for `showAlpha`, applied once at construction: the class, the
 * template, the editor and `clampAlpha` all read the same boolean, so a value
 * like `0` cannot hide the slider while the colour keeps its alpha.
 */
export function resolveOptions(options = {}) {
  return {
    ...DEFAULTS,
    ...options,
    showAlpha: options.showAlpha === undefined ? DEFAULTS.showAlpha : Boolean(options.showAlpha),
    labels: { ...DEFAULTS.labels, ...(options.labels || {}) },
  };
}

/**
 * Alpha is off → the colour must be opaque wherever it enters the class.
 * Applied to every entry path (constructor, `setColors`, preset/suggestion
 * clicks, editor commits), not only the ones that pass through the editor.
 */
export function clampAlpha(hex, showAlpha) {
  if (showAlpha || typeof hex !== 'string') return hex;
  const rgba = parseHex(hex);
  return rgba ? formatHex({ ...rgba, a: 1 }) : hex;
}

/** One valid color per tab, falling back per tab rather than wholesale. */
export function resolveColors(values, fallback, showAlpha = true) {
  const resolved = {};
  for (const tab of TABS) {
    const raw = values && values[tab];
    const valid = (typeof raw === 'string' && normalizeHex(raw)) || fallback[tab];
    resolved[tab] = clampAlpha(valid, showAlpha);
  }
  return resolved;
}
