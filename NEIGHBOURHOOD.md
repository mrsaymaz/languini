# Neighbourhood · v0.55.0

The restaurant keeps its approved camera framing, service layout and walkable floor. Exterior scenery occupies the surrounding space and is not included in the chef’s navigation grid. Near details appear on all screens; more distant shop façades render from 600 CSS pixels wide, including tablets and desktop.

## Venue character

- Café: striped doorway awning, flower boxes, timber bench, bicycle and rack.
- Diner: enamel frontage, metal trim, roadside bollards and a striped collection awning.
- Bistro: planted timber terrace, small decorative table/chairs, brass details and warm entrance light.

Each entrance has a step, mat, wall menu, opening-hours sign and two planters. The collection hatch corresponds to the existing Pickup station and introduces no extra task. The terrace furniture is scenery, not an additional serving table.

## Reputation

The inherited state has faded paint, paving cracks and tired foliage. At the existing milestones, 2.5 stars begins repairs, 3.0 improves planting, 3.5 restores the sign and paving, 4.0 lights the entrance and adds one person near collection, and 4.5 adds a second. Queues stay clear of the doorway. The earned reputation level remains governed by the existing save model.

## Customers and weather

The existing order customer approaches, pauses at the menu and moves through the entrance or to the collection canopy. The presentation lasts at most 4.6 seconds, never holds a task or changes scoring, and settles immediately when English opens. Walking legs move only during an approach; seated legs and normal gestures return at the table. Pause freezes arrivals; Reduced motion skips the travel. The first customer already introduced by the story does not repeat the arrival.

Rain uses wet paving, puddles and sixteen short awning drips. Morning tree shade is baked into the ground; evening lamps and ground pools share the existing lighting transition. Two leaf clusters sway gently during service. English stations cut away exterior scenery; the opening screen retains its cached 3D render.

## Budget and validation

No new external asset downloads, dynamic lights, timers or animation loops. Simple distant architecture and shared primitive geometry use material batches. All signs share a single locally generated 512 × 512 texture. Complete-scene budget checks include the new scenery and hidden standing legs; existing work-surface and food dimensions are retained.

Automated and browser evidence is recorded in BUILD-INFO.json and validation/neighbourhood-test-summary-v0.55.0.json. Browser checks use software WebGL and touch emulation; physical phone performance is unmeasured.
