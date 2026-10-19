const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function runtime(initial = {}) {
  const data = new Map(Object.entries(initial));
  const localStorage = {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); }
  };
  const context = vm.createContext({ localStorage, PetManifest: { knownAssetIds: ['buddy'], presentationFor: () => ({ displayName: 'Buddy' }) } });
  vm.runInContext(fs.readFileSync('js/storage.js', 'utf8'), context);
  return { Storage: vm.runInContext('Storage', context), data, localStorage };
}
function v4(overrides = {}) {
  return { version: 4, rulesId: 'explorer-recovery-v1', courseVersion: 3, courseLayoutId: 'texas-v3-elevation-1', capabilityProfile: 'equal-pet-v1', control: 'fixed', score: 100, stars: 2, time: 42, souvenirs: 2, sections: [10], ...overrides };
}
function gameRuntime() {
  const saved = new Map(), root = require('node:path').resolve(__dirname, '..');
  const context = vm.createContext({ console, window: { addEventListener() {} }, document: {}, localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) } });
  for (const file of ['config', 'pet-manifest', 'storage', 'character-assets', 'character', 'tracks', 'art', 'background', 'collision', 'finish-photo', 'game', 'game-ui']) vm.runInContext(fs.readFileSync(`${root}/js/${file}.js`, 'utf8'), context);
  return vm.runInContext('({Storage, CHARACTER_ASSETS, Character, Background, Game})', context);
}
function fullGame(api, trackIndex, speedIndex, dogIndex) {
  const game = Object.create(api.Game.prototype);
  Object.assign(game, { canvas: { width: 1600, height: 800 }, selectedTrackIndex: trackIndex, selectedSpeedIndex: speedIndex, selectedCharacterIndex: dogIndex, speedOptions: ['EASY', 'MEDIUM', 'HARD'], dogSprites: api.CHARACTER_ASSETS, character: new api.Character(api.CHARACTER_ASSETS[dogIndex], 260), background: new api.Background({ width: 1600, height: 800 }), audio: { unlock() {}, play() {}, stop() {} }, uiTime: 0, reducedMotion: true });
  game.startGame(); game.state = 'PLAYING'; game.character.setState('run'); return game;
}

test('v4 is isolated from immutable v1/v2/v3 buckets across sessions', () => {
  const oldV3 = JSON.stringify({ 'texas:EASY:fixed': { version: 3, score: 9, stars: 1, time: 60, souvenirs: 0, completions: 1, sections: [], courseLayoutId: 'texas-v3-elevation-1', capabilityProfile: 'equal-pet-v1' } });
  const oldPhoto = JSON.stringify([{ version: 3, track: 'texas', courseVersion: 3, assetId: 'buddy', petLabel: 'Buddy', pose: { state: 'run', clip: 'run', frame: 0, normalizedHeight: 0 }, seconds: 5, created: 1, distance: 1, difficulty: 'EASY', control: 'fixed' }]);
  const api = runtime({ barkour_adventure_records_v3: oldV3, barkour_finish_photos_v3: oldPhoto });
  assert.equal(api.Storage.saveCourse('texas', 'EASY', v4()).saved, true);
  assert.equal(api.data.get('barkour_adventure_records_v3'), oldV3);
  assert.equal(api.Storage.getRecords(3)['texas:EASY:fixed'].score, 9);
  assert.equal(api.Storage.getV4Records()['texas:EASY:fixed'].rulesId, 'explorer-recovery-v1');
  assert.equal(api.Storage.saveFinishPhoto({ ...v4(), track: 'texas', assetId: 'buddy', petLabel: 'Buddy', pose: { state: 'run', clip: 'run', frame: 0, normalizedHeight: 0 }, seconds: 5, created: 2, distance: 1, difficulty: 'EASY' }), true);
  assert.equal(api.data.get('barkour_finish_photos_v3'), oldPhoto);
  assert.equal(runtime(Object.fromEntries(api.data)).Storage.getV4FinishPhotos().length, 1);
});

