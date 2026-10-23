# Rune Bistro · by Mr. Saymaz

## Proposed v0.9.0 — Deliveries, service events, refurbishment and usable equipment

Design brief prepared 17 October 2026, Istanbul. Based on an audit of the current v0.8.0 source and curriculum files. This is a proposal for the next build; the v0.8.0 game has not been modified by this design review.

## The intended experience

Students should be able to describe what changed in their restaurant: “I organised the delivery, helped the guests who came together, and used my runes to finish the new kitchen bay. Now I can prepare two dishes there.”

The four requested features should support that experience together. Sorting makes receiving supplies a different English activity. Events give the supplies and kitchen a changing purpose. Refurbishment makes successful service visible over several sessions. Equipment lets the student organise the restaurant differently after a project is finished.

The recommended first release contains one new task type at the existing delivery station, a pool of four featured events, three projects with three visible stages each, and two new equipment pieces. All six existing stations remain in the same restaurant. Existing grade boundaries, 44 unit IDs, unit names and their ordering remain intact.

## What the current build actually provides

| System | Existing v0.8.0 behaviour | Consequence for the new design |
|---|---|---|
| Deliveries | One translation or definition label is attached to a crate; completion refills stock to capacity. | Sorting can reuse the receiving corner and restocking transaction, but needs its own multi-item answer model. |
| Service events | A single arena-specific event is inserted around the middle of a shift. It mostly changes the order format or portion count. | New events must change the student's decisions and the physical scene, with a rotating pool rather than another name on an ordinary order. |
| Preparation | Every prepared order starts its own cooking timer. There is no limit on simultaneous jobs at a cooking station. | An extra bench would have no capacity benefit until the kitchen represents occupied and available work spaces. |
| Serving | The model awards service and runes immediately, then the chef walks to the table as a visual reaction. | A useful serving trolley needs a small delivery model that completes the handoff when the food arrives. |
| Refurbishment | Individual purchases immediately place plants, lamps, finishes, table settings and a banner. | Projects should add visible structural stages and a longer goal while retaining these purchases. |
| Equipment | Four optional items affect stock, patience or cooking time; two can be equipped. | Two new physical pieces can join the same two-slot choice. Existing ownership and effects should survive. |
| Learning | Tasks and answer playback pause the service. Word review, supported success and persistent question cycles already exist. | The new activity and every new service timer must follow the same pause rule. Classification needs its own learning record. |

## 1. Delivery sorting: organise the labels on the receiving cart

### The action

The camera moves to the existing delivery corner. A small cart holds a stack of printed labels and two wooden trays with large category headings. One label is active at a time. The instruction is: **“Put each label under the correct heading.”**

The student taps one tray. The correct label slides into it and remains visible as part of a short stack. The next label moves forward automatically. A wrong choice leaves the label available, gives a useful clue and lets the student try again. When the batch is finished, the manifest receives its seal and the supply crate opens. Stock refills once, after the final spoken feedback has finished.

On phones, the two large destination buttons also appear in the task sheet and mirror the physical trays. Put the active word above these targets so a tapping finger leaves the word readable. Aim for targets at least 52 pixels high, with heading text allowed to wrap. One destination tap completes one decision. Dragging can be offered as an alternative, but is never required. There is no separate selection tap or final confirmation for every label.

These are printed learning labels. In non-food units they can say “teacher”, “microscope” or “reliable” without suggesting that the restaurant receives people or abstract concepts as ingredients. The crate itself still contains ordinary restaurant supplies.

### A useful difference from matching

Matching identifies an exact partner. Sorting asks what an item means well enough to place it in a conceptual group. Both activities can revisit the same word without repeating the same question.

| Canonical unit | Example headings | Illustrative labels |
|---|---|---|
| Grade 5 · Classroom Life | Classroom objects / School subjects | ruler, notebook / maths, English |
| Grade 6 · Shopping and Money | Fruit / Vegetables | apple, banana / carrot, onion |
| Grade 7 · Appearance and Personality | Personality traits / Appearance words | helpful, honest / curly, tall |
| Grade 8 · Science | Lab equipment / Science actions | microscope, beaker / measure, compare |

