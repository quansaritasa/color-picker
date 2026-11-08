# Build a Modern Color Picker Library in Pure JavaScript

## 1. Objective

Build a modern, reusable, framework-independent color picker library using **Vanilla JavaScript, HTML, and CSS**.

The library edits **named colour slots**. A slot is one colour the host paints somewhere in its own page; the picker does not know or care which element that is.

**Default: one slot, `color`** — a plain colour picker, no tab row, no pair. A host that paints more than one thing declares what it needs:

1. **`text`** – for text, icons, labels, and foreground elements.
2. **`background`** – for panel backgrounds, chip backgrounds, badges, and other subtle surfaces.
3. Any other name it uses (`accent`, `border`, `link`, …) with its own label.

Each slot gets its own preserved colour and its own preset grid inside one shared popup; a popup with two or more slots also gets a tab row so the shared editor knows which slot it writes.

A slot's preset group (`text` or `background`) is a **hint** for which palette to show first. It never restricts what the user may pick, and it must not be treated as a semantic rule by the implementation.

The design should be clean, modern, compact, and easy to use. Avoid excessive colors, unnecessary decoration, and complicated controls.

The library should be suitable for integration into existing web applications without requiring React, Vue, Angular, jQuery, or other frameworks.

## 2. Technical Requirements

- Pure JavaScript (ES6+).
- HTML and CSS.
- No external dependencies.
- No UI frameworks.
- No external color-picker libraries.
- No build tools required for basic usage.
- Support modern desktop and mobile browsers.
- Encapsulate implementation to avoid polluting the global namespace.
- Use CSS variables for easy customization.
- Support multiple independent color picker instances on the same page.
- Provide a clean public JavaScript API.
- Use semantic HTML and accessible controls.

Prefer a lightweight implementation with minimal code and no unnecessary abstractions.

## 3. Overall UI Layout

Create a floating modal/popover color picker with the following structure:

### A. Header

- Title: "Choose Color"
- Small color palette icon.
- Reset, maximize/restore and close buttons in the top-right corner, in that order: the toggle sits directly left of the close button.
- Clean typography and subtle separators.

### B. Slot Tabs

With two or more slots, display one large tab per slot, horizontally, in the order the slots were declared.

**A single slot renders no tab row at all** — there is nothing to switch to, and a lone tab is a dead control. Opening such a picker puts keyboard focus on the colour area instead.

Each tab carries:

- The slot's label (`text` defaults to "Text colour", `background` to "Panel background", any other slot to its id).
- The slot's type as a small line under the label: the preset group's short name (`Text` / `Background`) by default, overridable per slot or through `labels.tabs` — "Accent", "Border", "Surface". Two slots may carry the same type; the tabs are still distinct because the label, not the type, names the slot.
- An optional `hint`, exposed as the tab's tooltip — never a second visible line.
- A small glyph (`symbol`) — "Aa" for text, a filled square for backgrounds, the id's first letter otherwise.

The active tab should have:
- Clear blue accent indicator.
- Slightly emphasized background.
- Stronger text weight.
- Smooth transition.

The inactive tabs should remain neutral.

Switching tabs must preserve the selected color of every slot independently.

The tab row lays out one column per slot. With three or more slots it must remain readable rather than shrinking labels into an ellipsis; on narrow viewports it may wrap. Slots that share a preset group get one tab each — the row is per slot, never per group.

### C. Custom Color Editor

Provide one shared color editor that edits the active slot, with:

1. Large saturation/value gradient area.
2. Hue slider.
3. Alpha/transparency slider with checkerboard background.
4. Color preview swatch.
5. HEX input field.
6. Copy button on the right of the HEX field, writing the active slot's value to
   the clipboard and confirming on the button itself.

The editor should update interactively.

Requirements:
- Clicking or dragging inside the gradient updates the color.
- Moving the hue slider updates the gradient.
- Moving the alpha slider updates transparency.
- Editing HEX updates the preview and all controls.
- Invalid HEX values should not overwrite the current valid color.
- Support HEX values with and without alpha.
- Support RGB/RGBA internally.
- Maintain accurate color synchronization between all controls.
- An edit in the editor writes **only** the active slot; every other slot keeps its value.

