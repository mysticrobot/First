# Nursing Dosage Dimensional Analysis Practice Board

## What this app does
This is a beginner-friendly single-page practice app for nursing students to learn dosage calculations with **dimensional analysis**.

The app focuses on building setups visually (fractions in a chain), not just getting a number. Students can drag tiles into numerator/denominator slots, add extra steps, and watch unit cancellation update.

> **Educational use only:** This app is not clinical advice and must not be used for real patient care decisions.

## Architecture and interaction plan (simple version)
Before implementation, the app was planned with 3 simple parts:

1. **HTML structure**
   - Tab sections for Guided Practice, Free Build, Problem Generator, and Help.
   - Shared workspace area with step cards (numerator/denominator drop zones).
   - Disclaimer and feedback panels.
2. **CSS styling**
   - Calm, clean layout with readable text and spacing.
   - Fraction-step cards and clear tile bank.
   - Responsive support for laptop/tablet/phone.
3. **JavaScript behavior**
   - Tile creation and drag-and-drop placement.
   - Add/remove/reorder steps.
   - Live unit cancellation and answer calculation.
   - Friendly validation and plain-English feedback.

## File overview
- `index.html`
  - App layout, sections, controls, and workspace.
- `style.css`
  - Visual design, spacing, contrast, responsive behavior, and cancellation highlighting.
- `script.js`
  - App logic for guided problems, free build, problem generation, drag/drop, cancellation, and calculation.
- `README.md`
  - This setup and maintenance guide.

## How to run on Windows (no install needed)
1. Download or copy the folder.
2. Open the folder.
3. Double-click `index.html`.
4. The app opens in your default browser.

No backend, no package manager, and no build step are required.

## How the drag-and-drop workspace works
- Tiles appear in the **tile bank**.
- Each workspace **step** is a fraction card with:
  - numerator drop zone
  - denominator drop zone
- Drag a tile into a zone.
- Use **Add Step** for conversion factors or longer setups.
- Use arrow buttons to reorder steps.
- Use **Remove** or **Clear step** to fix mistakes.
- Keyboard/touch fallback: each tile has a button to place it in the first empty slot.

## Where problem templates live
Problem templates are in `script.js`:
- `guidedProblems` array for Guided Practice
- `generateProblem()` category bank for Problem Generator

To add more, copy an existing object and change text + tile values/units.

## Where unit cancellation logic lives
Unit cancellation and answer checks are in `script.js`:
- `analyzeUnits()`
- `renderCancellationAndResult()`

These functions:
- detect matching numerator/denominator units,
- mark canceled units visually,
- identify remaining answer unit,
- provide friendly feedback when the setup is incomplete,
- calculate the numeric result only when setup is valid.

## How to add more practice problems later
1. Open `script.js`.
2. Add new object entries to `guidedProblems`.
3. Add category templates in `generateProblem()` if needed.
4. Keep tile lists beginner-friendly (small number of steps).
5. Save and refresh `index.html` in the browser.

## Notes on rounding
The app shows both precise result and an example rounded format. Rounding policies vary by school/instructor, so final rounding should follow local teaching rules.
