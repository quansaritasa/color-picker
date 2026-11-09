import { ColorPicker, check, mk } from './harness.js';

// 38. two tabs may share one preset group: the tab name tells them apart
const host4 = document.createElement('div');
document.body.append(host4);
const shared = mk({
  slots: [
    { id: 'page', label: 'Page background', symbol: '▰', presetSet: 'background' },
    { id: 'card', label: 'Card background', symbol: '▰', presetSet: 'background' },
    { id: 'ink', label: 'Body ink', symbol: 'Aa', presetSet: 'text' },
  ],
  initialColors: { page: '#F9FAFB', card: '#FFFFFF', ink: '#111827' },
  triggers: host4,
  showContrastSuggestions: true,
  contrastPair: ['ink', 'page'],
});
shared.open();
const sharedTabs = [...shared.root.querySelectorAll('.cp-tab')];
check('one tab per slot, whatever their groups',
  sharedTabs.length === 3 && shared.root.style.getPropertyValue('--cp-slots') === '3',
  `${sharedTabs.length} tabs`);
check('two slots of one group get two distinct tabs',
  sharedTabs[0].dataset.slot === 'page' && sharedTabs[1].dataset.slot === 'card' &&
    sharedTabs[0].querySelector('strong').textContent === 'Page background' &&
    sharedTabs[1].querySelector('strong').textContent === 'Card background',
  sharedTabs.map((t) => t.dataset.slot).join(','));
check('both tabs of one group carry the same type',
  sharedTabs[0].querySelector('.cp-tab-type').textContent === 'Background' &&
    sharedTabs[1].querySelector('.cp-tab-type').textContent === 'Background',
  sharedTabs.map((t) => t.querySelector('.cp-tab-type').textContent).join(','));

sharedTabs[1].click();
check('the second tab of a group is its own slot',
  shared.activeSlot === 'card' && shared.getColors().page === '#F9FAFB' && shared.getColors().card === '#FFFFFF',
  JSON.stringify(shared.getColors()));

const sharedBackground = shared.root.querySelector('.cp-preset-section[data-group="background"]');
const sharedSwatch = [...sharedBackground.querySelectorAll('.cp-swatch')]
  .find((n) => n.dataset.hex.toUpperCase() !== '#F9FAFB');
const sharedHex = sharedSwatch.dataset.hex;
sharedSwatch.click();
check('a swatch writes only the tab it is on',
  shared.getColors().card === sharedHex && shared.getColors().page === '#F9FAFB' &&
    shared.getColors().ink === '#111827',
  JSON.stringify(shared.getColors()));
check('both tabs of one group emphasise that group',
  sharedBackground.classList.contains('cp-is-emphasis') &&
    !shared.root.querySelector('.cp-preset-section[data-group="text"]').classList.contains('cp-is-emphasis'));
shared.setActiveSlot('page');
check('switching between two tabs of one group keeps the emphasis',
  sharedBackground.classList.contains('cp-is-emphasis') && shared.activeSlot === 'page');
check('each of the shared tabs kept its own colour',
  shared.getColors().page === '#F9FAFB' && shared.getColors().card === sharedHex,
  JSON.stringify(shared.getColors()));

shared.setActiveSlot('card');
check('a slot outside contrastPair hides the suggestions',
  shared.refs.suggestions.hidden && sharedBackground.classList.contains('cp-is-emphasis'));
shared.destroy();
host4.remove();

// 39. container takes a selector or an element, and a bad selector is named
const mount = document.createElement('div');
mount.id = 'mountPoint';
document.body.append(mount);
const bySelector = new ColorPicker({ container: '#mountPoint' });
check('container accepts a CSS selector', mount.contains(bySelector.root));
bySelector.destroy();
const byElement = new ColorPicker({ container: mount });
check('container accepts an element', mount.contains(byElement.root));
byElement.destroy();

const warnings = [];
const realWarn = console.warn;
let missing = null;
try {
  console.warn = (message) => warnings.push(message);
  missing = new ColorPicker({ container: '#no-such-container' });
} finally {
  console.warn = realWarn;
}
check('a container selector that matches nothing falls back to body',
  document.body.contains(missing.root) && /matches nothing/.test(warnings[0] || ''),
  warnings[0] || 'no warning');
missing.destroy();
mount.remove();

// 40. fields: the host's own inputs are the slots and the triggers
const fieldWrap = document.createElement('div');
fieldWrap.innerHTML = '<label for="smokeInk">Ink</label>'
  + '<input id="smokeInk" type="text" data-smoke-field value="#0F766E">'
  + '<input type="text" data-smoke-field data-slot="wash" value="not-a-colour">';
