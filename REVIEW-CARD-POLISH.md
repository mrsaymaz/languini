# Languini v0.32.0 · Review presentation and delivery proportions

Built directly from the verified v0.31.0 release, retaining the v0.26.0 rollback lineage, the three-phase preparation, sequential venue unlocks and tab-return recovery.

## Three-dimensional review card

The review is now a six-sided CSS 3D object in the table's projected UI layer. This keeps text crisp without allocating another WebGL texture or render pass. A cream front, deep-green reverse, gold edge, inset borders, medallion and raised gold stars follow the restaurant's existing palette. Both faces hide their reverse; the card has 6 px thickness, four edge surfaces and 850 px perspective.

Entrance settles into a small perspective tilt. After the unchanged 3.2-second review period, the card makes one full 360-degree revolution around its own vertical axis over 1.05 seconds. Smooth acceleration/deceleration, a slight lift/bank, directional face shading, a foil glint and a narrowing cast shadow accompany the turn. The reverse is visible at the halfway point. The card stays fully opaque until the final third, then fades and gently recedes. It rotates around its centre rather than orbiting the table or spinning as a flat panel.

Dining time remains in the simulation. Pause, task focus, rotation and tab-return behavior remain protected. Reduced Motion retains the review and uses a fade without rotation, lift or scale. Native text and ratings remain accessible, and the card accepts no pointer input. Taste/Service/Speed scoring is unchanged.

## Faster corrected-check return

The paper's reading period is exactly 2,000 ms shorter for every sentence:

`clamp(1600 + 190 × word count, 2400, 5000) - 2000`

This gives 400–3,000 ms after the paper is fully printed. The separate 850 ms physical feed, corrected English, automatic continuation, camera/audio/pause protection and one-time completion remain intact.

## Delivery labels and crate

The original task's label grid and dimensions are measured first. The backing paper then uses smaller margins and tighter heading spacing, trims its unused height/width, and keeps at least the original label cell width and touch height. Long definitions receive enough room for their actual prompt; difficult compact cases retain a safe backing size rather than clip text.

Reclaimed space enlarges the physical supply crate. Its open lid and depth are included in the projection allowances, so the crate remains inside the work area and clear of the printed choices. Portrait layouts use the bay above the paper; landscape layouts use the bay beside it. Sorting trays and parcel classification layout remain unchanged.

Verification includes measured-font fitting for all vocabulary/definition delivery tasks at both option counts, preserved card dimensions, physical crate sightlines, full card revolution/depth/reduced-motion checks, exact receipt timing, and existing gameplay regressions. Actual Safari/Chrome appearance, hardware compositing and phone touch remain device checks.
