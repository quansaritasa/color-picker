# PRs for 261108-color-picker-lib

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
