/**
 * The maximize toggle: one button in the header and one keystroke (`m`) that
 * swap the panel between its own box and the whole viewport. The previous size
 * and position are kept on the panel as inline styles, so restoring is exact —
 * including a box the user resized or dragged before maximizing. Below 680px
 * the shell is a bottom sheet and the sheet owns the box: the toggle is inert.
 */

const MARGIN = 8;
const SHEET = '(max-width: 680px)';

export function createMaximize({ panel, button, drag, pin, labels }) {
  /* Non-null only while maximized; holds what to put back. */
  let saved = null;

  const setLabel = (name) => {
    button.setAttribute('aria-label', name);
    button.title = name;
  };

  /** The box the panel takes when maximized, clamped to the viewport. */
  const fill = () => {
    panel.style.width = `${Math.max(0, innerWidth - 2 * MARGIN)}px`;
    panel.style.height = `${Math.max(0, innerHeight - 2 * MARGIN)}px`;
    /* The stylesheet caps the panel smaller than the screen; a maximized box is
       the screen, so the cap comes off for as long as the box is. */
    panel.style.maxHeight = 'none';
    /* Fixed, not "as large as the layout gives": a grid item that outgrows its
       area overflows one way, so the margin only holds on two sides. */
    panel.style.position = 'fixed';
    panel.style.left = `${MARGIN}px`;
    panel.style.top = `${MARGIN}px`;
  };

  const maximize = () => {
    if (saved) return;
    if (window.matchMedia(SHEET).matches) return;
    saved = {
      width: panel.style.width,
      height: panel.style.height,
      position: panel.style.position,
      left: panel.style.left,
      top: panel.style.top,
      maxHeight: panel.style.maxHeight,
      offset: drag.getOffset(),
    };
    /* A maximized popover is no longer anchored to its trigger. */
    if (pin) pin();
    drag.setOffset(0, 0);
    fill();
    panel.classList.add('is-maximized');
    setLabel(labels.restore);
  };

  const restore = () => {
    if (!saved) return;
    const previous = saved;
    saved = null;
    panel.classList.remove('is-maximized');
    panel.style.width = previous.width;
    panel.style.height = previous.height;
    panel.style.maxHeight = previous.maxHeight;
    panel.style.position = previous.position;
    panel.style.left = previous.left;
    panel.style.top = previous.top;
    drag.setOffset(previous.offset.x, previous.offset.y);
    setLabel(labels.maximize);
  };

  const toggle = () => (saved ? restore() : maximize());

  const onClick = () => toggle();

  /* A maximized box is a viewport measurement, so it follows the viewport —
     and gives up when the sheet takes over. */
  const onViewport = () => {
    if (!saved) return;
    if (window.matchMedia(SHEET).matches) restore();
    else fill();
  };

  button.addEventListener('click', onClick);
  window.addEventListener('resize', onViewport);

  return {
    get active() {
      return !!saved;
    },
    toggle,
    restore,
    destroy() {
      button.removeEventListener('click', onClick);
      window.removeEventListener('resize', onViewport);
    },
  };
}