Examples are proposed selections from the source material, not a claim that all their translations and category boundaries are already release-ready.

### Content findings that must shape implementation

The four imported grade files contain 88 category records: two per source unit, with 880 positive membership entries in total. The two positive lists have no exact normalised word overlap within a unit. That is a structural finding; it does not establish that every pair is semantically unambiguous.

Five source units deliberately do not map to the game's existing theme with the same ID. The current importer explicitly excludes them:

| ID | Existing Rune Bistro unit to preserve | Conflicting imported source unit |
|---|---|---|
| g5u9 | Jobs and Workplaces | Health and Feelings |
| g7u11 | Food and Cooking | Digital Life |
| g7u12 | Travel and Holidays | Shopping and Money |
| g8u11 | Shopping and Services | At School |
| g8u12 | Animals and Pet Care | Health and Well-being |

For these five, write category packs from the canonical unit's own material. Possible directions include Jobs / Workplaces, Ingredients / Kitchen tools, Travel documents / Travel comfort items, Payment items / Shopping equipment, and Pet care / Pet housing. These are candidate boundaries to review, not approved answer keys. For example, a pet carrier might reasonably fit more than one proposed grouping; it should be excluded or given a clearer context.

Even among the 39 mapped units, only 20 current category pairs have at least three positive items per side already present as standalone vocabulary or definition answers in the playable bank. Thirteen have an empty side under that restriction. The source category lists also lack exact translation records for 667 of their 880 positive entries. Existing playable tasks sometimes provide additional meanings, so this number is not a count of all missing Turkish knowledge. It demonstrates that copying category lists is insufficient.

Build explicit per-unit packs. Start with at least three checked cards per heading; aim for four or more to improve variety. Preserve source references, category membership, Turkish meaning, optional reviewed clue and the spelling displayed to students. Review ambiguous words and headings such as “phone actions / phone words”; a bare word such as “ring” can need context. Avoid mechanically treating an item absent from one list as belonging to the other. The imported negative lists often contain generic food or animal distractors and are unsuitable as the second category.

The release target is a verified pack for each of the 44 canonical units. During development, an unavailable or invalid pack falls back to the existing label task. Never substitute another unit's categories. Report actual sorting coverage separately from the existing 3,033 tasks; keep the existing bank intact and identify new classification content honestly.

### Difficulty, feedback and rewards

| Element | Relaxed | Challenge |
|---|---|---|
| Batch | Four labels, two from each category | Six labels, three from each category |
| Category meaning | Short Turkish heading support shown | Heading support available by free hint |
| Word support | Meaning available immediately | Meaning available on request |
| Interaction | Tap either stable destination | Same stable destinations; more information to retain |
| Timing | Service and patience paused | Service and patience paused |

Destinations stay in the same positions throughout a batch. Their left/right assignment can vary between batches. Do not use fixed card colours that reveal the answer. Use text and a distinct tray shape or icon as well as colour. Keep complete labels readable, including long phrases.

Give brief word playback after a correct placement. Wait for it before advancing, with speech cancellation and written fallback following existing behaviour. Hints can explain the word or category and may reveal the destination if needed. Wrong placements do not destroy supplies or remove customer hearts.

Record support for the specific label involved. Classification success is evidence of classification, not independent proof that the student can translate or use the word in a sentence. Give it a separate skill record while allowing the existing weak-word history to influence selection. For the main service accuracy, assess the batch as one activity; retain item-level first-try information separately. Use the ordinary delivery reward once for a completed batch, rather than paying per tap.

Rotate sorting with the existing translation-label and definition-label deliveries. A featured mixed delivery uses the same sorting task in place of a normal restock. It should not demand both tasks for the same supplies.

## 2. Service events: four situations with different decisions

### Pacing and selection

For the first build, allow **at most one featured event per shift**. More variety is the initial goal. Challenge can create more ordinary overlap around that event; a second featured event can be evaluated after actual service times are measured.

