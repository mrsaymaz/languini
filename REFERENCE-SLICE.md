# Visual reference slice · v0.21.0

This pass establishes shared visual treatment for the restaurant, chef, reference customer Aylin, and preparation-to-serving sequence. Shared constructors extend the hand/face treatment to all 24 profiles and food details to all nine dishes.

## Included changes

- Calmer ivory ceramic, less orange wood, quieter stone and a sage kitchen floor band. The floor uses a neutral material so its instance colors are not multiplied by yellow paper.
- Three broad window-light shapes share one transparent batch. Arena-aware daylight/exposure and closer task shadow framing reuse the existing lights. The overview lighting restores on task exit, and Light mode retains its shadow/reflection policy.
- Folded chef hat, collar, jacket buttons, apron straps, stitched pocket and cuff accents. Rounded palms, four joined fingers and an opposed thumb are batched by material.
- Independent walking legs, mild weight shift, stable tray-carrying arms and reduced-motion settling. Customers gain independently blinking eyes, hair-matched brows, curved smiles, pockets and shaped hands. The held-tablet grips use the shared hand construction.
- Oblique preparation framing with board-depth compensation to preserve native text/hit areas. Grip hands, cuffs and sleeves extend away from recipe and sentence ink in compact and landscape layouts.
- Folded cheese, tomato interiors, toasted pancakes, organic syrup pools, broth meniscus and fine ceramic rim accents. Prepared and served meals share exact final geometry/materials across all nine dishes.
- A supporting carry tray and 0.42-second eased visual transfer from the actual chef carrier to the table. Pause stops the transfer; Reduced motion places it directly. No delivery, timing, reward or language rules change.
- Room beams and the duplicate overview chef remain out of active task close-ups, including direct previews.

## Verification

Five focused regressions cover chef foot placement/stride and steady carrying, faces/reduced motion, task/overview lighting restoration, hand clearance across recipe/word ink, canonical food continuity and paused serving without game-state changes. Preparation covers nine meals, four sizes, three actions and five samples on four ink surfaces: 108 action states and 2,160 rays.

All existing learning content, menu directions/audio, compact delivery labels, checkout receipt, scattered washing blocks, speech gates, saves, controls and full-service tests remain. Full results are in VALIDATION-REPORT.md and source/validation.

The suite runs sequentially with a per-worker heap limit; scene identity diagnostics use bounded Boolean assertions to avoid dumping circular scene graphs. This changes test execution only.

Actual WebGL lighting/CSS appearance, finger input, phone voices, hardware frame rate and classroom duration remain unverified. Offline geometry inspection during development was not a browser screenshot. No public deployment was made.

## Actual-game review

Open phone-preview.html → Recipe rail. Try Bistro burger, Sunshine soup, Mushroom pasta and Berry pancakes at 393×740, 320×480 and 568×320. Review Customer's menu / Guest conversation for faces and grips, then Live kitchen for walking, carrying and serving. Compare Light/Detailed and Reduced motion. Follow MOBILE-PLAYTEST.md before classroom acceptance.

## Three upgrades selected at v0.21

1. Unified restaurant UI and icons: coordinated tickets, enamel signs, menus, buttons, typography and control icons; Fluent imagery stays in vocabulary tasks.
2. Station-specific feedback effects: restrained steam, flour/crumb puffs, soap trails, package seals and accepted-link highlights, kept clear of English text.
3. Distinct arena identities and visible renovations: stronger Courtyard/Bistro/Banquet character and recognizable purchased changes to counters, equipment and service areas.

These three selections are implemented in v0.24.0. See RESTAURANT-CRAFT.md for the current scope and verification.
