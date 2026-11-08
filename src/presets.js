/**
 * Preset palettes.
 *
 * `text` is verbatim from `sop.md` §4, uppercase hex, spec order. Where `sop.md`
 * and `reference/modern-color-picker.html` disagree the spec wins (`Pastel`
 * differs).
 *
 * `background` is not the spec's §5 set any more: it is the 60-colour badge
 * palette from the sprints-planner app (`src/renderer/modules/assignee-color.js`,
 * `BADGE_COLORS`), which is why the colours are mid-light inks rather than pale
 * washes. The app stores `[L, C, H]` oklch triples and paints those strings; a
 * picker only speaks hex (`parseHex`, the editor, the contrast maths), so each
 * entry here is the exact sRGB rendering of its triple.
 *
 * The split is the palette's own, not a taste call: `Vivid` is every entry with
 * chroma above .08 (46), `Dusty` the fourteen at or below it — in the app that
 * low-chroma tail doubles as the Jira label-chip colours, the ones that must not
 * compete with a person's badge. Order inside each category is the app's slot
 * order, which is chosen so any prefix is as far apart as that many colours can
 * be; a picker grid does not need that, but keeping it makes the two lists
 * diffable against their source.
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
    ],
    Dusty: [
      '#9CBC91', '#D6A588', '#AA9CCB', '#6DB2BA', '#C993A6', '#ABA874', '#76C2B2',
      '#9DB0DF', '#C8A2CB', '#C69C6D', '#DA9FA4', '#7FAACE', '#82B291', '#C3AF7E',
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
    hint: 'The 60 badge inks — vivid for surfaces, dusty for labels.',
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
