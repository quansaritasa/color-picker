/**
 * Preset palettes.
 *
 * `text` is grouped by role, not hue: `Normal` for body copy (greys, slates,
 * stones), `Heading` for headings and section titles (mostly blue and green),
 * `Highlight` for colorful emphasis. It is a superset of the six hue categories
 * `sop.md` §4 shipped. Every entry clears 4.5:1 against `#FFFFFF` or `#111827`,
 * so each one reads as body text on a light or a dark surface; the light rows
 * at the end of `Normal` and `Highlight` are the dark-surface ones.
 *
 * Each text tab got 30 more, picked farthest-first against every text color
 * and sorted into the tab's order below: `Normal` greys up to
 * oklch chroma .045 (dE00 >= 9.3 apart), `Heading` hues 130-310 at L .26-.54
 * that clear 4.5:1 on white (dE00 >= 6.1), `Highlight` chroma .12 and up
 * (dE00 >= 9.2). Highlight then lost three near-duplicates it already had:
 * `#FBBF24` (next to `#EAB308`), `#7C3AED` (`#9333EA`), `#A3E635` (`#BEF264`).
 *
 * `background` is not the spec's §5 set any more: it is the badge palette from
 * the sprints-planner app (`src/renderer/modules/assignee-color.js`,
 * `BADGE_COLORS`), which is why the colors are mid-light inks rather than pale
 * washes. The app stores `[L, C, H]` oklch triples and paints those strings; a
 * picker only speaks hex (`parseHex`, the editor, the contrast maths), so each
 * entry here is the exact sRGB rendering of its triple.
 *
 * `Vivid` (90) holds all 60 badge inks: the high-chroma 46 and the app's
 * low-chroma tail (14 label-chip inks, chroma .08 and below). On top sit this
 * library's own deep tier (14, oklch L .64 with chroma pushed to the sRGB
 * ceiling: 4.53-5.66:1 against `#111827`, dE00 >= 6.3 from every badge ink) and
 * 16 fill-ins at L .70-.76, chroma .10-.16, each picked farthest-first from the
 * rest (dE00 >= 6.0 from every other entry, >= 4.5:1 against `#111827`).
 *
 * Both background categories are sorted by oklch hue so neighbours look alike,
 * starting at `#70B1ED` (the first entry is the default background color) and
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
 * slot the editor is showing, so any color is valid for any slot.
 */

