# v0.49.0 · Food preparation

| Check | Result |
|---|---|
| Food-specific motion | Liquids fill beneath the stream; leaves and toppings tumble in component batches; layered meals settle; hot food and crunchy ingredients get appropriate short feedback. |
| Finish | Canonical neat food geometry, vessel-local rim highlight, final warm-dish steam and no change to English outcomes/rewards. |
| Papers and input | Existing board, vessel, paper and touch surfaces retained. Immediate next placements and six-block handling pass. |
| Restoration/accessibility | Rotation restores accepted food immediately without replay; pause freezes station effects; Reduced motion settles directly and clears effects. |
| Automated | All 432 unique checks have passing evidence. Full run exited 0 but the saved log captured its first 310 checks. Remaining 14 files rerun with direct capture: 126/126 pass, with four overlapping checks. See validation/preparation-test-summary-v0.49.0.json. |
| Browser | 12 cases pass: all nine recipes across portrait/compact/landscape/desktop, native placements, six-block rapid input, labels, pouring/tumbling/finish samples, pause, rotation and Reduced motion. No page errors or overflow. |
| Extracted runtime | Native three-phase meal on the extracted file-origin game with no QA hooks: all nine placements, English/translation readback, caption visibility, return to overview; zero page errors/external requests. |
| Archives | Standard ZIP 2.0/Deflate, under 20 MB each, CRC and system-unzip checks, fresh extraction and matching source/runtime hashes. |
| Curriculum | All 13 protected files unchanged: 44 units, 4,805 tasks, 921 conversations. Language integrity audit: zero issues. |

Browser, extraction and archive evidence accompanies the completed release. No physical-device FPS is claimed.

---

# v0.48.0 · Camera and off-screen activity

| Check | Result |
|---|---|
| Zoom and pan | 90–125%, invariant view angle, room-relative pan clamps and exact default reset across all three venues and six phone/desktop sizes. |
| Gesture handling | Real pointer handlers distinguish short taps from drags, pinches, distant releases, pointer cancellation and capture loss. Gestures do not issue walk commands. |
| Protected views | Controls reject setup/story/pause/task/arrival changes. Independent English cameras retain their own framing. |
| Activity | Read-only order/supply sources, grouped counts, urgency, bounds and visibility/resolution clearing. |
| Automated | Initial full suite: 422/425 passed; three startup failures exposed the test's old DOM stand-in, which did not parse dynamically created controls. Reused the existing DOM parser. All 26 startup/kitchen/navigation reruns passed. Added a distant-release pointer regression; all 18 final camera/gesture/kitchen tests passed. Passing evidence covers all 426 unique checks; the final 426-check suite was not repeated as one run. |
| Browser | 21 cases passed: all three venues at 320×480, 390×844, 844×390, 1024×600 and 1920×1080; native wheel/buttons/drag, real phone pinch, mark reveal without an action, protected English and pause/setup. No page errors or viewport overflow. |
| Extracted runtime | Passed file-origin play with no QA hooks: desktop zoom/wheel/reset, native order → walk → matching task → overview, phone resize and camera/quick reset, Pause/Quit, unchanged Ulti; zero page errors/external requests. |
| Archives | Both standard ZIP 2.0/Deflate files pass CRC, system unzip, fresh extraction and source/runtime hash checks, and are below 20 MB each. |
| Curriculum | 44 units, 4,805 tasks, 921 conversations; all 13 protected files unchanged and no language integrity issues. |

Evidence: validation/zoom-tests-v0.48.0.txt, zoom-rerun-v0.48.0.txt and zoom-final-focused-v0.48.0.txt. Browser and archive results are recorded with the completed release. Software WebGL does not measure physical-device FPS.

---

# v0.47.1 · Larger desktop restaurant

| Check | Result |
|---|---|
| Scope | Desktop live-service overview at 1024×600 and above uses 76/100 px top/bottom margins instead of 172/154. Pitch/yaw, floor plan and movement scale stay consistent. |
| Visible size | About 55% larger at 1024×600, 38% at 1280×720, 34% at 1366×768 and 20% at 1920×1080 / 2560×1080. These are projected linear scale increases, not FPS or geometry changes. |
| Framing | All three venues retain kitchen, tables, entrance and takeaway. Bounds and target projections stay inside the viewport; station points do not fall beneath persistent desktop HUD controls in the native browser cases. |
| Preserved poses | 33 reference cases exactly retain previous phone/short-window, opening and non-kitchen overview frames. English surfaces keep their own camera. |
| Automated | **44/44 targeted checks passed** in **84.551 seconds**, covering desktop/portrait camera projection, scene interactions, opening cache, startup/offline/retry and all ten Ulti regressions. Full suite now contains 420 checks; 376 were not rerun. |
| Extracted release | File-origin game at 1366×768, with no QA hooks: native order click, walking, matching completion and return to service, portrait resize to 390×844, Pause/Quit and intact Ulti. Zero page errors/external requests. Evidence: validation/extracted-desktop-v0.47.1.json. Both standard ZIP 2.0/Deflate archives are below 20 MB with valid CRCs, system unzip, fresh extraction and matching source/runtime hashes. |
| Native browser | **24 cases passed**, including prior/current comparison, all three venues across phone/desktop sizes, persistent-HUD containment and a native order-ticket click opening English then returning to the exact room pose. Zero page errors. |

Evidence: validation/desktop-camera-focused-v0.47.1.txt, desktop-regression-v0.47.1.txt and desktop-browser-v0.47.1.json. Before/after desktop screenshots inspected internally and excluded from deliverables. Software Chromium/WebGL does not measure physical-phone or desktop hardware FPS.

---

# v0.47.0 · Ulti currency

| Check | Result |
|---|---|
| Reward table | Cafe 4/8, Diner 6/12 and Bistro 8/16 in Relaxed/Challenge, awarded after a successful full shift. |
| Grade/team isolation | Sixteen logical pools. Grade/team keys stay independent while lessons, venues and paces contribute to the appropriate pool. Shift context is immutable. |
| Expiry | Each award lasts exactly 168 hours; newer earnings do not extend older ones. Balance queries exclude expired awards after closed/offline periods. Live UI refreshes the balance. |
| Duplicate/ineligible awards | A unique shift ID prevents repeat credit after callbacks, save/load and expiry. Failures and demos/previews are excluded; quitting has no finish award. |
| Save compatibility | Existing runes, records and purchases retained. Ulti cannot pay for shop items. Older open tabs merge valid Ulti receipts when saving. |
| Full regression | **417/417 passed**, zero failures/skips, in **261.662 seconds**. See validation/automated-tests-v0.47.0.txt. |
| Focused regression | **10/10 passed**: all rates, sixteen pools, exact expiry boundaries, reload, deduplication, invalid input, old saves, purchases, read-only snapshot, real successful shift and open-tab saves. |
| Native browser | **15 cases passed**: six complete accelerated non-kitchen model shifts, result reward and balance dialog, native grade/team switching, save/reload, failed shift, older-54/newer-4 rolling expiry and four viewport fits. Zero page errors/external requests. |
| Extracted release | Actual file-origin runtime at 320x480 with no QA hooks passes active/expired receipts, native balance dialog and Escape, grade/team switching, reload, rune-only purchase and quitting an unfinished shift without Ulti. Zero page errors/external requests. Evidence: validation/extracted-ulti-v0.47.0.json. Both standard ZIP 2.0/Deflate files are below 20 MB; CRC, system unzip, fresh extraction and source/runtime hashes pass. |
| Connection boundary | Browser-local save only. No shared-account service or external integration is contacted. Read-only dated receipts prepare for the later game-system specification. |

