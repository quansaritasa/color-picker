import { check, mk, handoff } from './harness.js';

const { sheetWidth } = handoff;

// 31. trigger bar and popover mode
const triggerHost = document.createElement('div');
document.body.append(triggerHost);
const popEvents = [];
const pop = mk({
  triggers: triggerHost,
  initialColors: { text: '#0F766E', background: '#70B1ED' },
  onCancel: () => popEvents.push('cancel'),
  onApply: () => popEvents.push('apply'),
});
const triggers = [...triggerHost.querySelectorAll('.cp-trigger')];
check('one trigger per tab', triggers.length === 2, String(triggers.length));
check('a trigger is a popup button', triggers.every((b) => b.getAttribute('aria-haspopup') === 'dialog'));
check('the trigger chip carries its color',
  triggers[0].querySelector('.cp-trigger-chip').style.getPropertyValue('--cpt-fill') === '#0F766E',
  triggers[0].querySelector('.cp-trigger-chip').style.getPropertyValue('--cpt-fill'));
check('the trigger is named with its color',
  (triggers[1].getAttribute('aria-label') || '').includes('#70B1ED'), triggers[1].getAttribute('aria-label'));
check('triggers pick the popover by default', pop.options.mode === 'popover', pop.options.mode);
check('a popover is movable like any other panel',
  pop.options.draggable && pop.refs.header.classList.contains('cp-is-draggable'));
check('a popover carries the resize grip',
  !!pop.refs.grip && getComputedStyle(pop.refs.grip).display !== 'none');
check('a closed popover paints nothing', getComputedStyle(pop.root).display === 'none', getComputedStyle(pop.root).display);
check('a popover has no scrim', getComputedStyle(pop.root).backgroundColor === 'rgba(0, 0, 0, 0)', getComputedStyle(pop.root).backgroundColor);

triggers[1].click();
const popBox = pop.refs.panel.getBoundingClientRect();
const anchorBox = triggers[1].getBoundingClientRect();
check('clicking a trigger opens the picker', pop.isOpen);
check('the clicked trigger picks its tab', pop.activeSlot === 'background', pop.activeSlot);
check('only the open trigger is marked expanded',
  triggers[1].getAttribute('aria-expanded') === 'true' && triggers[0].getAttribute('aria-expanded') === 'false');
check('the panel follows its trigger',
  Math.abs(popBox.top - anchorBox.bottom) <= 12 || Math.abs(anchorBox.top - popBox.bottom) <= 12,
  `${Math.round(popBox.top)} vs ${Math.round(anchorBox.bottom)}`);
check('the panel stays inside the viewport',
  popBox.left >= 0 && popBox.top >= 0 && popBox.right <= innerWidth + 0.5 && popBox.bottom <= innerHeight + 0.5,
  `${Math.round(popBox.left)},${Math.round(popBox.top)},${Math.round(popBox.right)},${Math.round(popBox.bottom)}`);
check('a popover renders no footer', getComputedStyle(pop.root.querySelector('.cp-footer')).display === 'none');

/* The `All` union grid is taller than one category: the box may grow, its top
   edge may not move (`place()` is the path the ResizeObserver drives live). */
const allPill = [...pop.root.querySelectorAll('.cp-category')].find((p) => p.textContent.trim() === 'All');
const gridBefore = pop.refs.sections.text.swatches.getBoundingClientRect().height;
allPill.click();
pop.popover.place();
const grownBox = pop.refs.panel.getBoundingClientRect();
const gridAfter = pop.refs.sections.text.swatches.getBoundingClientRect().height;
check('the All grid is taller than one category', gridAfter > gridBefore, `${Math.round(gridBefore)} -> ${Math.round(gridAfter)}`);
check('a taller preset grid keeps the popover top', Math.abs(grownBox.top - popBox.top) <= 0.5,
  `${Math.round(popBox.top)} -> ${Math.round(grownBox.top)}`);
check('the capped popover still ends inside the viewport', grownBox.bottom <= innerHeight - 7.5 && grownBox.top >= 7.5,
  `${Math.round(grownBox.top)}..${Math.round(grownBox.bottom)} of ${innerHeight}`);

/* 31b. the popover's box is the user's too: drag detaches it from its trigger,
   the toggle takes it to the screen and back, and a reopen hands it back. */
