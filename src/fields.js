/**
 * Field triggers: the host's own inputs are the control, one slot each.
 * `<input data-color-picker>` is the whole wiring — the input's value *is* the
 * colour, so the host keeps its form, its name and its submit payload.
 *
 * Same adapter shape as `createTriggers`, so the class does not care which one
 * it is holding.
 */

import { normalizeHex } from './color.js';

/** Attributes a bound field carries while the picker owns it. */
const OWNED = {
  'aria-haspopup': 'dialog',
  'aria-expanded': 'false',
  autocomplete: 'off',
  spellcheck: 'false',
};

/**
 * Slots named after the fields themselves: `data-slot`, then the input's `id`,
 * then `color`/`color2` for an anonymous list. Inputs only — anything else the
 * selector matched is not a control.
 */
export function readFields(target) {
  const found = typeof target === 'string'
    ? [...document.querySelectorAll(target)]
    : (target instanceof Element ? [target] : [...(target || [])]);
  const inputs = found.filter((node) => node instanceof HTMLInputElement);
  if (found.length && !inputs.length) {
    console.warn('ColorPicker: `fields` matched no inputs — nothing to bind.');
  }
  return inputs.map((input, index) => {
    const id = input.dataset.slot || input.id || (index ? `color${index + 1}` : 'color');
    const label = input.dataset.label
      || input.getAttribute('aria-label')
      || (input.labels && input.labels[0] ? input.labels[0].textContent.trim() : '')
      || id;
    return { input, id, label, raw: input.value };
  });
}

/** The field list is the slot list; `presetSet` keeps the shipped default. */
export function fieldSlots(entries) {
  return entries.map(({ id, label }) => ({ id, label, presetSet: 'text' }));
}

export function createFields({ picker, entries, labels = {} }) {
  const names = labels.triggers || {};
  const nameOf = (entry) => (Object.hasOwn(names, entry.id) && names[entry.id]) || entry.label;
  const byId = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
  const undo = [];
  const on = (node, type, handler) => {
    node.addEventListener(type, handler);
    undo.push(() => node.removeEventListener(type, handler));
  };

  /** The one way a typed value enters the picker — or is visibly rejected. */
  const commit = (entry) => {
    const hex = normalizeHex(entry.input.value);
    if (!hex) {
      entry.input.setAttribute('aria-invalid', 'true');
      entry.input.value = picker.colors[entry.id];
      return;
    }
    entry.input.removeAttribute('aria-invalid');
    picker.selectColor(hex, { source: 'field', slot: entry.id });
  };

  for (const entry of entries) {
    const { input, id } = entry;
    /* Remember what the host had, so `destroy()` puts it back rather than
       leaving a bare attribute or deleting one the host set itself. */
    entry.saved = Object.keys(OWNED).map((name) => [name, input.getAttribute(name)]);
    for (const [name, value] of Object.entries(OWNED)) input.setAttribute(name, value);
    /* Never overwrite a name the host already gave the field. */
    if (!input.getAttribute('aria-label') && !(input.labels && input.labels.length)) {
      input.setAttribute('aria-label', `Edit ${nameOf(entry)}`);
      entry.ownedLabel = true;
    }

    on(input, 'click', () => {
      // A second click on the field that opened the panel closes it again.
      if (picker.isOpen && picker.activeSlot === id) {
        picker.close();
        return;
      }
      picker.setActiveSlot(id);
      picker.open(input);
    });
    /* A text input has no click for Enter, so the keyboard path opens here. */
    on(input, 'keydown', (event) => {
      if (event.key !== 'Enter' || picker.isOpen) return;
      event.preventDefault();
      picker.setActiveSlot(id);
      picker.open(input);
    });
    on(input, 'change', () => commit(entry));
  }

  return {
    element: null,
    anchorFor: (id) => (byId[id] ? byId[id].input : null),
    contains: (node) => entries.some((entry) => entry.input === node),
    render(colors) {
      for (const entry of entries) {
        const hex = colors[entry.id];
        if (entry.input.value === hex) continue;
        entry.input.value = hex;
        /* `input`, not `change`: a drag repaints every frame and a host's
           framework should see the live value, but `change` means "committed". */
        entry.input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
    /** `aria-expanded` follows the panel; only the field it opened on is on. */
    sync(open) {
      for (const entry of entries) {
        entry.input.setAttribute('aria-expanded', String(Boolean(open) && picker.activeSlot === entry.id));
      }
    },
    destroy() {
      for (const off of undo) off();
      for (const { input, ownedLabel, saved } of entries) {
        for (const [name, value] of saved) {
          if (value === null) input.removeAttribute(name);
          else input.setAttribute(name, value);
        }
        if (ownedLabel) input.removeAttribute('aria-label');
      }
    },
  };
}
