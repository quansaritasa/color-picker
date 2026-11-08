/**
 * Contrast suggestions: a collapsed panel under the presets that measures the
 * current pair and lists readable partners from the *other* slot's palette.
 *
 * It never writes the active colour — spec §6 — a pick sets the other slot of
 * `contrastPair` instead, so the pair improves without the user's choice
 * moving. Without a declared pair there is nothing to measure, so the whole
 * panel stays hidden.
 */

import { parseHex } from './color.js';
import { contrastRatio, formatRatio, suggestPartners, wcagLevel } from './contrast.js';
import { OTHER_GROUP } from './presets.js';

const CAPACITY = 3;

/** Every hex in one palette, deduplicated, in preset order. */
function candidatesOf(palette) {
  const out = [];
  for (const list of Object.values(palette || {})) out.push(...list);
  return [...new Set(out)];
}

export function createSuggestions({ mount, slots = [], pair = null, palettes = {}, enabled = false, onPick }) {
  const labelOf = (id) => (slots.find((slot) => slot.id === id) || {}).label || id;
  const otherOf = (activeSlot) => {
    if (!pair) return null;
    if (pair[0] === activeSlot) return pair[1];
    if (pair[1] === activeSlot) return pair[0];
    return null;
  };

  const details = document.createElement('details');
  details.className = 'cp-suggestions';

  const summary = document.createElement('summary');
  const label = document.createElement('span');
  label.className = 'cp-sugg-label';
  label.textContent = 'Contrast suggestions';
  const verdict = document.createElement('span');
  verdict.className = 'cp-sugg-verdict';
  const badge = document.createElement('span');
  badge.className = 'cp-badge';
  const largeBadge = document.createElement('span');
  largeBadge.className = 'cp-badge cp-badge-large';
  largeBadge.textContent = 'AA-large';
  largeBadge.title = 'Passes for large text only (3:1)';
  largeBadge.hidden = true;
  const ratioOut = document.createElement('span');
  ratioOut.className = 'cp-sugg-ratio';
  verdict.append(badge, largeBadge, ratioOut);
  summary.append(label, verdict);

  const hint = document.createElement('p');
  hint.className = 'cp-sugg-hint';
  hint.textContent = 'Partners that read well against the current color. Picking one sets the other color.';
  const empty = document.createElement('p');
  empty.className = 'cp-sugg-empty';
  empty.textContent = 'No preset in this palette reaches 4.5:1.';
  empty.hidden = true;

  const list = document.createElement('div');
  list.className = 'cp-partners';
  const partners = Array.from({ length: CAPACITY }, () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cp-partner';
    button.hidden = true;
    const dot = document.createElement('span');
    dot.className = 'cp-partner-dot';
    const hexOut = document.createElement('span');
    hexOut.className = 'cp-partner-hex';
    const partnerRatio = document.createElement('span');
    partnerRatio.className = 'cp-partner-ratio';
    button.append(dot, hexOut, partnerRatio);
    button.addEventListener('click', () => {
      if (typeof onPick === 'function' && button.dataset.hex) onPick(button.dataset.hex, button.dataset.slot);
    });
    list.append(button);
    return { button, dot, hexOut, partnerRatio };
  });

  details.append(summary, hint, list, empty);
  mount.append(details);
  mount.hidden = !enabled || !pair;

  if (enabled && !pair && typeof console !== 'undefined') {
    console.warn('ColorPicker: showContrastSuggestions needs contrastPair: [slotA, slotB] — suggestions stay hidden.');
  }

  /** Paint one partner slot, or hide it. */
  function paintSlot(slot, partner, id) {
    if (!partner) {
      slot.button.hidden = true;
      slot.button.removeAttribute('aria-label');
      delete slot.button.dataset.hex;
      return;
    }
    slot.button.hidden = false;
    slot.button.dataset.hex = partner.hex;
    slot.button.dataset.slot = id;
    slot.dot.style.background = partner.hex;
    slot.hexOut.textContent = partner.hex;
    slot.partnerRatio.textContent = `${formatRatio(partner.ratio)} ${partner.level}`;
    slot.button.setAttribute('aria-label', `Use ${partner.hex} (${formatRatio(partner.ratio)}) as the ${labelOf(id).toLowerCase()} color`);
  }

  return {
    render(activeSlot, group, colors = {}) {
      if (!enabled) return;
      const other = otherOf(activeSlot);
      if (!other) {
        mount.hidden = true;
        return;
      }
      const base = parseHex(colors[activeSlot] || '');
      const surface = parseHex(colors[other] || '');
      if (!base || !surface) return;
      mount.hidden = false;

      const ratio = contrastRatio(base, surface);
      const level = wcagLevel(ratio);
      badge.dataset.level = level;
      badge.textContent = level === 'fail' ? 'Fail' : level;
      largeBadge.hidden = !(level === 'fail' && ratio >= 3);
      ratioOut.textContent = formatRatio(ratio);

      /* Partners come from the opposite palette group: the quiet one when the
         edited slot is a text colour, the strong one when it is a surface. */
      const ranked = suggestPartners(base, candidatesOf(palettes[OTHER_GROUP[group]]), { limit: CAPACITY });
      partners.forEach((slot, i) => paintSlot(slot, ranked[i], other));
      empty.hidden = ranked.length > 0;
      list.hidden = ranked.length === 0;
    },
    destroy() {
      details.remove();
    },
  };
}
