import { check, q, mk, events, picker, handoff } from './harness.js';

// 15. preset panel renders both palette groups, always
picker.open();
const highSection = q(picker, '.cp-preset-section[data-group="text"]');
const lowSection = q(picker, '.cp-preset-section[data-group="background"]');
check('both palette groups are rendered',
  q(picker, '.cp-presets').children.length === 2 && !!highSection && !!lowSection);
check('group pills match their palettes plus the All pill',
  highSection.querySelectorAll('.cp-category').length === Object.keys(picker.palettes.text).length + 1 &&
  lowSection.querySelectorAll('.cp-category').length === Object.keys(picker.palettes.background).length + 1,
  `${highSection.querySelectorAll('.cp-category').length}/${lowSection.querySelectorAll('.cp-category').length}`);
check('group swatches match the first category',
  highSection.querySelectorAll('.cp-swatch').length === picker.palettes.text.Normal.length &&
  lowSection.querySelectorAll('.cp-swatch').length === picker.palettes.background.Vivid.length,
  `${highSection.querySelectorAll('.cp-swatch').length}/${lowSection.querySelectorAll('.cp-swatch').length}`);
check('the first category pill is active in both groups',
  highSection.querySelector('.cp-category').textContent === 'All' &&
  highSection.querySelectorAll('.cp-category')[1].classList.contains('cp-is-active') &&
  lowSection.querySelectorAll('.cp-category')[1].classList.contains('cp-is-active'),
  highSection.querySelectorAll('.cp-category')[1].textContent);
check("the active slot's group is emphasised",
  highSection.classList.contains('cp-is-emphasis') && !lowSection.classList.contains('cp-is-emphasis'));

// 16. selection state marks the active colour wherever it appears.
// The fixture's #0F766E is a heading colour, so its category is opened first.
const pillOf = (section, name) => [...section.querySelectorAll('.cp-category')].find((n) => n.textContent === name);
pillOf(highSection, 'Heading').click();
check('the active colour is marked in its own group',
  highSection.querySelectorAll('.cp-swatch.cp-is-selected').length === 1,
  String(highSection.querySelectorAll('.cp-swatch.cp-is-selected').length));
check('the other group marks only swatches of that same colour',
  lowSection.querySelectorAll('.cp-swatch.cp-is-selected').length ===
    [...lowSection.querySelectorAll('.cp-swatch')].filter((n) => n.dataset.hex === '#0F766E').length);
const marked = highSection.querySelector('.cp-swatch.cp-is-selected');
check('marked swatch carries the hex', marked && marked.dataset.hex === '#0F766E', marked && marked.dataset.hex);
check('selected swatch has an aria-pressed state', marked && marked.getAttribute('aria-pressed') === 'true');
check('check color adapts to luminance',
  marked.style.getPropertyValue('--cp-check-color').trim().length > 0,
  marked.style.getPropertyValue('--cp-check-color'));
pillOf(highSection, 'Normal').click();

// 17. swatch click drives colors, editor and preview
const changeBefore = events.filter(([n]) => n === 'change').length;
const coolSwatch = [...highSection.querySelectorAll('.cp-swatch')].find((n) => n.dataset.hex === '#111827');
coolSwatch.click();
check('swatch click updates the color', picker.getColors().text === '#111827', picker.getColors().text);
check('swatch click updates the hex field', q(picker, '.cp-hex-input').value === '#111827', q(picker, '.cp-hex-input').value);
check('swatch click emits onChange', events.filter(([n]) => n === 'change').length === changeBefore + 1);
check('swatch click moves the checkmark', coolSwatch.classList.contains('cp-is-selected') &&
  highSection.querySelectorAll('.cp-swatch.cp-is-selected').length === 1);

// 18. category pills swap the grid
pillOf(highSection, 'Heading').click();
check('pill click activates the category',
  pillOf(highSection, 'Heading').classList.contains('cp-is-active') &&
  !pillOf(highSection, 'Normal').classList.contains('cp-is-active'));
check('pill click swaps the swatch set',
  highSection.querySelectorAll('.cp-swatch').length === picker.palettes.text.Heading.length);
check('color survives a category change', picker.getColors().text === '#111827');
check('a color outside the category marks no swatch',
  highSection.querySelectorAll('.cp-swatch.cp-is-selected').length === 0,
  String(highSection.querySelectorAll('.cp-swatch.cp-is-selected').length));
pillOf(highSection, 'All').click();
check('the All pill shows every category at once',
  highSection.querySelectorAll('.cp-swatch').length ===
    new Set(Object.values(picker.palettes.text).flat().map((h) => h.toUpperCase())).size,
  String(highSection.querySelectorAll('.cp-swatch').length));
pillOf(highSection, 'Normal').click();

// 19. a palette is a suggestion: it writes the active slot, never its own
const bgSwatch = [...lowSection.querySelectorAll('.cp-swatch')]
  .find((n) => n.dataset.hex !== picker.getColors().text);
const tappedHex = bgSwatch.dataset.hex;
bgSwatch.click();
check('a background swatch writes the active (text) slot', picker.getColors().text === tappedHex, picker.getColors().text);
check('a background swatch leaves the other slot alone',
  picker.getColors().background === '#70B1ED', picker.getColors().background);
check('a background swatch does not switch the active slot', picker.activeSlot === 'text', picker.activeSlot);
check("the emphasis stays with the active slot's group",
  highSection.classList.contains('cp-is-emphasis') && !lowSection.classList.contains('cp-is-emphasis'));
picker.setActiveSlot('background');
check('switching slots keeps both groups mounted',
  !!q(picker, '.cp-preset-section[data-group="text"]') && !!q(picker, '.cp-preset-section[data-group="background"]'));
