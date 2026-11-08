# color-picker

A dependency-free color picker in vanilla ES modules. It edits **named colour
slots** and always offers **both preset palettes** — text colours and panel
colours — because a dimmed panel tone is a legitimate text colour. A swatch
writes the slot the editor is showing; the palette is a suggestion, never an
owner.

Out of the box it is a **single-colour picker**: one slot, `color`, no tab row.
A host that paints two things declares two slots (`text` + `background`,
`accent`, …) and gets a tab per slot. No build step.

## Install

Copy these into your project — there is no npm package and no bundler:

```text
src/color.js
src/presets.js
src/options.js
src/tablist.js
src/template.js
src/editor.js
src/copy.js
src/presets-panel.js
src/contrast.js
src/suggestions.js
src/focus.js
src/drag.js
src/popover.js
src/swatches.js
src/bindings.js
src/assemble.js
src/color-picker.js
color-picker.css
```

Then load it as a module. ES modules need an HTTP origin: `file://` is blocked by
browsers, so serve the folder while developing.

```bash
python3.12 -m http.server 8000   # then open http://localhost:8000/
```

## Swatches — the default shape

Let the component draw one square per slot and open itself on the slot you
clicked. With the default single slot there is one square and no tab row:

```html
<link rel="stylesheet" href="./color-picker.css">
<div id="colors"></div>
<script type="module">
  import ColorPicker from './src/color-picker.js';

  const picker = new ColorPicker({
    swatches: document.getElementById('colors'),   // element or CSS selector
    initialColors: { color: '#0F766E' },
    onChange: (colors) => {
      page.style.color = colors.color;             // the key is the target
    },
  });
</script>
```

`onChange` hands back the whole slot map on every edit, so read the keys you
paint and ignore the rest — nothing else is written by an edit to one slot.

That renders a square (`Colour`) with its current HEX, and switches the picker to
**popover mode**: the panel opens anchored under the square you clicked, on that
square's slot, with no scrim and no `OK`/`Cancel`
and no bottom strip — every edit is painted live, so there is nothing to apply
or discard. It closes on `Escape`, on the `×`, on a click outside, and on a
second click of the same square; `↺` in the header resets every slot. Below
680px the popover becomes a bottom sheet capped at `78vh`, so the page it is
recolouring stays visible above it.

A popover never fires `onCancel` or `onApply`; use `onChange` while it is open
and `onClose` when it goes away. Anything that still needs a transaction can
pass `mode: 'modal'`.

## Slots — any number of named colours

One slot is the default. Declare more when the host paints more:

```js
new ColorPicker({
  slots: [
    { id: 'text', label: 'Body ink', symbol: 'Aa', presetSet: 'text' },
    { id: 'background', label: 'Card', symbol: '▰', presetSet: 'panel' },
    { id: 'accent', label: 'Accent', symbol: '✦', hint: 'Buttons and links' },
  ],
  initialColors: { text: '#0F766E', background: '#CCFBF1', accent: '#7C3AED' },
  onChange: (colors) => console.log(colors.accent),
});
```

| Slot key | Type | Notes |
| --- | --- | --- |
| `id` | `string` | **Required.** The key in `initialColors`, `getColors()` and every callback; must match `/^[A-Za-z][\w-]*$/` and be unique |
| `label` | `string` | Tab name; defaults to the shipped name, else the id |
| `symbol` | `string` | The glyph in the tab; defaults to the id's first letter |
| `hint` | `string` | Small line under the tab label |
| `presetSet` | `'text' \| 'panel'` | Which palette group is **emphasised** while this slot is active. Anything else — or nothing — emphasises `panel`; both groups stay on screen either way |
| `color` | `string` | Fallback colour when `initialColors` has none for this id |

Palettes are not per slot: `presets` is keyed by group (`text`, `panel`) and both
groups are always rendered. Clicking a swatch writes the slot the editor is
showing.

A tab per slot (two or more), and both palette groups under the editor. A slot
not named in `contrastPair` simply shows no suggestions.

## Basic usage — modal

Without `swatches` the picker is a plain modal: you own the trigger, `OK`
commits, `Cancel` restores.

```html
<link rel="stylesheet" href="./color-picker.css">
<script type="module">
  import ColorPicker from './src/color-picker.js';

  const picker = new ColorPicker({
    initialColors: { color: '#0F766E' },
    onChange: (colors) => console.log('changed', colors),
    onApply: (colors) => console.log('applied', colors),
  });

  document.querySelector('#open').addEventListener('click', () => picker.open());
</script>
```

