# Task Plan

## Task Context
- ID: 261108-color-picker-lib
- Title: Build a modern, dependency-free color picker library (High Contrast / Low Contrast)
- Source of truth: Mixed — `sop.md` (spec, authoritative for behavior/API) + `reference/modern-color-picker.html` (visual reference, authoritative for design tokens and layout) + user decisions in this session
- Current status: Open — review pass 1 (iterations 1–4): **Fail**; 2 blocking + 8 minor findings, next skill `dev-code`
- Repository / Project: color-picker (local, `main`, initial commit `d52b68c`)
- Owner / Assignee: Quan

## Stable Requirements
- Objective: ship a framework-independent color picker (vanilla ES modules) with two independent modes — High Contrast (foreground/text) and Low Contrast (background/panel) — a shared HSV editor with alpha, preset palettes, optional WCAG-based pairing suggestions, and a small public API, usable by `<script type="module">` with no build step.
- Acceptance criteria — each carries the code that would satisfy it:
  1. Two tabs switch modes and each keeps its own color — new: `src/color-picker.js` (`setActiveTab`, per-tab `colors` record) · `grep -n "setActiveTab\|highContrast" src/color-picker.js`
  2. Selecting a preset swatch updates editor, HEX field, and selection state — new: `src/presets-panel.js` (`renderSwatches`, `brand`/`selected` class) · `grep -n "selected" src/presets-panel.js`
  3. Drag in the SV area updates color continuously with pointer + touch — new: `src/editor.js` (`pointerdown`/`pointermove` + `setPointerCapture`) — port of `reference/modern-color-picker.html:343-346`
  4. Hue and alpha sliders update gradient, preview and HEX live — new: `src/editor.js` (`hue`, `alpha` handlers) — port of `reference/modern-color-picker.html:347-356`
  5. HEX input accepts `#RGB`, `#RRGGBB`, `#RGBA`, `#RRGGBBAA`, normalizes, and rejects invalid input without overwriting the current color — new: `src/color.js` (`parseHex`) — port of `reference/modern-color-picker.html:231-237` (`[3,4,6,8]` length check)
  6. `getColors()` returns a normalized-hex copy; alpha included only when `a < 1` — new: `src/color.js` (`formatHex`) + `src/color-picker.js` (`getColors`) — port of `reference/modern-color-picker.html:238-242`
  7. Reset / Cancel / OK behave per spec §7 (Reset keeps the modal open, Cancel restores pre-open values + closes, OK commits + closes) — new: `src/color-picker.js` (`reset`, `cancel`, `apply`, `open` snapshot)
  8. Multiple instances work independently — new: `src/color-picker.js` (no module-level state; per-instance root element) · `grep -n "new Map\|this.root" src/color-picker.js`
  9. Public API `open/close/destroy/getColors/setColors/setActiveTab` + `onChange/onApply/onCancel/onOpen/onClose` — new: `src/color-picker.js` (class surface)
  10. Contrast ratio math is WCAG-correct (relative luminance, 4.5 / 3 / 7 thresholds) with suggestions — new: `src/contrast.js` (`contrastRatio`, `wcagLevel`) · covered by `test/contrast.test.js`
  11. Preset data matches spec §4/§5 exactly and is overridable via `options.presets` — new: `src/presets.js` (`DEFAULT_PRESETS`) · `grep -c "#" src/presets.js`
  12. Light + dark theme via CSS variables; responsive desktop/tablet/mobile bottom-sheet — new: `color-picker.css` (`[data-theme="dark"]`, `@media (max-width: 680px)`) — base ported from `reference/modern-color-picker.html:8-18,103-121`
  13. Accessible: roving tablist, `aria-selected`, `aria-live` status, Escape/Enter, focus-visible ring, `prefers-reduced-motion` — new: `src/color-picker.js` (keydown) + `color-picker.css`
  14. Demo page shows both tabs, text usage, panel usage, live preview, custom-preset instance — new: `index.html`
  15. No external dependency, no build step — new: import graph under `src/` only · `grep -rn "from '" src/ | grep -v "\./"` returns nothing
