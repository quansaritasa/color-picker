# color-picker

A dependency-free color picker in vanilla ES modules, with two independent modes:
**High Contrast** (foreground / text colors) and **Low Contrast** (background /
panel colors), a shared HSV editor with alpha, preset palettes, and a small API.
No build step.

## Install

Copy these into your project — there is no npm package and no bundler:

```text
src/color.js
src/presets.js
src/options.js
src/tablist.js
src/template.js
src/editor.js
src/presets-panel.js
src/contrast.js
src/suggestions.js
src/focus.js
src/bindings.js
src/color-picker.js
color-picker.css
```

Then load it as a module. ES modules need an HTTP origin: `file://` is blocked by
browsers, so serve the folder while developing.

```bash
python3.12 -m http.server 8000   # then open http://localhost:8000/
```

## Basic usage

```html
<link rel="stylesheet" href="./color-picker.css">
<script type="module">
  import ColorPicker from './src/color-picker.js';

  const picker = new ColorPicker({
    initialColors: { highContrast: '#0F766E', lowContrast: '#CCFBF1' },
    onChange: (colors) => console.log('changed', colors),
    onApply: (colors) => console.log('applied', colors),
  });

  document.querySelector('#open').addEventListener('click', () => picker.open());
</script>
```

The picker renders as a centered modal appended to `document.body`. Call
`open()` to show it; `OK` commits and closes, `Cancel` restores the values that
were active when it opened and closes, `Reset` restores `initialColors` and keeps
the modal open.

## Options

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `container` | `HTMLElement` | `document.body` | Where the root element is mounted |
| `initialColors` | `{ highContrast, lowContrast }` | `#0F766E`, `#CCFBF1` | Normalized on construction; also the target of Reset |
| `activeTab` | `'highContrast' \| 'lowContrast'` | `'highContrast'` | Tab shown first |
| `showAlpha` | `boolean` | `true` | Opacity slider. When `false` the slider is hidden and alpha is forced to `1`, so an 8-digit HEX cannot leave a translucent color behind |
| `showContrastSuggestions` | `boolean` | `false` | Show the collapsible contrast panel under the presets |
| `theme` | `'light' \| 'dark'` | `'light'` | Written to `data-theme` on the root; the dark theme only swaps tokens |
| `presets` | `object` | built-in palettes | Per mode, the shipped palettes with your categories merged in: a name that already exists (`Cool`, `Blue`, …) **replaces** that palette, a new name is added after the shipped ones |
| `classNames` | `string` | `''` | Extra classes on the root element |
| `labels` | `object` | English | Override `title`, `close`, `reset`, `cancel`, `apply`, `hex`, `hue`, `opacity`, `sv`, `svHint`, `textPresets`, `panelPresets`, `textHint`, `panelHint`, and `tabs.highContrast` / `tabs.lowContrast` (`{ title, hint }`) |

## API

| Method | Returns | Description |
| --- | --- | --- |
| `open()` | `void` | Snapshots the current colors, shows the modal, fires `onOpen` |
| `close()` | `void` | Hides the modal, fires `onClose` |
| `destroy()` | `void` | Removes listeners and the root element |
| `getColors()` | `{ highContrast, lowContrast }` | Fresh copy of normalized HEX strings; alpha is appended only when `a < 1` |
| `setColors(partial)` | `void` | Applies any subset of tabs, fires `onChange` when something changed |
| `setActiveTab(tab)` | `void` | Switches tabs; each tab keeps its own color |

`getColors()` always returns a copy, so mutating the result never touches the
picker's state.

## Callbacks

| Callback | Argument | When |
| --- | --- | --- |
| `onChange` | `colors` | Any color edit — drag, slider, HEX field, `setColors()` |
| `onApply` | `colors` | `OK` pressed, before the modal closes |
| `onCancel` | `colors` | `Cancel`, `×`, or `Escape`; colors are already restored |
| `onOpen` | `colors` | After the modal becomes visible |
| `onClose` | `colors` | After the modal is hidden |

Every callback receives a copy of the color state, never an internal reference.
`setColors()` only emits when a value actually changes, so calling it from inside
`onChange` with the same values cannot loop.

## Custom presets

```js
new ColorPicker({
  presets: {
    highContrast: { Brand: ['#111827', '#1F2937'] },
    lowContrast: { Brand: ['#F0FDFA', '#CCFBF1'] },
  },
});
```

Categories replace by name: a category the config names takes the place of the
shipped palette of that name (`Cool`, `Blue`, …) and keeps its position in the
row; a new name is appended after the shipped ones. The shipped tables are never
mutated, so two instances with different `presets` do not affect each other.

## Contrast suggestions

```js
new ColorPicker({ showContrastSuggestions: true });
```

Adds a collapsed `<details>` panel under the presets. Its summary carries the
current pair's ratio and a WCAG badge; opening it lists up to three readable
partners with their own ratios.

- Selecting a **High Contrast** color suggests **Low Contrast** backgrounds, and
  the other way round, from the loaded palettes.
- WCAG AA is 4.5:1 for normal text, AA for large text is 3:1 (shown as a second
  `AA-large` badge when the pair fails normal text), AAA is 7:1.
- The panel **never** changes the color you are editing. Picking a partner sets
  the *other* tab's color, so the pair improves while your choice stays put.

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
theme and the dark theme compose. Below 680px the modal becomes a bottom sheet:
full width, rounded top corners, one preset column, sticky footer.

Multiple instances are independent: each owns its own root element, state, and
listeners, so two pickers on one page never share colors.

## Development

```bash
python3.12 -m http.server 8000   # then open /index.html or /demo.html
node --test                      # color math + contrast math
```

`index.html` shows both colors in a preview card; `demo.html` paints an entire
page with them — the headline and body copy take the High Contrast colour, the
panel takes the Low Contrast one, and a live ratio pill (the library's own WCAG
code) says whether the pair still passes AA.

`test/smoke.html` is a browser harness for the component itself — open it through
the local server and it prints PASS/FAIL per behaviour (tabs, HEX, drag, footer
actions, presets, suggestions, dark theme, focus trap, two instances).
