Current v0.34.0 behavior: see VENUE-LEARNING-PROGRESSION.md for the post-success translation and 3/6/9-plate washing sequences.

## v0.23.0 soap and clean ceramic

Twelve translucent soap bubbles with pale rims and white highlights rise around the active sponge target while its patch clears. Once the final dirt fade finishes, a soft narrow sheen crosses the well and three four-point glints mark the clean rim. Feedback is finite, uses local geometry/materials and avoids postprocessing. Reduced motion and restored completed tasks show static clean glints without floating bubbles or a moving sheen. Shared white serving ceramics and scattered sentence labels remain unchanged.

## v0.22.0 serving ceramic correction

The close-up reuses `createVessel(palette, 'plate')`, exactly as served meals do. It shares finished, vertex-colored ceramic geometry and the white/cream/brass materials, oriented into the existing oblique plate rig. Closing washing never disposes the shared ceramic. Sentence spacing, dirty patches, native controls and sponge destinations use the retained layout.

# Close-up washing · v0.20.1

## What students see

Arrive at Sink with empty hands and dirty dishes. The camera leaves the restaurant overview and settles into a close, oblique view of a ceramic plate inside a sage sink. The left hand holds the rim; the right holds a yellow/green sponge. The plate has a shaped lip, shallow cream well and thin brass rim accent, using the existing simple low-poly style.

“Build a sentence. Clean the plate.” appears above the dish with a connection counter. Three shuffled, compact sentence blocks sit on the plate over sauce, crumbs, peas and pasta. They size to their text, with a 196-pixel width cap in portrait, a 17-pixel preferred font / 14.5-pixel minimum and at least 44×44-pixel targets. A loose left/right zigzag uses extra vertical spacing on larger plates, with gaps from 14 to 40 pixels as space allows. Short landscape uses three separated columns with small vertical offsets. Positions remain stable across repeated layout passes and refits. Text stays upright while the actual crockery is oblique.

## Interaction and feedback

Tap each block in sentence order, or press a block and swipe through the others. Correct links get a numbered green state and soap trail, append their English to the sentence strip and move the sponge toward the relevant patch. That patch's dirt fades and food shrinks away; soap bubbles rise briefly. The hand returns to its resting position. Quick swipes replace the hand's current movement while every accepted patch continues cleaning. Reduced motion immediately settles the hands and cleaning result.

The final clean plate remains briefly visible before the existing batch rinse. Requested audio can extend protected reading time. No new examples, vocabulary, reward payouts, dependencies or save fields are introduced. Hints and Replay remain free; instructions are not automatically spoken. All kitchen pressure stays frozen during the English activity and protected readback.

Wrong next blocks retain previous correct links. One incorrect crossing blocks the rest of that stroke, avoiding repeated errors. Missing the target, second fingers, cancellation, repeated accepted blocks and compatibility clicks do not add mistakes. Rotation reconstructs the scene with the same shuffled order, accepted labels and already-clean patches; unfinished strokes cancel.

## Verification and limits

The full automated suite and focused washing suite are packaged under source/validation. Added checks cover physical ceramic/hand/food construction, per-patch animation, reduced motion, native-click-to-3D feedback, restored cleaning after rotation and compact intrinsic label sizes. Existing tests cover all-unit batch conservation, frozen time, gesture capture, cancelled/second-finger input, wrong-link recovery and one-time completion.

Measured text coverage: 702 sentences × eleven viewport sizes × two measured font profiles = 15,444 states. Scene coverage: three arenas × eleven sizes = 33 compositions, 297 control-plane sightline samples and 99 actual dirt/food patch sightlines. An offline geometry sketch was inspected during development; it is not a WebGL screenshot or a CSS/browser validation. No real-phone, browser-rendered, hardware FPS or learner-duration pass is claimed.

Use phone-preview.html → Washing to review the actual game, then test a normal service. Follow MOBILE-PLAYTEST.md before classroom acceptance.
