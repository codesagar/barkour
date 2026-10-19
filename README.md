# Barkour — The Great Pawventure

A local, one-button dog adventure with five open trails, Buddy and Neet, forgiving Explorer play, and finish-photo keepsakes. Made primarily for iPad and desktop. No build step, account, unlocks or currency.

## Play locally

```sh
python3 -m http.server 8013
```

Open [Barkour](http://127.0.0.1:8013/). The local-only server serves this repository. A conventional static server also works (`python3 -m http.server 8000`). All runtime assets are local; the preserved legacy account service is not loaded.

## Controls

- **Space, Up, or press the playfield:** one full leap. Holding neither changes the arc nor repeats. A deliberate press in the last 160 ms before landing can buffer the next leap.
- **Escape / P / Pause:** pause or resume. Losing focus pauses and clears input.
- **Options:** Explorer (bumps never end a run), Adventurer (three hearts), Trailblazer (two), sound and fewer effects. **M** toggles sound.
- Timber ramps, powder lips and mushrooms launch grounded paws automatically. Jumping before one bypasses it.
- Browser fullscreen is optional. Ordinary play already fills the viewport.

All five trails are open and take roughly a minute. Results offer the next destination, Run again, Choose a trail and Save photo. Scores, stars and souvenirs live in optional Run details and records. Section practice is available after challenge failures and saves no result or photo.

## Five places to explore

| Destination | Trail character |
|---|---|
| Texas Suntrail | Fences, rolling tumbleweeds, open sky and a timber ramp into a supported log route across the dry wash. Super Paws scatters a compact brush cluster. |
| Alpine Dash | High powder launches, a snow-shelf gap, one snowball descending from a fixed mountain shoulder, and two spaced snowbanks that burst apart under Super Paws. |
| Pacific Coast | Pausing and scuttling crabs, timber on the sand, optional high treats and a driftwood breakthrough. All water is scenery. |
| Mosswood Trail | Mushroom rebounds, rooted branches with a real gap, optional acorn rewards and fallen timber. The floor beneath the branches remains clear. |
| Ember Ridge | Quiet and solid crystal phases, visible basalt leaps and one powered crystal fracture. |

Missing Super Paws leaves ordinary-leap solutions. Optional high rewards are safe to miss. The last leap is the player's choice; there is no automatic photo launcher.

## Dogs, power and framing

Both dogs use their original raster expressions and animation frames. Buddy retains his integrated pant; Neet has an alert closed muzzle. The rejected Canvas tongue overlay is removed. Original source sheets, manifests, pivots and equal gameplay bodies are preserved.

Super Paws lasts six seconds with an eased 20% speed boost. Contact produces material-specific fragments and harmless aftermath. The dog stays visible and the camera stays steady. Reduced effects retain the essential contact response; the ring, timer and expiry cue also work without sound.

Camera scale, dog position and ground line remain fixed during play. Viewport changes recompute a uniform scale. The recovery view is modestly closer than the rejected build, with extra fixed headroom on the three high-launch trails. Portrait retains slower pacing and advance hazard warnings.

Each photo preserves the exact crossing frame and height. Its still composition fits airborne poses without cropping ears and exports a 1200×1000 PNG.

## Local history

Current results use version 4 and explicit Explorer/challenge rules. Texas, Alpine and Mosswood use `<track>-v3-recovery-3`; unchanged Coast and Ember retain recovery-2. Earlier elevation-1, dynamic-2, recovery-1 and recovery-2 geometry remains selectable for historical verification. Incompatible results never compare. Replacement first archives the old record; failed archive writes prevent replacement. Historical awards are not recomputed.

Changed-trail photos use the separate `barkour_finish_photos_v4_recovery_3` bucket; Coast and Ember retain their recovery-2 bucket. Earlier buckets and readers remain available in the album. Blocked storage still permits play and downloading the current photo.

## Development

### GitHub Pages

The game is published through GitHub Pages at [codesagar.github.io/barkour](https://codesagar.github.io/barkour/).

`python3 scripts/package-pages.py` produces the game-only `build/pages/` artifact from the HTML dependencies and character sheets (about 2.29 MiB). It excludes review videos, source art, experiments and unused account scripts. The deployment workflow runs the test suite before packaging and deploying on pushes to `main`, or manual dispatch. Relative asset URLs support the `/barkour/` project path. Records and photos stay local to each browser origin; localhost progress does not automatically transfer to the hosted site.

### Checks

```sh
node --test tests/*.test.cjs
python3 scripts/version-assets.py
git diff --check
```

Refresh content-hashed JS/CSS URLs after runtime edits. Canvas and deterministic 120 Hz simulation are retained. The Pages deployment publishes only the packaged static game; no backend or engine migration is required.

| File | Responsibility |
|---|---|
| `js/tracks.js` | Historical and current manifests, moving collision geometry, branch support |
| `js/game.js` | Fixed-step integration, collisions, effects and steady camera |
| `js/character.js` | Equal-body physics, original sprite selection and local reactions |
| `js/art.js`, `js/background.js` | Natural materials, contact fragments and scenery |
| `js/game-ui.js`, `css/style.css` | Menus, overlays, results, records and album |
| `js/storage.js`, `js/finish-photo.js` | Provenance, safe local history and exact-pose keepsakes |
| `js/audio.js`, `js/input.js` | Bounded local sound and input ownership |

Historical fixtures are preserved. The historical uplift suite explicitly selects its earlier dynamic layout; the current power test follows each trail's authored contact count instead of requiring the rejected identical pair. New `recovery-*.test.cjs` coverage checks current physics, history separation and photo framing. Original art remains under `new-assets/` and `assets/characters/`.

## Verification and limits

The release passed 147 automated tests covering both dogs, all five trails and difficulties, input ownership, traversal, timing and historical storage. The packaged game was also checked under a `/barkour/` URL prefix at desktop and tablet viewport sizes. Earlier normal-time recordings and independent reviews remain in the original development workspace under `evidence/`; large recordings and experiments are not part of this release checkout or the hosted game.

Browser viewport emulation does not establish physical iPad touch/audio/GPU behavior. Deterministic checks and recorded desktop runs do not prove human enjoyment or voluntary replay. Audible mix and screen-reader gameplay require hands-on evaluation.
