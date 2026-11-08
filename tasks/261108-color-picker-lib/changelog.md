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
