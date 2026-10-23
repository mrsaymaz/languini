# A fresh start · v0.43.0

Languini begins with an inherited **2.10-star average from 150 reviews**. The player takes over the restaurant, prepares it for reopening, then earns back its customers’ trust.

## Before the first shift

The 32-second scene uses the game’s own 3D room and chef, with an elderly owner built in the same visual style. Six chapters move from the empty café and owner, to the handshake and promise, equipment inspection, cleaning, repairs and opening day. The handover captions alternate “Please take good care of Languini.” and “I will.” The owner straightens the CLOSED sign, looks back, offers the keys, relaxes at the chef’s promise and walks away. The chef tests the sticky table and machines, then prepares to work. A dirty framed photo is established first, wiped, studied and straightened; it remains in the normal restaurant scene. Cleaning wipes preserve the underlying surface’s size while revealing it directly behind the tool. Repair panels close before the cooker warms and the checkout lights up. The last chapter turns the sign to OPEN, holds a quiet beat, then the bell prompts a chef reaction and an arriving customer. The camera eases into the normal gameplay framing before service starts. Compact subtitles replace the large caption card, and instructional plaques hide during the film.

The score is an original Web Audio composition generated locally: decaying piano-style harmonics, a soft plucked bass and filtered brush percussion. An unfinished four-note melody returns at the photograph, then resolves after the first customer arrives. Sparse music becomes fuller during restoration and falls quiet before the doorbell; music and Foley have separate buses. Timed sounds include keys, a creaking door, unsuccessful equipment clicks, sweeping/wiping, tools, cooker ignition, a working checkout, lights, the OPEN sign and the first customer’s bell. The music and effects share the existing Sound setting, with a direct toggle during the scene. No video, audio, font or image downloads are added.

Skip stops the story sound; natural completion briefly fades its tail as gameplay music rises. Pause, hidden tabs and graphics loss stop story sound and time. Resume and Continue do not replay a backlog of old cues. Reduced motion uses static cuts, no camera push-in and restrained character movement. Captions remain available with sound off. Spoken voice acting is not included; existing customer listening/voice settings are unchanged.

The scene plays once for each grade/team/restaurant campaign, across all its units and paces. Completing or skipping it records `introSeen`; a page reload does not replay it. Help includes Replay, which returns to setup and does not restart the campaign. Preview progress is isolated from normal saves.

## Customer reviews

The existing Taste, Service and Speed card remains on its three-star scale. After it turns away, a separate named score appears, for example **Cenk: 5 STARS**. The score is the mean of the assessed categories, divided by three and multiplied by five. Thus 3/3/3 gives 5; 3/3/2 gives 4.4 when displayed. Unassessed categories are omitted rather than counted as zero. Values are stored at full precision and displayed to one decimal, with no unnecessary `.0`. Existing whole-star assessments produce fixed steps; the restaurant’s running average can take other decimal values.

A score strictly above 4 gets a gold arrival, star flourish, sound when enabled, and visual reward particles. A perfect five has a stronger gold treatment and PERFECT REVIEW caption. Four and lower receive calm feedback. The score has no pointer targets. When several customers finish together, named reveals take turns so they cannot cover each other on a phone. Task reading/listening, pause and camera travel retain their existing protected-time behavior. Existing category scoring and first-try assessment rules are retained.

The named reveal lasts 2.1 seconds. The final shift waits for reviews/reveals/departures before results. One actual review card produces one reputation entry, including a shared-table order where the host supplies the existing combined card. Review IDs combine a persisted shift serial and order ID. Replay, repeat handoffs, redraws and repeated events cannot credit a review twice. Earned pending reviews also commit when leaving or failing a shift; there are no invented scores for unserved orders. Practice demonstrations do not change reputation.

## Honest cumulative average

`restaurant average = (315 + new review score total) / (150 + new review count)`

Six perfect reviews raise 2.10 to approximately 2.21. The setup badge shows the current average/review count. The final screen shows before → after, change this shift, new-review count, shift average and next milestone. The existing three-star shift award remains separate and is labelled for accessibility.

Reputation is saved under grade + team + restaurant, independent of theme/unit and pace. Existing wallets, equipment, records, curriculum, save key and schema remain compatible.

## Milestones

| Average | Story beat | Visible recognition on future visits |
| --- | --- | --- |
| 2.5 | Another chance | A fresh-start entrance plaque |
| 3.0 | Regulars return | Entrance planting |
| 3.5 | Word spreads | Gold recognition rosettes |
| 4.0 | A neighbourhood favourite | Warm entrance lanterns |
| 4.5 | The turnaround is complete | A finishing gold crest |

Each threshold triggers its own Mr. Saymaz message on shift results and changes returning-customer dialogue. Earned recognition stays unlocked if a later review lowers the average. Recognition is cosmetic; purchases and functional renovation projects retain their own rules.

## Guaranteed takeaway

Every regular shift reserves one takeaway order, ordinarily **order four**, in all three restaurants and both paces. It uses the existing pickup counter and requires four number pairs in Relaxed or eight distinct pairs over two sets in Challenge, using 0–200 inclusive. It remains separate from other special-event selection. Shared-table requests can occur a little earlier to leave room for pickup and the final order. The event forecast uses a fair rotation that includes all four service event types, fixing the old deterministic cycle that excluded takeaway in Café and Bistro.

A shift that ends early or loses its takeaway customer cannot guarantee completion of that customer’s practice. Successful full-shift simulations verify one pickup-number activity across all three venues, both paces and every event candidate.

## Verification

See VALIDATION-REPORT.md for the complete suite, focused reputation/story checks, real browser interactions and package verification. Browser fixtures and internal screenshots are not shipped.
