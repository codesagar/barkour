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

function result(layout = 'texas-v3-recovery-1', overrides = {}) {
  return { version: 4, rulesId: 'explorer-recovery-v1', courseVersion: 3, courseLayoutId: layout,
    capabilityProfile: 'equal-pet-v1', control: 'fixed', score: 100, stars: 2, time: 42,
    souvenirs: 2, completions: 1, sections: [10], ...overrides };
}

function photo(layout, created) {
  return { ...result(layout), track: 'texas', assetId: 'buddy', petLabel: 'Buddy',
    pose: { state: 'run', clip: 'run', frame: 0, normalizedHeight: 0 }, seconds: 42,
    created, distance: 100, difficulty: 'EASY' };
}

test('recovery provenance archives a dynamic record before starting a separate comparison history', () => {
  const key = 'texas:EASY:fixed';
  const old = result('texas-v3-dynamic-2', { score: 999, stars: 3, completions: 9 });
  const api = runtime({ barkour_adventure_records_v4: JSON.stringify({ [key]: old }) });
  const saved = api.Storage.saveCourse('texas', 'EASY', result());
  assert.equal(saved.saved, true);
  assert.equal(saved.archived, true);
  assert.deepEqual(JSON.parse(JSON.stringify(api.Storage.getArchivedV4Records()[0].record)), old);
  const recovery = api.Storage.getV4Records()[key];
  assert.equal(recovery.courseLayoutId, 'texas-v3-recovery-1');
  assert.equal(recovery.score, 100);
  assert.equal(recovery.completions, 1);
  assert.equal(api.Storage.recordsComparable(old, recovery), false);
});

test('blocked archive preserves the exact dynamic record bytes and prevents recovery replacement', () => {
  const key = 'texas:EASY:fixed';
  const bytes = JSON.stringify({ [key]: result('texas-v3-dynamic-2', { score: 999 }) });
  const api = runtime({ barkour_adventure_records_v4: bytes });
  const original = api.localStorage.setItem;
  const writes = [];
  api.localStorage.setItem = (name, value) => {
    writes.push(name);
    if (name === 'barkour_adventure_records_v4_archive') throw new Error('archive blocked');
    original.call(api.localStorage, name, value);
  };
  const saved = api.Storage.saveCourse('texas', 'EASY', result());
  assert.equal(saved.saved, false);
  assert.equal(saved.incompatible, true);
  assert.equal(api.data.get('barkour_adventure_records_v4'), bytes);
  assert.equal(writes.includes('barkour_adventure_records_v4'), false);
});

test('recovery photos use an independent capped bucket without changing historical buckets', () => {
  const historical = {
    barkour_finish_photos_v4: JSON.stringify([photo('texas-v3-elevation-1', 1)]),
    barkour_finish_photos_v4_dynamic_2: JSON.stringify([photo('texas-v3-dynamic-2', 2)]),
    barkour_finish_photos_v3: '[]', barkour_finish_photos_v2: '[]', barkour_finish_photos_v1: '[]'
  };
  const api = runtime(historical);
  for (let i = 0; i < 30; i++) assert.equal(api.Storage.saveFinishPhoto(photo('texas-v3-recovery-1', 100 + i)), true);
  for (const [key, bytes] of Object.entries(historical)) assert.equal(api.data.get(key), bytes, `${key} bytes`);
  assert.equal(api.Storage.PHOTO_KEYS.recovery, 'barkour_finish_photos_v4_recovery_1');
  const buckets = api.Storage.getFinishPhotoBuckets();
  assert.equal(buckets.recovery.length, 24);
  assert.equal(buckets.dynamic.length, 1);
  assert.equal(buckets.next.length, 1);
  assert.equal(api.Storage.getFinishPhotos()[0].courseLayoutId, 'texas-v3-recovery-1');
  assert.equal(api.Storage.getFinishPhotos()[24].courseLayoutId, 'texas-v3-dynamic-2');
});

test('layout readers accept only matching recovery ids and bucket rejects cross-layout data', () => {
  const api = runtime({ barkour_finish_photos_v4_recovery_1: JSON.stringify([
    photo('texas-v3-dynamic-2', 1), photo('coast-v3-recovery-1', 2), photo('texas-v3-recovery-1', 3)
  ]) });
  assert.equal(api.Storage.saveCourse('texas', 'EASY', result('coast-v3-recovery-1')), null);
  assert.equal(api.Storage.saveCourse('texas', 'EASY', result('texas-v3-recovery-4')), null);
  assert.equal(api.Storage.saveCourse('coast', 'EASY', result('coast-v3-recovery-3')), null);
  assert.equal(api.Storage.getRecoveryFinishPhotos().length, 1);
  assert.equal(api.Storage.getRecoveryFinishPhotos()[0].created, 3);
});