- Constraints:
  - Split into ES modules, every `.js` ≤200 lines (repo rule, `~/.devflow/AGENTS.md:7`); **user decision** — `src/*.js` + `index.html` with `type="module"`, replacing spec §13's single `color-picker.js`.
  - `color-picker.css` stays one file (spec §13 deliverable); stylesheets are not counted by the 200-line code rule — recorded as a decision, ~380-450 lines.
  - Suggestions shown in a collapsible **"Suggestions" panel below presets** (**user decision**), not as an inline row.
  - Automated tests via `node --test` for color math only (**user decision**); UI verified by the 16-item manual checklist from spec §14.
  - Module imports need an HTTP origin (`file://` blocks ESM) — README documents `python3.12 -m http.server`.
- Out of scope:
  - npm package/publish, bundling, minification, TypeScript types.
  - Output formats other than normalized HEX (no `rgb()`/`hsl()` string API).
  - Persistence (localStorage), eyedropper API, gradient builders.
- ADR constraints: None found (repo has no `docs/adr`).
- Related tasks: None.

## Notes for Future Iterations
- Keep the sections above stable across the task lifetime unless core task understanding changes.
- Append new iterations below. Do not delete prior iterations: once a review pass has graded one, its heading, `**Trigger:**` / `**Depends on:**` / `**Supersedes:**`, `### Plan` and `### Done Criteria` stay here, and its body (Scope, Proposed Changes, Risks, Open Questions) moves to `plan-archive.md`.
- New iterations may be triggered by review follow-up, test failures, or direct user instructions.

---

## Iteration 1 — 2026-11-08 15:10 +07
**Trigger:** user request (initial plan)
**Input summary:** `sop.md` spec + `reference/modern-color-picker.html` visual base; layout/UX/test decisions from the clarify round.
**Depends on:** None
**Supersedes:** None

### Plan
Lay the tested color foundation: parsing/normalization, RGB↔HSV↔HSL conversion, hexa formatting, plus the exact preset tables from spec §4/§5 — all pure functions usable by every later module and tested under `node --test`.

### Scope
- In scope:
  - `src/color.js`, `src/presets.js`, `test/color.test.js`, `.gitignore`
- Out of scope for this iteration:
  - Any DOM, CSS, or public API surface

### Proposed Changes
#### 1. Color core module
- User outcome: one place that converts and normalizes every color the UI touches
- Why: every other module depends on it; bugs here surface as silent color drift
- Affected area: JS / library core
- Confidence: High
- Implementation:
  - `src/color.js`: `parseHex(str)` → `{r,g,b,a}` or `null` for `#RGB|#RGBA|#RRGGBB|#RRGGBBAA` (port of `reference/modern-color-picker.html:231-237`), `formatHex({r,g,b,a})` omitting alpha when `a >= 0.999` (port of `:238-242`), `rgbToHsv` / `hsvToRgb` (port of `:243-258`), `rgbToHsl` / `hslToRgb`, `withAlpha`, `luminance`-free math only.
  - Export as named ES exports; no module-level mutable state.
  - Verify: `node --test test/color.test.js` passes; `wc -l src/color.js` ≤ 200.
- Test Impact:
  - Add: `test/color.test.js` — round-trip `parseHex`→`formatHex` for `#abc`, `#abcd`, `#0F766E`, `#0F766E80`; invalid inputs (`#12`, `nope`, `#GGGGGG`) return `null`; `hsvToRgb(rgbToHsv(x))` ≈ `x` within 1/255 for 12 sampled colors; `rgbToHsl`/`hslToRgb` round-trip.
  - Update: None
  - Verify manually: None

