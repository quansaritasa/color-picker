/**
 * DOM template for the picker shell. Structure and class names mirror
 * `reference/modern-color-picker.html:141-196`; no state, no behaviour.
 * Tabs and preset sections are built from `slots`, so one template serves any
 * number of colours; `presets-panel.js` fills the sections.
 */

/** Ids must be unique per instance: two pickers can share a page. */
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
  hue: 'Hue',
  opacity: 'Opacity',
  sv: 'Saturation and brightness',
  svHint: 'Drag, or use the arrow keys: left and right change saturation, up and down change brightness. Hold Shift for larger steps.',
  slotsLabel: 'Color type',
  copy: 'Copy HEX',
  maximize: 'Maximize',
  restore: 'Restore',
};

export function buildTemplate({ slots = [], groups = [], showAlpha = true, labels = {} } = {}) {
  const L = { ...LABELS, ...labels };
  const refs = {};

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const attr = (node, attrs) => {
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    return node;
  };
  const button = (cls, text, attrs = {}) => {
    const node = el('button', cls, text);
    node.type = 'button';
    return attr(node, attrs);
  };

  /* Header glyphs are drawn, not typed: `⤢`/`⤡` sit on different baselines per
     OS and the resize mark has no glyph at all. */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const icon = (d, cls) => {
    const node = document.createElementNS(SVG_NS, 'svg');
    attr(node, { viewBox: '0 0 16 16', class: cls, 'aria-hidden': 'true' });
    const path = document.createElementNS(SVG_NS, 'path');
    attr(path, { d, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    node.append(path);
    return node;
  };

  const heading = el('div', 'heading');
  const title = el('h2', null, L.title);
  title.id = `cp-title-${++dialogCount}`;
  heading.append(el('div', 'app-icon', '◉'), title);
  /* Reset, maximize and close are all icon buttons in the header: there is no
     footer strip to hold a labelled action. */
  const reset = button('reset-btn', '↺', { 'aria-label': L.reset, title: L.reset });
  /* One button, two names: `maximize.js` swaps the icon and the label. */
  const maximize = button('maximize-btn', undefined, { 'aria-label': L.maximize, title: L.maximize });
  maximize.append(
    icon('M10 2.5h3.5V6M13.5 2.5 9.5 6.5M6 13.5H2.5V10M2.5 13.5 6.5 9.5', 'icon-expand'),
    icon('M13.5 9.5H10V6M10 9.5 13.5 6M2.5 6.5H6V10M6 6.5 2.5 10', 'icon-collapse'),
  );
  const close = button('close-btn', '×', { 'aria-label': L.close, title: L.close });
  const headerActions = el('div', 'header-actions');
  headerActions.append(reset, maximize, close);
  const header = el('header', 'picker-header');
  header.append(heading, headerActions);

  /* One slot means nothing to switch to, so the tablist is not rendered at all
     rather than showing a single dead tab. */
  let tabs = null;
  refs.tabs = [];
  if (slots.length > 1) {
    tabs = attr(el('div', 'tabs'), { role: 'tablist', 'aria-label': L.slotsLabel });
    refs.tabs = slots.map((slot) => {
      const tab = button('tab', undefined, { role: 'tab', 'aria-selected': 'false' });
      tab.dataset.slot = slot.id;
      /* The hint is a tooltip, not a line: the visible second line carries the
         slot's type, so two tabs of one group differ by name and still read as
         the same kind of colour. */
      if (slot.hint) tab.title = slot.hint;
      const body = el('span', 'tab-body');
      body.append(el('strong', null, slot.label));
      if (slot.type) body.append(el('small', 'tab-type', slot.type));
      tab.append(el('span', 'tab-symbol', slot.symbol), body);
      tabs.append(tab);
      return tab;
    });
  }

  const svThumb = el('span', 'sv-thumb');
  const sv = attr(el('div', 'sv'), {
    role: 'slider',
    'aria-label': L.sv,
    'aria-description': L.svHint,
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': '87',
    tabindex: '0',
  });
  sv.append(svThumb);
  const svWrap = el('div', 'sv-wrap');
  svWrap.append(sv);

  const hex = attr(el('input', 'hex-input'), { 'aria-label': L.hex, spellcheck: 'false' });
  const preview = el('div', 'color-preview');
  /* Copy sits after the field; `copy.js` fills its glyph, template only places it. */
  const copy = button('copy-btn', undefined, { 'aria-label': L.copy, title: L.copy });
  copy.dataset.copied = 'false';
  const hexRow = el('div', 'hex-row');
  hexRow.append(preview, hex, copy);

  const range = (name, max) => {
    const label = el('div', 'range-label');
    const value = el('span');
    label.append(el('span', null, name), value);
    const input = attr(el('input'), { min: '0', max, 'aria-label': name });
    input.type = 'range';
    const block = el('div', 'range-block');
    block.append(label, input);
    return { block, input, value };
  };
  const hue = range(L.hue, 360);
  const alpha = range(L.opacity, 100);
  hue.block.classList.add('hue-range');
  alpha.block.classList.add('alpha-range');
  if (!showAlpha) alpha.block.hidden = true;

  const side = el('div', 'editor-side');
  side.append(hexRow, hue.block, alpha.block);
  const editor = attr(el('section', 'editor'), { 'aria-label': 'Custom color editor' });
  editor.append(svWrap, side);

  const presets = el('section', 'presets');
  const sections = {};
  /* One section per palette group — both always rendered, so a pale colour is
     always one click away even while composing text. */
  for (const group of groups) {
    const sectionTitle = el('div', 'section-title');
    sectionTitle.append(el('span', 'section-icon', group.symbol), el('strong', null, group.label));
    const categories = el('div', 'category-row');
    const swatches = el('div', 'swatches');
    const section = el('div', 'preset-section');
    section.dataset.group = group.key;
    section.append(sectionTitle, categories, swatches, el('p', 'section-hint', group.hint));
    presets.append(section);
    sections[group.key] = { section, categories, swatches };
  }

  /**
   * Screen-reader live region only — the visible status line was redundant with
   * the HEX field. A rejected HEX is also marked on the field itself.
   */
  const status = attr(el('p', 'status'), { 'aria-live': 'polite' });
  const actions = el('div', 'actions');
  actions.append(button('secondary-btn', L.cancel), button('primary-btn', L.apply));
  const footer = el('footer', 'footer');
  footer.append(actions);

  /** Empty band under the presets; `suggestions.js` fills it when enabled. */
  const suggestions = el('div', 'suggestions');

  const picker = attr(el('div', 'picker'), {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': title.id,
  });
  /* The panel itself never scrolls: the body does, so the resize grip stays in
     the corner of the box instead of travelling with the content. */
  const body = el('div', 'picker-body');
  body.append(header, ...(tabs ? [tabs] : []), editor, el('div', 'divider'), presets, suggestions, status, footer);
  /* Pointer-only affordance — `m` is the keyboard way to change the box. */
  const grip = attr(el('span', 'resize-grip'), { 'aria-hidden': 'true' });
  picker.append(body, grip);

  Object.assign(refs, {
    panel: picker,
    body,
    header,
    grip,
    maximize,
    sv,
    svThumb,
    preview,
    hex,
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
