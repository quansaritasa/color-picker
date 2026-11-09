import { check, mk, picker, handoff } from './harness.js';

const { suggPicker } = handoff;

// 24. focus trap and focus restore
const opener = document.getElementById('host');
suggPicker.close();
opener.focus();
suggPicker.open();
check('open moves focus into the dialog', suggPicker.root.contains(document.activeElement));
const focusables = [...suggPicker.root.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
  .filter((node) => node.getClientRects().length > 0);
const lastFocusable = focusables[focusables.length - 1];
lastFocusable.focus();
lastFocusable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
check('Tab wraps from the last control to the first', document.activeElement === focusables[0], document.activeElement && document.activeElement.className);
suggPicker.root.querySelector('.cp-primary-btn').click();
check('closing returns focus to the opener', document.activeElement === opener, document.activeElement && document.activeElement.id);

// 25. Home / End on the tablist
suggPicker.open();
suggPicker.setActiveSlot('background');
const tabButtons = suggPicker.root.querySelectorAll('.cp-tab');
tabButtons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
check('Home selects the first tab', suggPicker.activeSlot === 'text', suggPicker.activeSlot);
tabButtons[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
check('End selects the last tab', suggPicker.activeSlot === 'background', suggPicker.activeSlot);
suggPicker.close();

// 26. dialog semantics and the SV slider's value
const a11y = mk({ initialColors: { text: '#0F766E', background: '#70B1ED' } });
a11y.open();
const shell = a11y.root.querySelector('.cp-picker');
const titleId = shell.getAttribute('aria-labelledby');
check('shell is a modal dialog',
  shell.getAttribute('role') === 'dialog' && shell.getAttribute('aria-modal') === 'true',
  shell.getAttribute('role'));
check('dialog is named by its heading',
  !!titleId && !!document.getElementById(titleId)
    && document.getElementById(titleId).textContent === 'Choose Color',
  titleId);
const svArea = a11y.root.querySelector('.cp-sv');
const nowBefore = svArea.getAttribute('aria-valuenow');
svArea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
check('sv slider carries its range',
  svArea.getAttribute('aria-valuemin') === '0' && svArea.getAttribute('aria-valuemax') === '100');
check('sv slider reports the saturation it changes',
  nowBefore !== null && Number(nowBefore) > Number(svArea.getAttribute('aria-valuenow')),
  `${nowBefore} -> ${svArea.getAttribute('aria-valuenow')}`);
check('sv keeps the hex as its value text',
  /^#[0-9A-F]{6}$/.test(svArea.getAttribute('aria-valuetext')), svArea.getAttribute('aria-valuetext'));
a11y.close();
a11y.destroy();

// 27. escape belongs to the topmost instance only
const lower = mk({ initialColors: { text: '#0F766E', background: '#70B1ED' } });
const upper = mk({ initialColors: { text: '#991B1B', background: '#FEE2E2' } });
lower.open();
lower.setColors({ text: '#ABCDEF' });
upper.open();
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('escape closes the topmost picker only', !upper.isOpen && lower.isOpen, `${upper.isOpen} | ${lower.isOpen}`);
check('escape keeps the lower picker edits', lower.getColors().text === '#ABCDEF', lower.getColors().text);
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('the next escape closes the picker below', !lower.isOpen);
lower.destroy();
upper.destroy();

// 28. showAlpha: false turns alpha off instead of hiding it
const opaque = mk({ showAlpha: false });
check('showAlpha:false hides the opacity control', opaque.root.querySelector('.cp-alpha-range').hidden);
opaque.open();
const opaqueHex = opaque.root.querySelector('.cp-hex-input');
opaqueHex.value = '#FF000080';
opaqueHex.dispatchEvent(new Event('change', { bubbles: true }));
check('showAlpha:false drops the alpha of an 8-digit hex',
  opaque.getColors().text === '#FF0000', opaque.getColors().text);
// every writer, not just the editor: the option means alpha off on all entry paths
opaque.setColors({ text: '#00FF0040' });
check('showAlpha:false clamps alpha on setColors',
  opaque.getColors().text === '#00FF00', opaque.getColors().text);
check('showAlpha:false leaves the rendered hex opaque too',
  opaqueHex.value === '#00FF00', opaqueHex.value);
opaque.selectColor('#0000FF33', { source: 'preset' });
check('showAlpha:false clamps alpha on a preset color',
  opaque.getColors().text === '#0000FF', opaque.getColors().text);
let applied = null;
const opaqueApply = mk({
  showAlpha: false,
  initialColors: { text: '#11223344', background: '#44556677' },
  onApply: (colors) => { applied = colors; },
});
check('showAlpha:false clamps alpha in initialColors',
  opaqueApply.getColors().text === '#112233' && opaqueApply.getColors().background === '#445566',
  JSON.stringify(opaqueApply.getColors()));
opaqueApply.open();
opaqueApply.apply();
check('showAlpha:false clamps alpha in the onApply payload',
  applied && applied.text === '#112233', applied && applied.text);
opaqueApply.reset();
check('showAlpha:false clamps alpha after reset',
  opaqueApply.getColors().text === '#112233', opaqueApply.getColors().text);
opaqueApply.destroy();
opaque.destroy();

// 29. an editor commit clears the error message the editor left behind
const stale = mk({ initialColors: { text: '#0F766E', background: '#70B1ED' } });
stale.open();
const staleHex = stale.root.querySelector('.cp-hex-input');
staleHex.value = '#GGGGGG';
staleHex.dispatchEvent(new Event('change', { bubbles: true }));
const staleStatus = stale.root.querySelector('.cp-status');
check('invalid hex raises a status message', staleStatus.textContent === 'Enter a valid color value.', staleStatus.textContent);
const staleSv = stale.root.querySelector('.cp-sv');
const staleBox = staleSv.getBoundingClientRect();
const staleOpts = { bubbles: true, pointerId: 7, clientX: staleBox.left + staleBox.width * 0.3, clientY: staleBox.top + staleBox.height * 0.7 };
staleSv.dispatchEvent(new PointerEvent('pointerdown', staleOpts));
staleSv.dispatchEvent(new PointerEvent('pointermove', { ...staleOpts, clientX: staleBox.left + staleBox.width * 0.8, clientY: staleBox.top + staleBox.height * 0.2 }));
staleSv.dispatchEvent(new PointerEvent('pointerup', { ...staleOpts, pointerId: 7 }));
check('an editor commit clears the stale error', staleStatus.textContent === '', staleStatus.textContent);
stale.close();
stale.destroy();