#### 2. Preset tables
- User outcome: the spec's palettes available verbatim and overridable
- Why: spec §4/§5 are literal data; a typo is a wrong product color
- Affected area: JS / library data
- Confidence: High
- Implementation:
  - `src/presets.js`: `DEFAULT_PRESETS = { highContrast: {...6 categories}, lowContrast: {...6 categories} }`, uppercase hex, arrays in spec order (source: `reference/modern-color-picker.html:202-219`, which already matches spec §4/§5; spec is authoritative where they differ — none differ today).
  - `mergePresets(defaults, override)` returning a **new** object (shallow per mode, user categories replace nothing, they are added).
  - Verify: `node --test test/color.test.js` includes a preset sanity test; `wc -l src/presets.js` ≤ 200.
- Test Impact:
  - Add: in `test/color.test.js` — every preset value matches `/^#[0-9A-F]{6}$/`; high-contrast "Neutral" contains `#000000` and `#FFFFFF`; category counts 6 per mode.
  - Update: None
  - Verify manually: None

#### 3. Repo hygiene
- User outcome: the flow bookmark never shows up as a dirty file
- Why: `dev-*` skills rewrite `.local/work.md` every run (`~/.devflow/AGENTS.md:76`)
- Affected area: repo config
- Confidence: High
- Implementation:
  - `.gitignore`: `**/.local/*`, `.DS_Store`
  - Verify: `git status --short` after a skill run shows no `.local` entry.
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: `git status --short | grep -c ".local/work.md"` → `0`

### Done Criteria
- `node --test` green with color + preset tests
- `wc -l src/color.js src/presets.js` both ≤ 200
- No DOM/CSS files created yet

### Risks
- Porting `rgbToHsv` from the reference keeps its float drift at `v=0` — accepted: `parseHex`/`formatHex` round-trip tests catch any error > 1/255.
- Spec §4/§5 lists duplicate values (`#0F766E` in Cool and Green; `#FCE7F3` twice in Pastel) — accepted: keep verbatim, swatch selection compares by normalized hex so duplicates both highlight.

### Open Questions
- None

---

## Iteration 2 — 2026-11-08 15:10 +07
**Trigger:** user request (initial plan)
**Input summary:** component shell, shared editor, and public API decided in the clarify round.
**Depends on:** 1
**Supersedes:** None

### Plan
Make a working picker: modal shell with header/tabs/editor/footer rendered from a template, the HSV editor (SV area, hue, alpha, HEX), the `ColorPicker` class with its full public API and events, base CSS and the demo page.

### Scope
- In scope:
  - `src/template.js`, `src/editor.js`, `src/color-picker.js`, `color-picker.css`, `index.html`, `README.md`, `test/smoke.html` (the browser harness that covers the DOM behaviour `node --test` cannot reach; named here in review-fix 5, step 2.7)
- Sizing: 6 changes, ~700 lines. Past the soft tier because the shell, editor, class and stylesheet are one indivisible unit: any subset leaves a picker that cannot open, so an iteration boundary inside it would have no observable done-criteria. Presets panel, suggestions, dark theme and a11y polish were deferred to iterations 3-4.
- Out of scope for this iteration:
  - Preset swatches, contrast suggestions, dark theme, mobile bottom-sheet

### Proposed Changes
#### 1. DOM template builder
- User outcome: predictable markup that mirrors the approved design
- Why: keeps markup out of the class and out of `innerHTML` string soup in three places
- Affected area: UI / markup
- Confidence: High
- Implementation:
  - `src/template.js`: `buildTemplate({ showAlpha, labels })` returns a `DocumentFragment` built with `document.createElement` (no innerHTML) mirroring `reference/modern-color-picker.html:141-196` class names (`.picker`, `.picker-header`, `.tabs`, `.tab`, `.editor`, `.sv-wrap`, `.hex-row`, `.range-block`, `.footer`); only the structure — preset sections rendered empty for iteration 3.
  - Verify: `grep -n "createElement" src/template.js | wc -l` > 20; no `innerHTML` in file.
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: modal renders with header, tabs, editor, footer present

