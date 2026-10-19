// Every course has a repeatable layout. All five destinations are available from the start.
const TRACKS = [
    { id: 'texas', name: 'Texas Suntrail', region: 'BIG SKY COUNTRY', tag: 'Cacti & canyon curves',
      description: 'Chase the golden hour through sandstone country. Big skies, prickly neighbors, endless possibility.',
      length: 17200, seed: 21, accent: '#BD633F', sky: ['#F2C9A5', '#FCE6BE'], ground: ['#D6A574', '#B87D55'],
      hills: ['#D49A76', '#B9795F', '#A65F4B'], types: ['cactus', 'rock', 'tumbleweed'], icon: '01', courseVersion: 3 },
    { id: 'alpine', name: 'Alpine Dash', region: 'ABOVE THE CLOUDS', tag: 'Snow pines & powder',
      description: 'Fresh powder. Frosted pines. A little mountain magic. Leave a trail of paw prints all the way to the summit.',
      length: 18500, seed: 42, accent: '#427A97', sky: ['#91BAD5', '#E6F0EF'], ground: ['#F4F7F3', '#CADFE6'],
      hills: ['#C2D8E0', '#9CBFCF', '#7FA6B9'], types: ['pine', 'snowpile', 'log'], icon: '02', courseVersion: 3 },
    { id: 'coast', name: 'Pacific Coast', region: 'SALT IN THE AIR', tag: 'Driftwood & tide rocks',
      description: 'Follow the shoreline past rolling surf and sun-bleached driftwood. Every good dog deserves a beach day.',
      length: 19600, seed: 63, accent: '#278B88', sky: ['#93D3D8', '#F0F2CE'], ground: ['#E8D3A2', '#C8B47F'],
      hills: ['#92C6C1', '#5BAFAE', '#338F9D'], types: ['driftwood', 'rock', 'crab'], icon: '03', courseVersion: 3 },
    { id: 'forest', name: 'Mosswood Trail', region: 'TAKE THE WILD WAY', tag: 'Fallen logs & mushrooms',
      description: 'Wander beneath the redwoods, where sunbeams find the trail and the mushrooms grow a little too big.',
      length: 20800, seed: 84, accent: '#53754B', sky: ['#759F92', '#DCE2B0'], ground: ['#B9B17F', '#828964'],
      hills: ['#95AD8C', '#6E967C', '#4C7867'], types: ['log', 'mushroom', 'stump'], icon: '04', courseVersion: 3 },
    { id: 'ember', name: 'Ember Ridge', region: 'ONE LAST ADVENTURE', tag: 'Obsidian & glowing crystals',
      description: 'A twilight sprint over ancient volcanic stone. Follow the fireflies and bring this adventure home.',
      length: 22200, seed: 105, accent: '#BD726F', sky: ['#373952', '#BA8787'], ground: ['#706778', '#48495E'],
      hills: ['#817487', '#625B77', '#474961'], types: ['crystal', 'basalt', 'emberstone'], icon: '05', courseVersion: 3 }
];

const OBSTACLE_TYPES = {
    cactus: { w: 65, h: 112 }, rock: { w: 78, h: 68 }, tumbleweed: { w: 68, h: 68 },
    pine: { w: 70, h: 118 }, snowpile: { w: 92, h: 61 }, log: { w: 86, h: 67 },
    driftwood: { w: 90, h: 73 }, crab: { w: 73, h: 52 }, mushroom: { w: 74, h: 90 },
    stump: { w: 75, h: 83 }, crystal: { w: 72, h: 113 }, basalt: { w: 84, h: 88 }, emberstone: { w: 82, h: 65 },
    fence: { w: 96, h: 76 }
};

const COURSE_VERSION = 2;
// A destination advances independently. Omitted metadata intentionally preserves
// the shipped v2 course until that destination is authored and staged for v3.
const courseVersionForTrack = track => [2, 3].includes(track?.courseVersion) ? track.courseVersion : 2;
const JOURNEYS = {
    texas: { signature: 'Rolling country', mechanic: 'roll', souvenir: 'Canyon rosette', finale: 'Golden gate', tip: 'Rolling tumbleweeds move toward you. Press once for a full leap.' },
    alpine: { signature: 'Powder launch', mechanic: 'snow', souvenir: 'Summit snowflake', finale: 'Summit flags', tip: 'Blue snow ramps launch you automatically when your paws touch them.' },
    coast: { signature: 'Crab crossing', mechanic: 'crab', souvenir: 'Pearl shell', finale: 'Sunset pier', tip: 'Crabs patrol the marked sand. Leap over their whole patrol.' },
    forest: { signature: 'Canopy lift', mechanic: 'spring', souvenir: 'Canopy acorn', finale: 'Canopy clearing', tip: 'Chevron-marked spring pads launch grounded paws toward the canopy prize.' },
    ember: { signature: 'Crystal pulse', mechanic: 'phase', souvenir: 'Ember prism', finale: 'Prism parade', tip: 'Solid crystals hurt. Outlined crystals are safe; a warning ring means they will return.' }
};
OBSTACLE_TYPES.snowball = { w: 76, h: 76 };

// Texas is the first authored v3 course. Coordinates are nominal initial-speed
// seconds; the compiler converts them to world space without touching the loop.
const TEXAS_V3_MANIFEST = Object.freeze({
    id: 'texas', version: 3, nominalSeconds: 62,
    beats: Object.freeze([
        { id: 'first-hop', at: 4, label: 'First fence', cue: 'Press once to leap over the fence.',
          intent: { teaches: 'ordinary-leap', safe: { response: 'leap' }, mastery: null, warning: { cue: 'low fence', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'fence', low: true, tutorial: true, height: 44 }, { kind: 'treatLine', phrase: 'hop-line', heights: [62,100,62] }],
          recovery: { until: 6.2, exit: 'main' } },
        { id: 'first-leap', at: 8, label: 'Next fence', cue: 'A taller fence. The same press makes the same leap.',
          intent: { teaches: 'ordinary-leap', safe: { response: 'leap' }, mastery: null, warning: { cue: 'tall fence', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'fence', tutorial: true, height: 82 }, { kind: 'treatLine', phrase: 'leap-line', heights: [90,195,285,195,90] }],
          recovery: { until: 10.4, exit: 'main' } },
        { id: 'canyon-fork', at: 13, label: 'Canyon fork',
          intent: { teaches: 'route-choice', safe: { response: 'none', route: 'main' }, mastery: { response: 'leap', route: 'high' }, warning: { cue: 'split trail marker', minSeconds: 1.35 } },
          primitives: [{ kind: 'routeGate', highY: 505, rejoinOffset: 3.1 }, { kind: 'treatLine', route: 'main', heights: [64,64,64] }, { kind: 'treatLine', route: 'high', phrase: 'canyon-line', optional: true, heights: [180,280,330,280,180] }, { kind: 'souvenir', route: 'high', height: 300, slot: 0 }],
          recovery: { until: 17, exit: 'main' } },
        { id: 'tumble-one', at: 20, label: 'Tumbleweed rhythm',
          intent: { teaches: 'moving-hazard', safe: { response: 'leap' }, mastery: null, warning: { cue: 'rolling tumbleweed', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'tumbleweed', motion: 'roll', travel: 115, rate: 48 }, { kind: 'treatLine', heights: [85,190,285,190,85] }],
          recovery: { until: 21.5, exit: 'main' } },
        { id: 'tumble-two', at: 23, label: 'Tumbleweed rhythm',
          intent: { teaches: 'moving-hazard-variation', safe: { response: 'leap' }, mastery: null, warning: { cue: 'rolling tumbleweed', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'tumbleweed', motion: 'roll', travel: 145, rate: 58 }, { kind: 'treatLine', heights: [85,190,285,190,85] }],
          recovery: { until: 24.5, exit: 'main' } },
        { id: 'tumble-three', at: 26, label: 'Tumbleweed rhythm',
          intent: { teaches: 'moving-hazard-peak', safe: { response: 'leap' }, mastery: null, warning: { cue: 'fast rolling tumbleweed', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'tumbleweed', motion: 'roll', travel: 175, rate: 65 }, { kind: 'treatLine', heights: [85,190,285,190,85] }],
          recovery: { until: 28, exit: 'main' } },
        { id: 'big-sky', at: 31, label: 'Big-sky release',
          intent: { teaches: 'recovery', safe: { response: 'none' }, mastery: null, warning: { cue: 'open trail', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'big-sky' }, { kind: 'treatLine', phrase: 'sky-line', heights: [64,64,64,64,64,64] }],
          recovery: { until: 35.5, exit: 'main' } },
        { id: 'bridge-run', at: 38, label: 'Bridge run',
          cue: 'Pipeline flyover: take the ramp, run the first pipe, then leap the gap.',
          intent: { teaches: 'elevated-traversal', safe: { response: 'none' }, mastery: { response: 'leap' }, warning: { cue: 'pipeline ramp and gap', minSeconds: 1.35 } },
          primitives: [{ kind: 'platformRun', style: 'pipeline', topY: 430, launchOffset: 0, launchVelocity: -840,
            launchWidth: 132,
              segments: [[.6,2.25],[2.65,4.3]] },
            { kind: 'treatLine', offset: 1.62, phrase: 'first-pipe', optional: true, heights: [225,225,225] },
            { kind: 'treatLine', offset: 3.42, phrase: 'second-pipe', optional: true, heights: [225,225] },
            { kind: 'souvenir', height: 270, offset: 3.2, slot: 1 }],
          recovery: { until: 43, exit: 'main' } },
        { id: 'stampede', at: 44, label: 'Super Paws stampede',
          intent: { teaches: 'power-fantasy', safe: { response: 'power-fallback' }, mastery: null, warning: { cue: 'star and fence line', minSeconds: 1.35 } },
          primitives: [{ kind: 'power', type: 'star', powerMoment: true, powerCue: 'SUPER PAWS' }, { kind: 'obstacle', type: 'fence', offset: 2.1, smash: true, height: 76 }, { kind: 'obstacle', type: 'fence', offset: 4.4, smash: true, height: 76 }, { kind: 'landmark', style: 'stampede' }],
          recovery: { until: 50.5, exit: 'main' } },
        { id: 'golden-arch', at: 55, label: 'Golden arch finale',
          intent: { teaches: 'finish-photo', safe: { response: 'none' }, mastery: { response: 'leap' }, warning: { cue: 'golden arch', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'arch' }, { kind: 'treatLine', phrase: 'home-line', heights: [64,64,64,64,64,64,64] }, { kind: 'souvenir', height: 205, offset: .45, slot: 2 }],
          recovery: { until: 62, exit: 'finish' } }
    ])
});

