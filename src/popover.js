/**
 * Anchored placement for popover mode: the panel sits under the swatch that
 * opened it, flips above when the viewport is short, right-aligns when it would
 * overflow, and is clamped so it never leaves the screen. Below 680px the shell
 * is the mobile bottom sheet and the CSS owns the position, so nothing is
 * written there.
 *
 * No anchor (a programmatic `open()` with no swatches) centres the panel.
 */

const MARGIN = 8;
const GAP = 10;
const SHEET = '(max-width: 680px)';

/** Clamp that survives a panel bigger than the viewport (pin instead of flip). */
const within = (value, min, max) => (max < min ? min : Math.min(Math.max(value, min), max));

export function createPopover({ panel, getAnchor }) {
  let frame = 0;

  const coordinates = (box, anchorBox) => {
    let left = anchorBox ? anchorBox.left : (innerWidth - box.width) / 2;
    let top = anchorBox ? anchorBox.bottom + GAP : (innerHeight - box.height) / 2;
    if (anchorBox) {
      if (left + box.width > innerWidth - MARGIN) left = anchorBox.right - box.width;
      if (top + box.height > innerHeight - MARGIN) {
        const above = anchorBox.top - GAP - box.height;
        top = above >= MARGIN ? above : innerHeight - MARGIN - box.height;
      }
    }
    return {
      left: Math.round(within(left, MARGIN, innerWidth - MARGIN - box.width)),
      top: Math.round(within(top, MARGIN, innerHeight - MARGIN - box.height)),
    };
  };

  const place = () => {
    // Hidden: there is no box to fit, and writing a stale one would flash on open.
    if (!panel.getClientRects().length) return;
    if (window.matchMedia(SHEET).matches) {
      panel.style.left = '';
      panel.style.top = '';
      return;
    }
    const anchor = getAnchor();
    const anchorBox = anchor && anchor.isConnected ? anchor.getBoundingClientRect() : null;
    const at = coordinates(panel.getBoundingClientRect(), anchorBox);
    panel.style.left = `${at.left}px`;
    panel.style.top = `${at.top}px`;
  };

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      place();
    });
  };

  // Content grows (a suggestions panel opening, a preset row rewrapping) — the
  // box has to follow, so measure on every size change rather than on open only.
  const watcher = new ResizeObserver(schedule);
  watcher.observe(panel);
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', schedule, true);

  return {
    place,
    destroy() {
      watcher.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      if (frame) cancelAnimationFrame(frame);
    },
  };
}
