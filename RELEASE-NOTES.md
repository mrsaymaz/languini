## v0.58.2 · English stays English

Browsers no longer offer to translate the game. The game page and the phone preview mark themselves as not for translation (translate="no" and the notranslate class on the page and its body, plus Google's notranslate meta tag), so Chrome, Edge and Safari do not show "Translate to Turkish" and Google Translate leaves the English questions and answers alone. A test fails if any of these markers is removed. Phone cameras, other devices and translation typed by hand cannot be blocked by a web page.

## v0.58.1 · Task cameras find the guest

Fixes tasks that could not be finished because the camera pointed at the wrong place. When a student opened a guest's order before that guest had finished walking in, the menu tablet and conversation close-ups were framed on the spot where the guest was mid-walk; the guest then sat down and the camera kept looking at the floor or a wall, with the answers off screen. Opening a task now seats its guest first, so the close-up is framed on where they will stay. This only happened with motion switched on; Reduced motion already seated guests at once.

On laptops a kitchen sign could stay over one answer for a moment after a recipe opened on a slow frame. The kitchen signs now hide as soon as any task opens.

## v0.58.0 · A clearer low-poly overview

During a shift the restaurant now reads as the centre of the scene. The overview uses a stronger sun and a quieter sky light, so the tops, sides and shadows of the low-poly furniture, counters and characters separate; close-ups and the opening film keep their existing lighting. Floor tiles in all three venues sit a step below the cream furniture and pavement, so tables, guests and the chef stand out from the floor. Distant shops fade towards the colour of the day's weather and no longer cast shadows, so on wide screens the restaurant is the sharpest thing on screen.

The large sun now appears only above the setup view; during a shift it covered the kitchen shelves, and the window suns and floor beams already show the morning. Exterior clouds are faceted, lit and float above the trees instead of cutting through crowns and walls. Window sunbeams fade away from the window instead of ending in hard edges. No new lights, textures, downloads or scene objects are added.

## v0.57.0 · Fairer answers, a food critic and clearer phone screens

**Answers that need reading.** In 429 of the 921 conversation questions, the right reply was the only option that repeated the question's words, so a student could match words instead of reading. Each of those questions now has three new wrong replies that use the same topic words but state a wrong fact or answer a different question (when, where, who, how many, yes/no). Opinion questions only use the second kind, so no wrong reply could also be a true answer. The right replies are unchanged. The new replies are listed in content/reviewed-distractors.json, the build applies them, the curriculum preservation check allows exactly these changes, and a new test fails if any shown set of options gives the answer away again.

**Food critic.** Every normal shift has one food critic: the first ordinary dine-in guest after the opening order. Their ticket and table label show a Critic badge, and they say their rule when they arrive. If every English task for them is right first time without a hint, they give three stars in every category and their review counts three times towards the restaurant's reputation. Otherwise their review counts once, as usual; there is no penalty. The results screen says how the visit went. Demonstrations and the phone preview never bring a critic.

**Phone screens.** On touch screens the kitchen ticket and Find-the-mistake screens use text up to 24px (was 18px) and place the sentence and its answers in the lower part of the paper, within thumb reach. Portrait phones start each live shift at 140% zoom and the camera follows the chef; pinching, dragging or zooming hands the camera to the player, and Reset returns to following. Desktop keeps the whole-room view. See CAMERA-CONTROLS.md.

**Plainer words.** The kitchen status reads "Hands empty · 3 clean plates · 0 to wash" and "Carrying Table 1’s tray to Cook"; tickets show "0 of 2 steps"; phone hints name the task ("Pick the missing word.", "Find the mistake.") instead of "Use the highlighted controls." Team names in the Ulti dialog now meet contrast guidelines (Hufflepuff 2.3:1 → 5.2:1).

## v0.56.0 · Ulti points join the English League

Won shifts now add Ulti to the student's grade/team pool in the English League, alongside Tower Swarm, Wordramp and Growbloom (League game id `languini`). A shift asks the League for a ticket when it opens and claims it after a win; the League decides the points from restaurant and pace, and the game never sends a points value. Only won shifts with at least 60% first-try accuracy on Relaxed or 75% on Challenge are claimed; a win below the rule says why on the result screen. Offline wins wait on the device for up to 47 hours and are sent on the next launch or win.

The setup Ulti button shows the team's live League points for the lesson's grade, and its dialog lists all four team pools with Battle Arena strength and the League's rules. The result screen reports "+N Ulti for Grade g Team!" or the League's reason (daily limits, too fast, not switched on, saved offline). The browser-only Ulti ledger is retired: old saves drop it without changing runes, stars, reputation, purchases or unlocks.

`config.js` holds the League address; `ultiApi: ''` makes a practice copy with no Ulti button and no network requests. The phone preview never contacts the League. Add the `languini` line from ULTI-POINTS.md to the League's Apps Script before students play.

## v0.55.0 · A neighbourhood around your restaurant

All three venues now sit in a small street scene with paving, an open entrance, menu/hours signs, two entrance planters, an exterior collection hatch and awnings. The Café gains flower boxes, a bench and bicycle; the Diner gains enamel frontage and roadside details; the Bistro gains a planted timber terrace, linen-style table and brass entrance details. Neighbouring shops, trees and low walls give wider screens depth while phones retain the near scenery and omit distant shop geometry from rendering.

Reputation repairs cracked paving and faded finishes, improves plants and signage, then adds one waiting customer at 4.0 stars and two at 4.5. Existing guests visibly approach, read the menu and enter or wait beneath the collection awning. These are presentation sequences; they never delay task availability, change patience or add orders. English tasks settle arrivals immediately, pause freezes them, and Reduced motion uses the destination directly. The existing story-to-first-guest handoff stays settled.

Rain adds wet paving, small puddles and a bounded awning-drip buffer; morning gets baked tree shade and evening gets warm entrance pools. Scenery batches by shared material, signs share one generated atlas, and no downloaded media, extra dynamic lights or new animation loop are added. The room camera scale, furniture paths, sentence blocks, rewards and Ulti ledger remain. See NEIGHBOURHOOD.md.

## v0.54.0 · A simpler opening panel

Restaurant options lead into the selected grade/team’s Ulti pool, then Team, Lesson and Pace. Shop and Open café share a row; Design sits at the bottom. Compact portrait layouts retain comfortable touch targets, and short landscape screens scroll within the setup screen. Pass & Play and its role prompts are removed, including from older saved settings. Character dialogue, guidance and accessibility labels now use Chef. Creator credits are unchanged. See OPENING-LAYOUT.md.

## v0.53.0 · Connected task colours

Stable table colours connect tickets, tasks, cooking, collection and serving on desktop, tablet and phone. Takeaway is violet, washing blue and supplies ochre. Text labels accompany colour. Food and crates have matching small tags, and routes match the active job. English reading surfaces, correctness feedback and team colours remain separate. Phone headers retain the table badge during expanded guidance, and stored-item aliases count only once. See TASK-COLOURS.md.

## v0.52.0 · Clear phone actions

The phone dock now shows one next action such as Cook, Serve T1 or Restock. Hold and Return are removed from phone controls; other available jobs remain at their locations. Selecting a different job safely walks the chef to the holding counter or serving pass before continuing. Stored trays/crates have individual Collect badges, full counters can swap trays safely, and unavailable jobs are not offered as location buttons. Desktop retains the explicit station dock. English completion, rewards, stocks and plate conservation remain governed by the ordinary model commands. See PHONE-ACTIONS.md.

## v0.51.0 · Phone field-test repairs

- Light mode retains antialiasing and shared material lighting at a sharper bounded resolution. Dynamic shadows stay optional.
- Phone task signs sit near useful restaurant locations, group shared work and route through the real kitchen command. Their placement avoids other signs and camera controls.
- Preparation prioritises the plated meal, with a compact meaning strip and readable ingredient papers, including their shuffled phrases. Existing phases and reading time remain.
- Dialogue topic and question stack correctly; native text no longer inflates or collapses into a letter-wide column.
- Compact phone headers, dock verbs, notices and reviews; review placement avoids actions. A fixed clipped root prevents the whole game scrolling away after task focus.

## v0.50.0 · Touch feedback, expressive guests and restaurant finishes

- Clear selected-object lift and destination outlines. Delivery stickers settle into place or return smoothly, including the tap route. Washing highlights touch ownership without revealing answers.
- Guests browse menus, chat, glance toward the kitchen, check a watch or raise a hand at lower patience. English tasks and explicit reactions take priority; Reduced motion stays calm.
- Cafe light wood/olive, Diner teal enamel/rust upholstery and Bistro walnut/linen/brass. Glazed crockery, satin metal, softly woven fabric and plate/character contact shadows share bounded local resources.
- English close-ups use common neutral lighting. Approved movement routes, readable sentence papers, existing language checks and rewards remain.

## v0.49.0 · Satisfying food preparation

- Broth, yoghurt, cream, honey and dressing fill the receiving dish under a short pouring stream instead of flying in as solid discs.
- Salad leaves and loose toppings tumble as individual components. Shared geometry and instanced rendering keep the transient effects small.
- Sandwich, burger and pancake layers land and settle gently. Hot bread and broth release short steam wisps; crunchy ingredients give a restrained crumb response.
- A completed sentence reveals the canonical neat food model and a brief highlight along the vessel rim. The final phase gives warm dishes a last steam release.
- The drop caption yields between accepted placements so it does not cover the food; selecting the next ingredient restores it. The full drop target stays in place.
- Sentence papers and the existing board/plate layout remain readable and retain their sizes. Correct placements do not lock out the next ingredient.
- Rotation restores accepted food immediately without replaying the effects. Pause freezes effects; Reduced motion settles directly. No extra textures, downloads, English tasks or rewards.

## v0.48.0 · Bounded camera and off-screen activity

- Restaurant overview zoom ranges from 90% to 125% on desktop and phones. Mouse wheel, accessible −/+ controls and phone pinch gestures share the same limits.
- Drag empty floor to pan at closer zoom. Short taps keep normal walking/table interactions; a pinch or cancelled gesture never issues a walk. Panning stops at the room boundaries.
- Reset restores the original view. Phone controls collapse behind the camera button, with a quick reset after changing the view.
- Off-screen activity uses plate, customer, takeaway-bag and crate marks, directional arrows and grouped counts. An urgent order gets a brief amber pulse, disabled for reduced motion.
- Tapping a mark reveals its location without taking an action or starting an English task. Marks clear when visible or resolved. No automatic camera jumps.
- Camera controls and marks are hidden during English, pause, setup and story scenes. The chosen room view returns after a task; a new shift begins at the default view.

## v0.47.1 · Larger desktop restaurant

- Desktop service views at 1024×600 and above reclaim unused vertical margins around the room. The restaurant appears about 34% larger at 1366×768, 55% larger at 1024×600 and 20% larger at 1920×1080 or 2560×1080.
- The 60° pitch, 15° yaw, restaurant layout and walking distances stay consistent. Kitchen, tables, entrance and takeaway remain in view, clear of the persistent HUD.
- Phone/short-window, opening and non-kitchen overview poses exactly match v0.47.0 fixtures. English close-ups retain their own camera.
- Added projection and framing regressions; native desktop order selection opens a language task and returns to the same room view.

## v0.47.0 · Grade/team Ulti pools

- Earn 4/8 Ulti for Cafe, 6/12 for Diner and 8/16 for Bistro in Relaxed/Challenge after a successful full shift.
- Sixteen independent grade/team pools, shared across that pool's lessons and restaurants. Each award expires exactly seven days after crediting.
- Setup balance button, dated award dialog and end-of-shift reward display. Ulti is separate from the rune shop and cannot be spent here.
- Unique shift receipts prevent duplicate credit after callbacks, reload and expiry. Failures, abandonment and previews award nothing.
- Backward-compatible local saves and merging of valid Ulti receipts from older open tabs. Read-only snapshot prepared for a later external connection; no integration is contacted.

## v0.46.2 · Stable language menus

- Consecutive menu and takeaway rounds keep the same settled screen camera, so the task never fades to a background menu between pages.
- Removed the duplicate painted menu from native tablet screens. Embedded listening confirmation leaves the native screen in control.
- Retained the arrival animation and input lock when moving to a different guest or station.
- Added regression coverage for consecutive rounds, camera/input readiness and refreshed answer controls. Curriculum wording and answer keys are unchanged.

## v0.46.1 · Stable opening and prominent weather

- Cached opening café with a stationary camera; no repeated guest/food/roof animation or backdrop blur behind setup. Static shadows render once.
- Lightweight phone/desktop sky makes sunshine, clouds, rain and warming evening lights visible above the setup panel. Rain is masked out of the café interior.
- Stronger floor sunlight, 240 exterior rain streaks and warmer dusk lamps during gameplay, with neutral weather-free English close-ups.
- Lesson and Pace changes reuse unchanged scenery instead of rebuilding it. Evening headings retain readable contrast.

## v0.46.0 · Distinct arrangements and visible weather

- Three new floor plans: Window café, Dining clusters and Takeaway first, including oriented furniture and matching guest/camera positions.
- Chair-aware navigation and previews with actual entrance, table and collection routes; decor placements checked across 864 configurations.
- Clearer sun, clouds, exterior rain, wet pavement/ripples and dusk lighting with a lit evening entrance. Weather stays out of English close-ups.
- Quiet layered café/weather ambience, sparse soft details, immediate speech ducking and a saved ambience volume control under settings.
- The opening guest now enters via the current seating approach and reaches the rotated chair correctly.
- Existing campaign identities, curriculum and answer validation retained.

# v0.45.2 · Answer visibility and validation

- Fixed a legacy full-row sticker rule that pushed the third answer outside the measured delivery manifest. Native labels now use explicit cells from the fitted grid.
- All displayed answer choices stay in the model's planned rows, including long labels, three-column layouts and four-choice tasks.
- Incomplete or stale cached choices are rebuilt from the current task before rendering.
- Added a build gate for complete, unique answer keys and sentence reconstruction across all 4,805 activities.
- Added language/generator regression checks and a reusable real-browser audit for all 1,841 delivery-label activities across both paces and eleven screen sizes.
- Original curriculum wording and answer keys remain intact. The reported clue correctly means chess club.

# v0.45.1 · Cleaner panels

- Removed repeated setup forecasts, save/version footers, design introductions and status explanations.
- Kept short choice descriptions, capacity changes, locked-restaurant requirements and active English instructions.
- Added optional Shift details and Display & guidance sections. Help now has three concise steps with expandable controls/design guidance.
- Retained one-line lesson descriptions; longer subtheme lists are available through Show topics.
- Shortened shop and service-offer copy while retaining costs, bonuses and the optional goal change.
- Quieted repeated kitchen hints after first use; blockers and requested guidance remain visible.
- Preserved existing content, save identity, timing, task interactions and all v0.45 gameplay.

# Languini v0.45.0 — Design your comeback

Adds a between-shift design studio with validated table arrangements, functional counter configurations and earned decoration choices. Reputation recovery now changes upholstery, foliage, crockery and the entrance, culminating in an outside queue. Breakfast, rain and evening atmospheres connect light, local ambient sound and customer greetings.

Normal shifts gain a connected optional episode: pickup demand → last bag → supplier offer → checked delivery and Pantry deposit → optional two-meal collection order. Declining retains the original goal; accepting updates it visibly and uses real preparation, service and label checks. Existing special events and protected English time remain intact.

Required number practice remains four pairs in Relaxed/eight in Challenge. Later pickups add names, quantities, times or packing instructions. Packing uses one current request and four stable bag choices to keep compact phones readable. Touch drag labels, selected ingredients, destination vessels and checkout correction gain clearer focus.

Existing save IDs, curriculum bank bytes, three preparation phases, six-block support, full-size plate, cinematic introduction, owner art, Chef’s Seal, reputation and review rules remain compatible. No external weather, sound, model or assessment-content requests are introduced. See CAFE-EVOLUTION.md and VALIDATION-REPORT.md.

## Earlier release notes

# Languini v0.44.0 — Character, food and main-station detail

- Refines the playable Mr. Saymaz while retaining his proportions, face, rig, carrying/reaching poses and opening-scene acting. Adds smoother head/hands/hat, shaped hair locks, jacket and apron stitching, pocket tools, trouser seams and layered shoes. The jacket uses the existing shared linen finish.
- Refines all nine dishes and all 81 ingredient layers: smoother vessels and fruit, curved leaves with ribs, finer pasta and mushroom forms, banana seeds and subtle baked bread variation. Shared material batches keep toppings from adding individual draw objects.
- Refines working fixtures with rounded edges, hob supports, oven knobs/vents, curved sink tap/drain and till bezel/drawer details. Fixed till components are batched while its live screen stays independently controlled.
- Keeps the restaurant layout, station elevations, full-size plate, six-block preparation space, task/control geometry, curriculum, opening soundtrack, owner artwork, logo and saved progress compatible. No model, texture, audio or network asset downloads added.
- Includes new regression checks for rig compatibility, exact serving footprint, all ingredient-layer budgets/cache ownership and whole-room geometry budgets. Physical-phone performance remains a device-testing task; automatic Light quality and frame-budget fallback remain active.

## Earlier release notes

# Languini v0.43.0 · Bring it back to life

The 32-second opening now uses specific acting: the owner straightens the old sign and looks back, hands over the keys, softens at Mr. Saymaz’s promise and leaves. The chef touches a sticky table, tests both machines and prepares to work.

Grime clears directly behind the broom and cloth. A dusty photograph is introduced early, cleaned, studied and straightened. Repair panels close before the cooker lights and checkout responds. Compact subtitles free the portrait scene, and gameplay instruction signs hide during the film.

The original music repeats an unfinished motif at the photograph and resolves it at reopening. A quiet pause gives the first customer’s bell space; the chef turns and smiles before the camera settles into gameplay. Pause, Sound, Continue, Skip and Help replay remain available, with compatible saved progress and no extra media downloads.

## Previous releases

# Languini v0.42.0 · A promise, a fresh start

The opening becomes a 28-second story with closer phone framing: the quiet café, the previous owner’s farewell, Mr. Saymaz’s promise, individual views of the problems, a cleaning and repair montage, and the first customer arriving. A restored café photograph remains in the restaurant during normal gameplay.

An original locally synthesised score moves from sparse piano-style notes to soft bass and brushes. Keys, cleaning, repairs, equipment and the doorbell have timed sound effects. The scene includes a direct sound toggle, captions, Pause, Continue, Skip and Help replay. Audio follows pause/backgrounding and stops or fades into gameplay. No extra audio or video downloads are needed.

Saved reputation, named reviews, takeaway practice, curriculum and existing progress remain compatible. Previously completed introductions stay completed; use Help → Replay to see the refined opening on an existing campaign.

## Previous releases

# Languini v0.41.0 · A fresh start

Take over a café with a 2.10-star average from 150 inherited reviews. The first-opening scene shows a handover with the elderly owner, inspection, cleaning, equipment repairs and reopening. Skip, Pause, Continue and later Replay are available.

The existing three-category review card now leads to a named five-star rating reveal, with celebrations strictly above four and a special perfect-five treatment. Reputation persists across units and paces for each grade/team/restaurant. Shift results show before/after, review count, shift average and progress toward five story milestones, with owner reactions and later cosmetic recognition.

Every regular shift includes a takeaway order, ordinarily number four. The Café/Bistro event cycle no longer excludes takeaway. Four-pair Relaxed and two-set/eight-pair Challenge practice retain the full 0–200 range.

See REPUTATION-STORY.md and VALIDATION-REPORT.md.

## Previous releases

# Languini v0.40.0 · Takeaway number labels and raised preparation

The food-preparation close-up is raised slightly above kitchen props. Board dimensions, the full-size plate and the existing six-block ingredient area stay the same.

Takeaway collection now requires numeral-to-English matching from 0 to 200 inclusive. Relaxed uses four pairs. Challenge uses eight different pairs in two sets of four; the first set does not release or reward the order. The activity runs on the pickup counter, with free hints/readback and a direct preview for both paces.

See TAKEAWAY-NUMBERS.md and VALIDATION-REPORT.md.

## Previous releases

# Languini v0.39.0 · Restaurant layout and portrait overview

Reorganise the restaurant into a back kitchen, two table columns around a clear central aisle, separate dish-return sink, and entrance-side checkout/takeaway counters. All three venues retain their existing table capacities and progression. Furnishings, navigation, station approaches, held/cooking/pass dishes, plate stacks and steam share the same plan.

The room camera now looks down 60 degrees with 15 degrees of side rotation and fits the portrait play area around the controls. Preparation retains its original close-up dimensions, full-size plate and up-to-six-block layout. Other work surfaces retain their native controls and task-specific framing.

See RESTAURANT-LAYOUT.md and VALIDATION-REPORT.md.

## Previous releases

# Languini v0.38.1 · Preparation space correction

Four to six sentence blocks now use the existing ingredient area. The board, recipe note and receiving plate retain the original three-block station dimensions and placement. Portrait layouts use the spare row; compact screens share the available rack width between shorter and longer labels. The full-size main plate remains unchanged.

Grammatical boundaries, three preparation phases, washing, curriculum and saved progress remain as in v0.38.0.

## Previous releases

# Languini v0.38.0 · Grammatical sentence blocks

Sentence boundaries now follow Subject + verb group + indirect object + object/complement + place + time where applicable. Complete subjects, noun phrases, auxiliaries and time expressions stay together. All 1,520 sentence activities have explicit reviewed boundaries; 534 arrangements change. Sentence wording, translations, answers and activity IDs remain unchanged.

Preparation and washing use the real block count, with three to five blocks in the current bank. Five- and six-block fixtures verify native controls, rotation, complete-sentence gating and phone layouts. The three food phases, nine canonical final meal components, plate routines, rewards and saved progress retain their behavior. Text fitting prefers intact words when a supported readable size can fit them.

See SENTENCE-BLOCKS.md for the rule, examples and authoring workflow. The complete teacher-review table is in source/validation/sentence-block-review-v0.38.0.tsv.

## Previous releases

# Languini v0.37.0 · Expanded language banks

The four newly supplied grade banks extend the existing 44 units with 1,772 activities and 44 delivery-sorting packs. The import links 516 repeated practice records to existing tasks, maps colliding source IDs by meaning, and shows included subtopics in the lesson picker. All 3,033 original activities remain unchanged.

Longer sentences keep all source words in three preparation blocks. Completion halves become sentence assembly because supplied wrong endings can produce valid alternatives. New picture words join vocabulary and use existing local artwork where available; drawing descriptions are retained as references. No new illustration files were supplied.

Conversation options stay within the source section and avoid compatible answer functions; synonymous vocabulary options are filtered. Source sentences without Turkish use English readback after success. Existing saved progress, Chef’s Seal branding, taller transparent owner and restaurant/team/lesson/pace layout remain compatible.

Validation: 334 tests passed (240.459 seconds), final content regressions passed, and rendered Chromium checks passed with zero page errors. See LANGUAGE-EXPANSION.md for the mapping and reproducible import, and VALIDATION-REPORT.md for evidence and limits.

## Previous releases

# Languini v0.36.0 · Setup panel and lesson picker

Reorder opening choices to restaurant, team, then Lesson beside compact Pace. Replace grade/unit dropdowns with a grade-tabbed lesson dialog containing all 44 named units and short descriptions. Unit selection saves grade and unit together; cancelling preserves the previous lesson. Keep the selected logo, taller owner, venue locks and gameplay.

See SETUP-LESSONS.md and VALIDATION-REPORT.md.

# Languini v0.35.3 · Chef’s Seal branding

Add the selected transparent Chef’s Seal title to the opening screen and its compact plate-and-utensils emblem to navigation, favicons and home-screen metadata. Responsive placements preserve the taller owner and all setup controls. See BRANDING.md.

# Languini v0.35.2 · Taller owner beside the setup panel

Move the opening character into a panel-anchored composition. Increase desktop height from about 40vh to 78svh (up to 640 pixels); add a larger portrait-phone welcome and side placement in landscape. Preserve transparent artwork and all controls. Add a 768-pixel WebP variant for the larger placement.

# Languini v0.35.1 · Transparent opening character

Remove the added dark background, gold border, shadow and rounded crop behind Mr. Saymaz on the opening screen, including compact phone layouts. Preserve the source image alpha and optimized WebP assets.

# Languini v0.35.0 · Mr. Saymaz character integration

- Integrate all six restaurant-owner poses into the opening screen, station Help/Hint, recovery, served milestones, help page and results.
- Add saved first-use guidance, manual reopening, Quiet mode, protected guidance time and no message backlog.
- Optimize source PNGs into ten WebP variants totaling 175,762 bytes; keep full originals in the source tree.
- Preserve the existing curriculum, restaurant progression, mechanics and saved rewards.

See OWNER-GUIDE.md and VALIDATION-REPORT.md.

# Languini v0.34.0 · Post-success meaning and venue progression

- Hide the preparation translation until the correct English sentence is assembled. Reveal it for two seconds before the next ingredients, preserving pause/audio/rotation time.
- Expand washing into 3/6/9 sentence plates for Cafe/Diner/Bistro, with visible plate progress and one final inventory/rinse commit.
- Add Diner order checks/four-pair menus and Bistro two-round menu/ticket/checkout tasks, richer conversation routes and two-item listening.
- Increase ordinary delivery labels to 1/2/3 by venue and grow sorting batches within each unit's reviewed data.
- Retain three food phases, native tap-to-send tickets, rewards paid once per station group, existing reviewed curriculum, saved progression and all recent presentation upgrades.

See VENUE-LEARNING-PROGRESSION.md and VALIDATION-REPORT.md.

# Languini v0.33.0 · Tap-to-fill tickets

- Correct option taps immediately fill the hanging table ticket's blank.
- Completed tickets clip and send automatically after the brief readback; manual placement and Clip & send are no longer required.
- Wrong choices remain answerable with existing feedback/scoring.
- Automatic send protects pause, camera readiness, replay and rotation, and commits once.
- Retains all v0.32.0 review-card, receipt, delivery, progression and preparation improvements.

See TAP-TICKET-FLOW.md and VALIDATION-REPORT.md.

# Languini v0.32.0 · 3D reviews and delivery polish

- Redesigned table reviews as six-sided 3D cards with ivory fronts, green backs, gold thickness, embossed stars and coordinated restaurant detailing.
- Added a smooth 1.05-second vertical-axis revolution, visible reverse, changing highlights/shadows and a late fade. Pause and Reduced Motion remain supported.
- Shortened every printed check's reading period by exactly two seconds; physical feed and automatic continuation stay intact.
- Removed surplus backing paper beneath delivery labels and enlarged the supply crate, while preserving label card dimensions and readable long definitions.
- Preserved sequential restaurant locks, tab recovery, three-phase preparation, curriculum, scoring and saved progress.

See REVIEW-CARD-POLISH.md and VALIDATION-REPORT.md.

# Languini v0.31.0 · Tab recovery, sequential restaurants and customer reviews

- Fixed the invisible pause-card animation that could block all clicks after returning to a tab. Resume stays visible; hidden time and interrupted camera/audio do not consume task time.
- Cafe wins unlock Diner; Diner wins unlock Bistro. Fresh/cached selection, start guards and phone previews share the same rule.
- Receipt paper emerges with an eased 850 ms cropped feed and full-size ink, pauses safely, and retains automatic protected reading.
- Seated customers eat, then show a table-anchored Taste / Service / Speed review with three stars per row. The card spins and fades before departure. Final results wait for the review.
- Ratings reflect all preparation phases, language service tasks, washing/dirty-dish cleanliness and task freshness. Reduced Motion removes the spin.
- Preserves the v0.26.0 rollback lineage, three plating phases, all reviewed curriculum and existing saves.

See CUSTOMER-REVIEWS-RECOVERY.md and VALIDATION-REPORT.md for exact behavior, verification and real-device limits.

# Languini v0.30.0 · Printed paper, restaurant unlocks and freshness

Checkout now hides the corrected sentence on the register and prints the complete correct English on paper beside it. Camera framing follows the external paper and preserves its protected reading interval, pause/audio/rotation gates and automatic completion.

Diner and Bistro are locked until one successful Cafe run. Existing Cafe wins count, old cached locked selections fall back to Cafe, and unlocks persist through the existing save records. A first win announces the two unlocked restaurants.

Task cards now have a shrinking circular freshness ring: green Great, yellow Good and red Late, with remaining seconds. Clocks run only while answers are available, pause for audio/camera/readback/pause and retain their remaining time through rotation. Every plating phase gets a new clock. Expired tasks remain playable. A small order tip reflects timing, separate from accuracy and base rewards, and pays once at handoff.

The three preparation phases, nine-component food, larger delivery crate, existing curriculum and save identity remain. See RECEIPTS-PROGRESSION-FRESHNESS.md and VALIDATION-REPORT.md.

---

# Languini v0.29.0 · Build, layer and finish

Preparation now has three phases with three different reviewed sentences and nine ingredient groups. The earlier food stays on the dish; the final phase adds recipe-specific finishing details. Headings and progress identify all three phases. Cooking, stock, plate allocation and task reward still commit once, after completion.

All nine canonical foods are more detailed: layered sandwiches/burgers, topped soups, richer bowls, creamy vegetable pasta and finished fruit pancakes. Hand gestures distinguish spreads, pours and garnishes. Shared geometry remains consistent through the pass, carried tray and served meal, with complete material batching.

The label activity gets a substantially larger crate and correctly proportioned drop target. Its portrait bay / landscape column preserves the fitted word choices and their touch size. Ordinary bay decorations are removed for clarity; the sorting layout is retained.

This extends v0.28.0 and preserves its v0.26.0 rollback lineage. v0.27 rush systems remain absent. See THREE-PHASE-PREP.md and VALIDATION-REPORT.md.

---

# Languini v0.28.0 · Two-phase plating

This release starts from the exact v0.26.0 ZIP, independently of the v0.27.0 source.

Every preparation encounter now has two sentences with three ingredient blocks each. The first completed sentence stays plated while a different reviewed sentence from the selected unit brings three new ingredients. A clear Build / Finish heading marks both phases. Cooking and the order route advance once, after phase two; the meal reward is awarded once. Learning records assess both sentences.

All nine dishes use six ingredient groups. The canonical food model is shared with the cooking station, carried tray, pass and served meal. The white ceramics, restaurant identities, British male / American female voice preferences, automatic printed receipts and v0.26 motion remain. Pass models are created when ready rather than prebuilding hidden dishes.

Tap, drag, wrong-order recovery, pause, requested audio and rotation remain supported. Washing remains a single sentence. v0.27 task rush systems are absent.

See TWO-PHASE-PREP.md for behavior and VALIDATION-REPORT.md for current checks and device limits.

---

# Languini v0.26.0 · A livelier cafe

Camera transitions gain smooth acceleration and a restrained lifted arc; the venue/service opens with a short reveal, and the setup background drifts slowly. Setup cards and selected emblems respond briefly. The camera settles exactly before English controls unlock; task views remain steady.

Food preparation adds higher ingredient drops, a reusable rim/landing ripple and a small final plate settle. English answers, matching pairs, repaired words and completed tickets receive brief ink/edge confirmation without moving their text. Washing adds two figure-eight sponge strokes, a drawn connection, a finite rim rinse and staggered clean glints. Stationary SVG connections no longer rebuild every frame.

Pause, reduced motion, restored progress, resource disposal and one-time completion remain protected. No new lights, remote assets or post-processing pass. See MOTION-DESIGN.md for scope and VALIDATION-REPORT.md for evidence and real-device limits.

---

# Languini v0.25.0 · Three growing restaurants

The game and restaurant are renamed Languini. Languini Cafe, Languini Diner and Languini Bistro grow in physical floor area and walkable space, with distinct palettes, garden/booth/formal furniture, linen, sideboards, flowers and brass chandeliers. Phone overview framing follows the venue, while kitchen/table/pickup anchors and independent station cameras retain their tested positions. Stable save IDs preserve progress and purchases.

Male customers now request recognized British English male voices, with natural/enhanced choices preferred and Fred excluded. Female customers retain American voice preferences; missing suitable voices use written support.

The printed Languini check shows the full corrected sentence beneath a clear label, with larger fitted type and 2.4–5 seconds to read before automatic continuation. Pause, camera readiness, speech, rotation and one-time completion protections remain. No collection button is required. See LANGUINI.md and VALIDATION-REPORT.md.

---

# Rune Bistro v0.24.0 · One coordinated restaurant

Setup, menus, tickets, shop and controls share ivory paper, sage enamel, brass edges and one SVG line-icon family. Dedicated sink, prep, pantry, counter, warmer, trolley and arena icons replace generic stand-ins. Tickets show meaningful state symbols; project cards show their three visible stages.

Feedback follows accepted work: hot broth/sauce and actual hot cooking jobs emit steam, bread layers release crumbs, washing leaves a short soap trail, and delivery approval stamps form on parcels. Pooled effects are finite, pause with the task, suppress motion when requested and avoid replaying success effects during restored progress. Geometry and instance buffers are released on task/world disposal.

The courtyard gains garden trellis/beds and sandstone variation; the city bistro gains teal joinery, café arches and parquet accents; the banquet hall gains fluted ivory columns, indigo drapery and brass floor inlays. Renovation stages add cart frames, manifest storage, striped awnings, cabinet joinery, tilework, plate cubbies and trolley rails. Equipped pantry, warmer, prep kit and welcome tea are more recognizable. Existing navigation, costs, rewards and save data remain.

Male speech stays American and excludes Fred, including the browser-default path. Natural/enhanced US alternatives are preferred; if suitable voices are missing, existing written support remains playable. See RESTAURANT-CRAFT.md and PLATE-VOICES.md.

---

# Rune Bistro v0.23.0 · Print, bubbles and better male voice selection

Print receipt is now the final checkout action. The paper feeds, displays its corrected sentence briefly and advances automatically, with pause, readiness, requested-speech and one-time completion protection. The Take receipt button and keyboard collection step are removed.

Washing adds twelve translucent rising bubbles, pale bubble rims and white glints. After the last dirt fade, a narrow light sheen crosses the shared white plate and three clean rim glints remain. Reduced motion and reconstructed completed plates show a static clean result.

Male customer speech now favors enhanced/natural/neural American personas and other modern English male alternatives. Novelty voices such as Fred are excluded; Alex and legacy David/Mark leave the rotation when another male persona exists. Actual selection depends on the device catalogue. Female voice profiles and speech-finish gates remain.

---

# Rune Bistro v0.22.0 · Matching plates and customer voices

The washing close-up now reuses the actual serving plate geometry and materials: ivory-white ceramic, a cream well and a fine brass rim. Shared baked vertex colors prevent the custom washing ceramic from rendering black. Existing scattered blocks, dirt, hands and cleaning feedback remain aligned.

All 24 customers have an explicit female/male voice preference. Speech now requests American English, recognizes common installed voice personas and varies voices consistently when several matching personas are available. The same customer preference follows automatic dialogue/listening, menu audio and requested pronunciation through pause and rotation. First-use voice discovery is cancellable and bounded. Missing device voices retain the existing written support and completion gates.

See PLATE-VOICES.md and VALIDATION-REPORT.md for verification and device limitations. The selected future visual upgrades remain future work.

---

# Rune Bistro v0.21.0 · A coordinated visual reference pass

Calmer room surfaces, a sage kitchen floor band, broad window-light accents and arena/task light profiles establish the new visual treatment. The chef gains a folded hat, stitched apron, shaped hands, walking legs and stable carrying arms. Customers gain independently blinking eyes, hair-matched brows, curved smiles, clothing detail and shared grip hands.

Preparation gains a slightly oblique compensated camera and a gripping hand/cuff/sleeve around the jug or utensil. Folded cheese, tomato interiors, toasted pancakes, syrup pools and ceramic rims remain consistent through serving. The meal now settles from the actual chef tray onto the table, with Pause/reduced-motion support and no game-state changes. Task close-ups hide room beams and the duplicate overview chef.

Verification uses sequential test workers, bounded scene identity diagnostics and a heap limit. The previous washing/menu/delivery/checkout improvements and all protected learning content remain. See REFERENCE-SLICE.md and VALIDATION-REPORT.md.

The next three selected upgrades are unified UI/icons, purposeful station effects, and distinct arena identities/visible renovations. These are not included features. Real browser/phone/GPU acceptance remains pending.

---

# Rune Bistro v0.20.1 · More space around washing blocks

Washing sentence blocks now use a looser left/right zigzag with wider, adaptive gaps. Short landscape uses separated columns with a slight vertical stagger. Dirt, food and sponge destinations follow the same positions. Tap/swipe behavior, shuffled order, accepted progress and readable touch areas are retained.

The existing all-sentence layout regression now also checks at least 14 pixels between every pair of targets across 15,444 measured states. Focused gestures, rotation, physical cleaning and 33 scene sightline cases pass. Real-browser/phone verification remains pending.

---

# Rune Bistro v0.20.0 · A close-up washing task

Sink now moves the camera into a close, oblique plate composition. A shaped ceramic rim, shallow well, sage sink, gripping hand and sponge hand replace the flat wooden activity board. Compact sentence labels sit above real food scraps and sauce patches. Correct connections animate the sponge, clear their own patch and raise soap bubbles. The accepted sentence remains below the plate, with a clear instruction above it.

Tap, continuous swipe and keyboard inputs keep the existing answer gate. Correct progress, shuffled order and physical cleaning restore after rotation. Wrong links keep earlier work, cancelled gestures create no extra attempts, and reduced motion finishes the cleaning feedback immediately. The batch rinse and protected English pacing are retained.

Three additional regressions bring the full suite to 252 tests. All 702 sentences pass the measured layout checks across eleven sizes/two fonts. Thirty-three arena/viewport scenes check composition sightlines and all 99 food/dirt patch sightlines. These are numerical/DOM/CPU checks; browser-rendered visuals, actual finger input, device voices and hardware FPS remain unverified. See WASHING-DESIGN.md and VALIDATION-REPORT.md.

Earlier records follow.

---

# Rune Bistro v0.19.0 · Connect, listen and pair

Sink now opens a reviewed sentence on a dirty plate. Tap or swipe the three blocks in order; correct links remove dirt and the completed sentence rinses the batch once. English time is protected, hints/playback remain free, accepted links survive wrong attempts/refits, and cancelled/second-finger/missed gestures do not create English errors. No separate washing currency payout.

Menus add Turkish→English and English-audio→Turkish matching to existing English→Turkish, local Fluent picture and one/two-word listening modes. Audio pairs wait for requested speech and reveal supported text if voices fail. Direct phone previews expose the variants. All words remain within the selected unit.

Delivery stickers now have measured, capped dimensions. Current sorting word/meaning text refits within its parcel label, including revealed Turkish support. Ten new tests bring the suite to 249 checks, including 15,444 wash layouts, 7,568 sorting states, 33 washing sightline cases, native tap/swipe/audio regressions and retained full-service coverage. Real-device/browser acceptance remains pending. See ACTIVITY-NOTES.md.

Earlier records follow.

---

# Rune Bistro v0.18.0 · Clear correction and readable receipts

Find the mistake now leads the register above the sentence, with a high-contrast step banner and a wavy underline on the word to inspect. The instruction changes through Find, Clear, Replace and Print. The student still chooses the correction; the automatic location cue is supported practice without a new English error or reward penalty.

The receipt is aligned to the tilted terminal, feeds from a fixed edge clear of the printer, and shows the corrected sentence in native text. It remains available until Take receipt, including after rotation. Collection waits for printing, pause recovery and requested playback, and commits completion once. Layout includes 5,698 receipt states plus the retained ticket/register measurements; receipt geometry has 27 arena/viewport sightline checks.

All curriculum files and save identity remain unchanged. Four new regressions bring the suite to 239 tests. Existing live service coverage remains 1,176 simulations. Real phone/browser acceptance is pending. A proposed short English activity per washing batch is documented in CHECKOUT-NOTES.md; the washing mechanic itself remains timed in this build.

Earlier records follow.

---

# Rune Bistro v0.17.0 · Clear kitchen guidance

The next kitchen action is visible before a click. A tappable sign, highlighted ticket and contextual primary button agree about the action, station and order. A leader/floor ring connects the sign to its real destination. Physical station labels, routes, brief floor-tap footprints, cargo destination text, specific walking feedback and inline blockers explain where to go and what happened.

First-use tips fade after successful actions and persist between services. Help/Pause offers first-use/every-action/quiet guidance and a restore option. Reduced motion removes cue pulses. Kitchen guidance disappears during English and never reveals answers. Curriculum, learning, wallets, progression, existing saves and v0.16 live-kitchen rules remain intact.

Nine new guidance regressions include 48 complete services driven by the contextual action, bringing coverage to 235 tests and 1,176 simulated services. Browser/device appearance and real play duration remain unverified; run MOBILE-PLAYTEST.md. No new dependency, external asset or public deployment.

Earlier records follow.

---

# Rune Bistro v0.16.0 · Live Kitchen

Normal service changes from an automatic station sequence to movement and job decisions. Tap a ticket or the floor to move the chef; carry prepared trays to cooking, choose which order to continue, hold work on Counter, collect and serve meals physically, deliver labeled supply crates to Pantry and wash reusable dishes. The trolley carries two real loads to their destinations, including shared-table orders. Ticket and carrying controls replace the old service markers during normal play.

English tasks retain full reading/listening time: kitchen simulation pauses while they are open. Free hints/Replay, all six station interactions, all 44 units, reviewed content, existing progression and saved wallets remain intact. Relaxed/Challenge travel allowance and arrival spacing accommodate the new actions. Warm v0.15 graphics are retained, with a clearer live-service camera and simulated chef/cargo motion.

226 automated tests pass, including 336 new live services plus 792 retained legacy services. Real phone play, rendered browser appearance, device speech, hardware performance and real duration remain pending. See LIVE-KITCHEN.md and VALIDATION-REPORT.md. No new dependencies/assets, public deployment or save-schema change.

Earlier release records follow.

---

# Rune Bistro v0.15.0 · Crafted bistro graphics

A graphics upgrade based on the complete v0.14.0 build. The simple low-poly style and existing gameplay remain intact.

- Shared baked form shading adds depth without a post-processing pass. It changes vertex colours, never interaction positions, normals, UVs or indices.
- Tuned key/fill/ambient light and a 128×64 procedural studio environment give satin ceramics and warm metal broader highlights. Light mode disables the environment; switching back reuses it.
- Calmer floor colours, perimeter inlays, table aprons, counter joinery, contact shading and arena-specific architectural details improve the restaurant composition without adding clutter to learning surfaces.
- Folded leaves, curved open pasta, profiled plates/bowl feet and bread details refine all nine meals. Prepared and served models remain consistent.
- Separate food roughness values and shared matte kraft/carton finishes clarify material roles. Customer eye highlights add a small expressive detail without a new material.
- A coordinated ivory/enamel/linen/brass interface skin covers setup, service, all six stations, shop and results. Existing text-fit and input geometry remain in control.
- Six focused graphics regressions join the existing suite. Regular restaurant graphs contain 209 / 258 / 297 mesh objects, preserving the existing <300 budget; these are CPU object counts, not GPU draw-call measurements.

All original curriculum, saves, purchases, free help, stations, teams, arenas, difficulty names, events and projects remain included. No external artwork, dependency, backend or publication is added. Actual rendered-browser appearance and device performance remain unverified; see VALIDATION-REPORT.md.

---

# Rune Bistro v0.14.0 · Service clarity and interaction

Based on the supplied complete v0.13.0 build. Its visual, learning, restaurant and progression systems remain included.

- Listening support no longer overlays Replay. Independent clue/replay areas are measured together with every choice and the confirmation action. Support space is reserved before a hint appears.
- A hinted clue and selected listening words survive a refit. Matching retains the selected first card and the original shuffled sides.
- Interrupted requested pronunciation is retained across rotation, pause and their combination. It restarts with the same text once the surface is ready; completed work waits safely for it.
- Service markers allocate unique positions rather than reusing the final occupied cell. Tall/crowded layouts switch to compact cards; short landscape separates service controls from the working region.
- Contextual guidance names a real table/pickup or supply action. Ready meals and committed destinations take priority, and final checks are distinguished from ready-to-deliver food. The suggestion does not mutate service state.
- Used preparation slips retain their sentence ink. General press feedback no longer replaces a management marker’s positioning transform. Accessible marker names now describe the actual guest, dishes and queue/check/delivery state.
- Eight new focused regression tests cover these behaviours, including 32,648 measured listening states and five variable-height signals across eleven layouts.

No curriculum or save-schema changes, new assessed examples, dependencies, downloaded artwork, backend or publication were introduced. Rendered-browser and real-device acceptance checks remain pending; see VALIDATION-REPORT.md.

---

# Rune Bistro v0.13.0 · by Mr. Saymaz

A complete local/static upgrade based on v0.12.0. The original six stations, curriculum, progression and save format remain intact.

- A shared material system adds subtle wood, paper and fabric maps, ceramic/metal contrast, economical contact shading and distinct architectural accents in the three arenas. Regular scenes stay within the existing mesh budget.
- The six stations and supporting screens use consistent paper/enamel finishes, non-colour selection/retry cues, a compact route and order numbers that stay attached to cooking jobs, meals and pickup parcels.
- Short-landscape ticket and checkout surfaces now use the available width. Stage-specific measured plans keep the sentence and mandatory action together. The clip retains an approximately 50-pixel touch height across screen sizes.
- Food and prep papers still move together. Preparation has stack/arrange/garnish/stir/spread/pour gestures; mushroom sauce uses cream. All nine completed prep meals match the served recipe geometry and layer positions, including rapid consecutive placements.
- Ordinary crates are open before answering. Six package silhouettes gain construction details. Sorting keeps a paper connection to the incoming parcel, and finished parcels carry their reviewed word tag.
- Cancellation explicitly releases pointer capture. Projected polygons reject unused corners around tilted landing targets. Native answers and automatic progression respect camera readiness; small viewport changes retain task presentation and accepted progress. Camera travel pauses service pressure.
- Disabled/unavailable/timed-out speech exposes written listening support, including both requested words. Voice-list failures settle safely, the watchdog cancels stranded utterances, and audio nodes disconnect after playing. Replay remains free. Instruction narration remains off.
- Light/Auto/Detailed graphics and reduced motion are selectable before service or while paused. Auto can lower graphics after sustained slow frames. Context loss shows a finite recovery/retry path, and unsupported graphics cannot lead into an unusable service.
- The equipment selection is visible before service. Extra pantry stock, a warming shelf, a preparation kit and tea have corresponding props. The existing bench and two-meal trolley retain their simulated capacity and committed handoffs. Event copy identifies the actual order, side and shared-table progress.
- The actual phone preview includes eleven relevant layouts through its size selector, a four-pair Challenge menu, ordinary labels versus sorting, all nine meals and existing event/equipment/project demonstrations.
- Ordinary builds no longer regenerate reviewed content to change a version stamp. Every release has source/runtime hash manifests and an extraction verification script.

**198 automated tests pass**, including the retained 792 service simulations. Thirteen protected source/data files remain byte-identical; the 44-unit catalog, 3,033 tasks, 531 conversations, 344 sorting cards and 44 supplemental dialogue links are unchanged. No assessed language was added.

**Pending:** rendered-browser and real-device visual/touch/speech/performance checks and measured service pacing. Automated layout/geometry checks cannot establish these. No screenshots or live deployment are claimed.

---

# Rune Bistro v0.12.0 · by Mr. Saymaz

The menu and kitchen have been rebuilt around the usable phone screen, with the paper-under-saucer preparation arrangement restored from v0.8/0.9.

- Matching, picture matching and listening now use one measured menu page. Every choice stays visible and retains its position during the round. Long English and Turkish labels wrap. Landscape menus use horizontal rows; quieter page furniture leaves more room for the actual words. Written picture fallbacks are measured too.
- The held tablet is inspected upright, with camera roll and framing calculated from its actual surface. Its proportions stay consistent across all 24 customer body shapes. Camera movement has a finite finish before controls unlock, and reduced motion remains immediate.
- Cream prep papers extend physically beneath three ingredient saucers. English sentence blocks are printed on the exposed paper. Dragging the food or paper moves the ingredient and paper together; tapping a block and the dish is also supported. Used papers remain beside their empty saucers. Short portrait screens use three compact placemats; standard portrait and landscape retain three side-by-side saucers.
- Soup, sauce and syrup use little ceramic source jugs. Only their food enters the meal, at the correct final scale. Food still settles into the dish, with bases and lids finished by the kitchen.
- Delivery stations now contain six representative package forms: taped box, folded sack, gable carton, produce basket, pantry tin and bakery bag. Sorting carries a physical parcel with its word label and leaves packages in the receiving trays. Appearance cycles independently of the correct category, and survives screen refitting. Pantry packages also appear in the restaurant overview.
- Every vocabulary/definition sticker fits on one manifest page. Drag from anywhere on the sticker, or tap it and the crate. The previous sticker-scroll/grip split is removed from this page.
- Guest questions and full-sentence replies use measured, non-scrolling layouts. The opening chooser is more compact on phones, with native grade selection and reachable sound, voice and help controls. The actual browser font is measured; a bounded live overflow audit can request a conservative refit.
- Compact recipe state is cleared when the next station opens. Sorting progress and package identity survive rotation. Matching hints highlight the relevant cards with a short footer clue, and listening captions leave replay touchable. Automatic instruction dictation stays off.

**185 automated checks pass**, including 792 complete service simulations. New measurement checks cover all 44 units, 702 sentence tasks, 1,277 vocabulary/definition delivery tasks, 531 guest prompts and 742 listening tasks at ten screen sizes using two measured font profiles. Tablet footprint checks cover all 24 customers at all ten sizes; 432 additional sightlines check the smallest portrait and landscape layouts. Interaction checks cover the complete four-pair menu, repeated taps, paper state, rotation, parcel placement, pouring scale and exact camera completion.

These checks use real Three.js geometry, numerical text layouts, DOM stand-ins and a renderer double. They do not verify actual browser rendering or finger interaction. Hands-on phone testing, device speech and weaker-computer performance remain pending. See MOBILE-PLAYTEST.md for the acceptance checks; this release is not a certification of those device results.

Extract the complete ZIP into a fresh folder, then open the root **index.html**. **phone-preview.html** has direct station demos. All 44 unit IDs, names and ordering, all 3,033 source tasks, 531 conversation prompts, 344 separate sorting cards and the browser save format remain unchanged.

## Rune Bistro v0.11.0 · by Mr. Saymaz

The restaurant interactions receive a material, motion and usability pass, with targeted repairs for unreliable buttons and draggable items.

- Preparation now uses a grain-textured wooden board, bevelled edges, saucers, a cloth place setting, utensils and paper tags tied to their ingredients. Tags lift with food, landing areas highlight before release, accepted food settles and missed pieces return smoothly.
- Tablet cards, printed paper, sorting trays, the order clip and register keys have distinct finishes, clearer selection, actionable feedback and readable touch targets.
- Drops consider the visible carried object as well as the fingertip. Hidden or scrolled-away targets cannot accept drops. A canceled touch or release outside the game safely returns the item. Window-level pointer cleanup covers capture failures.
- A drag suppresses only its own trailing native click. Fast next taps work, and preparation no longer imposes an input lock between ingredients.
- Short landscape screens have separate ingredient touch areas. Phone users can swipe delivery paper from sticker text, drag from a generous grip, or tap the sticker and crate.
- The sorting card and completed ticket grip now have meaningful tap actions. Dragging a ticket retains its pickup point. Printed headings leave space for the actual clip; new clear, replacement and print controls scroll into view. Keyboard Backspace/Delete clears a selected error, while Enter on a focused button keeps its native action.
- Old raycast screen buttons stay disabled behind native tablet and register controls, preventing mismatched or duplicate answers through bezels.
- Pausing during optional answer playback and completion cannot deadlock progression. Rotating during receipt printing preserves the finish and completes the order exactly once.

**165 automated checks pass**, including 792 complete service simulations. Twenty new checks exercise pointer capture and release ordering, compatibility clicks, immediate next taps, visible-object drops, clipped destinations, cancellation, landscape overlap, sticker grips, native keys, clip clearance and pause/rotation progression. These use real 3D geometry, a DOM stand-in and a GPU boundary double. Rendered-browser visual QA, real phone fingers, device speech and classroom-computer performance remain pending; browser automation was unavailable in this session.

Extract the complete ZIP into a fresh folder, then open its root **index.html**. **phone-preview.html** opens direct station demos. All 44 unit IDs, names and ordering, all 3,033 source tasks, 531 conversation prompts and 344 sorting cards remain unchanged. The browser save format is unchanged.

## Rune Bistro v0.10.0

This build replaces the bottom task sheet with interactions on restaurant objects, designed around phone screens.

- Actual food and its sentence label follow the finger into the dish. Wide ingredient rows, a side-by-side landscape layout and tap alternatives support touch play. Food appearance is independent of sentence order; bases and lids finish automatically. Missed placements cancel without recording an English mistake.
- Operate the customer's held tablet, the receiving manifest and bins, the hanging paper and the register directly. Ticket words are placed into the blank, then clipped. A corrected checkout now needs the register's print key and produces its receipt exactly once.
- Guest questions appear beside the face, with full-sentence replies near the player's side of the table.
- Automatic instruction dictation and answer readback are removed. Customer dialogue and listening remain. Free requested pronunciation or replay can hold advancement until it finishes.
- Phone protections include generous control heights, readable wrapping labels, scrollable surfaces, finger clearance, pointer capture, single-finger drags, cancellation on pause/lost capture, camera locking and orientation refitting that preserves task progress and choices.
- Tablet holding poses and inspection framing avoid guests and refurbished furniture crossing the controls. Enlarged ticket and register interfaces stay physically clear of the counter.

**145 automated checks pass**, including 792 complete service simulations. The new suite covers interaction paths, all 702 sentence tasks, six phone-sized layouts and 324 additional tablet sightline samples. Checks use real scene geometry, raycasts, interaction stand-ins and a GPU renderer double; hands-on phone/browser rendering, finger interaction, device speech and weaker-computer performance remain unverified.

Extract the entire ZIP into a new folder and open the root index.html. Use phone-preview.html for station demonstrations. All 44 curriculum unit IDs, titles and order, all 3,033 source tasks and the 531 conversation prompts remain intact. Existing browser saves retain their format.

## Rune Bistro v0.9.1

Fixed the restaurant being absent when opening index.html. The opening scene referenced the recipe list without importing it, so its first frame threw before the renderer could draw. Active-service simulations did not enter that menu-only path.

- Import the recipe list at the scene that uses it.
- Render the opening restaurant before declaring startup complete.
- Show a visible error and retry if a later animation frame fails.
- Add regression checks for local opening, arena changes, service start, return to setup, reduced motion, and first/later render failures. The checks run the real app, restaurant and camera with a test double at the GPU boundary.

**127 automated checks pass**, including all 792 complete service simulations. Hands-on browser/WebGL rendering, phone touch and device audio remain pending. Extract this entire ZIP into a new folder and open its root index.html. Existing browser saves use the same format; file-origin save access still depends on browser and folder location.

## Rune Bistro v0.9.0

Delivery sorting, varied service events, staged refurbishment and usable equipment are implemented in this local-launch build.

- New classification activity: 44 canonical packs, 344 bilingual cards, four/six labels per round, physical tray feedback, free clues, per-card support and separate classification review.
- Four rotating featured events: mixed delivery, optional extra side, numbered takeaway collection, and two distinct meals for a shared table. There is at most one event per shift, selected at a safe checkpoint, with all required play possible without equipment.
- Three projects with nine visible construction stages, service milestones, rune spending, three finishing choices and equipment unlocks. Progress and prior purchases are preserved per grade and team.
- A working auxiliary bench expands compatible preparation capacity. A two-place trolley batches real delivery handoffs. The basic restaurant has occupied work spaces and a safe queue; customers, runes and project progress update once when their meal arrives.
- Direct preview buttons for each event, both equipment pieces and renovation stages.

The original 3,033 bank tasks, 531 conversation prompts and 44 unit IDs, titles and order are unchanged. Newly curated sorting cards are reported separately. File-origin data and artwork stay embedded in the classic bundle; extract the entire ZIP and open index.html.

**124 automated checks pass.** Verification covers 264 curriculum services plus 528 event/equipment services, content boundaries, queue and handoff behaviour, exact rewards and stock, save migration, supported sorting and speech completion, physical scene updates and local startup. Hands-on browser/WebGL rendering, phone finger interaction, device speech, classroom-computer performance and real service duration remain unverified.

The detailed next-build proposal is included for context. This release implements its four requested areas; later branching dialogue, longer authored cross-station stories and cross-device saving remain future work.