Use a rotating pool with persistent recent-event history, scoped to grade, team and arena. Prefer an event not seen in the previous couple of shifts when an eligible alternative exists. Weight the pool by arena: deliveries and small requests suit Courtyard, takeaway suits City Bistro, and shared-table service suits Grand Banquet. The mechanics remain available without arena progression locks.

A short “Expected today” line before service can reveal the broad situation so equipment choice has a purpose. Event details still arrive naturally. Start after the opening order and before the finale, at a safe management checkpoint. Do not introduce an event during an English task, spoken answer, dispatch or construction reveal. If conditions never become safe, skip it rather than forcing a shortage, exceeding capacity or blocking the finale.

### Event A — The mixed delivery

**Visible change:** the cart arrives with two manifest headings and mixed label stacks.

**Decision:** receive it now to prepare for the next guests, or serve a ready dish first while some stock remains.

**Activity:** the new sorting batch replaces one ordinary delivery task. Choose it when stock reaches the normal restocking threshold. Completion refills the normal capacity; equipment can increase capacity through its existing rules.

**Payoff:** the correctly separated labels remain on the manifest while crates move into the receiving corner. Give the featured-event bonus once. Failed attempts remain recoverable and never make an essential restock disappear.

This event adds a different kind of English decision without appending an unrelated task to every order.

### Event B — “One more, please”

**Visible change:** a guest asks for a small side; an extra line is visibly added to the existing ticket if accepted.

**Decision:** accept the request for an extra supply unit, one short check and an event bonus, or keep the original order. Show that cost before accepting. Declining keeps the original service intact.

**Activity:** offer only on an eligible two- or three-station route. At a completed-answer checkpoint, a short reviewed completion from the same unit can become the added ticket check. The resulting route must still contain at most four stations. Do not append another large matching round or two-turn exchange.

**Payoff:** a small bread or fruit side appears beside the actual dish. The added English remains drawn from the selected unit; food requests are brief service flavour when the unit is about another subject.

Reserve the additional supply once when accepted. If stock is insufficient, keep the request pending for restocking or let the student decline. Never silently remove stock below zero, add work after cooking has begun or invalidate a response already given. Offer at a safe boundary after answer playback, not halfway through the station.

### Event C — The takeaway collection

**Visible change:** a numbered parcel waits on a small pickup shelf and a collection guest stands by its matching marker. It is a distinct handoff destination.

**Decision:** finish and release the parcel while balancing seated guests. Packing should compete for the serving pass, not occupy an invented dining table.

**Activity:** use the existing takeaway route and reviewed checkout repair. Printing the corrected receipt attaches the customer's number to the bag. There is no additional number quiz or food vocabulary requirement.

**Payoff:** tap the ready parcel, then its matching collection marker. The receipt slips into the bag, the guest collects it, and the pickup space clears.

Allow one pickup order at a time. The shelf is part of the base restaurant; an equipment purchase must not be required to complete this event. Preserve the parcel's customer and order identity if the student serves another table first.

### Event D — A table to serve together

**Visible change:** two guests share one table, with linked tickets A and B, two distinct dishes and two plate markers. This replaces the current “two portions of one order” shortcut with a small shared service.

**Decision:** arrange preparation so both meals are ready before starting the serving run. The extra bench and trolley can help, while the ordinary kitchen remains sufficient.

**Activity:** use one shared tablet task followed by one sentence preparation for each dish: three station visits for the party in Relaxed. Challenge can add one shared final checkout for four visits in total. Shared English stages award learning credit and runes once. Each dish's own preparation is assessed once.

**Payoff:** both plates arrive at the table, the guests react together, and a small extra coordination bonus is earned if the handoffs occur within a generous service-time window. The ordinary single-place tray must have enough time to achieve it; the trolley makes it easier. English and audio pause that window. Missing the coordination bonus does not erase either successful meal.

Reserve two remaining meal places before offering the event. One free physical table is sufficient because both guests share it. Do not schedule it when it would crowd out the final table. Count the two meals consistently in the service goal, and identify the HUD goal as meals served if that avoids ambiguity. The finale starts only after both linked meals and any committed delivery finish.

### Common event rules

