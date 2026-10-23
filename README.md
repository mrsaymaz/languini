# Languini · by Mr. Saymaz

**Version 0.58.0** · A lightweight stylised 3D restaurant game with eight stations for Grades 5–8.

## Open the game

Extract the **entire ZIP** into one folder, then open the **root index.html** in a desktop browser with WebGL enabled. Keep its adjacent files and folders together. Do not open source/public/index.html or run the game inside a ZIP preview.

For phones, upload the ready root files to your static host, such as Netlify, and open that address in Safari or Chrome. Apart from the optional English League connection (config.js), no backend, account, microphone, external game asset service or paid assets are required. A stable hosted address is preferable for dependable browser saving; file-origin saving depends on the browser and folder.

**phone-preview.html** runs the actual game with adjustable portrait/landscape sizes. A Live Kitchen service preview joins direct demonstrations covering the restaurant stations, four-pair matching, one/two-word listening, ordinary labels, sorting, all nine dishes, four events, equipment and projects. Preview progress is isolated from normal saves.

## What this version adds

A clearer low-poly overview during shifts: stronger form lighting, deeper floor tiles, hazed distant shops, lifted faceted clouds, fading sunbeams and no sun over the kitchen. See RELEASE-NOTES.md.

Conversation questions can no longer be answered by matching words: 429 questions have new wrong replies that share the question's topic but are clearly wrong (content/reviewed-distractors.json). Each normal shift has a food critic whose review counts three times when every task for them is right first time. Phones get larger ticket and checkout text within thumb reach and a camera that follows the chef. See RELEASE-NOTES.md.

A small neighbourhood surrounds each venue: pavements, an entrance and menu, collection awnings, trees and quieter neighbouring shops. Café has a bicycle and bench, Diner an enamel collection frontage, and Bistro a planted terrace. Reputation repairs paving, strengthens planting and signage, then earns a small collection queue. Customers approach, pause at the menu and enter; task controls remain available throughout. Weather adds wet paving, awning drips, tree shade and evening entrance pools. See NEIGHBOURHOOD.md.

Opening setup: Restaurant → Ulti → Team → Lesson/Pace → Shop beside Open café → Design. Pass & Play is removed, including legacy role switching. The character is now Chef. Portrait phone controls fit from 320 × 480; short landscape windows scroll inside setup. See OPENING-LAYOUT.md.

Phone field-test repairs: sharper antialiased rendering with consistent materials, useful task signs at restaurant locations, a prominent preparation dish and compact meaning strip, properly stacked questions, smaller reviews and stable bounded overlays. See PHONE-FIXES.md.

Consistent pickup, landing and return feedback across preparation, delivery stickers and washing; quiet customer gestures linked to order state and patience; and clearer wood, ceramic, metal and fabric finishes for Cafe, Diner and Bistro. See INTERACTION-CRAFT.md.

Food now responds to correct placement: liquids pour and fill, leaves and toppings tumble, layered dishes settle, and hot food gives a little steam. Completing a sentence neatly plates the food with a brief rim highlight. The sentence papers stay readable, the board and main plate keep their existing size, and the next ingredient remains available. Pause, rotation restoration and Reduced motion are supported. See FOOD-PREPARATION.md.

Restaurant camera: 90–125% zoom using mouse wheel, −/+ or phone pinch. Drag empty floor to pan; short taps still move the chef. Reset returns to the default view. On phones, open the camera button for controls or use the quick reset after changing the view. Off-screen plates, customers, takeaway orders and supplies get tappable directional marks. They show locations without starting actions and stay hidden during English tasks.

Desktop service views now fill more of the screen: about 34% larger at 1366×768 and 20–55% larger across the tested desktop sizes. The room keeps its viewing angle and central framing, with all stations and tables visible. Phone/short-window, opening-screen and language-task views retain their existing framing.

Ulti points (English League): a won shift with at least 60% first-try accuracy on Relaxed or 75% on Challenge adds Ulti to the student's grade/team pool in the English League, the same Battle Arena pools that Tower Swarm, Wordramp and Growbloom feed. The League decides the points and limits; the game asks for a ticket when a shift opens and claims it after the win, keeping offline wins until they can be sent. The setup Ulti button and dialog show the four team pools for the grade. `config.js` holds the League address; set `ultiApi: ''` for a practice copy that makes no network requests. See ULTI-POINTS.md, including the line to add to the League's Apps Script.

Menu rounds now change in place without fading to a background cover or restarting the camera. The native tablet has a plain backing, and listening completion no longer repaints a second menu under the task. Matching, listening, hints, wrong-answer recovery, rotation and pause are checked alongside the full language-bank audit.