The picker renders as a centered modal appended to `document.body` — or, with
`swatches`, as a popover anchored to the square you clicked. Call `open()` to
show it; in modal mode `OK` commits and closes, `Cancel` restores the values that
were active when it opened and closes. `Reset` is the `↺` icon beside `×` in the
header: it restores `initialColors` on every slot and keeps the panel open. A
popover renders no footer at all — there is nothing to apply or discard.

The HEX field carries a copy button on its right: it writes the active slot's
current value to the clipboard, flips to `✓` for a moment, and announces
`Copied #0F766E.` on the live region. It copies the colour the editor is
showing, so switching tabs changes what the next click copies. `labels.copy`
renames it.

The panel is compact by design — it covers a fraction of the page, and the
scrim is light — so the surface you are recoloring stays visible while you
edit. Drag it by its header to move it off whatever you need to see
(double-click the header to put it back in the middle); the panel is clamped to
the viewport and keeps its position across open/close. Below 680px it becomes a
bottom sheet and dragging is off.

## Options

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `container` | `HTMLElement` | `document.body` | Where the root element is mounted |
| `slots` | `Array<object \| string>` | one slot, `color` | The named colours to edit; see the Slot table above |
| `initialColors` | `{ [slotId]: string }` | `#0F766E` for `color` | Normalized on construction; also the target of Reset. A missing or invalid value falls back per slot |
| `activeSlot` | `string` | first slot | Tab shown first |
| `contrastPair` | `[id, id]` | `null` | The two slots suggestions measure against each other. Required for `showContrastSuggestions` — there is no guessing which pair you meant |
| `showAlpha` | `boolean` | `true` | Opacity slider. When `false` the slider is hidden and alpha is forced to `1`, so an 8-digit HEX cannot leave a translucent color behind |
| `showContrastSuggestions` | `boolean` | `false` | Show the collapsible contrast panel under the presets |
| `draggable` | `boolean` | `true` | Drag the panel by its header to move it aside; double-click the header to re-centre. `false` pins a fixed, centered modal |
| `theme` | `'light' \| 'dark'` | `'light'` | Written to `data-theme` on the root; the dark theme only swaps tokens |
| `presets` | `{ text?: object, panel?: object }` | built-in palettes | Per palette group, the shipped palette with your categories merged in: a name that already exists (`Cool`, `Blue`, …) **replaces** that palette, a new name is added after the shipped ones |
| `swatches` | `HTMLElement \| string` | `null` | Host element (or selector) for the colour triggers, one per slot. Setting it switches `mode` to `popover` |
| `mode` | `'auto' \| 'modal' \| 'popover'` | `'auto'` | `'auto'` = `popover` when a trigger is rendered, `modal` otherwise. A popover is never draggable and hides `OK`/`Cancel` |
| `classNames` | `string` | `''` | Extra classes on the root element |
| `labels` | `object` | English | Override `title`, `close`, `reset`, `copy`, `cancel`, `apply`, `hex`, `hue`, `opacity`, `sv`, `svHint`, `slotsLabel` (the tablist name), `tabs[id]` (`{ title, hint }`), and the swatch bar — `swatchesLabel` plus `swatches[id]` for a square's name |

## API

| Method | Returns | Description |
| --- | --- | --- |
| `open(anchor?)` | `void` | Snapshots the current colors, shows the panel, fires `onOpen`. `anchor` is the element a popover hangs off; omitted, a popover uses its own swatch for the active slot, and a picker without swatches centres itself |
| `close()` | `void` | Hides the panel, fires `onClose`. Colors are kept as they are |
| `dismiss()` | `void` | The path the shell uses for `×` and `Escape`: a popover closes and keeps its edits, a modal restores the snapshot (`cancel()`) |
| `destroy()` | `void` | Removes listeners, the root element and the swatch bar |
| `getColors()` | `{ [slotId]: string }` | Fresh copy of normalized HEX strings; alpha is appended only when `a < 1` |
| `setColors(partial)` | `void` | Applies any subset of slots, fires `onChange` when something changed |
| `setActiveSlot(id)` | `void` | Switches the editor to a slot; each slot keeps its own color |

`getColors()` always returns a copy, so mutating the result never touches the
picker's state. Keys are exactly the slot ids you declared — nothing else is
carried.

## Callbacks

| Callback | Argument | When |
| --- | --- | --- |
| `onChange` | `colors` | Any color edit — drag, slider, HEX field, preset click, `setColors()` |
| `onApply` | `colors` | `OK` pressed, before the modal closes |
| `onCancel` | `colors` | `Cancel`, `×`, or `Escape`; colors are already restored |
| `onOpen` | `colors` | After the modal becomes visible |
| `onClose` | `colors` | After the modal is hidden |

Every callback receives a copy of the color state, never an internal reference.
`setColors()` only emits when a value actually changes, so calling it from inside
`onChange` with the same values cannot loop.

