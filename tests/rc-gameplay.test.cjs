const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function runtime() {
  const saved = new Map();
  const context = vm.createContext({
    console,
    window: { addEventListener() {} }, document: {},
    localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) }
  });
  for (const file of ['config', 'pet-manifest', 'storage', 'character-assets', 'character', 'tracks', 'art', 'background', 'collision', 'finish-photo', 'game', 'game-ui']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', `${file}.js`), 'utf8'), context);
  }
  return vm.runInContext('({ CONFIG, Storage, CHARACTER_ASSETS, Character, TRACKS, Course, Background, Game, localStorage })', context);
}

function gameFor(api, trackIndex = 0, speedIndex = 0, dogIndex = 0) {
  const game = Object.create(api.Game.prototype);
  Object.assign(game, {
    canvas: { width: 1600, height: 800 }, selectedTrackIndex: trackIndex,
    selectedSpeedIndex: speedIndex, selectedCharacterIndex: dogIndex,
    speedOptions: ['EASY', 'MEDIUM', 'HARD'], dogSprites: api.CHARACTER_ASSETS,
    character: new api.Character(api.CHARACTER_ASSETS[dogIndex], 260),
    background: new api.Background({ width: 1600, height: 800 }),
    audio: { unlock() {}, play() {}, stop() {} }, uiTime: 0, reducedMotion: true,
    notifyLog: []
  });
  const notify = game.notify;
  game.notify = function (message, teaching) { this.notifyLog.push(String(message)); return notify.call(this, message, teaching); };
  game.startGame();
  game.state = 'PLAYING';
  game.character.setState('run');
  return game;
}

function runToFinish(game, { missPower = false, smashPower = false, maxSteps = 20000 } = {}) {
  for (let i = 0; i < maxSteps && game.state === 'PLAYING'; i++) {
    const next = game.course.obstacles.find(item => !item.hit && !item.passed && item.worldX > game.distance - 80);
    const power = missPower && game.course.pickups.find(item => item.type === 'star' && !item.collected && !item.missed);
    const smash = smashPower && game.powers.star > 0 && next?.smash;
    const target = power && power.worldX < (next?.worldX ?? Infinity) ? power : (smash ? null : next);
    if (target && !game.character.isJumping && target.worldX > game.distance && target.worldX - game.distance < game.gameSpeed * 60 * .57) game.jump();
    game.updatePlaying(1 / 120);
  }
  return game;
}

test('v4 full runs publish a distinct result contract and rules id', () => {
  const api = runtime();
  const explorer = gameFor(api, 0, 0);
  assert.equal(explorer.runContext.resultVersion, 4);
  assert.equal(explorer.runContext.rulesId, 'explorer-recovery-v1');
  const challenge = gameFor(api, 0, 1);
  assert.equal(challenge.runContext.resultVersion, 4);
  assert.equal(challenge.runContext.rulesId, 'heart-challenge-v1');
});

test('all five trails complete for both dogs at every v4 difficulty', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let difficulty = 0; difficulty < 3; difficulty++) for (let dog = 0; dog < 2; dog++) {
    const game = runToFinish(gameFor(api, track, difficulty, dog));
    assert.equal(game.state, 'COMPLETE', `${api.TRACKS[track].id}/${difficulty}/${dog}`);
    assert.equal(game.result.version, 4);
    assert.equal(game.result.rulesId, difficulty === 0 ? 'explorer-recovery-v1' : 'heart-challenge-v1');
    assert.equal(game.result.completions, undefined, 'completion count belongs to storage, not a result');
    assert.equal(game.persistence.recordSaved, true, `${api.TRACKS[track].id}/${difficulty}/${dog} record saved`);
    assert.equal(game.persistence.photoSaved, true, `${api.TRACKS[track].id}/${difficulty}/${dog} photo saved`);
    const key = api.Storage.recordKey(api.TRACKS[track].id, ['EASY', 'MEDIUM', 'HARD'][difficulty], 'fixed');
    assert.equal(api.Storage.getV4Records()[key].completions, dog + 1, `${key} saved exactly once`);
  }
});

test('every Explorer trail records a deliberate miss, ignores repeated contact during immunity, then finishes after a successful leap', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let dog = 0; dog < 2; dog++) {
    const game = gameFor(api, track, 0, dog);
    const obstacle = game.course.obstacles.find(item => !item.tutorial) || game.course.obstacles[0];
    let steps = 0;
    while (game.damage === 0 && game.state === 'PLAYING' && steps++ < 10000) game.updatePlaying(1 / 120);
    assert.equal(game.damage, 1, `${track}/${dog} first miss from approach`);
    assert.equal(game.state, 'PLAYING', `${track}/${dog} should remain in Explorer`);
    assert.equal(game.hearts, game.maxHearts, `${track}/${dog} Explorer hearts`);
    assert.equal(game.damage, 1, `${track}/${dog} first miss`);
    const damageAfterMiss = game.damage;
    game.hitObstacle(obstacle);
    assert.equal(game.damage, damageAfterMiss, `${track}/${dog} immunity`);
    assert.equal(game.hearts, game.maxHearts);
    const nextObstacle = game.course.obstacles.find(item => !item.hit && !item.passed && item.worldX > game.distance + 400);
    assert.ok(nextObstacle, `${track}/${dog} needs a later real obstacle`);
    while (nextObstacle.worldX - game.distance > game.gameSpeed * 60 * .57 && game.state === 'PLAYING') game.updatePlaying(1 / 120);
    game.jump();
    assert.equal(game.character.velocityY, api.CONFIG.PHYSICS.JUMP_VELOCITY);
    for (let i = 0; i < 240 && game.state === 'PLAYING' && !nextObstacle.passed; i++) game.updatePlaying(1 / 120);
    assert.equal(nextObstacle.hit, false, `${track}/${dog} successful leap hit`);
    runToFinish(game);
    assert.equal(game.state, 'COMPLETE', `${track}/${dog} should finish after miss and leap`);
    assert.equal(game.result.rulesId, 'explorer-recovery-v1');
    game.finish();
    assert.equal(game.state, 'COMPLETE', `${track}/${dog} finish must be idempotent`);
  }
});

