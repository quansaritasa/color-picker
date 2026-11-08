/**
 * Trigger bar: one colour square per slot, mounted in the host's own layout.
 * The square is the control — clicking it opens the picker on that slot,
 * anchored to the square. Reads `picker.colors`, never writes them.
 */

export function createTriggers({ picker, target, slots, labels = {} }) {
  const host = typeof target === 'string' ? document.querySelector(target) : target;
  if (!host) {
    console.warn('ColorPicker: `triggers` target not found — no trigger controls rendered.');
    return null;
  }
  const names = labels.triggers || {};
  const nameOf = (slot) => names[slot.id] || slot.label;

  const bar = document.createElement('div');
  bar.className = 'cp-triggers';
  bar.dataset.theme = picker.options.theme;
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', labels.triggersLabel || 'Colours');

  const buttons = {};
  for (const slot of slots) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cp-trigger';
    button.dataset.slot = slot.id;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');

    const chip = document.createElement('span');
    chip.className = 'cp-trigger-chip';
    chip.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'cp-trigger-name';
    name.textContent = nameOf(slot);
    const hex = document.createElement('span');
    hex.className = 'cp-trigger-hex';

    button.append(chip, name, hex);
    button.addEventListener('click', () => {
      // A second click on the square that opened the panel closes it again.
      if (picker.isOpen && picker.activeSlot === slot.id) {
        picker.close();
        return;
      }
      picker.setActiveSlot(slot.id);
      picker.open(button);
    });
    bar.append(button);
    buttons[slot.id] = { button, chip, hex };
  }
  host.append(bar);

  return {
    element: bar,
    anchorFor: (id) => (buttons[id] ? buttons[id].button : null),
    contains: (node) => bar.contains(node),
    render(colors) {
      for (const slot of slots) {
        const { button, chip, hex } = buttons[slot.id];
        chip.style.setProperty('--cpt-fill', colors[slot.id]);
        hex.textContent = colors[slot.id];
        button.setAttribute('aria-label', `Edit ${nameOf(slot)}, currently ${colors[slot.id]}`);
      }
    },
    /** `aria-expanded` follows the panel; only the slot it opened on is on. */
    sync(open) {
      for (const slot of slots) {
        buttons[slot.id].button.setAttribute('aria-expanded', String(Boolean(open) && picker.activeSlot === slot.id));
      }
    },
    destroy() {
      bar.remove();
    },
  };
}