An event must have a clear start, a visible current need and a definite resolution. Keep one normal-sized cue by its object; replace irrelevant controls rather than adding a permanent event toolbar. Let students continue with ordinary service after an optional request is declined or its bonus opportunity ends.

Use the current six-rune event bonus as an initial reference, doubled in Challenge. Preserve normal task and order rewards; prevent duplicate payouts from shared stages, repeated clicks or repeated handoff notifications. Balance the exact amounts after playtests. Optional event bonuses stay separate from the three-star assessment and project goals. Ordinary meals still follow the usual served and missed-guest rules.

## 3. Refurbishment: three places students can watch improve

### Structure

Let the student choose one active project between shifts. Each has three visible stages and a short preview of the next change. Progress comes from meals actually served while that project is active, including meals completed with hints and retries. Changing the active project is free and preserves work already done.

Use the existing cyan runes as the only spendable resource. A stage needs a clear service milestone plus its rune cost. Do not add wood tokens, renovation energy, random building drops or real-time construction waits.

As starting values, use cumulative milestones of **4, 10 and 18 meals** on the project, with stage costs of **100, 160 and 240 runes** respectively. That is 500 runes for one complete project. A project should usually remain visible over roughly two to four full services, depending on arena, spending and performance. These are tuning proposals, not measured pacing claims.

The current perfect-answer model earns about 371 runes in a Courtyard Relaxed service and 1,864 in a Banquet Challenge service for the sampled units. Those simulations omit human thinking and playback time. Money alone would let some students buy every stage immediately, so service milestones matter. Students who use support should still make steady progress.

### The projects

| Project | Stage 1 | Stage 2 | Stage 3 and completion |
|---|---|---|---|
| **Receiving alcove** | Straighten the cart and repair its slats; show fresh timber and fitted labels. | Fit shelves, an orderly manifest board and a clean tiled base. | Add an awning, warm lantern and chosen team finish. The corner becomes a recognisable arrival point for deliveries. |
| **Kitchen work bay** | Repair the side worktop and its supports. | Fit a backsplash and an organised utensil rail. | Unfold and finish the auxiliary preparation bench; unlock it as owned equipment. |
| **Serving pass** | Restore the pass edge and plate storage. | Fit a clean serving runner, brass fittings and a place to park trays. | Assemble and unveil the two-place trolley; unlock it as owned equipment. |

Completion can offer a small finish choice, such as warm wood, painted ivory or a team-colour accent. Keep gameplay benefits equal across finishes and teams. The receiving project is deliberately a visual identity goal; the other two complete functional equipment. Students can choose which reward matters to them.

### Making the change legible

Apply construction between shifts. A short camera movement shows the selected corner, the stage fits into place, and the student returns to setup. Reuse the actual restaurant geometry. Do not put construction scaffolds over customers or learning interactions during service.

Early stages should be modestly worn, not a ruined restaurant that hides current progress. Each stage needs a changed silhouette or arrangement: repaired cart, new shelf, awning; side counter, utensil rail, unfolded bench. A colour change alone is insufficient. After the reveal, the improvement remains visible from the normal service camera.

Keep project progress with the existing grade/team restaurant profile. Render the completed structure in the appropriate style for all three arenas so switching arena does not start the same project again. A courtyard canopy, a compact city awning and a banquet drape can be different versions of the same completion.

Existing cosmetic purchases remain owned and visible. Structural changes must accommodate the bought counter finish, plants, table settings, banners, tablet case and tray. Do not sell a previously bought object again as a project requirement. A project-completed equipment piece is owned immediately; equipping it uses one of the existing two slots, with no second purchase charge.

## 4. Equipment that changes physical organisation

### Shared foundation: occupied work spaces

Represent the current three preparation families as real work spaces: the main plate/assembly position, the pot position and the cold-bowl position. Initially each handles one finishing/cooking job at a time. A prepared dish can wait with its table ticket when the required position is busy.

English preparation remains available even when a cooker is occupied. The student's completed language is never discarded or repeated because of a queue. Only the next service step waits. Use a safe automatic queue, with an optional tap on a prepared ticket to make it next. A running dish is not interrupted or restarted.