Use pointer events to support both mouse and touch.

### D. Preset Color Palettes

Display preset categories and their corresponding color swatches, **both palette groups at once**, always. A dimmed panel tone is a legitimate text colour, so the panel group must never be hidden just because the editor is showing a text slot.

- Two sections, side by side: **Text colour presets** (`Aa`) and **Background colour presets** (▰), whatever the slot count.
- The section matching the active slot's `presetSet` is emphasised; the other stays neutral but fully usable.
- Each section has its own categories and its own memory of the last category chosen.
- Each section leads with an **`All`** pill that shows every colour of that palette in one grid, each hex once. It is a view over the categories, not a category of its own: a section still opens on its first shipped category.
- A swatch click writes **the slot the editor is showing** — never a slot the palette "owns". With one slot that is the only colour; with several it is the active tab's.
- Preset category buttons should be compact pills.

Selected categories should have a subtle blue background and blue border.

Color swatches should be square with rounded corners.

Selected swatches should have:
- Blue outline.
- Checkmark.
- Clear visual distinction.

Avoid excessive shadows and gradients on individual swatches.

## 4. Preset Group `text` – Foreground Colors

These presets are intended for text, icons, and foreground elements. They are shown for any slot whose `presetSet` is `text`.

Provide the following categories:

### Cool
- #111827
- #1F2937
- #334155
- #475569
- #64748B
- #0F766E
- #115E59

### Blue
- #1E3A8A
- #1D4ED8
- #2563EB
- #1E40AF
- #0369A1
- #075985
- #0C4A6E

### Hot
- #991B1B
- #DC2626
- #E11D48
- #BE123C
- #C2410C
- #EA580C
- #9A3412

### Purple
- #581C87
- #7E22CE
- #9333EA
- #6B21A8
- #6D28D9
- #5B21B6

### Green
- #14532D
- #166534
- #15803D
- #047857
- #0F766E
- #065F46
- #3F6212

### Neutral
- #000000
- #262626
- #404040
- #525252
- #737373
- #A3A3A3
- #FFFFFF

### More
Allow additional categories to be added through configuration.

Important:
- These presets should prioritize readability.
- Avoid overly pale colors as text presets.
- White and light colors may be included as exceptions for use on dark surfaces.

## 5. Preset Group `background` – Background Colors

These presets are intended for panels, chips, badges, and subtle UI surfaces. They are shown for any slot whose `presetSet` is `background`, and they are also the default group for a slot that names none.

Colors should be soft, light, and visually comfortable.

### Cool
- #F0FDFA
- #CCFBF1
- #99F6E4
- #E6FFFB
- #D1FAE5
- #ECFDF5

### Blue
- #EFF6FF
- #DBEAFE
- #BFDBFE
- #E0F2FE
- #BAE6FD
- #F0F9FF

### Warm
- #FFF7ED
- #FFEDD5
- #FED7AA
- #FEF3C7
- #FDE68A
- #FFFBEB

### Neutral
- #F9FAFB
- #F3F4F6
- #E5E7EB
- #D1D5DB
- #FAFAFA
- #F5F5F5

### Pastel
- #FCE7F3
- #FBCFE8
- #F3E8FF
- #EDE9FE
- #FCE7F3
- #FFE4E6

### Green
- #F0FDF4
- #DCFCE7
- #BBF7D0
- #D1FAE5
- #ECFCCB
- #F7FEE7

### More
Allow additional categories to be added through configuration.

Important:
- These presets should prioritize subtlety and comfort.
- Avoid highly saturated backgrounds.
- Background colors should work well with dark text.
- The library should allow custom presets per slot.

## 6. Color Pairing and Contrast Suggestions

Provide an optional feature to suggest compatible foreground/background combinations.

