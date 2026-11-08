import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseHex,
  formatHex,
  normalizeHex,
  rgbToHsv,
  hsvToRgb,
  rgbToHsl,
  hslToRgb,
  withAlpha,
  channelDelta,
} from '../src/color.js';
import { PRESET_SETS, mergePalette, categoriesOf, categoriesWithAll, allColors, ALL_CATEGORY } from '../src/presets.js';

test('parseHex accepts 3, 4, 6 and 8 digit forms', () => {
  assert.deepEqual(parseHex('#abc'), { r: 0xaa, g: 0xbb, b: 0xcc, a: 1 });
  assert.deepEqual(parseHex('#abcd'), { r: 0xaa, g: 0xbb, b: 0xcc, a: 0xdd / 255 });
  assert.deepEqual(parseHex('#0F766E'), { r: 0x0f, g: 0x76, b: 0x6e, a: 1 });
  assert.equal(parseHex('#0F766E80').a, 128 / 255);
  assert.deepEqual(parseHex('0f766e'), parseHex('#0F766E'));
});

test('parseHex rejects malformed input', () => {
  for (const bad of ['#12', 'nope', '#GGGGGG', '', '#12345', null, undefined, 42]) {
    assert.equal(parseHex(bad), null, `expected null for ${String(bad)}`);
  }
});

test('parseHex → formatHex round-trips', () => {
  assert.equal(normalizeHex('#abc'), '#AABBCC');
  assert.equal(normalizeHex('#abcd'), '#AABBCCDD');
  assert.equal(normalizeHex('#0F766E'), '#0F766E');
  assert.equal(normalizeHex('#0F766E80'), '#0F766E80');
});

test('formatHex omits alpha at or above 0.999 and clamps channels', () => {
  assert.equal(formatHex({ r: 15, g: 118, b: 110, a: 0.999 }), '#0F766E');
  assert.equal(formatHex({ r: 15, g: 118, b: 110, a: 1 }), '#0F766E');
  // below the threshold alpha survives even when it rounds to FF
  assert.equal(formatHex({ r: 15, g: 118, b: 110, a: 0.9989 }), '#0F766EFF');
  assert.equal(formatHex({ r: 300, g: -20, b: 12.6 }), '#FF000D');
});

test('hsvToRgb(rgbToHsv(x)) round-trips within 1/255', () => {
  const samples = [
    '#000000', '#FFFFFF', '#0F766E', '#DC2626', '#2563EB', '#7E22CE',
    '#FFEDD5', '#FCE7F3', '#14532D', '#A3A3A3', '#3F6212', '#E11D48',
  ];
  for (const hex of samples) {
    const rgb = parseHex(hex);
    const { h, s, v } = rgbToHsv(rgb);
    const back = hsvToRgb(h, s, v);
    assert.ok(channelDelta(rgb, back) <= 1, `${hex} drifted: ${JSON.stringify(back)}`);
  }
});

test('rgbToHsl / hslToRgb round-trip incl. achromatic colors', () => {
  const samples = ['#000000', '#FFFFFF', '#808080', '#0F766E', '#DC2626', '#BFDBFE'];
  for (const hex of samples) {
    const rgb = parseHex(hex);
    const { h, s, l } = rgbToHsl(rgb);
    const back = hslToRgb(h, s, l);
    assert.ok(channelDelta(rgb, back) <= 1, `${hex} drifted: ${JSON.stringify(back)}`);
  }
});

test('hsv edge cases at black and zero saturation', () => {
  assert.deepEqual(rgbToHsv({ r: 0, g: 0, b: 0 }), { h: 0, s: 0, v: 0 });
  assert.equal(rgbToHsv({ r: 128, g: 128, b: 128 }).s, 0);
  assert.deepEqual(hsvToRgb(0, 0, 0), { r: 0, g: 0, b: 0 });
  assert.deepEqual(hsvToRgb(360, 100, 100), hsvToRgb(0, 100, 100));
});

test('withAlpha clamps to 0-1 and keeps rgb', () => {
  const base = { r: 15, g: 118, b: 110, a: 1 };
  assert.equal(withAlpha(base, 0.5).a, 0.5);
  assert.equal(withAlpha(base, 2).a, 1);
  assert.equal(withAlpha(base, -1).a, 0);
  assert.equal(withAlpha(base, 0.5).r, 15);
});