Keep processing durations short and test whether the new limit creates useful overlaps rather than idle waits. This is a change from unlimited cooking, so it needs tuning in both modes before release. All timers stop during English tasks, answer speech, pause and hidden-page handling. New orders must remain completable with no optional equipment.

### Equipment A — Auxiliary preparation bench

**Physical object:** a folding side bench with an extra board or bowl and a clip for its order ticket.

**New use:** finish a second compatible assembly or cold-bowl dish while its main position is occupied. Show the actual food and customer/table ticket on the bench. Pots still use the stove; the bench does not mysteriously boil soup.

**Decision created:** when several prepared dishes are queued, which one should use the available extra position? It can help an urgent table or align the meals for a shared-table event.

**Controls:** use an ordinary prepared-ticket selection and the bench target when a choice is useful. A lone eligible job can use it automatically. Do not add a placement confirmation to every recipe. The same sentence preparation station supplies its learning; this is not a seventh station.

**Trade-off:** spending an equipment slot on the bench improves preparation capacity, leaving one slot for storage, patience or delivery equipment. It should be valuable on an assembly-heavy service, with less benefit on a pot-heavy one.

### Equipment B — Two-place serving trolley

**Physical object:** a small brass-and-wood cart with two plate recesses and clearly attached order markers.

**New use:** select up to two checked, ready meals or parcels, then tap a matching destination to choose the first stop. The cart handles the loaded destinations in one route. The second drop-off follows its own attached ticket automatically. A single meal can still be delivered with the trolley.

**Decision created:** send one urgent plate immediately, or wait briefly to combine two ready dishes. For two loads, choose which guest receives the first handoff. This becomes useful for the shared table or a takeaway collection alongside a seated guest.

**Required service rule:** a delivery is committed, travels for a short deterministic service duration and completes on arrival. The ordinary tray carries one item and returns before another run. The trolley carries two in one run, reducing separate return trips. Distances and timings should be simple rules, not a new navigation simulation.

Reserve committed orders so a table cannot be reused or its guest leave during the short final approach. Award the meal, runes, guest visit and event progress exactly once at handoff. The student can make another management choice while the run is underway; opening an English task pauses the run with all other service timers. Reduced motion simplifies its appearance without changing these rules.

**Controls:** extend the existing ready-dish cards with two clear loaded positions. Tapping a loaded card removes it before departure. Incorrect destination taps give a clear marker cue and do not lose a heart. There is no steering, balancing mechanic or permanent trolley toolbar.

### Existing equipment remains useful

The existing four items keep their ownership, two-slot rules and promised effects. Show their use physically where practical: pantry spaces fill with earned supplies, the warming shelf shows waiting food, and the preparation kit remains visible with its utensils. Do not silently remove the old warming benefit to force players to use a new object.

The two new items are enough for this first build. Additional reserve cabinets, complicated machines or equipment durability would dilute the review and introduce extra state before the basic queue and delivery rules have been tested.

## An example service

The student selects Grade 8 Science, City Bistro, Ravenclaw and Relaxed. The chosen project is the kitchen bay, with its utensil rail already fitted. The expected-event note mentions a mixed delivery. The student equips the existing extra pantry and their new trolley.

After a normal opening order, one meal is ready, another guest is waiting and stock is low. The student can serve first or receive supplies. At the cart, “microscope” goes under Lab equipment and “measure” under Science actions. The classifying labels stay attached to the manifest; ordinary supplies enter the kitchen.

The completed delivery receives its event bonus once. Later, two checked dishes are ready. The trolley takes them in one run, with the selected table served first. Correct handoffs add meals to the active project's progress. At the end of service, the milestone and runes are sufficient to finish the side bay. The new bench is revealed and becomes an available equipment choice for the next shift.

This illustrates several services of progress; it does not imply that a brand-new player receives the trolley and finishes a kitchen project within their first shift.

## Review of failure cases and scope