export const PRESET_SETS = {
  text: {
    /* Ordered so neighbours look alike, the same way in every tab: the colors that
       read on white first, then the light tail for dark surfaces. Each part walks
       one tint family at a time (20° oklch hue buckets from 250°: blue, violet,
       pink, red, orange, yellow, green, teal, cyan; greys last), dark to light
       within it. `#000000` leads `Normal`: the first entry is what `options.js`
       hands a text slot with no color of its own. */
    Normal: [
      '#000000', '#020617', '#050A18', '#0A1128', '#0F172A', '#111827', '#0D1B2A', '#111B33',
      '#0B1B3A', '#14213D', '#1B263B', '#1F2937', '#1E293B', '#1E2A44', '#1B2A49', '#22304A',
      '#2B3A55', '#334155', '#374151', '#364A6B', '#475569', '#4B5563', '#6B7280', '#64748B',
      '#544E66', '#786F89', '#483242', '#745A6A', '#250E14', '#3C2519', '#5E423D', '#81655A',
      '#594732', '#756B51', '#312B13', '#131904', '#424F3F', '#5F665A', '#687B64', '#476061',
      '#597C7E', '#171717', '#1C1917', '#292524', '#262626', '#404040', '#44403C', '#525252',
      '#57534E', '#737373', '#94A3B8', '#DCDAF8', '#BFB1CB', '#FEDEEC', '#CFADB2', '#E2C3B5',
      '#C2B69B', '#F5E6CA', '#C3D0B4', '#EFF5DF', '#D5FBF5', '#9AC0C0', '#CEEEFE', '#A9C6D8',
      '#A3A3A3', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#FFFFFF',
    ],
    Heading: [
      '#172554', '#1E3A5F', '#1E3A8A', '#1E40AF', '#1A57AD', '#1D4ED8', '#4A6DA0', '#2563EB',
      '#1E1B4B', '#18188C', '#393558', '#312E81', '#3730A3', '#4D4B82', '#4338CA', '#555E96',
      '#67678E', '#645BBE', '#311344', '#2E1065', '#342241', '#3B0764', '#4D2368', '#4C1D95',
      '#581C87', '#553D72', '#6F458C', '#6244A5', '#6C5A7F', '#7959A5', '#8946BA', '#1A2E05',
      '#083E13', '#04510E', '#344A29', '#365314', '#3F6212', '#4B6341', '#056F15', '#537842',
      '#052E16', '#064E3B', '#0F5132', '#14532D', '#065F46', '#166534', '#3B654F', '#047857',
      '#15803D', '#487764', '#022C22', '#134E4A', '#115E59', '#0F766E', '#042F2E', '#01434C',
      '#225C63', '#027A84', '#083344', '#164E63', '#155E75', '#366C77', '#0E7490', '#0A3D62',
      '#0C4A6E', '#075985', '#0369A1', '#4A718B',
    ],
    Highlight: [
      '#4F46E5', '#5B21B6', '#6B21A8', '#6D28D9', '#7E22CE', '#9333EA', '#701A75', '#86198F',
      '#A21CAF', '#C026D3', '#94116A', '#9E4F80', '#CE0999', '#9D174D', '#BE185D', '#DB2777',
      '#7F1D1D', '#881337', '#991B1B', '#B91C1C', '#BE123C', '#B35851', '#DC2626', '#E11D48',
      '#78350F', '#9A3412', '#92400E', '#C2410C', '#B45309', '#854D0E', '#A16207', '#4D7C0F',
      '#60A5FA', '#93C5FD', '#818CF8', '#9B63F5', '#A78BFA', '#C084FC', '#AE6EB0', '#E879F9',
      '#DDA9F7', '#CA5E96', '#E741C4', '#CF88C8', '#F472B6', '#F9A8D4', '#FF5387', '#C66878',
      '#EF4444', '#F87171', '#FDA4AF', '#EA580C', '#D0765A', '#F97316', '#F99B7E', '#BF7439',
      '#FB923C', '#FDBA74', '#CA8A04', '#F59E0B', '#EAB308', '#8F8214', '#B69836', '#B8B351',
      '#FACC15', '#D9DB7B', '#FDE047', '#8F9B3C', '#C0CC0E', '#BEF264', '#0C9B33', '#65A30A',
      '#75AD62', '#22C55E', '#84CC16', '#9DD384', '#2FFD70', '#3B9F6D', '#34D399', '#6EE7B7',
      '#0D9488', '#2DB396', '#2DD4BF', '#15BBBD', '#67E8F9', '#0891B2', '#0BAEC8', '#22D3EE',
      '#1086D3', '#38BDF8',
    ],
  },
  background: {
    Vivid: [
      '#70B1ED', '#3189FD', '#6BA5FB', '#9DB0DF', '#90AEFE', '#8AA2E4', '#8D9BFB',
      '#8075FD', '#9B8BFB', '#B0A5F2', '#AA9CCB', '#BC90FF', '#BB8FDE', '#B94BFD',
      '#D78FF6', '#D180E1', '#BC89C3', '#C8A2CB', '#D995D9', '#E70CD0', '#F186D4',
      '#D289BB', '#EB77B6', '#E197BC', '#C993A6', '#FF82B2', '#FA0C86', '#E183A1',
      '#F67591', '#F290A2', '#D5848E', '#DA9FA4', '#E8777A', '#FE8B82', '#FE2832',
      '#DC8C81', '#F87868', '#DD8364', '#E89B80', '#FE8F5D', '#F3813F', '#D76807',
      '#D6A588', '#DE8F57', '#FC933C', '#E58212', '#CF8F43', '#F29B1D', '#C69C6D',
      '#DCA65E', '#DB940E', '#B88007', '#C4A040', '#C3AF7E', '#D6AB1B', '#AF9F52',
      '#9B8F08', '#BDB55D', '#ABA874', '#B1A92B', '#BAB818', '#ADBC48', '#92AC18',
      '#93B25A', '#6C9E08', '#8AC652', '#9CBC91', '#69B54C', '#7FAD70', '#51BF68',
      '#78C687', '#0BA75D', '#82B291', '#10D095', '#55BB96', '#51CAA7', '#76C2B2',
      '#0BA28F', '#39BAB4', '#09CBC5', '#30C7D1', '#6DB2BA', '#1FB8CF', '#0A9DB2',
      '#04C4F0', '#6DBEDC', '#37ACD9', '#0A96D6', '#0EB0FD', '#7FAACE',
    ],
    /* The pale washes the group used to ship, kept as one category because the
       contrast suggestions rank partners out of this palette: none of the 60
       badge inks clears 4.5:1 against a mid-tone text like #0F766E, so without a
       pale set the suggestions panel has nothing to offer for such a pair. The
       old six categories are merged and de-duplicated here, with five more washes
       in the hue gaps and four across red and orange — 43 colors, then 17 more across every hue, then
       30 more picked farthest-first (oklch L .88-.96, chroma .03-.075, dE00 >= 4.1 from every other
       entry, >= 3.78:1 against #0F766E) so it matches `Vivid` at 90. Contrast against #0F766E is what
       caps the set: a wash light enough to stay useful there has little chroma left to spend, so the
       red/orange four sit at 3.78-5.00:1, inside the range the merged washes already covered. */
    Pale: [
      '#BFDBFE', '#EFF6FF', '#DBEAFE', '#D3DFF3', '#CFD6F6', '#D8D4EA', '#EDE9FE',
      '#E0D8FD', '#F3E8FF', '#E8D6F4', '#F0D1FF', '#FCE1FC', '#EAD7E8', '#FDCCF4',
      '#FCE7F3', '#FBCFE8', '#F9D2DC', '#FFE4E6', '#FEF2F2', '#FECACA', '#F1D7D2',
      '#FDE6DB', '#F1D0BE', '#FDE4CF', '#FFDAB9', '#E5D4C3', '#FED7AA', '#FFF7ED',
      '#FFEDD5', '#FAE1B8', '#E7D5B7', '#F0DDA9', '#FDEAB6', '#F0E4C3', '#FFFBEB',
      '#FEF3C7', '#FDE68A', '#E2DFC9', '#DFDAAC', '#FBF6AE', '#EFEECB', '#EDF0BA',
      '#D7DBBA', '#DCE4AF', '#F7FEE7', '#ECFCCB', '#E6F0D3', '#C7E2AE', '#D5F9BA',
      '#CDE7C7', '#DCFDD8', '#DFF1DF', '#B8E5BA', '#CBDDCD', '#F0FDF4', '#BBF7D0',
      '#DCFCE7', '#C0E1CC', '#B6EDCE', '#D1FAE5', '#ECFDF5', '#A4E8D2', '#BAFBE8',
      '#D8F2EA', '#BCE9DC', '#C4DED7', '#99F6E4', '#F0FDFA', '#CCFBF1', '#E6FFFB',
      '#9EE8DF', '#B0FCF4', '#B6E1E0', '#D0FCFD', '#A6EDF0', '#A8FAFF', '#C8E4E7',
      '#CDF5FF', '#A4EBFE', '#B7DFEB', '#BAE6FD', '#C5DBE9', '#F0F9FF', '#E0F2FE',
      '#FAFAFA', '#F9FAFB', '#F5F5F5', '#F3F4F6', '#E5E7EB', '#D1D5DB',
    ],
  },
};
