/**
 * Shell assembly: builds the panel DOM and the parts that read `picker.colors`.
 * Kept out of the class so `color-picker.js` stays inside the repo's 200-line
 * module rule; this file owns construction only, never state.
 */

import { buildTemplate } from './template.js';
import { createEditor } from './editor.js';
import { createCopy } from './copy.js';
import { GROUP_KEYS, PRESET_GROUPS, PRESET_SETS, mergePalette, shippedPalette } from './presets.js';
import { createPresetPanel } from './presets-panel.js';
import { createSuggestions } from './suggestions.js';
import { createTriggers } from './triggers.js';
import { createFields } from './fields.js';
import { createPopover } from './popover.js';

export function assemble(picker) {
  const { options, slots } = picker;
  /* Both `container` and `triggers` take an element or a selector. A selector
     that matches nothing must not throw inside `append`, so name it and fall
     back — the picker still works, just where the caller did not ask. */
  const host = (() => {
    if (!options.container) return document.body;
    if (options.container instanceof Element) return options.container;
    if (typeof options.container !== 'string') {
      console.warn('ColorPicker: `container` must be an element or a selector — mounting on document.body.');
      return document.body;
    }
    const found = document.querySelector(options.container);
    if (!found) console.warn(`ColorPicker: container "${options.container}" matches nothing — mounting on document.body.`);
    return found || document.body;
  })();
  /* Both palettes are always offered; `labels.cp-presets` renames a section. */
  const groupLabels = options.labels.presets || {};
  const groups = GROUP_KEYS.map((key) => ({ key, ...PRESET_GROUPS[key], label: groupLabels[key] || PRESET_GROUPS[key].label }));
  const built = buildTemplate({ slots, groups, showAlpha: options.showAlpha, labels: options.labels });
  picker.refs = built.refs;
  picker.root.append(built.root);
  /* One column per slot: the CSS cannot count them, so the template tells it. */
  picker.root.style.setProperty('--cp-slots', String(slots.length));
  if (options.mode === 'popover') picker.root.classList.add('cp-popover');
  host.append(picker.root);

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
    const override = (options.presets || {})[key];
    picker.palettes[key] = override ? mergePalette(PRESET_SETS[key], override) : shippedPalette(key);
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

  /* A field list *is* the control surface: the host's inputs are the triggers.
     Otherwise a `triggers` host gets the bar; with neither, the host owns the
     trigger and calls `open()`. */
  picker.triggers = null;
  if (options.fieldEntries.length) {
    picker.triggers = createFields({ picker, entries: options.fieldEntries, labels: options.labels });
  } else if (options.triggers) {
    picker.triggers = createTriggers({ picker, target: options.triggers, slots, labels: options.labels });
  }
  picker.popover = options.mode === 'popover'
    ? createPopover({ panel: picker.refs.panel, getAnchor: () => picker.anchor })
    : null;
}
