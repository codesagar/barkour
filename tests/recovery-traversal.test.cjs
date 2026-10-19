const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
function runtime() {
  const context = vm.createContext({ console, window: { addEventListener() {} }, document: {}, localStorage: { getItem() { return null; }, setItem() {} } });
  for (const file of ['config','pet-manifest','storage','character-assets','character','tracks'])
    vm.runInContext(fs.readFileSync(path.join(root, 'js', `${file}.js`), 'utf8'), context);
  return vm.runInContext('({CONFIG,TRACKS,Course,Character,CHARACTER_ASSETS,RECOVERY_2_MANIFESTS,RECOVERY_MANIFESTS})', context);
}

test('recovery-3 changes only the approved traversal trails and preserves recovery-2', () => {
  const api = runtime();
  for (const id of ['texas','alpine','forest']) {
    assert.equal(api.RECOVERY_2_MANIFESTS[id].layoutId, `${id}-v3-recovery-2`);
    assert.equal(api.RECOVERY_MANIFESTS[id].layoutId, `${id}-v3-recovery-3`);
  }
  for (const id of ['coast','ember']) assert.equal(api.RECOVERY_MANIFESTS[id], api.RECOVERY_2_MANIFESTS[id]);
  const difficulty = api.CONFIG.DIFFICULTY.EASY;
  assert.equal(new api.Course(api.TRACKS[0], difficulty, { recovery: true }).layoutId, 'texas-v3-recovery-3');
  assert.equal(new api.Course(api.TRACKS[0], difficulty, { recovery: true, recoveryRevision: 2 }).layoutId, 'texas-v3-recovery-2');
  assert.equal(new api.Course(api.TRACKS[2], difficulty, { recovery: true }).layoutId, 'coast-v3-recovery-2');
});

test('tall routes use natural launchers, supported 450 ledges, short gaps, and a safe floor bypass', () => {
  const api = runtime();
  const expected = {
    texas: { beat: 'bridge-run', launcher: 'log-ramp', platform: 'log-ledge' },
    alpine: { beat: 'launch-variation', launcher: 'snow-ramp', platform: 'snow-shelf' },
    forest: { beat: 'second-rebound', launcher: 'canopy', platform: 'canopy' }
  };
  for (const [id, contract] of Object.entries(expected)) for (const difficulty of Object.values(api.CONFIG.DIFFICULTY)) {
    const course = new api.Course(api.TRACKS.find(track => track.id === id), difficulty, { recovery: true });
    const surface = course.surfaces.find(item => item.beatId === contract.beat);
    const ledges = course.platforms.filter(item => item.beatId === contract.beat);
    assert.equal(surface.kind, contract.launcher); assert.equal(surface.velocity, -1240);
    assert.equal(ledges.length, 2); assert.ok(ledges.every(item => item.style === contract.platform && item.y === 450));
    const nominalGap = (ledges[1].worldStart - ledges[0].worldEnd) / course.unit;
    assert.ok(Math.abs(nominalGap - .35) < 1e-9);
    assert.equal(course.supportAt((ledges[0].worldStart + ledges[0].worldEnd) / 2, 600), null,
      `${id}: grounded runner must retain the continuous safe floor`);

    // Integrate the production ballistic constants. The descending crossing of
    // y=450 must fall on the first authored support at every course speed.
    let y = 600, velocity = surface.velocity, distance = surface.worldX;
    for (let step = 0; step < 400 && y < 600.01; step++) {
      const previous = velocity; velocity = Math.min(api.CONFIG.PHYSICS.MAX_FALL_SPEED, velocity + api.CONFIG.PHYSICS.GRAVITY * api.CONFIG.PHYSICS.FIXED_STEP);
      y += (previous + velocity) * .5 * api.CONFIG.PHYSICS.FIXED_STEP;
      distance += difficulty.MAX_SPEED * 60 * api.CONFIG.PHYSICS.FIXED_STEP;
      if (velocity > 0 && y >= 450) break;
    }
    assert.ok(distance >= ledges[0].worldStart && distance <= ledges[0].worldEnd,
      `${id}/${difficulty.LABEL}: descending landing ${distance} outside first support`);
  }
});