// Each remaining trail owns a different beat order and local rhythm. They share
// only the proven v3 primitives interpreted by Course; no destination branches
// in the simulation loop are required.
const ALPINE_V3_MANIFEST = Object.freeze({
    id: 'alpine', version: 3, nominalSeconds: 60,
    journey: { signature: 'Powder carry', mechanic: 'snow', souvenir: 'Summit snowflake', finale: 'Summit flags', tip: 'Stay grounded on blue powder ramps for an automatic launch.' },
    beats: Object.freeze([
        { id: 'powder-launch', at: 5, label: 'Powder launch', cue: 'Blue powder ahead: stay grounded and let it launch you.',
          intent: { teaches: 'grounded-launch', safe: { response: 'none' }, mastery: { response: 'leap', route: 'high' }, warning: { cue: 'blue powder ramp', minSeconds: 1.35 } },
          primitives: [{ kind: 'surface', kindName: 'snow', width: 132, velocity: -1120 }, { kind: 'treatLine', phrase: 'powder-line', heights: [120,235,300,235,120] }, { kind: 'souvenir', height: 255, offset: .22, slot: 0 }], recovery: { until: 9, exit: 'main' } },
        { id: 'quiet-descent', at: 11, label: 'Quiet descent', cue: 'Easy paws. Follow the powder marks.',
          intent: { teaches: 'recovery', safe: { response: 'none' }, mastery: null, warning: { cue: 'open snow', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'alpine-descent' }, { kind: 'treatLine', phrase: 'snow-trail', heights: [64,64,64,64,64] }], recovery: { until: 15, exit: 'main' } },
        { id: 'launch-variation', at: 17, label: 'Launch or leap', cue: 'Powder ramp or one ordinary leap: both trails are safe.',
          intent: { teaches: 'launch-variation', safe: { response: 'leap' }, mastery: { response: 'none', route: 'high' }, warning: { cue: 'powder ramp and snowball', minSeconds: 1.35 } },
          primitives: [{ kind: 'surface', kindName: 'snow', width: 132, velocity: -1120 }, { kind: 'obstacle', type: 'snowball', offset: 1.85, motion: 'roll', travel: 105, rate: 44 }, { kind: 'treatLine', heights: [85,190,285,190,85] }], recovery: { until: 21, exit: 'main' } },
        { id: 'summit-gate', at: 24, label: 'Summit ribbon', cue: 'A full leap reaches the optional summit ribbon.',
          intent: { teaches: 'momentum-route', safe: { response: 'none', route: 'main' }, mastery: { response: 'leap', route: 'high' }, warning: { cue: 'summit ribbon marker', minSeconds: 1.35 } },
          primitives: [{ kind: 'routeGate', highY: 505, rejoinOffset: 3.1 }, { kind: 'treatLine', route: 'main', heights: [64,64,64] }, { kind: 'treatLine', route: 'high', phrase: 'summit-line', optional: true, heights: [180,275,330,275,180] }, { kind: 'souvenir', route: 'high', height: 300, slot: 1 }], recovery: { until: 28.5, exit: 'main' } },
        { id: 'snowball-carry', at: 31, label: 'Snowball carry', cue: 'Carry your timing over the incoming snowball.',
          intent: { teaches: 'launch-moving-combination', safe: { response: 'leap' }, mastery: null, warning: { cue: 'rolling snowball', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'snowball', motion: 'roll', travel: 170, rate: 62 }, { kind: 'treatLine', heights: [85,190,285,190,85] }], recovery: { until: 34, exit: 'main' } },
        { id: 'avalanche-rush', at: 39, label: 'Avalanche rush', cue: 'Super Paws: run through the marked snowbanks!',
          intent: { teaches: 'power-fantasy', safe: { response: 'power-fallback' }, mastery: null, warning: { cue: 'star and snowbank line', minSeconds: 1.35 } },
          primitives: [{ kind: 'power', type: 'star', powerMoment: true, powerCue: 'POWDER RUSH' }, { kind: 'obstacle', type: 'snowpile', offset: 2.05, smash: true, height: 61 }, { kind: 'obstacle', type: 'snowpile', offset: 4.35, smash: true, height: 61 }, { kind: 'landmark', style: 'avalanche' }], recovery: { until: 46, exit: 'main' } },
        { id: 'summit-finish', at: 52, label: 'Summit flags', cue: 'GOOD DOG arch ahead. Your finish photo is automatic.',
          intent: { teaches: 'finish-photo', safe: { response: 'none' }, mastery: { response: 'leap' }, warning: { cue: 'summit flags', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'summit' }, { kind: 'treatLine', phrase: 'summit-home', heights: [64,64,64,64,64,64] }, { kind: 'souvenir', height: 205, offset: .45, slot: 2 }], recovery: { until: 60, exit: 'finish' } }
    ])
});

const COAST_V3_MANIFEST = Object.freeze({
    id: 'coast', version: 3, nominalSeconds: 60,
    journey: { signature: 'Patrol cadence', mechanic: 'crab', souvenir: 'Pearl shell', finale: 'Sunset pier', tip: 'Crabs patrol the marked sand. Leap over the whole marked lane.' },
    beats: Object.freeze([
        { id: 'first-patrol', at: 6, label: 'First patrol', cue: 'Watch the crab cross its marked sand lane, then leap.',
          intent: { teaches: 'patrol-timing', safe: { response: 'leap' }, mastery: null, warning: { cue: 'patrolling crab', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'crab', motion: 'patrol', amplitude: 48 }, { kind: 'treatLine', phrase: 'shore-hop', heights: [80,180,250,180,80] }], recovery: { until: 9.5, exit: 'main' } },
        { id: 'shore-breath', at: 12, label: 'Shore breath', cue: 'A quiet stretch between the tide beats.',
          intent: { teaches: 'recovery', safe: { response: 'none' }, mastery: null, warning: { cue: 'open shore', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'shore' }, { kind: 'treatLine', phrase: 'shore-line', heights: [64,64,64,64,64] }], recovery: { until: 16, exit: 'main' } },
        { id: 'patrol-answer', at: 18, label: 'Patrol answer', cue: 'A second patrol answers the first. One clear leap.',
          intent: { teaches: 'patrol-variation', safe: { response: 'leap' }, mastery: null, warning: { cue: 'patrolling crab', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'crab', motion: 'patrol', amplitude: 66 }, { kind: 'treatLine', heights: [80,180,250,180,80] }], recovery: { until: 21, exit: 'main' } },
        { id: 'outer-sand', at: 24, label: 'Outer sand', cue: 'Stay on the safe sand, or leap for the outer-shell line.',
          intent: { teaches: 'timing-route', safe: { response: 'none', route: 'main' }, mastery: { response: 'leap', route: 'high' }, warning: { cue: 'outer shell marker', minSeconds: 1.35 } },
          primitives: [{ kind: 'routeGate', highY: 505, rejoinOffset: 3.1 }, { kind: 'treatLine', route: 'main', heights: [64,64,64] }, { kind: 'treatLine', route: 'high', phrase: 'shell-line', optional: true, heights: [180,275,330,275,180] }, { kind: 'souvenir', route: 'high', height: 300, slot: 0 }], recovery: { until: 28.5, exit: 'main' } },
        { id: 'tide-combination', at: 31, label: 'Tide combination', cue: 'Clear the patrol, land, then clear the driftwood.',
          intent: { teaches: 'patrol-combination', safe: { response: 'leap' }, mastery: null, warning: { cue: 'crab then driftwood', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'crab', motion: 'patrol', amplitude: 54 }, { kind: 'obstacle', type: 'driftwood', offset: 2.1, height: 64 }, { kind: 'treatLine', heights: [85,190,285,190,85] }, { kind: 'souvenir', height: 230, offset: 2.25, slot: 1 }], recovery: { until: 35, exit: 'main' } },
        { id: 'pier-sprint', at: 41, label: 'Pier sprint', cue: 'Super Paws: wave through the marked pier clutter!',
          intent: { teaches: 'power-fantasy', safe: { response: 'power-fallback' }, mastery: null, warning: { cue: 'star and pier line', minSeconds: 1.35 } },
          primitives: [{ kind: 'power', type: 'star', powerMoment: true, powerCue: 'WAVE SPRINT' }, { kind: 'obstacle', type: 'driftwood', offset: 2.1, smash: true, height: 64 }, { kind: 'obstacle', type: 'driftwood', offset: 4.4, smash: true, height: 64 }, { kind: 'landmark', style: 'pier' }], recovery: { until: 48, exit: 'main' } },
        { id: 'sunset-pier', at: 53, label: 'Sunset pier', cue: 'GOOD DOG arch ahead. Your finish photo is automatic.',
          intent: { teaches: 'finish-photo', safe: { response: 'none' }, mastery: { response: 'leap' }, warning: { cue: 'sunset pier', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'sunset-pier' }, { kind: 'treatLine', phrase: 'pearl-home', heights: [64,64,64,64,64,64] }, { kind: 'souvenir', height: 205, offset: .45, slot: 2 }], recovery: { until: 60, exit: 'finish' } }
    ])
});

