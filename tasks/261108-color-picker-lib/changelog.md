# Task Changelog

## Task Context
- ID: 261108-color-picker-lib
- Title: Build a modern, dependency-free color picker library (High Contrast / Low Contrast)
- Repository / Project: color-picker
- Purpose: the color foundation every later module (editor, picker class, contrast suggestions) builds on — one normalized representation, no drift between modules.

---

## Iteration 1 — 2026-11-08 15:13 +07
**Trigger:** user request
**Status:** Implemented
**Delivery:** Skill
**Plan reference:** Iteration 1 — color core, preset tables, repo hygiene

### Summary
Added the pure color-math module and the spec's preset palettes, both dependency-free ES modules, with the first `node --test` suite in the repo. No DOM or CSS exists yet, by design.

### Added
**[1] - Added `src/color.js`, the single place colors are parsed and converted.**
  - Purpose: every later module reads and writes `{ r, g, b, a }` (r/g/b 0-255, a 0-1) and never re-implements hex handling.
  - Details: `parseHex` accepts `#RGB|#RGBA|#RRGGBB|#RRGGBBAA` with the `#` optional and returns `null` for anything else; the reference's length-only check was tightened with a hex-character regex, because `parseInt` on `#GGGGGG` yields `NaN` rather than failing. `formatHex` emits uppercase hex and drops alpha at `a >= 0.999` (the reference's threshold, kept so existing swatches keep their 6-digit form). `rgbToHsv`/`hsvToRgb` and `rgbToHsl`/`hslToRgb` are ports of the reference at `reference/modern-color-picker.html:231-258`, plus `withAlpha` and `channelDelta` (the latter used by the round-trip tests, and left exported for the editor's later needs).
  - Details: 131 lines — inside the repo's 200-line module rule.

**[2] - Added `src/presets.js` with the palettes exactly as specified.**
  - Purpose: §4/§5 are literal product data; a transcription typo ships a wrong brand color.
  - Details: 6 categories per mode, uppercase hex, spec order — 47 lines. Where `sop.md` and the visual reference disagree, the spec won: `lowContrast.Pastel` in the reference is `#FCE7F3,#FBCFE8,#F3E8FF,#EDE9FE,#FFE4E6,#FCE7F3`, while `sop.md` §5 lists the duplicate `#FCE7F3` at position 5. The spec order is what shipped.
  - Details: `mergePresets(defaults, override)` returns a new object and only *adds* categories — a custom name that collides with a shipped one is ignored, so user config cannot silently replace a default palette. This is the plan's wording taken literally; if per-category overriding is ever wanted it is a deliberate change, not an accident.

**[3] - Added `test/color.test.js` (12 tests, `node --test`, no dependencies).**
  - Purpose: the color math is the one part of the library a manual checklist cannot verify, so it is the part with automated coverage.
  - Details: hex round-trips for `#abc`, `#abcd`, `#0F766E`, `#0F766E80`; rejected malformed input (`#12`, `nope`, `#GGGGGG`, empty, wrong lengths, non-strings); HSV and HSL round-trips over 12 sampled colors within 1/255; achromatic and hue-wrap edge cases; preset shape (`/^#[0-9A-F]{6}$/`, 6 categories per mode), every palette compared value-for-value against `sop.md`, and the additive `mergePresets` contract.

**[4] - Added `.gitignore` for `**/.local/*`, `.DS_Store`, `node_modules/`.**
  - Purpose: the flow bookmark `.local/work.md` is rewritten by every skill run; without the ignore it shows up as a dirty file in every round.

### Changed
**[1] - Changed the reference's parse check from length-only to length + hex-character validation.**
  - Reason: `hexToRgba('#GGGGGG')` in `reference/modern-color-picker.html:231-237` returns an object of `NaN` channels, so an invalid paste would blank the editor instead of being rejected. Spec §7 requires invalid input to be rejected without disturbing the current color.
  - Impact: `parseHex` returning `null` is now the contract the HEX field and `getColors()` rely on.

### Deferred
- Nothing from this iteration. `Options`, editor, template, picker class, CSS and demo remain in iterations 2-4 as planned.

---

## Iteration 2 — 2026-11-08 15:20 +07
**Trigger:** user request
**Status:** Implemented
**Delivery:** Skill
**Plan reference:** Iteration 2 — component shell, shared editor, public API

### Summary
The picker is now a working component: a modal shell built node-by-node in `src/template.js`, an HSV editor controller, the `ColorPicker` class with the full public API and events, base component CSS, a demo page and a real README. Preset sections are constructed but hidden until iteration 3 fills them.

### Added
**[1] - Added `src/template.js` — the modal markup (149 lines).**
  - Purpose: markup lives in one place, built with `document.createElement` so no user-supplied string ever reaches `innerHTML`, and no element id is used so two instances can coexist.
  - Details: `.picker` → header (`.heading`, `.app-icon`, `.close-btn`), `.tabs` tablist with two `role="tab"` buttons carrying `data-tab`, `.editor` (`.sv` with `role="slider"` + `.sv-thumb`, `.hex-row` with `.color-preview` + `.hex-input`, hue and alpha `.range-block`s), `.divider`, `.presets` (two sections with `.category-row` / `.swatches` left empty), `.status[aria-live="polite"]`, footer (Reset / Cancel / OK). Class names mirror `reference/modern-color-picker.html:141-196`; every visible string comes from `labels` so a caller can localize.
  - Details: a single `el(tag, cls, text)` factory replaces 40-odd repeated `createElement`/`className` pairs — see **Changed**.

**[2] - Added `src/editor.js` — one color driven by four controls (154 lines).**
  - Purpose: the only stateful UI piece; isolating it keeps the class readable and the HSV state out of the picker's color record.
  - Details: `createEditor(refs, { showAlpha, onChange, onStatus })` → `{ setColor, getColor, destroy }`. SV drag is a port of `reference/modern-color-picker.html:333-346` (`pointerdown` + `setPointerCapture` + `pointermove`), thumb at `left = s%`, `top = (1-v)%`; hue 0–360 and alpha 0–100 update live; alpha track is redrawn as `linear-gradient(transparent → opaque)` over a checkerboard on every render. HEX commits on `change` and on `Enter` (which blurs the field); invalid input reverts the field, keeps the color, and reports through `onStatus`. Arrow keys on the SV area move s/v by 1 (10 with Shift) so the `role="slider"` is not a lie.
  - Details: HSV state is preserved when the incoming color is achromatic — a gray keeps the previous hue instead of snapping to 0, which is what makes round-tripping through `#FFFFFF` harmless.

**[3] - Added `src/color-picker.js` — the class and its public surface (198 lines).**
  - Purpose: the deliverable is the API; spec §8 fixes its shape.
  - Details: `open()/close()/destroy()/getColors()/setColors()/setActiveTab()` plus `onChange/onApply/onCancel/onOpen/onClose`, all callbacks receiving a copy. Per-instance `colors`, `snapshot`, `activeTab`; no module-level mutable state. `open()` snapshots, `Cancel`/`Escape` restore the snapshot, `Reset` restores `initialColors` and stays open, `OK` commits and closes. Roving tablist: clicking or ArrowLeft/ArrowRight switches tabs, which also re-points the editor at that tab's remembered color.
  - Details: `setColors()` normalizes through `parseHex`/`formatHex` and only emits when a value actually changed, so a consumer calling it inside `onChange` cannot loop.

**[4] - Added `color-picker.css` — the base component stylesheet (407 lines).**
  - Purpose: design is the primary quality bar; the tokens have to be overridable from the host page.
  - Details: everything scoped under `.cp-root`, 15 `--cp-*` tokens (33 uses) instead of the reference's `:root` variables, so the host page keeps its own. Centered modal overlay, header, tab strip with active state, editor grid, SV square, hex field, hue gradient, alpha checkerboard, footer, `:focus-visible` ring and a `prefers-reduced-motion` block. Uppercase hex and spacing follow `reference/modern-color-picker.html:8-121`.

**[5] - Added `index.html` — the demo page.**
  - Purpose: proves both usages and is the manual harness for the 16-item checklist.
  - Details: text chip (High Contrast) and panel (Low Contrast) previews that repaint live from `onChange`, a "Choose colors" button that calls `open()`, and `onCancel` repainting from the restored state.

**[6] - Replaced the 28-byte `README.md` stub with real documentation.**
  - Details: install (copy `src/` + `color-picker.css`, no build), the `python3.12 -m http.server` requirement for ESM, basic usage, an options table, an API table, callbacks, custom presets, `--cp-*` theming, and the two test commands.

**[7] - Added `test/smoke.html` — a browser harness for the component.**
  - Purpose: the plan's manual checklist is not repeatable; this runs the same behaviours as assertions and prints PASS/FAIL per line.
  - Details: 36 checks over open/close, tab switching and per-tab memory, HEX normalize/reject, alpha hex, SV drag, hue and alpha sliders, Reset/Cancel/OK semantics, Escape, copy-on-read, no-op `setColors`, two-instance isolation, roving tabs and `destroy()`.

### Changed
**[1] - Replaced 40 repeated `createElement`/`className` pairs with one `el()` factory in `src/template.js`.**
  - Reason: written directly the file reached 222 lines, past the repo's 200-line rule (`~/.devflow/AGENTS.md:7`). The plan's `Verify` line expected `grep -c createElement` > 20; with the factory it is 1. The 200-line rule is the hard constraint and the intent of the heuristic — "built with `createElement`, not `innerHTML`" — still holds (`grep -c innerHTML src/template.js` → 0).
  - Impact: same DOM, 149 lines; the tab and range builders also collapse the duplicated hue/alpha markup.

**[2] - Hid the empty `.presets` block for this iteration.**
  - Reason: the sections are built now but have no swatches until iteration 3; visible, they rendered as a raw "AaText Color Presets" band with an empty divider — a broken-looking gap rather than a deferred feature.
  - Impact: `presets.hidden = true` in `src/template.js` with a one-line comment; iteration 3 sets it back once swatches exist. Base CSS also gained `.presets[hidden]` so the grid rule cannot win against the attribute.

**[3] - Guarded `setPointerCapture` in the editor.**
  - Reason: synthetic `PointerEvent`s (and any pointer id the browser does not consider active) throw `NotFoundError`, which aborted the drag handler in the smoke test — and would abort it on a stray event in a real page too.
  - Impact: capture failure is now ignored; the drag still tracks via `pointermove` while `dragging` is true.

### Verification
- `node --test` → 12/12 pass (unchanged colour math suite).
- `test/smoke.html` in headless Chrome (`--headless=new --dump-dom`) → 36/36 PASS, document title `PASS`.
- Desktop screenshot at 1280×900: modal centered, tabs/editor/sliders/footer laid out as the reference; no empty preset band.
- `wc -l src/*.js` → 47–198, every module inside the 200-line rule; `grep -rn "from '" src/ | grep -v "\./"` → nothing (no external dependency); `grep -n "innerHTML\|window\." src/*.js` → nothing.

### Deferred
- Preset swatches, category rows and per-tab category memory — iteration 3 (3.1-3.3). The template already returns the empty containers and the sections are hidden until then.
- Contrast suggestions — iteration 4 (4.1-4.2).
- Dark theme, responsive bottom-sheet and the full a11y pass — iteration 4 (4.3). At 390 px the two-column editor grid overflows the modal horizontally today (it scrolls inside `.picker`); the single-column mobile rule is 4.3's work, not a regression to chase now.
- Custom-preset instance on the demo page — iteration 4 (4.4).

---

## Iteration 3 — 2026-11-08 15:28 +07
**Trigger:** user request
**Status:** Implemented
**Delivery:** Skill
**Plan reference:** Iteration 3 — preset panel, selection sync, preset styles

### Summary
Both preset sections now render: category pills over a 7-column swatch grid per mode, the current color marked with an accent outline and a luminance-picked `✓`, and one `selectColor()` writer that keeps editor, HEX field, preview, checkmark and per-tab memory in step. The hidden `.presets` band from iteration 2 is gone.

### Added
**[1] - Added `src/presets-panel.js` — the panel renderer (141 lines).**
  - Purpose: the two preset sections are pure presentation over `presets.js`; keeping them out of the class is what keeps both files readable.
  - Details: `createPresetPanel({ refs, presets, onSelect })` → `{ render(activeTab, colors), destroy() }`. Pills come from `Object.keys(presets[tab])`, active pill `is-active` + `aria-pressed` (`reference/modern-color-picker.html:88-89`); swatches are `button.cp-swatch` with `title`, `aria-label` (`"<category> #HEX"`) and `data-hex`; `is-selected` carries the outline and the `✓`, whose ink is `#172033` on light swatches and `#FFFFFF` on dark ones via the reference's luma test (`:301`).
  - Details: the grid is rebuilt only when the tab's category list or active category changes — a color change just repaints `is-selected`/`--cp-check-color`. The plan allowed a full re-render per frame "if it stutters"; repainting is the same amount of code and does not stutter at all.
  - Details: duplicate hex inside one category (spec §4 `#0F766E` in Cool and Green) marks both swatches, which is the accepted risk in the plan — same color, truthful marks.

**[2] - Added `selectColor(hex, { source, tab })` to `src/color-picker.js` — the single writer to `colors`.** 
  - Purpose: spec §7 and quality item #4 require swatch, HEX, preview and tab memory to never disagree; one write path makes that structural instead of four kept in sync by hand.
  - Details: normalizes first (invalid input is a no-op), switches `activeTab` when the swatch belongs to the idle tab (reference `:303`), pushes the editor unless the editor is the source (no HSV re-entry mid-drag), re-renders the panel, and emits `onChange` only when the value actually changed — so a drag frame that lands on the same hex stays silent, exactly as before.
  - Details: `refresh()` (editor + panel from `this.colors`) is now the only way `open`/`cancel`/`reset`/`setColors`/`setActiveTab` repaint, so Cancel and Reset restore the right checkmarks with no extra code.

**[3] - Added the preset styles to `color-picker.css` (+106 lines, now 513).**
  - Details: `.preset-section` + `.is-emphasis` (inactive at `opacity: .62`, per spec §3.D), divider between the two sections, `.cp-category` pill with active state, `.swatches` 7-column grid, `.cp-swatch` `aspect-ratio: 1` / `border-radius: 9px` / hover lift, `.is-selected` `outline: 2px` + `offset: 2px` with the `✓` in `::after` coloured by `--cp-check-color`. No decorative shadow or gradient, per spec §10; the existing `prefers-reduced-motion` block already covers the two new transitions.

**[4] - Added 24 preset checks to `test/smoke.html` (36 → 60).**
  - Details: section count and visibility, pill count against the preset object, swatch count against the first category (7 for High, 6 for Low), `is-emphasis` on the active section only, exactly one mark per section, `data-hex`/`aria-pressed`/`--cp-check-color` on the mark, swatch click writing color + HEX field + one `onChange`, pill click swapping the grid without touching the color, a color outside the shown category marking nothing, cross-tab click switching tabs and leaving the other color alone, per-tab memory restored on return, and Reset restoring both checkmarks.

### Changed
**[1] - `src/template.js` no longer hides `.presets`, and each section carries `data-mode="high|low"`.**
  - Reason: iteration 2 hid the empty band; with swatches in place it renders as designed. `data-mode` replaces positional `nth-child` lookups for the panel and the smoke harness.
  - Impact: 149 → 148 lines; `.presets[hidden]` CSS is kept, and the panel hides a section itself when a mode has no categories.

**[2] - Split `src/color-picker.js` (235 lines) into `src/options.js` + `src/tablist.js`.**
  - Reason: the repo rule is a hard 200-line limit per code file (`~/.devflow/AGENTS.md:7`); `selectColor`/`refresh` pushed the class file to 235. Trimming comments would not have been an honest fix.
  - Impact: `options.js` (35 lines) owns `TABS`, `DEFAULTS` and `resolveColors`; `tablist.js` (21 lines) owns `syncTabs(refs, activeTab)` and `tabAfterKey(event, activeTab, tabs)`. `color-picker.js` is 197 lines, public API and behaviour unchanged. A missing `normalizeHex` import from that split was caught by the smoke harness (21 FAILs) and fixed before the run was called green.

### Verification
- `node --test` → 12/12 pass.
- `test/smoke.html` in headless Chrome (`--headless=new --dump-dom`) → 60/60 PASS, document title `PASS`.
- Screenshot at 1280×950 with the modal open: both sections rendered, 6 pills each, 7- and 6-swatch grids, selected swatch outlined with a legible `✓` on both surfaces, inactive section dimmed but readable, no clipping.
- Plan's verify lines: `wc -l src/presets-panel.js` → 141 (≤ 200); `grep -n selectColor src/color-picker.js src/presets-panel.js` → 3 hits; `grep -c "cp-swatch\|cp-category" color-picker.css` → 6 (≥ 4); `wc -l src/*.js` → 21–197, every module inside the 200-line rule.

### Deferred
- Nothing from this iteration.
- Contrast suggestions — iteration 4 (4.1-4.2); dark theme, mobile bottom-sheet and the remaining a11y pass — iteration 4 (4.3); custom-preset demo instance — iteration 4 (4.4).