test('the Alpine mountain snowball has one fixed source, a noncolliding descent, and a HARD jump window', () => {
  const api = runtime();
  for (const difficulty of Object.values(api.CONFIG.DIFFICULTY)) {
    const course = new api.Course(api.TRACKS[1], difficulty, { recovery: true });
    const balls = course.obstacles.filter(item => item.mechanism === 'mountain-snowball');
    assert.equal(balls.length, 1);
    const ball = balls[0], width = ball.width, height = ball.height;
    let distance = ball.originX - 1150, time = 0, landedAt = null, contactAt = null;
    for (let step = 0; step < 600; step++) {
      time += api.CONFIG.PHYSICS.FIXED_STEP;
      distance += difficulty.MAX_SPEED * 60 * api.CONFIG.PHYSICS.FIXED_STEP;
      course.update(api.CONFIG.PHYSICS.FIXED_STEP, distance, time);
      assert.equal(ball.width, width); assert.equal(ball.height, height);
      if (landedAt === null) {
        if (ball.active) landedAt = time;
        else assert.ok(ball.baseY < 600 && ball.warning, 'airborne ball must remain a visible, noncolliding warning');
      }
      if (landedAt !== null && ball.worldX - distance <= 300) { contactAt = time; break; }
    }
    assert.ok(landedAt !== null && contactAt !== null);
    // The falling sphere is already the cue: the complete visible response
    // window includes its 1.10s descent, followed by at least .40s while solid.
    assert.ok(contactAt >= 1.5 && contactAt - landedAt >= .4,
      `${difficulty.LABEL}: ${contactAt.toFixed(3)}s visible / ${(contactAt - landedAt).toFixed(3)}s grounded`);
    assert.equal(ball.originX + ball.sourceOffset, ball.originX + 140);
  }
});


test('grounded tall launches meet their authored apex rewards on every difficulty', () => {
  const api = runtime();
  const episodes = [
    { track: 'texas', beat: 'bridge-run', phrase: 'wash-rim', slot: 1 },
    { track: 'alpine', beat: 'powder-launch', phrase: 'powder-line', slot: 0 },
    { track: 'forest', beat: 'first-rebound', phrase: 'first-canopy', slot: 0 }
  ];
  for (const episode of episodes) for (const difficulty of Object.values(api.CONFIG.DIFFICULTY)) {
    const course = new api.Course(api.TRACKS.find(track => track.id === episode.track), difficulty, { recovery: true });
    const surface = course.surfaces.find(item => item.beatId === episode.beat);
    const targets = [...course.phrases[episode.phrase].pickups,
      course.pickups.find(item => item.type === 'souvenir' && item.slot === episode.slot)];
    for (const speed of [difficulty.INITIAL_SPEED, difficulty.MAX_SPEED]) {
      const dog = new api.Character(api.CHARACTER_ASSETS[0], api.CONFIG.CHARACTER.X_POSITION);
      dog.jump(); dog.velocityY = surface.velocity; dog.automaticLaunch = true;
      let distance = surface.worldX - (surface.triggerRadius || surface.width / 2), remaining = new Set(targets);
      for (let step = 0; step < 300 && dog.isJumping; step++) {
        distance += speed * 60 * api.CONFIG.PHYSICS.FIXED_STEP;
        dog.update(api.CONFIG.PHYSICS.FIXED_STEP, speed);
        const bounds = dog.getBounds();
        for (const pickup of remaining) {
          const x = course.screenX(pickup.worldX, distance), radius = pickup.type === 'treat' ? 22 : 30;
          const nearX = Math.max(bounds.x, Math.min(x, bounds.x + bounds.width));
          const nearY = Math.max(bounds.y, Math.min(pickup.y, bounds.y + bounds.height));
          if ((x - nearX) ** 2 + (pickup.y - nearY) ** 2 <= radius ** 2) remaining.delete(pickup);
        }
      }
      assert.equal(remaining.size, 0, `${episode.track}/${difficulty.LABEL}/${speed}: ${[...remaining].map(item => [item.worldX,item.y])}`);
    }
  }
});
