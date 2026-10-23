v0.19: Sink guidance now points to tap/swipe sentence connections. Extra menu modes and direct previews are described in ACTIVITY-NOTES.md.

Checkout-specific update: v0.18 adds a prominent Find → Clear → Replace → Print banner and a requested visual cue on the error word, followed by readable printed correction feedback; v0.23 automatically advances after printing. This explicit learning scaffold is separate from the kitchen signifiers described below. See CHECKOUT-NOTES.md.

# Kitchen signifiers · v0.17.0

## What the player sees

One contextual enamel destination badge names the next action, its station and the same table/order number shown on the recommended ticket and held tray. A world-space floor ring indicates the destination before the player taps. A leader preserves the actual world anchor if the badge is repositioned to avoid HUD controls. The badge is an actual button: it uses the same KitchenFlow command as the ticket/primary action. It does not merely glow.

The first dock button now describes the available action. Examples: Take order, Read menu, Prepare, Check ticket, Load cooker, Collect meal, Serve T2, Store crate and Wash dishes. The E/Space shortcut uses the same recommendation. Players can still select another ticket, store work, add a second trolley meal or tap the floor to move independently. Recommendations never answer English tasks or advance service themselves.

The route and arrival ring remain visible during travel. Floor taps have a brief footprint confirmation. Walking text names the station/order; blocked commands leave an inline reason until a valid route is chosen. Cargo text identifies its order and destination. Quiet physical signs identify Supplies, Pantry, Prep, Cook, Pass, Sink and Counter; the expanded contextual badge covers Guest/Menu/Ticket/Checkout as needed.

## First-use guidance

Each action's short tip fades after successful use. Walking to an English station counts when the station actually opens; cooking, collection, storage, supply deposit, washing and serving count at their successful commit. A rejected action does not dismiss its tip. State is saved locally in an optional kitchenHelp field; save identity and schema remain unchanged.

Show guidance is available in Help and Pause:

- First-use tips: explain actions not yet used successfully.
- Every action: keep the explanatory tips.
- Quiet: retain signs, actions and location cues with concise objective text.
- Restore first-use tips: clear only kitchen guidance familiarity, leaving learning/progression/wallets intact.

The guidance layer hides during English tasks, requested pronunciation, side-offer decisions, Pause and results. It does not reveal correct answers. Only one destination/ticket receives the primary recommendation. Pulses last two short cycles on first use; Reduced motion uses static outlines. Floor footprints expire; no permanent animation or tutorial popup is added.

## Implementation and limits

kitchen-signifiers.mjs owns read-only action descriptions, recommendations, tutorial copy, familiarity sanitization and badge placement. KitchenFlow dispatches these commands and emits successful-use events. KitchenHUD renders native buttons/text and projects one sign; RestaurantView renders the world ring, small physical signs and footprint. Seven new physical-sign textures are each 256×64 RGBA: 448 KiB of source pixels combined, excluding browser/GPU overhead. Signs are created once per live scene and static geometry is batched.

Nine new regression tests cover 48 contextual-action services, sign/button equivalence, cargo/trolley/plate/supply destinations, blockers, familiarity persistence/restore, learning-state suppression, phone-size placement, footprint expiry and the pre-click destination ring. All service simulations use automated correct answers. Numeric placement and DOM/renderer doubles do not certify real CSS composition, fingers, shader output, FPS or learner pacing. The physical signs are location labels; the expanded highlighted destination badge is the actionable sign.

MOBILE-PLAYTEST.md lists the required real-device acceptance pass. The complete archive includes ready runtime and editable source. No new assessed content, external assets, dependency or public publication is included.
