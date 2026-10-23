# Languini v0.45.0 — Design, recovery and connected service

## Design your restaurant

Open **Design café** on setup or the shift-results screen. Changes apply between shifts and belong to the selected grade, team and restaurant; lessons and pace share that campaign's design.

The floor-plan tab offers three authored arrangements: Window café, Dining clusters and Takeaway first. Table capacities remain two, three and four by venue. The back kitchen, side sink and front service/collection zones stay familiar. The preview draws oriented tables and chairs, plus actual routes to the entrance, tables and collection. Every arrangement/counter combination is checked against the same navigation grid used by the chef. Apply is enabled only if every table and service stop can be reached.

Counter configurations are functional:

- **Balanced:** original counters and capacities.
- **Takeaway counter:** a wider collection counter and one additional food-supply slot.
- **Table service:** a wider service counter and one additional clean serving dish.

These are bounded layout choices, not unrestricted furniture dragging. Decorations have authored anchors on walls, existing tabletops or boundary pockets. The welcome plant's footprint is included in navigation. They cannot insert an island into the approved central aisle.

## Visible recovery and earned choices

The inherited average remains 2.10 stars from 150 reviews. Existing Taste/Service/Speed reviews, named five-star reveals and milestone math remain intact. Earned recovery never disappears after a later lower review.

| Reputation | Automatic improvement | Choose one finishing touch |
| --- | --- | --- |
| 2.5 ★ | Repaired chair upholstery | Potted fern or framed menu |
| 3.0 ★ | Healthier foliage | Fresh flowers or handmade pottery for table centres |
| 3.5 ★ | Decorated serving crockery | Food gallery or café clock |
| 4.0 ★ | Brighter entrance | Warm lanterns or striped canopy |
| 4.5 ★ | A small outside queue | Laurel wreath or house rosette |

Decorations are free once earned, can be changed between shifts, and are distinct from the existing rune-funded shop/projects. A setup badge reports unchosen earned slots. Locked choices are disabled and the state update rejects attempts to claim them early. Milestone results refresh the background room; reopening setup also shows the current recovery state.

## Service atmospheres

Choose Sunny breakfast, Rainy afternoon, Evening service or Changing days. Changing days cycles by that campaign's shift serial. The choice connects room light, window rain, ambient sound and short customer greetings. Existing lights are reused; close-up task lighting stays clear and neutral. The rain uses one bounded line buffer, not a full-screen effects layer.

Ambient audio is generated locally with a single looping filtered-noise source and occasional short morning/evening chirps. It follows Sound, stops on pause/backgrounding and during the introduction, and releases old audio nodes on a mood change. Reduced motion retains a static rain pattern. No audio or weather downloads are added.

## Practical takeaway English

Every normal pickup still includes the original number activity: four pairs in Relaxed, eight distinct pairs in two sets in Challenge, using zero to two hundred.

After completing pickup orders, an additional practical check unlocks gradually:

| Completed pickups before the order | Newly available mode |
| --- | --- |
| 0 | Number practice only |
| 1 | Names on bags |
| 2 | Quantities |
| 3 | Collection times |
| 4 | Packing requests |

Unlocked practical modes rotate on subsequent pickups. Each practical check also has four pairs in Relaxed or eight distinct pairs in two Challenge sets. Number practice remains a separate required step. Progress credits once per fully handed-off order, including a two-meal order, and survives lesson/pace changes within the same campaign.

Names match an order to a customer's bag; quantities match numerical notes to written amounts; times match clocks written numerically to English. Grades 5–6 use forms such as “six thirty”; Grades 7–8 introduce “half past six” and “quarter to seven”. Packing requests combine a name, quantity and omission, for example “Cenk: two sandwiches, no tomatoes, please.” The bag label must agree with all three.

Long packing requests use one readable current request and four stable bag choices. Completed bags stay marked; the next request appears in the same area. This keeps all four pairs in the set while preserving text size and touch targets on compact phones. Wrong matches retain progress; rotation restores the current request. Packing requests have an expanded freshness-bonus budget.

These are reviewed, fixed functional restaurant templates in src/takeaway-tasks.mjs. They supplement the original unit tasks; they do not rewrite the 44 units or replace their vocabulary/grammar. Existing number spelling remains British English. There is no live AI-generated assessment content.

## Connected service episodes

A director now links one optional episode in each normal shift:

1. A quiet opening gives way to a context: morning pickups, heavier rain or evening collection.
2. The guaranteed takeaway uses the last bag.
3. At a safe management moment, a supplier offers packaging.
4. Accepting opens access to Receiving. The student checks an existing activity from the selected lesson, then physically carries the delivery to Pantry. Packaging and stock update only on deposit.
5. A nearby office/shop offers a two-meal collection order. Accepting adds two meals to the displayed shift goal and queues a real two-meal takeaway order. Both meals, normal venue checks, number labels and any unlocked practical labels must be completed.
6. Completing the order earns one bounded episode bonus and an end-of-shift journal entry. The final ordinary guest then closes the shift.

