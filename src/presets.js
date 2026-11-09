/**
 * Preset palettes.
 *
 * `text` is grouped by role, not hue: `Normal` for body copy (greys, slates,
 * stones), `Heading` for headings and section titles (mostly blue and green),
 * `Highlight` for colourful emphasis. It is a superset of the six hue categories
 * `sop.md` §4 shipped. Every entry clears 4.5:1 against `#FFFFFF` or `#111827`,
 * so each one reads as body text on a light or a dark surface; the light rows
 * at the end of `Normal` and `Highlight` are the dark-surface ones.
 *
 * `background` is not the spec's §5 set any more: it is the badge palette from
 * the sprints-planner app (`src/renderer/modules/assignee-color.js`,
 * `BADGE_COLORS`), which is why the colours are mid-light inks rather than pale
 * washes. The app stores `[L, C, H]` oklch triples and paints those strings; a
 * picker only speaks hex (`parseHex`, the editor, the contrast maths), so each
 * entry here is the exact sRGB rendering of its triple.
 *
 * `Vivid` holds the badge palette's high-chroma half (46 inks, chroma above
 * .08) and this library's own deep tier (14, one per hue at oklch L .64 with
 * chroma pushed to the sRGB ceiling: 4.53-5.66:1 against `#111827`, dE00 >= 6.3
 * from every badge ink). The app's low-chroma tail (14 label-chip inks) is not
 * shipped: those hues already appear at the same lightness, so as a category
 * they were washed copies of colours the grid already had.
 *
 * Both background categories are sorted by oklch hue so neighbours look alike,
 * starting at `#70B1ED` (the first entry is the default background colour) and
 * walking blue, violet, pink, red, orange, yellow, green, teal, cyan. `Pale`
 * ends with its greys (chroma below .011), lightest first.
 *
 * `Pale` is the pale washes this group shipped before, merged into one
 * de-duplicated category, plus nine more — five in the old hue gaps and four
 * across red and orange, where the washes were thinnest. The contrast
 * suggestions rank partners out of this palette, and chip inks are the wrong
 * shape for that — see the note on the category itself.
 *
 * A set is only a *hint*: both sets are always on screen and a swatch writes the
 * slot the editor is showing, so any colour is valid for any slot.
 */

import { normalizeHex } from './color.js';

