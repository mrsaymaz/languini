# Languini motion pass · v0.26.0

Motion follows work and settles before the next decision. Low-poly materials, the Languini Cafe/Diner/Bistro identities, British male customer voices, corrected checks, curriculum and saves remain intact.

| Area | New motion | Reading and input protection |
| --- | --- | --- |
| Camera | Smooth acceleration/deceleration, a small lifted arc, a short venue/service reveal, slow setup-background drift | Exact arrival pose; task controls wait for the fitted camera; no idle camera drift during English; pause freezes travel; reduced motion snaps to the target |
| Cafe setup | Gentle intro/card entrance and short selected-emblem response | No moving selection targets; 3D reveal uses the existing frame loop and cancels on a new scene/resize |
| Preparation | Higher ingredient toss, quiet landing/rim ripple and a small final plate settle | Canonical food models retained, word labels remain anchored, no extra assessed steps or rewards; one reused ripple mesh; restoration stays silent |
| English tasks | Brief ink/edge confirmation on correct answers, matched pairs, repaired words and filled tickets; audio icon breathes only while playing | Text and projected surface transforms stay fixed; no shaking sentence choices; restored successes do not replay the flourish |
| Washing | Approach–two figure-eight sponge strokes–return, drawn connection line, small numbered-link response, finite rim rinse and sequenced clean glints | White serving plate and scattered native blocks stay fixed; quick swipes replace hand travel safely; existing bubble/trail effects remain; restored/reduced completion settles cleanly |

The setup drift moves at most about 0.11 scene units and is limited to the menu background. Task camera arcs add at most 0.18 units of lift and 0.10 units of side travel, scaled down for short moves. Existing station-camera times remain 0.55 seconds in and 0.70 seconds out; venue reveals take 0.72 seconds. These are presentation timers, not service-rule changes.

Correct-answer cues last about 0.42 seconds, the sponge stroke 0.64 seconds and the rinse/clean result 0.84 seconds. No new light, remote asset, texture fetch or post-processing pass is added. The preparation ripple reuses one RingGeometry mesh and one material; the rinse uses a single instanced batch of eight small droplets. Task disposal releases these resources.

The washing SVG now changes only when its connection coordinates change, so a stationary connection is not rebuilt every frame. Accepted links remain intact through pause/refit. Pause freezes camera travel, station effects and finite guest/reward reactions. A local visual clock avoids an idle-animation jump after resuming. CSS feedback pauses with the game; both the game setting and the system reduced-motion preference suppress optional animation.

Verification includes pure camera endpoints/bounds, actual venue/task camera gating and pause, unchanged simulation state, ripple reuse/reduced/disposal, scrub/rinse/restoration and stable SVG-node regressions. Existing full game, font fitting, input, speech, curriculum and geometric sightline tests remain. Real WebGL/CSS appearance, finger input and hardware performance remain unverified because the existing browser local-file restriction prevents that acceptance pass; no workaround is used.