Declining either offer retains the original shift goal and does not penalize the shift award. The supplier acceptance does not silently grant supplies, and accepting the larger order cannot pay twice. Offers wait for a safe moment: no active English, delivery run, occupied hands, ongoing action, conflicting special event or critically impatient guest. A director holds the final ordinary arrival while its decision chain is unresolved, preventing a shift from ending before the opportunity can be resolved.

The director advances only in available management time. English tasks, reading, speech, pause, backgrounding and decision cards protect service clocks. There are no independent arrival timers. The existing four special events remain available and retain their own rules. Preview demonstrations of individual stations keep the director disabled; full-service previews enable it.

## Phone interaction refinements

Selecting an ingredient visibly distinguishes its paper and highlights the full-size destination vessel. The destination says whether a selection is ready. A noninteractive caption follows above a touch/pen drag so the sentence chunk stays visible above the student's finger; missed/cancelled drops remove it safely. The original physical food drag, hit geometry, tap alternative, plate size and six-block capacity are retained.

Checkout quiets surrounding words during correction and emphasises the selected mistake and replacement area. Supporting route metadata is quieter. Automatic arrival greetings clear when a language station opens so they do not cover its prompt.

## Preview and release checks

phone-preview.html adds direct demonstrations for the design studio, all atmospheres, practical takeaway modes and the supplier episode. Preview progress stays separate from the normal campaign.

Automated checks cover old-save migration, state isolation, all 27 venue/layout/counter combinations, decoration gates, capacities, four/eight distinct practical pairs, packing-page fit, ambience cleanup, protected clocks, supplier deposit order and complete accept/decline services across all grades and venues. Browser QA uses actual design buttons, save/reload, projected task surfaces, native practical matches, six-block preparation, checkout and episode decisions. Validation details and device-testing limits are in VALIDATION-REPORT.md.

## Floor plans and atmosphere update · v0.46.0

The original layout IDs stay stable for existing saves: classic → Window café, cosy → Dining clusters, express → Takeaway first. Each now has a different authored silhouette. Window seating rotates furniture, guests and conversation/menu framing together. The opening guest uses the current seating approach and exact chair anchor. Dining clusters share an aisle; Takeaway first groups seats away from collection. Restaurant capacities and kitchen anchors stay stable.

The checker uses the actual navigation grid, chair-inclusive table envelopes, non-overlapping furniture footprints, entrance access, both seats’ approach points, every table’s serving approach and all kitchen/collection stops. It verifies all 864 combinations of three venues, three layouts, three counters and 32 earned decoration combinations. The preview shows these service routes. These are modeled clearance checks; there is no free-drag furniture editor or separate animated guest traffic simulation.

Sunny shifts have blue window glass, sun/cloud silhouettes and stronger window light patches. Rain has 144 bounded exterior/window line segments, clouds, wet paving and four subtle ripple rings. Evening has blue dusk windows, cooler surroundings, warmer lower key light and lit entrance posts/pools. Geometry is batched by material, with no weather textures, network assets, extra dynamic lights or full-screen particles. Reduced motion fixes clouds/rain/ripples in place; pauses stop visual motion. Weather hides during every English station and returns on close. Close-ups retain neutral light.

Ambience uses two quiet stereo beds generated once in an eight-second buffer: room tone and a softer weather layer. Sparse crockery and distant morning birds replace the repeated electronic chirp. There are no sharp rain-drop transients or thunder. A tucked-away Ambience volume slider persists independently of the main Sound switch. English speech immediately ducks the complete ambient mix; mute/pause/intro stop and disconnect loops and detail nodes. Audio sample bounds and cleanup are tested; subjective phone-speaker comfort still benefits from device listening.

## Opening stability and atmosphere · v0.46.1

The setup camera is stationary and the 3D room is cached. Its preview hides roof beams, guests, meals and the duplicate chef; animated gameplay actors return on entering service. Shadows are cached for the static room. Sunny/rainy setup needs only the initial 3D render; rain animation uses one capped-resolution 2D sky canvas behind all controls. Evening warms lights briefly, then settles. There is no extra animation timer. Lesson/Pace changes reuse a room with the same appearance. The setup panel is opaque and has no backdrop blur.

Phone weather is visible in the header space, where the setup panel cannot hide it. A projected café silhouette masks rain from the interior. Reduced motion keeps rain and lights static. The sky hides for story/gameplay/English; gameplay has its own larger sun, three floor beams, 240 exterior streaks, wet paving and fading dusk lamp pools. Close-ups remain neutral. Night headings use light ink. These effects add no downloaded media or dynamic lights.