if (!sheetWidth) {
  const popHeader = pop.refs.header;
  const popPt = (type, x, y) => popHeader.dispatchEvent(new PointerEvent(type, {
    bubbles: true, pointerId: 41, pointerType: 'mouse', button: 0, clientX: x, clientY: y,
  }));
  const popDrag = (from, dx, dy) => {
    popPt('pointerdown', from.left + 100, from.top + 20);
    popPt('pointermove', from.left + 100 + dx, from.top + 20 + dy);
    popPt('pointerup', from.left + 100 + dx, from.top + 20 + dy);
    return pop.refs.panel.getBoundingClientRect();
  };
  const popCorner = popDrag(pop.refs.panel.getBoundingClientRect(), -5000, -5000);
  check('a dragged popover stops at the viewport edge',
    Math.round(popCorner.left) === 8 && Math.round(popCorner.top) === 8,
    `${Math.round(popCorner.left)},${Math.round(popCorner.top)}`);
  const popMoved = popDrag(popCorner, 40, 30);
  check('dragging a popover moves it by the pointer delta',
    Math.round(popMoved.left - popCorner.left) === 40 && Math.round(popMoved.top - popCorner.top) === 30,
    `${Math.round(popMoved.left - popCorner.left)}, ${Math.round(popMoved.top - popCorner.top)}`);
  /* The anchor no longer owns the box: a re-place leaves it where it is. */
  pop.popover.place();
  const popPinned = pop.refs.panel.getBoundingClientRect();
  check('a moved popover stops following its trigger',
    Math.round(popPinned.left) === Math.round(popMoved.left) && Math.round(popPinned.top) === Math.round(popMoved.top),
    `${Math.round(popPinned.left)},${Math.round(popPinned.top)}`);

  const popToggle = pop.root.querySelector('.cp-maximize-btn');
  popToggle.click();
  const popMax = pop.refs.panel.getBoundingClientRect();
  check('maximizing a popover fills the viewport',
    Math.round(popMax.left) === 8 && Math.round(popMax.top) === 8
      && Math.round(popMax.width) === innerWidth - 16 && Math.round(popMax.height) === innerHeight - 16,
    `${Math.round(popMax.left)},${Math.round(popMax.top)} ${Math.round(popMax.width)}x${Math.round(popMax.height)}`);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
  const popBack = pop.refs.panel.getBoundingClientRect();
  check('m puts the popover back where the user left it',
    Math.round(popBack.left) === Math.round(popMoved.left) && Math.round(popBack.top) === Math.round(popMoved.top)
      && Math.round(popBack.width) === Math.round(popMoved.width),
    `${Math.round(popBack.left)},${Math.round(popBack.top)} ${Math.round(popBack.width)}`);
}

pop.selectColor('#123456', { source: 'preset', slot: 'background' });
document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
check('a click outside closes the popover', !pop.isOpen);
check('the closed popover keeps the edit it was closed with', pop.getColors().background === '#123456', pop.getColors().background);
check('a popover never cancels or applies', popEvents.length === 0, popEvents.join(','));

triggers[0].click();
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('escape closes the popover', !pop.isOpen);
check('escape keeps the popover edit too', pop.getColors().background === '#123456');

/* A fresh open hands the box back to the trigger, not to the last position. */
triggers[0].click();
const reopened = pop.refs.panel.getBoundingClientRect();
const reopenedAnchor = triggers[0].getBoundingClientRect();
check('reopening re-anchors a moved popover',
  Math.abs(reopened.top - reopenedAnchor.bottom) <= 12 || Math.abs(reopenedAnchor.top - reopened.bottom) <= 12,
  `${Math.round(reopened.top)} vs ${Math.round(reopenedAnchor.bottom)}`);
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, bubbles: true }));
check('⌘+Enter closes a popover like the OK button', !pop.isOpen);
check('⌘+Enter keeps the popover edit', pop.getColors().background === '#123456', pop.getColors().background);

triggers[0].click();
triggers[0].click();
check('a second click on the same trigger closes it', !pop.isOpen);

pop.destroy();
check('destroy removes the trigger bar', triggerHost.querySelector('.cp-trigger') === null);
triggerHost.remove();

// 32. header icons, the modal footer, and the HEX error on the field
const shellPicker = mk({ initialColors: { text: '#0F766E', background: '#70B1ED' } });
const resetBtn = shellPicker.root.querySelector('.cp-reset-btn');
check('reset sits in the header', !!shellPicker.root.querySelector('.cp-picker-header .cp-reset-btn'));
check('reset is an icon button, named for screen readers',
  resetBtn.textContent.trim() === '↺' && resetBtn.getAttribute('aria-label') === 'Reset',
  `${resetBtn.textContent.trim()} / ${resetBtn.getAttribute('aria-label')}`);
check('the status line takes no space',
  getComputedStyle(shellPicker.root.querySelector('.cp-status')).position === 'absolute',
  getComputedStyle(shellPicker.root.querySelector('.cp-status')).position);
shellPicker.open();
check('a modal keeps its footer', !shellPicker.root.querySelector('.cp-footer').hidden
  && getComputedStyle(shellPicker.root.querySelector('.cp-footer')).display !== 'none');
const badHex = shellPicker.root.querySelector('.cp-hex-input');
badHex.value = '#NOPE';
badHex.dispatchEvent(new Event('change', { bubbles: true }));
check('a rejected HEX marks the field itself', badHex.getAttribute('aria-invalid') === 'true');
badHex.value = '#123456';
badHex.dispatchEvent(new Event('change', { bubbles: true }));
check('a valid HEX clears the mark', !badHex.hasAttribute('aria-invalid'), badHex.value);
shellPicker.destroy();

