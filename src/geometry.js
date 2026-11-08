/**
 * One owner for the panel's box: header drag, corner resize and the maximize
 * toggle all move the same element, so they are built together and share one
 * way back to the shipped geometry (`reset()` on open). A caller that turns
 * `draggable`/`resizable` off keeps the other two — a stub stands in for the
 * missing piece instead of every caller guarding it.
 */

import { createDrag } from './drag.js';
import { createResize } from './resize.js';
import { createMaximize } from './maximize.js';

const stillDrag = {
  clamp() {},
  reset() {},
  getOffset: () => ({ x: 0, y: 0 }),
  setOffset() {},
  destroy() {},
};

export function createGeometry({ panel, header, grip, button, mode, draggable, resizable, getPopover, labels }) {
  /* The first real press takes the box out of the popover's hands: from then on
     the user's position wins over the trigger's. */
  const pin = () => {
    const popover = getPopover();
    if (popover) popover.pin();
  };

  const drag = draggable ? createDrag({ panel, handle: header, onStart: pin }) : stillDrag;
  if (draggable) header.classList.add('is-draggable');

  const resize = resizable
    ? createResize({ panel, grip, mode, onStart: pin, onChange: () => drag.clamp() })
    : { destroy() {} };
  panel.classList.toggle('is-resizable', Boolean(resizable));

  const maximize = createMaximize({ panel, button, drag, pin, labels });

  return {
    get maximized() {
      return maximize.active;
    },
    toggleMaximize: () => maximize.toggle(),
    clamp: () => drag.clamp(),
    /** Back to the shipped box: not maximized, not moved, re-anchored. */
    reset() {
      maximize.restore();
      /* A modal keeps the place the user dragged it to across open/close; a
         popover is anchored on every open, so its offset has to go. */
      if (mode === 'popover') drag.reset();
      const popover = getPopover();
      if (popover) popover.unpin();
    },
    destroy() {
      drag.destroy();
      resize.destroy();
      maximize.destroy();
    },
  };
}