Contrast only means something for a declared pair of slots, so the host must name that pair explicitly (`contrastPair: ["text", "background"]`). With no pair declared the feature stays off rather than guessing which two colours the host meant.

When the pair is declared:
- While editing the first slot, suggest colours from the **other** slot's palette.
- While editing the second slot, suggest colours from the **first** slot's palette.
- Editing any slot outside the pair shows no suggestions.

Prefer partners that provide good readability against the colour being edited.

Implement WCAG contrast ratio calculations.

Support:
- WCAG AA: 4.5:1 for normal text.
- WCAG AA: 3:1 for large text.
- WCAG AAA: 7:1 for normal text.

Show a small contrast indicator where appropriate.

Do not automatically change the user's selected color. Picking a suggested partner sets the *other* slot of the pair.

This feature should be optional and configurable.

## 7. Interaction and Behavior

### Slot Switching
- Switch between the declared slots.
- Preserve the selected color for every slot independently.
- Preserve the last selected preset category per slot.
- Update the editor and preview accordingly.

### Preset Selection
- Clicking a category displays its colors.
- Clicking a swatch applies that colour to the slot the editor is showing.
- Update HEX input and preview immediately.
- Display a checkmark on every swatch carrying the active colour, in either group.
- Never write a slot other than the active one.

### Custom Color Selection
- Allow users to choose any color using the gradient editor.
- Update the active slot's color in real time.
- Preserve alpha transparency.
- Update the selected swatch state appropriately.

### HEX Input
- Accept formats:
  - #RGB
  - #RRGGBB
  - #RGBA
  - #RRGGBBAA
- Normalize valid input.
- Show validation feedback for invalid values.
- Support keyboard editing.
- Offer a copy control on the right of the field that writes the active slot's
  current value to the clipboard, confirms on the button, and announces the
  result to assistive tech.

### Footer Actions

Provide three actions:

**Reset**
- Restore the initial colors of every slot.
- Reset selected categories if configured.
- Do not close the picker.

**Cancel**
- Discard changes made during the current editing session.
- Restore the values that existed when the picker was opened.
- Close the picker.

**OK**
- Commit the selected colors of all slots.
- Trigger the appropriate callback.
- Close the picker.

A popover has no footer: every edit is painted live, and closing keeps the edits.

## 8. Public JavaScript API

Design a simple API. A colour's key is its slot id, so the host always knows which target a value belongs to.

Example:

```javascript
const picker = new ColorPicker({
    container: document.body,

    slots: [
        { id: "text", label: "Body ink", symbol: "Aa", presetSet: "text" },
        { id: "background", label: "Card", symbol: "▰", presetSet: "background" },
        { id: "accent", label: "Accent", type: "Accent", symbol: "✦", hint: "Buttons and links" }
    ],

    initialColors: {
        text: "#0F766E",
        background: "#CCFBF1",
        accent: "#7C3AED"
    },

    activeSlot: "text",

    showAlpha: true,
    showContrastSuggestions: true,
    contrastPair: ["text", "background"],

    onChange: (colors) => {
        console.log("Colors changed:", colors);
    },

    onApply: (colors) => {
        console.log("Colors applied:", colors);
    },

    onCancel: () => {
        console.log("Selection cancelled");
    }
});

picker.open();
```

With no `slots` option the picker edits one colour, `color`:

```javascript
const picker = new ColorPicker({
    initialColors: { color: "#0F766E" },
    onChange: (colors) => console.log(colors.color)
});
```

The example above declares three slots; two or more also bring the tab row, and any two named in `contrastPair` enable the contrast feature.

### Slot shape

```javascript
{
    id: "accent",          // required, unique, /^[A-Za-z][\w-]*$/, the key in colors
    label: "Accent",       // tab name
    type: "Accent",        // small line under the name; default: the preset group's name
    symbol: "✦",           // glyph in the tab
    hint: "Buttons and links",  // tooltip on the tab
    presetSet: "text",     // which palette group is emphasised; default "background"
    color: "#7C3AED"       // fallback when initialColors has no value for this id
}
```

