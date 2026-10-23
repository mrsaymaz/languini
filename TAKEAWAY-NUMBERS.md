# Takeaway number labels · v0.41.0

At the entrance-side takeaway counter, check the pickup labels by matching a numeral to its English words: **12 → twelve**. Each page has four numerals and four independently shuffled word cards. Both columns are English; no Turkish translation is needed for this activity.

| Pace | Required pairs | Pages |
| --- | --- | --- |
| Relaxed | 4 | One set of four |
| Challenge | 8 | Two sets of four, with eight different numbers |

Numbers are selected from **0–200 inclusive**. British English spelling uses `forty`, hyphenated compound tens (`twenty-one`), and `and` after a hundred (`one hundred and twelve`). The procedural generator defines all 201 mappings; these do not replace or inflate the existing 4,805-activity curriculum bank.

Every regular shift reserves a takeaway order, ordinarily the fourth, independently of the other special event. Takeaway orders use their existing preparation/cooking/check-out route, then require this number check before collection. A wrong match leaves completed pairs intact. Selecting only one card, repeating a pair or finishing only the first Challenge set cannot release the order. The first set has no separate completion reward; the full activity is committed once. Hints identify a matching pair, requested pronunciation reads English number words, and learning records use `number:<value>` keys.

The matching paper sits on the physical pickup counter. Native touch/keyboard buttons use the same responsive page fitting as the menu, with a narrower numeral column in portrait and extra height for the English labels in landscape. Small-screen targets remain at least 44 CSS pixels. Rotation preserves the selected card and completed pairs.

Open **phone-preview.html**, choose **Takeaway · match numbers 0–200**, then choose Relaxed or Challenge to try the complete activity directly without normal-save progress.

## Preparation clearance

The food-preparation close-up is raised by 0.75 scene units to clear surrounding kitchen pieces. Its work-surface dimensions, full-size food vessel and ingredient layout remain unchanged, including the existing space for up to six blocks. The overview counter stays at its original height. All close-up geometry, targets and ingredient rest positions move together, preserving taps, dragging and food animation.

## Checks

`tests/takeaway-numbers.test.mjs` verifies all 201 spellings, endpoints, distinct round values, four/eight-pair gates, single handoff/reward, actual takeaway routing, English readback, phone page fitting and preparation clearance with renovated kitchen props. Rendered browser checks and the complete regression suite are reported in VALIDATION-REPORT.md.
