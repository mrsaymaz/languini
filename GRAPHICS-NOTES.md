# Visual reference pass · v0.21.0

See REFERENCE-SLICE.md for the current room/character/food treatment, close-up camera, hand animation, serving and verification limits. This pass adds no runtime dependency, external asset, post-processing pass or shadow-casting light.

---

# Rune Bistro v0.15.0 · Graphics direction

The goal is a crafted miniature restaurant: warm ivory, honeyed wood, restrained team colours, satin ceramic and small brass accents. Food and learning text carry the visual emphasis. Large shapes, clear profiles and contact matter more than busy textures.

| Surface | Intended character |
| --- | --- |
| Working paper | Bright, calm ivory; sharp native ink; no glossy highlights |
| Wood and fabric | Low-contrast grain/weave; readable broad forms |
| Ceramic | Recessed profiles, soft highlights and a grounded foot |
| Food | Matte bread/pasta; softer fruit highlights; smoother soup and syrup |
| Deliveries | Shared matte kraft and carton; recognisable existing package forms |
| Metal | Broad, warm studio highlights; no bloom or glitter |

The restaurant receives a quieter floor and deliberate border, more crafted counter/table construction and arena details. Courtyard Café is airy and planted; City Bistro uses darker wall details; Grand Banquet uses restrained ceremonial brass. No new decorative object occupies a learning control.

All nine dishes retain their original identity. Folded leaves and curved open pasta replace primitive silhouettes. Profiled plates and bowl feet improve the serving finish. Bread details remain unrelated to grammatical order. The existing paper-under-saucer interaction and completed-preparation/served-meal continuity remain intact.

## Graphics modes

Detailed uses the tuned scene lights, real-time shadows and one procedural reflection environment. Auto uses the existing device/frame-budget policy and can lower the tier. Light removes real-time shadows and studio reflections; shared form shading and contact shading remain. Text and gameplay do not depend on buying equipment or enabling a quality mode.

The reflection source is 128×64 RGBA (32 KiB of CPU pixel data), generated locally once per view. Internal renderer conversion/GPU storage is additional and was not measured. The four existing shared procedural material maps are reused. Packaging adds two shared materials using the same paper map. There is no SSAO, bloom, external image download or shader plug-in.

## Evidence and limits

Regular scene graphs contain 209 / 258 / 297 mesh objects for Courtyard / Bistro / Banquet. Triangle totals are 104,380 / 122,180 / 140,920, including floor instances. These CPU counts are not rendered draw-call or FPS measurements. The existing under-300 regular-scene budget is unchanged.

Automated checks cover finite geometry, preserved picking vertices for the new form shading, complete colour attributes after batching, material roles, food bounds, repeated geometry sharing, environment allocation size and quality switching. Existing station sightline/input/curriculum tests remain in the suite.

Actual WebGL appearance, hardware frame time, browser font rendering and finger use still need the acceptance pass in MOBILE-PLAYTEST.md. The remote browser rejected local-file navigation under its URL policy; no alternate browser route or public deployment was used. No before/after screenshot is fabricated or represented as tested output.
