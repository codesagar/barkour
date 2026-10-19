// Independent uplift checks. Historical fixtures and assertions are intentionally untouched.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function runtime(initial = {}) {
  const saved = new Map(Object.entries(initial));
  const localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, String(value)) };
  const context = vm.createContext({ console, window: { addEventListener() {} }, document: {}, localStorage });
  for (const file of ['config', 'pet-manifest', 'storage', 'character-assets', 'character', 'tracks', 'art', 'background', 'collision', 'finish-photo', 'game', 'game-ui']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', `${file}.js`), 'utf8'), context);
  }
  return { ...vm.runInContext('({ CONFIG, Storage, CHARACTER_ASSETS, Character, TRACKS, Course, Background, Game, Collision })', context), saved, localStorage };
}

function gameFor(api, track = 0, difficulty = 0, dog = 0, phase = 0) {
  const game = Object.create(api.Game.prototype);
  Object.assign(game, {
    canvas: { width: 1600, height: 800 }, selectedTrackIndex: track,
    selectedSpeedIndex: difficulty, selectedCharacterIndex: dog,
    speedOptions: ['EASY', 'MEDIUM', 'HARD'], dogSprites: api.CHARACTER_ASSETS,
    character: new api.Character(api.CHARACTER_ASSETS[dog], 260),
    background: new api.Background({ width: 1600, height: 800 }),
    audio: { unlock() {}, play() {}, stop() {} }, uiTime: 0, reducedMotion: false
  });
  // Keep these exact dynamic-2 regressions replaying their historical layout.
  // Production recovery behavior has its own independent gameplay suite.
  game.startGame({ historicalDynamic: true }); game.state = 'PLAYING'; game.character.setState('run');
  // Offset the deterministic environmental clock, retaining real acceleration and approach.
  if (phase) {
    const update = game.course.update;
    game.course.update = function (dt, distance, time) { return update.call(this, dt, distance, time + phase); };
  }
  return game;
}

function drive(game, { missPower = false, noInput = false, lead = .57, limit = 20000 } = {}) {
  let maxEffects = 0, maxFractures = 0, minY = 600;
  for (let step = 0; step < limit && game.state === 'PLAYING'; step++) {
    const next = game.course.obstacles.find(item => !item.hit && !item.passed && item.worldX > game.distance - 80);
    const star = missPower && game.course.pickups.find(item => item.type === 'star' && !item.collected && !item.missed);
    const target = star && star.worldX < (next?.worldX ?? Infinity) ? star : game.powers.star > 0 && next?.smash ? null : next;
    if (!noInput && target && !game.character.isJumping && target.worldX > game.distance && target.worldX - game.distance < game.gameSpeed * 60 * lead) game.jump();
    game.updatePlaying(1 / 120);
    maxEffects = Math.max(maxEffects, game.effects.length);
    maxFractures = Math.max(maxFractures, game.fractures?.length || 0);
    minY = Math.min(minY, game.character.y);
    assert.ok(Number.isFinite(game.distance) && Number.isFinite(game.character.y), 'simulation must remain finite');
  }
  return { state: game.state, damage: game.damage, smashes: game.smashes, distance: game.distance, minY, maxEffects, maxFractures };
}

test('uplift uses distinct layouts while direct historical course construction remains immutable', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) {
    const legacy = new api.Course(api.TRACKS[track], api.CONFIG.DIFFICULTY.EASY);
    const game = gameFor(api, track);
    assert.equal(legacy.layoutId, `${api.TRACKS[track].id}-v3-elevation-1`);
    assert.equal(game.course.layoutId, `${api.TRACKS[track].id}-v3-dynamic-2`);
    assert.equal(api.Storage.recordsComparable({ ...game.runContext, version: 4, courseLayoutId: legacy.layoutId }, game.runContext), false);
  }
});

test('all dogs, trails and difficulties finish dynamic courses from origin across environmental phases', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let difficulty = 0; difficulty < 3; difficulty++) for (const phase of [0, .9, 1.8, 2.7]) {
    const outcomes = [];
    for (let dog = 0; dog < 2; dog++) {
      const game = gameFor(api, track, difficulty, dog, phase);
      const outcome = drive(game);
      const label = `${api.TRACKS[track].id}/${difficulty}/${dog}/phase=${phase}`;
      assert.equal(outcome.state, 'COMPLETE', label);
      assert.equal(outcome.damage, 0, `${label} intended safe rhythm`);
      assert.equal(outcome.smashes, 2, `${label} both signature contacts occur while powered`);
      assert.equal(game.course.pickups.find(item => item.type === 'star').collected, true, `${label} real pickup`);
      assert.equal(game.powers.star, 0, `${label} power expires before finish`);
      assert.equal(game.persistence.recordSaved, true, `${label} result storage`);
      assert.equal(game.persistence.photoSaved, true, `${label} photo storage`);
      assert.ok(outcome.maxEffects <= 100, `${label} bounded effects: ${outcome.maxEffects}`);
      outcomes.push(outcome);
    }
    assert.deepEqual(outcomes[0], outcomes[1], `${api.TRACKS[track].id}/${difficulty}/${phase} equal capability`);
  }
});

