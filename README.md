# color-picker

A dependency-free color picker in vanilla ES modules. It edits **named colour
slots** and always offers **both preset palettes** — text colours and background
colours — because a dimmed background tone is a legitimate text colour. A swatch
writes the slot the editor is showing; the palette is a suggestion, never an
owner. Each palette leads with an **`All`** pill that puts its whole union in one
grid, so you can scan 40 text colours without clicking through six categories.

Out of the box it is a **single-colour picker**: one slot, `color`, no tab row.
A host that paints two things declares two slots (`text` + `background`,
`accent`, …) and gets a tab per slot. No build step.

## Setup

No build step and no package manager: copy these into your project, keeping the
`src/` layout.

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
  <p id="ink">This paragraph takes the colour you pick.</p>
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

You should see one square labelled `Colour`, its HEX beside it. Click the
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

`index.html` and `demo.html` in this repo are that same install, so diffing them
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

That renders a square (`Colour`) with its current HEX, and switches the picker to
**popover mode**: the panel opens anchored under the square you clicked, on that
square's slot, with no scrim and no `OK`/`Cancel`
and no bottom strip — every edit is painted live, so there is nothing to apply
or discard. It closes on `Escape`, on `⌘`/`Ctrl`+`Enter`, on the `×`, on a click
outside, and on a second click of the same square; `↺` in the header resets every
slot. Below 680px the popover becomes a bottom sheet capped at `78vh`, so the
page it is recolouring stays visible above it.

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

## Slots — any number of named colours

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
| `type` | `string` | Small line under the tab name — the kind of colour it is. Defaults to the preset group's short name (`Text` / `Background`); override it when the palette hint does not describe the slot (`Accent`, `Border`, …) |
| `symbol` | `string` | The glyph in the tab; defaults to the id's first letter |
| `hint` | `string` | Tooltip on the tab; not a visible line, so a long sentence never costs tab height |
| `presetSet` | `'text' \| 'background'` | Which palette group is **emphasised** while this slot is active. Anything else — or nothing — emphasises `background`; both groups stay on screen either way |
| `color` | `string` | Fallback colour when `initialColors` has none for this id |

Palettes are not per slot: `presets` is keyed by group (`text`, `background`) and both
groups are always rendered. Clicking a swatch writes the slot the editor is
showing.

A tab per slot (two or more), and both palette groups under the editor. Two
slots may share one `presetSet` — a section surface and a card surface are both
background colours — and get two tabs that differ by `label`; the shared type line
says they take the same kind of palette. A slot not named in `contrastPair`
simply shows no suggestions.

## Fields — your own inputs

Point `fields` at inputs that already exist and each one becomes a slot named
after the field: `data-slot`, then the `id`, then `color`/`color2`. No trigger
bar is drawn — the field itself is the control, and its value is the colour.

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
colour is rejected visibly: `aria-invalid="true"` and the previous value
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
the viewport. The corner grip resizes it, `⤢` beside `×` (or `m` while it is
open) fills the viewport and restores the box you had, and `⌘`/`Ctrl`+`Enter`
is the `OK` button. It keeps its position across open/close. Below 680px it
becomes a bottom sheet: moving, resizing and the toggle are off, because the
sheet owns the box.

## Options

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `container` | `HTMLElement \| string` | `document.body` | Where the root element is mounted; a selector is resolved once, at construction |
| `slots` | `Array<object \| string>` | one slot, `color` | The named colours to edit; see the Slot table above |
| `initialColors` | `{ [slotId]: string }` | `#0F766E` for `color` | Normalized on construction; also the target of Reset. A missing or invalid value falls back per slot |
| `activeSlot` | `string` | first slot | Tab shown first |
| `contrastPair` | `[id, id]` | `null` | The two slots suggestions measure against each other. Required for `showContrastSuggestions` — there is no guessing which pair you meant |
| `showAlpha` | `boolean` | `true` | Opacity slider. When `false` the slider is hidden and alpha is forced to `1`, so an 8-digit HEX cannot leave a translucent color behind |
| `showContrastSuggestions` | `boolean` | `false` | Show the collapsible contrast panel under the presets |
| `draggable` | `boolean` | `true` | Drag the panel by its header to move it aside; double-click the header to re-centre. `false` pins a fixed, centered modal. Works in both modes — a dragged popover stops following its trigger until the next open |
| `resizable` | `boolean` | `true` | Corner grip writes an explicit width/height, clamped to the viewport. `false` drops the grip; the maximize toggle stays |
| `theme` | `'light' \| 'dark'` | `'light'` | Written to `data-theme` on the root; the dark theme only swaps tokens |
| `presets` | `{ text?: object, background?: object }` | built-in palettes | Per palette group, the shipped palette with your categories merged in: a name that already exists (`Cool`, `Blue`, …) **replaces** that palette, a new name is added after the shipped ones |
| `triggers` | `HTMLElement \| string` | `null` | Host element (or selector) for the trigger bar, one trigger per slot. Setting it switches `mode` to `popover` |
| `fields` | `string \| HTMLElement \| NodeList` | `null` | Inputs that **are** the controls — one slot each, named by `data-slot`, then the `id`, then `color`/`color2`. Setting it switches `mode` to `popover` and rules out `slots` |
| `mode` | `'auto' \| 'modal' \| 'popover'` | `'auto'` | `'auto'` = `popover` when a trigger is rendered, `modal` otherwise. A popover hides `OK`/`Cancel`, and `⌘`/`Ctrl`+`Enter` closes it instead of committing |
| `classNames` | `string` | `''` | Extra classes on the root element |
| `labels` | `object` | English | Override `title`, `close`, `reset`, `copy`, `maximize`, `restore`, `cancel`, `apply`, `hex`, `hue`, `opacity`, `sv`, `svHint`, `slotsLabel` (the tablist name), `tabs[id]` (`{ title, type, hint }`), and the trigger bar — `triggersLabel` plus `triggers[id]` for a trigger's name (the same names label a bound field) |