check('switching slots moves the emphasis to the other group',
  lowSection.classList.contains('cp-is-emphasis') && !highSection.classList.contains('cp-is-emphasis'));
const bgMarked = lowSection.querySelectorAll('.cp-swatch.cp-is-selected');
check("switching slots marks that slot's own colour, not the last one edited",
  bgMarked.length === 1 && bgMarked[0].dataset.hex === '#70B1ED',
  `${bgMarked.length}:${bgMarked[0] && bgMarked[0].dataset.hex}`);
picker.setActiveSlot('text');
check('returning to the slot shows its colour again', q(picker, '.cp-hex-input').value === tappedHex, q(picker, '.cp-hex-input').value);
check('the checkmark follows the colour, not the group',
  highSection.querySelectorAll('.cp-swatch.cp-is-selected').length === 0 &&
  lowSection.querySelectorAll('.cp-swatch.cp-is-selected').length === 1);

// 20. reset restores the checkmarks (#0F766E lives in Heading)
pillOf(highSection, 'Heading').click();
picker.root.querySelector('.cp-reset-btn').click();
check('reset restores the active slot checkmark',
  highSection.querySelector('.cp-swatch.cp-is-selected').dataset.hex === '#0F766E' &&
  lowSection.querySelectorAll('.cp-swatch.cp-is-selected').length === 0);
picker.setActiveSlot('background');
check('the background group marks the reset background colour',
  lowSection.querySelector('.cp-swatch.cp-is-selected').dataset.hex === '#70B1ED');
picker.setActiveSlot('text');
pillOf(highSection, 'Normal').click();
picker.close();

// 21. two instances are independent
const second = mk({ initialColors: { text: '#991B1B', background: '#FEE2E2' } });
second.setColors({ text: '#1D4ED8' });
check('second instance isolated', picker.getColors().text === '#0F766E' && second.getColors().text === '#1D4ED8', `${picker.getColors().text} | ${second.getColors().text}`);
check('two roots mounted', document.querySelectorAll('.cp-root').length === 2);

// 16. keyboard on tablist
picker.open();
picker.setActiveSlot('text');
picker.root.querySelectorAll('.cp-tab')[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
check('arrow key moves tabs', picker.activeSlot === 'background', picker.activeSlot);
picker.close();

// 22. contrast suggestions are opt-in
check('suggestions band is hidden when the option is off', picker.refs.suggestions.hidden);

const suggPicker = mk({
  initialColors: { text: '#111827', background: '#70B1ED' },
  showContrastSuggestions: true,
  contrastPair: ['text', 'background'],
});
suggPicker.open();
const band = suggPicker.root.querySelector('.cp-suggestions-band');
const details = band.querySelector('.cp-suggestions');
const badge = details.querySelector('.cp-badge');
const largeBadge = details.querySelector('.cp-badge-large');
const ratioOut = details.querySelector('.cp-sugg-ratio');
const shownPartners = () => [...details.querySelectorAll('.cp-partner')].filter((b) => !b.hidden);
const ratioOfNode = (b) => parseFloat(b.querySelector('.cp-partner-ratio').textContent);

check('suggestions band shows when enabled', !band.hidden);
check('suggestions start collapsed', details.open === false);
check('summary carries the pair ratio', ratioOut.textContent === '7.8:1', ratioOut.textContent);
check('summary carries the AA verdict', badge.textContent === 'AAA' && badge.dataset.level === 'AAA', badge.textContent);
check('AA-large badge stays hidden when the pair passes', largeBadge.hidden);
check('partners are capped at three', shownPartners().length > 0 && shownPartners().length <= 3, String(shownPartners().length));
check('every partner clears 4.5:1', shownPartners().every((b) => ratioOfNode(b) >= 4.5), shownPartners().map(ratioOfNode).join(' | '));
check('partners are ranked best first',
  shownPartners().every((b, i, all) => i === 0 || ratioOfNode(all[i - 1]) >= ratioOfNode(b)));

const pickedPartner = shownPartners()[0].dataset.hex;
const highBeforeSuggestion = suggPicker.getColors().text;
shownPartners()[0].click();
check('a partner applies to the other mode', suggPicker.getColors().background === pickedPartner, suggPicker.getColors().background);
check('a partner never moves the active color', suggPicker.getColors().text === highBeforeSuggestion, suggPicker.getColors().text);

suggPicker.setColors({ text: '#7A7A7A', background: '#FFFFFF' });
check('a failing pair shows the fail badge', badge.dataset.level === 'fail', badge.dataset.level);
check('the 3:1-4.5:1 band adds the AA-large badge', !largeBadge.hidden);
check('a failing pair still lists only readable partners', shownPartners().every((b) => ratioOfNode(b) >= 4.5));

// 23. dark theme repaints through tokens
const dark = mk({ theme: 'dark', showContrastSuggestions: true, contrastPair: ['text', 'background'] });
check('dark theme lands on the root', dark.root.dataset.theme === 'dark');
const lightSurface = getComputedStyle(suggPicker.root.querySelector('.cp-picker')).backgroundColor;
const darkSurface = getComputedStyle(dark.root.querySelector('.cp-picker')).backgroundColor;
check('dark theme repaints the surface', darkSurface !== lightSurface, `${darkSurface} vs ${lightSurface}`);
check('dark theme keeps the ink light',
  getComputedStyle(dark.root).color !== getComputedStyle(suggPicker.root).color,
  `${getComputedStyle(dark.root).color} vs ${getComputedStyle(suggPicker.root).color}`);


Object.assign(handoff, { second, suggPicker, dark });