A stable opening view with a cached 3D café, visible sun/clouds/rain and smoothly warming evening lights. The phone setup has its own lightweight sky backdrop above the opaque panel. Roof, guest and food preview animation, camera drift and repeated setup-shadow rendering are removed. Changing Lesson or Pace reuses the room when its appearance is unchanged.

Gameplay now has broader sunlight on the floor, clearer exterior rain on both sides and the entrance, and stronger dusk lamp pools. English close-ups keep neutral light and hide weather. Existing distinct arrangements and the saved ambience volume remain available in Design and settings.

**Design and recovery:** open Design café on setup/results to preview three table arrangements, choose functional counter configurations, select earned decorations and choose a service atmosphere. All 864 venue/layout/counter/décor combinations validate against the actual walking grid. Reputation repairs upholstery, improves plants/crockery, brightens the entrance and brings an outside queue.

**Connected service:** morning, rain or evening context leads from takeaway collection to an optional packaging delivery and a two-meal neighbourhood order. Supplies require a real checked delivery and Pantry deposit; declining keeps the original goal. All English/reading/decision time remains protected.

**Practical takeaway:** number practice stays required. Names, quantities, collection times and packing requests unlock gradually. Long requests show one current request and four stable bag labels, retaining four/eight checked pairs without shrinking text. Ingredient selection/destination and checkout correction receive clearer phone focus. See CAFE-EVOLUTION.md.

**Richer hero models:** a smoother Mr. Saymaz with fabric clothing, apron binding, pocket tools, sculpted hair and detailed shoes; all nine dishes gain smoother crockery, curved leaves, fine toppings and baked bread colour. Main stations gain rounded housings, hob supports, controls, vents and a curved tap. Material batching keeps the base scene below 320 mesh objects in all three venues. Preparation dimensions and phone controls stay unchanged. See MODEL-DETAIL.md.

**An acted opening:** a 32-second film with the owner straightening the old sign and looking back, a key handover and promise, a hands-on inspection, cleaning that reveals each surface behind the broom or cloth, equipment repairs with visible responses, and a quiet pause before the first customer’s bell. A restored photograph stays in the café. Compact subtitles leave more room for the scene; an unfinished melody returns and resolves as the café reopens. Sound, Pause, Continue and Skip remain available; replay it from Help. No video or audio files need downloading. Dialogue is captioned; this sequence does not require installed speech voices.

**A fresh start:** a short 3D handover, cleaning and repair scene precedes the first shift. Inherit 2.10 stars from 150 reviews and rebuild the restaurant’s reputation. Named five-star score reveals follow the existing review cards; shift results show the change in reputation. Five milestones add owner reactions, returning-customer dialogue and entrance recognition. See REPUTATION-STORY.md.

**Guaranteed takeaway practice:** every normal shift now reserves a takeaway order, ordinarily the fourth. Relaxed has four number pairs; Challenge has eight in two sets. The event cycle also includes all four special-event types.

**Takeaway number labels:** match numerals to English words from zero to two hundred. Relaxed has four pairs; Challenge has eight different pairs in two sets of four. Takeaway orders require every label before collection. The phone preview includes both paces. See TAKEAWAY-NUMBERS.md.

**Raised food station:** the preparation close-up sits slightly higher to clear surrounding kitchen props, retaining the same board, plate and ingredient dimensions.

**Grammatical sentence blocks:** complete subjects, verb groups, objects, place and time phrases determine the pieces. All 1,520 sentences are reviewed; 534 arrangements change. Preparation and washing support the actual block count. See SENTENCE-BLOCKS.md.

**Expanded language banks:** 1,772 new activities across the existing 44 units, 516 duplicate records linked to prior practice, 44 additional delivery-sorting packs, and visible topic labels in the lesson picker. See LANGUAGE-EXPANSION.md for mappings, data handling and rebuilding.

**Setup and lessons:** restaurant cards now come first, then teams, then a Lesson button beside compact Pace controls. The lesson dialog has four grade/level tabs and 44 named units with short descriptions. See SETUP-LESSONS.md.

**Chef’s Seal branding:** the chosen restaurant logo now appears on the opening screen, with a compact matching emblem for small headers and app icons. See BRANDING.md.

**Mr. Saymaz in the restaurant:** a responsive welcome, station explanations, requested hints, recovery encouragement and shift celebrations use all six supplied poses. Production artwork uses eleven optimized WebP variants totaling about 260 KB. See OWNER-GUIDE.md.

**Meaning after success:** preparation hides Turkish until the English blocks are correct. The meaning then appears for two protected seconds before the next ingredients. All three food phases remain.

