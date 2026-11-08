/**
 * DOM template for the picker shell. Structure and class names mirror
 * `reference/modern-color-picker.html:141-196`; no state, no behaviour.
 * Preset sections are headers + empty containers; `presets-panel.js` fills them.
 */

const TABS = [
  { tab: 'highContrast', symbol: 'Aa' },
  { tab: 'lowContrast', symbol: '▰' },
];

export function buildTemplate({ showAlpha = true, labels = {} } = {}) {
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
    textPresets: 'Text Color Presets',
    panelPresets: 'Panel Color Presets',
    textHint: 'Designed for text, icons, and foreground elements.',
    panelHint: 'Soft colors for panels, chips, and badges.',
    ...labels,
  };
  const tabLabels = {
    highContrast: { title: 'High Contrast', hint: 'For text color' },
    lowContrast: { title: 'Low Contrast', hint: 'For panel background' },
    ...(labels.tabs || {}),
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
  heading.append(el('div', 'app-icon', '◉'), el('h2', null, L.title));
  const close = button('close-btn', '×', { 'aria-label': L.close });
  const header = el('header', 'picker-header');
  header.append(heading, close);

  const tabs = attr(el('div', 'tabs'), { role: 'tablist', 'aria-label': 'Color type' });
  refs.tabs = TABS.map((spec) => {
    const tab = button('tab', undefined, { role: 'tab', 'aria-selected': 'false' });
    tab.dataset.tab = spec.tab;
    const body = el('span');
    body.append(el('strong', null, tabLabels[spec.tab].title), el('small', null, tabLabels[spec.tab].hint));
    tab.append(el('span', 'tab-symbol', spec.symbol), body);
    tabs.append(tab);
    return tab;
  });

  const svThumb = el('span', 'sv-thumb');
  const sv = attr(el('div', 'sv'), { role: 'slider', 'aria-label': L.sv, tabindex: '0' });
  sv.append(svThumb);
  const svWrap = el('div', 'sv-wrap');
  svWrap.append(sv);

  const hex = attr(el('input', 'hex-input'), { 'aria-label': L.hex, spellcheck: 'false' });
  const preview = el('div', 'color-preview');
  const hexRow = el('div', 'hex-row');
  hexRow.append(preview, hex);

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
  for (const [key, icon, name, hint] of [
    ['high', 'Aa', L.textPresets, L.textHint],
    ['low', '▰', L.panelPresets, L.panelHint],
  ]) {
    const title = el('div', 'section-title');
    title.append(el('span', 'section-icon', icon), el('strong', null, name));
    const categories = el('div', 'category-row');
    const swatches = el('div', 'swatches');
    const section = el('div', 'preset-section');
    section.dataset.mode = key;
    section.append(title, categories, swatches, el('p', 'section-hint', hint));
    presets.append(section);
    sections[key] = { section, categories, swatches };
  }

  const status = attr(el('p', 'status'), { 'aria-live': 'polite' });
  const reset = button('reset-btn', `↶ \u00a0 ${L.reset}`);
  const actions = el('div', 'actions');
  actions.append(button('secondary-btn', L.cancel), button('primary-btn', L.apply));
  const footer = el('footer', 'footer');
  footer.append(reset, actions);

  /** Empty band under the presets; `suggestions.js` fills it when enabled. */
  const suggestions = el('div', 'suggestions');

  const picker = el('div', 'picker');
  picker.append(header, tabs, editor, el('div', 'divider'), presets, suggestions, status, footer);

  Object.assign(refs, {
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
    cancel: actions.firstElementChild,
    apply: actions.lastElementChild,
    close,
    suggestions,
    high: sections.high,
    low: sections.low,
  });

  return { root: picker, refs };
}
