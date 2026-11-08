/**
 * Shell assembly: builds the panel DOM and the parts that read `picker.colors`.
 * Kept out of the class so `color-picker.js` stays inside the repo's 200-line
 * module rule; this file owns construction only, never state.
 */

import { buildTemplate } from './template.js';
import { createEditor } from './editor.js';
import { createCopy } from './copy.js';
import { GROUP_KEYS, PRESET_GROUPS, PRESET_SETS, mergePalette } from './presets.js';
import { createPresetPanel } from './presets-panel.js';
import { createSuggestions } from './suggestions.js';
import { createSwatches } from './swatches.js';
import { createPopover } from './popover.js';

export function assemble(picker) {
  const { options, slots } = picker;
  /* Both palettes are always offered; `labels.presets` renames a section. */
  const groupLabels = options.labels.presets || {};
  const groups = GROUP_KEYS.map((key) => ({ key, ...PRESET_GROUPS[key], label: groupLabels[key] || PRESET_GROUPS[key].label }));
  const built = buildTemplate({ slots, groups, showAlpha: options.showAlpha, labels: options.labels });
  picker.refs = built.refs;
  picker.root.append(built.root);
  /* One column per slot: the CSS cannot count them, so the template tells it. */
  picker.root.style.setProperty('--cp-slots', String(slots.length));
  if (options.mode === 'popover') picker.root.classList.add('cp-popover');
  (options.container || document.body).append(picker.root);

  picker.editor = createEditor(picker.refs, {
    showAlpha: options.showAlpha,
    onChange: (rgba) => picker.commit(rgba),
    onStatus: (message) => picker.setStatus(message),
  });

  picker.copy = createCopy({
    button: picker.refs.copy,
    label: options.labels.copy,
    getValue: () => picker.colors[picker.activeSlot],
    onStatus: (message) => picker.setStatus(message),
  });

  /* Each palette group gets its own categories; `presets` is keyed by group. */
  picker.palettes = {};
  for (const key of GROUP_KEYS) {
    picker.palettes[key] = mergePalette(PRESET_SETS[key], (options.presets || {})[key]);
  }
  picker.groups = groups;

  picker.panel = createPresetPanel({
    refs: picker.refs,
    groups,
    palettes: picker.palettes,
    onSelect: (hex) => picker.selectColor(hex, { source: 'preset' }),
  });
  picker.suggestions = createSuggestions({
    mount: picker.refs.suggestions,
    slots,
    pair: picker.pair,
    palettes: picker.palettes,
    enabled: options.showContrastSuggestions,
    onPick: (hex, slot) => picker.selectColor(hex, { source: 'suggestion', slot }),
  });

  picker.swatches = options.swatches
    ? createSwatches({ picker, target: options.swatches, slots, labels: options.labels })
    : null;
  picker.popover = options.mode === 'popover'
    ? createPopover({ panel: picker.refs.panel, getAnchor: () => picker.anchor })
    : null;
}
