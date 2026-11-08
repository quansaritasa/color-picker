import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHex } from '../src/color.js';
import {
  compositeOver,
  contrastRatio,
  formatRatio,
  relativeLuminance,
  suggestPartners,
  wcagLevel,
} from '../src/contrast.js';

const hex = (value) => parseHex(value);
const near = (actual, expected, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);

test('relativeLuminance spans 0 to 1', () => {
  near(relativeLuminance(hex('#000000')), 0, 1e-9);
  near(relativeLuminance(hex('#FFFFFF')), 1, 1e-9);
  // Mid grey is far below 0.5 in linear light — the usual off-by-a-formula trap.
  near(relativeLuminance(hex('#808080')), 0.2158, 0.0002);
});

test('contrastRatio: black on white is 21:1', () => {
  near(contrastRatio(hex('#000000'), hex('#FFFFFF')), 21);
});

test('contrastRatio is 1 for identical colors and symmetric', () => {
  near(contrastRatio(hex('#0F766E'), hex('#0F766E')), 1, 1e-9);
  near(contrastRatio(hex('#0F766E'), hex('#CCFBF1')), contrastRatio(hex('#CCFBF1'), hex('#0F766E')), 1e-12);
});

test('contrastRatio pins the shipped default pair', () => {
  // The plan guessed a 4.4-4.6 band for #0F766E on #CCFBF1; the sRGB curve gives
  // 4.857, so the test pins the computed value rather than the estimate. It is
  // still AA for normal text, which is what the panel reports.
  near(contrastRatio(hex('#0F766E'), hex('#CCFBF1')), 4.857, 0.005);
});

test('wcagLevel applies the AA / AAA / AA-large thresholds', () => {
  assert.equal(wcagLevel(21), 'AAA');
  assert.equal(wcagLevel(7), 'AAA');
  assert.equal(wcagLevel(4.5), 'AA');
  assert.equal(wcagLevel(4.49), 'fail');
  assert.equal(wcagLevel(3, { largeText: true }), 'AA-large');
  assert.equal(wcagLevel(3), 'fail');
  assert.equal(wcagLevel(2.99, { largeText: true }), 'fail');
});

test('alpha is composited over the opposing surface before measuring', () => {
  const translucent = hex('#00000080');
  assert.deepEqual(compositeOver(translucent, hex('#FFFFFF')), { r: 127, g: 127, b: 127 });
  near(
    contrastRatio(translucent, hex('#FFFFFF')),
    contrastRatio(hex('#7F7F7F'), hex('#FFFFFF')),
    1e-9,
  );
  // A translucent background is composited the same way, from the other side.
  near(
    contrastRatio(hex('#FFFFFF'), hex('#00000080')),
    contrastRatio(hex('#FFFFFF'), hex('#7F7F7F')),
    1e-9,
  );
});

test('compositeOver leaves opaque colors untouched', () => {
  assert.deepEqual(compositeOver(hex('#0F766E'), hex('#FFFFFF')), { r: 15, g: 118, b: 110 });
});

test('suggestPartners filters, ranks and limits', () => {
  const partners = suggestPartners(hex('#FFFFFF'), ['#111827', '#F9FAFB', '#CCFBF1', '#000000', '#111827']);
  assert.ok(partners.length > 0);
  for (const partner of partners) assert.ok(partner.ratio >= 4.5, `${partner.hex} is below 4.5:1`);
  for (let i = 1; i < partners.length; i += 1) assert.ok(partners[i - 1].ratio >= partners[i].ratio);
  assert.equal(new Set(partners.map((p) => p.hex)).size, partners.length, 'duplicates were dropped');
  assert.ok(!partners.some((p) => p.hex === '#F9FAFB'), 'a 1.07:1 partner was offered');
  assert.deepEqual(partners[0], { hex: '#000000', ratio: 21, level: 'AAA' });
});

test('suggestPartners honours limit and accepts rgba objects', () => {
  const candidates = ['#000000', '#111827', '#1F2937', '#334155', hex('#475569')];
  assert.equal(suggestPartners(hex('#FFFFFF'), candidates).length, 3);
  assert.equal(suggestPartners(hex('#FFFFFF'), candidates, { limit: 5 }).length, 5);
  assert.deepEqual(suggestPartners(hex('#FFFFFF'), []), []);
  assert.equal(suggestPartners(hex('#FFFFFF'), ['#zzzzzz', null]).length, 0);
});

test('formatRatio is one decimal', () => {
  assert.equal(formatRatio(21), '21.0:1');
  assert.equal(formatRatio(4.857254204872252), '4.9:1');
  assert.equal(formatRatio(1), '1.0:1');
});
