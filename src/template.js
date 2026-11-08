/**
 * DOM template for the picker shell. Structure and class names mirror
 * `reference/modern-color-picker.html:141-196`; no state, no behaviour.
 * Tabs and preset sections are built from `slots`, so one template serves any
 * number of colours; `presets-panel.js` fills the sections.
 */

/** Ids must be unique per instance: two pickers can share a page. */
let dialogCount = 0;

export function buildTemplate({ slots = [], groups = [], showAlpha = true, labels = {} } = {}) {
  const L = {
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
    ...labels,
  };
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

  const heading = el('div', 'heading');
  const title = el('h2', null, L.title);
  title.id = `cp-title-${++dialogCount}`;
  heading.append(el('div', 'app-icon', '◉'), title);
  /* Reset and close are both icon buttons in the header: there is no footer
     strip to hold a labelled action. */
  const reset = button('reset-btn', '↺', { 'aria-label': L.reset, title: L.reset });
  const close = button('close-btn', '×', { 'aria-label': L.close, title: L.close });
  const headerActions = el('div', 'header-actions');
  headerActions.append(reset, close);
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
      const body = el('span');
      body.append(el('strong', null, slot.label));
      if (slot.hint) body.append(el('small', null, slot.hint));
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
  picker.append(header, ...(tabs ? [tabs] : []), editor, el('div', 'divider'), presets, suggestions, status, footer);

  Object.assign(refs, {
    panel: picker,
    header,
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
