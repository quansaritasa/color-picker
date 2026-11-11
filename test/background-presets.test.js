import test from 'node:test';
import assert from 'node:assert/strict';

import { PRESET_SETS, allColors } from '../src/presets.js';

test('background preset tables', () => {
  /* The background set is the sprints-planner badge palette (all 60
     colors, sRGB of its oklch triples) plus this library's deep tier at L .64,
     sorted by hue. The deep tier is pinned whole because it is the part this
     library authored; the union is checked for duplicates below. */
  const background = PRESET_SETS.background;
  assert.equal(background.Vivid.length, 90);
  assert.equal(background.Vivid[0], '#70B1ED', 'the default background color leads');
  for (const hex of [
    '#FA0C86', '#FE2832', '#D76807', '#B88007', '#9B8F08', '#6C9E08', '#0BA75D',
    '#0BA28F', '#0A9DB2', '#0A96D6', '#3189FD', '#8075FD', '#B94BFD', '#E70CD0',
  ]) assert.ok(background.Vivid.includes(hex), `deep tier ${hex}`);
  /* The app's low-chroma tail ships inside Vivid, not as its own category. */
  for (const hex of ['#6DB2BA', '#9DB0DF', '#C993A6', '#DA9FA4']) assert.ok(background.Vivid.includes(hex), `dusty ${hex}`);
  assert.ok(!('Dusty' in background));
  /* The pale washes, merged into one category and de-duplicated, so the contrast
     suggestions still have partners for a mid-tone text color; five of them are
     the additions in the hue gaps the merged set left empty. */
  assert.equal(background.Pale.length, 90);
  for (const hex of ['#FBF6AE', '#E6F0D3', '#D5F9BA', '#A8FAFF', '#CDF5FF']) assert.ok(background.Pale.includes(hex), hex);
  assert.deepEqual(background.Pale.slice(-6), ['#FAFAFA', '#F9FAFB', '#F5F5F5', '#F3F4F6', '#E5E7EB', '#D1D5DB'], 'greys last');
  assert.equal(new Set(background.Pale).size, 90, 'no color twice in Pale');
});

test('the badge palette is 90 distinct colors across its two categories', () => {
  const { Vivid, Pale } = PRESET_SETS.background;
  assert.equal(new Set(Vivid).size, 90, 'Vivid repeats no color');
  assert.deepEqual(allColors(PRESET_SETS.background).slice(0, 90), Vivid, 'All starts with Vivid');
  assert.equal(allColors(PRESET_SETS.background).length, 180, 'All is the 90 vivid plus the 90 pale washes');
  assert.equal(new Set([...Vivid, ...Pale]).size, 180, 'the two categories share no color');
});
