# Food preparation · v0.49.0

Correct placements use the actual recipe ingredient, independent of the grammatical block order. Five motion types cover all nine meals and three preparation phases:

- Pour: broth, yoghurt, cream, dressing and honey fill beneath a short stream.
- Tumble: leaves rotate and fall as separate leaves, with veins kept attached.
- Sprinkle: small toppings rotate and scatter slightly as they land.
- Stack: sandwich, burger and pancake layers settle gently.
- Arrange: other food portions follow a restrained landing arc.

Placements last 0.40–0.46 seconds. A 0.14-second stack settle and a 0.38-second rim highlight are visual only; they never prevent the next deliberate placement. The existing protected translation/readback time and all English outcomes are retained. Earlier ingredients stay on the same vessel, and the finished geometry matches the dish used for serving.

Sentence papers, touch surfaces, board size and serving vessel size are retained. The drop caption yields after an accepted placement and returns for the next selection, keeping the food visible without shrinking its target. Motion components use existing shared food geometry and at most 12 instanced batches per portion; typical leaf piles use four. Steam and crumbs reuse bounded batches of eight and ten particles, with no idle emission or added textures/lights. Numeric and software-browser checks do not measure physical-device FPS.

Pause freezes the station. Reduced motion settles directly and suppresses particles/highlights. Rotation rebuilds accepted food immediately without replaying success effects. Existing camera controls, notifications, Ulti pools, restaurant progress and language data are unchanged.