Evidence: validation/ulti-focused-v0.47.0.txt and ulti-browser-v0.47.0.json. Phone dialog screenshot inspected internally and excluded from deliverables. Software Chromium/WebGL testing does not establish physical-phone performance or server-side trust.

---

# v0.46.2 · Stable language tasks

| Check | Result |
|---|---|
| Reproduction | In v0.46.1 a two-round menu sequence exposed the painted tablet cover: 10 faded task frames, 7 unlaid frames and 7 camera-flight frames on the next round in the observed run. See menu-before-v0.46.1.json. |
| Fix | Consecutive menu/takeaway pages hold the settled screen camera. Native tablets have a small plain backing; embedded listening completion does not replace it. Changing guests/stations retains camera travel and inert controls. |
| Native browser | **16 cases passed**, with **504 sampled frames** and zero faded/unfitted task frames, new-round camera flights, duplicate menu-cover paints, page errors or external requests. Includes translation, reverse translation, picture/audio matching, one/two-word listening, mixed matching/listening pages and both takeaway paces at portrait, landscape and desktop sizes. |
| State and input | Native taps complete tasks. Wrong answers recover; hints expose the next pair; matched/selected cards survive rotation and pause; speech-disabled listening retains written support. Grades 5–8 are exercised across mode fixtures. |
| Bank audit | All **4,805 tasks / 44 units**, **3,285 choice tasks** and **1,520 sentence reconstructions** pass. All 13 protected content-file hashes remain intact. No curriculum wording or keys changed. |

Full regression: **407/407 passed**, zero failures/skips, in **265.673 seconds**. Evidence: validation/automated-tests-v0.46.2.txt. Extracted release: file-origin game at 320x480 passed native four-pair matching and two-word listening confirmation, written speech fallback, setup/weather/lesson, story Pause/Skip, gameplay and packing. Zero page errors or external requests. The final archives use standard ZIP 2.0/Deflate, each below 20 MB, with CRC, system unzip, fresh extraction, source fingerprints and runtime hashes checked. See validation/extracted-browser-v0.46.2.json.

Browser runs use software Chromium/WebGL; physical-phone performance and device voice quality are unmeasured. Structural audits do not replace editorial semantic review of every distractor.

Evidence: validation/menu-before-v0.46.1.json, menu-browser-v0.46.2.json, menu-pair-focused-v0.46.2.json, menu-regressions-v0.46.2.txt and language-integrity-v0.46.2.json. Screenshots inspected internally and excluded from deliverables.

---

# v0.46.1 · Stable opening and visible atmosphere

| Check | Result |
|---|---|
| Targeted regression | **54/54 passed**, including startup/recovery, camera, all 864 layout combinations, geometry, English-station cutaways and all opening acting. Five final menu tests also passed after the rain mask. The full 405-test suite was not rerun. |
| Original problem | The setup camera drifted, animated every guest/meal behind the panel, and rendered the full room/shadows continuously. On phones the setup panel hid most of the 3D weather. Before evidence: opening-before-v0.46.0.json. |
| Stable setup | Stationary camera; no roof/guest/meal/duplicate-chef preview; opaque panel with no backdrop blur; cached 3D image. Lesson/Pace changes reuse unchanged scenery. Gameplay actors and live shadows return for service. |
| Visible sky | One capped-resolution canvas behind controls: sunlight/clouds, animated rain or gradually warming evening lamps. Projected café silhouette excludes indoor rain. Reduced motion stays static. No timers, downloads or interactive overlay. |
| Native browser | 17 phone/desktop cases across all moods, native choice/save flow, reuse, lamp warm-up, gameplay and clear English stations. Three final checks on the final bundle show **animated sky with zero repeated 3D renders** over the observed interval, a perfectly steady camera and readable evening headings. Zero page errors. |
| Gameplay effects | Larger exterior sun and three broad floor beams, 240 longer rain streaks on both sides and the entrance, warmer lamp pools and lower dusk light. English closeups hide weather and stay neutral. |
| Rendering evidence | Setup redraws use 111/112/111 renderer calls, compared with the previous 225/229/227 every frame, in the same software Chromium/Lite configuration. Sunny/rainy setup is now cached; evening settles after warm-up. These are workload measurements, not a physical-phone FPS benchmark. |
| Compatibility | Existing art, layouts, curriculum/answer keys, saved campaigns, protected English timing and quiet adjustable ambience retained. |
| Release | Two standard ZIP2/Deflate archives below 20 MB each, with source/runtime hashes, CRC, system unzip and fresh extraction checked. Extracted-file smoke evidence is supplied in validation/extracted-browser-v0.46.1.json. |

Evidence files are under validation/: opening-weather-final-v0.46.1.txt, opening-menu-final-v0.46.1.txt, opening-browser-v0.46.1.json, opening-mask-final-v0.46.1.json, scene-geometry-v0.46.1.json and extracted-browser-v0.46.1.json. Internal screenshots were inspected and are excluded from deliverables.

---

# v0.46.0 · Arrangements and atmosphere validation

| Check | Result |
|---|---|
| Full regression | 400 tests; 395 passed in the full run (347.843s). Five failures were resolved as described below. No second all-pass full-suite run is claimed. |
| Final followups | Six focused mesh/camera/preparation checks passed. All six opening-acting checks passed, including exact arrival and gameplay-camera handoff. |
| Floor plans | All 864 combinations of three restaurants, three arrangements, three counters and 32 décor combinations passed actual navigation-grid checks. Serving, both seat approaches, entrance and kitchen/collection endpoints are reachable. Physical table/fixture overlap is rejected. |
| Native browser | 27 software-WebGL cases: all plans/venues; three atmospheres at 390×844, 320×480 and 1366×768; real preview/apply/save/reload; pause/resume sound and saved ambience volume; six neutral, weather-free English closeups. Zero page errors or external requests. |
| Audio | Actual two-layer graph rendered offline at fixed 55% ambience gain; finite nonzero samples, peaks below 0.025 and complete loop cleanup. Speech ducking, zero volume and scheduled-node cleanup tested separately. Subjective speaker comfort unmeasured. |
| Geometry | Base scenes: 244/275/305 mesh objects and 195492/221968/248692 triangles. Fully upgraded rainy scenes: 286/318/348 objects and 227386/255214/282714 triangles. CPU traversal includes hidden and instanced geometry; these are not GPU draw calls or physical-phone FPS. No new dynamic lights, media files or textures. |
| Preservation | Original language/answer keys and protected content bytes retained. Existing layout save IDs, campaign state, service timing and restaurant capacities retained. Build-time bank/answer audit remains mandatory. |
| Release | Standard ZIP 2.0 Deflate, each archive below 20 MB; manifests, CRC, system unzip, fresh extraction and file-origin smoke verified. |

