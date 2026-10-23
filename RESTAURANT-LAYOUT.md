# Restaurant layout · Languini v0.39.0

The entrance is at the front, dining tables flank a clear central aisle, and the open kitchen occupies the back. Pantry/preparation, cooking and the finished-food pass follow a consistent order. A separate side sink receives dirty dishes. Checkout and takeaway sit on opposite sides of the entrance.

The Cafe keeps two dining tables, the Diner three and the Bistro four. The Diner no longer puts its third table in the centre of the service route. Save IDs, restaurant unlocks, goals, activities and rewards remain compatible.

## Camera and phone controls

The room overview uses an orthographic camera looking downward 60 degrees from the horizontal floor, with 15 degrees of side rotation. The entrance stays at the bottom of the screen and kitchen at the top. Framing follows the room bounds and reserves space for order tickets and the bottom control dock. Tall foreground structures are hidden during live service. Back-wall details and upper kitchen fixtures cut away during preparation, receiving and washing, then restore when the activity closes. On portrait phones, the guidance card sits below the order tickets; the shortest phones use the same action in the ticket and bottom dock to keep the room clear. Task-specific cameras still frame their native work surfaces, with protected transitions, pause and Reduced Motion.

The preparation close-up keeps the v0.38.1 board dimensions, recipe note, full-size main plate and up-to-six-block paper arrangement. Moving its restaurant location does not enlarge that work surface or shrink its plate.

## v0.40.0 work-surface clearance

The preparation close-up is now 0.75 scene units higher so surrounding kitchen props remain below it. Its board, note, full-size plate and six-block ingredient area retain their dimensions. The overview prep board stays at its original height. Takeaway collection adds the number-label task on its front counter; see TAKEAWAY-NUMBERS.md.

## Furniture, movement and upgrades

src/restaurant-layout.mjs supplies the table positions, station approaches, fixture footprints, serving slots and work-scene translations. The renderer and walking grid use that same plan. Navigation keeps the chef clear of tables, chairs and counters; the takeaway approach is on the dining side of its front counter.

Prepared work, held loads, cooked dishes, pass trays, dirty/clean plate stacks, signs and steam follow their actual stations. The ticket rail belongs above the pass, and the register/printed receipt belongs beside the entrance. The takeaway customer sits beside the pickup shelf with clearance for the held menu.

Renovations and equipped furnishings retain their gameplay effects. Extra prep capacity stays on the kitchen counter, pantry storage stays at the boundary and the trolley has a parking nook beside the pass. No upgrade adds an island to the central aisle. Venue palette, architecture, table settings and original character assets are retained.

## Verification

See VALIDATION-REPORT.md and source/validation/ for final automated and rendered-browser evidence. Browser fixture hooks and internal screenshots are not shipped. Physical phone input and hardware GPU performance remain device checks.