test('refined pacing archives its recovery-1 record and keeps each photo bucket independent', () => {
  const key = 'texas:EASY:fixed', old = result(undefined, { score: 999, completions: 8 });
  const oldPhotos = JSON.stringify([photo('texas-v3-recovery-1', 1)]);
  const api = runtime({ barkour_adventure_records_v4: JSON.stringify({ [key]: old }), barkour_finish_photos_v4_recovery_1: oldPhotos });
  assert.equal(api.Storage.saveCourse('texas', 'EASY', result('texas-v3-recovery-2')).archived, true);
  assert.deepEqual(JSON.parse(JSON.stringify(api.Storage.getArchivedV4Records()[0].record)), old);
  assert.equal(api.Storage.getV4Records()[key].completions, 1);
  for (let i = 0; i < 30; i++) assert.equal(api.Storage.saveFinishPhoto(photo('texas-v3-recovery-2', 100 + i)), true);
  assert.equal(api.data.get('barkour_finish_photos_v4_recovery_1'), oldPhotos);
  assert.equal(api.Storage.getRefinedFinishPhotos().length, 24);
  assert.equal(api.Storage.getFinishPhotos()[24].courseLayoutId, 'texas-v3-recovery-1');
  const activeBytes = api.data.get('barkour_adventure_records_v4');
  api.localStorage.setItem = () => { throw new Error('blocked'); };
  assert.equal(api.Storage.saveCourse('texas', 'EASY', result('texas-v3-recovery-1')).saved, false);
  assert.equal(api.data.get('barkour_adventure_records_v4'), activeBytes);
});

test('traversal revision starts new history, preserves recovery-2 photos, and blocks destructive replacement when archive write fails', () => {
  const key = 'texas:EASY:fixed';
  const old = result('texas-v3-recovery-2', { score: 9876, stars: 3, completions: 7 });
  const refinedPhotos = JSON.stringify([photo('texas-v3-recovery-2', 2)]);
  const api = runtime({ barkour_adventure_records_v4: JSON.stringify({ [key]: old }), barkour_finish_photos_v4_recovery_2: refinedPhotos });
  const write = api.Storage.saveCourse('texas', 'EASY', result('texas-v3-recovery-3'));
  assert.equal(write.saved, true); assert.equal(write.archived, true);
  assert.deepEqual(JSON.parse(JSON.stringify(api.Storage.getArchivedV4Records()[0].record)), old);
  assert.equal(api.Storage.getV4Records()[key].courseLayoutId, 'texas-v3-recovery-3');
  assert.equal(api.Storage.getV4Records()[key].completions, 1);
  for (let i = 0; i < 30; i++) assert.equal(api.Storage.saveFinishPhoto(photo('texas-v3-recovery-3', 100 + i)), true);
  assert.equal(api.data.get('barkour_finish_photos_v4_recovery_2'), refinedPhotos);
  assert.equal(api.Storage.PHOTO_KEYS.traversal, 'barkour_finish_photos_v4_recovery_3');
  assert.equal(api.Storage.getTraversalFinishPhotos().length, 24);
  assert.equal(api.Storage.getFinishPhotos()[0].courseLayoutId, 'texas-v3-recovery-3');
  assert.equal(api.Storage.getFinishPhotos()[24].courseLayoutId, 'texas-v3-recovery-2');

  const activeBytes = api.data.get('barkour_adventure_records_v4');
  const original = api.localStorage.setItem;
  const writes = [];
  api.localStorage.setItem = (name, value) => {
    writes.push(name);
    if (name === 'barkour_adventure_records_v4_archive') throw new Error('archive blocked');
    original.call(api.localStorage, name, value);
  };
  const blocked = api.Storage.saveCourse('texas', 'EASY', result('texas-v3-recovery-2'));
  assert.equal(blocked.saved, false); assert.equal(blocked.incompatible, true);
  assert.equal(api.data.get('barkour_adventure_records_v4'), activeBytes);
  assert.equal(writes.includes('barkour_adventure_records_v4'), false);
});

test('recovery-3 is accepted only for traversal-revised tracks and its reader rejects mixed revisions', () => {
  for (const track of ['texas', 'alpine', 'forest']) {
    const api = runtime();
    assert.equal(api.Storage.saveCourse(track, 'EASY', result(`${track}-v3-recovery-3`)).saved, true);
  }
  for (const track of ['coast', 'ember']) {
    const api = runtime();
    assert.equal(api.Storage.saveCourse(track, 'EASY', result(`${track}-v3-recovery-3`)), null);
  }
  const api = runtime({ barkour_finish_photos_v4_recovery_3: JSON.stringify([
    photo('texas-v3-recovery-2', 1), photo('texas-v3-recovery-3', 2), photo('coast-v3-recovery-3', 3)
  ]) });
  assert.equal(api.Storage.getTraversalFinishPhotos().length, 1);
  assert.equal(api.Storage.getTraversalFinishPhotos()[0].created, 2);
});