test('v4 comparison requires full known provenance and keeps rule groups separate', () => {
  const api = runtime();
  assert.equal(api.Storage.saveCourse('texas', 'EASY', v4()).saved, true);
  assert.equal(api.Storage.saveCourse('texas', 'MEDIUM', v4({ rulesId: 'heart-challenge-v1', score: 1 })).saved, true);
  assert.equal(api.Storage.getV4Records()['texas:EASY:fixed'].score, 100);
  assert.equal(api.Storage.getV4Records()['texas:MEDIUM:fixed'].score, 1);
  assert.equal(api.Storage.recordsComparable(v4(), v4()), true);
  assert.equal(api.Storage.recordsComparable(v4(), v4({ rulesId: 'heart-challenge-v1' })), false);
  assert.equal(api.Storage.saveCourse('texas', 'EASY', v4({ rulesId: 'made-up' })), null);
});

test('an archive failure prevents v4 destructive replacement and malformed provenance is never compared', () => {
  const key = 'texas:EASY:fixed';
  const api = runtime({ barkour_adventure_records_v4: JSON.stringify({ [key]: { version: 4, score: 900 } }) });
  const original = api.localStorage.setItem;
  api.localStorage.setItem = (name, value) => { if (name === 'barkour_adventure_records_v4_archive') throw new Error('blocked'); original.call(api.localStorage, name, value); };
  const write = api.Storage.saveCourse('texas', 'EASY', v4());
  assert.equal(write.saved, false);
  assert.equal(JSON.parse(api.data.get('barkour_adventure_records_v4'))[key].score, 900);
});

test('legacy v1/v2/v3 record and photo bytes survive v4 writes; albums remain independently capped', () => {
  const legacy = {
    barkour_adventure_records_v1: JSON.stringify({ old: { score: 7 } }),
    barkour_adventure_records_v2: JSON.stringify({ 'texas:EASY:fixed': { version: 2, score: 7, stars: 1, time: 7, souvenirs: 0, completions: 1, sections: [] } }),
    barkour_adventure_records_v3: JSON.stringify({ 'texas:EASY:fixed': { version: 3, score: 8, stars: 1, time: 8, souvenirs: 0, completions: 1, sections: [], courseLayoutId: 'texas-v3-elevation-1', capabilityProfile: 'equal-pet-v1' } }),
    barkour_finish_photos_v1: JSON.stringify([{ version: 1, track: 'texas', dog: 'Buddy', clip: 'run', frame: 0, height: 0, seconds: 1, created: 1, distance: 0, difficulty: 'EASY', control: 'fixed' }]),
    barkour_finish_photos_v2: JSON.stringify([{ version: 2, track: 'texas', assetId: 'missing-pup', dog: 'Old pal', pose: { state: 'run', clip: 'run', frame: 0, normalizedHeight: 0 }, seconds: 1, created: 2, distance: 0, difficulty: 'EASY', control: 'fixed' }]),
    barkour_finish_photos_v3: JSON.stringify([{ version: 3, track: 'texas', courseVersion: 3, assetId: 'buddy', petLabel: 'Buddy', pose: { state: 'run', clip: 'run', frame: 0, normalizedHeight: 0 }, seconds: 1, created: 3, distance: 0, difficulty: 'EASY', control: 'fixed' }])
  };
  const api = runtime(legacy);
  for (let i = 0; i < 30; i++) assert.equal(api.Storage.saveFinishPhoto({ ...v4(), track: 'texas', assetId: i % 2 ? 'buddy' : 'missing-pup', petLabel: i % 2 ? 'Buddy' : 'Neet', pose: { state: 'run', clip: 'run', frame: 0, normalizedHeight: 0 }, seconds: 2, created: 10 + i, distance: 0, difficulty: 'EASY' }), true);
  api.Storage.saveCourse('texas', 'EASY', v4());
  for (const [key, value] of Object.entries(legacy)) assert.equal(api.data.get(key), value);
  const buckets = api.Storage.getFinishPhotoBuckets();
  assert.equal(buckets.next.length, 24); assert.equal(buckets.current.length, 1); assert.equal(buckets.previous.length, 1); assert.equal(buckets.classic.length, 1);
  assert.equal(buckets.previous[0].dog, 'Old pal'); assert.equal(buckets.previous[0].assetAvailable, false);
  assert.equal(buckets.next.some(photo => photo.assetId === 'missing-pup' && photo.assetAvailable === false), true);
});