**3 / 6 / 9 washing plates:** one sentence per plate, with a fresh dirty plate after each success. Cafe uses three, Diner six, Bistro nine. The whole physical batch is credited once at the end.

**Increasing restaurant complexity:** Diner adds required menu/ticket/preparation/checkout stages and four-pair menus. Bistro adds two-round menu/ticket/checkout activities, two-item listening and a final conversation. Deliveries require one/two/three parcels by venue; sorting also grows within the selected unit bank.

Tap-to-fill/automatic tickets, 3D customer reviews, faster printed checks, revised delivery proportions, tab recovery and sequential venue unlocks remain. See VENUE-LEARNING-PROGRESSION.md and VALIDATION-REPORT.md.

## Playing

Choose restaurant and team on the opening page. Tap Lesson to choose a grade/level and unit card, then choose Relaxed or Challenge. Tap tickets or the highlighted destination sign to choose work. The first dock button names its current action; the other controls offer Pass, Supplies/Pantry, Counter, Wash and Tea. WASD/arrows move on desktop; E or Space follows the current job outside a learning task. Space retains native button activation when a button has keyboard focus.

| Station | Action |
| --- | --- |
| Guest conversation | Choose a full reply; some reviewed conversations continue with a second exchange. |
| Customer’s tablet | Match English to Turkish or pictures, or hear and select the requested word(s). |
| Receiving | Attach a sticker to the delivery, or sort a labeled parcel into a reviewed category tray. |
| Preparation | Build three sentences using their grammatical blocks; see Turkish only after each success for two seconds. Tap an item then the dish, or drag it. Earlier ingredients remain through all three phases. |
| Hanging ticket | Tap the correct word; the ticket fills, clips and sends automatically. |
| Checkout | Identify the underlined word, clear it, choose the replacement, print the receipt; checkout finishes automatically. |
| Takeaway | Match 4 number/word pairs in Relaxed, or 8 in two sets in Challenge, before collection. |
| Sink | Tap or swipe sentence blocks in order, cleaning 3 / 6 / 9 plates in Cafe / Diner / Bistro. |

Ordinary orders grow from two to four stations in Cafe to four to six in Diner and six in Bistro, with extra rounds in later venues. Learning tasks and requested pronunciation protect reading/listening time. Hints and replay are free. Mechanical drop misses do not count as English mistakes.

## Progress and curriculum

The save key **rune-bistro-v1** and schema version **1** are unchanged. Existing wallets, purchases, equipment, records, learning history, question cycles, guest memories and project progress remain compatible.

All **44 unit IDs and titles**, **3,033 original tasks**, **531 original conversation prompts**, **44 reviewed dialogue links** and **344 original sorting cards** are preserved. The expanded bank contains **4,805 activities**, **921 conversation prompts** and **88 sorting packs with 1,220 cards**. Original protected hashes remain unchanged; the two expanded runtime files have frozen baseline copies and every original activity field is checked for preservation, allowing only the requested sentence-boundary changes and their role metadata. The new import is deterministic, with explicit semantic mappings and duplicate links. See LANGUAGE-EXPANSION.md.

## Verification and limits

The complete regression suite includes 48 services driven only by the new contextual recommendation, 336 Live Kitchen services and the retained 792 legacy engine services: 1,176 simulations in total. Tests cover all 44 units, two difficulties, three arenas, event/equipment combinations, navigation, protected learning time, one-time handoffs, plate conservation, washing, holding trays, physical restocking and local startup with a renderer double. Simulated answers do not certify real learning duration or phone usability. All previous graphics, station, speech interruption and numerical layout coverage remains included.

Rendered Chromium checks cover lesson topics, persisted unit selection and selected new activities using software WebGL. Real-phone finger input, device speech, hardware performance and classroom pacing remain unverified. The game has not been published. Follow MOBILE-PLAYTEST.md on a phone and classroom computer before relying on those quality gates.

## Rebuild

From source/:

```sh
npm ci
npm run import:language
npm test
npm run build
node scripts/verify-release.mjs dist .
python3 scripts/package-split-release.py /absolute/output
```

The fresh ready build is source/dist/. From source/ in the extracted complete package, `node scripts/verify-release.mjs dist .` checks a rebuilt runtime and source fingerprints. `npm run verify:content` checks the protected curriculum. Ordinary builds use the reviewed content without regenerating it.

Installed dependencies, caches and duplicate dist output are excluded from the archive. Three.js and Microsoft Fluent Emoji notices and provenance are retained; this version adds no dependency or third-party asset.
