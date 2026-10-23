Current behavior is documented in CUSTOMER-REVIEWS-RECOVERY.md (v0.31.0), including sequential unlocks and the cropped paper feed.

# Paper receipts, arena progression and freshness · v0.30.0

This release extends v0.29.0. Three-phase preparation and the larger delivery crate remain intact.

## Paper checkout

After the correction is accepted, the register hides the sentence and replacement choices. Its next action is Print receipt. The full corrected English is added to the receipt only when the paper is ready.

The printer and paper sit physically beside the LCD, with a visible gap between the paper and display rectangles. Printing frames a stable, full-size paper anchor so the feed animation cannot change the camera's target bounds. The camera moves to the paper; ivory paper, perforated edges and matte printed text distinguish it from the green register screen. The small frame margin shows the slot while protecting text space on compact landscape phones.

Printing feeds for 520 ms, then preserves the existing length-aware 2.4–5 second reading interval. Pause, camera readiness and requested audio stop that reading interval. Rotation restores the external paper, correct sentence and reading protection. No Take receipt button is added.

## Arena progression

Languini Cafe is open from the beginning. Languini Diner requires one successful Cafe run; Languini Bistro additionally requires a successful Diner run. A failed run, stars without a win, or a win in another venue does not unlock them. Existing valid Cafe wins count immediately.

Unlocks apply to the saved player across units, grades, houses and difficulties; a new unit does not demand another Cafe win. Existing record wins provide persistence without a new save schema or save key. Locked cards show the required preceding restaurant. Selection and service-start guards protect the rule, including an old cached selection. Each successful milestone announces only the newly unlocked restaurant.

The isolated phone-preview lab can still open all arenas for inspection and does not change the normal player's saved progression.

## Freshness timing

A circular ring shares the existing task-status row. It stays outside the measured word/card work area. A shrinking arc, remaining seconds and a text grade communicate timing together:

- **Green / Great:** more than half the time remains.
- **Yellow / Good:** more than a quarter, up to half, remains.
- **Red / Late:** a quarter or less remains. At zero, the ring stays visibly red.

Budgets vary by task type, amount of English, matching-pair count or sorting-card count. Ordinary reviewed tasks receive about 24–60 seconds in Relaxed; Challenge uses 75% of that allowance. Each of the three plating sentences receives its own clock.

Clocks run while the player can answer. Camera transitions, audio, pauses, hidden-tab pauses, blocked reaction/readback and completed tasks stop them. Rotation preserves the same remaining-time object; it cannot refill the ring. Audio replay stays free of timing pressure. Kitchen patience, jobs, travel and service elapsed time remain paused during English activities.

At zero, students keep their progress and can finish the task. Timing never supplies an answer, skips a task, records an English error or changes first-try accuracy. Freshness grades are separate from language accuracy.

Completed timed order tasks contribute a freshness score: Great 1, Good 0.5, Late 0. At the physical handoff, the order earns a bounded extra tip: round(2 × mean score), doubled in Challenge. This is 0–2 extra runes per order in Relaxed or 0–4 in Challenge, paid once on its first dish handoff. Existing base rewards remain unchanged. Washing and stock deliveries do not award this order tip. Results list timing grades and freshness tips.

## Verification

See VALIDATION-REPORT.md and source/validation/. Checks cover existing-save unlocks, real setup selection guards, clock thresholds/expiry, readiness/audio/pause/refit gates, all three preparation phases, one-time bounded tips, paper-only corrected text, printed geometry/sightlines and measured receipt fitting. Actual WebGL/CSS appearance, phone touch feel and installed voice quality still require a device pass.
