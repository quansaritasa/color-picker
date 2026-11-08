/**
 * Contrast suggestions: a collapsed panel under the presets that measures the
 * current pair and lists readable partners from the *opposing* palette.
 *
 * It never writes the active color — spec §6 — a pick sets the other mode's
 * color instead, so the pair improves without the user's choice moving.
 */

import { parseHex } from './color.js';
import { contrastRatio, formatRatio, suggestPartners, wcagLevel } from './contrast.js';

const OTHER = { highContrast: 'lowContrast', lowContrast: 'highContrast' };
const CAPACITY = 3;

/** Every hex in one mode's palettes, deduplicated, spec order. */
function candidatesOf(presets, mode) {
  const out = [];
  for (const list of Object.values(presets[mode] || {})) out.push(...list);
  return [...new Set(out)];
}

export function createSuggestions({ mount, presets, enabled = false, onPick }) {
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
  hint.textContent = 'Partners that read well against the current color. Picking one sets the other mode.';
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
      if (typeof onPick === 'function' && button.dataset.hex) onPick(button.dataset.hex, button.dataset.tab);
    });
    list.append(button);
    return { button, dot, hexOut, partnerRatio };
  });

  details.append(summary, hint, list, empty);
  mount.append(details);
  mount.hidden = !enabled;

  /** Paint one partner slot, or hide it. */
  function paintSlot(slot, partner, tab) {
    if (!partner) {
      slot.button.hidden = true;
      slot.button.removeAttribute('aria-label');
      delete slot.button.dataset.hex;
      return;
    }
    slot.button.hidden = false;
    slot.button.dataset.hex = partner.hex;
    slot.button.dataset.tab = tab;
    slot.dot.style.background = partner.hex;
    slot.hexOut.textContent = partner.hex;
    slot.partnerRatio.textContent = `${formatRatio(partner.ratio)} ${partner.level}`;
    slot.button.setAttribute('aria-label', `Use ${partner.hex} (${formatRatio(partner.ratio)}) as the ${tab === 'highContrast' ? 'text' : 'panel'} color`);
  }

  return {
    render(activeTab, colors = {}) {
      if (!enabled) return;
      const other = OTHER[activeTab];
      const base = parseHex(colors[activeTab] || '');
      const surface = parseHex(colors[other] || '');
      if (!other || !base || !surface) return;

      const ratio = contrastRatio(base, surface);
      const level = wcagLevel(ratio);
      badge.dataset.level = level;
      badge.textContent = level === 'fail' ? 'Fail' : level;
      largeBadge.hidden = !(level === 'fail' && ratio >= 3);
      ratioOut.textContent = formatRatio(ratio);

      const ranked = suggestPartners(base, candidatesOf(presets, other), { limit: CAPACITY });
      partners.forEach((slot, i) => paintSlot(slot, ranked[i], other));
      empty.hidden = ranked.length > 0;
      list.hidden = ranked.length === 0;
    },
    destroy() {
      details.remove();
    },
  };
}
