import test from 'node:test';
import assert from 'node:assert/strict';

import { clampAlpha, resolveOptions } from '../src/options.js';

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