Three full-run failures came from fixture expectations: the old 300-object cap omitted new bounded exterior geometry, and two fixed-angle tablet fixtures did not pass the rotated seating angle used in production. These assertions now retain their geometry/raycast checks with the new bounds and actual angle. The fourth failure used a fixed 2.1-second wait; it now uses the existing bounded wait for the actual phase transition without shortening protected reading time. The fifth found a real opening-scene bug: a rotated seat had a new Z coordinate, while the arriving guest still ended at the old table Z. The scene now uses the authored approach and exact chair position.

Evidence: validation/automated-tests-v0.46.0.txt, final-followups-v0.46.0.txt, opening-final-v0.46.0.txt, atmosphere-final-v0.46.0.txt, design-weather-browser-v0.46.0.json, scene-geometry-v0.46.0.json and extracted-browser-v0.46.0.json. Screenshots were inspected internally and are excluded from deliverables.

---

# Validation report · Languini v0.45.2

| Check | Result |
| --- | --- |
| Full regression | **394 unique checks verified.** Initial full run: 393/394 in 388.910s. One existing software-VM startup fixture exceeded its 10-second allowance. The same save/arena assertions passed after allowing 30 seconds for procedural geometry and GC. Final focused startup: 1/1; final language checks: 6/6. Evidence: validation/automated-tests-v0.45.2.txt, startup-final-v0.45.2.txt and language-final-v0.45.2.txt. |
| Startup timing | Paired largest-venue initialization: previous v0.45.1 7.70s, fixed v0.45.2 7.16s in the same software-VM boundary check. Both opened setup with zero errors. This is diagnostic CPU timing, not physical-phone performance. Evidence: validation/startup-timing-v0.45.2.txt. |
| Reported club question | g5u1d3 correctly asks about chess club. Original data includes chess/art/music. A legacy odd-last-child/full-row CSS rule could move the third shuffled label outside the fitted paper. The modern grid now uses explicit planned cells; legacy spanning is confined to the old panel. Before evidence: validation/label-visibility-before-v0.45.1.json. |
| Bank audit | **4,805 activities**, including **3,285 choice tasks** and **1,520 sentence reconstructions**: no missing/duplicate IDs, empty keys/prompts, absent/duplicate answer choices, unsupported kinds or invalid repair metadata. Every build runs this gate. Existing bank bytes are unchanged. |
| Generated choices | **105,120** seeded choice sets across every choice task and both paces passed. Matching, listening, functional takeaway and sorting membership checks passed. |
| Rendered delivery controls | **40,502 cases**: all **1,841** label tasks × two paces × eleven sizes. Real production CSS/markup/fonts and receiving/page fitting. Every label checked for paper containment, ink bounds, at least 44px targets within rounding tolerance, centre-point hit access and one exact answer. **Zero issues or page errors.** Evidence: validation/answer-controls-v0.45.2.json. |
| Full WebGL interaction | **13 cases**: chess club in all three cells at 320×480, 390×844, 568×320 and 1366×768, actual selection/attachment with no English mistake, incomplete cached-choice repair and correct-answer availability after rotation. Zero page errors/external requests. Evidence: validation/label-native-v0.45.2.json. |
| Runtime safeguard | Cached choices are reused only when they contain the current exact answer and valid distinct alternatives; stale/incomplete sets are regenerated without an English mistake. |
| Compatibility | Original curriculum wording, IDs/keys, save schema, story, designs, reputation and protected service timing retained. No model/plate/crate-size change or external asset downloads. |
| Release | Standard ZIP 2.0/Deflate game and source packages; manifests, CRC, system unzip and fresh extraction checked. Actual extracted file-origin opening/design/previews checked; see validation/extracted-browser-v0.45.2.json. Exact bytes/hashes/CRC rechecked after saving. |
| Scope | These checks establish structural consistency and interactive answer availability. They do not automatically prove every distractor semantically false. The reported chess-club meaning was reviewed directly. Browser checks use software Chromium; physical-phone hardware remains unmeasured. |

See ANSWER-VALIDATION.md for the bug and repeatable commands. Scratch-only screenshots/fixtures are excluded from deliverables.

## Previous validation

# Validation report · Languini v0.45.1

| Check | Result |
| --- | --- |
| Regression suite | **388/388 passed**, zero failures, skips or cancellations, in 328.790 seconds. Evidence: validation/automated-tests-v0.45.1.txt. |
| Native panels | Setup, lesson chooser, design, shop, help and pause checked at **320×480, 390×844, 568×320 and 1366×768**. No horizontal overflow. Native topics toggle, grade/unit choice, design apply, disclosure controls and Pause/Resume work. Evidence: validation/clean-ui-browser-v0.45.1.json. |
| Final startup | Three entrypoint/storage/classic-script checks re-run after the final header/modal refinements: 3/3 passed. Evidence: validation/clean-ui-final-startup-v0.45.1.txt. |
| Meaningful information | Unit descriptions remain visible; longer subtheme lists are available through Show topics. Upgrade values, capacities, locked-venue requirements and optional-order consequences remain. Shift statistics/review are available through Shift details; graphics/guidance through Display & guidance. |
| Gameplay UI | Existing ingredient and packing controls/task cues remain visible. Duplicate Service paused copy is screen-reader-only. First-use/blocked-action hints remain available; routine repeated hints are visually quiet. Supplier decline/results and optional shift-detail disclosure checked natively. |
| Compatibility | Same curriculum bytes, save key/schema, 44 units/4,805 activities/921 conversations, models, geometry, tasks, rewards and protected service timing. All v0.45.0 design/recovery/director features retained. |
| Release | Separate standard ZIP 2.0/Deflate game and source packages; source/runtime manifests, CRC, system unzip and fresh extraction checked. Actual extracted file-origin opening/design/new previews checked; see validation/extracted-browser-v0.45.1.json. Exact sizes/hashes/CRC checked after saving. |
| Limits | Software-WebGL Chromium and synthetic pointer input. Physical-phone performance and audio hardware are unmeasured. Scratch-only browser screenshots/fixtures are excluded from deliverables. |

## Previous validation

# Validation report · Languini v0.45.0

