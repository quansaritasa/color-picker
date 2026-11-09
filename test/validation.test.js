import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveColors, resolveOptions, resolveSlots } from '../src/options.js';
import { mergePalette } from '../src/presets.js';

/** Run `fn` with `console.warn` captured; returns the messages. */
function warnings(fn) {
  const seen = [];
  const real = console.warn;
  console.warn = (message) => seen.push(message);
  try {
    fn();
  } finally {
    console.warn = real;
  }
  return seen;
}

test('options must be an object', () => {
  assert.throws(() => resolveOptions(null), /options must be an object, got null/);
  assert.throws(() => resolveOptions('modal'), /options must be an object, got string/);
  assert.equal(resolveOptions().mode, 'modal');
});

test('an unknown mode is named and falls back to auto', () => {
  let options;
  const seen = warnings(() => { options = resolveOptions({ mode: 'drawer' }); });
  assert.match(seen[0] || '', /unknown mode "drawer"/);
  assert.equal(options.mode, 'modal');
  assert.deepEqual(warnings(() => resolveOptions({ mode: 'popover' })), []);
});

test('a slot colour must be hex, and is normalized', () => {
  assert.throws(() => resolveSlots([{ id: 'a', color: 'red' }]), /slot "a" color must be a hex string, got "red"/);
  assert.throws(() => resolveSlots([{ id: 'a', color: 'url(x)' }]), /color must be a hex string/);
  assert.throws(() => resolveSlots([{ id: 'a', color: 42 }]), /color must be a hex string/);
  assert.equal(resolveSlots([{ id: 'a', color: '#abc' }])[0].color, '#AABBCC');
  assert.equal(resolveSlots([{ id: 'a', color: null }])[0].color, '#70B1ED');
});

test('an unknown presetSet is named and falls back to background', () => {
  let slots;
  const seen = warnings(() => { slots = resolveSlots([{ id: 'a', presetSet: 'txt' }]); });
  assert.match(seen[0] || '', /unknown presetSet "txt"/);
  assert.equal(slots[0].presetSet, 'background');
  assert.deepEqual(warnings(() => resolveSlots([{ id: 'a', presetSet: 'text' }])), []);
});

test('an invalid write keeps the current colour, not the declared one', () => {
  const slots = resolveSlots([{ id: 'a', color: '#111111' }]);
  const current = { a: '#222222' };
  assert.deepEqual(resolveColors({ a: 'nope' }, slots, true, current), { a: '#222222' });
  assert.deepEqual(resolveColors({ a: '#333' }, slots, true, current), { a: '#333333' });
});

test('a slot named after an Object.prototype key reads only its own values', () => {
  const slots = resolveSlots([{ id: 'toString', color: '#111111' }, { id: 'constructor' }], { tabs: {} });
  assert.deepEqual(slots.map((slot) => slot.label), ['toString', 'constructor']);
  assert.deepEqual(resolveColors({}, slots), { toString: '#111111', constructor: '#70B1ED' });
  assert.deepEqual(resolveColors({ toString: 'nope' }, slots, true, {}), { toString: '#111111', constructor: '#70B1ED' });
});

test('preset overrides must be arrays of hex colours', () => {
  assert.throws(() => mergePalette({}, { X: 'abc' }), /"X" must be an array/);
  assert.throws(() => mergePalette({}, { X: 5 }), /"X" must be an array/);
  assert.throws(() => mergePalette({}, { X: ['url(http://e)'] }), /"X" has an invalid colour "url\(http:\/\/e\)"/);
  assert.deepEqual(mergePalette({}, { X: ['#abc', '#7c3aed'] }), { X: ['#AABBCC', '#7C3AED'] });
});
