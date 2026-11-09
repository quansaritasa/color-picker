/**
 * DOM template for the picker shell. Structure and class names mirror
 * `reference/modern-color-picker.html:141-196`; no state, no behaviour.
 * Tabs and preset sections are built from `slots`, so one template serves any
 * number of colors; `presets-panel.js` fills the sections.
 */

import { attr, button, el, icon } from './dom.js';
import { FORMATS } from './color.js';

/** Ids must be unique per instance: two pickers can share a page, and so can two
    copies of this module (src and dist), each with its own counter. */
const moduleId = Math.random().toString(36).slice(2, 7);
let dialogCount = 0;

/* Shipped strings. `maximize`/`restore` are the two names of the same toggle,
   so the geometry module reads them from here instead of repeating a default. */
export const LABELS = {
  title: 'Choose Color',
  close: 'Close',
  reset: 'Reset',
  cancel: 'Cancel',
  apply: 'OK',
  hex: 'Hex color value',
  format: 'Color format',
  hue: 'Hue',
  opacity: 'Opacity',
  sv: 'Saturation and brightness',
  svHint: 'Drag, or use the arrow keys: left and right change saturation, up and down change brightness. Hold Shift for larger steps.',
  slotsLabel: 'Color type',
  copy: 'Copy HEX',
  maximize: 'Maximize',
  restore: 'Restore',
  compact: 'Compact view',
};