test('missed power has a full-leap fallback on every dynamic trail and difficulty', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let difficulty = 0; difficulty < 3; difficulty++) for (let dog = 0; dog < 2; dog++) {
    const game = gameFor(api, track, difficulty, dog);
    const outcome = drive(game, { missPower: true });
    assert.equal(outcome.state, 'COMPLETE', `${track}/${difficulty}/${dog} missed-power fallback`);
    assert.equal(outcome.damage, 0, `${track}/${difficulty}/${dog} fallback must avoid contact`);
    assert.equal(game.course.pickups.find(item => item.type === 'star').collected, false);
    assert.equal(outcome.smashes, 0);
  }
});

test('dynamic fallback tolerates deliberate presses 150 ms earlier or later than the central policy', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let difficulty = 0; difficulty < 3; difficulty++) for (const lead of [.42, .72]) {
    const outcome = drive(gameFor(api, track, difficulty), { missPower: true, lead });
    assert.equal(outcome.state, 'COMPLETE', `${track}/${difficulty}/${lead} timing margin`);
    assert.equal(outcome.damage, 0, `${track}/${difficulty}/${lead} timing margin`);
  }
});

test('dynamic simulation is equivalent across frame partitions and caps a stalled frame', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) {
    const snapshots = [30, 60, 120, 144].map(hz => {
      const game = gameFor(api, track); game.jump();
      for (let frame = 0; frame < hz * 8; frame++) game.update(1000 / hz);
      return JSON.stringify({ distance: game.distance, speed: game.gameSpeed, damage: game.damage, y: game.character.y, obstacles: game.course.obstacles, surfaces: game.course.surfaces });
    });
    snapshots.forEach(snapshot => assert.equal(snapshot, snapshots[0], `${track} frame partition equivalence`));
    const stalled = gameFor(api, track), capped = gameFor(api, track);
    stalled.update(2000); capped.update(100);
    assert.equal(stalled.distance, capped.distance, `${track} stalls cannot fast-forward hazards`);
  }
});

test('camera transform remains stable through leaps, launches, boosts, contact and finish at primary viewports', () => {
  const api = runtime();
  const noop = () => {};
  const ctx = new Proxy({ measureText: text => ({ width: String(text).length * 8 }), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }) }, { get: (target, key) => key in target ? target[key] : noop, set: (target, key, value) => (target[key] = value, true) });
  for (const [width, height] of [[1024, 768], [1366, 1024], [1280, 720], [1920, 1080], [768, 1024]]) for (let dog = 0; dog < 2; dog++) {
    const game = gameFor(api, 3, 0, dog); game.ctx = ctx;
    game.canvas.getBoundingClientRect = () => ({ width, height });
    game.render(); const camera = JSON.stringify(game.camera);
    for (const state of [
      { y: 600, groundY: 600, velocityY: -960, isJumping: true },
      { y: 220, groundY: 600, velocityY: 0, isJumping: true, automaticLaunch: true },
      { y: 135, groundY: 415, velocityY: 0, isJumping: true },
      { y: 600, groundY: 600, velocityY: 0, isJumping: false }
    ]) {
      Object.assign(game.character, state); game.powers.star = 4; game.shake = 10; game.invulnerable = 1;
      game.render(); assert.equal(JSON.stringify(game.camera), camera, `${width}×${height}/${dog} camera must not follow gameplay`);
      const visual = game.character.getVisualBounds();
      const top = (visual.y + game.camera.viewHeight * game.camera.groundFraction - 600) * game.camera.scale;
      assert.ok(top >= 0, `${width}×${height}/${dog} full sprite clearance: ${top}px`);
    }
    game.state = 'COMPLETE'; game.render();
    assert.equal(JSON.stringify(game.camera), camera, `${width}×${height}/${dog} finish camera`);
  }
});

