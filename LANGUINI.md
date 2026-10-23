# Languini · v0.25.0

Languini is the game and restaurant name throughout setup, phone preview, guest menus, tickets, checkout, preparation paper, wall signs, favicon and build metadata. The venues are **Languini Cafe**, **Languini Diner** and **Languini Bistro**. Existing stable arena IDs and the original save key/schema preserve previously earned progress and purchases.

| Venue | Character | Space and furnishings |
| --- | --- | --- |
| Languini Cafe | Light garden cafe | Compact sandstone/wood room, terracotta planting, trellis and striped awning |
| Languini Diner | Warm cream and deep teal | Wider/deeper room, expanded walkable floor, upholstered booths, copper/brass details, arched windows and parquet accents |
| Languini Bistro | Formal ivory and indigo | Largest room, linen-covered tables, walnut sideboards, flower vases, paired brass chandeliers, columns, drapery and inlays |

Room width/depth increases from 9.4 × 9.1 to 10.4 × 10.1 and 11.4 × 11.1 scene units. The rear wall, window architecture, floor tiles, borders and side walls move with the room dimensions. The navigation grid expands with the floor; rear furniture has collision bounds. Kitchen, dining-table and pickup anchors retain their proven positions. Overview framing adjusts modestly per venue, while station close-ups keep independent fitted cameras and readable native controls. Larger rooms retain 121 instanced floor tiles and use existing static material batches. Decorative light fixtures add no real-time light sources. Existing purchased renovations, equipment, prices, task content and service goals remain.

Male guests request **British English (`en-GB`)** and require an installed recognized male persona or an explicit male vendor label. Suitable enhanced/natural/neural British voices are preferred, followed by other allowed British male voices. Fred and novelty voices remain excluded. A missing suitable British male voice uses the existing written support, without silently selecting an American voice, an unclassified voice or the browser default. Female guests retain American voice preferences. Voice catalogue discovery, requested replay, pause, rotation, cancellation and speech-finish protection remain. Device voice sound and availability have not been auditioned.

**Print receipt** remains the final required checkout action. After the paper feeds, its full corrected sentence appears beneath **YOUR CORRECT SENTENCE** on a Languini-branded check. Sentence typography can grow to 26 px when it fits; long sentences retain the measured 14.5 px minimum. Reading time scales from 2.4 to 5 seconds with sentence length, stops during pause/unsettled camera/requested speech, and then advances automatically. There is no Take Receipt button. Rotation rebuilds the check with its corrected sentence and renews the safe reading interval. Rewards/completion commit only once.

Verification uses CPU geometry, font metrics, simulation and DOM/speech/renderer doubles. Actual WebGL/CSS appearance, finger input, installed British voice quality and device frame rate remain for a real-device pass. No public deployment has been made.