export const PRESET_SETS = {
  text: {
    /* Ordered so neighbours look alike: one tint family at a time, dark to light
       within it. `Normal` runs gray, slate, stone, neutral, then its light tail for
       dark surfaces; `#000000` leads it, and the first entry is what `options.js`
       hands a text slot with no colour of its own. The two coloured tabs walk the
       hue wheel; `Highlight` ends with its dark-surface row in the same hue order. */
    Normal: [
      '#000000', '#111827', '#1F2937', '#374151', '#4B5563', '#6B7280',
      '#020617', '#0F172A', '#1E293B', '#334155', '#475569', '#64748B', '#94A3B8',
      '#1C1917', '#292524', '#44403C', '#57534E',
      '#171717', '#262626', '#404040', '#525252', '#737373',
      '#A3A3A3', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#FFFFFF',
    ],
    Heading: [
      '#4C1D95', '#581C87', '#312E81', '#3730A3', '#172554', '#1E3A8A', '#1E40AF', '#1D4ED8',
      '#2563EB', '#0C4A6E', '#075985', '#0369A1', '#164E63', '#155E75', '#0E7490',
      '#134E4A', '#115E59', '#0F766E', '#064E3B', '#065F46', '#047857',
      '#052E16', '#14532D', '#166534', '#15803D', '#365314', '#3F6212',
    ],
    Highlight: [
      '#991B1B', '#B91C1C', '#DC2626', '#9A3412', '#C2410C', '#EA580C', '#B45309', '#A16207',
      '#CA8A04', '#4D7C0F', '#0D9488', '#0891B2', '#4F46E5', '#5B21B6', '#6D28D9', '#7C3AED',
      '#6B21A8', '#7E22CE', '#9333EA', '#A21CAF', '#C026D3', '#BE185D', '#DB2777', '#BE123C',
      '#E11D48', '#FDA4AF', '#F87171', '#FB923C', '#FBBF24', '#FACC15', '#A3E635', '#34D399',
      '#22D3EE', '#60A5FA', '#A78BFA', '#F472B6',
    ],
  },
  background: {
    Vivid: [
      '#70B1ED', '#3189FD', '#6BA5FB', '#90AEFE', '#8AA2E4', '#8D9BFB', '#8075FD',
      '#B0A5F2', '#BC90FF', '#BB8FDE', '#B94BFD', '#D78FF6', '#D180E1', '#D995D9',
      '#E70CD0', '#F186D4', '#D289BB', '#EB77B6', '#E197BC', '#FF82B2', '#FA0C86',
      '#E183A1', '#F67591', '#F290A2', '#FE8B82', '#FE2832', '#DC8C81', '#F87868',
      '#FE8F5D', '#F3813F', '#D76807', '#DE8F57', '#F29B1D', '#DCA65E', '#DB940E',
      '#B88007', '#C4A040', '#D6AB1B', '#9B8F08', '#BDB55D', '#B1A92B', '#BAB818',
      '#93B25A', '#6C9E08', '#8AC652', '#51BF68', '#78C687', '#0BA75D', '#10D095',
      '#55BB96', '#51CAA7', '#0BA28F', '#39BAB4', '#09CBC5', '#1FB8CF', '#0A9DB2',
      '#04C4F0', '#6DBEDC', '#0A96D6', '#0EB0FD',
    ],
    /* The pale washes the group used to ship, kept as one category because the
       contrast suggestions rank partners out of this palette: none of the 60
       badge inks clears 4.5:1 against a mid-tone text like #0F766E, so without a
       pale set the suggestions panel has nothing to offer for such a pair. The
       old six categories are merged and de-duplicated here, with five more washes
       in the hue gaps and four across red and orange — 43 colours, then 17 more across every hue so it matches
       `Vivid` at 60. Contrast against #0F766E is what caps the set: a wash light enough to stay useful
       there has little chroma left to spend, so the red/orange four sit at
       3.78-5.00:1, inside the range the merged washes already covered. */
    Pale: [
      '#BFDBFE', '#EFF6FF', '#DBEAFE', '#D3DFF3', '#EDE9FE', '#E0D8FD', '#F3E8FF',
      '#F0D1FF', '#EAD7E8', '#FCE7F3', '#FBCFE8', '#FFE4E6', '#FEF2F2', '#FECACA',
      '#F1D7D2', '#FDE4CF', '#FFDAB9', '#FED7AA', '#FFF7ED', '#FFEDD5', '#F0DDA9',
      '#FDEAB6', '#FFFBEB', '#FEF3C7', '#FDE68A', '#E2DFC9', '#FBF6AE', '#EDF0BA',
      '#DCE4AF', '#F7FEE7', '#ECFCCB', '#E6F0D3', '#D5F9BA', '#CDE7C7', '#F0FDF4',
      '#BBF7D0', '#DCFCE7', '#B6EDCE', '#D1FAE5', '#ECFDF5', '#BAFBE8', '#D8F2EA',
      '#BCE9DC', '#99F6E4', '#F0FDFA', '#CCFBF1', '#E6FFFB', '#A6EDF0', '#A8FAFF',
      '#C8E4E7', '#CDF5FF', '#BAE6FD', '#F0F9FF', '#E0F2FE', '#FAFAFA', '#F9FAFB',
      '#F5F5F5', '#F3F4F6', '#E5E7EB', '#D1D5DB',
    ],
  },
};

/**
 * One palette, shipped categories first then `override`.
 * A category the override names **replaces** the shipped one and keeps its
 * position; a new name is appended. Every array is copied, so neither the
 * shipped tables nor the caller's config is mutated.
 *
 * Every entry is normalized to uppercase hex, and anything else throws: a
 * swatch paints its value into `style.background`, so a non-colour would
 * render a dead button at best and fetch a `url(...)` at worst.
 */
export function mergePalette(base = {}, override = {}) {
  const merged = { ...base, ...override };
  return Object.fromEntries(Object.entries(merged).map(([name, colors]) => {
    if (!Array.isArray(colors)) {
      throw new TypeError(`ColorPicker: preset category "${name}" must be an array of hex colours.`);
    }
    return [name, colors.map((hex) => {
      const valid = normalizeHex(hex);
      if (!valid) throw new TypeError(`ColorPicker: preset category "${name}" has an invalid colour ${JSON.stringify(hex)}.`);
      return valid;
    })];
  }));
}

/**
 * The two palettes the panel always offers. They are suggestions, not owners:
 * a swatch click writes whichever slot the editor is showing, so a pale panel
 * colour can be applied to text when that is what the host wants.
 */
export const PRESET_GROUPS = {
  text: {
    label: 'Text colour presets',
    /* Short name a slot tab shows as its type; a slot may override it. */
    type: 'Text',
    symbol: 'Aa',
    hint: 'Body copy, headings and highlights, for text and icons.',
  },
  background: {
    label: 'Background colour presets',
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
 * Every colour of one palette in category order, de-duplicated — the same hex
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
