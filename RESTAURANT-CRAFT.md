Current release: see LANGUINI.md for the Cafe/Diner/Bistro rebrand, expanded floor plans and British male voices. The material, feedback and renovation systems documented below remain included; older venue labels and American male selection describe v0.24.0 only.

# A coordinated restaurant · v0.24.0

This pass completes the three selected upgrades while retaining warm low-poly geometry, simple controls and protected language pacing.

## Shared UI and icons

One paper/enamel/brass token set connects setup, shop, menus, tickets, receipt and kitchen controls. The 24-unit SVG line family uses consistent strokes and dedicated sink, prep, counter, pantry, warmer, trolley, seal and arena symbols. State icons accompany ticket text; labels remain present. Selected/pressed/disabled/focus treatment is coordinated. Existing measured page dimensions and touch targets remain owned by the page planners. Fluent images remain vocabulary pictures.

## Purposeful feedback

| Trigger | Visible response | Protection |
| --- | --- | --- |
| Accepted bread/base layer | Small crumb scatter from the landing point | No crumb burst for vegetable filling or restored progress |
| Accepted hot broth/sauce | Brief steam rise above the vessel | Hot cooking jobs also steam at their actual station; cold jobs do not |
| Accepted washing link | Bubbles and a short foam trail around the native card | Labels remain above the scene; final dirt clears before the existing clean sheen |
| Approved delivery/parcel | Small sage approval seal with a cream check | Forms once per label; restored parcels have a static completed seal |

Transient prep feedback uses at most two lazily created instance batches (eight steam puffs and ten crumbs), no textures/lights/postprocessing. It settles quickly, freezes during Pause and clears in Reduced motion. Approval seals settle to their final shape. Shared effect resources and GPU instance buffers are released at scene disposal.

## Arena identities

| Restaurant | Materials and architecture |
| --- | --- |
| Courtyard | Sandstone paving, sage trim, terracotta garden beds, leaf masses and trellis under the pergola |
| City Bistro | Teal joinery, warm parquet tones/inset lines, arched café windows and timber frieze |
| Grand Banquet | Ivory fluted columns/cornice, indigo drapes, pale patterned floor and restrained brass inlays |

Room details use the existing static material batches. Learning controls retain their sightline tests; the warming equipment is cleared from the hanging-ticket close-up and returns on exit; the bistro arches sit back at the wall after a pickup-table sightline regression was caught and corrected.

## Visible renovations and equipment

Receiving stages add cart framing/handles, stock bins/manifest backing, then striped awning and lantern fittings. Kitchen stages add lower cabinet joinery, tilework/utensil detail, then an organized preparation bench. Pass stages add plate cubbies, brass rail/tray parking, then a two-tier trolley with raised guard rails. Wood, ivory and team finishes remain available. The equipped pantry has a framed shelf silhouette; the warmer gains a recognizable hood; the prep kit has a tool roll and handles; welcome tea gains a tray/teapot. Polished counters and lanterns gain corresponding hardware.

Stage costs, meal thresholds, equipment slots, capacity, collision/navigation proxies and rewards are unchanged. The shop's stage strip describes the visible result, while the existing build reveal and project preview show it in the room.

## Voices and verification

Male speech now stays `en-US` and excludes Fred, including when Fred is the device default. Prefer allowed natural/enhanced US personas; when none is available, settle the request and retain written support. No new speech service or account is required.

CPU/DOM/speech tests cover semantic icon references, finite/pause/reduced/disposal behavior, accepted prep feedback, approval seal restoration, hot-job steam, all three arena/stage structures, existing scene budgets, native controls and measured ink/sightlines. See VALIDATION-REPORT.md for exact results. Browser screenshots were unavailable under the existing local-navigation restriction; no workaround was attempted. Actual WebGL/CSS appearance, device voices, physical fingers and hardware FPS still require MOBILE-PLAYTEST.md. No public deployment.
