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
 * Alpha is off → the colour must be opaque wherever it enters the class.
 * Applied to every entry path (constructor, `setColors`, preset/suggestion
 * clicks, editor commits), not only the ones that pass through the editor.
 */
export function clampAlpha(hex, showAlpha) {
  if (showAlpha !== false || typeof hex !== 'string') return hex;
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