test('highest elevated ordinary leap keeps both dogs below the HUD with an eight-pixel gap', () => {
  const api = runtime(), hudBottom = 62, clearance = 8;
  const platforms = api.TRACKS.flatMap(track => new api.Course(track, api.CONFIG.DIFFICULTY.EASY, { dynamic: true }).platforms);
  const highestSupport = Math.min(...platforms.map(platform => platform.y));
  assert.ok(Number.isFinite(highestSupport) && highestSupport < api.CONFIG.GROUND.Y_POSITION, 'exercise actual elevated geometry');
  const noop = () => {};
  const ctx = new Proxy({ measureText: text => ({ width: String(text).length * 8 }), createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }) }, { get: (target, key) => key in target ? target[key] : noop, set: (target, key, value) => (target[key] = value, true) });
  for (const [width, height] of [[1024, 768], [1366, 1024], [1280, 720], [1920, 1080], [768, 1024]]) for (let dog = 0; dog < 2; dog++) {
    const game = gameFor(api, 0, 0, dog); game.ctx = ctx;
    game.canvas.getBoundingClientRect = () => ({ width, height });
    game.render();
    const camera = JSON.stringify(game.camera);
    game.character.groundY = highestSupport; game.character.reset(); game.character.jump();
    let minVisualTop = Infinity;
    for (let step = 0; step < 180 && game.character.isJumping; step++) {
      game.character.update(api.CONFIG.PHYSICS.FIXED_STEP, game.gameSpeed);
      game.render();
      assert.equal(JSON.stringify(game.camera), camera, 'HUD clearance cannot depend on adaptive framing');
      const visual = game.character.getVisualBounds();
      const top = (visual.y + game.camera.viewHeight * game.camera.groundFraction - api.CONFIG.GROUND.Y_POSITION) * game.camera.scale;
      minVisualTop = Math.min(minVisualTop, top);
    }
    assert.ok(minVisualTop >= hudBottom + clearance,
      `${width}×${height}/${game.character.asset.assetId}: actual full-leap visual top ${minVisualTop.toFixed(2)}px must clear HUD ${hudBottom}px + ${clearance}px`);
  }
});

test('powered fractures originate at real overlap and expire without changing collision or camera', () => {
  const api = runtime(), materials = new Set();
  for (let track = 0; track < 5; track++) for (const reduced of [false, true]) {
    const game = gameFor(api, track); game.reducedMotion = reduced;
    let contacts = 0;
    const original = game.hitObstacle;
    game.hitObstacle = function (obstacle) {
      const powered = this.powers.star > 0;
      const body = this.character.getBounds(), box = this.course.bounds(obstacle, this.distance);
      original.call(this, obstacle);
      if (!powered) return;
      const event = this.fractures.at(-1); contacts++;
      assert.ok(api.Collision.checkCollision(body, box), `${track} fracture must follow real overlap`);
      assert.ok(event.x >= box.x && event.x <= box.x + box.width, `${track} contact x`);
      assert.ok(event.y >= box.y && event.y <= box.y + box.height, `${track} contact y`);
      assert.ok(event.speed > 0 && event.duration <= 1.5, `${track} forward momentum and bounded life`);
      assert.equal(this.shake, 0, 'powered hit cannot move the global camera');
      assert.equal(obstacle.hit, true, 'fracture remains cannot collide again');
      materials.add(event.type);
    };
    const outcome = drive(game);
    assert.ok(contacts > 0, `${track}/${reduced} powered interaction must occur`);
    assert.ok(outcome.maxFractures <= 18);
    game.updateEffects(2); assert.equal(game.fractures.length, 0, 'aftermath expires');
    game.startGame(); assert.equal(game.fractures.length, 0, 'retry begins without old debris');
  }
  for (const material of ['piston', 'snowpile', 'wave', 'driftwood', 'log', 'crystal']) assert.ok(materials.has(material), `${material} actual powered contact exercised`);
});