document.body.append(fieldWrap);
const fieldEvents = [];
const fieldPicker = new ColorPicker({
  fields: '[data-smoke-field]',
  onChange: (colors) => fieldEvents.push(colors),
});
const ink = fieldWrap.querySelector('#smokeInk');
const wash = fieldWrap.querySelector('[data-slot="wash"]');

check('each field is a slot named after the field',
  Object.keys(fieldPicker.getColors()).join(',') === 'smokeInk,wash',
  Object.keys(fieldPicker.getColors()).join(','));
check('fields switch the picker to a popover', fieldPicker.options.mode === 'popover', fieldPicker.options.mode);
check('the field value seeds its slot', fieldPicker.getColors().smokeInk === '#0F766E', fieldPicker.getColors().smokeInk);
check('an invalid field value falls back, never leaks',
  fieldPicker.getColors().wash === '#111827', fieldPicker.getColors().wash);
check('the fallback is written back into the field', wash.value === '#111827', wash.value);
check('a bound field is a popup button',
  ink.getAttribute('aria-haspopup') === 'dialog' && ink.getAttribute('aria-expanded') === 'false');

ink.click();
check('clicking the field opens the picker on it',
  fieldPicker.isOpen && fieldPicker.activeSlot === 'smokeInk', fieldPicker.activeSlot);
check('the panel hangs off the field itself', fieldPicker.anchor === ink);
check('only the open field is marked expanded',
  ink.getAttribute('aria-expanded') === 'true' && wash.getAttribute('aria-expanded') === 'false');
ink.click();
check('a second click on the field closes it', !fieldPicker.isOpen);

ink.value = '#B91C1C';
ink.dispatchEvent(new Event('change', { bubbles: true }));
check('typing a colour commits it', fieldPicker.getColors().smokeInk === '#B91C1C', fieldPicker.getColors().smokeInk);
check('the commit reaches the host once', fieldEvents.length === 1, String(fieldEvents.length));
ink.value = 'nope';
ink.dispatchEvent(new Event('change', { bubbles: true }));
check('a typed non-colour is refused and the field restored',
  fieldPicker.getColors().smokeInk === '#B91C1C'
    && ink.value === '#B91C1C' && ink.getAttribute('aria-invalid') === 'true',
  `${ink.value} / ${ink.getAttribute('aria-invalid')}`);

fieldPicker.setColors({ smokeInk: '#0EA5E9' });
check('a programmatic write lands in the field', ink.value === '#0EA5E9', ink.value);

fieldPicker.destroy();
check('destroy unbinds the field', ink.getAttribute('aria-haspopup') === null);
check('destroy hands back the attributes the field had',
  ink.getAttribute('autocomplete') === null && ink.getAttribute('spellcheck') === null);
fieldWrap.remove();

// 41. bad input is refused where it enters, not discovered later
const keep = mk({ initialColors: { text: '#111827', background: '#FFFFFF' } });
keep.setColors({ text: '#B91C1C' });
keep.setColors({ text: 'not-a-colour' });
check('an invalid setColors value keeps the current colour', keep.getColors().text === '#B91C1C', keep.getColors().text);
keep.destroy();

const badHosts = [];
let stray = null;
try {
  console.warn = (message) => badHosts.push(message);
  stray = new ColorPicker({ container: { nodeType: 1 }, triggers: 42 });
} finally {
  console.warn = realWarn;
}
check('a container that is not an element falls back to body',
  document.body.contains(stray.root) && badHosts.some((m) => /must be an element or a selector/.test(m)),
  badHosts.join(' | '));
check('a triggers target that is not an element renders no bar', stray.triggers === null);
stray.destroy();

const protoHost = document.createElement('div');
document.body.append(protoHost);
const proto = new ColorPicker({ slots: ['constructor'], triggers: protoHost, labels: { triggers: {} } });
const protoName = protoHost.querySelector('.cp-trigger-name').textContent;
check('a slot named constructor keeps its own trigger name', protoName === 'constructor', protoName);
proto.destroy();
protoHost.remove();

// compact view: the header toggle hides the palettes and the contrast band
const compactPicker = mk({ showContrastSuggestions: true });
compactPicker.open();
const compactBtn = compactPicker.root.querySelector('.cp-compact-btn');
const shown = (sel) => compactPicker.root.querySelector(sel).getClientRects().length > 0;
const tallBefore = compactPicker.refs.panel.getBoundingClientRect().height;
compactBtn.click();
check('compact hides the palettes and keeps the editor',
  !shown('.cp-presets') && shown('.cp-editor') && compactBtn.getAttribute('aria-pressed') === 'true');
check('compact shrinks the panel', compactPicker.refs.panel.getBoundingClientRect().height < tallBefore);
compactBtn.click();
check('compact toggles back', shown('.cp-presets') && compactBtn.getAttribute('aria-pressed') === 'false');
compactPicker.destroy();
