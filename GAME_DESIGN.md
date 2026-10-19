# Barkour — a dog's afternoon adventure

## Direction

Choose a companion, discover a place, make satisfying leaps and bring home a photograph. The dogs are the emotional center. Quiet procedural scenery, natural material silhouettes and a restrained cream/forest interface support them. Remove an unconvincing addition instead of compensating with more labels, particles or mechanisms. Clean must still have anticipation, action, consequence and rest.

Owner feedback rejected the prior Neet tongue and Texas machinery. Those decisions and the favorable older reports are superseded. The current game uses original dog expressions and removes the industrial Texas interaction entirely.

## Leap, ownership and recovery

The ordinary leap is immediate −960 px/s under shared 1650 px/s² gravity (about 279 px high and 1.16 seconds airborne). Holding never changes or repeats it. Intentional 160 ms buffering, concurrent-source ownership and automatic-surface ownership remain. Grounded paws trigger timber ramps, powder lips or mushroom launches at −1240 px/s (about 466 px high and 1.50 seconds airborne); jumping before them bypasses them. Both dogs have identical collision bodies and abilities.

Explorer continues through bumps with 1.6 seconds of immunity. Damage still counts against the clean-run award. Adventurer and Trailblazer retain three/two hearts and optional section practice. Practice saves no records or photos. All five trails remain open.

## Five journeys

| Trail | Teaching and variation | Place moment and resolution |
|---|---|---|
| Texas | Forgiving fences teach the leap; three rolling tumbleweeds vary their approach speed. | A timber ramp launches into an elevated log route with a deliberate gap leap and a safe wash floor beneath. Super Paws scatters two closely grouped tumbleweeds. Big sky separates the phrases; a voluntary final leap can make an airborne photo. |
| Alpine | A powder lip lifts grounded paws into a high reward arc; a later launch lands on a snow shelf with a deliberate gap leap. | One constant-size snowball descends continuously from a fixed mountain shoulder before rolling across the trail. Two spaced static low snowbanks have a leap fallback and a compact powder burst under power. Snowfield quiet follows the early teaching moment. |
| Coast | Crabs pause and scuttle; driftwood remains visibly solid on the sand. | Optional treats invite a leap along the shore. One powered timber break resolves the sequence. Water never collides in the recovery course. |
| Mosswood | Mushrooms rebound grounded paws. An acorn line invites a deliberate leap. | One rooted branch route has a real gap and a clear ground fallback. Fallen timber supplies the power moment; the canopy opens toward the finish. |
| Ember | Quiet crystals and solid crystals establish changing states, with ordinary basalt leaps between. | One powered crystal cluster fractures. A returning crystal that could grow under the player was removed from the recovery layout after a repeatable HARD collision trace. Warm-stone quiet leads to the last optional reward. |

Optional rewards are three souvenirs per trail and extra treats, without an economy. They are safe to miss and must be readable as invitations. The final photo captures the player's actual pose; no automatic finish spring substitutes for the final input.

The midpoint critique found long empty intervals after decluttering. Recovery-2 trims four nominal seconds from the common final wait while retaining the collectible-to-finish relationship. It moves Texas's wash and Mosswood's reward/canopy episodes earlier and adds a short optional coastal treat arc. This is a pacing change with separate provenance, not a higher hazard count. Exact research, rejected alternatives and acceptance evidence are in `evidence/design-recovery/`.

Sparse grass and fern pockets add near-ground depth in Texas and Mosswood without collision or extra input. A fresh A/B review found a modest improvement, not a new gameplay beat. The remaining quiet rests are intentional; the shared course structure is a replay-variety limitation rather than a reason to add more systems.

The owner’s next playthrough rejected Alpine’s apparent random spawning and clutter, and the loss of exciting ramps/log traversal. Recovery-3 restores materially higher launches and raised landings on Texas, Alpine and Mosswood. Alpine now has one constant-size sphere with a fixed downhill source; its power snowbanks no longer grow or carry moving plumes. Coastal crabs and Ember geometry are unchanged. Historical variants remain intact.

## Deterministic course contract

Production constructs `Course(track, difficulty, {recovery:true})`, selecting recovery-3 for Texas, Alpine and Mosswood and unchanged recovery-2 for Coast and Ember. Explicit `recoveryRevision:1` or `2` selects the preserved earlier geometry. `{dynamic:true}` selects historical dynamic-2; bare construction selects historical elevation-1. Rendering and collision read the same current obstacle geometry. Cosmetic settings cannot change hazard phase or support geometry.

The simulation uses a fixed 120 Hz step, caps stalled frames and interpolates rendering. Course events, fragments and particles are bounded. No per-run event listeners, new combat input or engine migration are introduced.

## Framing and expression

The stage fills the browser viewport during play, pause and results. Ground remains at 88% of stage height on recovery-3 landscape trails, 82% on unchanged trails and portrait. Recovery landscape view width is `max(1200, 820 × aspect)`; portrait is 900. Scaling is uniform. Dog x stays 260 world units. Only viewport/orientation changes recompute this composition; jumps, boosts, bumps and launches do not.

The closer framing keeps the dogs readable. The three revised traversal routes have supports at y=450; their boosted arcs and ordinary leaps from a ledge fit the fixed landscape camera. Both dogs retain all original run/jump/idle frames and stable roots. Buddy's pant is in the source art; Neet's muzzle is closed. No facial attachment is drawn. The run cadence and brief landing/bump reactions remain; no frame culling was justified by the continuity review.

Routine gameplay instructions and route diagrams are removed. Brief opening, bump, collection and power feedback remain. Progress labels use place names. Results highlight an actual moment from the run and name the next destination.

## Contact and sound

Super Paws gives six seconds of protection and an eased 20% speed boost. Missing it leaves ordinary-leap solutions. Destruction originates at body/obstacle contact, with brush, timber, powder and crystal fragments. Debris is harmless, capped at 18 events and 1.05 seconds per event, and drawn behind the dog. Reduced effects retain compact fragments. No screen shake or simulation pause accompanies contact.

Audio is local synthesis, gesture-unlocked, optional and suspended on pause. Cooldowns and a 24-voice cap limit repetition. Lifecycle checks are engineering evidence; audible mix quality remains unverified without hardware listening.

## Keepsakes and history

Version-4 results carry explicit Explorer/challenge rules, course layout and equal-body capability. Comparisons require matching provenance. Replacement must archive the exact incompatible record successfully first. Historical stars and values are read as recorded.

Changed-trail photos use `barkour_finish_photos_v4_recovery_3`, independently capped at 24. Coast and Ember retain `barkour_finish_photos_v4_recovery_2`. Every earlier bucket and reader remains available. A photo freezes the actual animation frame and normalized height at crossing. The static composition adds headroom for a high pose without changing its recorded height or live camera. Export is 1200×1000 PNG and remains available when persistence is blocked.

## Evidence and acceptance

Tests reject physics, timing, input, framing and storage regressions. They do not establish natural expression, artistic cohesion or enjoyment. The recovery workflow combines actual normal-time keyboard/pointer runs, production-size frame inspection, controlled diagnosis and independent critique. Timed frame sequences are labeled separately from real-time videos.

`evidence/traversal-revision/REPORT.md` records the subsequent owner-directed correction; `evidence/design-recovery/REPORT.md` preserves the earlier decision/evidence index; `STATUS.md` preserves the milestone record. The baseline source, hashes and videos are preserved there alongside decision notes, the rejected midpoint, browser/resource checks and the later candidate. Physical iPad behavior, audible mix quality and human replay appeal remain outside what browser automation can prove.