| Concern | Design resolution |
|---|---|
| Wrong categories imported under a familiar unit ID | Explicit canonical mapping and provenance; the five excluded themes cannot be imported by ID alone. |
| Ambiguous category or insufficient supported words | Review the pack, revise the boundary or omit an item. Retain ordinary label deliveries until the pack is valid. |
| Sorting becomes repetitive busywork | Four/six one-tap decisions, mode rotation, card history and one restock transaction. |
| A hint falsely marks a word mastered | Track classification independently; record per-card support. |
| Restocking cannot finish after a mistake | Free retries and hints; no destructive language penalty. |
| Additional item creates a five-station order | Offer only on eligible short routes and reserve the extra supply before accepting. |
| Group event creates impossible capacity | Reserve its two meal places and one table before spawning; all required play works without equipment. |
| Two events or an event and finale collide | One event lifecycle; safe checkpoints; skip an unsafe offer; finale waits for already committed work only. |
| Extra bench is only decoration | Add real occupied work spaces and a compatible extra position. |
| Trolley is only a faster animation | Delivery completes in the service model on handoff; batching saves a return trip. |
| New queue makes play too slow | Start automatically when possible; keep short process times; measure actual student time rather than the test solver. |
| Refurbishment rewards only strong English students | Ordinary served meals, including supported answers, advance it; no perfect score or random event gate. |
| Old saves lose purchases or progress | Add bounded optional profile fields, preserve old keys and money, and keep the four old gear effects. |
| Long labels or new controls obscure phone play | Two fixed large targets with DOM alternatives, complete wrapping and stable object cues; no extra permanent menu. |
| New files reintroduce the local startup failure | Keep the classic bundled entry and embed sorting content for file-origin launch. |

## Implementation sequence and release evidence

1. Finish the canonical sorting map, card meanings and reviewed category boundaries. Validate all 44 unit identities before new task selection is enabled.
2. Add the small cooking-job and delivery-job models while preserving current language, pause and reward behaviour. Prove the two pieces of equipment create a real benefit in controlled scenarios.
3. Build the sorting interaction and physical tray mirroring, including retry, speech, keyboard access and local embedded content.
4. Build the four event formats and one-event scheduler, with bounded extra activity, stock reservations, group identity and pickup handoff.
5. Add the nine refurbishment stages, their scene changes, equipment unlocks and migration of existing saves.
6. Review whole services with no equipment and with the relevant equipment combinations. Then perform hands-on browser, phone and classroom-computer testing before describing the release as visually and physically verified.

The current 97 automated checks are the v0.8.0 baseline, not evidence that these proposed features already pass. The next build should retain its 264 complete unit/difficulty/arena services and add meaningful checks for every new state transition: classification repair, per-card support, exact stock refill, safe event insertion, route limits, shared reward ownership, station queues, trolley arrival, unfinished-group finale gates, project persistence and old-save compatibility.

Test targeted equipment/event combinations separately from curriculum coverage rather than multiplying every scene test across an unnecessarily enormous matrix. Keep demos for sorting, each event, each project stage and both equipment pieces available in the phone preview so the new behaviour can be inspected directly.

Hands-on review should answer: Can a student explain the two headings? Do they notice the benefit of sorting supplies now? Does each event change a decision? Can they point to the physical improvement they earned? Does the bench or trolley save a recognisable wait or trip? Do all of those decisions remain understandable on a phone while English practice stays protected?

## Appendix — Canonical unit audit

The following inventory records existing theme names and source category candidates. It is an audit trail for authoring the new task, not a set of approved sorting packs. Exact source lists being disjoint does not remove the need to review meaning, translations, support and suitability for the canonical unit.

