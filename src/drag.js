/**
 * Pointer drag for the picker shell. The overlay keeps the panel centred; a
 * translate offset moves it from there and is clamped to the viewport, so the
 * panel can never be dragged out of reach. Below 680px the shell is a bottom
 * sheet that owns its own scroll, so dragging is off there. There is no
 * keyboard equivalent on purpose: the dialog is fully usable un-moved.
 */

const MARGIN = 8;
const SHEET = '(max-width: 680px)';
const CONTROLS = 'button, input, select, textarea, a[href], [role="slider"]';

/** Clamp that survives a panel larger than the viewport (pin instead of flip). */
const within = (value, min, max) => (max < min ? min : Math.min(Math.max(value, min), max));

export function createDrag({ panel, handle }) {
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
    offset.x = within(offset.x, MARGIN - box.left, innerWidth - MARGIN - box.left - box.width);
    offset.y = within(offset.y, MARGIN - box.top, innerHeight - MARGIN - box.top - box.height);
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
    // The close button and the title stay clickable: only bare header drags.
    if (event.target.closest(CONTROLS)) return;
    start = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    panel.classList.add('is-dragging');
    try {
      handle.setPointerCapture(event.pointerId);
    } catch (error) {
      /* a synthetic pointer has no active capture target */
    }
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!start) return;
    const box = frame();
    offset.x = start.ox + (event.clientX - start.x);
    offset.y = start.oy + (event.clientY - start.y);
    clampTo(box);
    paint();
  };

  const onPointerUp = () => {
    if (!start) return;
    start = null;
    panel.classList.remove('is-dragging');
  };

  /** Double-clicking the header puts the panel back in the middle. */
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
