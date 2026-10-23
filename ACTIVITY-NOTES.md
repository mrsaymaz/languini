Current v0.34.0 behavior: see VENUE-LEARNING-PROGRESSION.md for the post-success translation and 3/6/9-plate washing sequences.

# Washing visual redesign · v0.20.0

The flat wooden board and CSS-only dish below are superseded by the ceramic/sink close-up in WASHING-DESIGN.md. The current version has two modeled hands, compact native labels and individual physical dirt/food patches. Tap/swipe, unit content, protected time, menu modes and delivery behavior described below are retained.

---

# Washing, menu pairs and delivery labels · v0.19.0

## Connect and clean

Walk to Sink with free hands and dirty dishes. One reviewed three-block sentence from the selected unit appears on a dirty plate. Tap each block in sentence order or swipe between them. Each accepted connection draws a soap trail and removes part of the dirt. Complete the sentence to trigger the batch rinse. All dishes dirty at the start of that activity are cleaned once; no task is repeated per plate.

The activity uses the existing sentence source, chunks, answer and learning record. It adds no assessed examples or unit/theme names. Guest patience, cooking, movement and service time pause while the English task/readback is active. Wrong next blocks record an English attempt and preserve accepted connections. Misses, cancellation, repeated accepted blocks, second fingers and compatibility clicks do not create extra mistakes. A swipe is checked along its movement segment, including coalesced moves, and stops accepting after its first wrong link. Keyboard number keys choose the displayed shuffled positions.

Washing offers no separate currency payout. It records normal practice/accuracy using the original sentence source. The short final rinse runs after protected reading/requested speech, and Pause freezes it. Progress/order survive a viewport refit; incomplete strokes cancel safely. Blocks are at least 44 pixels and dirt/soap remain behind the text. Reduced motion removes nonessential fading. The actual-game preview includes a washing entry.

## Menu modes

Eligible units now rotate:

- English ↔ Turkish text pairs.
- Turkish ↔ English text pairs.
- English ↔ Fluent picture pairs, using the shipped local licensed artwork only where the unit has enough unambiguous images.
- English audio ↔ Turkish meaning pairs: tap a speaker, then match its Turkish meaning.
- The existing one/two-word English listening orders.

Relaxed uses three pairs and Challenge uses four. Both columns shuffle independently and retain stable identity, matching state and order across refits. Every word/meaning comes from the selected unit. Picture-poor units use text/audio modes without importing vocabulary from another unit. Phone preview has direct buttons for the text directions, Fluent pictures and English-audio/Turkish mode.

Audio cards initially hide the written English. A pair waits for requested speech to finish before its match commits; other speaker cards are gated while that word plays. Exact requested words restart after refit/pause through the existing speech lifecycle. Speech failure reveals the corresponding English text and marks that pair as supported practice. Hint can reveal written support for the round. Replay remains free. These features use browser speech, with no network/audio asset dependency.

## Delivery label sizing

Ordinary sticker choices are capped at 190 pixels wide and 76 pixels high while preserving 44-pixel touch height. Their measured text width matches the CSS cap. Long words wrap, and the grid is centered instead of growing choices to fill a tall manifest.

Sorting labels now measure the current English word and any revealed Turkish meaning. Fonts refit when the card or support changes; the word's floor is 14.5 pixels. Wide screens give the central parcel label more width/height. Sorted parcel tags keep their original reviewed words.

## Validation scope

Ten new tests cover all-unit washing/batch conservation, actual native taps, swipe crossings/cancellation/second fingers/refits, text direction, delayed speech/fallback and exact-word restoration, 15,444 measured wash layouts, 7,568 sorting-label/support states, worst-width four-choice delivery sets, and 33 arena/viewport washing sightline cases. Existing 1,176 full-service simulations now exercise English washing when needed. Additional washing checks cover 44 units × two difficulties.

This is automated state/geometry/font/DOM coverage. Actual phone fingers, CSS/WebGL appearance, browser speech and representative hardware still need MOBILE-PLAYTEST.md. No screenshots, external imagery, new dependencies, public deployment or schema change.
