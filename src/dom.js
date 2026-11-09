/**
 * Element builders for the picker template. Pure: each returns a fresh node.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function attr(node, attrs) {
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

export function button(cls, text, attrs = {}) {
  const node = el('button', cls, text);
  node.type = 'button';
  return attr(node, attrs);
}

/* Header glyphs are drawn, not typed: `⤢`/`⤡` sit on different baselines per
   OS and the resize mark has no glyph at all. */
export function icon(d, cls) {
  const node = document.createElementNS(SVG_NS, 'svg');
  attr(node, { viewBox: '0 0 16 16', class: cls, 'aria-hidden': 'true' });
  const path = document.createElementNS(SVG_NS, 'path');
  attr(path, { d, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  node.append(path);
  return node;
}
