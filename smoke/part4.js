import { check, mk, handoff } from './harness.js';

const { second, suggPicker, dark } = handoff;

// 30. the panel is movable by its header
const movableEvents = [];
const movable = mk({
  initialColors: { text: '#0F766E', background: '#70B1ED' },
  onApply: () => movableEvents.push('apply'),
});
movable.open();
const shellPanel = movable.root.querySelector('.picker');
const shellHeader = movable.root.querySelector('.picker-header');
const panelStart = shellPanel.getBoundingClientRect();
const ptr = (type, x, y) => shellHeader.dispatchEvent(new PointerEvent(type, {
  bubbles: true, pointerId: 11, pointerType: 'mouse', button: 0, clientX: x, clientY: y,
}));
check('the header is a drag handle', shellHeader.classList.contains('is-draggable'));
ptr('pointerdown', panelStart.left + 100, panelStart.top + 20);
ptr('pointermove', panelStart.left - 20, panelStart.top + 60);
ptr('pointerup', panelStart.left - 20, panelStart.top + 60);
const panelMoved = shellPanel.getBoundingClientRect();
// Below 680px the shell is a bottom sheet: the same pointer sequence must not move it.
const sheetWidth = window.matchMedia('(max-width: 680px)').matches;
if (sheetWidth) {
  check('a bottom sheet ignores header drags',
    Math.round(panelMoved.left) === Math.round(panelStart.left) && Math.round(panelMoved.top) === Math.round(panelStart.top));
} else {
  check('dragging the header moves the panel by the pointer delta',
    Math.round(panelMoved.left - panelStart.left) === -120 && Math.round(panelMoved.top - panelStart.top) === 40,
    `${Math.round(panelMoved.left - panelStart.left)}, ${Math.round(panelMoved.top - panelStart.top)}`);
  ptr('pointerdown', panelMoved.left + 100, panelMoved.top + 20);
  ptr('pointermove', -5000, -5000);
  ptr('pointerup', -5000, -5000);
  const panelCorner = shellPanel.getBoundingClientRect();
  check('a drag stops at the viewport edge',
    Math.round(panelCorner.left) === 8 && Math.round(panelCorner.top) === 8,
    `${Math.round(panelCorner.left)}, ${Math.round(panelCorner.top)}`);
  shellHeader.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  const panelHome = shellPanel.getBoundingClientRect();
  check('double-click re-centres the panel',
    Math.round(panelHome.left) === Math.round(panelStart.left) && Math.round(panelHome.top) === Math.round(panelStart.top),
    `${Math.round(panelHome.left)}, ${Math.round(panelHome.top)}`);
}
// The close button must keep working: a press on it never starts a drag.
movable.root.querySelector('.close-btn').dispatchEvent(new PointerEvent('pointerdown', {
  bubbles: true, pointerId: 12, pointerType: 'mouse', button: 0, clientX: 5, clientY: 5,
}));
shellHeader.dispatchEvent(new PointerEvent('pointermove', {
  bubbles: true, pointerId: 12, pointerType: 'mouse', clientX: 400, clientY: 300,
}));
check('a press on the close button does not drag the panel',
  Math.round(shellPanel.getBoundingClientRect().left) === Math.round(panelStart.left));

// 30b. the box itself: resize grip, maximize toggle, and the shell keys
const grip = movable.root.querySelector('.resize-grip');
const maximizeBtn = movable.root.querySelector('.maximize-btn');
check('the panel carries a resize grip',
  !!grip && getComputedStyle(grip).cursor === 'nwse-resize', grip && getComputedStyle(grip).cursor);
check('the maximize toggle sits left of the close button',
  maximizeBtn.nextElementSibling === movable.root.querySelector('.close-btn'));
check('the toggle is named and shows the expand glyph',
  maximizeBtn.getAttribute('aria-label') === 'Maximize'
    && getComputedStyle(maximizeBtn.querySelector('.icon-expand')).display !== 'none'
    && getComputedStyle(maximizeBtn.querySelector('.icon-collapse')).display === 'none',
  maximizeBtn.getAttribute('aria-label'));

