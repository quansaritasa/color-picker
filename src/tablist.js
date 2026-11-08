/**
 * Roving tablist behaviour for the `role="tab"` buttons in the template.
 * Tab order comes from `refs.tabs`, so nothing here duplicates the tab list.
 */

export function syncTabs(refs, activeTab) {
  for (const button of refs.tabs) {
    const active = button.dataset.tab === activeTab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  }
}

/** Next tab id for an arrow key, or `null` when the key is not ours. */
export function tabAfterKey(event, activeTab, tabs) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return null;
  const index = tabs.indexOf(activeTab);
  const step = event.key === 'ArrowRight' ? 1 : tabs.length - 1;
  return tabs[(index + step) % tabs.length];
}
