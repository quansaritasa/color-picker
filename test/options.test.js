import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SLOTS,
  clampAlpha,
  resolveColors,
  resolveOptions,
  resolvePair,
  resolveSlots,
} from '../src/options.js';

test('showAlpha normalizes to one boolean at construction', () => {
  assert.equal(resolveOptions({}).showAlpha, true);
  assert.equal(resolveOptions({ showAlpha: undefined }).showAlpha, true);
  assert.equal(resolveOptions({ showAlpha: false }).showAlpha, false);
  assert.equal(resolveOptions({ showAlpha: 0 }).showAlpha, false);
  assert.equal(resolveOptions({ showAlpha: null }).showAlpha, false);
  assert.equal(resolveOptions({ showAlpha: 'yes' }).showAlpha, true);
});

test('clampAlpha reads the same predicate as the template and the editor', () => {
  assert.equal(clampAlpha('#00FF0040', resolveOptions({ showAlpha: 0 }).showAlpha), '#00FF00');
  assert.equal(clampAlpha('#00FF0040', resolveOptions({}).showAlpha), '#00FF0040');
  assert.equal(clampAlpha('#00FF0040', false), '#00FF00');
});

test('resolveOptions keeps the caller labels and adds the defaults', () => {
  const options = resolveOptions({ labels: { title: 'Pick' } });
  assert.equal(options.labels.title, 'Pick');
  assert.equal(options.theme, 'light');
});

test('mode follows the trigger: triggers mean popover, nothing means modal', () => {
  assert.equal(resolveOptions({}).mode, 'modal');
  assert.equal(resolveOptions({ triggers: '#bar' }).mode, 'popover');
  assert.equal(resolveOptions({ mode: 'auto', triggers: '#bar' }).mode, 'popover');
  assert.equal(resolveOptions({ mode: 'modal', triggers: '#bar' }).mode, 'modal');
  assert.equal(resolveOptions({ mode: 'popover' }).mode, 'popover');
  assert.equal(resolveOptions({ mode: 'nonsense' }).mode, 'modal');
});

test('a field list is both the slot list and the trigger', () => {
  const fields = [
    { id: 'brand', label: 'Brand', raw: '#0F766E', input: null },
    { id: 'accent', label: 'Accent', raw: 'nope', input: null },
  ];
  const options = resolveOptions({ fields: '[data-picker]' }, fields);
  assert.equal(options.mode, 'popover');
  assert.deepEqual(options.slots.map((slot) => slot.id), ['brand', 'accent']);
  assert.deepEqual(options.startColors, { brand: '#0F766E', accent: 'nope' });
  // the field's own value seeds the colour; an invalid one falls back per slot
  const slots = resolveSlots(options.slots, options.labels);
  assert.deepEqual(resolveColors(options.startColors, slots), { brand: '#0F766E', accent: '#000000' });
  assert.throws(() => resolveOptions({ fields: '#x', slots: ['a'] }, fields), /drop `slots`/);
});

test('a popover is movable and resizable like a modal', () => {
  assert.equal(resolveOptions({}).draggable, true);
  assert.equal(resolveOptions({ draggable: 0 }).draggable, false);
  assert.equal(resolveOptions({ triggers: '#bar', draggable: true }).draggable, true);
  assert.equal(resolveOptions({ mode: 'modal', triggers: '#bar' }).draggable, true);
  // The anchor places the box on open; the user may still move and resize it.
  assert.equal(resolveOptions({}).resizable, true);
  assert.equal(resolveOptions({ triggers: '#bar' }).resizable, true);
  assert.equal(resolveOptions({ resizable: 0 }).resizable, false);
});

test('no slots means a single colour slot', () => {
  const slots = resolveSlots();
  assert.deepEqual(slots.map((slot) => slot.id), ['color']);
  assert.equal(slots[0].label, 'Colour');
  assert.equal(slots[0].presetSet, 'text');
  assert.equal(slots[0].color, '#0F766E');
  assert.equal(resolveSlots(null).length, 1);
  assert.equal(resolveSlots([]).length, 1);
  assert.deepEqual(resolveSlots(DEFAULT_SLOTS), slots);
});

test('a slot that names no preset set borrows the background palette', () => {
  const [accent] = resolveSlots([{ id: 'accent' }]);
  assert.equal(accent.presetSet, 'background');
  assert.equal(accent.label, 'accent');
  assert.equal(accent.symbol, 'A');
  // the palette's first colour is the fallback, not text's — and the background
  // palette now opens on the badge inks, so its first entry is a mid blue
  assert.equal(accent.color, '#70B1ED');
  assert.equal(resolveSlots([{ id: 'ink', presetSet: 'text' }])[0].color, '#000000');
});