const MOSSWOOD_V3_MANIFEST = Object.freeze({
    id: 'forest', version: 3, nominalSeconds: 60,
    journey: { signature: 'Canopy rebound', mechanic: 'spring', souvenir: 'Canopy acorn', finale: 'Forest opening', tip: 'Chevron springs rebound grounded paws toward the canopy line.' },
    beats: Object.freeze([
        { id: 'first-rebound', at: 6, label: 'First rebound', cue: 'Stay grounded on the chevrons for a canopy rebound.',
          intent: { teaches: 'rebound', safe: { response: 'none' }, mastery: null, warning: { cue: 'spring chevrons', minSeconds: 1.35 } },
          primitives: [{ kind: 'surface', kindName: 'spring', width: 128, velocity: -1120 }, { kind: 'treatLine', phrase: 'first-canopy', heights: [120,235,300,235,120] }, { kind: 'souvenir', height: 255, offset: .22, slot: 0 }], recovery: { until: 10, exit: 'main' } },
        { id: 'mossy-floor', at: 13, label: 'Mossy floor', cue: 'Easy paws beneath the redwoods.',
          intent: { teaches: 'recovery', safe: { response: 'none' }, mastery: null, warning: { cue: 'open forest floor', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'mossy-floor' }, { kind: 'treatLine', phrase: 'moss-line', heights: [64,64,64,64,64] }], recovery: { until: 17, exit: 'main' } },
        { id: 'canopy-choice', at: 20, label: 'Canopy choice', cue: 'Stay low for the main trail, or leap into the canopy acorns.',
          intent: { teaches: 'low-canopy-route', safe: { response: 'none', route: 'main' }, mastery: { response: 'leap', route: 'high' }, warning: { cue: 'canopy marker', minSeconds: 1.35 } },
          primitives: [{ kind: 'routeGate', highY: 505, rejoinOffset: 3.1 }, { kind: 'treatLine', route: 'main', heights: [64,64,64] }, { kind: 'treatLine', route: 'high', phrase: 'canopy-line', optional: true, heights: [180,275,330,275,180] }, { kind: 'souvenir', route: 'high', height: 300, slot: 1 }], recovery: { until: 24.5, exit: 'main' } },
        { id: 'second-rebound', at: 27, label: 'Second rebound', cue: 'The next chevrons lift you over the low log.',
          intent: { teaches: 'rebound-variation', safe: { response: 'none' }, mastery: null, warning: { cue: 'spring chevrons', minSeconds: 1.35 } },
          primitives: [{ kind: 'surface', kindName: 'spring', width: 128, velocity: -1120 }, { kind: 'obstacle', type: 'log', offset: .95, height: 64 }, { kind: 'treatLine', heights: [100,205,285,205,100] }], recovery: { until: 31, exit: 'main' } },
        { id: 'root-combination', at: 35, label: 'Root combination', cue: 'Rebound, land, then make one ordinary leap.',
          intent: { teaches: 'rebound-combination', safe: { response: 'leap' }, mastery: null, warning: { cue: 'spring then stump', minSeconds: 1.35 } },
          primitives: [{ kind: 'surface', kindName: 'spring', width: 128, velocity: -1120 }, { kind: 'obstacle', type: 'stump', offset: 2.25, height: 72 }, { kind: 'treatLine', heights: [85,190,285,190,85] }], recovery: { until: 39, exit: 'main' } },
        { id: 'canopy-bound', at: 42, label: 'Connected canopy bound', cue: 'Super Paws: bound through the marked low branches!',
          intent: { teaches: 'power-fantasy', safe: { response: 'power-fallback' }, mastery: null, warning: { cue: 'star and branch line', minSeconds: 1.35 } },
          primitives: [{ kind: 'power', type: 'star', powerMoment: true, powerCue: 'CANOPY BOUND' }, { kind: 'obstacle', type: 'log', offset: 2.1, smash: true, height: 64 }, { kind: 'obstacle', type: 'stump', offset: 4.4, smash: true, height: 72 }, { kind: 'landmark', style: 'canopy-bound' }], recovery: { until: 49, exit: 'main' } },
        { id: 'forest-opening', at: 53, label: 'Forest opening', cue: 'GOOD DOG arch ahead. Your finish photo is automatic.',
          intent: { teaches: 'finish-photo', safe: { response: 'none' }, mastery: { response: 'leap' }, warning: { cue: 'forest opening', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'forest-opening' }, { kind: 'treatLine', phrase: 'opening-home', heights: [64,64,64,64,64,64] }, { kind: 'souvenir', height: 205, offset: .45, slot: 2 }], recovery: { until: 60, exit: 'finish' } }
    ])
});

const EMBER_V3_MANIFEST = Object.freeze({
    id: 'ember', version: 3, nominalSeconds: 60,
    journey: { signature: 'Prism pulse', mechanic: 'phase', souvenir: 'Ember prism', finale: 'Prism resolve', tip: 'Solid prisms hurt. Outlined prisms are safe; rings show a return.' },
    beats: Object.freeze([
        { id: 'outlined-prism', at: 6, label: 'Outlined prism', cue: 'Outlined prisms are safe. Keep running through this one.',
          intent: { teaches: 'phase-safe-state', safe: { response: 'none' }, mastery: null, warning: { cue: 'outlined prism', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'crystal', motion: 'phase', phase: .2 }, { kind: 'treatLine', phrase: 'quiet-prism', heights: [64,64,64] }], recovery: { until: 9.5, exit: 'main' } },
        { id: 'solid-prism', at: 12, label: 'Solid prism', cue: 'This prism is solid. One ordinary leap clears it.',
          intent: { teaches: 'phase-solid-state', safe: { response: 'leap' }, mastery: null, warning: { cue: 'solid prism', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'crystal', motion: 'phase', phase: 0 }, { kind: 'treatLine', heights: [85,190,285,190,85] }], recovery: { until: 15, exit: 'main' } },
        { id: 'returning-prism', at: 18, label: 'Returning prism', cue: 'The warning ring says this prism will return. Leap, land, then clear basalt.',
          intent: { teaches: 'phase-combination', safe: { response: 'leap' }, mastery: null, warning: { cue: 'returning prism', minSeconds: 1.35 } },
          primitives: [{ kind: 'obstacle', type: 'crystal', motion: 'phase', phase: 3.18 }, { kind: 'obstacle', type: 'basalt', offset: 2.2, height: 76 }, { kind: 'treatLine', heights: [85,190,285,190,85] }], recovery: { until: 22.5, exit: 'main' } },
        { id: 'ember-rest', at: 26, label: 'Ember rest', cue: 'A quiet shelf between prism beats.',
          intent: { teaches: 'recovery', safe: { response: 'none' }, mastery: null, warning: { cue: 'quiet embers', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'ember-rest' }, { kind: 'treatLine', phrase: 'ember-line', heights: [64,64,64,64,64] }], recovery: { until: 30, exit: 'main' } },
        { id: 'prism-gate', at: 33, label: 'Prism gate', cue: 'Stay on the safe ground line, or leap through the outlined prism ribbon.',
          intent: { teaches: 'phase-route', safe: { response: 'none', route: 'main' }, mastery: { response: 'leap', route: 'high' }, warning: { cue: 'outlined prism gate', minSeconds: 1.35 } },
          primitives: [{ kind: 'routeGate', highY: 505, rejoinOffset: 3.1 }, { kind: 'treatLine', route: 'main', heights: [64,64,64] }, { kind: 'treatLine', route: 'high', phrase: 'prism-line', optional: true, heights: [180,275,330,275,180] }, { kind: 'souvenir', route: 'high', height: 300, slot: 0 }], recovery: { until: 37.5, exit: 'main' } },
        { id: 'prism-break', at: 41, label: 'Prism-break rhythm', cue: 'Super Paws: run through the marked prism clusters!',
          intent: { teaches: 'power-fantasy', safe: { response: 'power-fallback' }, mastery: null, warning: { cue: 'star and prism clusters', minSeconds: 1.35 } },
          primitives: [{ kind: 'power', type: 'star', powerMoment: true, powerCue: 'PRISM BREAK' }, { kind: 'obstacle', type: 'crystal', offset: 2.05, smash: true }, { kind: 'obstacle', type: 'crystal', offset: 4.35, smash: true }, { kind: 'landmark', style: 'prism-break' }, { kind: 'souvenir', height: 230, offset: 4.55, slot: 1 }], recovery: { until: 48, exit: 'main' } },
        { id: 'prism-resolve', at: 53, label: 'Prism resolve', cue: 'GOOD DOG arch ahead. Your finish photo is automatic.',
          intent: { teaches: 'finish-photo', safe: { response: 'none' }, mastery: { response: 'leap' }, warning: { cue: 'prism resolve', minSeconds: 1.35 } },
          primitives: [{ kind: 'landmark', style: 'prism-resolve' }, { kind: 'treatLine', phrase: 'prism-home', heights: [64,64,64,64,64,64] }, { kind: 'souvenir', height: 205, offset: .45, slot: 2 }], recovery: { until: 60, exit: 'finish' } }
    ])
});

const V3_MANIFESTS = Object.freeze({ texas: TEXAS_V3_MANIFEST, alpine: ALPINE_V3_MANIFEST, coast: COAST_V3_MANIFEST, forest: MOSSWOOD_V3_MANIFEST, ember: EMBER_V3_MANIFEST });