Palettes belong to the two groups, not to a slot: `presets` is keyed by group name at the top level of the options.

### Required Public Methods

```javascript
picker.open();
picker.close();
picker.destroy();

picker.getColors();

picker.setColors({
    color: "#0F766E"
});

picker.setActiveSlot("color");
```

### Expected getColors() Result

```javascript
{
    color: "#0F766E"
}
```

The returned values should be normalized HEX strings, including alpha only when appropriate. The keys are exactly the declared slot ids — no extra keys, and a key no slot declared is dropped.

### Events

Support:
- onChange: Triggered whenever a color changes.
- onApply: Triggered when the user confirms.
- onCancel: Triggered when the user cancels.
- onOpen: Triggered when the picker opens.
- onClose: Triggered when the picker closes.

Callbacks should receive a copy of the current color state, not a mutable internal reference. `onChange` hands back every slot, including the ones the edit did not touch; that is a snapshot, not a claim that they changed.

## 9. Configuration Options

Allow customization through constructor options.

Example:

```javascript
const picker = new ColorPicker({
    container: document.body,

    slots: [
        { id: "text" },
        { id: "background" },
        { id: "accent", presetSet: "background" }
    ],

    initialColors: {
        text: "#2563EB",
        background: "#DBEAFE",
        accent: "#7C3AED"
    },

    activeSlot: "text",

    showAlpha: true,
    showContrastSuggestions: true,
    contrastPair: ["text", "background"],

    theme: "light",

    presets: {
        text: {
            Cool: ["#111827", "#1F2937"],
            Blue: ["#1D4ED8", "#2563EB"]
        },

        background: {
            Brand: ["#F0FDFA", "#CCFBF1"]
        }
    }
});
```

Support:
- Any number of named slots, each with its own label, glyph, type and hint.
- A preset group hint per slot, defaulting to `background`; slots may share one group.
- Custom preset categories and colors, keyed by palette group.
- Initial colors per slot.
- Initial active slot.
- A declared contrast pair for suggestions.
- Light/dark theme.
- Alpha support.
- Contrast suggestions.
- Custom CSS class.
- Custom labels where practical (chrome strings, tab titles, types and hints, swatch names).

A category the configuration names **replaces** the shipped category of that name and keeps its position; a new name is appended after the shipped ones. The shipped tables are never mutated.

## 10. Visual Design Guidelines

The design should follow a modern desktop application aesthetic.