#### 2. HSV editor controller
- User outcome: dragging the SV area, hue, alpha or typing HEX all drive one color
- Why: the only stateful UI piece; isolating it keeps the class readable
- Affected area: UI / interaction
- Confidence: High
- Implementation:
  - `src/editor.js`: `createEditor(root, { showAlpha, onChange })` → `{ setColor(rgba), getColor(), destroy() }`. SV area uses `pointerdown`+`setPointerCapture`+`pointermove` (port of `reference/modern-color-picker.html:333-346`), thumb at `left = s%`, `top = (1-v)%`; hue range 0-360; alpha 0-100 rendered over a checkerboard (`:78`); HEX field commits on `change` + `Enter` and reverts on invalid input (`:357-361`); live updates fire `onChange(rgba)`.
  - Keep HSV state inside the editor so re-rendering from HEX never changes the hue of a gray (`s=0`) color.
  - Verify: `wc -l src/editor.js` ≤ 200.
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: drag SV corner-to-corner, hue across 0/360, alpha to 0, type `#0F766E80` and back — preview, thumb and field stay in sync

#### 3. ColorPicker class and public API
- User outcome: one import, documented methods, safe copies out
- Why: the deliverable is the API; spec §8 fixes its shape
- Affected area: JS / public API
- Confidence: Medium
- Implementation:
  - `src/color-picker.js`: `class ColorPicker` with `defaults` (`initialColors`, `activeTab`, `showAlpha`, `showContrastSuggestions`, `theme`, `presets`, `classNames`, `labels`, callbacks), per-instance `state = { colors, snapshot, activeTab, categories }`, root `<div class="cp-root">` appended to `options.container ?? document.body`.
  - Methods: `open()` (snapshot current colors, `onOpen`), `close()` (`onClose`), `destroy()` (remove root + listeners, drop instance), `getColors()` (fresh object, normalized hex), `setColors(partial)` (`onChange`), `setActiveTab(tab)`.
  - Footer: Reset → restore `initialColors`, keep open; Cancel → restore open-snapshot, `onCancel`, close; OK → commit snapshot, `onApply`, close.
  - `Escape` cancels while open; `Enter` in HEX confirms only the field.
  - No module-level state anywhere → two instances coexist.
  - Verify: `wc -l src/color-picker.js` ≤ 200; `grep -n "window\." src/color-picker.js` returns nothing.
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: two instances on the demo page change colors independently; `picker.getColors()` returns a copy (mutating it does not affect the picker); `setColors()` called from inside `onChange` settles in one pass (no loop)

#### 4. Component stylesheet (base)
- User outcome: the approved visual design, themeable through variables
- Why: design is the primary quality bar of this task
- Affected area: CSS
- Confidence: High
- Implementation:
  - `color-picker.css`: tokens from `reference/modern-color-picker.html:8-18` under `.cp-root` (not `:root`, to stay encapsulated) + `--cp-*` custom-property names for external theming; modal shell `:42-46`, header `:47-52`, tabs incl. active state `:53-59`, editor grid `:60-73`, ranges + checkerboard alpha `:76-80`, footer `:96-100`, `focus-visible` ring, `prefers-reduced-motion` block.
  - Verify: `grep -c "\-\-cp-" color-picker.css` ≥ 10; visual check against `reference/modern-color-picker.html`
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: side-by-side screenshot against the reference at 1280px

