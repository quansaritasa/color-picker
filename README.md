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
| `showAlpha` | `boolean` | `true` | Hide the opacity slider when `false` |
| `showContrastSuggestions` | `boolean` | `false` | Reserved for the suggestions panel |
| `theme` | `'light' \| 'dark'` | `'light'` | Written to `data-theme` on the root |
| `presets` | `object` | built-in palettes | Adds custom categories to the shipped palettes; a name that already exists is ignored |
| `classNames` | `string` | `''` | Extra classes on the root element |
| `labels` | `object` | English | Override `title`, `close`, `reset`, `cancel`, `apply`, `hex`, `hue`, `opacity`, `sv`, `textPresets`, `panelPresets`, `textHint`, `panelHint`, and `tabs.highContrast` / `tabs.lowContrast` (`{ title, hint }`) |

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

Categories are additive: a custom name that already exists (`Cool`, `Blue`, …) is
ignored, so a config typo cannot replace a shipped palette.

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

Multiple instances are independent: each owns its own root element, state, and
listeners, so two pickers on one page never share colors.

## Development

```bash
python3.12 -m http.server 8000   # demo page
node --test                      # color math tests
```

`test/smoke.html` is a browser harness for the component itself — open it through
the local server and it prints PASS/FAIL per behaviour (tabs, HEX, drag, footer
actions, two instances).