if (!sheetWidth) {
  const gripBox = grip.getBoundingClientRect();
  const boxBefore = shellPanel.getBoundingClientRect();
  const gripPt = (type, x, y) => grip.dispatchEvent(new PointerEvent(type, {
    bubbles: true, pointerId: 31, pointerType: 'mouse', button: 0, clientX: x, clientY: y,
  }));
  gripPt('pointerdown', gripBox.left + 8, gripBox.top + 8);
  gripPt('pointermove', gripBox.left + 128, gripBox.top + 88);
  gripPt('pointerup', gripBox.left + 128, gripBox.top + 88);
  const boxResized = shellPanel.getBoundingClientRect();
  /* The stylesheet caps the box at `calc(100vh - 32px)`; a palette that fills
     the panel leaves less than the pointer's 80px, so the expectation is the
     pointer delta up to that cap — not a fixed 80. */
  const capPx = parseFloat(getComputedStyle(shellPanel).maxHeight);
  const wantHeight = Math.min(boxBefore.height + 80, Number.isFinite(capPx) ? capPx : Infinity);
  check('dragging the grip resizes the panel by the pointer delta, up to the stylesheet cap',
    Math.round(boxResized.width - boxBefore.width) === 120 && Math.abs(boxResized.height - wantHeight) <= 1,
    `${Math.round(boxBefore.width)}x${Math.round(boxBefore.height)} -> ${Math.round(boxResized.width)}x${Math.round(boxResized.height)}, cap ${capPx}`);
  const gripAfter = grip.getBoundingClientRect();
  check('the grip stays in the panel corner', Math.abs(boxResized.right - gripAfter.right) <= 1
    && Math.abs(boxResized.bottom - gripAfter.bottom) <= 1,
    `${Math.round(boxResized.right - gripAfter.right)}, ${Math.round(boxResized.bottom - gripAfter.bottom)}`);

  // A press on the toggle is a button press, never the start of a drag.
  maximizeBtn.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, pointerId: 32, pointerType: 'mouse', button: 0, clientX: 5, clientY: 5,
  }));
  shellHeader.dispatchEvent(new PointerEvent('pointermove', {
    bubbles: true, pointerId: 32, pointerType: 'mouse', clientX: 500, clientY: 400,
  }));
  check('a press on the maximize button does not drag the panel',
    Math.round(shellPanel.getBoundingClientRect().left) === Math.round(boxResized.left));

  maximizeBtn.click();
  const boxMax = shellPanel.getBoundingClientRect();
  check('maximizing fills the viewport',
    Math.round(boxMax.left) === 8 && Math.round(boxMax.top) === 8
      && Math.round(boxMax.width) === innerWidth - 16 && Math.round(boxMax.height) === innerHeight - 16,
    `${Math.round(boxMax.left)},${Math.round(boxMax.top)} ${Math.round(boxMax.width)}x${Math.round(boxMax.height)}`);
  check('the toggle flips to the way back',
    shellPanel.classList.contains('is-maximized') && maximizeBtn.getAttribute('aria-label') === 'Restore'
      && getComputedStyle(maximizeBtn.querySelector('.icon-collapse')).display !== 'none',
    maximizeBtn.getAttribute('aria-label'));
  check('the grip is hidden while maximized', getComputedStyle(grip).display === 'none');

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
  const boxRestored = shellPanel.getBoundingClientRect();
  check('m restores the box the panel had before',
    Math.round(boxRestored.width) === Math.round(boxResized.width)
      && Math.round(boxRestored.height) === Math.round(boxResized.height),
    `${Math.round(boxRestored.width)}x${Math.round(boxRestored.height)}`);
  check('the toggle is named again', maximizeBtn.getAttribute('aria-label') === 'Maximize');

  // The HEX field owns its letters: `m` there is typing, not a shortcut.
  const hexField = movable.root.querySelector('.hex-input');
  hexField.focus();
  hexField.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
  check('m typed into the HEX field is not a shortcut', !shellPanel.classList.contains('is-maximized'));
  hexField.blur();
}

/* The OK button, on the keyboard: a modal commits and closes. */
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, bubbles: true }));
check('⌘+Enter is the OK button', !movable.isOpen && movableEvents.includes('apply'), movableEvents.join(','));

/* The box survives a close: a modal is put back where the user dragged it. */
movable.open();
const homeBox = shellPanel.getBoundingClientRect();
const offPt = (type, x, y) => shellHeader.dispatchEvent(new PointerEvent(type, {
  bubbles: true, pointerId: 51, pointerType: 'mouse', button: 0, clientX: x, clientY: y,
}));
offPt('pointerdown', homeBox.left + 100, homeBox.top + 20);
offPt('pointermove', homeBox.left + 150, homeBox.top + 40);
offPt('pointerup', homeBox.left + 150, homeBox.top + 40);
movable.close();
movable.open();
const keptBox = shellPanel.getBoundingClientRect();
/* drag.js keeps an 8px margin: a box that already fills the viewport moves
   less than the pointer asked for, so the expectation is the clamp. */
const roomY = Math.max(0, innerHeight - 8 - homeBox.top - homeBox.height);
const wantDy = Math.round(Math.min(20, roomY));
check('a modal keeps its dragged position across open/close',
  Math.round(keptBox.left - homeBox.left) === 50 && Math.round(keptBox.top - homeBox.top) === wantDy,
  `${Math.round(keptBox.left - homeBox.left)}, ${Math.round(keptBox.top - homeBox.top)} (room ${Math.round(roomY)})`);
movable.destroy();

const fixedShell = mk({ draggable: false });
fixedShell.open();
const fixedPanel = fixedShell.root.querySelector('.picker');
const fixedHeader = fixedShell.root.querySelector('.picker-header');
const fixedStart = fixedPanel.getBoundingClientRect().left;
const fixedPt = (type, x, y) => fixedHeader.dispatchEvent(new PointerEvent(type, {
  bubbles: true, pointerId: 13, pointerType: 'mouse', button: 0, clientX: x, clientY: y,
}));
fixedPt('pointerdown', fixedStart + 100, 100);
fixedPt('pointermove', fixedStart + 300, 300);
fixedPt('pointerup', fixedStart + 300, 300);
check('draggable:false keeps the shell fixed',
  Math.round(fixedPanel.getBoundingClientRect().left) === Math.round(fixedStart) && !fixedHeader.classList.contains('is-draggable'));
check('draggable:false keeps the resize grip', !!fixedShell.root.querySelector('.resize-grip')
  && getComputedStyle(fixedShell.root.querySelector('.resize-grip')).display !== 'none');
fixedShell.destroy();

const noResize = mk({ resizable: false, draggable: false });
noResize.open();
check('resizable:false drops the grip',
  getComputedStyle(noResize.root.querySelector('.resize-grip')).display === 'none',
  getComputedStyle(noResize.root.querySelector('.resize-grip')).display);
noResize.root.querySelector('.maximize-btn').click();
check('the maximize toggle survives a fixed, unresizable panel',
  noResize.refs.panel.classList.contains('is-maximized'));
noResize.destroy();

dark.destroy();
suggPicker.destroy();

second.destroy();
check('destroy removes the root', document.querySelectorAll('.cp-root').length === 1);


handoff.sheetWidth = sheetWidth;