#### 5. Demo page
- User outcome: a page that proves text color, panel background, and live preview
- Why: spec §13 requires a demonstration page, and it is the manual test harness
- Affected area: HTML
- Confidence: Medium
- Implementation:
  - `index.html`: preview cards (sample chip for High Contrast, sample panel for Low Contrast) ported from `reference/modern-color-picker.html:130-139`; "Choose colors" button instantiating `new ColorPicker({...})` with `onChange` updating the previews live; `import ColorPicker from './src/color-picker.js'`; link `color-picker.css`.
  - Verify: `python3.12 -m http.server 8000` in repo root, open `http://localhost:8000/` — no console error, picker opens
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: toggle both tabs, apply, reload — previews reflect applied colors; `python3.12 -m http.server 8000` then open the README snippet page — the module import resolves over http

#### 6. README
- User outcome: someone can install and use the library from the readme alone
- Why: spec §13 deliverable
- Affected area: docs
- Confidence: High
- Implementation:
  - `README.md` (replaces the 28-byte stub): install (copy `src/` + `color-picker.css`, no build), serve note (`python3.12 -m http.server` — ESM needs http), basic usage, options table, API table, callbacks, custom presets, theming via `--cp-*`.
  - Verify: every option/method named in README exists — `grep -n "setActiveTab\|showContrastSuggestions\|--cp-accent" README.md`
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: follow the readme's copy-paste snippet on a blank page

### Done Criteria
- Picker opens, both tabs render, editor drives the color, HEX round-trips, footer buttons behave per spec §7
- Two instances on one page stay independent
- Styles match the reference layout at desktop width

### Risks
- Splitting CSS shell from preset/suggestion styles leaves undefined rules in iteration 1 — accepted: unstyled preset sections are hidden until iteration 3 renders them.
- `setColors()` firing `onChange` can loop if a consumer calls it from `onChange` — covered by: Change #3 `Test Impact` (manual check: `onChange` guarded by `if (plain !== last)`), and documented in README.
- ESM over `file://` silently fails for the user — covered by: Change #6 `Test Impact` (manual: readme documents the http server, verified by serving on :8000).

### Open Questions
- None

---

## Iteration 3 — 2026-11-08 15:10 +07
**Trigger:** user request (initial plan)
**Input summary:** preset palettes and their selection states.
**Depends on:** 2
**Supersedes:** None

### Plan
Render both preset sections with category pills and swatches, wire selection back into the editor and the class, and add the corresponding styles.

### Scope
- In scope:
  - `src/presets-panel.js`, preset/swatch CSS in `color-picker.css`, demo wiring
- Out of scope for this iteration:
  - Contrast suggestions, dark theme, mobile sheet

### Proposed Changes
#### 1. Preset panel renderer
- User outcome: categories and swatches per tab, selected swatch visibly marked
- Why: spec §3.D and §7 define this behavior in detail
- Affected area: UI / interaction
- Confidence: High
- Implementation:
  - `src/presets-panel.js`: `createPresetPanel({ presets, categories, colors, onSelect, onCategory })` → `{ render(tab, color), destroy() }`; pills from `Object.keys(presets[mode])`, active pill class `is-active` (`reference/modern-color-picker.html:88-89`); 7-column swatch grid (`:90`); selected swatch gets `is-selected` outline + `✓` with check color picked by luminance (`:94`, `:301`); swatch click calls `onSelect(hex)`; long-press title/`aria-label` carries the hex.
  - Keep both sections mounted; only the active tab's section is emphasized (`is-emphasis`), per spec §3.D.
  - Verify: `wc -l src/presets-panel.js` ≤ 200.
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: every category of both modes renders the exact hex count from spec §4/§5 (7 or 6 swatches); SV drag at 1280px stays smooth (panel re-render per frame is acceptable; if it visibly stutters, switch to class toggling only as a follow-up)

