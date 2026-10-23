Update · v0.19: Sink now uses one protected sentence-connection task per dirty batch before its rinse. Students tap or swipe between reviewed blocks. See ACTIVITY-NOTES.md; earlier references to a timed wash describe its retained final rinse.

# Guidance update · v0.17.0

The live loop below remains. Tappable destination signs now identify the next action/station/order before travel, matching the recommended ticket and contextual first dock button. Floor taps show brief footprints; walking and blocked states explain what is happening. Help/Pause can restore first-use tips, show every tip or keep signs only. See GUIDANCE-NOTES.md. Keyboard E/Space follows the same contextual recommendation; native button/task keyboard behaviour is retained.

The original v0.16 loop record follows. Its references to Work mean the first, now contextual, action button.

---

# Live Kitchen · v0.16.0

The service loop is now a navigable kitchen. English activities still occupy a protected learning moment; movement and management take place between those moments. This is a single-device game with existing team/pass-and-play support, not online multiplayer.

## A service

1. Tap a ticket. The chef walks to the guest or the next station before its English task opens.
2. Finish the task. Choose the same ticket to continue, or switch to another guest while cooking progresses. Reviewed two-turn conversations stay together.
3. Carry a completed preparation tray to its cooking station with Work or that ticket. Counter temporarily holds a tray or supply crate; the bench expands its capacity from one to two.
4. Once cooking finishes, complete any final English check, then collect a meal from Pass. Tap its ticket to carry it to the guest. Stock, customer credit and project progress commit once at physical arrival.
5. The trolley can load a second checked meal with Pass. Tap either loaded ticket to choose the first destination; the chef visits both. Counter returns ready meals to Pass instead of creating extra food.
6. Every served meal makes a dish dirty. With empty hands, Wash cleans a timed batch at Sink. Cooking and guest patience continue during washing, and Pause freezes it.
7. When supplies are low, Supplies opens a labeling or sorting task after walking to Receiving. Carry the labeled crate to Pantry to commit its stock and rewards. A side request can use this route and then resume the same offer.

The ticket rail identifies table/pickup, order number, dish, next action and task progress. Its bottom bar shows patience or cooking progress. The carrying readout reports hands and clean/dirty plates. Guidance describes the actual next action. Flow is an unscored handoff streak, separate from English accuracy.

## Controls and learning pace

Tap the floor to move freely; tapping a ticket plans travel and its next action. Tap another ticket while walking to change the plan. On desktop use WASD/arrows to move and E to work. Space works when it is not activating a focused native control. During English tasks, the existing task-specific tap/drag/keyboard controls take over.

Work follows held supplies, prepared trays or meals, then the selected eligible ticket. Pass loads checked meals. Supplies becomes Pantry when carrying a crate. Set down/Counter stores or retrieves work. Wash requires free hands. Tea retains its existing 25-rune cost and effect.

The service simulation freezes during assessed tasks, their requested pronunciation, explicit Pause and side-offer decisions. Mechanical travel/washing never changes English correctness. Hints and Replay remain free, and no instruction starts speaking automatically. Additional arrival spacing and guest patience accommodate movement in both difficulties.

## Technical and verification boundaries

KitchenFlow owns navigation, routes, cargo, plate conservation and station arrivals; Three.js displays that state. A small grid navigates around table/chair and furniture proxies. This is click-to-move station navigation rather than a general rigid-body collision system. Completed preparations are explicit cargo and cooking uses the existing queue/bench system. The physical handoff still uses the original identity guards and reward/progression logic.

The normal service path enables Live Kitchen. Direct station and staged feature demonstrations retain the legacy simulation, while the new Live Kitchen preview runs the real service. The original save key and schema are unchanged. No curriculum data, task examples, category assignments, grade boundaries or supplemental dialogue links changed.

Automated coverage includes 264 unit/difficulty/arena services plus 72 event/equipment services, alongside 792 retained legacy services. Route reachability, frame-step independence, plate conservation, pause, supplies, holding, washing, two-stop and shared-table trolley delivery, invalidated orders, a HUD click and scene state are checked. Browser appearance, phone reach, real play duration, device speech and hardware frame rate still require MOBILE-PLAYTEST.md. No public deployment or fabricated screenshot is included.
