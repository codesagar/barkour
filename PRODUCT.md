# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Barkour is for casual players and dog lovers taking a short break. iPad and desktop landscape are the primary experience. iPad portrait remains comfortable; small phones are secondary. No account or platform-game experience is required.

## Product Purpose

Barkour — The Great Pawventure is a welcoming, one-button dog adventure with natural environmental interactions. Choose Buddy or Neet and any of five open destinations. A deliberate press makes one predictable full leap; the trail supplies anticipation, movement, variation, and breathing room. The exact crossing pose becomes a downloadable finish keepsake.

## Positioning

Five authored, deterministic trails each have a distinct dynamic identity. Texas rolls through wind and brush; Alpine launches across snow shelves and brings one snowball down a mountain shoulder; the Coast pairs crabs and driftwood; Mosswood rebounds onto supported branches; Ember alternates quiet crystals and solid rock. These change encounters and player timing. They do not require more controls, currency, grind, unlocks, or accounts.

## Operating Context

- Go works immediately. Options contains difficulty, sound and fewer effects.
- Space, Up, pointer or touch makes one full leap. Holding neither repeats nor changes its arc. A deliberate press within 160 ms before landing can buffer a leap; concurrent sources retain one-gesture ownership.
- All five destinations remain open. Runs take about a minute, with quiet intervals before and after demanding sequences.
- Explorer records bumps and grants recovery immunity but never ends through damage. Adventurer has three hearts; Trailblazer has two.
- Gameplay fills the available browser viewport. HUD, Pause and Options are restrained overlays. Browser fullscreen is optional.
- Normal gameplay never changes camera scale or ground position. Resizing/orientation may recompute composition; jumps, launches, boosts and impacts cannot.
- Timber ramps, powder lips and mushrooms launch grounded paws roughly 67% higher than an ordinary leap; a deliberate leap can bypass them. Elevated routes have a continuous safe ground fallback.
- Super Paws gives six seconds of protection and an eased speed boost. Contact visibly breaks material into harmless, short-lived fragments. Missing the pickup always leaves ordinary-leap solutions.

## Capabilities and Constraints

- Static HTML5 Canvas, CSS, vanilla JavaScript. Deterministic fixed 120 Hz simulation. No engine migration or third-party runtime requests.
- Shared gravity 1650 px/s² and full ordinary leap −960 px/s. Equal collision bodies and capabilities for both dogs.
- Texas, Alpine and Mosswood use `<track>-v3-recovery-3`; unchanged Coast and Ember retain recovery-2; compiler version remains 3 and records use version 4 with explicit Explorer/challenge rules. Historical elevation-1, dynamic-2 recovery-1 and recovery-2 manifests and fixture inputs remain available unchanged.
- Comparisons require matching layout, course, rules, capability, difficulty and input category. Incompatible record replacement must archive successfully first. Historical awards are never recomputed.
- Changed-trail finish photos have an independent recovery-3 bucket; Coast and Ember retain recovery-2. Original v1–v4 buckets and readers remain available. Blocked storage cannot prevent play or downloading the current finish photo.

## Brand Commitments

Buddy and Neet remain identifiable through their original raster art. Buddy keeps his dark markings, floppy ears, long tail and integrated pant. Neet keeps his tan coat, pointed ears, short tail and alert closed muzzle. The rejected vector tongue overlay is removed. Original sheets, frame order, paw pivots and equal gameplay bodies remain intact. Quiet procedural scenery supports the dogs; industrial machinery and decorative false platforms do not belong in the current game.

## Product Principles

1. One deliberate action; physical response supplies depth.
2. Anticipation before consequence, then recovery space.
3. Dynamic behavior must have a visible physical cause, continuous motion and a readable consequence.
4. Local impacts supply force while the camera stays steady.
5. Completing a trail is an accomplishment; replay belongs to the player.
6. Local-first history, open destinations, no progression economy.

## Accessibility & Inclusion

Keyboard, pointer and touch share the same policy. Focus loss pauses and clears input. Dialogs retain focus; controls remain keyboard navigable. Sound is optional. Necessary hazard movement and warnings remain visible with fewer effects or reduced motion. Reduced effects retain compact material fracture. Menu controls are at least 44 CSS pixels; browser zoom remains enabled.

Browser viewport testing is not physical iPad testing. Automated completion does not establish enjoyment, voluntary replay, audible mix quality or screen-reader gameplay. Current implementation and precise evidence limits are in `evidence/traversal-revision/REPORT.md`; previous release reports are historical and their tongue/machinery judgments are superseded by owner feedback.