#### 2. Selection state sync
- User outcome: choosing a swatch updates editor, HEX, preview **and** tab memory
- Why: spec §7 "Preset Selection" and quality item #4
- Affected area: JS / state
- Confidence: Medium
- Implementation:
  - `src/color-picker.js`: `selectColor(hex, { source })` — single writer to `state.colors[activeTab]`, then `editor.setColor`, `panel.render`, `emitChange()`. Called by swatch click, editor `onChange`, `setColors()`.
  - Selecting a swatch on the non-active tab first activates that tab (reference behavior `:303`).
  - Verify: `grep -n "selectColor" src/color-picker.js src/presets-panel.js`
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: pick a swatch on High, switch to Low, pick another, switch back — each tab still shows its own color and checkmark

#### 3. Preset styles
- User outcome: compact pills, square rounded swatches, no decorative shadows
- Why: spec §3.D and §10 ("avoid excessive shadows/gradients")
- Affected area: CSS
- Confidence: High
- Implementation:
  - `color-picker.css`: `.cp-presets` 2-column grid with divider (`reference/modern-color-picker.html:82-83`), `.cp-category` pill + active state (`:88-89`), `.cp-swatch` `aspect-ratio: 1`, `border-radius: 9px`, `outline: 2px` when selected (`:91-94`), de-emphasis opacity for the inactive section.
  - Verify: `grep -c "cp-swatch\|cp-category" color-picker.css` ≥ 4
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: contrast of the `✓` on `#FFFFFF` and `#000000` swatches is legible in both sections

### Done Criteria
- Both sections render all spec categories with correct colors
- Swatch click drives the editor and the demo preview
- Selected state survives tab switches, and Reset/Cancel restore the right checkmarks

### Risks
- Duplicate hex inside one category (spec §4 `#0F766E`) selects two swatches — accepted: both are the same color, so both showing a check is truthful.
- Re-rendering the whole panel on every drag frame is wasteful — covered by: Change #1 `Test Impact` (manual: drag stays smooth at 1280px; if not, switch to class toggling only — noted as a follow-up, not pre-built).

### Open Questions
- None

---

## Iteration 4 — 2026-11-08 15:10 +07
**Trigger:** user request (initial plan)
**Input summary:** WCAG pairing suggestions, theming, and accessible/responsive behavior.
**Depends on:** 3
**Supersedes:** None

### Plan
Add WCAG contrast math and the collapsible Suggestions panel, then finish the product surface: dark theme, keyboard/ARIA behavior, reduced motion, and the mobile bottom-sheet.

### Scope
- In scope:
  - `src/contrast.js`, `src/suggestions.js`, `test/contrast.test.js`, remaining CSS (suggestions, dark theme, responsive), demo custom-preset instance
- Out of scope for this iteration:
  - Any change to the API shape fixed in iteration 2

### Proposed Changes
#### 1. Contrast math
- User outcome: correct AA/AAA verdicts and ranked partners
- Why: spec §6 and quality item #16 ("mathematically correct")
- Affected area: JS / library core
- Confidence: High
- Implementation:
  - `src/contrast.js`: `relativeLuminance({r,g,b})` (sRGB linearization, coefficients 0.2126/0.7152/0.0722), `contrastRatio(a, b)` `(L1+0.05)/(L2+0.05)`, `wcagLevel(ratio, { largeText })` → `'AAA' | 'AA' | 'AA-large' | 'fail'`, `suggestPartners(color, candidates, { limit = 3 })` sorting by ratio desc and filtering `>= 4.5`.
  - Alpha: composite over the opposing surface before measuring (documented in README).
  - Verify: `node --test test/contrast.test.js`; `wc -l src/contrast.js` ≤ 200.
- Test Impact:
  - Add: `test/contrast.test.js` — `#000` vs `#FFF` = 21 (±0.01); `#0F766E` vs `#CCFBF1` ~ 4.4-4.6 range pin; identical colors = 1; `wcagLevel(4.5)` = `'AA'`, `wcagLevel(3)` with `largeText` = `'AA-large'`, `wcagLevel(7)` = `'AAA'`; `suggestPartners` never returns a ratio < 4.5; alpha case `#00000080` over `#FFFFFF` equals the ratio of the composited gray.
  - Update: None
  - Verify manually: ratio shown in the panel equals the node test value for the same pair