| Check | Result |
| --- | --- |
| Regression suite | **388/388 passed** in 261.496 seconds, zero failures, skips or cancellations. Includes 13 new cafe-evolution checks. Evidence: validation/automated-tests-v0.45.0.txt. |
| Design and recovery | All **27 venue/layout/counter combinations** have reachable actual service/table approaches and clear central aisle. Save isolation, locked choices, safe fern footprint and finite recovery models passed. Native studio controls, save/reload and compact/landscape dialogs checked. Layouts are authored blueprints; free furniture dragging is not included. |
| Connected episodes | Complete accept/decline services across venues and paces, every unit's selected delivery content, safe decision gates, protected clocks, Pantry deposit, optional two-meal goal and one-time payouts checked. Browser uses native offer buttons; scratch-only simulation solves intervening existing tasks. |
| Takeaway and phone fit | Existing zero–200 number practice retained. Gradual names, quantities, times and packing checks use fixed supplemental restaurant templates. Four/eight distinct pairs, phase retention, packing text fit across seven sizes, native completion and rotation recovery checked. Native preparation and checkout focus checked. |
| Browser | 20 main cases plus final touch-caption, packing rotation/error recovery, sound/pause/mute, rainfall, results design and preview checks. Zero page errors or external requests. Evidence: validation/cafe-browser-v0.45.0.json and cafe-final-browser-v0.45.0.json. |
| Sound and motion | Local single-source ambient bed with released nodes on changes/pause/mute. Real OfflineAudioContext renders for breakfast/rain/evening checked for finite output, nonzero RMS and peak below 0.2. Rain falls downward; reduced motion is static. |
| Scene cost | Base Cafe/Diner/Bistro: 236/267/297 mesh objects and 195,552/222,028/248,752 triangles. All equipment/projects, recovery/decor, takeaway counter and rain: 275/307/337 objects and 225,226/253,054/280,554 triangles, plus one 30-segment rain line. CPU counts include hidden objects and expanded instances; these are not draw calls or device FPS. Evidence: validation/scene-geometry-v0.45.0.json. |
| Compatibility | Original 44 units, 4,805 activities, 921 conversations and 13 protected content files unchanged. Save key/schema, inherited 2.1 stars/150 reviews, opening story/audio, owner art/logo, full-size plate and six-block/three-phase preparation retained. |
| Release | Separate standard ZIP 2.0 / Deflate ready-to-play and source packages, no ZIP64. Source/runtime manifests, CRC, system unzip and fresh extraction verified. Actual extracted file-origin opening, design and new previews checked separately; see validation/extracted-browser-v0.45.0.json. Archive hashes/sizes/CRC rechecked after saving. |
| Limits | Software-WebGL Chromium; synthetic touch events verify handlers, not physical finger hardware. Phone GPU FPS, speakers, installed voices and classroom timing remain unmeasured. |

See CAFE-EVOLUTION.md for rules and entry points. Scratch browser fixtures and screenshots do not ship.

## Previous validation

# Validation report · Languini v0.44.0

| Check | Result |
| --- | --- |
| Regression suite | **375 unique checks verified.** Initial full run: 373/375 passed in 248.399 seconds. Two older graphics assertions assumed grey-only vertex shading and a separate TubeGeometry object per pasta piece. The new colour/material batching intentionally changes both. The checks now validate normalized colour attributes and actual open tube boundaries. Final graphics/model run: **10/10 passed**. No production fix was needed for these assertions. Evidence: validation/automated-tests-v0.44.0.txt and model-graphics-final-v0.44.0.txt. |
| Models | Rig pivots/poses, face controls, bounded chef geometry, exact full-size plate footprint, shared geometry ownership, finite attributes, all 81 ingredient layers, nine dishes and whole-room budgets verified. Base scenes retain fewer than 300 mesh objects. |
| Native browser | **23 cases**, including 16 station views, native six-block preparation and washing phase completion, and five cinematic poses. Nine meals, washing, checkout and pickup render at 390×844; compact portrait, landscape and desktop fits also checked. All projected labels fit, six-block touch targets remain usable, and there are zero page errors or external requests. Evidence: validation/model-browser-v0.44.0.json. |
| Visual review | Side-by-side previous/detailed chef and a gallery of all nine finished dishes rendered and inspected. Original proportions, eye placement, smile, complexion, hat silhouette and rig retained; new seams, pocket tools, hair locks, shoes, curved leaves, pasta, toppings and vessels visible. Final trouser hems close the small pre-existing gap above the shoes. Scratch-only comparison fixtures do not ship. |
| Rendering cost | Base Café/Diner/Bistro: 236/267/297 CPU mesh objects and 195,552/222,028/248,752 triangles, including hidden objects and expanded instance counts. Fully equipped rooms with reputation level 5: 251/282/312 objects, 203,080/229,900/256,968 triangles; exact values are in validation/scene-geometry-v0.44.0.json. Portrait preparation frame samples use 90–108 renderer calls and 59,638–74,558 visible triangles. These are software-WebGL samples, not physical-phone FPS or worst-case guarantees. |
| Loading | Procedural models and existing shared maps; no model, texture or media downloads added. Auto/Light quality, pixel-ratio limits and frame-budget fallback remain active. |
| Compatibility | Existing story and sound, 44 units/4,805 activities/921 conversations, six-block preparation, protected content bytes, saved progress, reputation and named reviews, guaranteed takeaway tasks, owner artwork and Chef’s Seal retained. |
| Extracted release | The actual extracted ready-to-play archive opened from file://, ran the opening, Pause/Continue/Skip and first-shift Pause/Resume, with zero page errors or external requests. Evidence: validation/extracted-browser-v0.44.0.json. The tested game bundle SHA-256 is recorded there. |
| Packaging | Separate standard ZIP 2.0 / Deflate game and source packages, enclosing folders, no ZIP64. Source/runtime manifests, CRC, system unzip and fresh extraction passed. Archive size/hash/CRC are rechecked after saving before delivery. |
| Limits | Software-WebGL Chromium validation; physical phone GPU performance, finger input and audio hardware unmeasured. |

See MODEL-DETAIL.md for scope and budget. Previous release evidence follows.

## Previous validation

# Validation report · Languini v0.43.0

| Check | Result |
| --- | --- |
| Full regression suite | **371/371 passed**, zero failures/cancellations/skips, in 310.559 seconds. Evidence: validation/automated-tests-v0.43.0.txt. |
| Final story regression | **18/18 passed** after final framing and customer-arrival refinements. Includes owner acting/key transfer, surface reveals at tool contact, continuous photo reveal and frame straightening, an unobstructed view of the chef’s reaction, repairs and shared sound times, pause/mute/seek, exact final camera, customer seat position, state restoration, reputation and guaranteed pickup. Evidence: validation/story-final-focused-v0.43.0.txt. |
| Native browser | 35 cases including 31 rendered frames across 390×844, 320×480, 568×320 and 1366×768. Compact subtitle/control bounds, real Pause/Sound/Skip, replay, natural completion and the first shift. Zero page errors. Evidence: validation/story-browser-v0.43.0.json. Final ticket visibility and gaze changes were rerendered in six shots, with native controls, audio and first-service checks repeated; see validation/story-visual-refinement-v0.43.0.json. |
| Music and Foley | Original local Web Audio composition. Real 34-second OfflineAudioContext render has finite output and no clipping. The quiet second before the bell is checked against the preceding music and bell levels; effects use an independent bus. Exact peak/RMS values are in the browser evidence. No external audio/video downloads. |
| Cinematic behavior | Six chapters, 23 acting beats, 32 seconds. Dirty photograph established first; sign gesture and farewell; failed equipment inspection; contact-driven wipes; photograph study; panel closure before equipment response; OPEN sign, quiet beat, bell, reaction and customer arrival. The last view matches the actual gameplay camera. |
| Mobile and accessibility | Compact subtitles replace the large caption card. Pause/Continue retain 44-pixel targets. Context appears on pause. Captions remain when sound is off; reduced motion removes repetitive sway and camera pushes. Backgrounding/graphics loss freeze time/audio. Normal service does not run behind the story. |
| Compatibility | Existing 44 units, 4,805 activities, 921 conversations, protected content bytes, save identity, reputation, named reviews, guaranteed takeaway practice, owner artwork, logo and preparation dimensions remain compatible. Previously completed intros stay completed; Help > Replay shows the refinement. |
| Extracted runtime | The actual extracted ZIP opened from file:// and ran the opening, Continue/Skip, first shift and Pause/Resume with no page errors or external requests. Evidence: validation/extracted-browser-v0.43.0.json. |
| Packaging | Standard ZIP 2.0 / Deflate game and source packages with enclosing folders and no ZIP64. CRC, system unzip, fresh extraction and manifest checks run before delivery; post-save hashes/sizes/CRC are rechecked. |
| Limits | Graphics checks use software-WebGL Chromium. Physical phone GPU performance, speakers and classroom listening conditions were not measured. |

