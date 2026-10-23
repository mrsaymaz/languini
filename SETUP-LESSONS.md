# Setup panel and lesson picker · Languini v0.37.0

The opening follows the supplied layout reference while keeping Languini's restaurant materials, Chef's Seal logo and taller transparent owner.

1. Choose your restaurant: the three existing venues and their unlock rules.
2. Your team: the four existing team cards.
3. Lesson: a wide button with the current grade, level, unit number and full unit title.
4. Pace: compact Relaxed/Challenge controls beside the Lesson button.

Pass & play, Café shop and Open the café remain below. On very short landscape screens, restaurant/team groups share a row to keep controls accessible; their reading order remains restaurant first. Compact portrait layouts simplify the lesson badge while retaining the selected grade, level and full title.

## Choosing a lesson

Tap Lesson to open a dedicated dialog. Its top row contains Grade 5 A1, Grade 6 A1+, Grade 7 A2 and Grade 8 A2+. The unit list below shows actual names from the included language bank and short descriptions for all 44 units. It is a scrollable card list, with no grade or unit dropdown.

Grade tabs browse without changing the current lesson. Choosing a unit commits grade and unit together, saves them through the existing profile and closes the dialog. Close, backdrop click or Escape cancel browsing. The Lesson button regains focus after closing. Background setup controls are inert while the picker is open; grade tabs support arrow keys, Home and End. Current grade/unit states are exposed to assistive technology.

Difficulty, rewards, unlock rules and the save format are preserved. Descriptions are presentation copy in src/lesson-picker.mjs. In v0.37.0, included subtopic labels come from the additional language banks; all 44 unit IDs/titles and original activities remain stable. See LANGUAGE-EXPANSION.md.

## Validation

- 326 automated tests pass, including updated opening-control checks.
- Nine browser viewport layouts were checked, from 320×480 and 568×320 to 1366×768.
- The smallest screen was checked again with long selected titles from four grades: no page overflow or clipped lesson text.
- Browser workflows cover cancellation, focus restoration, selecting different grades, 44 unit entries/descriptions, persistence through reload, difficulty persistence and starting the selected Grade 8 unit in Challenge.
- Only the unit list scrolls inside the picker; long cards grow to fit descriptions. The heading and grade row remain visible.

See VALIDATION-REPORT.md and source/validation/lesson-picker-*.json for evidence. The initial browser geometry report is retained as a discovery record; the final compact-fit report records the corrected smallest-screen layout.