export function buildTemplate({ slots = [], groups = [], showAlpha = true, labels = {} } = {}) {
  const L = { ...LABELS, ...labels };
  const refs = {};

  const heading = el('div', 'cp-heading');
  const title = el('h2', null, L.title);
  title.id = `cp-title-${moduleId}-${++dialogCount}`;
  heading.append(el('div', 'cp-app-icon', '◉'), title);
  /* Reset, maximize and close are all icon buttons in the header: there is no
     footer strip to hold a labelled action. */
  const reset = button('cp-reset-btn', '↺', { 'aria-label': L.reset, title: L.reset });
  /* One button, two names: `maximize.js` swaps the icon and the label. */
  const maximize = button('cp-maximize-btn', undefined, { 'aria-label': L.maximize, title: L.maximize });
  maximize.append(
    icon('M10 2.5h3.5V6M13.5 2.5 9.5 6.5M6 13.5H2.5V10M2.5 13.5 6.5 9.5', 'cp-icon-expand'),
    icon('M13.5 9.5H10V6M10 9.5 13.5 6M2.5 6.5H6V10M6 6.5 2.5 10', 'cp-icon-collapse'),
  );
  /* A toggle: `aria-pressed` carries its state, `bindings.js` flips it. */
  const compact = button('cp-compact-btn', undefined, { 'aria-label': L.compact, title: L.compact, 'aria-pressed': 'false' });
  compact.append(icon('M8 1.5v4M6 3.5l2 2 2-2M8 14.5v-4M6 12.5l2-2 2 2M2.5 8h11', 'cp-icon-compact'));
  const format = attr(el('select', 'cp-format-select'), { 'aria-label': L.format });
  for (const name of FORMATS) {
    const option = el('option', null, name.toUpperCase());
    option.value = name;
    format.append(option);
  }
  const close = button('cp-close-btn', '×', { 'aria-label': L.close, title: L.close });
  const headerActions = el('div', 'cp-header-actions');
  headerActions.append(format, reset, compact, maximize, close);
  const header = el('header', 'cp-picker-header');
  header.append(heading, headerActions);

  /* One slot means nothing to switch to, so the tablist is not rendered at all
     rather than showing a single dead tab. */
  let tabs = null;
  refs.tabs = [];
  if (slots.length > 1) {
    tabs = attr(el('div', 'cp-tabs'), { role: 'tablist', 'aria-label': L.slotsLabel });
    refs.tabs = slots.map((slot) => {
      const tab = button('cp-tab', undefined, { role: 'tab', 'aria-selected': 'false' });
      tab.dataset.slot = slot.id;
      /* The hint is a tooltip, not a line: the visible second line carries the
         slot's type, so two tabs of one group differ by name and still read as
         the same kind of color. */
      if (slot.hint) tab.title = slot.hint;
      const body = el('span', 'cp-tab-body');
      body.append(el('strong', null, slot.label));
      if (slot.type) body.append(el('small', 'cp-tab-type', slot.type));
      tab.append(el('span', 'cp-tab-symbol', slot.symbol), body);
      tabs.append(tab);
      return tab;
    });
  }

  const svThumb = el('span', 'cp-sv-thumb');
  const sv = attr(el('div', 'cp-sv'), {
    role: 'slider',
    'aria-label': L.sv,
    'aria-description': L.svHint,
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': '87',
    tabindex: '0',
  });
  sv.append(svThumb);
  const svWrap = el('div', 'cp-sv-wrap');
  svWrap.append(sv);

  const hex = attr(el('input', 'cp-hex-input'), { 'aria-label': L.hex, spellcheck: 'false' });
  const preview = el('div', 'cp-color-preview');
  /* Copy overlays the field's right edge instead of taking a slot beside it, so
     the input keeps the whole row. `copy.js` fills its glyph; template places it. */
  const copy = button('cp-copy-btn', undefined, { 'aria-label': L.copy, title: L.copy });
  copy.dataset.copied = 'false';
  const hexField = el('div', 'cp-hex-field');
  hexField.append(hex, copy);
  const hexRow = el('div', 'cp-hex-row');
  hexRow.append(preview, hexField);

  const range = (name, max) => {
    const label = el('div', 'cp-range-label');
    const value = el('span');
    label.append(el('span', null, name), value);
    const input = attr(el('input'), { min: '0', max, 'aria-label': name });
    input.type = 'range';
    const block = el('div', 'cp-range-block');
    block.append(label, input);
    return { block, input, value };
  };
  const hue = range(L.hue, 360);
  const alpha = range(L.opacity, 100);
  hue.block.classList.add('cp-hue-range');
  alpha.block.classList.add('cp-alpha-range');
  if (!showAlpha) alpha.block.hidden = true;

  const side = el('div', 'cp-editor-side');
  side.append(hexRow, hue.block, alpha.block);
  const editor = attr(el('section', 'cp-editor'), { 'aria-label': 'Custom color editor' });
  editor.append(svWrap, side);

  const presets = el('section', 'cp-presets');
  const sections = {};
  /* One section per palette group — both always rendered, so a pale color is
     always one click away even while composing text. */
  for (const group of groups) {
    const sectionTitle = el('div', 'cp-section-title');
    sectionTitle.append(el('span', 'cp-section-icon', group.symbol), el('strong', null, group.label));
    const categories = el('div', 'cp-category-row');
    const swatches = el('div', 'cp-swatches');
    const section = el('div', 'cp-preset-section');
    section.dataset.group = group.key;
    section.append(sectionTitle, categories, swatches, el('p', 'cp-section-hint', group.hint));
    presets.append(section);
    sections[group.key] = { section, categories, swatches };
  }

  /**
   * Screen-reader live region only — the visible status line was redundant with
   * the HEX field. A rejected HEX is also marked on the field itself.
   */
  const status = attr(el('p', 'cp-status'), { 'aria-live': 'polite' });
  const actions = el('div', 'cp-actions');
  actions.append(button('cp-secondary-btn', L.cancel), button('cp-primary-btn', L.apply));
  const footer = el('footer', 'cp-footer');
  footer.append(actions);

  /** Empty band under the presets; `suggestions.js` fills it when enabled. */
  const suggestions = el('div', 'cp-suggestions-band');

  const picker = attr(el('div', 'cp-picker'), {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': title.id,
  });
  /* The panel itself never scrolls: the body does, so the resize grip stays in
     the corner of the box instead of travelling with the content. */
  const body = el('div', 'cp-picker-body');
  body.append(header, ...(tabs ? [tabs] : []), editor, el('div', 'cp-divider'), presets, suggestions, status, footer);
  /* Pointer-only affordance — `m` is the keyboard way to change the box. */
  const grip = attr(el('span', 'cp-resize-grip'), { 'aria-hidden': 'true' });
  picker.append(body, grip);

  Object.assign(refs, {
    panel: picker,
    body,
    header,
    grip,
    compact,
    maximize,
    sv,
    svThumb,
    preview,
    hex,
    format,
    hue: hue.input,
    hueValue: hue.value,
    alpha: alpha.input,
    alphaValue: alpha.value,
    alphaBlock: alpha.block,
    status,
    reset,
    copy,
    cancel: actions.firstElementChild,
    apply: actions.lastElementChild,
    close,
    suggestions,
    sections,
  });

  return { root: picker, refs };
}