#### 2. Suggestions panel
- User outcome: the user sees which partner colors actually read well, without their choice changing
- Why: spec §6 ("do not automatically change the user's selected color")
- Affected area: UI
- Confidence: Medium
- Implementation:
  - `src/suggestions.js`: `createSuggestions(root, { enabled, onPick })` → `{ render(activeTab, color), destroy() }`; a `<details>`-style collapsible **below the presets** (user decision), summary line carries the current ratio (`4.6:1 AA`) with a colored badge; body lists up to 3 partner swatches from the opposing preset set with their ratio; clicking a partner applies it to the *other* mode's color; hidden entirely when `showContrastSuggestions: false`.
  - Verify: `grep -n "4.5\|7\|AAA" src/suggestions.js` shows thresholds; panel collapsed by default
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: pick `#FFFFFF` on High → suggestions list only dark panels; toggling the option off removes the panel; a pair in the 3.0-4.5 band shows the `AA-large` badge next to the failing `AA` one

#### 3. Dark theme + accessibility + responsive CSS
- User outcome: usable in dark UIs, by keyboard, and on a phone
- Why: spec §11, §12, §9 (`theme: 'light' | 'dark'`)
- Affected area: CSS + a11y
- Confidence: Medium
- Implementation:
  - `color-picker.css`: `.cp-root[data-theme="dark"]` overriding `--cp-surface/--cp-ink/--cp-line/--cp-canvas`; `:focus-visible` ring on every interactive element; `@media (max-width: 680px)` bottom-sheet (fixed bottom, full width, rounded top corners, presets stacked, footer sticky) ported from `reference/modern-color-picker.html:103-121`; `@media (prefers-reduced-motion: reduce)` disabling transitions.
  - `src/color-picker.js`: arrow-key roving on `role="tablist"`, `aria-selected` sync, `aria-live="polite"` status line for apply/cancel/reset, focus trap on open and focus restore on close.
  - Verify: `grep -c "prefers-reduced-motion\|data-theme\|max-width: 680px" color-picker.css` = 3
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: full spec §14 checklist (16 items) recorded in `tasks/261108-color-picker-lib/changelog.md` with pass/fail per item; keyboard-only run of open → tabs → swatch → OK

#### 4. Demo: custom presets + second instance
- User outcome: the page demonstrates configuration, not just the default
- Why: spec §13 `index.html` requires custom-preset demonstration
- Affected area: HTML
- Confidence: Medium
- Implementation:
  - `index.html`: second `ColorPicker` instance with `presets: { highContrast: { Brand: [...] }, lowContrast: { Brand: [...] } }`, `theme: 'dark'` and a distinct `container`, proving independence and theming on one page.
  - Verify: `grep -c "new ColorPicker" index.html` = 2
- Test Impact:
  - Add: None
  - Update: None
  - Verify manually: both instances open simultaneously without style bleed

### Done Criteria
- Suggestions panel shows correct ratios and never mutates the active color by itself
- `node --test` green (color + contrast)
- Dark theme, mobile layout, keyboard path, reduced motion all verified
- Spec §14 checklist fully passed

### Risks
- Alpha colors are ambiguous against the opposing surface — covered by: Change #1 `Test Impact` (manual: compositing rule stated in README, ratio shown for the composited result).
- Two simultaneous modals can fight over focus — accepted: demo opens them one at a time; documented in README.
- Suggestion thresholds hard-coded to 4.5 could feel strict for large text — covered by: Change #2 `Test Impact` (manual: AA-large 3:1 shown as a secondary badge).

### Open Questions
- None

---

## Progress

Checklist tracks step completion. Progress table tracks timeline.

