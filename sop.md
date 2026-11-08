# Build a Modern Color Picker Library in Pure JavaScript

## 1. Objective

Build a modern, reusable, framework-independent color picker library using **Vanilla JavaScript, HTML, and CSS**.

The library should provide a professional color picker with two distinct color-selection modes:

1. **High Contrast** – for text, icons, labels, and foreground elements.
2. **Low Contrast** – for panel backgrounds, chip backgrounds, badges, and other subtle UI surfaces.

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
- Close button in the top-right corner.
- Clean typography and subtle separators.

### B. Two Main Tabs

Display two large tabs horizontally.

**Tab 1: High Contrast**

- Label: High Contrast
- Description: For text color
- Icon: Aa
- Represents foreground colors.

**Tab 2: Low Contrast**

- Label: Low Contrast
- Description: For panel background
- Icon: A filled square
- Represents background colors.

The active tab should have:
- Clear blue accent indicator.
- Slightly emphasized background.
- Stronger text weight.
- Smooth transition.

The inactive tab should remain neutral.

Switching tabs must preserve the selected color in each mode.

### C. Custom Color Editor

Provide a shared color editor with:

1. Large saturation/lightness gradient area.
2. Hue slider.
3. Alpha/transparency slider with checkerboard background.
4. Color preview swatch.
5. HEX input field.

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

Use pointer events to support both mouse and touch.

### D. Preset Color Palettes

Display preset categories and their corresponding color swatches.

The preset area should be organized into two independent sections:

- Text Color Presets
- Panel Color Presets

When the active tab changes, emphasize the corresponding preset section.

Each section has its own categories and color palette.
Preset category buttons should be compact pills.

Selected categories should have a subtle blue background and blue border.

Color swatches should be square with rounded corners.

Selected swatches should have:
- Blue outline.
- Checkmark.
- Clear visual distinction.

Avoid excessive shadows and gradients on individual swatches.

## 4. High Contrast Presets – Text Colors

These presets are intended for text, icons, and foreground elements.

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
- High Contrast presets should prioritize readability.
- Avoid overly pale colors as text presets.
- White and light colors may be included as exceptions for use on dark surfaces.

## 5. Low Contrast Presets – Background Colors

These presets are intended for panels, chips, badges, and subtle UI surfaces.

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
- Low Contrast presets should prioritize subtlety and comfort.
- Avoid highly saturated backgrounds.
- Background colors should work well with dark text.
- The library should allow custom presets.

## 6. Color Pairing and Contrast Suggestions

Provide an optional feature to suggest compatible foreground/background combinations.

When a user selects a High Contrast color:
- Identify suitable Low Contrast background colors.
- Prefer backgrounds that provide good readability.

When a user selects a Low Contrast color:
- Suggest suitable High Contrast text colors.

Implement WCAG contrast ratio calculations.

Support:
- WCAG AA: 4.5:1 for normal text.
- WCAG AA: 3:1 for large text.
- WCAG AAA: 7:1 for normal text.

Show a small contrast indicator where appropriate.

Do not automatically change the user's selected color.

This feature should be optional and configurable.

## 7. Interaction and Behavior

### Tab Switching
- Switch between High Contrast and Low Contrast.
- Preserve the selected color for each tab independently.
- Preserve the last selected preset category.
- Update the editor and preview accordingly.

### Preset Selection
- Clicking a category displays its colors.
- Clicking a swatch selects that color.
- Update HEX input and preview immediately.
- Display a checkmark on the selected swatch.

### Custom Color Selection
- Allow users to choose any color using the gradient editor.
- Update the active color in real time.
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

### Footer Actions

Provide three actions:

**Reset**
- Restore the initial colors.
- Reset selected categories if configured.
- Do not close the picker.

**Cancel**
- Discard changes made during the current editing session.
- Restore the values that existed when the picker was opened.
- Close the picker.

**OK**
- Commit both selected colors.
- Trigger the appropriate callback.
- Close the picker.

## 8. Public JavaScript API

Design a simple API.

Example:

```javascript
const picker = new ColorPicker({
    container: document.body,

    initialColors: {
        highContrast: "#0F766E",
        lowContrast: "#CCFBF1"
    },

    activeTab: "highContrast",

    showAlpha: true,
    showContrastSuggestions: true,

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

### Required Public Methods

```javascript
picker.open();
picker.close();
picker.destroy();

picker.getColors();