See OPENING-STORY.md for the scene and sound timeline. Temporary browser fixtures and screenshots do not ship.

## Previous validation

# Validation report · Languini v0.42.0

| Check | Result |
| --- | --- |
| Game regression checks | **365 unique checks verified.** The full suite passed 364/365 in 284.442 seconds. The single failing tab-return fixture passed after consolidating the story audio visibility callback into the app’s existing lifecycle listener. Its DOM double stores only one listener per event; the browser supports multiple. Evidence: validation/automated-tests-v0.42.0.txt and tab-return-rerun-v0.42.0.txt. |
| Final story and audio checks | **12/12 passed** after final changes: reputation math and named reveals, guaranteed pickup services, timeline and camera bounds across venues and sizes, clean disposal, score/Foley timeline, mute/pause/resume, cue skipping, native controls and story handoff. Evidence: validation/story-final-focused-v0.42.0.txt. |
| Opening | Six chapters, 28 seconds; owner/chef dialogue captions, dirty room and equipment close-ups, cleaning/repair montage, restored keepsake photo, OPEN sign and arriving customer. Normal service stays stopped behind the story. Existing once-per-campaign state retained. |
| Browser | Native software-WebGL Chromium; 21 native cases, including 17 rendered frames across 390×844, 320×480, 568×320 and 1366×768; Pause/Sound, Skip into the first shift, natural completion, Help replay and permanent in-game photo. Zero page errors. Detailed results: validation/story-browser-v0.42.0.json. The actual extracted ZIP also opened from file://, ran the opening and first shift, and paused/resumed with zero page errors or external requests; see validation/extracted-browser-v0.42.0.json. |
| Audio | Real OfflineAudioContext rendering of the locally composed score and Foley, finite output with no clipping. Exact peak/RMS measurements in the browser evidence. Music/effects follow the existing Sound setting, stop on skip and freeze on pause/backgrounding; natural completion fades into gameplay. No audio/video downloads. Dialogue uses captions. |
| Room geometry | Base Café/Diner/Bistro: 235/266/296 CPU mesh objects; final recognition level: 249/280/310. The permanent photo adds two meshes. These are scene-object/instance-expanded triangle checks, not GPU FPS or measured renderer draw calls. Evidence: validation/scene-geometry-v0.42.0.json. |
| Content and compatibility | 44 units, 4,805 activities, 921 conversations and all protected bank bytes retained. Existing save identity, curriculum, reputation, reviews, owner artwork, logos, preparation station and takeaway practice remain compatible. |
| Packaging | Separate standard ZIP 2.0 / Deflate runtime and editable source, enclosing folders, no ZIP64. CRC, system unzip, fresh extraction and source/runtime manifest checks passed. Hashes and CRC are rechecked after saving, following the prior truncated-upload issue. |
| Limits | Browser checks use software graphics. Physical phone speakers, device GPU performance and classroom listening conditions have not been measured. |

See OPENING-STORY.md for the scene and sound timeline.

## Previous validation

# Validation report · Languini v0.41.0

| Check | Result |
| --- | --- |
| Full regression suite | **361 unique checks verified.** The full run passed 353/361 in 236.046 seconds. All eight corrected legacy tests passed focused reruns: seven startup tests now use ID-aware DOM queries and explicitly skip the new story when testing service, and the roster fixture reads the actual arrival, including pickup. Final eight story/reputation checks also passed after key-ring cleanup. Evidence: source/validation/automated-tests-v0.41.0.txt, startup-stations-rerun-v0.41.0.txt and reputation-final-focused-v0.41.0.txt. |
| Guaranteed number practice | 24 successful complete services cover three venues × two paces × four special-event candidates. Each service completes exactly one pickup-number activity. Existing 1,176 service simulations remain included, for 1,200 total. Shared-table event timing leaves room for pickup and the final order. The deterministic forecast now visits all four event types. |
| Inherited reputation | Exact baseline 315 stars / 150 reviews = 2.10. Assessed existing category stars convert proportionally to five. Duplicate IDs, replay, paused dining, repeat completion and pending-review flushes are checked. Save/reload preserves reputation and intro completion; unit/pace changes share the same restaurant, while grade/team/venue keys remain separate. |
| Named score sequence | Card review → full turn → named score → departure. 5/4.7/4/3.5/2 display fixtures verify the customer name and strict >4 celebration threshold. The three existing whole-star assessments remain unchanged; decimal fixtures demonstrate presentation support, while actual conversion follows their sum. Simultaneous named reveals take turns. Final victory waits for the full sequence. |
| Five milestones | All 2.5/3.0/3.5/4.0/4.5 thresholds crossed once in accumulated reviews. Earned recognition persists after a later lower review. Each milestone supplies a result-screen owner line, returning-guest dialogue and cumulative entrance decoration. |
| Opening story | Five 3D shots: handshake/key handover, dirty/worn room, cleaning, repairs and reopening. 21 seconds, once per grade/team/restaurant, with Skip/Pause/Continue/Replay. Geometry, finite cameras and clean disposal checked across three venues and three screen sizes; vertex shading matches the room. No new image/video downloads. |
| Browser | **15 interaction cases** plus **7 final story-rendering cases**, zero page errors, in software-WebGL Chromium. Actual first Open/Skip, repeat Open and reload persistence; all five story shots at 390×844; compact 320×480 and landscape 568×320 bounds; Cenk: 5 STARS after the card; before/after results and milestone owner reaction; small-screen scrollable results. Real fourth-order pickup markup and native four/eight matching taps complete in Relaxed/Challenge, with no first-set release. Evidence: source/validation/reputation-browser-v0.41.0.json and story-final-browser-v0.41.0.json. Final screenshots inspected internally. |
| Scene geometry | Base Cafe/Diner/Bistro remain 233/264/294 mesh objects. At the final recognition level: 247/278/308. These are CPU object counts, not GPU draw calls or measured FPS. |
| Content and saves | Existing 44 units, 4,805 activities, 921 conversations, source banks, logos and owner artwork retained. Existing save key/schema and prior wallets, upgrades, records and curriculum remain compatible. Reputation adds an optional field to the existing save. |
| Release package | Runnable root game plus editable source. Build preservation guard, source/runtime hash manifests, ZIP CRC and fresh-extraction asset/content checks passed. Temporary browser fixtures and screenshots do not ship. |
| Limits | Physical-phone hardware GPU performance, installed voices and actual classroom pacing were not measured. |

