/**
 * Pointer drag for the picker shell. A translate offset moves the panel off
 * wherever the layout put it — the middle of the viewport for a modal, under
 * its trigger for a popover. It may be dragged partly off-screen, but never so
 * far that the header leaves the viewport, so the panel stays within reach. Below 680px the shell is a bottom sheet that
 * owns its own scroll, so dragging is off there. There is no keyboard
 * equivalent on purpose: `m` gives the keyboard user a full-size box instead.
 */

/* The panel may leave the viewport, but this much of it stays on screen to grab it back:
   the header can never rise above the top edge. */
const GRAB = 80;
const SHEET = '(max-width: 680px)';
const CONTROLS = 'button, input, select, textarea, a[href], [role="slider"]';

/** Clamp that survives a panel larger than the viewport (pin instead of flip). */
const within = (value, min, max) => (max < min ? min : Math.min(Math.max(value, min), max));

export function createDrag({ panel, handle, onStart }) {
  const offset = { x: 0, y: 0 };
  let start = null;

  /** The panel's layout box without the current offset — the frame moves sit in. */
  const frame = () => {
    const rect = panel.getBoundingClientRect();
    return { left: rect.left - offset.x, top: rect.top - offset.y, width: rect.width, height: rect.height };
  };

  const paint = () => {
    panel.style.transform = offset.x || offset.y ? `translate(${offset.x}px, ${offset.y}px)` : '';
  };

  const clampTo = (box) => {
    offset.x = within(offset.x, GRAB - box.left - box.width, innerWidth - GRAB - box.left);
    offset.y = within(offset.y, -box.top, innerHeight - GRAB - box.top);
  };

  /** Re-fit after the viewport changed while the panel sits off-centre. */
  const clamp = () => {
    if (!offset.x && !offset.y) return;
    clampTo(frame());
    paint();
  };

  const onPointerDown = (event) => {
    // Left button only for a mouse; touch and pen report their own `button`.
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (window.matchMedia(SHEET).matches) return;
    // A maximized box is the screen; there is nowhere to move it to.
    if (panel.classList.contains('cp-is-maximized')) return;
    // The close button and the title stay clickable: only bare header drags.
    if (event.target.closest(CONTROLS)) return;
    /* The layout frame does not move while the box is dragged, so it is read once. */
    start = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y, box: frame() };
    panel.classList.add('cp-is-dragging');
    /* A moved popover stops following its trigger: the caller takes the box
       out of the anchor's hands on the first real press, not on the first move. */
    if (onStart) onStart();
    try {
      handle.setPointerCapture(event.pointerId);
    } catch (error) {
      /* a synthetic pointer has no active capture target */
    }
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!start) return;
    const box = start.box;
    offset.x = start.ox + (event.clientX - start.x);
    offset.y = start.oy + (event.clientY - start.y);
    clampTo(box);
    paint();
  };

  const onPointerUp = () => {
    if (!start) return;
    start = null;
    panel.classList.remove('cp-is-dragging');
  };

  /** Double-clicking the header puts the panel back where the layout wants it. */
  const onDoubleClick = (event) => {
    if (event.target.closest(CONTROLS)) return;
    offset.x = 0;
    offset.y = 0;
    paint();
  };

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onPointerUp);
  handle.addEventListener('dblclick', onDoubleClick);
  window.addEventListener('resize', clamp);

  return {
    clamp,
    /** Move back to the layout position: a fresh open starts anchored. */
    reset() {
      offset.x = 0;
      offset.y = 0;
      paint();
    },
    /** The live translate, so maximize can put the box back where it was. */
    getOffset: () => ({ x: offset.x, y: offset.y }),
    setOffset(x, y) {
      offset.x = x;
      offset.y = y;
      paint();
    },
    destroy() {
      handle.removeEventListener('pointerdown', onPointerDown);
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerUp);
      handle.removeEventListener('pointercancel', onPointerUp);
      handle.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('resize', clamp);
    },
  };
}
