# PRs for 261108-color-picker-lib

## PR #2 — Add picker input validation

- URL: https://github.com/quansaritasa/color-picker/pull/2
- Date: 2026-11-09
- Branch: `feature/color-picker-lib` → `main`
- Diff: 3 commits, +2091/−1330 across 31 files

**Type:** ✨ Feature

### ➕ Added
**[1] - Validation - Malformed options throw, doubtful ones warn.**
- Details: non-object options, non-hex slot `color`, bad preset entries throw `TypeError`; unknown `mode`, `presetSet`, `container` warn and fall back.

**[2] - Build - `npm run build` bundles and minifies into `dist/`.**
- Details: esbuild emits ESM, minified ESM, minified IIFE (`window.ColorPicker`) and minified CSS.

### ✏️ Changed
**[1] - Styling - Every inner class carries the `cp-` prefix.**
- Reason: unprefixed `.picker`, `.tab`, `.actions` picked up host rules; `demo.html`'s `.actions` styled the picker footer.

**[2] - Accessibility - Dialog title id unique across module copies.**
- Reason: `src/` and `dist/` on one page both minted `cp-title-1`.

### 🧭 Key decisions
| Decision | Why |
|---|---|
| Class prefix for isolation | Hosts still theme via `--cp-*` tokens; rejected: Shadow DOM |
| `dist/` left untracked | Build output; `npm run build` regenerates it |

### 🛡️ Risks
| Level | Risk | Mitigation |
|---|---|---|
| 🟡 **Medium** | Host CSS/JS targeting old inner class names stops matching | Rename is mechanical: `cp-` + old name |
| 🟡 **Medium** | Config that loaded before now throws | Only malformed values throw; soft cases warn |

### 🧪 Testing
- ✅ `node --test` 48/48
- ✅ Smoke suite PASS in headless Chrome
- ✅ `index.html` and `demo.html` render the picker
- ⬜ `dist/` load re-check after the rename (passed before it)
- ⬜ Visual and mobile review after the rename

### 🔗 Related areas
- Option resolution, picker template and stylesheet, build and distribution, smoke harness

## PR #1 — Add vanilla JS color picker

- URL: https://github.com/quansaritasa/color-picker/pull/1
- Date: 2026-11-08
- Branch: `feature/color-picker-lib` → `main`
- Diff: 28 commits, +5025/−1 across 25 files

**Type:** ✨ Feature

### ➕ Added
- Two-tab modal with an HSV editor and alpha; per-mode colour, pointer and touch drag.
- 12 shipped palettes, `options.presets` replaces a named category and appends new ones.
- WCAG 2.1 contrast math plus a suggestions panel with ranked partners and measured ratios.
- Public API `open/close/destroy/getColors/setColors/setActiveTab` and five callbacks; no dependency, no build step.
- Light/dark token sets, mobile bottom sheet at 680px, roving tablist, `role=dialog`, slider range attributes, reduced motion.

### 🐛 Fixed
- `showAlpha: false` clamped at the entry points, so `initialColors`, `setColors()`, `reset()` and `onApply` agree with the rendered colour.
- Preset overrides replace by name; a unit test pins replacement, position and non-mutation.
- Light-theme `--cp-subtle` moved to `#667085` (4.97:1 surface, 4.64:1 surface-alt).
- Escape cancels only the topmost instance; the editor no longer writes the live region per pointer move.

### 🧪 Testing
- ✅ `node --test` 22/22.
- ✅ `showAlpha: false` probe through `resolveColors`/`clampAlpha`.
- ✅ Browser smoke re-run for review pass 3 in headless Chrome: 103/103, title `PASS`.
- ✅ `dev-review` pass 3: **Pass with Changes** — pass 2's two findings resolved and pinned; one `[minor] Medium` open (the `showAlpha` on/off predicate differs between `clampAlpha`, `template.js` and `editor.js`).

### Notes
- Shipped after the push quarantine was found ineffective: killing the driver restored `origin`'s pushurl while the round was still alive, and the orphan round force-pushed to `main`. `origin/main` was reset to `d52b68c` (the pre-task commit) and the work moved onto `feature/color-picker-lib` before the PR was opened.
- `dev-review` pass 3 ran after the PR opened (one `dfr` round, 4m33s, $0.0377): **Pass with Changes**. Pass 2's two findings confirmed resolved; its one `[minor] Medium` finding — the `showAlpha` predicate differed between `clampAlpha` (`!== false`) and the template/editor (truthy) — was fixed in `resolveOptions` with `test/options.test.js`. `node --test` 25/25; the browser smoke harness was not re-run (Chrome invocation blocked by tool approval).
