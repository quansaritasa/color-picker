/**
 * DOM wiring for the picker shell: slot tabs, footer actions, the shell keys
 * and the focus trap. Kept out of the class so `color-picker.js` stays inside
 * the repo's 200-line module rule; nothing here owns state.
 */

import { tabAfterKey } from './tablist.js';
import { createFocusTrap } from './focus.js';
import { createGeometry } from './geometry.js';
import { LABELS } from './template.js';

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

  /**
   * Escape belongs to the picker on top. Every instance listens on `document`,
   * so without this guard one keystroke closes all of them and each one below
   * silently discards the edits its user was making. `m` and `⌘`/`Ctrl`+`Enter`
   * take the same guard: a keystroke acts on the panel the user is in.
   */
  const isTopmostOpen = (root) => {
    const roots = [...document.querySelectorAll('.cp-root')];
    for (let i = roots.indexOf(root) + 1; i < roots.length; i += 1) {
      if (!roots[i].classList.contains('cp-hidden')) return false;
    }
    return true;
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
    /* `m` toggles the box. Typing a colour keeps its own letters, and a
       modified `m` belongs to the browser (`⌘M` minimises the window). */
    if ((event.key === 'm' || event.key === 'M') && !event.metaKey && !event.ctrlKey
      && !event.altKey && !event.repeat && !isTextEntry(event.target)) {
      event.preventDefault();
      picker.geometry.toggleMaximize();
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
