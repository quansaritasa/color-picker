import { ColorPicker, PRESET_SETS, allColors, check, q, mk, picker } from './harness.js';

// 33. arbitrary slots: the id is the answer to "which thing do I paint?"
const host3 = document.createElement('div');
document.body.append(host3);
const three = mk({
  slots: [
    { id: 'text', label: 'Body ink', symbol: 'Aa', presetSet: 'text' },
    { id: 'background', label: 'Card', symbol: '▰', presetSet: 'background' },
    { id: 'accent', label: 'Accent', symbol: '✦', hint: 'Buttons and links' },
  ],
  initialColors: { text: '#0F766E', background: '#70B1ED', accent: '#7C3AED' },
  triggers: host3,
  showContrastSuggestions: true,
  contrastPair: ['text', 'background'],
});
check('one tab per slot', three.root.querySelectorAll('.cp-tab').length === 3, String(three.root.querySelectorAll('.cp-tab').length));
check('slot labels reach the tabs',
  [...three.root.querySelectorAll('.cp-tab strong')].map((n) => n.textContent).join('|') === 'Body ink|Card|Accent',
  [...three.root.querySelectorAll('.cp-tab strong')].map((n) => n.textContent).join('|'));
/* The small line is the slot's type, derived from its preset group; the
   free-form hint moves to the tab's tooltip. */
check('the tab second line is the type, not the hint',
  [...three.root.querySelectorAll('.cp-tab small')].map((n) => n.textContent).join('|') === 'Text|Background|Background',
  [...three.root.querySelectorAll('.cp-tab small')].map((n) => n.textContent).join('|'));
check('a hint stays a tooltip on its tab',
  [...three.root.querySelectorAll('.cp-tab')][2].title === 'Buttons and links' &&
    ![...three.root.querySelectorAll('.cp-tab')][2].textContent.includes('Buttons'),
  [...three.root.querySelectorAll('.cp-tab')][2].title);
check('one preset section per palette group', three.root.querySelectorAll('.cp-preset-section').length === 2);
check('one trigger per slot', host3.querySelectorAll('.cp-trigger').length === 3);
check('the tab grid is told how many slots there are', three.root.style.getPropertyValue('--cp-slots') === '3',
  three.root.style.getPropertyValue('--cp-slots'));
// palettes belong to the two groups, whatever the slot count
check('the palettes stay the two groups',
  Object.keys(three.palettes).join(',') === 'text,background' && 'Pale' in three.palettes.background && !('Highlight' in three.palettes.background),
  Object.keys(three.palettes).join(','));
check('colors are keyed by slot id',
  JSON.stringify(three.getColors()) === JSON.stringify({ text: '#0F766E', background: '#70B1ED', accent: '#7C3AED' }),
  JSON.stringify(three.getColors()));

three.open();
three.setActiveSlot('accent');
const hex3 = three.root.querySelector('.cp-hex-input');
hex3.value = '#00AAFF';
hex3.dispatchEvent(new Event('change', { bubbles: true }));
check('an editor commit writes only the active slot',
  three.getColors().accent === '#00AAFF' && three.getColors().text === '#0F766E' && three.getColors().background === '#70B1ED',
  JSON.stringify(three.getColors()));

const backgroundSection = three.root.querySelector('.cp-preset-section[data-group="background"]');
const accentSwatch = [...backgroundSection.querySelectorAll('.cp-swatch')]
  .find((n) => n.dataset.hex !== three.getColors().accent);
const accentHex = accentSwatch.dataset.hex;
accentSwatch.click();
check('a third slot can take a background preset colour', three.getColors().accent === accentHex, three.getColors().accent);
check('a preset click leaves the other slots alone',
  three.getColors().text === '#0F766E' && three.getColors().background === '#70B1ED');
check('a third slot can be emphasised in either group',
  backgroundSection.classList.contains('cp-is-emphasis') === (three.slots.find((s) => s.id === 'accent').presetSet === 'background'));
check('a slot outside contrastPair hides the suggestions',
  three.refs.suggestions.hidden, String(three.refs.suggestions.hidden));
three.setActiveSlot('text');
check('a slot inside contrastPair shows them again', !three.refs.suggestions.hidden);
three.destroy();
host3.remove();

// 34. suggestions need a declared pair, not a guess at "the first two"
const unpaired = mk({ showContrastSuggestions: true });
unpaired.open();
check('suggestions hide without contrastPair', unpaired.refs.suggestions.hidden);
unpaired.destroy();

// 35. the copy button writes the active slot's HEX and confirms on itself
const copied = [];
Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: { writeText: (text) => { copied.push(text); return Promise.resolve(); } },
});
const copyPicker = mk({
  initialColors: { text: '#0F766E', background: '#70B1ED' },
});
copyPicker.open();
const copyBtn = copyPicker.root.querySelector('.cp-hex-row .cp-copy-btn');
check('the hex field carries a copy button', !!copyBtn, copyBtn ? 'found' : 'missing');
check('the copy button is named for screen readers',
  copyBtn.getAttribute('aria-label') === 'Copy HEX' && copyBtn.getAttribute('title') === 'Copy HEX',
  copyBtn.getAttribute('aria-label'));
check('the copy button sits after the hex input',
  copyPicker.root.querySelector('.cp-hex-input').nextElementSibling === copyBtn);