// The elevation-1 manifests above are immutable historical contracts. The
// dynamic layouts compile through the same primitives but own new provenance.
const DYNAMIC_MANIFESTS = (() => {
    const result = {};
    for (const [id, source] of Object.entries(V3_MANIFESTS)) {
        const manifest = JSON.parse(JSON.stringify(source));
        manifest.layoutId = `${id}-v3-dynamic-2`;
        const beat = name => manifest.beats.find(item => item.id === name);
        const obstacles = name => beat(name).primitives.filter(item => item.kind === 'obstacle');
        if (id === 'texas') {
            manifest.journey = { ...JOURNEYS.texas, signature: 'Pipeline breakthrough', mechanic: 'machinery', tip: 'Watch the striped pistons rise. Leap their full height, or smash through with Super Paws.' };
            for (const name of ['tumble-one','tumble-two']) Object.assign(obstacles(name)[0], { mechanism: 'accelerating-roll', acceleration: 55, travel: 205 });
            Object.assign(obstacles('tumble-three')[0], { type: 'fence', motion: null, mechanism: 'piston', width: 108, height: 104, phase: .4 });
            Object.assign(beat('tumble-three'), { label: 'Pipeline pressure', cue: 'Striped pistons rise and retract. One leap clears their full stroke.' });
            Object.assign(beat('bridge-run').primitives[0], { topY: 415, segments: [[.65,2.15],[2.65,4.4]] });
            obstacles('stampede').forEach((item, index) => Object.assign(item, { mechanism: 'piston', width: 122, height: 104, phase: index * 1.1 }));
            beat('stampede').cue = 'Super Paws breaks the pumping gates. Miss the star? Leap each striped gate.';
        } else if (id === 'alpine') {
            manifest.journey = { ...manifest.journey, signature: 'Avalanche escape', mechanic: 'avalanche', tip: 'Snowballs gather powder as they approach. Leap early; blue ramps carry you over snowbanks.' };
            for (const name of ['launch-variation','snowball-carry']) Object.assign(obstacles(name)[0], { mechanism: 'snowball-growth', travel: 200, rate: 58, height: 96, width: 96 });
            obstacles('launch-variation')[0].offset = 2.8;
            obstacles('avalanche-rush').forEach((item,index) => Object.assign(item, { mechanism: 'avalanche-bank', height: 104, width: 156, travel: 90, phase: index * .5 }));
            beat('avalanche-rush').cue = 'The snow front is building! Super Paws bursts through; without it, leap each low bank.';
        } else if (id === 'coast') {
            manifest.journey = { ...manifest.journey, signature: 'Surf break', mechanic: 'surf', tip: 'Foam is safe. A tall blue crest is solid: leap it or break through with Super Paws.' };
            for (const name of ['first-patrol','patrol-answer']) Object.assign(obstacles(name)[0], { mechanism: 'crab-dash', phase: name === 'first-patrol' ? 0 : 1.3 });
            Object.assign(obstacles('tide-combination')[0], { type: 'wave', motion: null, mechanism: 'surf', width: 152, height: 82, phase: .2 });
            Object.assign(obstacles('tide-combination')[1], { mechanism: 'tidal-drift', width: 112, height: 64, phase: 1.5 });
            Object.assign(beat('tide-combination'), { label: 'The tide turns', cue: 'Blue crests are solid. Leap the surf, land, then clear the floating timber.' });
            Object.assign(obstacles('pier-sprint')[0], { type: 'wave', mechanism: 'surf', width: 166, height: 88, phase: 1.1 });
            Object.assign(obstacles('pier-sprint')[1], { mechanism: 'tidal-drift', width: 122, height: 72, phase: .6 });
            beat('pier-sprint').cue = 'Super Paws splits the surf and timber. Miss the star? Leap each crest and log.';
        } else if (id === 'forest') {
            manifest.journey = { ...manifest.journey, signature: 'Living canopy', mechanic: 'canopy', tip: 'Mushrooms compress beneath your paws, then rebound. The forest floor stays open below the canopy.' };
            const rebound = beat('second-rebound');
            rebound.primitives[0] = { kind: 'platformRun', style: 'canopy', topY: 420, launchWidth: 148, launchVelocity: -990, segments: [[.6,1.8],[2.3,3.6]] };
            // The branch gap is the encounter. A missed launch or gap must lead
            // to genuinely open ground, never the historical low log below it.
            rebound.primitives = rebound.primitives.filter(item => item.kind !== 'obstacle');
            rebound.label = 'Living canopy'; rebound.cue = 'Rebound onto the branches. Leap the canopy gap, or land safely on the clear forest floor.';
            rebound.intent = { teaches: 'canopy-traversal', safe: { response: 'none', route: 'main' }, mastery: { response: 'leap', route: 'high' }, warning: { cue: 'spring and canopy branch gap', minSeconds: 1.35 } };
            beat('first-rebound').cue = 'Grounded paws compress the mushroom spring, then rebound toward the canopy acorn.';
            rebound.recovery.until = 32;
            Object.assign(obstacles('root-combination')[0], { type: 'log', mechanism: 'falling-log', width: 100, height: 68 });
            obstacles('canopy-bound').forEach((item,index) => Object.assign(item, { type: 'log', mechanism: 'falling-log', width: 118, height: 72, phase: index * .4 }));
            beat('canopy-bound').cue = 'Rustling branches fall ahead. Super Paws splinters them; one leap clears each settled log.';
        } else {
            manifest.journey = { ...manifest.journey, signature: 'Pressure release', mechanic: 'pressure', tip: 'A pressure ring warns before crystals grow. Outlined vents are safe; leap solid crystals.' };
            for (const item of manifest.beats.flatMap(item => item.primitives).filter(item => item.kind === 'obstacle' && item.type === 'crystal')) {
                item.mechanism = 'pressure-crystal'; item.height = 118; item.width = item.smash ? 112 : 84;
            }
            beat('outlined-prism').cue = 'The pressure ring warns before growth. Outlined vents are safe; leap a solid crystal.';
            beat('prism-break').cue = 'Pressure is peaking! Super Paws shatters the growing clusters; leap each one without power.';
        }
        result[id] = Object.freeze(manifest);
    }
    return Object.freeze(result);
})();

