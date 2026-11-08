/**
 * DOM wiring for the picker shell: tab buttons, footer actions, Escape and the
 * focus trap. Kept out of the class so `color-picker.js` stays inside the
 * repo's 200-line module rule; nothing here owns state.
 */

import { TABS } from './options.js';
import { tabAfterKey } from './tablist.js';
import { createFocusTrap } from './focus.js';

export function bindShell(picker) {
  const { refs } = picker;
  const tabs = refs.tabs;

  const focusTab = (tab) => {
    picker.setActiveTab(tab);
    tabs[TABS.indexOf(tab)].focus();
  };

  for (const button of tabs) {
    button.addEventListener('click', () => picker.setActiveTab(button.dataset.tab));
  }
  tabs[0].parentElement.addEventListener('keydown', (event) => {
    let next = null;
    if (event.key === 'Home') next = TABS[0];
    else if (event.key === 'End') next = TABS[TABS.length - 1];
    else next = tabAfterKey(event, picker.activeTab, TABS);
    if (!next) return;
    focusTab(next);
    event.preventDefault();
  });

  refs.close.addEventListener('click', () => picker.cancel());
  refs.cancel.addEventListener('click', () => picker.cancel());
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
    picker.cancel();
  };
  document.addEventListener('keydown', picker.onDocumentKey);
  picker.focusTrap = createFocusTrap(picker.root);
}
