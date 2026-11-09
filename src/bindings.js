/**
 * DOM wiring for the picker shell: slot tabs, footer actions, the shell keys
 * and the focus trap. Kept out of the class so `color-picker.js` stays inside
 * the repo's 200-line module rule; nothing here owns state.
 */

import { tabAfterKey } from './tablist.js';
import { createFocusTrap } from './focus.js';
import { createGeometry } from './geometry.js';
import { LABELS } from './template.js';

/** The box compact puts the panel in. Narrower than 360 and the slot tabs wrap
    onto a third line; the width above it goes to the saturation square, which is
    the surface the view exists to show. */
const COMPACT_BOX = { width: 380, height: 270 };
const SHEET = '(max-width: 680px)';

/** A keystroke that belongs to the field, not to the shell. */
const isTextEntry = (node) => !!node && (
  node.isContentEditable
  || node.tagName === 'TEXTAREA'
  || (node.tagName === 'INPUT' && node.type !== 'range')
);

export function bindShell(picker) {
  const { refs, slotIds } = picker;
  const tabs = refs.tabs;

  const focusSlot = (id) => {
    picker.setActiveSlot(id);
    tabs[slotIds.indexOf(id)].focus();
  };

  for (const button of tabs) {
    button.addEventListener('click', () => picker.setActiveSlot(button.dataset.slot));
  }
  /* A single-slot picker has no tablist; nothing to wire, nothing to focus. */
  if (tabs.length) tabs[0].parentElement.addEventListener('keydown', (event) => {
    let next = null;
    if (event.key === 'Home') next = slotIds[0];
    else if (event.key === 'End') next = slotIds[slotIds.length - 1];
    else next = tabAfterKey(event, picker.activeSlot, slotIds);
    if (!next) return;
    focusSlot(next);
    event.preventDefault();
  });

  refs.close.addEventListener('click', () => picker.dismiss());
  refs.cancel.addEventListener('click', () => picker.dismiss());
  refs.apply.addEventListener('click', () => picker.apply());
  refs.reset.addEventListener('click', () => picker.reset());
  /* Compact keeps the editor and drops the palettes: a view, so reset leaves it.
     The button and the `c` key run the same toggle, so `aria-pressed` cannot
     drift out of step with the class the stylesheet reads.

     The palettes were what needed a wide box, so the view also puts the panel in
     a small box of its own and restores the previous one on the way out — a box
     the user dragged out of, resized, or maximized comes back exactly. Below
     680px the shell is a bottom sheet that owns its size: only the class flips. */
  let restoreBox = null;
  const toggleCompact = () => {
    const on = refs.panel.classList.toggle('cp-is-compact');
    refs.compact.setAttribute('aria-pressed', String(on));
    if (window.matchMedia(SHEET).matches) return;
    const style = refs.panel.style;
    if (on) {
      restoreBox = { width: style.width, height: style.height };
      style.width = `${COMPACT_BOX.width}px`;
      style.height = `${COMPACT_BOX.height}px`;
    } else if (restoreBox) {
      style.width = restoreBox.width;
      style.height = restoreBox.height;
      restoreBox = null;
    }
  };
  refs.compact.addEventListener('click', toggleCompact);

  /**
   * Escape belongs to the picker on top. Every instance listens on `document`,
   * so without this guard one keystroke closes all of them and each one below
   * silently discards the edits its user was making. `m` and `⌘`/`Ctrl`+`Enter`
   * take the same guard: a keystroke acts on the panel the user is in.
   */
  const isTopmostOpen = (root) => {
    const open = document.querySelectorAll('.cp-root:not(.cp-hidden)');
    return open[open.length - 1] === root;
  };

  picker.onDocumentKey = (event) => {
    if (!picker.isOpen) return;
    if (!isTopmostOpen(picker.root)) return;
    if (event.key === 'Escape') {
      picker.dismiss();
      return;
    }
    /* `⌘`/`Ctrl`+`Enter` is the OK button: a modal commits, a popover — which
       has no transaction — closes and keeps the edit. */
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (picker.options.mode === 'popover') picker.dismiss();
      else picker.apply();
      return;
    }
    /* Page Up/Down step through the slot tabs. A range input keeps its own
       Page keys, and the focus follows only when it was already on a tab. */
    if ((event.key === 'PageUp' || event.key === 'PageDown') && tabs.length
      && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey
      && !(event.target.tagName === 'INPUT' && event.target.type === 'range')) {
      event.preventDefault();
      const step = event.key === 'PageDown' ? 1 : slotIds.length - 1;
      const next = slotIds[(slotIds.indexOf(picker.activeSlot) + step) % slotIds.length];
      if (tabs.includes(document.activeElement)) focusSlot(next);
      else picker.setActiveSlot(next);
      return;
    }
    /* `m` toggles the box. Typing a colour keeps its own letters, and a
       modified `m` belongs to the browser (`⌘M` minimises the window). */
    if ((event.key === 'm' || event.key === 'M') && !event.metaKey && !event.ctrlKey
      && !event.altKey && !event.repeat && !isTextEntry(event.target)) {
      event.preventDefault();
      picker.geometry.toggleMaximize();
      return;
    }
    /* `c` toggles compact, under the same guards: a hex field owns its letters,
       and `⌘C`/`Ctrl`+`C` is copy. */
    if ((event.key === 'c' || event.key === 'C') && !event.metaKey && !event.ctrlKey
      && !event.altKey && !event.repeat && !isTextEntry(event.target)) {
      event.preventDefault();
      toggleCompact();
    }
  };
  document.addEventListener('keydown', picker.onDocumentKey);

  /**
   * A popover has no scrim, so "outside" is a real place the user can click.
   * `pointerdown` rather than `click`: the panel must be gone before the click
   * lands on the page underneath. A press on a trigger of the same picker is not
   * outside — that click is the trigger, and it re-opens on its own slot.
   */
  if (picker.options.mode === 'popover') {
    picker.onDocumentPointer = (event) => {
      if (!picker.isOpen) return;
      if (picker.root.contains(event.target)) return;
      if (picker.triggers && picker.triggers.contains(event.target)) return;
      picker.dismiss();
    };
    document.addEventListener('pointerdown', picker.onDocumentPointer, true);
  }

  picker.focusTrap = createFocusTrap(picker.root);

  /**
   * Move, resize and maximize are one box: `draggable: false` pins a fixed
   * modal, `resizable: false` drops the corner grip, and the toggle survives
   * both because the layout is what it restores to.
   */
  picker.geometry = createGeometry({
    panel: refs.panel,
    header: refs.header,
    grip: refs.grip,
    button: refs.maximize,
    mode: picker.options.mode,
    draggable: picker.options.draggable,
    resizable: picker.options.resizable,
    getPopover: () => picker.popover,
    labels: { ...LABELS, ...picker.options.labels },
  });
}

export function unbindShell(picker) {
  document.removeEventListener('keydown', picker.onDocumentKey);
  if (picker.onDocumentPointer) {
    document.removeEventListener('pointerdown', picker.onDocumentPointer, true);
  }
}