| ID | Existing unit | Candidate source headings | Authoring note |
|---|---|---|---|
| g5u1 | School Life | School People / School Clubs | Review meaning and support before use. |
| g5u2 | Classroom Life | Classroom Objects / School Subjects | Review meaning and support before use. |
| g5u3 | Personal Life | Clothes / Body Parts | Review meaning and support before use. |
| g5u4 | Family Life | Family Members / Home Hobbies | Review meaning and support before use. |
| g5u5 | Life in the Neighbourhood & City | Town Places / Home Furniture | Review meaning and support before use. |
| g5u6 | Life in the World | Food / Table Items | Review meaning and support before use. |
| g5u7 | Life in Nature | Wild Animals / Animal Parts | Review meaning and support before use. |
| g5u8 | Life in the Universe & Future | Land Features / Travel Items | Review meaning and support before use. |
| g5u9 | Jobs and Workplaces | Do not import: Feelings / Body Parts | Source unit excluded: write a canonical pack. |
| g5u10 | At the Toy Shop | Games / Game Equipment | Review meaning and support before use. |
| g6u1 | School Life | School Roles / School Duties | Review meaning and support before use. |
| g6u2 | Classroom Life | Learning Tools / Learning Actions | Review meaning and support before use. |
| g6u3 | Personal Life | Personality / Accessories | Review meaning and support before use. |
| g6u4 | Family Life | Family Jobs / Home Rooms | Review meaning and support before use. |
| g6u5 | Life in the Neighbourhood & City | Transport / City Events | Review meaning and support before use. |
| g6u6 | Life in the World & Culture | Cultural Events / Food And Drink | Review meaning and support before use. |
| g6u7 | Life in Nature & Global Problems | Natural Features / Green Actions | Review meaning and support before use. |
| g6u8 | Life in the Universe & Future | Space Objects / Weather Words | Review meaning and support before use. |
| g6u9 | Shopping and Money | Fruit / Vegetables | Review meaning and support before use. |
| g6u10 | Health and Well-being | Healthy Habits / Health Problems | Review meaning and support before use. |
| g7u1 | Appearance and Personality | Personality Traits / Appearance Words | Review meaning and support before use. |
| g7u2 | Sports | Sports / Sports Equipment | Review meaning and support before use. |
| g7u3 | Biographies | Life Events / Careers | Review meaning and support before use. |
| g7u4 | Wild Animals | Wild Animals / Animal Features | Review meaning and support before use. |
| g7u5 | Television | Tv Programmes / Viewing Equipment | Review meaning and support before use. |
| g7u6 | Celebrations | Party Decorations / Party Food | Review meaning and support before use. |
| g7u7 | Dreams | Future Careers / Technology | Review meaning and support before use. |
| g7u8 | Public Buildings | Public Places / Public Services | Review meaning and support before use. |
| g7u9 | Environment | Waste Materials / Green Actions | Review meaning and support before use. |
| g7u10 | Planets | Solar System / Space Study | Review meaning and support before use. |
| g7u11 | Food and Cooking | Do not import: Computer Parts / Digital Actions | Source unit excluded: write a canonical pack. |
| g7u12 | Travel and Holidays | Do not import: Shop Workers / Shopping Items | Source unit excluded: write a canonical pack. |
| g8u1 | Friendship | Friendly Traits / Social Actions | Review meaning and support before use. |
| g8u2 | Teen Life | Teen Interests / Free-Time Media | Review meaning and support before use. |
| g8u3 | In the Kitchen | Ingredients / Kitchen Tools | Review meaning and support before use. |
| g8u4 | On the Phone | Phone Actions / Phone Words | Review meaning and support before use. |
| g8u5 | The Internet | Web Actions / Digital Equipment | Review meaning and support before use. |
| g8u6 | Adventures | Adventure Sports / Safety Equipment | Review meaning and support before use. |
| g8u7 | Tourism | Tourist Places / Travel Items | Review meaning and support before use. |
| g8u8 | Chores | Household Chores / Cleaning Tools | Review meaning and support before use. |
| g8u9 | Science | Lab Equipment / Science Actions | Review meaning and support before use. |
| g8u10 | Natural Forces | Natural Disasters / Emergency Items | Review meaning and support before use. |
| g8u11 | Shopping and Services | Do not import: School Subjects / Study Materials | Source unit excluded: write a canonical pack. |
| g8u12 | Animals and Pet Care | Do not import: Health Problems / Well-Being Habits | Source unit excluded: write a canonical pack. |

Audit scope: current source modules, scene and interaction modules, content importer, all four grade category files, playable language bank, service helpers and relevant existing regression checks. Twelve deterministic existing-service simulations sampled grades 5 and 8 across both difficulties and all arenas for the economy observations. No new gameplay implementation, live browser test, student playtest or curriculum efficacy study was performed for this proposal.
