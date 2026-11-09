/**
 * Preset panel: category pills + swatch grids, one section per palette group.
 * Behaviour mirrors `reference/modern-color-picker.html:292-310`.
 *
 * Both groups are always mounted. A swatch is a *suggestion*: clicking it writes
 * the slot the editor is showing, never a slot the palette "owns", so a pale
 * background color can be applied to text when that is what the host wants.
 *
 * The grid is built once per (group, category) and repainted on color change,
 * so dragging the SV area never rebuilds DOM.
 */

import { parseHex } from './color.js';
import { ALL_CATEGORY, allColors, categoriesWithAll } from './presets.js';

const CHECK_DARK = '#172033';
const CHECK_LIGHT = '#FFFFFF';

/** Light swatches get dark ink, dark swatches get white ink. */
function checkColor(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return CHECK_LIGHT;
  const luma = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
  return luma > 150 ? CHECK_DARK : CHECK_LIGHT;
}

export function createPresetPanel({ refs, groups, palettes, onSelect }) {
  const state = {}; // group key -> { category, signature, built, byHex, selected, paintedColor }
  const handlers = []; // { node, type, fn } — removed by destroy()
  let activeGroup = null;
  let activeColor = null;

  const listen = (node, type, fn) => {
    node.addEventListener(type, fn);
    handlers.push({ node, type, fn });
  };

  const refOf = (key) => (refs.sections || {})[key];

  function buildPills(key, ref, names) {
    ref.categories.replaceChildren();
    for (const name of names) {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'cp-category';
      pill.textContent = name;
      pill.dataset.category = name;
      pill.setAttribute('aria-pressed', String(state[key].category === name));
      pill.classList.toggle('cp-is-active', state[key].category === name);
      ref.categories.append(pill);
    }
  }

  function buildSwatches(key, ref) {
    const entry = state[key];
    const list = entry.category === ALL_CATEGORY
      ? allColors(palettes[key])
      : (palettes[key] || {})[entry.category] || [];
    ref.swatches.replaceChildren();
    /* The union grid is taller than any one category: CSS needs to know which
       mode it is painting before the rows are measured. */
    ref.swatches.classList.toggle('cp-is-all', entry.category === ALL_CATEGORY);
    /* `byHex` (upper-cased) lets `paint()` find the selected nodes without a scan;
       `selected` is what is currently marked, so a repaint touches only the diff. */
    entry.byHex = new Map();
    entry.selected = [];
    entry.paintedColor = null;
    const frag = document.createDocumentFragment();
    for (const hex of list) {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'cp-swatch';
      node.dataset.hex = hex;
      node.title = hex;
      node.style.background = hex;
      node.setAttribute('aria-pressed', 'false');
      node.setAttribute('aria-label', `${entry.category} ${hex}`);
      frag.append(node);
      const key = hex.toUpperCase();
      const nodes = entry.byHex.get(key);
      if (nodes) nodes.push(node);
      else entry.byHex.set(key, [node]);
    }
    ref.swatches.append(frag);
    entry.built = entry.category;
  }

  function selectCategory(key, name) {
    const ref = refOf(key);
    if (!ref || !state[key] || name === state[key].category) return;
    state[key].category = name;
    buildPills(key, ref, categoriesWithAll(palettes[key] || {}));
    buildSwatches(key, ref);
    paint(key, ref);
  }

  /** Repaint checkmarks + emphasis only — the cheap path used on every change. */
  function paint(key, ref) {
    const entry = state[key];
    const target = String(activeColor).toUpperCase();
    if (entry.paintedColor !== target) {
      for (const node of entry.selected) {
        node.classList.remove('cp-is-selected');
        node.setAttribute('aria-pressed', 'false');
        node.style.removeProperty('--cp-check-color');
      }
      entry.selected = entry.byHex.get(target) || [];
      for (const node of entry.selected) {
        node.classList.add('cp-is-selected');
        node.setAttribute('aria-pressed', 'true');
        node.style.setProperty('--cp-check-color', checkColor(node.dataset.hex));
      }
      entry.paintedColor = target;
    }
    ref.section.classList.toggle('cp-is-emphasis', key === activeGroup);
  }

  /* One delegated listener per row: pills and swatches are rebuilt on every
     category switch, and per-node listeners would pile up in `handlers`. */
  for (const { key } of groups) {
    const ref = refOf(key);
    if (!ref) continue;
    listen(ref.categories, 'click', (event) => {
      const pill = event.target.closest('.cp-category');
      if (pill) selectCategory(key, pill.dataset.category);
    });
    /* Keyboard: arrows on a pill switch palette; on a swatch they walk the grid,
       and leave it through the top row to the pills. */
    listen(ref.categories, 'keydown', (event) => {
      const pill = event.target.closest('.cp-category');
      if (!pill || event.altKey || event.ctrlKey || event.metaKey) return;
      const names = categoriesWithAll(palettes[key] || {});
      const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (step) {
        const next = names[(names.indexOf(pill.dataset.category) + step + names.length) % names.length];
        selectCategory(key, next);
        ref.categories.querySelector(`[data-category="${CSS.escape(next)}"]`)?.focus();
      } else if (event.key === 'ArrowDown') {
        (ref.swatches.querySelector('.cp-is-selected') || ref.swatches.firstElementChild)?.focus();
      } else return;
      event.preventDefault();
    });
    listen(ref.swatches, 'keydown', (event) => {
      const node = event.target.closest('.cp-swatch');
      if (!node || event.altKey || event.ctrlKey || event.metaKey) return;
      const items = [...ref.swatches.children];
      const index = items.indexOf(node);
      /* Columns are whatever the grid currently wraps to: count the first row. */
      const columns = items.filter((item) => item.offsetTop === items[0].offsetTop).length || 1;
      const to = {
        ArrowLeft: index - 1,
        ArrowRight: index + 1,
        ArrowUp: index - columns,
        ArrowDown: index + columns,
      }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      if (to < 0 && event.key === 'ArrowUp') {
        const pills = ref.categories;
        (pills.querySelector('.cp-is-active') || pills.firstElementChild)?.focus();
      } else if (items[to]) {
        /* Moving previews: the color is written as focus lands on it. */
        items[to].focus();
        if (typeof onSelect === 'function') onSelect(items[to].dataset.hex);
      }
    });
    listen(ref.swatches, 'click', (event) => {
      const node = event.target.closest('.cp-swatch');
      if (node && typeof onSelect === 'function') onSelect(node.dataset.hex);
    });
  }

  /** `group` is the active slot's hint: it only decides which side is emphasised. */
  function render(group, color) {
    activeGroup = group;
    activeColor = color;
    for (const entry of groups) {
      const key = entry.key;
      const ref = refOf(key);
      if (!ref) continue;
      const own = Object.keys(palettes[key] || {});
      if (!own.length) {
        ref.section.hidden = true;
        continue;
      }
      const names = categoriesWithAll(palettes[key] || {});
      ref.section.hidden = false;
      const current = state[key];
      const signature = names.join('|');
      /* `All` is an offer, not the opening view: a section still starts on its
         first shipped category, so the panel opens the size it always did. */
      if (!current || current.signature !== signature) {
        state[key] = { category: own[0], signature, built: null, byHex: new Map(), selected: [], paintedColor: null };
        buildPills(key, ref, names);
      } else if (!names.includes(current.category)) {
        current.category = own[0];
        buildPills(key, ref, names);
      }
      if (state[key].built !== state[key].category) buildSwatches(key, ref);
      paint(key, ref);
    }
  }

  return {
    render,
    destroy() {
      for (const { node, type, fn } of handlers) node.removeEventListener(type, fn);
      handlers.length = 0;
      for (const entry of groups) {
        const ref = refOf(entry.key);
        if (ref) {
          ref.categories.replaceChildren();
          ref.swatches.replaceChildren();
        }
      }
    },
  };
}
