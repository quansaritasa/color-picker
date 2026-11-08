# Task Review

## Task Context
- ID: 261108-color-picker-lib
- Title: Build a modern, dependency-free color picker library (High Contrast / Low Contrast)
- Repository / Project: color-picker (branch `main`)
- Review objective: grade the whole delivered library against `sop.md`, the visual reference, and every plan iteration — one pass over iterations 1–4, since review runs once at the end of the code phase.

## Stable Review Criteria
- Fit criteria:
  - Meets task requirements and acceptance criteria.
  - Matches the intent and scope of every plan iteration this pass covers.
  - Respects constraints and do-not-modify boundaries.
  - Verdict per item: `Pass` | `Partial` | `Fail` | `Cannot verify`. `Cannot verify` means this change set cannot show the item either way — it lives in untouched code, spans tasks, or needs an environment the pass has not got. Record what would settle it. An unverified criterion never reaches an overall `Pass`.
- Quality criteria:
  - Correctness, maintainability, test adequacy, safety, and consistency with repository patterns.
- Severity model:
  - `[blocking]` = broken requirement, serious regression risk, security flaw, crash/data-loss risk, or critical invariant violation.
  - `[minor]` = non-blocking maintainability, consistency, readability, or verification issue.
  - Every fit outcome short of `Pass` carries a level so escalation has a floor: `Fail` → Critical, `Partial` → High, `Cannot verify` → Low. It is recorded in the Quality Check like any other finding.
  - Record the `review-code` level alongside the gate — `[blocking] Critical`, `[minor] Medium`. The gate decides the verdict; the level is what the next pass escalates from.
  - A rationale never downgrades a level. "Deliberate", "YAGNI", "matches the existing pattern" — from the plan, the changelog, or the session — is the author grading their own work.
  - Escalation: a finding carried unresolved from a prior pass rises one level on the `review-code` scale — Low → Medium → High → Critical — crossing into `[blocking]` at High. A `[minor]` carried twice is `[blocking]` at the latest; a Medium carried once already is.
  - `Should hold:` names the rule a `[blocking]` finding breaks, as the rule — not the code path that broke it. The same rule blocking **planned work** in 2+ passes means the premise is the defect: verdict `Fail`, and the recommendation is to settle the contract, not to fix a third code path. A second instance that arrived as `new request` counts once, at its own level — not as a second break of the rule.

## Notes for Future Iterations
- Keep the sections above stable across the task lifetime.
- Append new review passes below. Do not delete prior passes: a pass older than the previous one keeps its heading and its `**Iteration:**` / `**Trigger:**` / `**Verdict:**` lines here, and its body moves to `review-archive.md` — step 8 of the skill. `review.md` is read whole on every review round, so two full passes are the budget.
- One pass covers every iteration since the previous pass: the flow only reaches review when no planned iteration is left to code, so a pass normally grades a batch, not one iteration.
- The first review pass usually follows the Jira-driven first iteration; later passes may review work triggered by PR comments, reviewer findings, or direct user instructions.

---

## Review Pass [1] — 2026-11-08 15:45 +07
**Iteration:** 1–4
**Trigger:** planned review
**Verdict:** Fail

### Fit Check
**Acceptance Criteria Review**