The synthetic legacy equipment/event test helper disables the new guaranteed-arrival schedule where a fixture manually skips several orders; complete service simulations use the production schedule. The final-guest timing test now includes the named-score phase.

See REPUTATION-STORY.md and TAKEAWAY-NUMBERS.md for rules and preview instructions.

## Previous validation

# Validation report · Languini v0.40.0

| Check | Result |
| --- | --- |
| Full regression suite | **353 unique checks verified.** The full run passed 349/353 in 277.809 seconds. Four corrected tests passed focused reruns: the shared pause test opens the actual pickup counter and preserves its initial ready status; camera tests use named styles and include the new counter; ticket/rotated-reading tests wait for bounded completion state instead of fixed sleeps. Production timers are unchanged. Evidence: source/validation/automated-tests-v0.40.0.txt and station-rerun-v0.40.0.txt. |
| Number spellings | All 201 integers from 0 through 200 have unique British English names. Explicit zero, twelve, forty, compound-tens, hundred/and and two-hundred cases; invalid inputs rejected. |
| Four/eight-pair rules | All three venues × both paces verified. Relaxed requires four pairs. Challenge requires eight different numbers across two sets; no first-set order release, stock change or completion reward. Wrong pairs, duplicate taps, pause gates, one final activity record/reward and one handoff checked. Real takeaway routes require the counter task before collection. |
| Phone fitting | Every number plus the longest hundred names measured with two font profiles across eight phone/landscape/desktop sizes. Minimum font 14.5px and touch height 44px retained. Native 390px paper fills the reserved 354px width. |
| Preparation clearance | The close-up is raised by 0.75 scene units; board, note and plate dimensions remain unchanged. Overview board retains Y=0. Rays across the work surface in three venues × three screen sizes, with renovated kitchen props and visible guests, hit the station before surrounding props. |
| Rendered browser | **13 cases passed**, zero page errors, in software-WebGL Chromium. Longest number labels at 320×480, 360×640, 390×844, 568×320 and 1366×768; raised six-block preparation at 320×480, 390×844 and 568×320. Native Relaxed/Challenge pair taps, wrong-match recovery, rotation selection persistence and a single ready load verified. Actual preview buttons switch both paces; six native ingredient/dish taps advance the raised preparation to its next phase. Evidence: source/validation/takeaway-browser-v0.40.0.json and takeaway-preview-browser-v0.40.0.json. Screenshots inspected internally. |
| Content preservation | Existing 44 units, 4,805 activity records and protected original/source bank bytes retained. Number practice is procedural (201 mappings), separate from bank counts. Build preservation guard and fresh-extraction hash verification run for this release. |
| Package | Runnable root game plus editable source; runtime/source manifests and ZIP CRC checked, including a fresh extraction. Temporary browser fixtures and screenshots do not ship. |
| Limits | Physical phone input, installed voices and hardware GPU/network performance were not measured. |

See TAKEAWAY-NUMBERS.md for task rules, spelling and preview instructions.

## Previous validation

# Validation report · Languini v0.39.0

| Check | Result |
| --- | --- |
| Complete automated suite | **347 unique checks verified.** The full run passed 344/347 in 310.371s. Three reading-transition tests had fixed 2.1s sleeps that expired with protected reading time still remaining; those tests now use bounded state waits and all three passed in 22.416s. Production reading timers are unchanged. Evidence: source/validation/automated-tests-v0.39.0.txt and reading-transition-rerun-v0.39.0.txt. |
| Shared restaurant plan | Actual station approaches are reachable in all three venues; chairs and fixture footprints leave the central aisle clear. Cafe/Diner/Bistro retain two/three/four tables and stable save IDs. |
| Focused layout regressions | 30 tests passed, zero failures/cancellations/skips. Covers the 60° downward / 15° sideways portrait camera, exact prep board/note/plate geometry, separated ingredient papers, canonical food layers, table/checkout sightlines, cutaway restoration, finite scene meshes and renovation stages. source/validation/layout-final-focused-v0.39.0.txt. |
| Rendered browser | 13 cases passed in software-WebGL Chromium, zero page errors. All three venues at 390×844; upgraded Bistro; overview at 320×480, 360×640, 568×320 and 1366×768; preparation, washing, ticket, checkout and receiving at 390×844. Screenshots visually inspected internally. source/validation/restaurant-browser-v0.39.0.json. |
| Native preparation | Six-block fixture completed with actual ingredient/dish clicks at 390×844; the third block cannot finish it. Original work-surface dimensions and main plate size retained. |
| Visibility | Tall back-wall/kitchen fixtures cut away during prep, receiving and washing, then restore. Geometry rays verify no wall/sign/hood obscures the preparation surface. Phone guidance moves above the room, and compact views retain the same actions in the ticket and dock. |
| Scene budget | Base Cafe/Diner/Bistro scenes contain 233/264/294 mesh objects; fully equipped/renovated scenes 234/265/295. CPU geometry counts include hidden objects and are not GPU draw calls or FPS. source/validation/restaurant-scene-metrics-v0.39.0.json. |
| Curriculum and package | All source banks and runtime language bytes unchanged from v0.38.1. Build preservation guard, source/runtime hashes and fresh-extraction verification run for this release. |
| Limits | Physical phone input, installed voices and hardware GPU/network performance were not measured. Browser fixture selection uses scratch-only hooks; none ship in source or runtime. |

The restaurant floor dimensions and assessed curriculum are retained. See RESTAURANT-LAYOUT.md for layout, camera and upgrade behavior.

## Previous validation

# Validation report · Languini v0.38.1

- **28 focused tests passed**, zero failures, cancellations or skips (10.906 seconds). Checks include all 1,520 sentence labels across ten viewport sizes and two measured font profiles; four/five/six-block fixtures assert unchanged board, note and main plate dimensions, bounded separate ingredient papers and complete-sentence gating. Station and freshness regressions passed. Evidence: source/validation/prep-space-v0.38.1.txt.
- **Eight rendered preparation cases passed** in software-WebGL Chromium: five/six blocks at 320×480, 390×844, 568×320 and 1366×768. Five-block native ingredient/dish taps complete successfully at 390×844; zero page errors. Screenshots inspected internally. Evidence: source/validation/prep-space-browser-v0.38.1.json. Scratch-only fixture hooks do not ship.
- Build preservation guard, source/runtime hashes and fresh-extraction release verification run for this patch. Sentence-bank bytes are unchanged from v0.38.0.
- The full 342-test result below remains historical v0.38.0 evidence; this layout patch reran the focused checks above. Physical phone input and hardware GPU performance were not measured.

## Previous validation

# Validation report · Languini v0.38.0

