import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHex } from '../src/color.js';
import { contrastRatio } from '../src/contrast.js';
import { PRESET_SETS } from '../src/presets.js';

const text = PRESET_SETS.text;

/* The six hue categories `sop.md` §4 shipped before the role split. */
const SPEC_TEXT = [
  '#111827', '#1F2937', '#334155', '#475569', '#64748B', '#0F766E', '#115E59',
  '#1E3A8A', '#1D4ED8', '#2563EB', '#1E40AF', '#0369A1', '#075985', '#0C4A6E',
  '#991B1B', '#DC2626', '#E11D48', '#BE123C', '#C2410C', '#EA580C', '#9A3412',
  '#581C87', '#7E22CE', '#9333EA', '#6B21A8', '#6D28D9', '#5B21B6',
  '#14532D', '#166534', '#15803D', '#047857', '#065F46', '#3F6212',
  '#000000', '#262626', '#404040', '#525252', '#737373', '#A3A3A3', '#FFFFFF',
];

test('the text set is grouped by role', () => {
  assert.deepEqual(Object.keys(text), ['Normal', 'Heading', 'Highlight']);
  assert.equal(text.Normal.length, 27);
  assert.equal(text.Heading.length, 27);
  assert.equal(text.Highlight.length, 36);
});

test('the text set keeps every colour the spec shipped, once', () => {
  const all = Object.values(text).flat();
  assert.equal(new Set(all).size, all.length, 'no colour in two categories');
  for (const hex of SPEC_TEXT) assert.ok(all.includes(hex), `${hex} kept`);
});

test('the text set carries pure black and pure white for body copy', () => {
  /* Black leads: `options.js` hands the first entry to a text slot with no
     colour of its own, so the order is a default, not only a layout. */
  assert.equal(text.Normal[0], '#000000');
  assert.ok(text.Normal.includes('#FFFFFF'));
});

test('every text colour reads on a light or a dark surface', () => {
  const light = parseHex('#FFFFFF');
  const dark = parseHex('#111827');
  for (const [name, list] of Object.entries(text)) {
    for (const hex of list) {
      const best = Math.max(contrastRatio(parseHex(hex), light), contrastRatio(parseHex(hex), dark));
      assert.ok(best >= 4.5, `${name} ${hex} → ${best.toFixed(2)}:1`);
    }
  }
});