// Recovery layouts are a new, explicit provenance tier. Keep both earlier
// manifest families immutable so saved replays and historical fixtures retain
// their original authored geometry.
const RECOVERY_1_MANIFESTS = (() => {
    const result = {};
    for (const [id, source] of Object.entries(DYNAMIC_MANIFESTS)) {
        const manifest = JSON.parse(JSON.stringify(source));
        manifest.layoutId = `${id}-v3-recovery-1`;
        if (id === 'texas') {
            const beat = name => manifest.beats.find(item => item.id === name);
            const obstacles = name => beat(name).primitives.filter(item => item.kind === 'obstacle');

            manifest.journey = { ...JOURNEYS.texas, signature: 'Wind through the wash', mechanic: 'wind',
                tip: 'Rolling brush shows the wind. The open wash floor is always safe; leap only for the rim rewards.' };
            beat('first-hop').cue = 'Press once to leap.';

            // Restore the authored tumbleweed phrase and remove every machine
            // mutation from the recovered landscape.
            Object.assign(obstacles('tumble-three')[0], { type: 'tumbleweed', motion: 'roll', mechanism: 'accelerating-roll',
                width: 75, height: 74, travel: 225, rate: 68, acceleration: 58 });
            Object.assign(beat('tumble-three'), { label: 'Wind rhythm peak', cue: 'The last tumbleweed rides a stronger gust. One clear leap.' });

            // The reward silhouette itself communicates the opening choice;
            // collection must not depend on the generic high/main route latch.
            const fork = beat('canyon-fork');
            fork.primitives = fork.primitives.filter(item => item.kind !== 'routeGate').map(item => {
                const primitive = { ...item };
                delete primitive.route;
                return primitive;
            });

            const wash = beat('bridge-run');
            wash.label = 'Dry-wash choice';
            wash.cue = 'The wash floor stays open. Leap from the near bank for the rosette line along the rim.';
            wash.intent = { teaches: 'visible-optional-leap', safe: { response: 'none', route: 'main' },
                mastery: { response: 'leap', route: 'high' }, warning: { cue: 'wash bank and rosette line', minSeconds: 1.8 } };
            wash.primitives = [
                { kind: 'landmark', style: 'dry-wash' },
                { kind: 'treatLine', offset: 1.25, phrase: 'wash-floor', heights: [64,64,64,64] },
                { kind: 'treatLine', offset: 2.05, phrase: 'wash-rim', optional: true, heights: [105,165,245,315,250,165] },
                { kind: 'souvenir', height: 260, offset: 2.29, slot: 1 }
            ];
            wash.recovery = { until: 43, exit: 'main' };

            const power = beat('stampede');
            power.label = 'Wind-brush run';
            power.cue = 'Super Paws sends the loose brush spinning aside. Without it, one full leap clears the cluster.';
            power.intent.warning = { cue: 'star and loose brush cluster', minSeconds: 1.8 };
            power.primitives = [
                { kind: 'power', type: 'star', powerMoment: true, powerCue: 'SUPER PAWS' },
                { kind: 'obstacle', type: 'tumbleweed', offset: 2.05, smash: true, mechanism: 'wind-brush', width: 66, height: 58, phase: 0 },
                { kind: 'obstacle', type: 'tumbleweed', offset: 2.29, smash: true, mechanism: 'wind-brush', width: 62, height: 54, phase: .18 },
                { kind: 'landmark', style: 'wind-brush' },
                { kind: 'treatLine', offset: 4.5, phrase: 'tailwind-run', heights: [64,64,64,64,64] }
            ];

            const finale = beat('golden-arch');
            finale.label = 'Golden-hour finish';
            finale.cue = 'Run home on the open trail, or take one last leap for the rosette.';
            finale.intent = { teaches: 'player-chosen-finish', safe: { response: 'none' }, mastery: { response: 'leap' },
                warning: { cue: 'low finish line and rosette arc', minSeconds: 1.8 } };
            finale.primitives = [
                { kind: 'landmark', style: 'golden-hour-finish' },
                { kind: 'treatLine', offset: 1.25, phrase: 'home-line', heights: [64,64,64,64,64] },
                { kind: 'treatLine', offset: 6.32, phrase: 'final-rosette', optional: true, heights: [90,145,220,285,215] },
                { kind: 'souvenir', height: 245, offset: 6.32, slot: 2 }
            ];
        } else if (id === 'alpine') {
            const beat = name => manifest.beats.find(item => item.id === name);
            const stripRoutes = target => { target.primitives = target.primitives.filter(item => item.kind !== 'routeGate').map(item => {
                const primitive = { ...item }; delete primitive.route; return primitive;
            }); };
            manifest.journey = { ...manifest.journey, signature: 'Powder carry', mechanic: 'snow',
                tip: 'Stay grounded for the broad powder lift, or use the same ordinary leap over rolling snow.' };
            stripRoutes(beat('summit-gate'));
            Object.assign(beat('quiet-descent'), { label: 'Powder breath', cue: 'Easy paws through the open powder.' });
            beat('quiet-descent').primitives[0] = { kind: 'landmark', style: 'powder-breath' };
            const rush = beat('avalanche-rush');
            rush.label = 'Cornice break'; rush.cue = 'Super Paws parts the soft cornice. Miss it? Leap the two low banks.';
            rush.primitives = [
                { kind: 'power', type: 'star', powerMoment: true, powerCue: 'POWDER RUSH' },
                { kind: 'obstacle', type: 'snowpile', offset: 2.0, smash: true, mechanism: 'avalanche-bank', height: 72, width: 132, travel: 55 },
                { kind: 'obstacle', type: 'snowpile', offset: 4.55, smash: true, mechanism: 'avalanche-bank', height: 58, width: 104, travel: 35 },
                { kind: 'landmark', style: 'cornice-break' }
            ];
            const finale = beat('summit-finish');
            finale.label = 'Summit finish'; finale.cue = 'Run beneath the flags, or leap once for the snowflake.';
            finale.primitives = [
                { kind: 'landmark', style: 'summit-finish' },
                { kind: 'treatLine', offset: 1.0, phrase: 'summit-home', heights: [64,64,64,64] },
                { kind: 'treatLine', offset: 7.44, phrase: 'snowflake-rise', optional: true, heights: [90,150,230,300] },
                { kind: 'souvenir', height: 260, offset: 7.44, slot: 2 }
            ];
        } else if (id === 'coast') {
            const beat = name => manifest.beats.find(item => item.id === name);
            const stripRoutes = target => { target.primitives = target.primitives.filter(item => item.kind !== 'routeGate').map(item => {
                const primitive = { ...item }; delete primitive.route; return primitive;
            }); };
            manifest.journey = { ...manifest.journey, signature: 'Shoreline timing', mechanic: 'crab',
                tip: 'Crabs pause before they cross. Water stays scenery; leap the driftwood resting on sand.' };
            stripRoutes(beat('outer-sand'));
            Object.assign(beat('shore-breath'), { label: 'Shore breath', cue: 'A quiet stretch as the foam retreats.' });
            beat('shore-breath').primitives[0] = { kind: 'landmark', style: 'shore-breath' };
            const combo = beat('tide-combination');
            combo.label = 'Driftwood landing'; combo.cue = 'Clear the crab, land, then leap the timber resting on sand.';
            combo.primitives = combo.primitives.map(item => item.kind === 'obstacle' && item.mechanism === 'surf'
                ? { kind: 'obstacle', type: 'crab', motion: 'patrol', mechanism: 'crab-dash', amplitude: 54 }
                : item);
            const sprint = beat('pier-sprint');
            sprint.label = 'Driftwood scatter'; sprint.cue = 'Super Paws scatters the loose timber. Without it, leap the single low log.';
            sprint.primitives = [
                { kind: 'power', type: 'star', powerMoment: true, powerCue: 'SHORE SPRINT' },
                { kind: 'obstacle', type: 'driftwood', offset: 2.35, smash: true, mechanism: 'tidal-drift', width: 118, height: 60, phase: .4 },
                { kind: 'landmark', style: 'driftwood-scatter' },
                { kind: 'treatLine', offset: 4.45, phrase: 'foam-run', heights: [64,78,64,78,64] }
            ];
            const finale = beat('sunset-pier');
            finale.label = 'Sunset finish'; finale.cue = 'Follow the wet-sand glints, or leap for the pearl.';
            finale.primitives = [
                { kind: 'landmark', style: 'sunset-finish' },
                { kind: 'treatLine', offset: 1.0, phrase: 'pearl-home', heights: [64,64,64,64] },
                { kind: 'treatLine', offset: 6.2, phrase: 'pearl-skip', optional: true, heights: [85,135,205,270,205,135] },
                { kind: 'souvenir', height: 235, offset: 6.32, slot: 2 }
            ];
        } else if (id === 'forest') {
            const beat = name => manifest.beats.find(item => item.id === name);
            const stripRoutes = target => { target.primitives = target.primitives.filter(item => item.kind !== 'routeGate').map(item => {
                const primitive = { ...item }; delete primitive.route; return primitive;
            }); };
            manifest.journey = { ...manifest.journey, signature: 'Living canopy', mechanic: 'canopy',
                tip: 'Mushrooms rebound grounded paws. Branches support the upper path; the forest floor remains clear.' };
            stripRoutes(beat('canopy-choice'));
            Object.assign(beat('mossy-floor'), { label: 'Moss breath', cue: 'Easy paws through the soft forest light.' });
            beat('mossy-floor').primitives[0] = { kind: 'landmark', style: 'moss-breath' };
            const canopy = beat('second-rebound');
            canopy.primitives[0] = { kind: 'platformRun', style: 'canopy', topY: 500, launchWidth: 148,
                launchVelocity: -760, segments: [[.65,1.85],[2.3,3.7]] };
            const bound = beat('canopy-bound');
            bound.label = 'Branch fall'; bound.cue = 'Super Paws parts the fallen branch. Miss it? One ordinary leap clears it.';
            bound.primitives = [
                { kind: 'power', type: 'star', powerMoment: true, powerCue: 'CANOPY BOUND' },
                { kind: 'obstacle', type: 'log', offset: 2.35, smash: true, mechanism: 'falling-log', width: 118, height: 68 },
                { kind: 'landmark', style: 'branch-fall' }
            ];
            const finale = beat('forest-opening');
            finale.label = 'Forest finish'; finale.cue = 'Run into the clearing, or leap for the last acorn.';
            finale.primitives = [
                { kind: 'landmark', style: 'forest-finish' },
                { kind: 'treatLine', offset: 1.0, phrase: 'opening-home', heights: [64,64,64,64,64] },
                { kind: 'treatLine', offset: 6.44, phrase: 'acorn-step', optional: true, heights: [100,185,275,215] },
                { kind: 'souvenir', height: 245, offset: 6.44, slot: 2 }
            ];
        } else if (id === 'ember') {
            const beat = name => manifest.beats.find(item => item.id === name);
            const stripRoutes = target => { target.primitives = target.primitives.filter(item => item.kind !== 'routeGate').map(item => {
                const primitive = { ...item }; delete primitive.route; return primitive;
            }); };
            manifest.journey = { ...manifest.journey, signature: 'Prism pulse', mechanic: 'pressure',
                tip: 'Outlined crystals are quiet. A restrained ring warns before a solid crystal returns.' };
            const returnBeat = beat('returning-prism');
            returnBeat.label = 'Basalt step';
            returnBeat.cue = 'The crystal pressure eases here. One ordinary leap clears the basalt.';
            returnBeat.intent = { teaches: 'ordinary-leap-variation', safe: { response: 'leap' }, mastery: null,
                warning: { cue: 'grounded basalt', minSeconds: 1.8 } };
            returnBeat.primitives = returnBeat.primitives.filter(item => !(item.kind === 'obstacle' && item.type === 'crystal'));
            stripRoutes(beat('prism-gate'));
            beat('ember-rest').primitives[0] = { kind: 'landmark', style: 'ember-rest' };
            const fracture = beat('prism-break');
            fracture.label = 'Single prism break'; fracture.cue = 'Super Paws fractures the cluster. Without it, wait for the outline or leap once.';
            fracture.primitives = [
                { kind: 'power', type: 'star', powerMoment: true, powerCue: 'PRISM BREAK' },
                { kind: 'obstacle', type: 'crystal', offset: 2.35, smash: true, mechanism: 'pressure-crystal', width: 108, height: 112 },
                { kind: 'landmark', style: 'prism-break' },
                { kind: 'treatLine', offset: 4.4, phrase: 'ember-release', heights: [64,82,100,82,64] },
                { kind: 'souvenir', height: 230, offset: 4.55, slot: 1 }
            ];
            const finale = beat('prism-resolve');
            finale.label = 'Ember finish'; finale.cue = 'Follow the quiet shelf, or leap through the final prism glints.';
            finale.primitives = [
                { kind: 'landmark', style: 'ember-finish' },
                { kind: 'treatLine', offset: 1.0, phrase: 'prism-home', heights: [64,64,64,64] },
                { kind: 'treatLine', offset: 6.32, phrase: 'prism-glints', optional: true, heights: [90,170,260,295,190] },
                { kind: 'souvenir', height: 255, offset: 6.32, slot: 2 }
            ];
        }
        // Place names orient the player; implementation verbs stay in authoring
        // metadata rather than becoming the visible progress label.
        const placeNames = {
            texas: { 'canyon-fork':'Canyon bend', 'tumble-one':'Tumbleweed hollow', 'tumble-two':'Tumbleweed hollow', 'tumble-three':'Windy ridge', 'big-sky':'Big sky', 'bridge-run':'The dry wash', 'stampede':'Tailwind' },
            alpine: { 'powder-launch':'Powder trail', 'quiet-descent':'Snowfield', 'launch-variation':'The snowdrift', 'snowball-carry':'Snowball slope' },
            coast: { 'first-patrol':'Crab beach', 'shore-breath':'Quiet shore', 'patrol-answer':'Tide pools' },
            forest: { 'first-rebound':'Mushroom grove', 'mossy-floor':'Mossy hollow', 'canopy-choice':'Acorn glade', 'root-combination':'Old roots', 'canopy-bound':'Fallen oak' },
            ember: { 'outlined-prism':'Quiet crystals', 'solid-prism':'Crystal rise', 'ember-rest':'Warm stone', 'prism-gate':'Prism shelf', 'prism-break':'Crystal glow' }
        };
        for (const beat of manifest.beats) beat.label = placeNames[id]?.[beat.id] || beat.label;
        if (id === 'alpine') manifest.beats[0].cue = 'The powder lifts grounded paws.';
        if (id === 'forest') manifest.beats[0].cue = 'Mushrooms bounce grounded paws.';
        result[id] = Object.freeze(manifest);
    }
    return Object.freeze(result);
})();

