/**
 * Anchored placement for popover mode: the panel sits under the trigger that
 * opened it, flips above when the viewport is short, right-aligns when it would
 * overflow, and is clamped so it never leaves the screen. Below 680px the shell
 * is the mobile bottom sheet and the CSS owns the position, so nothing is
 * written there.
 *
 * The top edge is *pinned* for as long as the trigger and the viewport stay put:
 * growing the panel (a preset section switched to `All`, a suggestions block
 * opened) changes its height and never its top. Room the box cannot get without
 * moving is taken back as a `max-height`, so the panel scrolls inside itself
 * instead of flipping above the trigger or running off the screen mid-edit. A
 * panel flipped above its trigger keeps the opening height it was fitted with —
 * growing downwards there would cover the anchor.
 *
 * No anchor (a programmatic `open()` with no triggers) centres the panel.
 *
 * The user can take the box away from the anchor: the first drag or resize
 * (`pin()`) stops the anchored placement for as long as the panel is open, so a
 * moved popover stays where it was put instead of jumping back under its
 * trigger on the next content resize or page scroll.
 */

const MARGIN = 8;
const GAP = 10;
const SHEET = '(max-width: 680px)';
/* Shorter than this a scrolling panel is unusable, so the box stays on screen. */
const MIN_ROOM = 160;

/** Clamp that survives a panel bigger than the viewport (pin instead of flip). */
const within = (value, min, max) => (max < min ? min : Math.min(Math.max(value, min), max));

export function createPopover({ panel, getAnchor }) {
  let frame = 0;
  /* The left/top the current box was measured against. A content resize comes
     back through `place()`; an unchanged key is what keeps the top still. */
  let placed = null;
  /* True once the user moved or resized the box: the anchor no longer owns it. */
  let pinned = false;

  /* Trigger box + viewport. Scroll moves the trigger, so it recomputes. */
  const keyOf = (anchorBox) => {
    const box = anchorBox
      ? [anchorBox.left, anchorBox.top, anchorBox.width, anchorBox.height].map(Math.round).join(',')
      : 'none';
    return `${innerWidth}|${innerHeight}|${box}`;
  };

  /** The box `panel` should occupy, plus how tall it may grow from that top. */
  const coordinates = (box, anchorBox) => {
    let left = anchorBox ? anchorBox.left : (innerWidth - box.width) / 2;
    let top = anchorBox ? anchorBox.bottom + GAP : (innerHeight - box.height) / 2;
    let flipped = false;
    if (anchorBox) {
      if (left + box.width > innerWidth - MARGIN) left = anchorBox.right - box.width;
      if (top + box.height > innerHeight - MARGIN) {
        const above = anchorBox.top - GAP - box.height;
        flipped = above >= MARGIN;
        top = flipped ? above : innerHeight - MARGIN - box.height;
      }
    }
    const at = {
      left: Math.round(within(left, MARGIN, innerWidth - MARGIN - box.width)),
      top: Math.round(within(top, MARGIN, innerHeight - MARGIN - box.height)),
    };
    return {
      ...at,
      /* A panel hung above its trigger stops at the trigger, not at the screen
         edge: growth downwards would cover the anchor it hangs off. */
      room: flipped ? Math.round(box.height) : Math.round(innerHeight - MARGIN - at.top),
    };
  };

  const paint = () => {
    panel.style.left = `${placed.left}px`;
    panel.style.top = `${placed.top}px`;
    panel.style.maxHeight = `${Math.max(MIN_ROOM, placed.room)}px`;
  };

  const place = () => {
    // Hidden: there is no box to fit, and writing a stale one would flash on open.
    if (!panel.getClientRects().length) return;
    if (window.matchMedia(SHEET).matches) {
      panel.style.left = '';
      panel.style.top = '';
      panel.style.maxHeight = '';
      placed = null;
      /* The sheet owns the box; coming back to a wide viewport re-anchors. */
      pinned = false;
      return;
    }
    if (pinned) {
      /* The user's box: keep left/top, take back only the height the viewport
         refuses. Written as a cap so the panel scrolls instead of overflowing. */
      const box = panel.getBoundingClientRect();
      panel.style.maxHeight = `${Math.max(MIN_ROOM, Math.round(innerHeight - MARGIN - box.top))}px`;
      return;
    }
    const anchor = getAnchor();
    const anchorBox = anchor && anchor.isConnected ? anchor.getBoundingClientRect() : null;
    const key = keyOf(anchorBox);
    if (!placed || placed.key !== key) {
      // Measure the natural box: a cap written for the previous top would make
      // the flip decision on a height the panel does not actually want.
      panel.style.maxHeight = '';
      placed = { key, ...coordinates(panel.getBoundingClientRect(), anchorBox) };
    }
    paint();
  };

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      place();
    });
  };

  // Content grows (a suggestions panel opening, a preset row rewrapping) — the
  // box has to follow in height, but never by moving its top, so `place()`
  // only re-decides when the trigger or the viewport moved.
  const watcher = new ResizeObserver(schedule);
  /* Watched only while the panel is open: a closed popover has no box to fit, and
     a capture-phase scroll listener would otherwise wake it for every scroll on
     the page. */
  let watching = false;
  const detach = () => {
    if (!watching) return;
    watching = false;
    watcher.disconnect();
    window.removeEventListener('resize', schedule);
    window.removeEventListener('scroll', schedule, true);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  return {
    place,
    /** The panel is open: follow content, viewport and scroll. */
    attach() {
      if (watching) return;
      watching = true;
      watcher.observe(panel);
      window.addEventListener('resize', schedule);
      window.addEventListener('scroll', schedule, true);
    },
    /** The panel closed: stop following. */
    detach,
    /** The user moved or resized the box: stop placing it from its anchor. */
    pin() {
      pinned = true;
    },
    /** Back to the anchor — the next open starts under its trigger again. */
    unpin() {
      pinned = false;
      placed = null;
    },
    destroy: detach,
  };
}
