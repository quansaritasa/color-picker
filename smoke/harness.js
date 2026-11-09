/**
 * Shared state for the browser smoke run: the check log, the picker most
 * sections drive, and `handoff` for the few instances one part hands the next.
 * `index.html` imports the parts in order, then calls `finish()`.
 */

import ColorPicker from '../src/color-picker.js';
import { PRESET_SETS, allColors } from '../src/presets.js';

export { ColorPicker, PRESET_SETS, allColors };

const out = [];
let failures = 0;

export const check = (name, ok, detail = '') => {
  if (!ok) failures += 1;
  out.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
};
export const rootOf = (picker) => picker.root;
export const q = (picker, sel) => picker.root.querySelector(sel);

/* Most checks need the pair; only the default-slot check takes the shipped
   single slot, so the helper declares the pair unless the caller overrides. */
export const PAIR = [
  { id: 'text', label: 'Text colour', symbol: 'Aa', presetSet: 'text' },
  { id: 'background', label: 'Panel background', symbol: '▰', presetSet: 'background' },
];
export const mk = (options = {}) => new ColorPicker(Object.assign({ slots: PAIR }, options));

export const events = [];
export const picker = mk({
  initialColors: { text: '#0F766E', background: '#70B1ED' },
  onChange: (c) => events.push(['change', c]),
  onApply: (c) => events.push(['apply', c]),
  onCancel: (c) => events.push(['cancel', c]),
  onOpen: (c) => events.push(['open', c]),
  onClose: (c) => events.push(['close', c]),
});

/** Instances one part creates and a later part still uses. */
export const handoff = {};

/** Publish the log; the title is what a runner reads. */
export function finish() {
  document.title = failures ? `FAIL ${failures}` : 'PASS';
  document.getElementById('results').textContent = out.join('\n');
}
