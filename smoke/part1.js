import { check, rootOf, q, events, picker } from './harness.js';

// 1. mount + closed
check('mounts a hidden root', rootOf(picker).classList.contains('cp-root') && rootOf(picker).classList.contains('cp-hidden'));
// Pins the `.cp-root.cp-hidden` rule itself: the class alone would still paint the overlay.
check('closed root is display:none', getComputedStyle(rootOf(picker)).display === 'none', getComputedStyle(rootOf(picker)).display);
check('initial colors normalized', JSON.stringify(picker.getColors()) === JSON.stringify({ text: '#0F766E', background: '#70B1ED' }), JSON.stringify(picker.getColors()));
check('two tabs rendered', picker.root.querySelectorAll('.cp-tab').length === 2);

// 2. open
picker.open();
check('open shows the modal', picker.isOpen && !rootOf(picker).classList.contains('cp-hidden'));
check('open root is displayed', getComputedStyle(rootOf(picker)).display !== 'none', getComputedStyle(rootOf(picker)).display);
check('onOpen fired', events.some(([n]) => n === 'open'));
check('active tab aria-selected', q(picker, '.cp-tab.cp-active').getAttribute('aria-selected') === 'true');

// 3. HEX commit on the active tab
const hex = q(picker, '.cp-hex-input');
hex.value = '#2563EB';
hex.dispatchEvent(new Event('change', { bubbles: true }));
check('hex change updates active tab', picker.getColors().text === '#2563EB', picker.getColors().text);
check('onChange fired for hex', events.filter(([n]) => n === 'change').length >= 1);

// 4. invalid hex is rejected without overwriting
hex.value = '#zzz';
hex.dispatchEvent(new Event('change', { bubbles: true }));
check('invalid hex keeps the color', picker.getColors().text === '#2563EB');
check('invalid hex shows a status message', q(picker, '.cp-status').textContent.length > 0, q(picker, '.cp-status').textContent);
check('invalid hex reverts the field', hex.value === '#2563EB', hex.value);

// 5. tab switching preserves per-tab colors
picker.root.querySelectorAll('.cp-tab')[1].click();
check('tab switch sets activeSlot', picker.activeSlot === 'background');
check('other tab keeps its color', picker.getColors().text === '#2563EB');
check('editor shows the new tab color', hex.value === '#70B1ED', hex.value);

hex.value = '#DBEAFE80';
hex.dispatchEvent(new Event('change', { bubbles: true }));
check('alpha hex normalizes', picker.getColors().background === '#DBEAFE80', picker.getColors().background);

// 6. getColors returns a copy
const copy = picker.getColors();
copy.text = '#000000';
check('getColors returns a copy', picker.getColors().text === '#2563EB');

// 7. setColors partial update
const before = events.filter(([n]) => n === 'change').length;
picker.setColors({ text: '#111827' });
check('setColors applies a partial', picker.getColors().text === '#111827');
check('setColors emits once', events.filter(([n]) => n === 'change').length === before + 1);
picker.setColors({ text: '#111827' });
check('setColors with no change does not emit', events.filter(([n]) => n === 'change').length === before + 1);

// 8. SV drag updates the color
const sv = q(picker, '.cp-sv');
const box = sv.getBoundingClientRect();
const colorBeforeDrag = picker.getColors().background;
const opts = { bubbles: true, pointerId: 1, clientX: box.left + box.width * 0.2, clientY: box.top + box.height * 0.8 };
sv.dispatchEvent(new PointerEvent('pointerdown', opts));
sv.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientX: box.left + box.width * 0.9, clientY: box.top + box.height * 0.1, pointerId: 1 }));
sv.dispatchEvent(new PointerEvent('pointerup', { ...opts, pointerId: 1 }));
check('sv drag changes the color', picker.getColors().background !== colorBeforeDrag, `${colorBeforeDrag} -> ${picker.getColors().background}`);

// 9. hue slider
const hue = q(picker, '.cp-hue-range input');
const beforeHue = picker.getColors().background;
hue.value = '30';
hue.dispatchEvent(new Event('input', { bubbles: true }));
check('hue slider changes the color', picker.getColors().background !== beforeHue);

// 10. alpha slider
const alpha = q(picker, '.cp-alpha-range input');
alpha.value = '50';
alpha.dispatchEvent(new Event('input', { bubbles: true }));
check('alpha slider produces an alpha hex', /^#[0-9A-F]{8}$/.test(picker.getColors().background), picker.getColors().background);

// 11. reset keeps the modal open and restores initial colors
picker.root.querySelector('.cp-reset-btn').click();
check('reset restores initial colors', picker.getColors().text === '#0F766E' && picker.getColors().background === '#70B1ED', JSON.stringify(picker.getColors()));
check('reset keeps the modal open', picker.isOpen);

// 12. apply commits and closes
picker.root.querySelector('.cp-primary-btn').click();
check('apply closes', !picker.isOpen);
check('onApply fired', events.some(([n]) => n === 'apply'));

// 13. cancel restores the open snapshot
picker.open();
picker.setActiveSlot('text');
hex.value = '#FF0000';
hex.dispatchEvent(new Event('change', { bubbles: true }));
check('edit before cancel', picker.getColors().text === '#FF0000');
picker.root.querySelector('.cp-secondary-btn').click();
check('cancel restores the snapshot', picker.getColors().text === '#0F766E', picker.getColors().text);
check('cancel closes', !picker.isOpen);
check('onCancel fired', events.some(([n]) => n === 'cancel'));

// 14. escape cancels
picker.open();
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('escape closes', !picker.isOpen);