- [x] 1.1 Color core module — `src/color.js`
- [x] 1.2 Preset tables — `src/presets.js`
- [x] 1.3 Repo hygiene — `.gitignore`
- [x] 2.1 DOM template builder — `src/template.js`
- [x] 2.2 HSV editor controller — `src/editor.js`
- [x] 2.3 ColorPicker class and public API — `src/color-picker.js`
- [x] 2.4 Component stylesheet (base) — `color-picker.css`
- [x] 2.5 Demo page — `index.html`
- [x] 2.6 README — `README.md`
- [x] 2.7 Browser smoke harness — `test/smoke.html`
- [x] 3.1 Preset panel renderer — `src/presets-panel.js`
- [x] 3.2 Selection state sync — `src/color-picker.js`
- [x] 3.3 Preset styles — `color-picker.css`
- [x] 4.1 Contrast math — `src/contrast.js`
- [x] 4.2 Suggestions panel — `src/suggestions.js`
- [x] 4.3 Dark theme + accessibility + responsive CSS
- [x] 4.4 Demo: custom presets + second instance

| Date | Step | Action |
|------|------|--------|
| 2026-11-08 | — | Plan created (4 iterations, source: `sop.md` + `reference/modern-color-picker.html`) |
| 2026-11-08 | 1.1 | Iteration 1 coded: `src/color.js` (131 lines), `src/presets.js` (47), `test/color.test.js`, `.gitignore` — `node --test` 12/12 green |
| 2026-11-08 | 2.1-2.6 | Iteration 2 coded: `src/template.js` (149), `src/editor.js` (154), `src/color-picker.js` (198), `color-picker.css` (407), `index.html`, `README.md`, `test/smoke.html` — `node --test` 12/12, smoke 36/36 in headless Chrome |
| 2026-11-08 | 3.1-3.3 | Iteration 3 coded: `src/presets-panel.js` (141), `selectColor`/`refresh` in `src/color-picker.js`, preset CSS (+106 → 513), class file split into `src/options.js` (35) + `src/tablist.js` (21) to stay inside the 200-line rule — `node --test` 12/12, smoke 60/60 in headless Chrome |
| 2026-11-08 | 4.1-4.4 | Iteration 4 coded: `src/contrast.js` (77) + `test/contrast.test.js` (10 tests), `src/suggestions.js` (118), `src/focus.js` (57) + `src/bindings.js` (43) to keep `color-picker.js` at 192, CSS token refactor + dark theme + bottom sheet (+284 → 797), two-instance demo — `node --test` 22/22, smoke 85/85 in headless Chrome |
| 2026-11-08 | — | **Review pass 1** (iterations 1–4): **Fail** — 2 blocking (light-theme `--cp-subtle` measures 3.18:1, below AA; `options.presets` cannot override a named category, so the spec §9 example is silently ignored), 8 minor (no dialog role, Escape reaches other open instances, `role="slider"` without a value, live-region churn during drag, dead `--cp-radius`, short README install list — fixed in-pass, `showAlpha: false` still stores alpha, `test/smoke.html` unplanned). ADR: not suggested — both blocking items are spec-derived code fixes. Next: `dev-code` (every finding carries its own fix, no requirement changed) |
| 2026-11-08 | Review fix [5] | Review pass 1 findings applied, no plan iteration written: `--cp-subtle` `#667085` (labels 4.60–4.97:1 measured in the rendered light theme) + section emphasis moved off whole-section opacity (2.44:1 → 4.97:1), `mergePresets` replaces a named category (+ test rewritten), `role="dialog"`/`aria-modal`/`aria-labelledby`, topmost-only Escape, `aria-valuenow/min/max` on `.sv`, no live-region write on editor drags, `showAlpha: false` drops alpha, `--cp-radius` wired + `--cp-check` deleted, `test/smoke.html` given step 2.7 — `node --test` 22/22, smoke 95/95 in headless Chrome. Next: `dev-review` (pass 2) |

Current status: review pass 1 findings fixed (iteration 5); awaiting review pass 2.
