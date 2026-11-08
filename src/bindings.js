/**
 * DOM wiring for the picker shell: slot tabs, footer actions, Escape and the
 * focus trap. Kept out of the class so `color-picker.js` stays inside the
 * repo's 200-line module rule; nothing here owns state.
 */

import { tabAfterKey } from './tablist.js';
import { createFocusTrap } from './focus.js';
import { createDrag } from './drag.js';

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

  /**
   * Escape belongs to the picker on top. Every instance listens on `document`,
   * so without this guard one keystroke closes all of them and each one below
   * silently discards the edits its user was making.
   */
  const isTopmostOpen = (root) => {
    const roots = [...document.querySelectorAll('.cp-root')];
    for (let i = roots.indexOf(root) + 1; i < roots.length; i += 1) {
      if (!roots[i].classList.contains('hidden')) return false;
    }
    return true;
  };

  picker.onDocumentKey = (event) => {
    if (event.key !== 'Escape' || !picker.isOpen) return;
    if (!isTopmostOpen(picker.root)) return;
    picker.dismiss();
  };
  document.addEventListener('keydown', picker.onDocumentKey);

  /**
   * A popover has no scrim, so "outside" is a real place the user can click.
   * `pointerdown` rather than `click`: the panel must be gone before the click
   * lands on the page underneath. A press on a swatch of the same picker is not
   * outside — that click is the trigger, and it re-opens on its own slot.
   */
  if (picker.mode === 'popover') {
    picker.onDocumentPointer = (event) => {
      if (!picker.isOpen) return;
      if (picker.root.contains(event.target)) return;
      if (picker.swatches && picker.swatches.contains(event.target)) return;
      picker.dismiss();
    };
    document.addEventListener('pointerdown', picker.onDocumentPointer, true);
  }

  picker.focusTrap = createFocusTrap(picker.root);

  /** The shell is a movable panel by default; `draggable: false` keeps it fixed. */
  if (picker.options.draggable) {
    picker.drag = createDrag({ panel: refs.panel, handle: refs.header });
    refs.header.classList.add('is-draggable');
  } else {
    picker.drag = { clamp() {}, destroy() {} };
  }
}

export function unbindShell(picker) {
  document.removeEventListener('keydown', picker.onDocumentKey);
  if (picker.onDocumentPointer) {
    document.removeEventListener('pointerdown', picker.onDocumentPointer, true);
  }
}
