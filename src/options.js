/**
 * Slots, option resolution and colour normalization for `ColorPicker`.
 *
 * A slot is one named colour the host paints somewhere; its `presetSet` only
 * hints at which palette to show, it never constrains what the user may pick.
 * `id` is the key the host sees in `initialColors`, `onChange` and `getColors`,
 * so the colour's name is also the answer to "which thing do I set?".
 */

import { formatHex, normalizeHex, parseHex } from './color.js';
import { PRESET_SETS } from './presets.js';

const ID_PATTERN = /^[A-Za-z][\w-]*$/;

/**
 * One colour by default. A host that wants the text/panel pair declares it,
 * because only the host knows what it paints; `presetSet` stays a hint.
 */
export const DEFAULT_SLOTS = [
  {
    id: 'color',
    label: 'Colour',
    symbol: '●',
    presetSet: 'text',
    color: '#0F766E',
  },
];

export const DEFAULTS = {
  container: null,
  slots: null,
  initialColors: null,
  activeSlot: null,
  showAlpha: true,
  showContrastSuggestions: false,
  /* Suggestions measure a pair: `['text', 'background']`. Without one they stay off. */
  contrastPair: null,
  draggable: true,
  theme: 'light',
  presets: null,
  classNames: '',
  labels: {},
  /* A host element (or selector) for the colour squares. See `createSwatches`. */
  swatches: null,
  /* 'auto' = popover when `swatches` renders the trigger, modal otherwise. */
  mode: 'auto',
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
 *
 * `mode` resolves here too: a popover is anchored to its trigger, so it is
 * never draggable, and an explicit `draggable` cannot re-enable the drag.
 */
export function resolveOptions(options = {}) {
  const picked = options.mode === 'popover' || options.mode === 'modal'
    ? options.mode
    : (options.swatches ? 'popover' : 'modal');
  return {
    ...DEFAULTS,
    ...options,
    mode: picked,
    draggable: picked === 'popover'
      ? false
      : options.draggable === undefined ? DEFAULTS.draggable : Boolean(options.draggable),
    showAlpha: options.showAlpha === undefined ? DEFAULTS.showAlpha : Boolean(options.showAlpha),
    labels: { ...DEFAULTS.labels, ...(options.labels || {}) },
  };
}

/** First colour of a set's first category — a slot's fallback when none is given. */
function firstPresetHex(set) {
  const palette = PRESET_SETS[set] || PRESET_SETS.panel;
  const first = palette[Object.keys(palette)[0]];
  return (first && first[0]) || '#000000';
}

/**
 * Normalize the slot list: ids are unique and usable as object keys, every
 * slot carries the label/symbol the tabs need, and `presetSet` records which
 * palette group is emphasised for it — a hint, never a restriction.
 */
export function resolveSlots(slots, labels = {}) {
  /* The shipped slot is the spec only when the caller named none — an explicit
     `labels.tabs` must still be able to rename it. */
  const usingDefaults = !(Array.isArray(slots) && slots.length);
  const list = usingDefaults ? DEFAULT_SLOTS : slots;
  const tabLabels = labels.tabs || {};
  const out = [];
  for (const raw of list) {
    const spec = typeof raw === 'string' ? { id: raw } : (raw || {});
    const explicit = usingDefaults ? {} : spec;
    const id = spec.id;
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
      throw new TypeError(`ColorPicker: slot id must match ${ID_PATTERN}, got ${JSON.stringify(id)}`);
    }
    if (out.some((slot) => slot.id === id)) {
      throw new TypeError(`ColorPicker: duplicate slot id "${id}"`);
    }
    const presetSet = spec.presetSet === 'text' ? 'text' : 'panel';
    const shipped = DEFAULT_SLOTS.find((slot) => slot.id === id) || {};
    const overrides = tabLabels[id] || {};
    out.push({
      id,
      label: explicit.label || overrides.title || shipped.label || id,
      hint: explicit.hint || overrides.hint || shipped.hint || '',
      symbol: explicit.symbol || shipped.symbol || id.charAt(0).toUpperCase(),
      presetSet,
      color: explicit.color || shipped.color || firstPresetHex(presetSet),
    });
  }
  return out;
}

/** Two distinct, existing slot ids, or `null` when no valid pair was given. */
export function resolvePair(pair, slotIds) {
  if (!Array.isArray(pair) || pair.length !== 2) return null;
  const [a, b] = pair;
  if (a === b || !slotIds.includes(a) || !slotIds.includes(b)) return null;
  return [a, b];
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

/** One valid colour per slot, falling back per slot rather than wholesale. */
export function resolveColors(values, slots, showAlpha = true) {
  const resolved = {};
  for (const slot of slots) {
    const raw = values && values[slot.id];
    const valid = (typeof raw === 'string' && normalizeHex(raw)) || slot.color;
    resolved[slot.id] = clampAlpha(valid, showAlpha);
  }
  return resolved;
}