picker.setColors({
    highContrast: "#0F766E",
    lowContrast: "#CCFBF1"
});

picker.setActiveTab("highContrast");
```

### Expected getColors() Result

```javascript
{
    highContrast: "#0F766E",
    lowContrast: "#CCFBF1"
}
```

The returned values should be normalized HEX strings, including alpha only when appropriate.

### Events

Support:
- onChange: Triggered whenever a color changes.
- onApply: Triggered when the user confirms.
- onCancel: Triggered when the user cancels.
- onOpen: Triggered when the picker opens.
- onClose: Triggered when the picker closes.

Callbacks should receive a copy of the current color state, not a mutable internal reference.

## 9. Configuration Options

Allow customization through constructor options.

Example:

```javascript
const picker = new ColorPicker({
    container: document.body,

    initialColors: {
        highContrast: "#2563EB",
        lowContrast: "#DBEAFE"
    },

    activeTab: "highContrast",

    showAlpha: true,
    showContrastSuggestions: true,

    theme: "light",

    presets: {
        highContrast: {
            Cool: ["#111827", "#1F2937"],
            Blue: ["#1D4ED8", "#2563EB"]
        },

        lowContrast: {
            Cool: ["#F0FDFA", "#CCFBF1"],
            Blue: ["#EFF6FF", "#DBEAFE"]
        }
    }
});
```

Support:
- Custom preset categories.
- Custom preset colors.
- Initial colors.
- Initial active tab.
- Light/dark theme.
- Alpha support.
- Contrast suggestions.
- Custom CSS class.
- Custom labels where practical.

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
- Two prominent tabs.
- Color editor in the middle.
- Preset palettes below.
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
- Two preset sections can appear side by side.
- Color editor and presets should fit without unnecessary scrolling.

Tablet:
- Reduce spacing and swatch sizes.
- Keep both tabs visible.

Mobile:
- Use a full-width or bottom-sheet layout.
- Stack preset sections vertically.
- Support touch dragging.
- Keep footer actions accessible.

## 12. Accessibility

- Keyboard-accessible controls.
- Proper ARIA labels.
- Visible focus indicators.
- Sufficient text contrast.
- Support Escape to cancel/close.
- Support Enter to confirm where appropriate.
- Do not rely only on color to indicate selection.
- Respect prefers-reduced-motion.

## 13. Deliverables

Create the complete working library with the following files:

```text
color-picker/
├── index.html
├── color-picker.js
├── color-picker.css
└── README.md
```

### index.html
A complete demonstration page containing:
- Color picker initialization.
- Example text color usage.
- Example panel background usage.
- Open picker button.
- Live preview of selected colors.
- Demonstrations of both tabs.
- Demonstration of custom preset configuration.

### color-picker.js
Contains:
- ColorPicker class.
- Color parsing and normalization.
- HEX/RGB/HSL conversion.
- HSV/HSL gradient calculations.
- Alpha handling.
- Contrast ratio calculations.
- Preset management.
- UI rendering.
- Event handling.
- Public API.

Keep the implementation modular and readable.

### color-picker.css
Contains:
- Complete component styling.
- Responsive layout.
- Active and inactive states.
- Hover and focus states.
- Light/dark themes.
- CSS variables for customization.

### README.md
Include:
- Installation.
- Basic usage.
- Configuration.
- Public API.
- Callback examples.
- Custom preset examples.
- Theme customization.

## 14. Quality Requirements

The implementation must be fully functional, not just a visual mockup.

Verify the following:

1. Both tabs work independently.
2. Each tab remembers its selected color.
3. Preset categories work correctly.
4. Selecting a swatch updates the HEX input.
5. HEX input updates the color editor.
6. Hue slider works correctly.
7. Saturation/lightness editor supports dragging.
8. Alpha slider works correctly.
9. Invalid HEX input is handled safely.
10. Reset restores initial values.
11. Cancel restores the pre-edit values.
12. OK commits the current values.
13. Multiple instances work independently.
14. The component works without external dependencies.
15. Responsive layout works on mobile and desktop.
16. Contrast calculations are mathematically correct.

**Important implementation principle:** Keep the library lightweight and straightforward. Do not overengineer it. Prioritize a polished UI, predictable behavior, clean JavaScript architecture, and a simple integration API.

Use the supplied color picker design reference as the primary visual direction, while following the two-tab High Contrast / Low Contrast concept described above.