test('Explorer can complete each untouched trail from start with no jump input', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) for (let dog = 0; dog < 2; dog++) {
    const game = gameFor(api, track, 0, dog);
    for (let i = 0; i < 20000 && game.state === 'PLAYING'; i++) game.updatePlaying(1 / 120);
    assert.equal(game.state, 'COMPLETE', `${api.TRACKS[track].id}/${dog} no-input completion`);
    assert.ok(game.damage >= 1, `${api.TRACKS[track].id}/${dog} should record a contact`);
    assert.equal(game.persistence.recordSaved, true);
    assert.equal(game.persistence.photoSaved, true);
  }
});

test('challenge collisions still end the run and Explorer practice cannot persist a result', () => {
  const api = runtime();
  const challenge = gameFor(api, 2, 1);
  for (let hit = 0; hit < challenge.maxHearts; hit++) {
    challenge.invulnerable = 0;
    challenge.hitObstacle(challenge.course.obstacles[hit]);
  }
  assert.equal(challenge.state, 'GAME_OVER');
  assert.equal(challenge.runContext.rulesId, 'heart-challenge-v1');

  const practice = gameFor(api, 2, 0);
  const practiceId = practice.course.practiceSections[0].id;
  practice.startGame({ practiceId });
  practice.state = 'PLAYING';
  practice.finish();
  assert.equal(practice.state, 'PRACTICE_COMPLETE');
  assert.equal(Object.keys(api.Storage.getV4Records()).length, 0);
  assert.equal(api.Storage.getCurrentFinishPhotos().length, 0);
});

test('Super Paws pickup, authored material contacts, and expiry warning occur at real arrival speed', () => {
  const api = runtime();
  for (let track = 0; track < 5; track++) {
    const game = gameFor(api, track, 0);
    const power = game.course.pickups.find(item => item.type === 'star');
    const marked = game.course.obstacles.filter(item => item.smash);
    // Recovery deliberately varies the power phrase by destination. The older
    // identical two-barrier contract remains covered by uplift-review.
    assert.ok(power && marked.length > 0, `${api.TRACKS[track].id} power setup`);
    runToFinish(game, { smashPower: true, maxSteps: 20000 });
    assert.equal(game.smashes, marked.length, `${api.TRACKS[track].id} authored contacts`);
    assert.ok(game.notifyLog.some(text => /SUPER PAWS|POWDER RUSH|WAVE SPRINT|CANOPY BOUND|PRISM BREAK/i.test(text)), `${api.TRACKS[track].id} pickup cue`);
    assert.ok(game.notifyLog.some(text => /ending|fading|clear trail/i.test(text)), `${api.TRACKS[track].id} expiry cue`);
    assert.equal(game.damage, 0);
    const missed = runToFinish(gameFor(api, track, 0), { missPower: true });
    const missedPower = missed.course.pickups.find(item => item.type === 'star');
    assert.equal(missedPower.collected, false, `${api.TRACKS[track].id} power should be missable`);
    assert.equal(missed.state, 'COMPLETE', `${api.TRACKS[track].id} missed power fallback`);
  }
});

test('encounter guidance outranks incidental Flow and recovery outranks both', () => {
  const api = runtime();
  const game = gameFor(api);
  game.notify('Pipe gap ahead · leap near the edge. The ground below is safe.', { priority: 70, duration: 2 });
  game.notify('On a roll · Clean clear', { priority: 20, duration: 2 });
  assert.match(game.toast, /Pipe gap ahead/);
  game.notify('Keep going. You met the obstacle while rising.', { priority: 100, duration: 2 });
  assert.match(game.toast, /Keep going/);
});

test('v4 readers exclude key/rules and cross-trail layout mismatches, and comparison is strict', () => {
  const api = runtime();
  const valid = {
    version: 4, rulesId: 'explorer-recovery-v1', courseVersion: 3,
    courseLayoutId: 'texas-v3-elevation-1', capabilityProfile: 'equal-pet-v1',
    score: 100, stars: 1, time: 50, souvenirs: 0, completions: 1, sections: []
  };
  api.Storage.write('barkour_adventure_records_v4', {
    'texas:EASY:fixed': valid,
    'texas:MEDIUM:fixed': { ...valid, rulesId: 'explorer-recovery-v1' },
    'coast:EASY:fixed': { ...valid, courseLayoutId: 'texas-v3-elevation-1' }
  });
  const records = api.Storage.getV4Records();
  assert.ok(records['texas:EASY:fixed']);
  assert.equal(records['texas:MEDIUM:fixed'], undefined);
  assert.equal(records['coast:EASY:fixed'], undefined);
  assert.equal(api.Storage.saveCourse('texas', 'EASY', { ...valid, control: 'variable' }), null, 'v4 cannot write unsupported variable results');
  assert.equal(api.Storage.recordsComparable(valid, { ...valid, rulesId: 'heart-challenge-v1' }), false);
  assert.equal(api.Storage.recordsComparable(valid, { ...valid, courseLayoutId: 'coast-v3-elevation-1' }), false);
});