test('preset sets are uppercase 6-digit hex in spec shape', () => {
  const sets = Object.keys(PRESET_SETS);
  assert.deepEqual(sets, ['text', 'background']);
  /* `text` is the six spec categories; `background` is the badge palette split
     by chroma. Counts are pinned so neither set grows silently. */
  const counts = { text: 6, background: 2 };
  for (const set of sets) {
    assert.equal(categoriesOf(PRESET_SETS[set]).length, counts[set], `${set} category count`);
    for (const [name, values] of Object.entries(PRESET_SETS[set])) {
      assert.ok(Array.isArray(values), `${set}.${name} is an array`);
      for (const value of values) {
        assert.match(value, /^#[0-9A-F]{6}$/, `${set}.${name} → ${value}`);
      }
    }
  }
});

test('preset tables match sop.md §4/§5', () => {
  const text = PRESET_SETS.text;
  assert.deepEqual(text.Cool, ['#111827', '#1F2937', '#334155', '#475569', '#64748B', '#0F766E', '#115E59']);
  assert.deepEqual(text.Blue, ['#1E3A8A', '#1D4ED8', '#2563EB', '#1E40AF', '#0369A1', '#075985', '#0C4A6E']);
  assert.deepEqual(text.Hot, ['#991B1B', '#DC2626', '#E11D48', '#BE123C', '#C2410C', '#EA580C', '#9A3412']);
  assert.deepEqual(text.Purple, ['#581C87', '#7E22CE', '#9333EA', '#6B21A8', '#6D28D9', '#5B21B6']);
  assert.deepEqual(text.Green, ['#14532D', '#166534', '#15803D', '#047857', '#0F766E', '#065F46', '#3F6212']);
  assert.deepEqual(text.Neutral, ['#000000', '#262626', '#404040', '#525252', '#737373', '#A3A3A3', '#FFFFFF']);

  /* The background set is the sprints-planner badge palette (60 colours, sRGB
     of its oklch triples), split at chroma .08. Dusty is pinned whole because it
     is also that app's label-chip subset; Vivid is pinned at both ends and by
     count, with the union checked for duplicates below. */
  const background = PRESET_SETS.background;
  assert.equal(background.Vivid.length, 46);
  assert.deepEqual(background.Vivid.slice(0, 4), ['#70B1ED', '#F29B1D', '#EB77B6', '#51BF68']);
  assert.deepEqual(background.Vivid.slice(-3), ['#F3813F', '#6BA5FB', '#51CAA7']);
  assert.deepEqual(background.Dusty, [
    '#9CBC91', '#D6A588', '#AA9CCB', '#6DB2BA', '#C993A6', '#ABA874', '#76C2B2',
    '#9DB0DF', '#C8A2CB', '#C69C6D', '#DA9FA4', '#7FAACE', '#82B291', '#C3AF7E',
  ]);
});

test('the badge palette is 60 distinct colours across its two categories', () => {
  const { Vivid, Dusty } = PRESET_SETS.background;
  const all = [...Vivid, ...Dusty];
  assert.equal(all.length, 60);
  assert.equal(new Set(all).size, 60, 'no colour appears twice');
  assert.deepEqual(allColors(PRESET_SETS.background), all, 'All is the union in category order');
});

test('the text set carries pure black and pure white', () => {
  const { Neutral } = PRESET_SETS.text;
  assert.ok(Neutral.includes('#000000'));
  assert.ok(Neutral.includes('#FFFFFF'));
});

test('mergePalette replaces a named category and adds new ones', () => {
  const merged = mergePalette(PRESET_SETS.text, {
    Brand: ['#123456', '#654321'],
    Cool: ['#FFFFFF'],
  });
  // new categories land after the shipped ones
  assert.deepEqual(merged.Brand, ['#123456', '#654321']);
  assert.equal(categoriesOf(merged).length, 7);
  // spec §9's example: naming a shipped category replaces it, in place
  assert.deepEqual(merged.Cool, ['#FFFFFF']);
  assert.equal(categoriesOf(merged)[0], 'Cool');
  // every other shipped category survives
  assert.deepEqual(merged.Blue, PRESET_SETS.text.Blue);
  // the shipped tables are never mutated
  assert.equal(PRESET_SETS.text.Cool.length, 7);
  assert.ok(!('Brand' in PRESET_SETS.text));
  merged.Blue.push('#000000');
  assert.equal(PRESET_SETS.text.Blue.length, 7);
});

test('palette merging keeps shipped categories and adds new ones', () => {
  const merged = mergePalette(PRESET_SETS.background, { Brand: ['#7C3AED'] });
  assert.deepEqual(merged.Brand, ['#7C3AED']);
  assert.deepEqual(merged.Vivid, PRESET_SETS.background.Vivid);
  assert.deepEqual(merged.Dusty, PRESET_SETS.background.Dusty);
  assert.equal(categoriesOf(merged).length, 3);
  // the shipped table is never mutated
  assert.ok(!('Brand' in PRESET_SETS.background));
});

test('the All pill leads every palette, without becoming a category of it', () => {
  assert.deepEqual(categoriesWithAll(PRESET_SETS.text).slice(0, 2), [ALL_CATEGORY, 'Cool']);
  assert.equal(categoriesWithAll(PRESET_SETS.text).length, categoriesOf(PRESET_SETS.text).length + 1);
  assert.deepEqual(categoriesWithAll({}), []);
  // the shipped tables carry no such category
  assert.ok(!Object.values(PRESET_SETS).some((set) => ALL_CATEGORY in set));
});

test('allColors unions a palette in category order, de-duplicated', () => {
  const text = allColors(PRESET_SETS.text);
  assert.equal(text.length, new Set(text.map((hex) => hex.toUpperCase())).size);
  // `#0F766E` is shipped by Cool and by Green; it appears once, at Cool's position
  assert.equal(text.filter((hex) => hex === '#0F766E').length, 1);
  assert.equal(text.indexOf('#0F766E'), PRESET_SETS.text.Cool.indexOf('#0F766E'));
  assert.ok(text.length > PRESET_SETS.text.Cool.length);
  assert.deepEqual(allColors({}), []);
  // the background set is the 60 badge inks: no duplicate to collapse, so All is
  // the two categories read in order
  const background = allColors(PRESET_SETS.background);
  assert.deepEqual(background, [...PRESET_SETS.background.Vivid, ...PRESET_SETS.background.Dusty]);
  assert.deepEqual(background.slice(0, PRESET_SETS.background.Vivid.length), PRESET_SETS.background.Vivid);
});
