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

/** Rendered, focusable descendants of `root`, in DOM order. */
export function focusablesWithin(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter((node) => node.getClientRects().length > 0);
}

export function createFocusTrap(root) {
  let previous = null;

  const onKey = (event) => {
    if (event.key !== 'Tab') return;
    const nodes = focusablesWithin(root);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
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