test('run contexts compare directly and unsupported v4 layouts, capabilities, rules and photos are rejected', () => {
  const api = runtime(), context = { resultVersion: 4, rulesId: 'explorer-recovery-v1', courseVersion: 3, courseLayoutId: 'texas-v3-elevation-1', capabilityProfile: 'equal-pet-v1' };
  assert.equal(api.Storage.recordsComparable(v4(), context), true);
  for (const bad of [{ courseLayoutId: 'unmeasured-layout' }, { capabilityProfile: 'new-body' }, { rulesId: 'unknown-rule' }]) assert.equal(api.Storage.saveCourse('texas', 'EASY', v4(bad)), null);
  assert.equal(api.Storage.saveCourse('texas', 'EASY', v4({ rulesId: 'heart-challenge-v1' })), null);
  assert.equal(api.Storage.saveFinishPhoto({ ...v4({ courseLayoutId: 'unmeasured-layout' }), track: 'texas', assetId: 'buddy', petLabel: 'Buddy', pose: { state: 'run', clip: 'run', frame: 0, normalizedHeight: 0 }, seconds: 1, created: 1, distance: 0, difficulty: 'EASY' }), false);
});

test('finish download reports a failed request when PNG encoding is blocked', async () => {
  const context = vm.createContext({ document: { createElement: () => ({ width: 0, height: 0, toBlob: callback => callback(null) }) }, setTimeout, URL: {}, FINISH_HEIGHT_RANGE: 400 });
  vm.runInContext(fs.readFileSync('js/finish-photo.js', 'utf8'), context);
  const FinishPhoto = vm.runInContext('FinishPhoto', context);
  FinishPhoto.draw = () => {};
  assert.equal((await FinishPhoto.download({ assetId: 'buddy', track: 'texas', created: 1 }, [])).requested, false);
});

test('actual v4 full finishes across five trails, difficulties, and dogs persist results and photos', () => {
  const api = gameRuntime();
  for (let track = 0; track < 5; track++) for (let difficulty = 0; difficulty < 3; difficulty++) for (let dog = 0; dog < 2; dog++) {
    const game = fullGame(api, track, difficulty, dog); game.finish();
    assert.equal(game.persistence.recordSaved, true); assert.equal(game.persistence.photoSaved, true);
    const record = api.Storage.getV4Records()[api.Storage.recordKey(game.course.track.id, game.speedOptions[difficulty], 'fixed')];
    assert.equal(api.Storage.recordsComparable(record, game.runContext), true);
    assert.equal(game.finishPhoto.courseLayoutId, game.course.layoutId);
  }
});

test('paused Options cannot relabel an in-progress result or finish photo', () => {
  const api = gameRuntime(), game = fullGame(api, 0, 0, 0);
  const startedDifficulty = game.runContext.difficulty;
  game.selectedSpeedIndex = 2; // Options may alter the next-run menu choice while paused.
  game.finish();
  assert.equal(startedDifficulty, 'EASY');
  assert.equal(game.finishPhoto.difficulty, 'EASY');
  assert.ok(api.Storage.getV4Records()[api.Storage.recordKey('texas', 'EASY', 'fixed')]);
  assert.equal(api.Storage.getV4Records()[api.Storage.recordKey('texas', 'HARD', 'fixed')], undefined);
});
