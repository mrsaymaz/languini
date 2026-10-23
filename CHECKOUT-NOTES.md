# v0.23.0 automatic checkout finish

Print receipt is the final required action. The physical feed and corrected sentence remain visible briefly, then the task advances. The former collection action is removed from pointer and keyboard flows.

Update: v0.19 implements washing as tap/swipe sentence-block connections. ACTIVITY-NOTES.md supersedes the historical washing proposal below; the checkout/receipt fixes remain included.

# Checkout clarity and receipt · v0.18.0

The instruction is now the first measured register row, above the sentence. It names four required actions: Find the mistake, Clear the selected word, Choose the correct word and Print the receipt. An amber wavy underline identifies the word to inspect from the start, with an accessible Check this word label. The replacement is still chosen by the student. The cue changes to selected/cleared/fixed styling as work proceeds.

The previous repair instruction was hidden by the final stylesheet, leaving the Find the mistake label in a small footer. This release adds a dedicated, last-loaded checkout stylesheet and reserves actual banner space in the text-fit planner. Compact pages preserve a short high-contrast title while full pages also show a one-line instruction. No new examples or curriculum changes.

## Printed receipt

The paper now belongs to the tilted terminal, sits in front of the display and feeds upward from a fixed bottom edge, clear of the printer housing. Its complete surface remains inside the register work area. A native text layer shows the full corrected sentence with a compact printed status. Printing hides the underlying terminal controls. After the 520 ms feed and 650 ms correction display, checkout advances automatically. No Take receipt button or extra input is required. Pause, requested English playback and an unready camera still block advancement; rotation reconstructs the feed and display without duplicate rewards.

Print remains one-time. Rotation restores the corrected text, print state and automatic finish. Without intervening render frames, the readable finish still sets the full paper height explicitly. Pause, speech and readiness gates prevent premature advancement.

The automatic word-location cue is recorded as supported practice in learning memory. It does not count as an English mistake or remove existing first-try/reward credit. The student still chooses the replacement. Original save identity/schema, currency, task examples and progression are preserved.

## Washing proposal

Washing still uses the existing timed batch mechanic in this release. The user asked for an assessment of adding English, so the following is a proposed next mechanic, not a shipped task:

- One short activity per batch, using the selected grade/unit's existing reviewed vocabulary.
- Relaxed: match one English word to one of two Turkish meanings or supported pictures.
- Challenge: one short existing completion or a three-chunk sentence, where suitable for that unit.
- Protect reading/listening time; no countdown, English penalty for a missed gesture or repetition for every individual dish.
- One successful activity cleans the full batch. Keep hints/replay free; avoid introducing a second supply or currency cost.

This would give a purposeful learning pause between busy kitchen decisions. It should be playtested with real learners before deciding frequency; dish washing should remain a quick recovery action.

## Verification boundaries

Four new regressions cover the prominent banner/actual error cue/stage sequence/support accounting, 27 arena/viewport receipt sightlines (nine rays per case), pause/early/duplicate collection and 5,698 corrected-receipt text states across eleven viewport sizes and two measured font profiles. Existing print and rotation tests now require explicit collection and still assert one-time completion. The existing 34,408 ticket/register layout states remain checked.

These are numerical geometry/font checks and DOM/renderer doubles. Browser appearance, fingers, shadows and device speech still need the MOBILE-PLAYTEST.md acceptance pass. No screenshots, measured device FPS, new dependencies or public deployment are claimed.