| Check | Result |
| --- | --- |
| Full regression suite | **342 passed**, zero failures, cancellations or skips; 251.457 seconds. source/validation/automated-tests-v0.38.0.txt. |
| Grammatical boundaries | All 1,520 sentence activities match explicit reviewed blocks and roles. 534 arrangements revised; complete wording, translations, answers and IDs preserved. The teacher examples, indirect objects, negation/auxiliaries, noun phrases and time expressions have focused assertions. |
| Variable-count model | Five- and six-block fixtures require every block, retain all three preparation phases, and cannot finish on the third block. Washing keeps the existing three/six/nine plate routines. |
| Recipe geometry | All nine recipes × three phases × five/six-block fixtures consolidate to three canonical layers per phase. Previously completed phase food remains in the vessel. |
| Native controls | Five ingredient controls survive rotation, retain placed blocks and require the last two blocks. Captured washing taps accept on pointerup even if the compatibility click targets the plate; duplicate clicks, cancellation and keyboard activation are checked. |
| Phone font/layout checks | 36 focused tests passed. All sentence papers and washing links fit at measured viewport/font combinations. Five/six-block fixtures have readable, separated targets in portrait and landscape; whole words are preferred over letter-level wrapping where supported sizes fit. source/validation/grammar-layout-v0.38.0.txt. |
| Station flow and freshness | 11 focused tests passed with actual block counts. Task completion, order, duplicate placement, ticket clipping and clock protection remain covered. source/validation/grammar-station-flow-v0.38.0.txt. |
| Rendered browser | 16 five/six-block preparation and washing cases passed at 320×480, 390×844, 568×320 and 1366×768 in software-WebGL Chromium. Actual five-block ingredient/dish taps and washing taps completed successfully at 390×844; zero page errors. Evidence is in source/validation/grammar-browser-v0.38.0.json. Screenshots are internal QA and are not packaged. |
| Curriculum protection | Original source banks and thirteen baseline hashes remain unchanged. The preservation guard permits only reviewed sentence-boundary and role changes while comparing all other original fields exactly. Expanded runtime output must reproduce deterministically. |
| Build/package | Source/runtime hashes, relative entry assets, ZIP integrity and fresh-extraction verification run before delivery. |
| Limits | Physical phone finger input, installed voices, hardware GPU performance and classroom pacing were not measured. Browser fixture selection uses scratch-only hooks; none ship in the app. |

The current bank has 1,332 three-block, 186 four-block and two five-block sentence activities. No new assessed sentences were added. SENTENCE-BLOCKS.md and the full teacher-review TSV document the boundaries.

## Previous validation

# Validation report · Languini v0.37.0

| Check | Result |
| --- | --- |
| Full automated suite | **334 passed**, zero failures, cancellations or skips; 240.459 seconds. source/validation/automated-tests-v0.37.0.txt. |
| Final content regressions | **11 passed** after final synonym-option filtering. Reproducibility, all 44 mappings and 2,288 record links, duplicate handling, original task preservation, complete sentence/translation retention, question choices, picture vocabulary, exclusive sorting and completion through actual engine actions. source/validation/additional-content-v0.37.0.txt. |
| Expanded layout checks | **36 passed** in the targeted content/layout run, including new activities across measured phone fonts and all 1,220 sorting cards. The complete suite repeats these checks. source/validation/content-layout-v0.37.0.txt. |
| Browser | Shipped setup tested at 320×480, 360×640, 390×844, 667×375 and 1366×768. No horizontal list overflow; included topics fit their cards; Grade 6 Health and Well-being survives reload. |
| Browser gameplay | Temporary scratch-only hooks select four exact new activities and a new sorting pack, using the real app with software WebGL. Native ingredient/dish clicks complete translated and English-only assembly; a native reply click completes the new school-club question. Vocabulary and sorting render. No uncaught page errors. source/validation/language-browser-v0.37.0.json. |
| Source preservation | Thirteen original baseline hashes remain intact. Expanded language/provenance files use frozen originals; all 3,033 original task objects remain equal. New runtime data must exactly match a fresh deterministic import. |
| Assets and loading | No new bitmap generation or external curriculum requests. New data is bundled locally for file-origin startup. Existing optimized owner/logo assets remain. Actual network latency is not benchmarked. |
| Build and package | Fresh source/runtime fingerprints, release verification, ZIP CRC/unique-path checks and fresh-extraction verification are recorded with the release. |
| Limits | Physical phone input, installed speech voices, hardware GPU performance and classroom learning duration were not measured. Drawing specifications are references, not 396 supplied image assets. |

Existing grade/unit/save identities and all six stations remain. Source words fitting both sorting headings are excluded; ambiguous source ending choices become complete-sentence assembly.

## Previous validation

# Validation report · Languini v0.36.0

Opening panel reordered from the supplied reference: restaurant choices, team choices, then Lesson beside compact Pace. The new picker commits grade/unit atomically, with saved preferences and cancellation behavior.

| Check | Result |
| --- | --- |
| Full automated suite | **326 passed**, no failures, cancellations or skips; 224.933 seconds. Evidence: source/validation/automated-tests-v0.36.0.txt. Existing startup/mobile assertions now check the replacement lesson controls and absence of the unit dropdown. |
| Unit coverage | The current protected bank supplies all 44 exact unit titles. Four grade tabs show A1 / A1+ / A2 / A2+. Every card has browsing description copy. |
| Browser state | Grade browsing plus Escape preserves the original lesson and restores focus. Choosing Grade 7 Unit 1 persists through reload with Challenge. Selecting Grade 8 Unit 12 starts that exact unit in Challenge. Evidence: source/validation/lesson-picker-state-v0.36.0.json. |
| Responsive layout | Nine viewport checks: 390×844, 360×640, 320×568, 320×480, 667×375, 568×320, 844×390, 1366×768 and 1024×600. Popup heading/tabs fit, background is inert and the unit list scrolls. No dropdown exists in the picker. |
| Final compact correction | Initial checks found a narrow-screen overflow and compressed long descriptions. After correction, four long lesson selections at 320×480 have scrollHeight equal to viewport height and lesson content fits its button. Cards use content-sized grid rows. Evidence: source/validation/lesson-picker-final-fit-v0.36.0.json. The earlier geometry JSON is retained as discovery history. |
| Rendering | Zero uncaught browser errors; final setup and modal screenshots visually inspected. Internal screenshots are not included as deliverables. |
| Curriculum and release | Protected curriculum/count gates run before and after bundling. Source/runtime hashes, entry assets and ZIP integrity are verified. Save identity and game reward/unlock rules remain unchanged. |
| Limits | Checks use desktop headless Chromium with software WebGL. Physical phone interaction and classroom pacing were not measured. |

## Previous validation

# Validation report · Languini v0.35.3

Selected Chef’s Seal branding is integrated into the opening screen, compact navigation, favicon, Apple touch icon and manifest icon metadata. A transparent full title and matching emblem were generated from the selected artwork, then optimized into local WebP/PNG/ICO assets.

- **12 startup tests passed**, zero failures/cancellations/skips, 73.125 seconds. Includes real opening, service start/return, later-arena save guards, blocked storage, local startup and repeated tab recovery. Evidence: source/validation/branding-startup-v0.35.3.txt.
- **Rendered browser checks:** 390×844, 360×640, 320×568, 320×480, 667×375, 844×390, 1366×768 and 1024×600. Zero horizontal or vertical overflow; all visible brand images loaded. Help opens and service starts. Zero uncaught page errors. Evidence: source/validation/branding-browser-v0.35.3.json.
- **Visual inspection:** desktop and phone screenshots show the full selected logo without the background glow, and the smaller plate-and-utensils emblem in navigation. The taller owner and setup panel retain their layout. Screenshots are internal QA, not packaged deliverables.
- **Assets:** three full-logo WebP sizes, two inline emblem sizes, a 32-pixel PNG favicon, 16–64-pixel ICO frames, 180-pixel Apple icon and 192/512-pixel manifest icons. Source artwork and optimization report are included.
- **Preservation:** no gameplay JavaScript, assessed content, scoring or save-schema changes. Protected curriculum gates and final source/runtime hash checks run for this release.
- **Limits:** physical phone installation was not tested. Manifest metadata does not add offline support. The earlier 326-test full-suite result remains historical v0.35.0 evidence; the targeted startup suite was rerun for this branding change.

