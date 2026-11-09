/**
 * Keyboard focus containment for the modal: Tab wraps inside the root while it
 * is open, and closing hands focus back to whatever opened it. Spec §11.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** First and last rendered focusable in `root`; stops scanning at each end. */
function edgesWithin(root) {
  const all = root.querySelectorAll(FOCUSABLE);
  const shown = (node) => node.getClientRects().length > 0;
  let first = null;
  let last = null;
  for (let i = 0; i < all.length && !first; i += 1) if (shown(all[i])) first = all[i];
  for (let i = all.length - 1; i >= 0 && !last; i -= 1) if (shown(all[i])) last = all[i];
  return [first, last];
}

export function createFocusTrap(root) {
  let previous = null;

  const onKey = (event) => {
    if (event.key !== 'Tab') return;
    /* Only the two ends matter: measuring every swatch on each Tab is wasted. */
    const [first, last] = edgesWithin(root);
    if (!first) return;
    if (!root.contains(document.activeElement)) {
      first.focus();
      event.preventDefault();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  };

  return {
    /** Remember the opener and start wrapping Tab inside the root. */
    activate(opener) {
      previous = opener || document.activeElement;
      document.addEventListener('keydown', onKey, true);
    },
    /** Stop wrapping and restore focus, when the opener is still on the page. */
    deactivate() {
      document.removeEventListener('keydown', onKey, true);
      const opener = previous;
      previous = null;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    },
  };
}