copyBtn.click();
await new Promise((resolve) => setTimeout(resolve, 0));
check('copy writes the active slot value', copied[0] === '#0F766E', copied[0]);
check('copy confirms on the button',
  copyBtn.dataset.copied === 'true' && copyBtn.getAttribute('aria-label') === 'Copied #0F766E',
  copyBtn.getAttribute('aria-label'));
check('copy announces on the status region',
  copyPicker.refs.status.textContent === 'Copied #0F766E.', copyPicker.refs.status.textContent);
copyPicker.setActiveSlot('background');
copyBtn.click();
await new Promise((resolve) => setTimeout(resolve, 0));
check('copy follows the active slot', copied[1] === '#70B1ED', copied[1]);
copyPicker.destroy();

// 36. the shipped default is one colour: no tablist, nothing to pair
const solo = new ColorPicker({});
check('the default slot is a single colour',
  JSON.stringify(solo.getColors()) === JSON.stringify({ color: '#0F766E' }), JSON.stringify(solo.getColors()));
check('a single slot renders no tablist', solo.root.querySelector('.cp-tabs') === null);
check('a single slot still offers both palettes',
  solo.root.querySelectorAll('.cp-preset-section').length === 2,
  String(solo.root.querySelectorAll('.cp-preset-section').length));
check('both palettes survive the slot count',
  Object.keys(solo.palettes).join(',') === 'text,background', Object.keys(solo.palettes).join(','));
solo.open();
check('opening a single-slot picker focuses the colour area',
  solo.isOpen && document.activeElement === solo.refs.sv, document.activeElement && document.activeElement.className);
const pairSized = mk({});
pairSized.open();
check('a single-slot panel is shorter than the pair panel',
  solo.refs.panel.getBoundingClientRect().height < pairSized.refs.panel.getBoundingClientRect().height,
  `${Math.round(solo.refs.panel.getBoundingClientRect().height)} < ${Math.round(pairSized.refs.panel.getBoundingClientRect().height)}`);
const soloHex = solo.root.querySelector('.cp-hex-input');
soloHex.value = '#2563EB';
soloHex.dispatchEvent(new Event('change', { bubbles: true }));
check('the single slot is editable', solo.getColors().color === '#2563EB', solo.getColors().color);
pairSized.destroy();
solo.destroy();

// 37. every section leads with an All pill that shows the whole palette once
const allPicker = mk({ initialColors: { text: '#0F766E', background: '#70B1ED' } });
allPicker.open();
const secOf = (key) => q(allPicker, `.cp-preset-section[data-group="${key}"]`);
const pillsOf = (key) => [...secOf(key).querySelectorAll('.cp-category')];
const pillNamed = (key, name) => pillsOf(key).find((p) => p.textContent === name);
const gridOf = (key) => secOf(key).querySelector('.cp-swatches');
const hexesOf = (key) => [...gridOf(key).children].map((n) => n.dataset.hex);

check('every section leads with an All pill',
  pillsOf('text')[0].textContent === 'All' && pillsOf('background')[0].textContent === 'All',
  pillsOf('text').map((p) => p.textContent).join(','));
check('a section still opens on its first category',
  hexesOf('text').length === PRESET_SETS.text.Normal.length && hexesOf('background').length === PRESET_SETS.background.Vivid.length,
  `${hexesOf('text').length},${hexesOf('background').length}`);
check('no All pill is active on open',
  pillsOf('text').filter((p) => p.classList.contains('cp-is-active')).map((p) => p.textContent).join(',') === 'Normal',
  pillsOf('text').filter((p) => p.classList.contains('cp-is-active')).map((p) => p.textContent).join(','));

pillNamed('text', 'All').click();
const textAll = hexesOf('text');
check('All shows the whole text palette',
  textAll.length === allColors(PRESET_SETS.text).length && textAll.length > PRESET_SETS.text.Normal.length,
  `${textAll.length} of ${allColors(PRESET_SETS.text).length}`);
check('All shows each colour once',
  new Set(textAll.map((hex) => hex.toUpperCase())).size === textAll.length,
  `${textAll.length} swatches, ${new Set(textAll.map((hex) => hex.toUpperCase())).size} unique`);
check('All marks itself active and the grid as a union',
  pillNamed('text', 'All').classList.contains('cp-is-active') && gridOf('text').classList.contains('cp-is-all'));
check('the other section keeps its own category',
  pillNamed('background', 'All').classList.contains('cp-is-active') === false && hexesOf('background').length === PRESET_SETS.background.Vivid.length,
  hexesOf('background').length);

const pickedFromAll = gridOf('text').children[12];
pickedFromAll.click();
check('a colour picked from the All grid writes the active slot',
  allPicker.getColors().text === pickedFromAll.dataset.hex && allPicker.activeSlot === 'text',
  allPicker.getColors().text);
check('the picked swatch is the selected one',
  pickedFromAll.classList.contains('cp-is-selected') &&
    gridOf('text').querySelectorAll('.cp-is-selected').length === 1,
  String(gridOf('text').querySelectorAll('.cp-is-selected').length));

pillNamed('text', 'Heading').click();
check('a named category narrows the grid again',
  hexesOf('text').length === PRESET_SETS.text.Heading.length && !gridOf('text').classList.contains('cp-is-all'),
  String(hexesOf('text').length));

pillNamed('text', 'All').click();
allPicker.setActiveSlot('background');
check('All is remembered per section across a slot switch',
  pillNamed('text', 'All').classList.contains('cp-is-active') &&
    hexesOf('text').length === allColors(PRESET_SETS.text).length,
  String(hexesOf('text').length));
allPicker.destroy();

