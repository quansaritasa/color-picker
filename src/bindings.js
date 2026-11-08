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

  picker.onDocumentKey = (event) => {
    if (event.key === 'Escape' && picker.isOpen) picker.cancel();
  };
  document.addEventListener('keydown', picker.onDocumentKey);
  picker.focusTrap = createFocusTrap(picker.root);
}
