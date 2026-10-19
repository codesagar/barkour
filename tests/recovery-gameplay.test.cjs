const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function runtime() {
  const saved = new Map();
  const context = vm.createContext({ console, window: { addEventListener() {}, devicePixelRatio: 1 }, document: {},
    localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) } });
  for (const file of ['config','pet-manifest','storage','character-assets','character','tracks','art','background','collision','finish-photo','game','game-ui'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', `${file}.js`), 'utf8'), context);
  return vm.runInContext('({CONFIG,Storage,CHARACTER_ASSETS,Character,TRACKS,Course,Background,Game})', context);
}

function gameFor(api, track, difficulty, dog, forceRecovery = true) {
  const game = Object.create(api.Game.prototype);
  Object.assign(game, { canvas: { width: 1600, height: 800 }, selectedTrackIndex: track, selectedSpeedIndex: difficulty,
    selectedCharacterIndex: dog, speedOptions: ['EASY','MEDIUM','HARD'], dogSprites: api.CHARACTER_ASSETS,
    character: new api.Character(api.CHARACTER_ASSETS[dog], 260), background: new api.Background({ width: 1600, height: 800 }),
    audio: { unlock() {}, play() {}, stop() {}, pause() {}, update() {} }, uiTime: 0, reducedMotion: true });
  game.startGame();
  if (forceRecovery && !game.course.recovery) {
    game.course = new api.Course(api.TRACKS[track], game.currentSpeedProfile, { recovery: true });
    game.runContext = Object.freeze({ ...game.runContext, courseLayoutId: game.course.layoutId, startX: 0, endX: game.course.length });
    game.background.track = game.course.track;
    game.sectionIndex = game.course.sectionAt(0).index;
  }
  game.state = 'PLAYING'; game.character.setState('run');
  return game;
}

function nextTarget(game, { lead, missPower, collectSouvenirs, collectPhrase }) {
  const candidates = [];
  const obstacle = game.course.obstacles.find(item => !item.hit && !item.passed && item.active !== false && item.worldX > game.distance - 80);
  if (obstacle && !(game.powers.star > 0 && obstacle.smash)) candidates.push({ item: obstacle, kind: 'obstacle', lead });
  const star = game.course.pickups.find(item => item.type === 'star' && !item.collected && !item.missed);
  if (missPower && star && star.worldX > game.distance) candidates.push({ item: star, kind: 'miss-star', lead: .72 });
  const souvenir = collectSouvenirs && game.course.pickups.find(item => item.type === 'souvenir' && !item.collected && !item.missed);
  // The taller opening reward is taught as a grounded spring/ramp ride.
  // A premature ordinary leap intentionally bypasses that launch.
  const awaitingLaunch = souvenir && game.course.layoutId.endsWith('-recovery-3') &&
    game.course.surfaces.some(surface => surface.beatId === souvenir.beatId && !surface.used);
  if (souvenir && souvenir.worldX > game.distance && !awaitingLaunch) candidates.push({ item: souvenir, kind: 'souvenir', lead });
  const phrasePickup = collectPhrase && game.course.phrases[collectPhrase]?.pickups
    .filter(item => !item.collected && !item.missed && item.worldX > game.distance).at(-1);
  if (phrasePickup) candidates.push({ item: phrasePickup, kind: collectPhrase, lead });
  return candidates.sort((a, b) => a.item.worldX - b.item.worldX)[0] || null;
}

function drive(game, options = {}) {
  const settings = { lead: .57, missPower: false, collectSouvenirs: false, elapsedPattern: null, ...options };
  const trace = [];
  const hitObstacle = game.hitObstacle;
  game.hitObstacle = function (obstacle) {
    trace.push({ event: 'contact', time: this.playTime, distance: this.distance, obstacle: { id: obstacle.id, beatId: obstacle.beatId,
      mechanism: obstacle.mechanism, type: obstacle.type, worldX: obstacle.worldX, active: obstacle.active, warning: obstacle.warning,
      width: obstacle.width, height: obstacle.height } });
    return hitObstacle.call(this, obstacle);
  };
  for (let step = 0; step < 30000 && game.state === 'PLAYING'; step++) {
    const target = nextTarget(game, settings);
    if (target && !game.character.isJumping && target.item.worldX > game.distance &&
        target.item.worldX - game.distance <= game.gameSpeed * 60 * target.lead) {
      game.jump(); trace.push({ event: 'jump', kind: target.kind, time: game.playTime, distance: game.distance,
        targetX: target.item.worldX, dx: target.item.worldX - game.distance, speed: game.gameSpeed * 60 });
    }
    const before = { damage: game.damage, souvenirs: game.souvenirs, smashes: game.smashes, star: game.powers.star };
    if (settings.elapsedPattern) game.update(settings.elapsedPattern[step % settings.elapsedPattern.length]);
    else game.updatePlaying(1 / 120);
    if (game.damage !== before.damage) trace.push({ event: 'damage', time: game.playTime, distance: game.distance, damage: game.damage });
    if (game.souvenirs !== before.souvenirs) trace.push({ event: 'souvenir', time: game.playTime, distance: game.distance, count: game.souvenirs });
    if (game.smashes !== before.smashes) trace.push({ event: 'smash', time: game.playTime, distance: game.distance, count: game.smashes });
    if (before.star > 0 && game.powers.star === 0) trace.push({ event: 'expiry', time: game.playTime, distance: game.distance });
  }
  return trace;
}

test('recovery full runs tolerate an imperfect timing range after acceleration with power deliberately missed', () => {
  const api = runtime(), failures = [];
  for (let track = 0; track < 5; track++) for (let difficulty = 0; difficulty < 3; difficulty++) for (let dog = 0; dog < 2; dog++) {
    for (const lead of [.42, .57, .72]) {
      const game = gameFor(api, track, difficulty, dog);
      const trace = drive(game, { lead, missPower: true });
      if (game.state !== 'COMPLETE' || game.damage || game.smashes) failures.push({ track: api.TRACKS[track].id, difficulty, dog, lead,
        state: game.state, damage: game.damage, smashes: game.smashes, trace: trace.filter(item => item.event !== 'jump') });
      assert.equal(game.course.layoutId, `${api.TRACKS[track].id}-v3-recovery-${[0,1,3].includes(track) ? 3 : 2}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('all three optional souvenirs are physically collectable during an otherwise clean full run', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let difficulty = 0; difficulty < 3; difficulty++) for (let dog = 0; dog < 2; dog++) {
    const attempts = [.42, .50, .57, .65, .72].map(lead => {
      const game = gameFor(api, track, difficulty, dog), trace = drive(game, { lead, collectSouvenirs: true });
      return { lead, state: game.state, damage: game.damage, souvenirs: game.souvenirs, trace: trace.filter(item => item.event === 'souvenir') };
    });
    assert.ok(attempts.some(item => item.state === 'COMPLETE' && item.damage === 0 && item.souvenirs === 3),
      `${api.TRACKS[track].id}/${difficulty}/${dog}: ${JSON.stringify(attempts)}`);
  }
});

test('Super Paws contact resolves before expiry and ordinary play resumes afterward', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let difficulty = 0; difficulty < 3; difficulty++) for (let dog = 0; dog < 2; dog++) {
    const game = gameFor(api, track, difficulty, dog);
    const trace = drive(game);
    assert.equal(game.state, 'COMPLETE', `${api.TRACKS[track].id}/${difficulty}/${dog}`);
    assert.equal(game.damage, 0, `${api.TRACKS[track].id}/${difficulty}/${dog}`);
    const smashes = trace.filter(item => item.event === 'smash');
    const expiry = trace.find(item => item.event === 'expiry');
    const expected = game.course.obstacles.filter(item => item.smash).length;
    assert.ok(expected > 0, `${api.TRACKS[track].id} needs a powered contact`);
    assert.equal(smashes.length, expected, `${api.TRACKS[track].id}/${difficulty}/${dog}`);
    assert.ok(expiry && expiry.time > smashes.at(-1).time && game.playTime > expiry.time,
      `${api.TRACKS[track].id}/${difficulty}/${dog}: expiry must follow payoff with trail remaining`);
  }
});

test('power expires with ordinary-control margin before the chosen final takeoff', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let difficulty = 0; difficulty < 3; difficulty++) for (let dog = 0; dog < 2; dog++) {
    const attempts = [.42,.50,.57,.65,.72].map(lead => {
      const game = gameFor(api, track, difficulty, dog), final = game.course.pickups.find(item => item.type === 'souvenir' && item.slot === 2);
      const trace = drive(game, { lead, collectSouvenirs: true });
      const expiry = trace.find(item => item.event === 'expiry');
      const takeoff = trace.find(item => item.event === 'jump' && item.kind === 'souvenir' && Math.abs(item.targetX - final.worldX) < 1);
      return { game, expiry, takeoff, lead };
    });
    const valid = attempts.find(item => item.game.state === 'COMPLETE' && item.game.damage === 0 && item.expiry && item.takeoff && item.takeoff.time - item.expiry.time >= .75);
    assert.ok(valid, `${api.TRACKS[track].id}/${difficulty}/${dog}: no >=.75s expiry margin`);
  }
});

test('Coast foam pearls are a physically optional clean leap', () => {
  const api = runtime();
  for (let difficulty = 0; difficulty < 3; difficulty++) for (let dog = 0; dog < 2; dog++) {
    const attempts = [.42,.50,.57,.65,.72].map(lead => {
      const game = gameFor(api, 2, difficulty, dog);
      drive(game, { lead, collectPhrase: 'foam-pearls' });
      return { game, phrase: game.course.phrases['foam-pearls'] };
    });
    assert.ok(attempts.some(item => item.game.state === 'COMPLETE' && item.game.damage === 0 && item.phrase.pickups.every(pickup => pickup.collected)),
      `coast/${difficulty}/${dog} foam pearls`);
    const missed = gameFor(api, 2, difficulty, dog); drive(missed, { lead: .57 });
    assert.equal(missed.state, 'COMPLETE'); assert.equal(missed.damage, 0);
    assert.equal(missed.course.phrases['foam-pearls'].pickups.every(item => item.collected), false);
  }
});

test('actual elevated recovery supports keep an ordinary leap below the HUD without changing camera framing', () => {
  const api = runtime(), noop = () => {};
  const ctx = new Proxy({ measureText: text => ({ width: String(text).length * 8 }), createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }) }, { get: (target, key) => key in target ? target[key] : noop,
    set: (target, key, value) => (target[key] = value, true) });
  for (let track = 0; track < 5; track++) for (const [width, height] of [[1024,768],[1280,720],[1366,1024],[1920,1080],[768,1024]]) {
    const game = gameFor(api, track, 0, 0), supports = game.course.platforms || [];
    if (!supports.length) continue;
    game.ctx = ctx; game.canvas.getBoundingClientRect = () => ({ width, height });
    game.canvas.clientWidth = width; game.canvas.clientHeight = height; game.render();
    const camera = JSON.stringify(game.camera), highest = Math.min(...supports.map(item => item.y));
    game.character.groundY = highest; game.character.reset(); game.character.jump();
    let top = Infinity;
    for (let step = 0; step < 180 && game.character.isJumping; step++) {
      game.character.update(api.CONFIG.PHYSICS.FIXED_STEP, game.gameSpeed); game.render();
      assert.equal(JSON.stringify(game.camera), camera, `${api.TRACKS[track].id}/${width}×${height}`);
      const bounds = game.character.getVisualBounds();
      top = Math.min(top, (bounds.y + game.camera.viewHeight * game.camera.groundFraction - 600) * game.camera.scale);
    }
    assert.ok(top >= 70, `${api.TRACKS[track].id}/${width}×${height}: top ${top.toFixed(2)}px`);
  }
});

test('capped long frames preserve a clean full-run outcome and clear transient resources', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let dog = 0; dog < 2; dog++) {
    const game = gameFor(api, track, 0, dog);
    const trace = drive(game, { elapsedPattern: [1000 / 120, 1000 / 60, 150] });
    assert.equal(game.state, 'COMPLETE', `${api.TRACKS[track].id}/${dog}`);
    assert.equal(game.damage, 0, `${api.TRACKS[track].id}/${dog}: ${JSON.stringify(trace.filter(item => item.event === 'damage'))}`);
    game.updateEffects(2);
    assert.equal(game.fractures.length, 0);
    assert.equal(game.effects.length, 0);
  }
});

module.exports = { runtime, gameFor, drive };