### Appearance
- White or near-white background.
- Rounded modal corners (16–20px).
- Subtle shadow.
- Clean spacing.
- Neutral gray borders.
- Blue accent color (#2563EB).
- Modern system font stack.
- Consistent icon sizing.

### Layout
- Header at the top.
- Slot tabs below it.
- Color editor in the middle.
- Preset palettes below, one column per slot.
- Footer actions at the bottom.

### Color Swatches
- Approximately 44–52px on desktop.
- Rounded corners (8–10px).
- Consistent spacing.
- No unnecessary labels on individual swatches.

### Buttons
- Compact and consistent.
- Primary blue OK button.
- Neutral Cancel button.
- Subtle Reset action.

### Avoid
- Excessive gradients outside the color editor.
- Too many accent colors.
- Oversized icons.
- Unnecessary descriptions.
- Heavy shadows.
- Decorative elements that consume space.
- Overly complicated layouts.

## 11. Responsive Behavior

Desktop:
- Centered modal or anchored popover.
- Preset sections can appear side by side, one column per slot.
- Color editor and presets should fit without unnecessary scrolling.
- The box belongs to the user once it is open: the header moves it, the corner grip resizes it, and the header toggle (or `m`) takes it to the viewport and back. Every state stays inside the viewport, and the panel scrolls inside itself instead of growing past the screen.

Tablet:
- Reduce spacing and swatch sizes.
- Keep every slot tab visible, wrapping if needed.

Mobile:
- Use a full-width or bottom-sheet layout.
- Stack preset sections vertically.
- Let the tab row wrap rather than clip.
- Support touch dragging.
- Keep footer actions accessible.

## 12. Accessibility

- Keyboard-accessible controls.
- Proper ARIA labels.
- Visible focus indicators.
- Sufficient text contrast.
- Support Escape to cancel/close.
- Support Enter to confirm where appropriate.
- `m` toggles the box while the picker is open, and `⌘`/`Ctrl`+`Enter` is the `OK` button (in a popover, which has no transaction, it closes and keeps the edit). Neither key may fire while the user is typing in a field.
- Do not rely only on color to indicate selection.
- Respect prefers-reduced-motion.

## 13. Deliverables

Create the complete working library. The implementation is split into ES modules so each file stays small and reviewable:

```text
color-picker/
├── index.html
├── demo.html            (optional full-page demo)
├── color-picker.css
├── README.md
└── src/
    ├── color.js
    ├── presets.js
    ├── options.js
    ├── tablist.js
    ├── template.js
    ├── editor.js
    ├── copy.js
    ├── presets-panel.js
    ├── contrast.js
    ├── suggestions.js
    ├── focus.js
    ├── drag.js
    ├── resize.js
    ├── maximize.js
    ├── geometry.js
    ├── popover.js
    ├── triggers.js
    ├── fields.js
    ├── bindings.js
    ├── assemble.js
    └── color-picker.js
```

### index.html
A complete demonstration page containing:
- Color picker initialization.
- Example text color usage.
- Example panel background usage.
- A slot beyond the shipped pair (e.g. `accent`).
- Live preview of selected colors.
- Demonstration of custom preset configuration.
- One panel per shape — setup call, then that instance live — including the
  default single colour and the `fields` (host inputs) shape.

### src/color-picker.js and the modules beside it
Together they contain:
- ColorPicker class.
- Color parsing and normalization.
- HEX/RGB/HSL conversion.
- HSV/HSL gradient calculations.
- Alpha handling.
- Contrast ratio calculations.
- Slot resolution and preset management.
- UI rendering.
- Event handling.
- Public API.

Keep the implementation modular and readable.

### color-picker.css
Contains:
- Complete component styling.
- Responsive layout, including a slot-count-driven grid.
- Active and inactive states.
- Hover and focus states.
- Light/dark themes.
- CSS variables for customization.

### README.md
Include:
- Installation.
- Basic usage.
- Slot configuration.
- Configuration.
- Public API.
- Callback examples.
- Custom preset examples.
- Theme customization.

## 14. Quality Requirements

The implementation must be fully functional, not just a visual mockup.

Verify the following:

1. Every declared slot gets its own tab when there are two or more; both palette groups are always rendered.
2. Each slot remembers its selected color.
3. An editor edit writes only the active slot.
4. Both palette groups are always on screen; a preset swatch writes the slot the editor is showing, never another.
5. Preset categories work correctly and are remembered per group.
6. Selecting a swatch updates the HEX input.
7. HEX input updates the color editor.
8. Hue slider works correctly.
9. Saturation/value editor supports dragging.
10. Alpha slider works correctly.
11. Invalid HEX input is handled safely.
12. Reset restores the initial values of every slot.
13. Cancel restores the pre-edit values.
14. OK commits the current values.
15. A slot with no preset group borrows the background palette.
16. Contrast suggestions appear only for the slots named in `contrastPair`, and never move the color being edited.
17. Multiple instances work independently.
18. The component works without external dependencies.
19. Responsive layout works on mobile and desktop, including three or more slots.
20. Contrast calculations are mathematically correct.
21. The copy button writes the active slot's value, confirms on itself, and never
    copies an inactive slot's colour.
22. A single-slot picker renders no tab row, focuses the colour area on open, and
    edits its colour like any other slot.

**Important implementation principle:** Keep the library lightweight and straightforward. Do not overengineer it. Prioritize a polished UI, predictable behavior, clean JavaScript architecture, and a simple integration API.

Use the supplied color picker design reference as the primary visual direction, adapted to the slot model described above.