test('each trail has a distinct mechanical signature and cyclic dangers warn before becoming solid', () => {
  const api = runtime(), signatures = new Set();
  for (let track = 0; track < 5; track++) {
    const course = gameFor(api, track).course;
    signatures.add(course.dynamicSignature);
    assert.ok(course.obstacles.some(item => item.mechanism), `${track} actual dynamic obstacle`);
    assert.ok(course.recoveryZones.length > 0, `${track} authored recovery`);
  }
  assert.equal(signatures.size, 5, 'mechanical identities must not collapse to one translated hazard');
  for (const track of [2, 4]) {
    const course = gameFor(api, track).course;
    const obstacle = course.obstacles.find(item => !item.smash && ['surf', 'pressure-crystal'].includes(item.mechanism));
    assert.ok(obstacle);
    let priorActive, warningStart = null, transitions = 0, safeSeen = false;
    for (let step = 0; step < 1200; step++) {
      const time = step / 120; course.update(1 / 120, 0, time);
      if (obstacle.warning && warningStart === null) warningStart = time;
      if (priorActive === false && obstacle.active === true) {
        assert.ok(warningStart !== null && time - warningStart >= .5, `${track} at least half a second of pre-solid tell`);
        transitions++; warningStart = null;
      }
      if (obstacle.active === false) safeSeen = true;
      const box = course.bounds(obstacle, 0);
      assert.ok(box.width > 0 && box.height >= 0, `${track} valid collision geometry`);
      priorActive = obstacle.active;
    }
    assert.ok(safeSeen && transitions >= 2, `${track} repeatable safe/solid cycle`);
    assert.ok(course.events.length <= 48, 'event history is bounded');
  }
});

test('Explorer survives deliberate dynamic mistakes with blocked persistence for both dogs', () => {
  const api = runtime(); api.localStorage.setItem = () => { throw new Error('storage denied'); };
  for (let track = 0; track < 5; track++) for (let dog = 0; dog < 2; dog++) {
    const game = gameFor(api, track, 0, dog);
    const outcome = drive(game, { noInput: true });
    assert.equal(outcome.state, 'COMPLETE', `${track}/${dog} forgiving no-input run`);
    assert.ok(outcome.damage > 0, `${track}/${dog} mistakes recorded`);
    assert.equal(game.hearts, game.maxHearts);
    assert.equal(game.persistence.recordSaved, false);
    assert.equal(game.persistence.photoSaved, false);
    assert.ok(game.finishPhoto, 'current photo survives storage failure in memory');
  }
});

test('dynamic replacement archives the exact old v4 result before writing and preserves every historical photo bucket', () => {
  const old = { version: 4, rulesId: 'explorer-recovery-v1', courseVersion: 3, courseLayoutId: 'texas-v3-elevation-1', capabilityProfile: 'equal-pet-v1', control: 'fixed', score: 99999, stars: 3, time: 40, souvenirs: 3, completions: 99, sections: [400] };
  const oldPhoto = { ...old, track: 'texas', assetId: 'buddy', petLabel: 'Buddy', pose: { state: 'run', clip: 'run', frame: 0, normalizedHeight: 0 }, seconds: 40, created: 100, distance: 20000, difficulty: 'EASY' };
  const legacy = Object.fromEntries([1, 2, 3, 4].map(version => [`barkour_finish_photos_v${version}`, JSON.stringify([{ ...oldPhoto, version }])]));
  legacy.barkour_adventure_records_v4 = JSON.stringify({ 'texas:EASY:fixed': old });
  const api = runtime(legacy), writes = [], originalWrite = api.localStorage.setItem;
  api.localStorage.setItem = (key, value) => {
    writes.push(key);
    if (key === 'barkour_adventure_records_v4_archive') throw new Error('archive denied');
    originalWrite(key, value);
  };
  const blocked = gameFor(api); blocked.finish();
  assert.equal(blocked.persistence.recordSaved, false);
  assert.equal(api.saved.get('barkour_adventure_records_v4'), legacy.barkour_adventure_records_v4, 'archive failure must preserve old result bytes');
  assert.equal(writes.includes('barkour_adventure_records_v4'), false, 'replacement may not be attempted after archive failure');
  api.localStorage.setItem = (key, value) => { writes.push(key); originalWrite(key, value); };
  writes.length = 0;
  const current = gameFor(api); current.finish();
  assert.equal(current.persistence.recordSaved, true);
  assert.ok(writes.indexOf('barkour_adventure_records_v4_archive') < writes.indexOf('barkour_adventure_records_v4'));
  const archived = api.Storage.getArchivedV4Records().find(entry => entry.key === 'texas:EASY:fixed');
  assert.deepEqual(JSON.parse(JSON.stringify(archived.record)), old, 'old awards and metadata are not recomputed');
  const saved = api.Storage.getV4Records()['texas:EASY:fixed'];
  assert.equal(saved.completions, 1, 'new layout begins a separate comparison history');
  assert.notEqual(saved.score, old.score);
  for (const [key, bytes] of Object.entries(legacy)) if (key.includes('finish_photos')) assert.equal(api.saved.get(key), bytes, `${key} bytes`);
  assert.ok(api.Storage.getDynamicFinishPhotos().length > 0);
  assert.equal(api.Storage.getV4FinishPhotos()[0].courseLayoutId, old.courseLayoutId);
});

module.exports = { runtime, gameFor, drive };