1. Two tabs switch modes and each keeps its own color — **Pass** — `src/color-picker.js:92-118`, `src/tablist.js:6-13`; smoke checks "tab switch sets activeTab", "other tab keeps its color", "returning to the tab restores its color/checkmark" all PASS.
2. Selecting a preset swatch updates editor, HEX field, and selection state — **Pass** — `src/presets-panel.js:62-99`; smoke "swatch click updates the hex field" and "swatch click moves the checkmark" PASS.
3. Drag in the SV area updates color continuously with pointer + touch — **Pass** — `src/editor.js:63-86` (`pointerdown` + `setPointerCapture` + `pointermove` + `pointercancel`); smoke drives a real `PointerEvent` sequence and sees the color change. Pointer events cover touch without a separate `touchmove` path.
4. Hue and alpha sliders update gradient, preview and HEX live — **Pass** — `src/editor.js:22-40,101-108`; smoke checks both `input` handlers change the color and that alpha yields an 8-digit hex.
5. HEX accepts `#RGB`/`#RGBA`/`#RRGGBB`/`#RRGGBBAA`, normalizes, rejects invalid without overwriting — **Pass** — `src/color.js:16-28`; 5 unit tests (valid forms, `[3,4,6,8]` length, `#GGGGGG`), plus smoke "invalid hex keeps the color / reverts the field / shows a status message".
6. `getColors()` returns a normalized-hex copy, alpha only when `a < 1` — **Pass** — `src/color-picker.js:120-122`, `src/color.js:31-34`; test "formatHex omits alpha at or above 0.999"; smoke "getColors returns a copy".
7. Reset / Cancel / OK per spec §7 — **Pass** — `src/color-picker.js:159-180`; smoke 11-14: Reset restores `initialColors` and stays open, Cancel restores the open snapshot and closes, OK fires `onApply` and closes, Escape cancels.
8. Multiple instances work independently — **Pass** — no module-level mutable state (`src/color-picker.js:16-60`); smoke "second instance isolated" + "two roots mounted"; probe confirmed each instance keeps its own colors and panels. The one cross-instance defect that survives (Escape reaching another open instance) is graded separately as Quality Check #4 because colour state itself stays independent.
9. Public API `open/close/destroy/getColors/setColors/setActiveTab` + 5 callbacks — **Pass** — `src/color-picker.js:112-190`; every name in the README API/callback tables exists and behaves as documented (smoke exercises all five callbacks).
10. Contrast ratio math is WCAG-correct — **Pass** — `src/contrast.js:13-56`, 10 tests in `test/contrast.test.js`. Independently recomputed this pass: `#0F766E` on `#CCFBF1` = 4.8573 (test pins 4.857), black/white = 21, mid-grey luminance 0.2158 — the sRGB linearization is right, not the gamma-shortcut.
11. Preset data matches spec §4/§5 exactly and is overridable via `options.presets` — **Partial** — data verified line-by-line against `sop.md:127-240` (all 12 categories, order and case exact). Overriding does not work: `mergePresets` (`src/presets.js:31-42`) skips any name that already exists, so the configuration `sop.md:421-431` itself demonstrates (`highContrast: { Cool: ['#111827', '#1F2937'] }`) is silently discarded. Probe result: `Cool` unchanged, only the new `Brand` category landed.
12. Light + dark theme via CSS variables; responsive desktop/tablet/mobile bottom sheet — **Pass** — token blocks `color-picker.css:8-74` (dark = token swap only, no duplicated rules); `@media (max-width: 680px)` at `:703`. Verified at 1280/1024 (centred modal, both sections side by side) and 500 (full-width bottom sheet, stacked sections, sticky footer) by screenshot and by measuring rendered boxes.
13. Accessible: roving tablist, `aria-selected`, `aria-live` status, Escape/Enter, focus-visible, reduced motion — **Pass** — `src/tablist.js` (roving `tabIndex` + Arrow/Home/End in `src/bindings.js:23-31`), `src/template.js:58-70`, `color-picker.css:680-700`. The ARIA gaps this criterion does not name (dialog semantics, slider value attributes, live-region churn) are graded as Quality Check #3, #5 and #6.
14. Demo page: both tabs, text usage, panel usage, live preview, custom-preset instance — **Pass** — `index.html:65-91` (two preview cards), `:111-155` (two instances, the second with `theme: 'dark'` and `Brand` presets).
15. No external dependency, no build step — **Pass** — `grep -rn "from '" src/*.js | grep -v "\./"` → 0 hits; no `package.json`; ES modules served over HTTP.

**Plan Coverage Review**

