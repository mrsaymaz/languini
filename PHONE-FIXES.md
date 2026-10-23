# Phone field-test fixes · v0.51.0

The five supplied phone screenshots showed a degraded render, absent location badges, a small preparation vessel beside an oversized note, a question squeezed into a vertical column, oversized reviews and uncontrolled explanatory panels.

## Rendering

Light mode now requests antialiasing when the renderer is created, keeps the shared material environment, and caps rendering at 1.5 CSS pixels per axis rather than 1.15. Detailed caps at 2 rather than 1.65. Light still omits dynamic shadow maps and keeps contact shadows. Material/model detail is shared with desktop; no extra image assets or lights are downloaded. The higher buffer and AA cost more GPU work than the former Light mode; physical phone performance is not measured here. Auto fallback remains available.

## Restaurant controls

Phones get 44 px or larger location buttons for currently useful guest, preparation, cooking, washing, collection and supply actions. Buttons use the normal kitchen command, including walking and task gates. Actions sharing a location are grouped, preferring the selected ticket; signs avoid each other and camera controls. Existing off-screen marks remain and no longer hide unrelated local actions. Desktop keeps its contextual guidance presentation.

The phone ticket rail, dock labels, carrying readout and notifications are compact. The main dock uses short verbs with full accessible names. Repeated first-use guidance no longer occupies a large panel over the restaurant. Blocking notices remain scrollable. Toasts leave room for camera controls. Ticket icons describe their current task.

## Preparation and conversation

Portrait preparation gives the largest readable area to the dish, with a smaller translation strip below it. The rack preserves complete sentence blocks, food-paper pairing and at least 44 px targets; complex sentences can reduce the dish to preserve readable ink on short phones. Layout measures the actual shuffled phrase assigned to each paper. The three phases, food interactions, wrong-answer recovery, pause/rotation state and protected meaning reveal stay intact.

The question topic and speech bubble stack vertically. They previously shared a flex row, allowing the topic to squeeze the question into a narrow column. Browser text adjustment is fixed at 100%, with explicit panel widths and word wrapping. Assistance panels have bounded scrollable space; Hint and Listen retain comfortable targets.

Phone review cards shrink from 190 × 174 to 148 × 140 CSS px and avoid task buttons. The existing Taste, Service and Speed stars, named score reveal and celebrations remain. The root game viewport is fixed and clipped so focused controls cannot scroll the whole game and leave its header off screen. Internal panels and dialogs still scroll.

## Verification

The automated language/geometry checks cover all 1,520 sentences, the reviewed choices and the supported phone layouts. Browser evidence includes high-DPR emulation with a forced four-core Light tier and actual WebGL checks, recipe placement, conversation layout, task-button routing, washing and review bounds. Software Chromium checks do not establish physical iPhone/Safari rendering or FPS; the screenshots supplied by the teacher remain the reference for field retesting.

All 447 unique automated checks have passing evidence: 444 passed initially; after fixing the three exposed preparation issues, 100 affected checks passed, plus six final projected-geometry and 17 gesture checks. The 15-case source browser pass had no page errors. The actual extracted ready runtime also passed native food-icon dragging, all three meal phases, protected readback, label lift/miss return, washing, conversation width and a world-badge walking/task route without QA hooks or external requests.
