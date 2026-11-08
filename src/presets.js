/**
 * Preset palettes.
 *
 * `text` is verbatim from `sop.md` §4, uppercase hex, spec order. Where `sop.md`
 * and `reference/modern-color-picker.html` disagree the spec wins (`Pastel`
 * differs).
 *
 * `background` is not the spec's §5 set any more: it is the badge palette from
 * the sprints-planner app (`src/renderer/modules/assignee-color.js`,
 * `BADGE_COLORS`), which is why the colours are mid-light inks rather than pale
 * washes. The app stores `[L, C, H]` oklch triples and paints those strings; a
 * picker only speaks hex (`parseHex`, the editor, the contrast maths), so each
 * entry here is the exact sRGB rendering of its triple.
 *
 * The first 46 `Vivid` entries are the badge palette's high-chroma half (chroma
 * above .08), in the app's slot order: chosen so any prefix is as far apart as
 * that many colours can be, which a picker grid does not need but which keeps the
 * list diffable against its source. The app's low-chroma tail (14 label-chip
 * inks) is not shipped: those hues already appear above at the same lightness, so
 * as a category they were washed copies of colours the grid already had.
 *
 * The 14 entries after them are this library's own deep tier, one per hue at
 * oklch L .64 with chroma pushed to the sRGB ceiling. `Vivid` before this was one
 * lightness band (.72-.76) whose chroma topped out at .16, so the tier is the
 * first genuinely saturated step in the palette: measured 4.53-5.66:1 against
 * `#111827`, dE00 >= 6.3 from every entry above it.
 *
 * `Pale` is the pale washes this group shipped before, merged into one
 * de-duplicated category, plus five more. The contrast suggestions rank partners
 * out of this palette, and chip inks are the wrong shape for that — see the note
 * on the category itself.
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
  background: {
    Vivid: [
      '#70B1ED', '#F29B1D', '#EB77B6', '#51BF68', '#BC90FF', '#09CBC5', '#F87868',
      '#BAB818', '#D995D9', '#F290A2', '#C4A040', '#8D9BFB', '#93B25A', '#55BB96',
      '#04C4F0', '#DE8F57', '#10D095', '#8AC652', '#D180E1', '#B0A5F2', '#0EB0FD',
      '#FE8F5D', '#F67591', '#DC8C81', '#78C687', '#BDB55D', '#DCA65E', '#1FB8CF',
      '#D6AB1B', '#6DBEDC', '#BB8FDE', '#F186D4', '#D289BB', '#FF82B2', '#FE8B82',
      '#B1A92B', '#90AEFE', '#DB940E', '#D78FF6', '#E183A1', '#39BAB4', '#E197BC',
      '#8AA2E4', '#F3813F', '#6BA5FB', '#51CAA7',
      /* The deep tier: one hue per 25.7 degrees at oklch L .64, chroma at the
         sRGB ceiling for that hue. The 46 above are the app's mid-light band
         (.72-.76, chroma <= .16); these sit below it and are the only entries
         saturated past .20. 4.53-5.66:1 against #111827, so they still take dark
         text; dE00 >= 6.3 from the nearest entry above. */
      '#FA0C86', '#FE2832', '#D76807', '#B88007', '#9B8F08', '#6C9E08', '#0BA75D',
      '#0BA28F', '#0A9DB2', '#0A96D6', '#3189FD', '#8075FD', '#B94BFD', '#E70CD0',
    ],
    /* The pale washes the group used to ship, kept as one category because the
       contrast suggestions rank partners out of this palette: none of the 60
       badge inks clears 4.5:1 against a mid-tone text like #0F766E, so without a
       pale set the suggestions panel has nothing to offer for such a pair. The
       old six categories are merged and de-duplicated here, with five more washes
       in the hue gaps — 39 colours. The 4.5:1 bar against #0F766E is what caps
       it: a wash light enough to clear it has little chroma left to spend, and
       more additions than these five land within dE00 2.6 of one already here. */
    Pale: [
      '#F0FDFA', '#CCFBF1', '#99F6E4', '#E6FFFB', '#D1FAE5', '#ECFDF5', '#EFF6FF',
      '#DBEAFE', '#BFDBFE', '#E0F2FE', '#BAE6FD', '#F0F9FF', '#FFF7ED', '#FFEDD5',
      '#FED7AA', '#FEF3C7', '#FDE68A', '#FFFBEB', '#F9FAFB', '#F3F4F6', '#E5E7EB',
      '#D1D5DB', '#FAFAFA', '#F5F5F5', '#FCE7F3', '#FBCFE8', '#F3E8FF', '#EDE9FE',
      '#FFE4E6', '#F0FDF4', '#DCFCE7', '#BBF7D0', '#ECFCCB', '#F7FEE7',
      '#FBF6AE', '#E6F0D3', '#D5F9BA', '#A8FAFF', '#CDF5FF',
    ],
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
    /* Short name a slot tab shows as its type; a slot may override it. */
    type: 'Text',
    symbol: 'Aa',
    hint: 'Designed for text, icons, and foreground elements.',
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
 * is shipped in more than one category (`#0F766E` is Cool and Green), and the
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