// Revision 2 is a deliberately small pacing experiment derived from the
// frozen recovery-1 midpoint. Geometry not named here remains byte-for-byte
// equivalent after compilation.
const RECOVERY_2_MANIFESTS = (() => {
    const result = {};
    for (const [id, source] of Object.entries(RECOVERY_1_MANIFESTS)) {
        const manifest = JSON.parse(JSON.stringify(source));
        const beat = name => manifest.beats.find(item => item.id === name);
        manifest.layoutId = `${id}-v3-recovery-2`;
        manifest.nominalSeconds -= 4;
        const finale = manifest.beats.at(-1);
        finale.at -= 4;
        finale.recovery.until -= 4;

        if (id === 'texas') {
            const wash = beat('bridge-run');
            wash.at = 35;
            wash.recovery.until = 40;
        } else if (id === 'forest') {
            const choice = beat('canopy-choice'), rebound = beat('second-rebound');
            choice.at = 17; choice.recovery.until = 21.5;
            rebound.at = 24; rebound.recovery.until = 29;
        } else if (id === 'coast') {
            beat('tide-combination').primitives.push({ kind: 'treatLine', offset: 4.0,
                phrase: 'foam-pearls', optional: true, heights: [95,145,215,275] });
        } else if (id === 'ember') {
            manifest.beats[0].cue = 'Leap over solid crystals. Quiet ones are safe.';
        }
        result[id] = Object.freeze(manifest);
    }
    return Object.freeze(result);
})();

// Revision 3 restores one readable elevated traversal grammar without changing
// the accepted Coast or Ember recovery-2 courses. Natural ramps launch from the
// safe floor; supported ledges are optional and always leave that floor open.
const RECOVERY_MANIFESTS = (() => {
    const result = { coast: RECOVERY_2_MANIFESTS.coast, ember: RECOVERY_2_MANIFESTS.ember };
    for (const id of ['texas','alpine','forest']) {
        const manifest = JSON.parse(JSON.stringify(RECOVERY_2_MANIFESTS[id]));
        const beat = name => manifest.beats.find(item => item.id === name);
        manifest.layoutId = `${id}-v3-recovery-3`;
        if (id === 'texas') {
            const wash = beat('bridge-run');
            wash.cue = 'Stay grounded for the log ledges, or leap early to keep the open wash floor.';
            wash.primitives = [
                { kind: 'landmark', style: 'dry-wash' },
                { kind: 'platformRun', style: 'log-ledge', topY: 450, launchWidth: 156,
                    launchVelocity: -1240, launchKind: 'log-ramp', segments: [[1.15,2.55],[2.9,4.25]] },
                { kind: 'treatLine', offset: 1.0, phrase: 'wash-floor', heights: [64,64,64,64] },
                { kind: 'treatLine', offset: .6, phrase: 'wash-rim', optional: true, heights: [270,430,510,510,430,270] },
                { kind: 'souvenir', height: 500, offset: .6, slot: 1 }
            ];
        } else if (id === 'alpine') {
            const first = beat('powder-launch');
            Object.assign(first.primitives.find(item => item.kind === 'surface'),
                { kindName: 'snow-ramp', width: 156, velocity: -1240 });
            Object.assign(first.primitives.find(item => item.kind === 'treatLine'),
                { offset: .6, heights: [270,430,510,510,430,270] });
            Object.assign(first.primitives.find(item => item.kind === 'souvenir'), { height: 500, offset: .6 });
            const shelf = beat('launch-variation');
            shelf.cue = 'Stay grounded on the powder lip, land on the shelf, then leap its short gap.';
            shelf.intent = { teaches: 'snow-shelf-traversal', safe: { response: 'none', route: 'main' },
                mastery: { response: 'leap', route: 'high' }, warning: { cue: 'powder ramp and snow shelf', minSeconds: 1.8 } };
            shelf.primitives = [
                { kind: 'platformRun', style: 'snow-shelf', topY: 450, launchWidth: 156,
                    launchVelocity: -1240, launchKind: 'snow-ramp', segments: [[1.15,2.55],[2.9,4.25]] },
                { kind: 'treatLine', offset: 2.72, phrase: 'shelf-line', optional: true, heights: [170,240,315,240,170] }
            ];
            const ball = beat('snowball-carry').primitives.find(item => item.kind === 'obstacle');
            Object.assign(ball, { mechanism: 'mountain-snowball', width: 84, height: 84,
                sourceOffset: 140, sourceY: 365, descentSeconds: 1.1, travel: 150, rate: 42, acceleration: 22 });
            beat('snowball-carry').cue = 'The mountain chute releases one snowball. Watch it land, then leap its downhill roll.';
            const rush = beat('avalanche-rush');
            rush.primitives = rush.primitives.filter(item => !(item.kind === 'landmark' && item.style === 'cornice-break'));
            for (const bank of rush.primitives.filter(item => item.kind === 'obstacle')) {
                delete bank.mechanism; delete bank.motion; delete bank.travel; delete bank.phase;
            }
        } else {
            for (const name of ['first-rebound','root-combination']) {
                Object.assign(beat(name).primitives.find(item => item.kind === 'surface'),
                    { kindName: 'spring', width: 156, velocity: -1240 });
            }
            const first = beat('first-rebound');
            Object.assign(first.primitives.find(item => item.kind === 'treatLine'),
                { offset: .6, heights: [270,430,510,510,430,270] });
            Object.assign(first.primitives.find(item => item.kind === 'souvenir'), { height: 500, offset: .6 });
            const canopy = beat('second-rebound');
            canopy.cue = 'The mushroom ramp lifts you to the supported log ledges. Leap their short gap or use the clear floor.';
            canopy.primitives[0] = { kind: 'platformRun', style: 'canopy', topY: 450, launchWidth: 156,
                launchVelocity: -1240, launchKind: 'canopy', segments: [[1.15,2.55],[2.9,4.25]] };
        }
        result[id] = Object.freeze(manifest);
    }
    return Object.freeze(result);
})();
OBSTACLE_TYPES.wave = { w: 152, h: 82 };

function validateCourseManifest(manifest) {
    const validResponses = new Set(['none', 'leap', 'power-fallback']);
    if (!manifest || manifest.version !== 3 || !Array.isArray(manifest.beats) || !manifest.beats.length) return { valid: false, errors: ['missing v3 beats'] };
    const errors = [], ids = new Set();
    for (const beat of manifest.beats) {
        if (!beat?.id || ids.has(beat.id)) errors.push('invalid beat id'); ids.add(beat?.id);
        if (!Number.isFinite(beat?.at) || !beat.intent?.safe || !validResponses.has(beat.intent.safe.response)) errors.push(`invalid safe response: ${beat?.id}`);
        if (beat.intent.mastery && !validResponses.has(beat.intent.mastery.response)) errors.push(`invalid mastery response: ${beat.id}`);
        if (!Number.isFinite(beat.intent?.warning?.minSeconds) || !beat.recovery?.exit || !Array.isArray(beat.primitives)) errors.push(`incomplete beat: ${beat?.id}`);
        for (const primitive of beat.primitives || []) if (primitive.kind === 'platformRun') {
            const segments = primitive.segments;
            if (!Number.isFinite(primitive.topY) || primitive.topY < 300 || primitive.topY > 540 || !Array.isArray(segments) || segments.length < 2 ||
                segments.some((segment, index) => !Array.isArray(segment) || segment.length !== 2 || !segment.every(Number.isFinite) || segment[0] < 0 || segment[1] <= segment[0] || (index && segment[0] <= segments[index - 1][1])))
                errors.push(`invalid platform run: ${beat.id}`);
        }
    }
    return { valid: !errors.length, errors };
}

