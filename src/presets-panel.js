/**
 * Preset panel: category pills + swatch grids for both modes.
 * Behaviour mirrors `reference/modern-color-picker.html:292-310`; both
 * sections stay mounted and only the active tab's one is emphasised.
 *
 * The grid is built once per (tab, category) and repainted on color change,
 * so dragging the SV area never rebuilds DOM.
 */

import { parseHex } from './color.js';

const SECTIONS = [
  { tab: 'highContrast', key: 'high' },
  { tab: 'lowContrast', key: 'low' },
];

const CHECK_DARK = '#172033';
const CHECK_LIGHT = '#FFFFFF';

/** Light swatches get dark ink, dark swatches get white ink. */
function checkColor(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return CHECK_LIGHT;
  const luma = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
  return luma > 150 ? CHECK_DARK : CHECK_LIGHT;
}

const sameColor = (a, b) => String(a).toUpperCase() === String(b).toUpperCase();

export function createPresetPanel({ refs, presets, onSelect }) {
  const state = {}; // tab -> { category, signature, built, swatches }
  const handlers = []; // { node, type, fn } — removed by destroy()
  let lastActive = 'highContrast';
  let lastColors = {};

  const listen = (node, type, fn) => {
    node.addEventListener(type, fn);
    handlers.push({ node, type, fn });
  };

  const slotOf = (tab) => refs[SECTIONS.find((spec) => spec.tab === tab).key];

  function buildPills(tab, slot, names) {
    slot.categories.replaceChildren();
    for (const name of names) {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'cp-category';
      pill.textContent = name;
      pill.setAttribute('aria-pressed', String(state[tab].category === name));
      pill.classList.toggle('is-active', state[tab].category === name);
      listen(pill, 'click', () => selectCategory(tab, name));
      slot.categories.append(pill);
    }
  }

  function buildSwatches(tab, slot) {
    const entry = state[tab];
    const list = (presets[tab] || {})[entry.category] || [];
    slot.swatches.replaceChildren();
    entry.swatches = [];
    for (const hex of list) {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'cp-swatch';
      node.dataset.hex = hex;
      node.title = hex;
      node.style.background = hex;
      node.setAttribute('aria-label', `${entry.category} ${hex}`);
      listen(node, 'click', () => {
        if (typeof onSelect === 'function') onSelect(hex, tab);
      });
      slot.swatches.append(node);
      entry.swatches.push({ hex, node });
    }
    entry.built = entry.category;
  }

  function selectCategory(tab, name) {
    const slot = slotOf(tab);
    if (!slot || !state[tab] || name === state[tab].category) return;
    state[tab].category = name;
    buildPills(tab, slot, Object.keys(presets[tab] || {}));
    buildSwatches(tab, slot);
    paint(tab, slot, lastColors);
  }

  /** Repaint checkmarks only — the cheap path used on every color change. */
  function paint(tab, slot, colors) {
    const current = colors[tab];
    for (const { hex, node } of state[tab].swatches) {
      const selected = sameColor(hex, current);
      node.classList.toggle('is-selected', selected);
      node.setAttribute('aria-pressed', String(selected));
      if (selected) node.style.setProperty('--cp-check-color', checkColor(hex));
      else node.style.removeProperty('--cp-check-color');
    }
    slot.section.classList.toggle('is-emphasis', tab === lastActive);
  }

  function render(activeTab, colors = {}) {
    lastActive = activeTab;
    lastColors = colors || {};
    for (const { tab } of SECTIONS) {
      const slot = slotOf(tab);
      if (!slot) continue;
      const names = Object.keys(presets[tab] || {});
      if (!names.length) {
        slot.section.hidden = true;
        continue;
      }
      slot.section.hidden = false;
      const entry = state[tab];
      const signature = names.join('|');
      if (!entry || entry.signature !== signature) {
        state[tab] = { category: names[0], signature, built: null, swatches: [] };
        buildPills(tab, slot, names);
      } else if (!names.includes(entry.category)) {
        entry.category = names[0];
        buildPills(tab, slot, names);
      }
      if (state[tab].built !== state[tab].category) buildSwatches(tab, slot);
      paint(tab, slot, lastColors);
    }
  }

  return {
    render,
    destroy() {
      for (const { node, type, fn } of handlers) node.removeEventListener(type, fn);
      handlers.length = 0;
      for (const { tab } of SECTIONS) {
        const slot = slotOf(tab);
        if (slot) {
          slot.categories.replaceChildren();
          slot.swatches.replaceChildren();
        }
      }
    },
  };
}