1. 1.1 Color core module — **Pass** — `src/color.js` (131 lines), full listed surface, 8 unit tests.
2. 1.2 Preset tables — **Pass** — `src/presets.js` (47 lines) verbatim from spec; the "user categories replace nothing, they are added" implementation is what AC 11 marks `Partial` above.
3. 1.3 Repo hygiene — **Pass** — `.gitignore:1-3`; `git status` stays clean across every skill run.
4. 2.1 DOM template builder — **Pass** — `src/template.js` (152 lines), `createElement` throughout, no `innerHTML`.
5. 2.2 HSV editor controller — **Pass** — `src/editor.js` (154 lines), HSV state held in the editor so a grey never steals a hue (`:49-61`).
6. 2.3 ColorPicker class and public API — **Pass** — `src/color-picker.js` (193 lines ≤ 200), per-instance state, snapshot/cancel/apply semantics.
7. 2.4 Component stylesheet (base) — **Pass** — tokens from the reference under `.cp-root`, `--cp-*` names, focus-visible and reduced-motion from this iteration.
8. 2.5 Demo page — **Pass** — `index.html`; live preview off `onChange`, restored on cancel.
9. 2.6 README — **Pass (after a mechanical fix this pass, see Quality Check #8)** — every option/method/callback documented; the install list was four modules short and is now complete.
10. 3.1 Preset panel renderer — **Pass** — `src/presets-panel.js` (141); pills, 7-column grid, luminance-picked check colour, both sections mounted.
11. 3.2 Selection state sync — **Pass** — `selectColor` is the single writer (`src/color-picker.js:92-110`); swatch click on the idle tab activates that tab first.
12. 3.3 Preset styles — **Pass** — `.cp-category`/`.cp-swatch` at `color-picker.css:419-468`; selected swatch uses outline + `✓`, not colour alone.
13. 4.1 Contrast math — **Pass** — `src/contrast.js` (77), `test/contrast.test.js` (10 tests).
14. 4.2 Suggestions panel — **Pass** — `src/suggestions.js` (118), collapsed `<details>` below the presets, partners from the opposing palette, never writes the active tab.
15. 4.3 Dark theme + a11y + responsive CSS — **Pass with findings** — the three surfaces render as claimed (screenshots inspected this pass); Quality Check #1, #3, #5, #6 and #7 are the accessibility debt inside it.
16. 4.4 Demo: custom presets + second instance — **Pass** — `grep -c "new ColorPicker" index.html` → 2; second instance mounts in `#brandRoot` with `theme: 'dark'`.

**Scope Review**
- Unexpected files changed:
  - `sop.md`, `reference/modern-color-picker.html` — `planned` — the spec and visual reference are the task inputs named in `plan.md:6`; committed by the planner before iteration 1.
  - `test/smoke.html` — `drift` (no plan iteration names it, no user message asks for it) — logged in `changelog.md:84` as iteration 2 [7], referenced by `README.md:172`, and it is the only automated cover for every DOM behaviour. Justified and low risk; recorded as Quality Check #10 rather than failed.
- Scope drift: the 16-file plan became 12 modules (iteration 3/4 splits under the 200-line rule) plus the smoke harness; both are documented deviations, none of them widen the feature set.
- Constraints / do-not-modify respected: Yes. Every `src/*.js` ≤ 200 lines (max 193); `color-picker.css` stays a single file; presets panel and suggestions sit where the plan put them; `node --test` covers colour/contrast math only, UI by the smoke harness.

**Fit Issues**
1. AC 11 `Partial` — `options.presets` cannot override a shipped category, so the configuration the spec example shows has no effect (Quality Check #2).
2. Spec §12's "sufficient text contrast" does not hold for the light theme's secondary text — measured 3.18:1 (Quality Check #1).

### Quality Check
1. **[blocking] High** [Accessibility / Theme] — `color-picker.css:15` (`--cp-subtle`), used at `:140, :210, :475, :565, :608, :633, :648`
   - Should hold: every text label the component renders clears WCAG AA — 4.5:1 at the sizes it uses — against the surface it sits on.
   - Details: `--cp-subtle: #8791A3` measures 3.18:1 on `--cp-surface` (`#FFFFFF`) and 2.96:1 on `--cp-surface-alt` (`#F5F7FA`), computed this pass with the WCAG formula (not by eye). It colours `.section-hint` (10px), `.status` (11px), `.tab small` (12px), `.cp-sugg-hint`/`.cp-partner-ratio` (11px) and `.reset-btn` (13px/600) — all "normal text" by WCAG's 18.66px-bold threshold, so the floor is 4.5:1. `sop.md:510` requires "Sufficient text contrast"; the dark theme's equivalent token passes at 5.53:1, so this is the light theme only and it is the light theme that ships by default.
   - Suggested fix: set `--cp-subtle: #6B7280` (4.83:1 on surface, 4.50:1 on surface-alt, 4.55:1 on pill-bg) — or collapse it onto `--cp-muted: #667085` (4.97/4.64/4.68) if two greys are more than the design needs — and re-check `.reset-btn`, the only interactive label among them.
2. **[blocking] High** [Correctness / Fit] — `src/presets.js:36-38`
   - Should hold: `options.presets` replaces the palettes it names and adds the ones it does not, which is what `sop.md:421-431` demonstrates.
   - Details: `if (!(name in merged)) merged[name] = [...extra[name]];` silently drops every override of a shipped category. Probe this pass: `new ColorPicker({ presets: { highContrast: { Cool: ['#123456'], Brand: ['#654321'] } } })` → `Cool` still the 7 shipped hexes, `Brand` added. `README.md:63,106` documents the behaviour as additive, so it is at least honest, but a consumer following the spec's own example gets no effect and no warning — the class of defect that costs a debugging hour.
   - Suggested fix: assign unconditionally (`merged[name] = [...extra[name]]`) so a named category is replaced and a new one added; update `test/color.test.js:122-133` to pin replacement instead of the default surviving; adjust `README.md:63` and `:106`.
3. **[minor] Medium** [Accessibility / Design] — `src/template.js:128-129`
   - Details: the modal shell is a plain `div.picker` with no `role="dialog"`, no `aria-modal="true"` and no accessible name; the `<h2>Choose Color` at `:53` is not referenced by anything. `open()` moves focus inside (`src/color-picker.js:146-147`), but assistive tech is never told a dialog opened, so the focus jump reads as context loss.
   - Suggested fix: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at an `id` on the `<h2>`.
4. **[minor] Medium** [Correctness / State] — `src/bindings.js:38-41`
   - Details: every instance registers its own document `keydown`, and each handler cancels *its* picker on Escape without asking whether it is the one on top. Probe: two pickers open, one `Escape` → both `isOpen === false`, and the hidden one silently lost its edits (Cancel restores its open snapshot). The plan accepted "two simultaneous modals can fight over focus" (`plan.md:384`), but this is not a focus fight — it discards state in an instance the user is not looking at, while `README.md:162-163` promises instances are independent.
   - Suggested fix: cancel only when no other `.cp-root` is both open and later in DOM order than this one (a 3-line guard in the Escape handler), or keep an open-instance stack in a small module.
5. **[minor] Medium** [Accessibility] — `src/template.js:70`, `src/editor.js:39`
   - Details: `.sv` carries `role="slider"` with `aria-label` and `aria-valuetext` but no `aria-valuenow`/`aria-valuemin`/`aria-valuemax`. A `slider` without a value is invalid ARIA: screen readers announce the name and stop, and the arrow-key handler (`src/editor.js:87-100`) changes two dimensions that AT cannot read.
   - Suggested fix: add `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow` (saturation, updated in `render()`) and keep the hex in `aria-valuetext`; state the arrow/SV mapping in `aria-description` or the label.
6. **[minor] Medium** [Accessibility / Behaviour] — `src/color-picker.js:103`
   - Details: `selectColor` writes the new hex into the `aria-live="polite"` status region on every editor update (`source === 'editor'`), and the editor emits one per `pointermove` (`src/editor.js:42-46,63-83`). During a drag that is dozens of polite announcements queued per second — unusable with a screen reader, and it also floods the visible status line with the user's own colour.
   - Suggested fix: keep the live region for commit-level messages only — skip `setStatus` on `source === 'editor'`, or debounce it to `pointerup`/`change`.
7. **[minor] Medium** [Docs / Dead code] — `color-picker.css:29-30`, `README.md:154`
   - Details: `--cp-radius` is defined and never read (`.picker` hardcodes `border-radius: 22px` at `:98`), yet the README's theming example advertises `--cp-radius: 14px` as a knob — a consumer sets it and nothing moves. `--cp-check` (`:29`) is likewise defined and never used; the checkmark reads the JS-set `--cp-check-color`.
   - Suggested fix: make `.picker` read `var(--cp-radius)`, and delete `--cp-check` (or wire it into `.cp-swatch::after` as the fallback).
8. **[minor] Medium** [Docs] — `README.md:12-23` — **fixed in this pass**
   - Details: the install list named 8 of the 12 modules; `contrast.js`, `suggestions.js`, `focus.js` and `bindings.js` were missing, so a copy-paste install would fail at the first import (`color-picker.js:11-12`). Stale since iteration 4 added them.
   - Suggested fix (applied): added the four modules to the list. Re-ran `for f in $(sed -n '/^```text$/,/^```$/p' README.md | grep -E '^src/|^color-picker.css'); do [ -f "$f" ] || echo MISSING $f; done` → no output, and `comm -3` between `ls src/*.js` and the listed set → no diff (12 listed, 12 present). No test covers a README, so no suite re-run was needed; `node --test` and the smoke harness were re-run afterwards for the record (22/22, 85/85).
9. **[minor] Low** [Behaviour / Consistency] — `src/editor.js:49-61`, `src/color-picker.js:71-73`
   - Details: with `showAlpha: false` the opacity slider is hidden (`src/template.js:94`) but the HEX field still accepts 8-digit input and the alpha reaches `getColors()` — probe: `#FF000080` stored while the alpha control is invisible. The user can end up with a translucent colour and no control to change it.
   - Suggested fix: when `showAlpha` is false, normalize through 6 digits (drop alpha in `commit`/`setColor`), so the option means "alpha off" rather than "alpha UI hidden".
10. **[minor] Low** [Scope / Process] — `test/smoke.html`
   - Details: the harness is not named in any plan iteration — it entered as drift in iteration 2 and grew to 85 checks by iteration 4. It is logged (`changelog.md:84`) and it is the only automated cover for the DOM surface, so it should have a plan home.
   - Suggested fix: add it to iteration 2's in-scope list and to `Progress` step 2.6 the next time `plan.md` is opened for a new iteration.

### Test & Verification Review
- Reviewer checks run:
  - `node --test` → 22/22 pass (12 colour + 10 contrast).
  - `test/smoke.html` over `python3.12 -m http.server 8123` in `--headless=new --dump-dom` → 85 results, 0 `FAIL`, document title `PASS`.
  - Independent recomputation of the contrast maths in this pass (WCAG formula, not the project's module): `#0F766E`/`#CCFBF1` = 4.8573, `#000`/`#FFF` = 21.0, `#7A7A7A`/`#FFF` = 4.292 — matches the numbers the panel and the tests report.
  - Rendered measurements at 1280, 1024 and 500 px: `.picker` 940/100/500 with no horizontal overflow, 7-column swatch grid ≈53px, mobile media query active and stacked.
  - Screenshots inspected: dark theme at 1280 (tokens swap cleanly, presets readable, badges tinted), mobile bottom sheet at 500 (footer pinned, one preset column), selected-swatch ring and `✓` legible on both a near-black and a pale swatch.
  - Behaviour probe for the findings above: dialog role, two-instance Escape, preset override, category memory across a tab round-trip, `showAlpha: false` + 8-digit hex.
  - Colour-token contrast audit of both themes (9 pairs light, 7 dark) with the WCAG formula.
- Coverage assessment: adequate for behaviour — every spec §14 item maps to a smoke check, and the maths has its own suite. Gaps: no automated check for ARIA semantics (dialog role, slider value attrs), no test for two simultaneous instances, and the SV area's arrow-key path is never exercised.
- Verification gaps or regression risk: the light-theme token change (#1) is visual only and needs a screenshot re-check, not a test; the preset override change (#2) needs its unit test rewritten, which is the natural place to pin the new semantic.

### Changelog Review
- Matches implementation: Yes. Iterations 1-4 describe what is on disk — line counts (131/47/154/152/193/141/77/118/57/43), the CSS growth to 797, the file splits under the 200-line rule, the two-instance demo, and the measurement corrections (`4.857` not `4.4-4.6`; `grep -c` → 7 not 3) are all accurate when re-run.
- Missing or misleading entries: None. `test/smoke.html` is entered under iteration 2 [7] even though the plan never named it, which is the right place for it.

### Record Check
- `None` — every figure re-checked this pass (`wc -l` on all 12 modules → 21-193; `grep -rn "from '" src/*.js | grep -v "\./"` → 0; `grep -c "new ColorPicker" index.html` → 2; `grep -c "prefers-reduced-motion\|data-theme\|max-width: 680px" color-picker.css` → 7; `node --test` 22; smoke 85) matches what `changelog.md` and `plan.md`'s Progress table record.

### Previous Issues Status
- `Not applicable` — first review pass for this task.

### ADR Suggestion
- Suggested: No
- Reason: no decision with a lasting contract is in play — both blocking findings are a token value and a merge semantic that the spec already fixes, so they are code work, not a decision record.

### Declined to Judge
- Modal corner radius 22px (`color-picker.css:98`) vs spec §10's "16–20px", and swatches ≈53px vs "44–52px" — `reference/modern-color-picker.html:44,91` is the authoritative source for design tokens (`plan.md:6`) and carries 22px/9px itself; §10 states ranges "approximately". Recorded as a deliberate reference-port, not judged.
- "Reset selected categories if configured" (`sop.md:311`) — the qualifier makes it opt-in and no configuration enables it in this deliverable; outside this change set.
- Two modals fighting over *focus* (`plan.md:384`, accepted risk) — the focus half stays accepted; only the Escape half is judged, as Quality Check #4, because it destroys state rather than confusing focus.

### Final Recommendation
- Reject — with two targeted fixes, not a re-plan.
- Required next steps: fix Quality Check #1 (light-theme `--cp-subtle` below AA) and #2 (`options.presets` must override a named category, per spec §9) — both carry their own fix; then clear the Medium findings #3-#7 and the Low #9 while the files are open. #8 is already applied this pass. Every finding names its own fix and none reopens a requirement, so the next round is `dev-code`, not a new plan iteration.

---

## Review Pass [2] — 2026-11-08 15:56 +07
**Iteration:** 1–5
**Trigger:** review follow-up
**Verdict:** Fail

Graded on the delta: `git diff --name-only 4dca8f9..HEAD` → `README.md`, `color-picker.css`, `src/{bindings,color-picker,editor,presets,template}.js`, `test/color.test.js`, `test/smoke.html`, plus the task folder. Every criterion and planned item whose files are absent from that list carries pass 1's verdict forward as `Pass (unchanged since pass 1)`.

### Fit Check
**Acceptance Criteria Review**

1. Two tabs switch modes and each keeps its own color — **Pass** — `src/color-picker.js` changed only in the `selectColor` status write; the tab path is untouched and the re-run smoke's "tab switch sets activeTab", "other tab keeps its color" and "returning to the tab restores its color/checkmark" still PASS.
2. Preset swatch click updates editor, HEX field and selection — **Pass** — `presets-panel.js` unchanged, `selectColor`'s `source: 'preset'` branch unchanged (still `refresh()` + status); smoke "swatch click updates the hex field"/"moves the checkmark" PASS.
3. SV drag updates color with pointer + touch — **Pass** — `src/editor.js` changed only in `rgbaFromHsv`'s alpha clamp and `render()`'s aria writes; the pointerdown/capture/move path is byte-identical and the smoke's real `PointerEvent` sequence PASSES.
4. Hue and alpha sliders update gradient, preview, HEX live — **Pass** — same file, same `apply()` path; smoke's hue/alpha `input` checks and the 8-digit alpha hex check PASS.
5. HEX accepts `#RGB`/`#RGBA`/`#RRGGBB`/`#RRGGBBAA`, normalizes, rejects invalid — **Pass (unchanged since pass 1)** — `src/color.js` absent from the delta; the smoke's invalid-hex checks still PASS.
6. `getColors()` returns a normalized copy, alpha only when `a < 1` — **Pass** — `getColors` untouched. The alpha that survives `showAlpha: false` is a contract break the criterion does not name; graded as Quality Check #1.
7. Reset / Cancel / OK per spec §7 — **Pass** — `reset`/`cancel`/`apply` unchanged apart from the status branch; smoke 11-14 PASS. `reset()`'s alpha under `showAlpha: false` is Quality Check #1.
8. Multiple instances work independently — **Pass (was the Escape defect)** — `src/bindings.js:38-52`; probe: two open pickers, one Escape → `upper.isOpen === false`, `lower.isOpen === true` with `#ABCDEF` intact; a *closed* later `.cp-root` does not block a single open picker; destroying the top picker leaves the lower one cancellable.
9. Public API `open/close/destroy/getColors/setColors/setActiveTab` + 5 callbacks — **Pass** — no signature or return type changed; `labels.svHint` added and documented; smoke exercises all five callbacks. The `onApply` payload under `showAlpha: false` is Quality Check #1.
10. Contrast ratio math is WCAG-correct — **Pass (unchanged since pass 1)** — `src/contrast.js` and `test/contrast.test.js` absent from the delta.
11. Preset data matches spec §4/§5 and is overridable via `options.presets` — **Pass (was `Partial`)** — probe through the rendered panel with `presets: { highContrast: { Cool: ['#123456'] } }`: pill row `Cool, Blue, Hot, Purple, Green, Neutral` (Cool keeps index 0), Cool renders 1 swatch titled `#123456`, `DEFAULT_PRESETS.highContrast.Cool.length` still 7; the new `Brand` category appended. Unit test pins replacement, position, survival and copy.
12. Light + dark theme via CSS variables; responsive bottom sheet — **Pass** — token change verified by computation (4.97/4.64/4.60) and by screenshots at 1280 light, 1280 dark and 500 mobile: labels crisp in both sections, only the swatch grid fades in the idle one, 22px radius, no overflow, footer pinned.
13. Accessible: roving tablist, `aria-selected`, `aria-live` status, Escape/Enter, focus-visible, reduced motion — **Pass** — smoke asserts `role="dialog"` + `aria-modal` + an `aria-labelledby` that resolves to `Choose Color`; `.sv` carries `aria-valuemin/max=0/100`, `aria-valuenow` drops on `ArrowLeft`, `aria-valuetext` stays hex; escape isolation covered. The message the live-region fix leaves behind is Quality Check #2.
14. Demo page: both tabs, text/panel usage, live preview, custom-preset instance — **Pass (unchanged since pass 1)** — `index.html` absent from the delta.
15. No external dependency, no build step — **Pass** — `grep -rn "from '" src/*.js | grep -v "from '\./"` → 0 hits; still no `package.json`.

**Plan Coverage Review**

1. 1.1 Color core module — **Pass (unchanged since pass 1)** — `src/color.js` absent from the delta.
2. 1.2 Preset tables — **Pass (unchanged since pass 1)** — the merge semantic is graded in AC 11.
3. 1.3 Repo hygiene — **Pass** — tree clean before this pass; the review's probe pages live under the ignored `.local/`.
4. 2.1 DOM template builder — **Pass** — `src/template.js` 170 lines, still `createElement` throughout; the dialog attributes and slider range are exercised by smoke.
5. 2.2 HSV editor controller — **Pass** — `src/editor.js` 157 lines; alpha clamp and aria only.
6. 2.3 ColorPicker class and public API — **Pass** — `src/color-picker.js` 194 lines ≤ 200; per-instance state; smoke full pass.
7. 2.4 Component stylesheet (base) — **Pass** — tokens, radius and emphasis changed; screenshots inspected in both themes.
8. 2.5 Demo page — **Pass (unchanged since pass 1)** — `index.html` untouched.
9. 2.6 README — **Pass** — options table and the categories paragraph now describe replace-by-name and alpha-off; install list still 12 modules (`comm -3` → 0 diff).
10. 2.7 Browser smoke harness — **Pass (was `drift`)** — named in `plan.md:131` (iteration 2 scope) and `Progress` step 2.7; 95 checks, 0 FAIL.
11. 3.1 Preset panel renderer — **Pass** — unchanged; a replaced 1-colour category renders through it without error (probe).
12. 3.2 Selection state sync — **Pass** — `selectColor` remains the single writer.
13. 3.3 Preset styles — **Pass** — emphasis moved to `.swatches`; selected ring and `✓` unchanged.
14. 4.1 Contrast math — **Pass (unchanged since pass 1)** — `src/contrast.js` absent from the delta.
15. 4.2 Suggestions panel — **Pass (unchanged since pass 1)** — `src/suggestions.js` absent from the delta.
16. 4.3 Dark theme + a11y + responsive CSS — **Pass with findings** — Quality Check #2; the AA fix holds in both sections and both themes.
17. 4.4 Demo: custom presets + second instance — **Pass (unchanged since pass 1)** — `index.html` untouched.

**Scope Review**
- Unexpected files changed: None — every file in `4dca8f9..HEAD` outside `TASK_DIR` is one a pass-1 finding named (`README.md`, `color-picker.css`, the five modules, `test/color.test.js`, `test/smoke.html`); the harness is now `planned` (`plan.md:131`, `Progress` 2.7).
- Scope drift: None. Moving the emphasis fade from `.preset-section` to `.swatches` is the same AA rule in a second selector, logged under `### Deferred` in the changelog.
- Constraints / do-not-modify respected: Yes — `wc -l src/*.js` → 21–194, one stylesheet, no dependency, no build step.

**Fit Issues**
- None at criterion level. The one fit-level defect that remains is the `showAlpha` contract break, recorded as Quality Check #1.

### Quality Check

1. **[blocking] High** [Correctness / Public API] — `src/options.js` (`resolveColors`, used at `src/color-picker.js:22,123-140,165-169`), `README.md` options table (`showAlpha`)
   - Should hold: with `showAlpha: false` every colour the component stores, returns, or hands to a callback carries `a = 1` — the option means alpha off on **every** entry path, not only the ones the editor writes.
   - Details: the pass-1 fix pins alpha in `rgbaFromHsv` and `setColor`, so a HEX typed into the field is now opaque and smoke pins it. The other writers to `this.colors` never touch the editor, so they store the 8-digit string as given while the editor renders it clamped: probe this pass with `showAlpha: false` —
     `new ColorPicker({ initialColors: { highContrast: '#FF000080' } })` → `getColors()` `#FF000080`, HEX field `#FF0000`, preview `rgb(255, 0, 0)`;
     `setColors({ highContrast: '#00FF0040' })` → `getColors()` `#00FF0040`, field `#00FF00`;
     `onApply` fires `{ highContrast: '#0000FF33' }` after `setColors({ highContrast: '#0000FF33' })` while the modal shows opaque blue;
     `reset()` from an 8-digit `initialColors` → `#11223344`, field `#112233`.
     So the returned colour is not the colour the component displays — for a colour picker that is a core correctness break, and the README updated in this same iteration promises "alpha is forced to `1`, so an 8-digit HEX cannot leave a translucent color behind". This is pass 1's finding #9 in a wider form: the fix covered the two functions the finding named, the rule it stated still does not hold for `initialColors`, `setColors()`, `reset()` and `onApply`. Graded High on the new evidence (public writers, wrong output colour) rather than as an escalated carry.
   - Suggested fix: clamp once, where colours enter the class — pass `showAlpha` into `resolveColors` (`src/options.js`) and drop alpha there, and route `reset()` through the same helper, so constructor, `setColors`, `reset` and the editor cannot disagree; then pin it with one smoke check (`showAlpha: false` + `setColors({ highContrast: '#00FF0040' })` → `#00FF00`) so this rule cannot regress silently a third time.
2. **[minor] Medium** [Behaviour / Feedback] — `src/color-picker.js:100-108`, `src/editor.js:104-121`
   - Details: dropping `setStatus(normalized)` for `source === 'editor'` ended the live-region churn, but nothing clears a message the editor itself wrote. Probe: type `#GGGGGG` → status `Enter a valid HEX value.`, field reverts to the valid hex; then drag the SV area → the colour changes while that error stays on screen until a reset/cancel/apply or another HEX commit. The message describes input the component has already discarded, and it outlives the correction.
   - Suggested fix: clear the status on the first editor commit — `if (source === 'editor' && this.refs.status.textContent) this.setStatus('')` before `renderPanels()` — or have `editor.apply()` fire `onStatus('')`; the drag path otherwise stays silent, so the churn fix survives.

### Test & Verification Review
- Reviewer checks run (this pass, independently of the author's log):
  - `node --test` → **22/22 pass**.
  - `test/smoke.html` over `python3.12 -m http.server` in headless Chrome (`--headless=new --virtual-time-budget=5000 --dump-dom`) → **95 result lines, 0 FAIL**, document title `PASS`.
  - WCAG recomputation of the new token with an independent implementation: `#667085` on `#FFFFFF` **4.97**, on `#F5F7FA` **4.64**, on `#F4F6FA` **4.60**; old `#8791A3` under the old 0.62 section opacity **1.93**, and `#667085` under that same opacity **2.43**.
  - Behaviour probes in headless Chrome (throwaway page under `.local/`, deleted): preset override through the rendered panel, dialog/`aria-labelledby` ids, `.sv` range, escape isolation (including a closed later root and a destroyed top instance), `showAlpha: false` through constructor/`setColors`/`reset`/`onApply`, and the stale status after an invalid HEX followed by a drag.
  - Screenshots inspected: light 1280, dark 1280, mobile 500 — labels crisp in both preset sections (only the swatch grid fades), 22px radius, no overflow, mobile bottom sheet stacked with the footer pinned.
- Coverage assessment: adequate for everything pass 1 fixed — dialog semantics, slider range, escape isolation and the typed-HEX alpha path each have a smoke check. Gap: no check covers alpha on the non-editor writers, which is exactly where #1 lives.
- Verification gaps or regression risk: #1 has no test and needs none plus one — the fix's smoke check is the natural place; #2 likewise and is cheap to cover in the same pass.

### Changelog Review
- Matches implementation: Yes, except one figure (below). Line counts re-measured — `template.js` 170, `color-picker.js` 194, `editor.js` 157, `presets.js` 47, `color-picker.css` 806; the copy-on-merge claim holds (`merged.highContrast.Blue.push('#000000')` leaves `DEFAULT_PRESETS` at 7); the verification lines (22/22, 95/95) reproduce.
- Missing or misleading entries: the `--cp-subtle` entry quoted the dimmed hint as `2.44:1`; 2.44 is `#667085` under the old 0.62 opacity (the value the fix would have had, which is the sentence's argument), while the idle section actually rendered at 1.93:1 before this iteration. Corrected in-pass.

### Record Check
- `changelog.md:255` and `:302` and the `plan.md` Progress row for Review fix [5] quoted `2.44:1` as the pre-iteration contrast of the dimmed hint; the shipped configuration measured `1.93:1` (old `#8791A3` at 0.62 over white), and `2.43:1` is the corrected token under the same opacity. Corrected in all three places this pass — doc only, no behaviour; `node --test` and the smoke harness were re-run for the record after the correction.
- Every other figure re-checked and accurate: module line counts (21–194), `grep -rn "from '" src/*.js | grep -v "\./"` → 0, `grep -rn "cp-check" …` → only `--cp-check-color`, `node --test` 22, smoke 95, README install list `comm -3` → 0 diff.

### Previous Issues Status
1. `--cp-subtle` below AA — **Resolved** — 4.97/4.64/4.60 measured independently; labels are no longer carried by the section fade.
2. `mergePresets` dropped overrides — **Resolved** — replaced in place (index 0 preserved), new names appended, shipped tables not mutated; unit test pins all three.
3. No dialog role — **Resolved** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby` resolving to the heading (smoke + probe).
4. Escape closed every instance — **Resolved** — top-most only; lower instance keeps its edits; a closed or destroyed neighbour changes nothing.
5. Slider without a value — **Resolved** — range attributes present, `aria-valuenow` tracks saturation, `aria-valuetext` stays hex.
6. Live-region churn during drag — **Resolved for the churn; re-opened** as Quality Check #2 (new, Medium): the churn is gone but the editor's own error message now outlives the correction.
7. Dead `--cp-radius` / `--cp-check` — **Resolved** — `.picker` reads the token (22px default); `--cp-check` gone, only `--cp-check-color` remains.
8. README install list — **Resolved in pass 1** — still 12 modules, `comm -3` → 0 diff.
9. `showAlpha: false` still stored alpha — **Re-opened at High** — the typed-HEX path is fixed and pinned; `initialColors`, `setColors()`, `reset()` and `onApply` still return alpha while the UI renders opaque (Quality Check #1).
10. `test/smoke.html` unplanned — **Resolved** — iteration 2 scope names it and `Progress` has step 2.7.

### ADR Suggestion
- Suggested: No
- Reason: #1 is a normalization-point bug against a contract the README already states and the option name implies; no decision with a lasting contract is in play. #2 is a feedback nit.

### Declined to Judge
All three of pass 1's items appear here for a second time, so this pass judges them rather than carrying them:
- Modal radius 22px vs spec §10's "16–20px", swatches ≈53px vs "44–52px" — **judged: not a defect.** `plan.md:6` names `reference/modern-color-picker.html` as the design authority; it carries 22px/9px itself, §10 states the ranges as approximate, and this iteration changed neither geometry nor layout (re-inspected at 1280 and 500).
- "Reset selected categories if configured" (`sop.md:311`) — **judged: out of scope.** No option in `src/options.js` `DEFAULTS` enables it and no acceptance criterion lists it; nothing in this deliverable can trigger it.
- Two modals fighting over focus (`plan.md:384`, accepted risk) — **judged: accepted.** The plan accepted it, it needs two instances open on one page (demo-only), and the half that destroyed state is fixed.

### Final Recommendation
- Reject — one targeted fix, not a re-plan.
- Required next steps: Quality Check #1 — clamp alpha where colours enter the class (`resolveColors`) so constructor, `setColors`, `reset`, `onApply` and the editor agree, and pin it with a smoke check; while those files are open, clear the stale status message (#2). Every finding names its own fix and no requirement changed, so the next round is `dev-code`, not a new plan iteration.
