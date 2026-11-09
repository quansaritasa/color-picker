/**
 * Pointer resize for the picker shell: the corner grip writes an explicit
 * width/height on the panel, clamped to the room the viewport leaves it, so the
 * box is grown and never pushed off the screen. A popover grows right/down from
 * the corner it hangs off; a modal grows from the centre, so both edges share
 * the room. Below 680px the shell is a bottom sheet that owns its own size, and
 * a maximized box is already the screen: the grip does nothing in either case.
 */

const MARGIN = 8;
const MIN_WIDTH = 400;
const MIN_HEIGHT = 320;
const SHEET = '(max-width: 680px)';

/** Clamp that survives a panel bigger than the viewport (pin instead of flip). */
const within = (value, min, max) => (max < min ? min : Math.min(Math.max(value, min), max));

export function createResize({ panel, grip, mode, onStart, onChange }) {
  let start = null;

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (window.matchMedia(SHEET).matches) return;
    if (panel.classList.contains('cp-is-maximized')) return;
    const rect = panel.getBoundingClientRect();
    start = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, rect };
    panel.classList.add('cp-is-resizing');
    /* A resized popover is a box the user owns: stop anchoring it. */
    if (onStart) onStart();
    try {
      grip.setPointerCapture(event.pointerId);
    } catch (error) {
      /* a synthetic pointer has no active capture target */
    }
    event.preventDefault();
  };

  const onPointerMove = (event) => {
    if (!start) return;
    const { rect } = start;
    /* A popover is pinned by its left/top; a centred modal can grow into the
       room on both sides. */
    const roomWidth = mode === 'popover' ? innerWidth - MARGIN - rect.left : innerWidth - 2 * MARGIN;
    const roomHeight = mode === 'popover' ? innerHeight - MARGIN - rect.top : innerHeight - 2 * MARGIN;
    const width = within(start.width + (event.clientX - start.x), MIN_WIDTH, roomWidth);
    const height = within(start.height + (event.clientY - start.y), MIN_HEIGHT, roomHeight);
    panel.style.width = `${Math.round(width)}px`;
    panel.style.height = `${Math.round(height)}px`;
    if (onChange) onChange();
  };

  const onPointerUp = () => {
    if (!start) return;
    start = null;
    panel.classList.remove('cp-is-resizing');
  };

  grip.addEventListener('pointerdown', onPointerDown);
  grip.addEventListener('pointermove', onPointerMove);
  grip.addEventListener('pointerup', onPointerUp);
  grip.addEventListener('pointercancel', onPointerUp);

  return {
    destroy() {
      grip.removeEventListener('pointerdown', onPointerDown);
      grip.removeEventListener('pointermove', onPointerMove);
      grip.removeEventListener('pointerup', onPointerUp);
      grip.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