class Course {
    constructor(track, difficulty, { dynamic = false, recovery = false, recoveryRevision = 3 } = {}) {
        if (recovery && ![1,2,3].includes(recoveryRevision)) throw new Error(`Unsupported recovery revision: ${recoveryRevision}`);
        this.recovery = recovery;
        this.recoveryRevision = recovery ? recoveryRevision : null;
        this.dynamic = dynamic || recovery;
        this.track = track; this.version = courseVersionForTrack(track); this.layoutId = `${track.id}-v${this.version}-elevation-1`;
        const manifests = recovery ? (recoveryRevision === 1 ? RECOVERY_1_MANIFESTS : recoveryRevision === 2 ? RECOVERY_2_MANIFESTS : RECOVERY_MANIFESTS) : this.dynamic ? DYNAMIC_MANIFESTS : V3_MANIFESTS;
        const manifest = this.version === 3 ? manifests[track.id] : null;
        if (this.dynamic && manifest) this.layoutId = manifest.layoutId;
        if (manifest) {
            this.buildV3(track, difficulty, manifest);
            if (this.dynamic) {
                this.dynamicSignature = this.journey.mechanic;
                this.obstacles.forEach((item,index) => { item.id = `${track.id}:${item.beatId}:${index}`; item.baseHeight = item.height; item.baseWidth = item.width; item.baseY = 600; });
                this.events = []; this.lastDynamicDistance = 0; this.lastDynamicTime = 0;
            }
            return;
        }
        this.journey = JOURNEYS[track.id];
        // Author in seconds at starting speed: difficulty retains the dramatic structure.
        this.unit = difficulty.INITIAL_SPEED * 60;
        this.length = this.unit * 55;
        this.obstacles = []; this.pickups = []; this.surfaces = []; this.platforms = [];
        const names = ['First paws', 'Choose your line', 'Treat current', 'Catch your breath', this.journey.signature, 'Super Paws parade', this.journey.finale];
        this.sections = [0, 9, 18, 28, 32, 39, 46].map((t, i) => ({ x: t * this.unit, name: names[i], index: i }));
        this.practiceSections = this.sections.slice(1).map((section, i) => ({
            id: `${track.id}-section-${section.index}`, sectionIndex: section.index, title: section.name,
            entryX: Math.max(0, section.x - this.unit * .8),
            exitX: Math.min(this.length, (this.sections[i + 2]?.x || this.length) + this.unit * .35)
        }));
        const addTreat = (t, height, extra = {}) => this.pickups.push({worldX:t*this.unit,y:600-height,type:'treat',collected:false,...extra});
        const arc = (t, high = false) => [-.48,-.24,0,.24,.48].forEach((o,i)=>addTreat(t+o,(high?[125,285,340,285,125]:[80,190,285,190,80])[i]));
        const obstacle = (t, type, extra = {}) => {
            const spec = OBSTACLE_TYPES[type];
            const item = { worldX:t*this.unit, originX:t*this.unit, type, width:spec.w, height:spec.h,hit:false,passed:false,...extra };
            this.obstacles.push(item); return item;
        };
        const power = (t,type) => this.pickups.push({worldX:t*this.unit,y:535,type,collected:false});
        // First collision is a practice encounter; its shield also teaches protection.
        power(1.8,'shield'); obstacle(5,track.types[1],{tutorial:true}); arc(5);
        obstacle(8,track.types[0]); arc(8);
        // Deliberate shield trade: ground prize behind a hazard, or leap over it.
        obstacle(12,track.types[0],{choice:true}); arc(12,true);
        this.pickups.push({worldX:12.28*this.unit,y:535,type:'souvenir',slot:0,collected:false});
        obstacle(16,track.types[1],{height:52,low:true});
        [-.4,-.2,0,.2,.4].forEach((o,i)=>addTreat(16+o,[65,130,175,130,65][i]));
        [-.25,0,.25].forEach(o=>addTreat(16+o,315,{bonus:true}));
        power(18.4,'magnet');
        for(const t of [20.5,23.5]) { obstacle(t,track.types[1]); arc(t); }
        // One long leap clears a marked pair; this changes the rhythm without a gap.
        const expert = difficulty === CONFIG.DIFFICULTY.HARD;
        for(const t of [26.35,26.65]) obstacle(t,track.types[1],{height:expert?58:48,width:expert?64:52,pair:true});
        arc(26.5);
        // Split trails are optional bonus treats; missed bonus treats do not break a chain.
        for(let i=0;i<12;i++) addTreat(19.5+i*.6,i%2?340:65,{bonus:true});
        for(let i=0;i<6;i++) addTreat(29+i*.35,65);
        for(const t of [34,37]) {
            if(track.id==='texas') obstacle(t,'tumbleweed',{motion:'roll',travel:180,rate:65});
            else if(track.id==='alpine') obstacle(t,'snowball',{motion:'roll',travel:150,rate:55});
            else if(track.id==='coast') obstacle(t,'crab',{motion:'patrol',amplitude:55});
            else if(track.id==='ember') obstacle(t,'crystal',{motion:'phase',phase:t%3});
            else obstacle(t,'log');
            arc(t);
        }
        if(['alpine','forest'].includes(track.id)) {
            this.surfaces.push({worldX:33.2*this.unit,width:120,used:false,kind:track.id==='alpine'?'snow':'spring',velocity:-1120});
            this.pickups.push({worldX:33.85*this.unit,y:180,type:'souvenir',slot:1,collected:false});
        } else this.pickups.push({worldX:37*this.unit,y:260,type:'souvenir',slot:1,collected:false});
        power(39.2,'star');
        // Spaced pairs remain jumpable when the player misses the power.
        for(const t of [41,43.3]) { obstacle(t,track.id==='ember'?'crystal':track.types[1],{smash:true}); arc(t); }
        // Clear exit until the final high-reward leap; no hazard on expiry.
        obstacle(49,track.types[0],{finale:true}); arc(49,true);
        this.pickups.push({worldX:49*this.unit,y:260,type:'souvenir',slot:2,collected:false});
        for(let i=0;i<8;i++) addTreat(51.7+i*.3,65);
        this.pickups.sort((a,b)=>a.worldX-b.worldX);
        this.totalTreats = this.pickups.filter(p=>p.type==='treat').length;
    }
    buildV3(track, difficulty, manifest) {
        const validation = validateCourseManifest(manifest);
        if (!validation.valid) throw new Error(`Invalid ${track.id} v3 course: ${validation.errors.join(', ')}`);
        this.journey = manifest.journey || { signature: 'Tumbleweed rhythm', mechanic: 'roll', souvenir: 'Canyon rosette', finale: 'Golden arch', tip: 'Rolling tumbleweeds cross the marked trail. Press once for a full leap.' };
        this.unit = difficulty.INITIAL_SPEED * 60;
        this.length = manifest.nominalSeconds * this.unit;
        this.obstacles = []; this.pickups = []; this.surfaces = []; this.platforms = [];
        this.landmarks = []; this.routeGates = []; this.recoveryZones = []; this.warnings = []; this.powerMoments = [];
        this.phrases = {}; this.activeRoute = 'main'; this.routeHistory = [];
        this.beats = manifest.beats.map((beat, index) => ({ ...beat, x: beat.at * this.unit, index }));
        this.beatById = Object.fromEntries(this.beats.map(beat => [beat.id, beat]));
        this.sections = this.beats.map(beat => ({ x: beat.x, name: beat.label, index: beat.index, beatId: beat.id }));
        this.sections[0] = { ...this.sections[0], x: 0 };
        this.practiceSections = this.sections.slice(1).map((section, i) => ({
            id: `${track.id}-section-${section.index}`, sectionIndex: section.index, title: section.name,
            entryX: Math.max(0, section.x - this.unit * .8),
            exitX: Math.min(this.length, (this.sections[i + 2]?.x || this.length) + this.unit * .35)
        }));
        const warningFor = (beat, worldX, kind, target) => this.warnings.push({ beatId: beat.id, worldX, kind, target, lead: CONFIG.CAMERA.PREVIEW_DISTANCE, ...beat.intent.warning });
        const addTreat = (beat, offset, height, extra = {}) => {
            const item = { worldX: (beat.at + offset) * this.unit, y: 600 - height, type: 'treat', collected: false, beatId: beat.id, ...extra };
            this.pickups.push(item);
            if (item.phrase) (this.phrases[item.phrase] ||= { id: item.phrase, optional: Boolean(item.optional), pickups: [], completed: false }).pickups.push(item);
        };
        const addObstacle = (beat, primitive) => {
            const spec = OBSTACLE_TYPES[primitive.type];
            const worldX = (beat.at + (primitive.offset || 0)) * this.unit;
            const item = { worldX, originX: worldX, type: primitive.type, width: primitive.width || spec.w, height: primitive.height || spec.h,
                hit: false, passed: false, beatId: beat.id, ...primitive };
            delete item.kind; delete item.offset;
            this.obstacles.push(item); warningFor(beat, worldX, 'obstacle', item); return item;
        };
        for (const beat of this.beats) {
            this.recoveryZones.push({ beatId: beat.id, start: beat.x, until: beat.recovery.until * this.unit, exit: beat.recovery.exit });
            for (const primitive of beat.primitives) {
                if (primitive.kind === 'obstacle') addObstacle(beat, primitive);
                else if (primitive.kind === 'power') {
                    const power = { worldX: beat.x, y: 535, type: primitive.type, collected: false, beatId: beat.id,
                        powerMoment: Boolean(primitive.powerMoment), powerCue: primitive.powerCue || null };
                    this.pickups.push(power); if (power.powerMoment) this.powerMoments.push(power);
                }
                else if (primitive.kind === 'souvenir') this.pickups.push({ worldX: (beat.at + (primitive.offset || 0)) * this.unit, y: 600 - primitive.height, type: 'souvenir', collected: false, beatId: beat.id, route: primitive.route, slot: primitive.slot });
                else if (primitive.kind === 'treatLine') {
                    const step = .24, center = (primitive.heights.length - 1) / 2;
                    const origin = primitive.offset || 0;
                    primitive.heights.forEach((height, index) => addTreat(beat, origin + (index - center) * step, height, { phrase: primitive.phrase, route: primitive.route, optional: primitive.optional, bonus: primitive.optional }));
                } else if (primitive.kind === 'routeGate') {
                    const gate = { beatId: beat.id, worldX: beat.x, highY: primitive.highY, rejoinX: (beat.at + primitive.rejoinOffset) * this.unit, selected: false, rejoined: false };
                    this.routeGates.push(gate); warningFor(beat, gate.worldX, 'gate', gate);
                } else if (primitive.kind === 'surface') {
                    this.surfaces.push({ beatId: beat.id, worldX: (beat.at + (primitive.offset || 0)) * this.unit,
                        width: primitive.width || 120, used: false, kind: primitive.kindName || 'spring', velocity: primitive.velocity || -1120 });
                    warningFor(beat, this.surfaces.at(-1).worldX, 'surface', this.surfaces.at(-1));
                } else if (primitive.kind === 'platformRun') {
                    const launchX = (beat.at + (primitive.launchOffset || 0)) * this.unit;
                    this.surfaces.push({ beatId: beat.id, worldX: launchX, width: primitive.launchWidth || 156, used: false,
                        kind: primitive.launchKind || primitive.style || 'pipeline', velocity: primitive.launchVelocity || -840,
                        triggerRadius: primitive.launchRadius || (primitive.launchKind ? (primitive.launchWidth || 156) / 2 : 22) });
                    primitive.segments.forEach((segment, segmentIndex) => this.platforms.push({ beatId: beat.id,
                        worldStart: (beat.at + segment[0]) * this.unit, worldEnd: (beat.at + segment[1]) * this.unit,
                        y: primitive.topY, style: primitive.style || 'pipeline', segmentIndex }));
                    warningFor(beat, launchX, 'surface', this.surfaces.at(-1));
                } else if (primitive.kind === 'landmark') this.landmarks.push({ beatId: beat.id, worldX: beat.x, style: primitive.style });
            }
        }
        const finale = this.beats.at(-1);
        if (!this.recovery) this.surfaces.push({ beatId: finale.id, worldX: this.length - this.unit * .8, width: 132, used: false,
            kind: 'photo', velocity: -840, triggerRadius: 22, photo: true });
        this.pickups.sort((a, b) => a.worldX - b.worldX);
        // Optional lines do not break a combo when missed, but still count in
        // the 60%-of-all-available-treats star contract.
        this.totalTreats = this.pickups.filter(p => p.type === 'treat').length;
    }
    beatAt(distance) { return this.sections.filter(section => section.x <= distance).at(-1) || this.sections[0]; }
    supportAt(distance, pawY) {
        return (this.platforms || []).find(platform => distance >= platform.worldStart && distance <= platform.worldEnd && pawY <= platform.y + 12) || null;
    }
    nextWarning(distance) {
        return (this.warnings || []).filter(w => {
            const target = w.target;
            return !(target?.hit || target?.passed || target?.used || target?.selected) && (target?.worldX ?? w.worldX) > distance - 20;
        }).sort((a, b) => (a.target?.worldX ?? a.worldX) - (b.target?.worldX ?? b.worldX))[0];
    }
    updateRoutes(distance, character) {
        for (const gate of this.routeGates || []) {
            if (!gate.selected && distance >= gate.worldX) {
                gate.selected = true; gate.route = character.y < gate.highY ? 'high' : 'main'; this.activeRoute = gate.route;
                this.routeHistory.push({ beatId: gate.beatId, route: gate.route });
            }
            if (gate.selected && !gate.rejoined && distance >= gate.rejoinX) { gate.rejoined = true; this.activeRoute = 'main'; }
        }
    }
    completePhrase(id) {
        const phrase = this.phrases[id];
        if (!phrase || phrase.completed || !phrase.pickups.every(pickup => pickup.collected)) return false;
        phrase.completed = true; return true;
    }
    sectionAt(distance) { return this.sections.filter(s=>s.x<=distance).at(-1); }
    practiceForDistance(distance) { return this.practiceSections.find(item => distance >= item.entryX && distance < item.exitX) || this.practiceSections.at(-1); }
    update(dt, distance, time) {
        if (this.dynamic) { this.updateDynamic(dt, distance, time); return; }
        for(const o of this.obstacles) {
            if(o.hit || o.passed) continue;
            if(o.motion==='roll' && o.originX-distance<1150) {
                o.offset = Math.min(o.travel,(o.offset||0)+o.rate*dt); o.worldX=o.originX-o.offset;
            }
            if(o.motion==='patrol') o.worldX=o.originX+Math.sin(time*1.5)*o.amplitude;
            if(o.motion==='phase') {
                const phase=(time+o.phase)%3.6;
                o.active=phase<2.2; o.warning=phase>3.05;
            }
        }
    }
    // The simulation clock owns every phase; rendering and reduced effects never
    // mutate hazards. Activation interpolates the preview crossing so different
    // frame partitions produce the same approach animation.
    updateDynamic(dt, distance, time) {
        const clamp = value => Math.max(0, Math.min(1, value));
        for (const o of this.obstacles) {
            if (o.hit || o.passed) continue;
            if (o.activatedAt === undefined && o.originX - distance <= 1150) {
                const span = distance - this.lastDynamicDistance;
                const fraction = span > 0 ? clamp((o.originX - 1150 - this.lastDynamicDistance) / span) : 1;
                o.activatedAt = this.lastDynamicTime + (time - this.lastDynamicTime) * fraction;
                this.pushEvent({ kind: 'anticipation', obstacleId: o.id, mechanism: o.mechanism, worldX: o.worldX, time: o.activatedAt });
            }
            const elapsed = o.activatedAt === undefined ? 0 : Math.max(0, time - o.activatedAt);
            const priorActive = o.active;
            o.baseY = 600; o.warning = false; o.active = true;
            o.phaseProgress = 0; o.state = 'solid';
            if (o.mechanism === 'mountain-snowball') {
                const descent = o.descentSeconds || 1.1;
                if (elapsed < descent) {
                    const progress = clamp(elapsed / descent);
                    o.worldX = o.originX + (o.sourceOffset || 140) * (1 - progress);
                    o.baseY = (o.sourceY || 365) + (600 - (o.sourceY || 365)) * progress * progress;
                    o.active = false; o.warning = true; o.phaseProgress = progress; o.state = 'descending';
                } else {
                    const rolling = elapsed - descent;
                    const offset = Math.min(o.travel || 150, (o.rate || 42) * rolling + .5 * (o.acceleration || 22) * rolling * rolling);
                    o.worldX = o.originX - offset; o.baseY = 600; o.rotation = -offset / Math.max(20, o.baseWidth / 2);
                    o.active = true; o.warning = rolling < .2; o.phaseProgress = 1; o.state = 'rolling';
                }
            } else if (o.mechanism === 'accelerating-roll' || o.mechanism === 'snowball-growth') {
                const growth = clamp(elapsed / 1.3);
                const acceleration = o.acceleration || 36;
                const offset = Math.min(o.travel || 200, (o.rate || 48) * elapsed + .5 * acceleration * elapsed * elapsed);
                o.worldX = o.originX - offset; o.rotation = -offset / Math.max(20, o.baseWidth / 2);
                o.phaseProgress = growth; o.state = growth < 1 ? 'gathering' : 'rolling';
                if (o.mechanism === 'snowball-growth') o.width = o.height = 36 + (o.baseHeight - 36) * growth;
            } else if (o.mechanism === 'piston') {
                const phase = ((time + (o.phase || 0)) % 3.8) / 3.8;
                const lift = .5 - .5 * Math.cos(phase * Math.PI * 2);
                o.height = 30 + (o.baseHeight - 30) * lift;
                o.phaseProgress = lift; o.warning = phase < .22; o.state = phase < .5 ? 'rising' : 'retracting';
            } else if (o.mechanism === 'avalanche-bank') {
                const growth = clamp((elapsed - .45) / .9);
                o.height = 24 + (o.baseHeight - 24) * growth;
                o.width = o.baseWidth * (.6 + .4 * growth);
                o.worldX = o.originX - (o.travel || 90) * clamp((elapsed - .5) / 1.6);
                o.warning = elapsed < .65; o.phaseProgress = growth; o.state = growth < 1 ? 'building' : 'settled';
            } else if (o.mechanism === 'crab-dash') {
                const phase = (time + (o.phase || 0)) % 3.8;
                const progress = clamp((phase - .9) / 1.4);
                o.worldX = o.originX + Math.sin(progress * Math.PI * 2) * (o.amplitude || 54);
                o.warning = phase < .9; o.phaseProgress = progress; o.state = phase < .9 ? 'crouch' : phase < 2.3 ? 'scuttle' : 'rest';
            } else if (o.mechanism === 'surf') {
                const phase = o.smash ? Math.min(2.7, elapsed + .5) : (time + (o.phase || 0)) % 4.8;
                const crest = phase < 1.7 ? 0 : phase < 2.2 ? (phase - 1.7) / .5 : phase < 3.25 ? 1 : clamp(1 - (phase - 3.25) / .65);
                o.height = Math.max(14, o.baseHeight * crest); o.active = crest > .24;
                o.warning = phase >= .85 && phase < 1.82; o.phaseProgress = crest;
                o.state = phase < 1.7 ? 'drawback' : phase < 3.25 ? 'crest' : 'foam';
            } else if (o.mechanism === 'tidal-drift') {
                const lift = .5 + .5 * Math.sin((time + (o.phase || 0)) * 1.35);
                o.baseY = 600 - 26 * lift;
                o.worldX = o.originX + Math.sin(time * .95 + (o.phase || 0)) * 46;
                o.phaseProgress = lift; o.state = 'floating';
            } else if (o.mechanism === 'falling-log') {
                const fall = clamp((elapsed - .55) / .55);
                o.baseY = 220 + 380 * fall * fall;
                o.active = fall > 0; o.warning = elapsed < .65;
                o.phaseProgress = fall; o.state = fall < 1 ? 'falling' : 'settled';
            } else if (o.mechanism === 'pressure-crystal') {
                const phase = o.smash ? Math.min(2.7, elapsed + .5) : (time + (o.phase || 0)) % 4.6;
                const growth = phase < 1.7 ? 0 : phase < 2.2 ? (phase - 1.7) / .5 : phase < 3.65 ? 1 : clamp(1 - (phase - 3.65) / .65);
                o.height = Math.max(18, o.baseHeight * growth); o.active = growth > .22;
                o.warning = phase >= .8 && phase < 1.82; o.phaseProgress = growth;
                o.state = phase < 1.7 ? 'pressure' : phase < 3.65 ? 'grown' : 'venting';
            } else {
                // Non-signature primitives retain their historical behavior.
                if (o.motion === 'roll') { const offset = Math.min(o.travel, o.rate * elapsed); o.worldX = o.originX - offset; }
                if (o.motion === 'patrol') o.worldX = o.originX + Math.sin(time * 1.5) * o.amplitude;
            }
            if (priorActive !== undefined && priorActive !== o.active) this.pushEvent({ kind: o.active ? 'solid' : 'safe', obstacleId: o.id, mechanism: o.mechanism, worldX: o.worldX, time });
        }
        for (const surface of this.surfaces) {
            if (surface.used && surface.usedAt === undefined) surface.usedAt = time;
            const approach = 1 - Math.min(1, Math.abs(surface.worldX - distance) / Math.max(1, surface.width));
            surface.compression = surface.used ? Math.max(0, 1 - (time - surface.usedAt) / .22) : approach * .3;
            surface.rebound = surface.used ? Math.max(0, 1 - (time - surface.usedAt) / .65) : 0;
        }
        this.lastDynamicDistance = distance; this.lastDynamicTime = time;
    }
    pushEvent(event) { if (this.events) { this.events.push(event); if (this.events.length > 48) this.events.shift(); } }
    drainEvents() { return this.events ? this.events.splice(0) : []; }
    triggerSurface(surface, time) {
        if (surface.used) return false;
        surface.used = true; surface.usedAt = time; surface.compression = 1; surface.rebound = 1;
        this.pushEvent({ kind: 'launch', worldX: surface.worldX, surfaceKind: surface.kind, time });
        return true;
    }
    screenX(worldX, distance) { return CONFIG.CHARACTER.X_POSITION + worldX - distance; }
    bounds(obstacle, distance) {
        return { x: this.screenX(obstacle.worldX, distance) - obstacle.width / 2 + 9,
            y: (obstacle.baseY ?? CONFIG.GROUND.Y_POSITION) - obstacle.height + 10,
            width: obstacle.width - 18, height: obstacle.height - 14 };
    }
}
