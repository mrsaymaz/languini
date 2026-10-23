# v0.38.0 boundary update

The three preparation phases and nine canonical final food components remain. Sentence block counts now follow grammatical roles, with three to five blocks in the current bank. Earlier references below to exactly three blocks per sentence describe the historical design. See SENTENCE-BLOCKS.md.

Current v0.34.0 behavior: see VENUE-LEARNING-PROGRESSION.md for the post-success translation and 3/6/9-plate washing sequences.

# Three-phase preparation · retained in v0.30.0

This release extends the approved v0.28.0, whose source lineage is the verified v0.26.0 rollback. The v0.27 task-rush systems remain absent.

## Student flow

1. **Plating 1 / 3 · Build:** arrange three blocks to create the food base.
2. **Plating 2 / 3 · Layer:** a different reviewed sentence adds three new ingredient groups. The first three remain on the dish.
3. **Plating 3 / 3 · Finish:** a third distinct sentence adds finishing ingredients. The first six remain on the dish.
4. Cooking begins once, after the third sentence. The route, stock reservation and clean-plate allocation remain one per meal.

All three phases support selecting an ingredient then tapping the dish, or dragging the ingredient directly. The phase heading uses the existing top status area, and the progress rail advances in thirds. The instruction explains that recipe's current stage.

## Detailed food

Every meal has nine component groups. Sandwiches add butter, peppers and dressing; burgers add spread, onions and pickles, then the top bun in the final phase. Soups add vegetables, croutons, herbs or egg and sesame. Yoghurt and fruit bowls add compote/fruit, honey, nuts and garnish. Pasta gains vegetable layers and a parmesan/pepper finish; pancakes gain cream, fruit, syrup and toppings.

Source food shapes remain independently assigned to grammar blocks, preserving the English challenge. Small spreading, pouring and garnish gestures follow the actual ingredient kind. Liquid streams use the matching cream, syrup or broth colour. All groups use existing materials and cached geometry; food geometries have consistent UV attributes so leafy greens and round peas survive material batching together.

The canonical nine-component meal is shared by preparation, cooking, carrying and serving. On rotation or phase transitions, scene reconstruction restores all earlier ingredients before restoring any accepted current blocks. No new success effects play for restored progress.

## State and assessment

`PREP_PHASE_COUNT` and `PREP_PHASE_NAMES` are shared by rules and UI. `prepHistory` retains the earlier reviewed tasks, and the next selected task excludes every answer already used in that meal. All 44 units contain at least six distinct sentence answers, so three distinct reviewed sentences are available without modifying the curriculum.

Every sentence is assessed normally. The first two phases award zero task reward; the third awards the normal preparation reward. Service history records one preparation handoff. Pausing, requested speech and completion readback protect every phase. English activities still pause service; each phase now has a protected freshness clock as described in RECEIPTS-PROGRESSION-FRESHNESS.md. Washing remains one three-block sentence.

## Delivery crate

The ordinary label activity reserves a larger portrait bay or wider landscape column for its crate. Its planned width/height match the physical crate's proportions; native sticker blocks remain in a separate fitted manifest. Small decorative parcels are removed from this ordinary crate bay to keep the target clear. Sorting trays and parcel layout remain unchanged.

Verified projected visible crate bounds stay inside the work area and are at least one word-choice block wide at eleven phone/desktop sizes. Nine ink rays per size confirm the crate does not cover the manifest. All reviewed delivery labels retain measured fitting and touch targets.

## Verification

See VALIDATION-REPORT.md and source/validation/. Automated checks cover all units and difficulties, one-time cooking/stock/route/rewards, first-three/first-six retention, partial third-phase rotation, taps/captured drags, speech/pause gates, all-nine exact final meal geometry and preservation of every triangle during pass/serving batching. Actual browser rendering, device voice quality and physical touch feel remain unverified.