test('a slot keeps its own label, symbol and hint', () => {
  const [brand] = resolveSlots([{
    id: 'brand',
    label: 'Brand accent',
    symbol: '✦',
    hint: 'Buttons and links',
    presetSet: 'text',
  }]);
  assert.equal(brand.label, 'Brand accent');
  assert.equal(brand.symbol, '✦');
  assert.equal(brand.hint, 'Buttons and links');
  assert.equal(brand.presetSet, 'text');
  // a palette belongs to a group, never to a slot
  assert.ok(!('presets' in brand) && !('presetsTitle' in brand) && !('presetsHint' in brand));
});

test('a tab type follows the preset group unless the slot or labels name one', () => {
  // derived: the group's short name, and a slot with no group borrows background
  assert.equal(resolveSlots([{ id: 'ink', presetSet: 'text' }])[0].type, 'Text');
  assert.equal(resolveSlots([{ id: 'surface', presetSet: 'background' }])[0].type, 'Background');
  assert.equal(resolveSlots([{ id: 'accent' }])[0].type, 'Background');
  assert.equal(resolveSlots()[0].type, 'Text');
  // overridable per slot, or through labels.tabs, with the slot winning
  assert.equal(resolveSlots([{ id: 'edge', type: 'Border' }])[0].type, 'Border');
  assert.equal(resolveSlots([{ id: 'edge' }], { tabs: { edge: { type: 'Ink' } } })[0].type, 'Ink');
  assert.equal(resolveSlots([{ id: 'edge', type: 'Border' }], { tabs: { edge: { type: 'Ink' } } })[0].type, 'Border');
});

test('two slots may share one preset group, type and all', () => {
  const slots = resolveSlots([
    { id: 'page', label: 'Page', presetSet: 'background' },
    { id: 'card', label: 'Card', presetSet: 'background' },
  ]);
  assert.deepEqual(slots.map((slot) => [slot.id, slot.label, slot.presetSet, slot.type]), [
    ['page', 'Page', 'background', 'Background'],
    ['card', 'Card', 'background', 'Background'],
  ]);
});

test('labels.tabs still names a slot', () => {
  const [first] = resolveSlots(null, { tabs: { color: { title: 'Ink', hint: 'Body copy', type: 'Surface' } } });
  assert.equal(first.label, 'Ink');
  assert.equal(first.hint, 'Body copy');
  assert.equal(first.type, 'Surface');
});

test('slot ids must be usable keys and unique', () => {
  assert.throws(() => resolveSlots([{ id: '2fa' }]), /slot id must match/);
  assert.throws(() => resolveSlots([{ id: '' }]), /slot id must match/);
  assert.throws(() => resolveSlots([{}]), /slot id must match/);
  assert.throws(() => resolveSlots([{ id: 'a' }, { id: 'a' }]), /duplicate slot id/);
  assert.equal(resolveSlots([{ id: 'a-b' }, { id: 'c_d' }]).length, 2);
});

test('resolvePair only accepts two existing, distinct slots', () => {
  const ids = ['text', 'background', 'accent'];
  assert.deepEqual(resolvePair(['text', 'background'], ids), ['text', 'background']);
  assert.equal(resolvePair(['text', 'accent'], ids)[1], 'accent');
  assert.equal(resolvePair(null, ids), null);
  assert.equal(resolvePair('text', ids), null);
  assert.equal(resolvePair(['text'], ids), null);
  assert.equal(resolvePair(['text', 'text'], ids), null);
  assert.equal(resolvePair(['text', 'nope'], ids), null);
});

test('resolveColors keys by slot id, per-slot fallback, alpha honoured', () => {
  const slots = resolveSlots([{ id: 'text', color: '#0F766E' }, { id: 'accent', color: '#123456' }]);
  const colors = resolveColors({ text: '#ABCDEF', accent: 'nope' }, slots);
  assert.deepEqual(colors, { text: '#ABCDEF', accent: '#123456' });
  assert.deepEqual(resolveColors({}, slots, false), { text: '#0F766E', accent: '#123456' });
  assert.deepEqual(resolveColors({ text: '#ABCDEF80' }, slots, false), { text: '#ABCDEF', accent: '#123456' });
  // a key no slot declared is dropped, never carried into getColors()
  assert.deepEqual(Object.keys(resolveColors({ ghost: '#000000' }, slots)), ['text', 'accent']);
});
