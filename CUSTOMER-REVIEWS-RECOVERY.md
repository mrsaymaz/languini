Current visual design and receipt timing: REVIEW-CARD-POLISH.md.

# Languini v0.32.0 · Returning to service

Built from the verified v0.30.0 release, preserving the v0.26.0 rollback lineage, three plating phases, curriculum and simple low-poly style.

## Returning from another tab

The old global paused-animation selector stopped the pause card's entrance at its zero-opacity first frame. The invisible modal could intercept gameplay input. Paused CSS now applies to gameplay, while the Resume card explicitly renders without an entrance animation. Hidden pages, focus return and page restoration reset the frame baseline and expose Resume. A hidden page cannot resume, and a lost WebGL context must restore before resuming. The graphics recovery timeout waits while the document is hidden. Audio wakes on the Resume gesture; interrupted prompts retain the existing replay path. No order/task time is charged for time spent in another tab.

This is a confirmed source-level fault and automated regression fix. Actual device tab suspension, GPU context recovery, appearance and speech still require a browser/device playtest.

## Sequential restaurants

Cafe is available initially. A successful Cafe service unlocks Diner. Successful Cafe and Diner services unlock Bistro. Failed runs, stars alone and invalid record keys do not qualify. Existing legitimate wins count across grades, units, teams and difficulty. Cards, cached selection and service start enforce the same rule, including the phone preview. The save key/schema remain unchanged; the phone preview retains its separate temporary profile.

## Receipt feed

After Print, the camera frames the printer's physical paper. An 850 ms eased feed reveals the paper through its slot. Geometry and texture UVs crop the full-size paper instead of vertically scaling the ink. Native text follows the same feed and clipping with a stable full-size projection. Printing and reading freeze when paused or input/camera readiness is unavailable. Rotation preserves feed progress and safely restarts the paper's bounded reading period. The full correct sentence is on paper only; automatic advancement remains, with no Take Receipt button.

## Dining and review cards

After a seated order's final handoff: 3.8 seconds eating, 3.2 seconds reading the review, 1.05 seconds revolving/fading the card, then 0.4 seconds departing. Hand/spoon, head and chewing poses accompany eating; an empty canonical serving vessel appears afterward. Both customers at a shared table eat. Pickup orders retain packaged food and show a pickup review rather than eating at a counter. Reduced Motion uses a steady eating pose and fades the card without rotation.

The noninteractive native review card sits above its table, labels the table/order, and shows three star slots each for Taste, Service and Speed. Positioning stays inside the viewport and chooses alternate positions when multiple cards compete. Dining pauses during English activities and manual/background pauses, so reviews are not consumed behind task views. The last customer's full sequence completes before the win/results event. Rewards, order completion and progression credit are still committed once.

| Category | Evidence and rating |
| --- | --- |
| Taste | Mean answer quality of every preparation phase, including all three sentences and both meals at shared tables. |
| Service | Mean of non-preparation order tasks (conversation/menu/ticket/checkout) and the restaurant's cleanliness at handoff. Cleanliness reflects latest completed wash accuracy and accumulated dirty-dish backlog; the just-served dish is excluded from backlog pressure. |
| Speed | Mean remaining freshness fraction for this order's English tasks; answering time already excludes camera/audio/readback/paused time. ≥50% = three stars; ≥25% = two; below = one. |

Answer quality starts at 1, subtracts 0.22 for each incorrect attempt and 0.20 for a hint/repair cue, and bottoms at 0.15. Taste/Service receive three stars at ≥0.85, two at ≥0.55, otherwise one. A demo without an assessed category displays empty star slots with an accessible “Not assessed” label. Ratings are feedback, not additional currency or deductions from curriculum accuracy. No remote requests, textures, lights, postprocessing or dependencies were added. A batched utensil is created only when a customer first eats and is reused.