## Previous validation

# Validation report · Languini v0.35.2

Opening-screen layout update: a panel-group wrapper anchors a taller Mr. Saymaz beside the setup card on desktop and landscape; portrait phones reserve a larger welcome area above the panel. The shortest phones retain a compact portrait to keep every choice visible. No gameplay JavaScript or scoring changes.

Rendered Chromium checks passed at 390×844, 360×640, 320×568, 320×480, 667×375, 844×390, 1366×768 and 1024×600: no horizontal or vertical overflow, Play button within the viewport, transparent image background and zero uncaught browser errors. Character heights are 599 pixels at 1366×768, 468 pixels at 1024×600 and 250 pixels in landscape-phone layouts. Screenshots were visually inspected. Evidence: source/validation/taller-owner-v0.35.2.json.

A 768×1152 WebP derivative supports the larger opening placement; total production artwork is 260,432 bytes across 11 variants. Original PNGs and smaller variants remain available.

The full 326-test result remains v0.35.0 evidence; that suite was not rerun for this opening layout change. The build's protected-curriculum gate and source/runtime hash verification run again for this release.

## Previous validation

# Validation report · Languini v0.35.1

Presentation-only correction: remove the opening character’s CSS background, border, shadow and rounded crop. Image files and gameplay code are unchanged.

Rendered Chromium checks at 360×640, 320×480 and 1366×768 confirm a transparent computed background, no background image, zero border/radius, no shadow, loaded artwork and no vertical overflow. Zero browser page errors. Screenshots were visually inspected. Evidence: source/validation/transparent-opening-v0.35.1.json.

The v0.35.0 result of 326 passing automated tests remains historical evidence; that full suite was not rerun for this CSS-only correction. The build’s curriculum-preservation gate and source/runtime hash verification ran again for v0.35.1.

## Previous validation

# Validation report · Languini v0.35.0

Based on the supplied Languini-v0.34.0.zip (SHA-256 `5378fddf7ac7d0f172fdc6eea86683b05ba3f41262ecdc416c3d137342f12a02`). This release adds character presentation and optimized image assets.

| Check | Result |
| --- | --- |
| Complete automated suite | **326 passed**, zero failures, cancellations or skips. 220.886 seconds. Evidence: source/validation/automated-tests-v0.35.0.txt. |
| Character regressions | Seven focused tests cover saved first use, manual reopening, pause/camera timing, repeated mistakes and recovery, Quiet mode, cooldowns, blocked storage, reset behavior and task-specific instructions. Passed again after final text/asset mapping changes. |
| Browser rendering | Headless Chromium with software WebGL. Opening layouts checked at 320×480, 320×568, 360×640, 667×375 and 1366×768; station gameplay checked at 390×844. Zero uncaught page errors. The smallest layout was adjusted and rechecked: scroll height equals 480, no horizontal overflow, header and Play button visible. |
| Interaction | Guide button passes a browser hit test; Help opens/dismisses; Hint selects the thinking pose; a correct menu pair still becomes matched through actual button clicks. |
| Lifecycle | A temporary QA-only build exposing private app getters confirms repeated errors select thinking, successful retry selects encouragement and completed-shift presentation loads celebration. No test getters ship in source or runtime. These checks do not represent an organically completed physical-device playthrough. |
| Loading | The initial 360-pixel opening requested only the small welcoming variant among character assets. Other poses load on use. Ten production variants total 175,762 bytes. Every derivative preserves alpha; originals are retained in source/artwork/originals. |
| Curriculum | Thirteen protected curriculum files, 44 units, 3,033 tasks and 531 conversations remain unchanged. The build runs the preservation gate before and after bundling. |
| Source/runtime integrity | Build-generated hashes and fresh-extraction release verification are included. Ready runtime is at the ZIP root, editable source in source/. |
| Limits | Physical iPhone/Android testing and real mobile-network latency were not measured. Browser geometry checks use software WebGL. Earlier version validation remains below as historical evidence. |

## Previous release validation

# Validation report · Languini v0.34.0

Built directly from verified v0.33.0 (SHA-256 38b227793e78864c0d6606e8ed137058d8620849d93b9593bf4bc4eb2d8d1dae). All 324 baseline source fingerprints were verified before editing. The requested v0.26.0 rollback lineage is preserved.

| Check | Result |
| --- | --- |
| Complete suite | **319 passed**, zero failures/cancellations/skips; 222.187 seconds. Evidence: source/validation/automated-tests-v0.34.0.txt. Sequential workers with a 512 MiB heap. |
| Preparation reveal | Turkish is absent before the correct complete English sentence, including hints and incorrect/partial ordering. It appears for 2,000 readable milliseconds before new ingredients. All three phases retained. |
| Reveal protection | Pause/tab changes, camera readiness and requested audio hold the reveal timer. Rotation preserves its remaining time. Native-control tests check no premature ingredient transition and exactly one completion. |
| Washing | All 44 units × two difficulties × three venues: 264 routines with 3/6/9 sentence plates, reviewed source identity, no consecutive duplicate answers, unique answers until the available pool is exhausted, protected world state and one physical batch commit. |
| Venue complexity | Diner requires menu, ticket, preparation and checkout; Bistro also has greeting/final conversation and two menu/ticket/checkout rounds. Menu sizes, two-item Bistro listening, larger sorting packs and 1/2/3 ordinary delivery parcels are covered. |
| Resource protection | Early rounds do not advance the route, pay another station reward, consume more stock, begin cooking or finish a delivery. Final rounds commit once. Washing never pays currency. |
| Retained gameplay | Tap-to-fill/automatic tickets, sequential arena locks, repeated tab-return Resume, three preparation phases, customer reviews, shorter printed checks and delivery proportions pass. |
| Complete services | All 336 Live Kitchen + 792 legacy + 48 guidance service simulations retained: 1,176 total. Simulated answers do not certify classroom pacing. |
| Curriculum and saves | Thirteen frozen curriculum files remain byte-identical; all 44 units and 3,033 tasks retained. No new assessed examples; save identity/schema unchanged. Units with fewer than nine distinct sentence answers revisit reviewed sentences after exhausting the pool. |
| Build/package | Runtime/source hashes, relative entry assets, ZIP integrity/safe unique paths, protected bytes and fresh extraction are checked before release. Ready runtime at ZIP root; editable source in source/. |
| Device limits | Real phone touch, rendered-browser appearance, GPU performance, installed voices and classroom pacing remain device checks. Native-control/geometry/font tests do not substitute for a device visual pass. |

Final evidence ships in source/validation/. Trial failures are excluded from final evidence. See MOBILE-PLAYTEST.md for focused device checks.
