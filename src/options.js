/**
 * Option defaults and color normalization for `ColorPicker`.
 * Kept out of the class so the class file stays inside the 200-line rule.
 */

import { normalizeHex } from './color.js';

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

/** One valid color per tab, falling back per tab rather than wholesale. */
export function resolveColors(values, fallback) {
  const resolved = {};
  for (const tab of TABS) {
    const raw = values && values[tab];
    resolved[tab] = (typeof raw === 'string' && normalizeHex(raw)) || fallback[tab];
  }
  return resolved;
}
