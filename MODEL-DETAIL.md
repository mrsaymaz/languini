# Languini v0.44.0 — Hero-model detail

This pass upgrades the playable 3D Mr. Saymaz, all nine meals and their ingredient pieces, and the main working fixtures. The overall restaurant floor plan, furniture style, lighting design and camera remain compatible with the previous version. The separate transparent owner illustrations and Chef’s Seal artwork are retained.

## Character

The head, hat, nose, ears and hair locks use smoother curved geometry. Eye placement, smile, complexion, proportions and rig pivot positions remain recognisable. Jacket and apron binding, pocket tools, trouser seams, layered shoes, cuff details and hat pleats give close-ups more readable surfaces. The jacket uses the existing shared linen map with a fabric roughness, while shoes and hardware have separate material finishes.

Garment and hardware colours are baked into vertex colours before each rigid animation part is batched. Carrying, reaching, walking, face animation and all opening-scene gestures continue using the same rig API. Customers retain their existing detail budget.

## Food and stations

All 81 ingredient layers retain their semantic IDs and positions. Crockery has smoother radial profiles without changing the full-size plate’s 0.46-unit radius. Leaves have a curved central rib and gently ruffled edges, pasta uses a smoother curved tube, mushrooms have an underside ring, banana has small seeds, and bread has restrained baked-colour variation. Existing tomato seeds, cheese folds, syrup, berries and toppings are retained. Shared geometry/material batches prevent a separate draw object per seed or leaf vein. Earlier phases and the final served meal use the same canonical layers.

Working fixtures gain rounded edges, hob supports, oven controls and vents, a curved sink tap and drain, and till bezel/drawer details. The preparation wood gains a routed groove and knife marks. Fixed till components are batched while its display remains independently controlled.

No labels, answer controls, projection planes or hit boxes move. Preparation retains its raised position, board dimensions, full-size vessel and six-block capacity.

## Budget and loading

| Initial scene | CPU mesh objects | CPU triangles, including hidden food |
| --- | ---: | ---: |
| Café | 236 | 195,552 |
| Diner | 267 | 222,028 |
| Bistro | 297 | 248,752 |

These counts include hidden objects and instance-expanded geometry. They are deliberately conservative scene totals, not visible renderer draw calls or device frame rates. The playable chef has 35,064 triangles, concentrated on the one character used in close-ups. Ingredient layers have at most six material batches each. The Light-quality preparation views sampled 59,638–74,558 visible triangles and 90–108 renderer calls in portrait; washing sampled 84,224–86,094 triangles. These samples are individual rendered frames, not worst-case guarantees. Exact upgraded-room and sampled rendered-frame counts are recorded under validation/.

All models are generated locally from code and share cached shapes. No external model, texture, sound or additional game-asset requests are introduced. Geometry still costs runtime memory and rendering work even though the ZIP size changes little. The existing Auto/Light graphics modes, pixel-ratio limits and frame-budget fallback remain active. Browser QA uses software graphics; physical phone GPU performance still needs measurement on target devices.

## Checks

The model regression checks cover rig pivots and poses, plate footprint, finite attributes, shared ownership, all ingredient-layer budgets and complete-room budgets. Existing preparation tests compare every completed meal with its canonical served geometry across all phases and viewport sizes. Native browser checks cover actual six-block placement/washing, projected control bounds, the nine food close-ups, main stations and the opening chef’s poses. Release validation and evidence are in VALIDATION-REPORT.md.
