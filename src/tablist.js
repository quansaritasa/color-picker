/**
 * Roving tablist behaviour for the `role="tab"` buttons in the template.
 * Slot order comes from `refs.tabs`, so nothing here duplicates the list.
 */

export function syncTabs(refs, activeSlot) {
  for (const button of refs.tabs) {
    const active = button.dataset.slot === activeSlot;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  }
}

/** Next slot id for an arrow key, or `null` when the key is not ours. */
export function tabAfterKey(event, activeSlot, slots) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return null;
  const index = slots.indexOf(activeSlot);
  const step = event.key === 'ArrowRight' ? 1 : slots.length - 1;
  return slots[(index + step) % slots.length];
}
