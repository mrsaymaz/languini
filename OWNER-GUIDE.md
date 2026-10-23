# Mr. Saymaz · Languini v0.35.2

The six restaurant illustrations now have distinct roles in the running game.

| Pose | Placement and trigger |
| --- | --- |
| Welcoming full body | Taller opening character anchored directly beside the setup panel on desktop and landscape. Larger welcome above the panel on portrait phones; compact portrait on the shortest phones. No background or frame. |
| Bust | How-to-play header and the first-service welcome. |
| Pointing | Station-help button in the existing station header. First-use explanations introduce the actual tap/drag controls. Tap the character to dismiss or reopen them. |
| Thinking | Requested Hint, or two or more mistakes in the current activity. Gives a clue without changing the answer or reward. |
| Encouraging thumbs-up | Successful recovery after repeated mistakes; supportive results after an unfinished shift. |
| Cheering | Every third served guest with a 25-second cooldown, and successful shift results. New-restaurant unlocks receive a specific results message. |

Station explanations share the existing header instead of covering the plates, papers, ingredients or menu. Compact layouts temporarily replace the descriptive subtitle and table badge while help is expanded; the timer and task title remain visible. Tap the character again to return to the normal header. Existing Hint and Listen controls keep their normal learning behavior.

Tutorial completion uses the separate `languini-owner-guidance-v1` storage key. The existing guidance selector controls automatic character tips, and Restore first-use tips resets both systems. Quiet mode retains explicitly requested Help. Guidance time freezes while paused or while the station camera/readiness gate is closed. Closing a task discards its message; refitting a screen never accumulates listeners or a message backlog. The current save format, curriculum and reward rules remain intact.

## Artwork and loading

Original PNGs are retained in `source/artwork/originals/`. Production loads only WebP derivatives from `assets/saymaz/`. All derivatives preserve source alpha, including the original soft glow. The opening character has no added background, border, shadow or rounded crop. Other compact gameplay controls retain their interface styling. The artwork has not been redrawn.

Eleven useful production variants total **260,432 bytes (about 260 KB)**, versus **9,588,176 bytes (about 9.6 MB)** for the original six PNGs: a **97.28% aggregate reduction** despite retaining alternate display sizes. Actual served bytes are smaller because each placement selects a suitable variant.

- Opening: responsive 160/480/768-pixel welcoming image, with a 160-pixel bust at very short heights. High fetch priority only for this image.
- Station help: 160-pixel pointing, thinking and encouraging images, loaded when first needed.
- Help portrait: responsive 160/320-pixel bust, lazy loaded.
- Results: responsive 160/320-pixel encouragement or celebration.
- No character artwork is embedded into JavaScript or loaded from an external service.
- Explicit image dimensions, reserved frames and image-error handling keep controls usable while images load.

See `source/artwork/optimization-report.json` for every source/derivative dimension, byte count, alpha flag and reduction percentage. A reproducible Pillow optimization script is included at `source/scripts/optimize-owner-images.py`.

## Opening and rebuilding

Extract the entire archive. Open the root `index.html` on a desktop browser, or deploy the root ready-to-run files to a static host for phones. Keep adjacent files and folders together.

To rebuild: enter `source/`, run `npm ci`, `npm test`, then `npm run build`. The result is `source/dist/`. The source originals are not needed to start the game.

Validation details appear in VALIDATION-REPORT.md and `source/validation/`.