## API

| Method | Returns | Description |
| --- | --- | --- |
| `open(anchor?)` | `void` | Snapshots the current colors, shows the panel, fires `onOpen`. `anchor` is the element a popover hangs off; omitted, a popover uses its own trigger for the active slot, and a picker without triggers centres itself |
| `close()` | `void` | Hides the panel, fires `onClose`. Colors are kept as they are |
| `dismiss()` | `void` | The path the shell uses for `×`, `Escape` and (in a popover) `⌘`/`Ctrl`+`Enter`: a popover closes and keeps its edits, a modal restores the snapshot (`cancel()`) |
| `destroy()` | `void` | Removes listeners, the root element and the trigger bar |
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

The shipped palettes, if you want to replace one of them: `text` holds the six
spec categories (`Cool`, `Blue`, `Hot`, `Purple`, `Green`, `Neutral`) · `background`
holds the 46 vivid inks from sprints-planner's badge palette, their 14-colour deep
tier, and `Pale` (39), the pale washes this group shipped before plus five more.

`Vivid` is two lightnesses of one idea: the app's own mid-light chips (46 entries
at oklch L .72–.76, chroma .09–.16) and a deep tier this library adds (14 entries,
one per hue at L .64 with chroma at the sRGB ceiling, up to .28). The app's
low-chroma tail — its 14 Jira label-chip inks — is not shipped: same hues and
lightness as the entries above, so as a category it was washed copies in the grid.

None of those 60 inks is a surface for mid-tone text: 60 of 60 clear 4.5:1 against
a near-black like `#111827`, none of them against `#0F766E`. That is what `Pale`
is for — the contrast suggestions rank partners out of this palette, so without a
pale category a mid-tone text colour would get an empty suggestions panel. Pale
stops at 39 for the same reason it exists: a wash light enough to clear 4.5:1
against `#0F766E` has almost no chroma left, so further additions land within
dE00 2.6 of one already in the list.

Categories replace by name: a category the config names takes the place of the
shipped palette of that name (`Cool`, `Vivid`, …) and keeps its position in the
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
    { id: 'text', label: 'Text colour', symbol: 'Aa', presetSet: 'text' },
    { id: 'background', label: 'Panel background', symbol: '▰', presetSet: 'background' },
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
python3.12 -m http.server 8000   # then open /index.html or /demo.html
node --test                      # colour math, preset merging, slot resolution
```

`index.html` is five panels, each one setup call printed above the instance it
builds: the default single colour, the text/panel pair with contrast
suggestions, a dark-theme three-slot brand picker with its own `Brand`
category, a four-slot light-theme section that repaints heading, two surfaces
and accent from one popup, and a `fields` instance whose controls are the host's
own inputs. Each snippet is the call its panel runs, so the page doubles as the
API reference. `demo.html` paints an
entire page — the headline and body copy take the `text` colour, the panel takes
`background`, and a live ratio pill (the library's own WCAG code) says whether
the pair still passes AA. Both drive the picker from its trigger bar, so there is
no "open" button anywhere.

`test/smoke.html` is a browser harness for the component itself — open it through
the local server and it prints PASS/FAIL per behaviour (tabs, HEX, drag, resize
grip, maximize toggle and its keys, footer actions, presets, the `All` union
grid, suggestions, dark theme, focus trap, two instances, trigger bars, popover
placement, three-slot pickers, two tabs of one group, borrowed palettes). Headless
needs a pinned window, otherwise the default viewport is too short for the drag
and anchoring checks:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --window-size=1200,900 --virtual-time-budget=5000 \
  --dump-dom http://127.0.0.1:8000/test/smoke.html   # <title> carries PASS / FAIL n
```