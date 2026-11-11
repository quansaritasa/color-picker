/**
 * Palette helpers: merging overrides onto the shipped sets, group metadata and
 * category lists. The shipped colors themselves live in `preset-sets.js`.
 */

import { normalizeHex } from './color.js';
import { PRESET_SETS } from './preset-sets.js';

export { PRESET_SETS };

/**
 * One palette, shipped categories first then `override`.
 * A category the override names **replaces** the shipped one and keeps its
 * position; a new name is appended. Every array is copied, so neither the
 * shipped tables nor the caller's config is mutated.
 *
 * Every entry is normalized to uppercase hex, and anything else throws: a
 * swatch paints its value into `style.background`, so a non-color would
 * render a dead button at best and fetch a `url(...)` at worst.
 */
export function mergePalette(base = {}, override = {}) {
  const merged = { ...base, ...override };
  return Object.fromEntries(Object.entries(merged).map(([name, colors]) => {
    if (!Array.isArray(colors)) {
      throw new TypeError(`ColorPicker: preset category "${name}" must be an array of hex colors.`);
    }
    return [name, colors.map((hex) => {
      const valid = normalizeHex(hex);
      if (!valid) throw new TypeError(`ColorPicker: preset category "${name}" has an invalid color ${JSON.stringify(hex)}.`);
      return valid;
    })];
  }));
}

/* Instances without a `presets` override all share one validated, frozen copy
   of the shipped palette instead of each parsing and copying ~210 colors. */
const shipped = {};
export function shippedPalette(group) {
  if (!shipped[group]) {
    const merged = mergePalette(PRESET_SETS[group]);
    for (const list of Object.values(merged)) Object.freeze(list);
    shipped[group] = Object.freeze(merged);
  }
  return shipped[group];
}

/**
 * The two palettes the panel always offers. They are suggestions, not owners:
 * a swatch click writes whichever slot the editor is showing, so a pale panel
 * color can be applied to text when that is what the host wants.
 */
export const PRESET_GROUPS = {
  text: {
    label: 'Text color presets',
    /* Short name a slot tab shows as its type; a slot may override it. */
    type: 'Text',
    symbol: 'Aa',
    hint: 'Body copy, headings and highlights, for text and icons.',
  },
  background: {
    label: 'Background color presets',
    type: 'Background',
    symbol: '▰',
    hint: 'The badge inks and their deep tier, plus the pale washes.',
  },
};

/** Groups in display order; the panel renders one section per entry. */
export const GROUP_KEYS = ['text', 'background'];

/** The palette the other group offers — used by the contrast suggestions. */
export const OTHER_GROUP = { text: 'background', background: 'text' };

/** Category names for one palette, in insertion order. */
export function categoriesOf(palette = {}) {
  return Object.keys(palette);
}

/**
 * The synthetic `All` pill every section leads with: one grid holding the union
 * of the section's categories, so the whole palette is one click away instead of
 * one pill per category. It is not a category in the data — no palette owns it.
 */
export const ALL_CATEGORY = 'All';

/** Pills for one palette: `All` first, then the shipped categories. */
export function categoriesWithAll(palette = {}) {
  const names = Object.keys(palette);
  return names.length ? [ALL_CATEGORY, ...names] : [];
}

/**
 * Every color of one palette in category order, de-duplicated — the same hex
 * may be shipped in more than one category (a host palette can repeat one), and the
 * union grid must show it once.
 */
export function allColors(palette = {}) {
  const seen = new Set();
  const out = [];
  for (const list of Object.values(palette)) {
    for (const hex of list) {
      const key = String(hex).toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(hex);
    }
  }
  return out;
}