In popover mode `onCancel` and `onApply` never fire: nothing is committed and
nothing is rolled back, so `onChange` plus `onClose` are the whole story.
`cancel()` is still callable by hand if a host wants one.

## Custom presets

```js
new ColorPicker({
  slots: [{ id: 'text' }, { id: 'background' }],
  presets: {
    text: { Brand: ['#111827', '#1F2937'] },
    panel: { Brand: ['#F0FDFA', '#CCFBF1'] },
  },
});
```

Categories replace by name: a category the config names takes the place of the
shipped palette of that name (`Cool`, `Blue`, …) and keeps its position in the
row; a new name is appended after the shipped ones. The shipped tables are never
mutated, so two instances with different `presets` do not affect each other.

## Contrast suggestions

```js
new ColorPicker({
  slots: [
    { id: 'text', label: 'Text colour', symbol: 'Aa', presetSet: 'text' },
    { id: 'background', label: 'Panel background', symbol: '▰', presetSet: 'panel' },
  ],
  showContrastSuggestions: true,
  contrastPair: ['text', 'background'],
});
```

A ratio needs two colours, so suggestions require two declared slots plus the
`contrastPair`; with the default single slot the panel stays hidden.

Adds a collapsed `<details>` panel under the presets. Its summary carries the
current pair's ratio and a WCAG badge; opening it lists up to three readable
partners with their own ratios.

- Suggestions only appear on the two slots named in `contrastPair`; any other
  slot hides the panel rather than guessing a partner.
- Selecting one slot's colour suggests partners for the *other* slot, from that
  slot's loaded palette.
- WCAG AA is 4.5:1 for normal text, AA for large text is 3:1 (shown as a second
  `AA-large` badge when the pair fails normal text), AAA is 7:1.
- The panel **never** changes the color you are editing. Picking a partner sets
  the *other* slot's color, so the pair improves while your choice stays put.

The math is exportable on its own — no DOM, no side effects:

```js
import { contrastRatio, wcagLevel, suggestPartners, parseHex } from './src/contrast.js';

contrastRatio(parseHex('#0F766E'), parseHex('#CCFBF1')); // 4.857…
wcagLevel(4.5);                 // 'AA'
wcagLevel(3, { largeText: true }); // 'AA-large'
suggestPartners(parseHex('#0F766E'), ['#F7FEE7', '#111827']); // best first, ≥ 4.5:1 only
```

A translucent color is composited over the color it sits on before measuring —
`#00000080` over `#FFFFFF` is measured as the `#7F7F7F` it actually renders as.
That is the only defensible reading of "the ratio of a transparent color", and
it matches what a browser paints.

## Theming

All component styles are scoped under `.cp-root` and driven by custom properties:

```css
.cp-root {
  --cp-accent: #7c3aed;
  --cp-accent-soft: #f5f3ff;
  --cp-surface: #ffffff;
  --cp-ink: #1c1917;
  --cp-muted: #57534e;
  --cp-line: #e7e5e4;
  --cp-radius: 14px;
}
```

`theme: 'dark'` sets `data-theme="dark"` and swaps the same tokens, so a custom
theme and the dark theme compose. The swatch bar lives in the host's layout
rather than inside `.cp-root`, so it carries its own `--cps-*` pair on
`.cp-swatches` (same light/dark switch through `data-theme`). The tab row and the
preset row get one column per slot from `--cp-slots`, which the component writes
on its root. Below 680px the modal becomes a bottom sheet: full width, rounded
top corners, tabs wrap, one preset column, sticky footer.

Multiple instances are independent: each owns its own root element, state, and
listeners, so two pickers on one page never share colors.

## Development

```bash
python3.12 -m http.server 8000   # then open /index.html or /demo.html
node --test                      # colour math, preset merging, slot resolution
```

`index.html` shows the colours in preview cards and gives the second instance
three slots; `demo.html` paints an entire page — the headline and body copy take
the `text` colour, the panel takes `background`, and a live ratio pill (the
library's own WCAG code) says whether the pair still passes AA. Both drive the
picker from its swatch bar, so there is no "open" button anywhere.

`test/smoke.html` is a browser harness for the component itself — open it through
the local server and it prints PASS/FAIL per behaviour (tabs, HEX, drag, footer
actions, presets, suggestions, dark theme, focus trap, two instances, swatch
triggers, popover placement, three-slot pickers, borrowed palettes). Headless
needs a pinned window, otherwise the default viewport is too short for the drag
and anchoring checks:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --window-size=1200,900 --virtual-time-budget=5000 \
  --dump-dom http://127.0.0.1:8000/test/smoke.html   # <title> carries PASS / FAIL n
```
