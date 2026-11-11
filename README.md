# color-picker

A dependency-free color picker in vanilla ES modules. It edits **named color
slots** and always offers **both preset palettes** — text colors and background
colors — because a dimmed background tone is a legitimate text color. A swatch
writes the slot the editor is showing; the palette is a suggestion, never an
owner. Each palette leads with an **`All`** pill that puts its whole union in one
grid, so you can scan all 83 text colors without clicking through three categories.

Out of the box it is a **single-color picker**: one slot, `color`, no tab row.
A host that paints two things declares two slots (`text` + `background`,
`accent`, …) and gets a tab per slot. No build step.

**Live demo:** [demo page](https://quansaritasa.github.io/color-picker/) —
a page painted by the picker, with a live WCAG contrast pill ·
[API showcase](https://quansaritasa.github.io/color-picker/) — every setup in this
README, each running next to its code.

## Setup

No build step and no package manager: copy these into your project, keeping the
`src/` layout.

```text
src/color.js
src/presets.js
src/options.js
src/tablist.js
src/dom.js
src/template.js
src/editor.js
src/copy.js
src/presets-panel.js
src/contrast.js
src/suggestions.js
src/focus.js
src/drag.js
src/resize.js
src/maximize.js
src/geometry.js
src/popover.js
src/triggers.js
src/fields.js
src/bindings.js
src/assemble.js
src/color-picker.js
color-picker.css
```

Any current Chrome, Safari or Firefox runs it — ES modules and CSS custom
properties, no polyfill, no IE path.

A complete page, saved in the same folder you copied into:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="./color-picker.css">
</head>
<body>
  <p id="ink">This paragraph takes the color you pick.</p>
  <div id="triggerHost"></div>

  <script type="module">
    import ColorPicker from './src/color-picker.js';

    const ink = document.getElementById('ink');
    const picker = new ColorPicker({
      triggers: '#triggerHost',                      // CSS selector or element
      initialColors: { color: '#0F766E' },
      onChange: (colors) => { ink.style.color = colors.color; },
    });
  </script>
</body>
</html>
```

Serve the folder — ES modules are blocked on `file://`:

```bash
python3.12 -m http.server 8000   # then open http://localhost:8000/
```

You should see one square labelled `Color`, its HEX beside it. Click the
square: the panel opens under it, on that slot, and dragging the SV area
repaints the paragraph while you drag. `Escape`, `×`, a click outside or a second
click on the square closes it; `↺` puts every slot back to `initialColors`.

That is the whole install: one stylesheet and one module import. Pick the shape
you need from here.

| You want | Pass | Read |
| --- | --- | --- |
| the library draws your triggers | `triggers: '#host'` | [Triggers](#triggers--the-default-shape) |
| your existing inputs are the controls | `fields: '[data-color-picker]'` | [Fields — your own inputs](#fields--your-own-inputs) |
| a centred dialog with `OK`/`Cancel` | nothing, or `mode: 'modal'` | [Basic usage — modal](#basic-usage--modal) |
| a panel docked in your own layout | `mode: 'inline', container: '#slot'` | [Inline](#inline--docked-in-your-layout) |

`index.html` in this repo is that same install, so diffing it
against the page above is the fastest way to see a shape wired end to end.

## Triggers — the default shape

Let the component draw one square per slot and open itself on the slot you
clicked. With the default single slot there is one square and no tab row:

```html
<link rel="stylesheet" href="./color-picker.css">
<div id="triggerHost"></div>
<script type="module">
  import ColorPicker from './src/color-picker.js';

  const picker = new ColorPicker({
    triggers: '#triggerHost',                      // CSS selector or element
    initialColors: { color: '#0F766E' },
    onChange: (colors) => {
      page.style.color = colors.color;             // the key is the target
    },
  });
</script>
```

`onChange` hands back the whole slot map on every edit, so read the keys you
paint and ignore the rest — nothing else is written by an edit to one slot.

That renders a square (`Color`) with its current HEX, and switches the picker to
**popover mode**: the panel opens anchored under the square you clicked, on that
square's slot, with no scrim and no `OK`/`Cancel`
and no bottom strip — every edit is painted live, so there is nothing to apply
or discard. It closes on `Escape`, on `⌘`/`Ctrl`+`Enter`, on the `×`, on a click
outside, and on a second click of the same square; `↺` in the header resets every
slot. Below 680px the popover becomes a bottom sheet capped at `78vh`, so the
page it is recoloring stays visible above it.

While it is open the panel's **top edge does not move**: switching a preset
section to `All` (or opening the suggestions block) makes a taller panel, and
the panel grows downwards from where it opened. Growth the screen cannot fit is
taken back as a `max-height`, so the panel scrolls inside itself instead of
flipping above the square or off the bottom of the window. Moving the page, or
resizing the window, re-anchors it — that is the trigger moving, not the panel.

Anchored is where the panel *opens*, not where it must stay. Drag its header and
the box is yours: it stops following the trigger until the next open, keeps its
position through a preset section growing, and is clamped to the viewport. The
corner grip resizes it (down to `400×320`, up to the screen), `⤢` in the header
or `m` fills the viewport and puts the previous box back, and the next open
hands the box to the trigger again — a resized width or height is kept.

A popover never fires `onCancel` or `onApply`; use `onChange` while it is open
and `onClose` when it goes away. Anything that still needs a transaction can
pass `mode: 'modal'`.

## Inline — docked in your layout

`mode: 'inline'` mounts the panel in `container` as an ordinary block and leaves
it there: shown from construction, with no scrim, no close, no maximize, no
`OK`/`Cancel`, no drag or resize, and no focus trap. `open()`, `close()` and
`dismiss()` do nothing. Keyboard shortcuts (`Escape`, `c`, `m`, `Page Up`/`Down`)
are heard only while focus is inside the panel, since the panel is always open.

```js
const picker = new ColorPicker({
  mode: 'inline',
  container: '#colorSlot',
  initialColors: { color: '#0F766E' },
  onChange: (colors) => paint(colors.color),
});
picker.setColors({ color: '#7C3AED' });   // point it at another value; fires onChange
```

## Slots — any number of named colors

One slot is the default. Declare more when the host paints more:

```js
new ColorPicker({
  slots: [
    { id: 'text', label: 'Body ink', symbol: 'Aa', presetSet: 'text' },
    { id: 'background', label: 'Card', symbol: '▰', presetSet: 'background' },
    { id: 'accent', label: 'Accent', type: 'Accent', symbol: '✦', hint: 'Buttons and links' },
  ],
  initialColors: { text: '#0F766E', background: '#CCFBF1', accent: '#7C3AED' },
  onChange: (colors) => console.log(colors.accent),
});
```

| Slot key | Type | Notes |
| --- | --- | --- |
| `id` | `string` | **Required.** The key in `initialColors`, `getColors()` and every callback; must match `/^[A-Za-z][\w-]*$/` and be unique |
| `label` | `string` | Tab name; defaults to the shipped name, else the id |
| `type` | `string` | Small line under the tab name — the kind of color it is. Defaults to the preset group's short name (`Text` / `Background`); override it when the palette hint does not describe the slot (`Accent`, `Border`, …) |
| `symbol` | `string` | The glyph in the tab; defaults to the id's first letter |
| `hint` | `string` | Tooltip on the tab; not a visible line, so a long sentence never costs tab height |
| `presetSet` | `'text' \| 'background'` | Which palette group is **emphasised** while this slot is active. Nothing emphasises `background`; anything else warns and does the same. Both groups stay on screen either way |
| `color` | `string` | Fallback color when `initialColors` has none for this id. Must be a hex string — anything else throws a `TypeError` |

Palettes are not per slot: `presets` is keyed by group (`text`, `background`) and both
groups are always rendered. Clicking a swatch writes the slot the editor is
showing.

A tab per slot (two or more), and both palette groups under the editor. Two
slots may share one `presetSet` — a section surface and a card surface are both
background colors — and get two tabs that differ by `label`; the shared type line
says they take the same kind of palette. A slot not named in `contrastPair`
simply shows no suggestions.

## Fields — your own inputs

Point `fields` at inputs that already exist and each one becomes a slot named
after the field: `data-slot`, then the `id`, then `color`/`color2`. No trigger
bar is drawn — the field itself is the control, and its value is the color.

```html
<label for="ink">Ink</label>
<input id="ink" type="text" data-color-picker value="#0F766E">
<label for="wash">Wash</label>
<input id="wash" type="text" data-color-picker value="#CCFBF1">
<script type="module">
  import ColorPicker from './src/color-picker.js';

  const picker = new ColorPicker({
    fields: '[data-color-picker]',                // selector, element or NodeList
    onChange: (colors) => console.log(colors.ink, colors.wash),
  });
</script>
```

Each field carries `aria-haspopup="dialog"` and `aria-expanded`, opens on click
or `Enter`, and is written back as normalized HEX with a native `input` event, so
a framework bound to the field sees the change. A typed value that is not a
color is rejected visibly: `aria-invalid="true"` and the previous value
restored. `fields` and `slots` cannot be combined — the fields name the slots.

Nothing scans the page at import time: the attribute is a marker for the
selector you hand to `fields`, so the instance is explicit and the DOM order is
yours.

## Basic usage — modal

Without `triggers` the picker is a plain modal: you own the trigger, `OK`
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
`triggers`, as a popover anchored to the square you clicked. Call `open()` to
show it; in modal mode `OK` commits and closes, `Cancel` restores the values that
were active when it opened and closes. `Reset` is the `↺` icon beside `×` in the
header: it restores `initialColors` on every slot and keeps the panel open. The
compact toggle next to it hides the palettes and the contrast band, leaving the
editor alone; press it again to bring them back. A
popover renders no footer at all — there is nothing to apply or discard.

The HEX field carries a copy button on its right: it writes the active slot's
current value to the clipboard, flips to `✓` for a moment, and announces
`Copied #0F766E.` on the live region. It copies the color the editor is
showing, so switching tabs changes what the next click copies. `labels.copy`
renames it.

A format dropdown beside the field switches how the color is shown and copied:
`HEX`, `RGB`, `HSL` or `HSV` (`#0F766E`, `rgb(15, 118, 110)`,
`hsl(175, 77%, 26%)`, `hsv(175, 87%, 46%)`; translucent colors become
`rgba(…)`, `hsla(…)`, `hsva(…)`). The field accepts any of them whatever the
dropdown says — paste `hsl(0 100% 50%)` or `rgb(0 0 0 / 50%)` and it lands.
The `format` option sets the starting format; events and `getColors()` stay HEX.

The panel is compact by design — it covers a fraction of the page, and the
scrim is light — so the surface you are recoloring stays visible while you
edit. Drag it by its header to move it off whatever you need to see
(double-click the header to put it back in the middle); the panel is clamped to
the viewport. The corner grip resizes it, `⤢` beside `×` (or `m` while it is
open) fills the viewport and restores the box you had, and `⌘`/`Ctrl`+`Enter`
is the `OK` button. It keeps its position across open/close. Below 680px it
becomes a bottom sheet: moving, resizing and the toggle are off, because the
sheet owns the box.

Keyboard: `Page Up`/`Page Down` switch the color-type tab; on a palette tab
`←`/`→` switch palette and `↓` enters its swatches; on a swatch `↑`/`↓` move by
row (`↑` from the top row goes back to the tabs) and `←`/`→` by one; each move also applies the color.

## Options

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `container` | `HTMLElement \| string` | `document.body` | Where the root element is mounted; a selector is resolved once, at construction. A selector that matches nothing, or a value that is neither, warns and mounts on `document.body` |
| `slots` | `Array<object \| string>` | one slot, `color` | The named colors to edit; see the Slot table above |
| `initialColors` | `{ [slotId]: string }` | `#0F766E` for `color` | Normalized on construction; also the target of Reset. A missing or invalid value falls back per slot |
| `activeSlot` | `string` | first slot | Tab shown first |
| `contrastPair` | `[id, id]` | `null` | The two slots suggestions measure against each other. Required for `showContrastSuggestions` — there is no guessing which pair you meant |
| `format` | `'hex' | 'rgb' | 'hsl' | 'hsv'` | `'hex'` | Format the editor field shows and Copy writes; the user can switch it with the dropdown |
| `showAlpha` | `boolean` | `true` | Opacity slider. When `false` the slider is hidden and alpha is forced to `1`, so an 8-digit HEX cannot leave a translucent color behind |
| `showContrastSuggestions` | `boolean` | `false` | Show the collapsible contrast panel under the presets |
| `draggable` | `boolean` | `true` | Drag the panel by its header to move it aside; double-click the header to re-centre. `false` pins a fixed, centered modal. Works in both modes — a dragged popover stops following its trigger until the next open |
| `width` / `height` | `number \| string` | `540` / auto | Starting panel size. A number is px, a string any CSS length (`'32rem'`). Still capped to the viewport; the user can resize unless `resizable: false` |
| `placement` / `offset` | `string` / `{x, y}` | `'bottom-start'` / none | Popover only. Side and edge of the trigger the panel hangs off: `bottom`, `top`, `left` or `right` + `-start` or `-end`. `offset` nudges it in px. A side without room flips to the opposite one |
| `position` | `{x, y}` | none | Popover only. Absolute viewport px for the panel's top-left; overrides `placement`/`offset`. Still clamped to the screen |
| `resizable` | `boolean` | `true` | Corner grip writes an explicit width/height, clamped to the viewport. `false` drops the grip; the maximize toggle stays |
| `theme` | `'light' \| 'dark'` | `'light'` | Written to `data-theme` on the root; the dark theme only swaps tokens |
| `presets` | `{ text?: object, background?: object }` | built-in palettes | Per palette group, the shipped palette with your categories merged in: a name that already exists (`Normal`, `Heading`, …) **replaces** that palette, a new name is added after the shipped ones. Each category must be an array of hex strings — anything else throws a `TypeError` |
| `triggers` | `HTMLElement \| string` | `null` | Host element (or selector) for the trigger bar, one trigger per slot. Setting it switches `mode` to `popover` |
| `fields` | `string \| HTMLElement \| NodeList` | `null` | Inputs that **are** the controls — one slot each, named by `data-slot`, then the `id`, then `color`/`color2`. Setting it switches `mode` to `popover` and rules out `slots` |
| `mode` | `'auto' \| 'modal' \| 'popover'` | `'auto'` | `'auto'` = `popover` when a trigger is rendered, `modal` otherwise; an unknown value warns and is treated as `'auto'`. A popover hides `OK`/`Cancel`, and `⌘`/`Ctrl`+`Enter` closes it instead of committing |
| `classNames` | `string` | `''` | Extra classes on the root element |
| `labels` | `object` | English | Override `title`, `close`, `reset`, `copy`, `format` (the dropdown's name), `compact`, `maximize`, `restore`, `cancel`, `apply`, `hex`, `hue`, `opacity`, `sv`, `svHint`, `slotsLabel` (the tablist name), `tabs[id]` (`{ title, type, hint }`), and the trigger bar — `triggersLabel` plus `triggers[id]` for a trigger's name (the same names label a bound field) |

## API

| Method | Returns | Description |
| --- | --- | --- |
| `open(anchor?)` | `void` | Snapshots the current colors, shows the panel, fires `onOpen`. `anchor` is the element a popover hangs off; omitted, a popover uses its own trigger for the active slot, and a picker without triggers centres itself |
| `close()` | `void` | Hides the panel, fires `onClose`. Colors are kept as they are |
| `dismiss()` | `void` | The path the shell uses for `×`, `Escape` and (in a popover) `⌘`/`Ctrl`+`Enter`: a popover closes and keeps its edits, a modal restores the snapshot (`cancel()`) |
| `destroy()` | `void` | Removes listeners, the root element and the trigger bar |
| `getColors()` | `{ [slotId]: string }` | Fresh copy of normalized HEX strings; alpha is appended only when `a < 1` |
| `setColors(partial)` | `void` | Applies any subset of slots, fires `onChange` when something changed. An invalid value is ignored and the slot keeps its current color |
| `setActiveSlot(id)` | `void` | Switches the editor to a slot; each slot keeps its own color |

`getColors()` always returns a copy, so mutating the result never touches the
picker's state. Keys are exactly the slot ids you declared — nothing else is
carried.

## Callbacks

| Callback | Argument | When |
| --- | --- | --- |
| `onChange` | `colors` | Any color edit — drag, slider, HEX field, preset click, `setColors()` |
| `onApply` | `colors` | `OK` pressed, or `⌘`/`Ctrl`+`Enter` in a modal, before it closes |
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
    background: { Brand: ['#B0A5F2', '#51CAA7'] },
  },
});
```

The shipped palettes, if you want to replace one of them: `text` is grouped by
role: `Normal` (69) for body copy, `Heading` (68, blue, violet and green) for
headings and section titles, `Highlight` (90) for colorful emphasis. Every
color clears 4.5:1 on white or on `#111827`; the light ones at the end of
`Normal` and `Highlight` are for dark surfaces · `background`
holds `Vivid` (90), built on all 60 inks of sprints-planner's badge palette, and
`Pale` (90), the pale washes this group shipped before plus later additions.
Every category is ordered so similar colors sit together: the text tabs walk
one tint family at a time, dark to light, with their dark-surface colors last;
the background tabs run in hue order.

`Vivid` is two lightnesses of one idea: the app's own mid-light chips (all 60,
including its 14 low-chroma Jira label-chip inks) plus 16 fill-ins at oklch
L .70–.76, and a deep tier this library adds (14 entries, one per hue at L .64
with chroma at the sRGB ceiling, up to .28).

None of those 90 inks is a surface for mid-tone text: 90 of 90 clear 4.5:1 against
a near-black like `#111827`, none of them against `#0F766E`. That is what `Pale`
is for — the contrast suggestions rank partners out of this palette, so without a
pale category a mid-tone text color would get an empty suggestions panel. Every
`Pale` entry clears at least 3.71:1 against `#0F766E`; a wash light enough for that
has little chroma left, so the newest additions sit only dE00 4.1 or more apart.

Categories replace by name: a category the config names takes the place of the
shipped palette of that name (`Normal`, `Vivid`, …) and keeps its position in the
row; a new name is appended after the shipped ones. The shipped tables are never
mutated, so two instances with different `presets` do not affect each other.

`All` is a view, not a category: it always reflects whatever categories the
instance ends up with, so it cannot be replaced by config and a section still
opens on its first shipped category. `categoriesWithAll()` and `allColors()` in
`src/presets.js` are the pure functions behind it.

## Contrast suggestions

```js
new ColorPicker({
  slots: [
    { id: 'text', label: 'Text color', symbol: 'Aa', presetSet: 'text' },
    { id: 'background', label: 'Panel background', symbol: '▰', presetSet: 'background' },
  ],
  showContrastSuggestions: true,
  contrastPair: ['text', 'background'],
});
```

A ratio needs two colors, so suggestions require two declared slots plus the
`contrastPair`; with the default single slot the panel stays hidden.

Adds a collapsed `<details>` panel under the presets. Its summary carries the
current pair's ratio and a WCAG badge; opening it lists up to three readable
partners with their own ratios.

- Suggestions only appear on the two slots named in `contrastPair`; any other
  slot hides the panel rather than guessing a partner.
- Selecting one slot's color suggests partners for the *other* slot, from that
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
theme and the dark theme compose. The trigger bar lives in the host's layout
rather than inside `.cp-root`, so it carries its own `--cpt-*` pair on
`.cp-triggers` (same light/dark switch through `data-theme`). The tab row and the
preset row get one column per slot from `--cp-slots`, which the component writes
on its root. Below 680px the modal becomes a bottom sheet: full width, rounded
top corners, tabs wrap, one preset column, sticky footer.

Multiple instances are independent: each owns its own root element, state, and
listeners, so two pickers on one page never share colors.

## Development

```bash
python3.12 -m http.server 8000   # then open /index.html
node --test                      # color math, preset merging, slot resolution
npm install && npm run build     # bundle and minify into dist/
```

`npm run build` (esbuild, `build.mjs`) writes four files; the JS ones get a source map:

| File | Use |
|---|---|
| `dist/color-picker.esm.js` | ES module bundle, readable |
| `dist/color-picker.esm.min.js` | ES module bundle, minified — `import ColorPicker from './dist/color-picker.esm.min.js'` |
| `dist/color-picker.min.js` | Minified classic script — `<script src>` sets `window.ColorPicker` to the class |
| `dist/color-picker.min.css` | Minified stylesheet |

The bundles carry `ColorPicker` only; the contrast helpers stay importable from
`src/contrast.js`.

`index.html` is six panels, each one setup call printed above the instance it
builds: the default single color, the text/panel pair with contrast
suggestions, a dark-theme three-slot brand picker with its own `Brand`
category, a four-slot light-theme section that repaints heading, two surfaces
and accent from one popup, and a `fields` instance whose controls are the host's
own inputs, and a whole-page panel where the headline and body copy take the
`text` color, the card takes `background`, and a live ratio pill (the library's
own WCAG code) says whether the pair still passes AA. Each snippet is the call
its panel runs, so the page doubles as the API reference. The pickers run from
their trigger bars, so there is no "open" button anywhere.

`smoke/index.html` is a browser harness for the component itself — open it through
the local server and it prints PASS/FAIL per behaviour (tabs, HEX, drag, resize
grip, maximize toggle and its keys, footer actions, presets, the `All` union
grid, suggestions, dark theme, focus trap, two instances, trigger bars, popover
placement, three-slot pickers, two tabs of one group, borrowed palettes, input
validation). The checks live in `smoke/part1.js`–`part7.js`, run in order; they sit outside
`test/` so `node --test` does not pick them up. Headless
needs a pinned window, otherwise the default viewport is too short for the drag
and anchoring checks:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --window-size=1200,900 --virtual-time-budget=5000 \
  --dump-dom http://127.0.0.1:8000/smoke/   # <title> carries PASS / FAIL n
```