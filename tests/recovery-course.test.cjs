const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function runtime() {
    const context = vm.createContext({ console, window: { addEventListener() {} }, document: {},
        localStorage: { getItem() { return null; }, setItem() {} } });
    for (const file of ['config','pet-manifest','storage','character-assets','character','tracks','art','background','collision','finish-photo','game','game-ui'])
        vm.runInContext(fs.readFileSync(`js/${file}.js`, 'utf8'), context);
    return vm.runInContext('({CONFIG,Course,TRACKS,V3_MANIFESTS,DYNAMIC_MANIFESTS,RECOVERY_1_MANIFESTS,RECOVERY_2_MANIFESTS,RECOVERY_MANIFESTS,CHARACTER_ASSETS,Character,Background,Game})', context);
}

function gameFor(api, difficulty = 0, trackIndex = 0, dogIndex = 0) {
    const game = Object.create(api.Game.prototype);
    Object.assign(game, { canvas: { width: 1600, height: 800 }, selectedTrackIndex: trackIndex, selectedSpeedIndex: difficulty,
        selectedCharacterIndex: dogIndex, speedOptions: ['EASY','MEDIUM','HARD'], dogSprites: api.CHARACTER_ASSETS,
        character: new api.Character(api.CHARACTER_ASSETS[dogIndex], 260), background: new api.Background({ width: 1600, height: 800 }),
        audio: { unlock() {}, play() {}, stop() {} }, uiTime: 0, reducedMotion: true });
    game.startGame(); game.state = 'PLAYING'; game.character.setState('run');
    return game;
}

function driveMissedPower(game, lead) {
    for (let step = 0; step < 20000 && game.state === 'PLAYING'; step++) {
        const next = game.course.obstacles.find(item => !item.hit && !item.passed && item.worldX > game.distance - 80);
        const star = game.course.pickups.find(item => item.type === 'star' && !item.collected && !item.missed);
        const target = star && star.worldX < (next?.worldX ?? Infinity) ? star : game.powers.star > 0 && next?.smash ? null : next;
        if (target && !game.character.isJumping && target.worldX > game.distance &&
            target.worldX - game.distance < game.gameSpeed * 60 * lead) game.jump();
        game.updatePlaying(1 / 120);
    }
    return game;
}

test('recovery provenance is explicit and leaves historical manifests unchanged', () => {
    const api = runtime(), texas = api.TRACKS.find(track => track.id === 'texas');
    const historical = JSON.stringify(api.V3_MANIFESTS.texas);
    const dynamic = JSON.stringify(api.DYNAMIC_MANIFESTS.texas);
    const course = new api.Course(texas, api.CONFIG.DIFFICULTY.EASY, { recovery: true, recoveryRevision: 2 });
    assert.equal(course.layoutId, 'texas-v3-recovery-2');
    assert.equal(course.recovery, true);
    assert.equal(course.dynamic, true);
    assert.equal(JSON.stringify(api.V3_MANIFESTS.texas), historical);
    assert.equal(JSON.stringify(api.DYNAMIC_MANIFESTS.texas), dynamic);
    const recovery1 = new api.Course(texas, api.CONFIG.DIFFICULTY.EASY, { recovery: true, recoveryRevision: 1 });
    assert.equal(recovery1.layoutId, 'texas-v3-recovery-1');
    assert.equal(recovery1.length / recovery1.unit, 62);
    assert.equal(recovery1.beatById['bridge-run'].at, 38);
    assert.equal(new api.Course(texas, api.CONFIG.DIFFICULTY.EASY).layoutId, 'texas-v3-elevation-1');
    assert.equal(new api.Course(texas, api.CONFIG.DIFFICULTY.EASY, { dynamic: true }).layoutId, 'texas-v3-dynamic-2');
});

test('historical recovery-2 Texas removes machines, platforms, route gate and automatic photo launch', () => {
    const api = runtime(), texas = api.TRACKS.find(track => track.id === 'texas');
    const course = new api.Course(texas, api.CONFIG.DIFFICULTY.EASY, { recovery: true, recoveryRevision: 2 });
    assert.equal(course.platforms.length, 0);
    assert.equal(course.routeGates.length, 0);
    assert.equal(course.surfaces.some(surface => surface.kind === 'photo'), false);
    assert.equal(course.obstacles.some(obstacle => obstacle.mechanism === 'piston'), false);
    assert.equal(JSON.stringify(api.RECOVERY_2_MANIFESTS.texas).match(/pipeline|piston|platformRun/g), null);
    assert.ok(course.landmarks.some(item => item.style === 'dry-wash'));
    assert.ok(course.landmarks.some(item => item.style === 'wind-brush'));
});

test('Texas optional reward geometry fits one leap and remains inside course bounds', () => {
    const api = runtime(), texas = api.TRACKS.find(track => track.id === 'texas');
    for (const difficulty of Object.values(api.CONFIG.DIFFICULTY)) {
        const course = new api.Course(texas, difficulty, { recovery: true, recoveryRevision: 2 });
        for (const phraseId of ['wash-rim', 'final-rosette']) {
            const phrase = course.phrases[phraseId];
            assert.equal(phrase.optional, true);
            assert.ok(phrase.pickups.length >= 5);
            const spanSeconds = (phrase.pickups.at(-1).worldX - phrase.pickups[0].worldX) / course.unit;
            assert.ok(spanSeconds <= 1.2, `${phraseId} must fit one ordinary leap`);
            assert.ok(phrase.pickups.every(item => item.worldX > 0 && item.worldX < course.length));
            assert.ok(Math.max(...phrase.pickups.map(item => 600 - item.y)) <= 315);
        }
        assert.equal(course.pickups.filter(item => item.type === 'souvenir').length, 3);
        assert.ok(course.pickups.every(item => item.worldX < course.length));
    }
});

test('wind-brush power cluster has a fair single-leap fallback and a distinct rhythm', () => {
    const api = runtime(), texas = api.TRACKS.find(track => track.id === 'texas');
    for (const difficulty of Object.values(api.CONFIG.DIFFICULTY)) {
        const course = new api.Course(texas, difficulty, { recovery: true, recoveryRevision: 2 });
        const brush = course.obstacles.filter(item => item.mechanism === 'wind-brush');
        assert.equal(brush.length, 2);
        assert.ok((brush[1].worldX - brush[0].worldX) / course.unit <= .25, 'brush cluster must be compact');
        assert.ok(brush.every(item => item.smash && item.height <= 58));
        assert.notEqual(brush[0].width, brush[1].width);
        assert.equal(course.obstacles.filter(item => item.beatId === 'tumble-three' && item.type === 'tumbleweed').length, 1);
    }
});

test('real accelerated Game trace clears missed-power Texas fallback across timing and difficulty', () => {
    const api = runtime();
    for (const difficulty of [0,1,2]) for (const lead of [.42,.5,.57,.65,.72]) {
        const game = driveMissedPower(gameFor(api, difficulty), lead);
        assert.equal(game.state, 'COMPLETE', `${difficulty}/${lead} must finish`);
        assert.equal(game.damage, 0, `${difficulty}/${lead} must clear all recovery hazards`);
        assert.equal(game.smashes, 0, `${difficulty}/${lead} intentionally misses power`);
    }
});

test('historical recovery-2 trails remove generic gates and photo launchers while keeping distinct power counts', () => {
    const api = runtime(), counts = [];
    for (const track of api.TRACKS) {
        const course = new api.Course(track, api.CONFIG.DIFFICULTY.EASY, { recovery: true, recoveryRevision: 2 });
        assert.equal(course.layoutId, `${track.id}-v3-recovery-2`);
        assert.equal(course.routeGates.length, 0);
        assert.equal(course.surfaces.some(item => item.kind === 'photo'), false);
        assert.ok(course.pickups.some(item => item.optional), `${track.id} retains a visible optional reward`);
        counts.push(course.obstacles.filter(item => item.smash).length);
    }
    assert.deepEqual([...new Set(counts)].sort(), [1,2]);
    const forest = new api.Course(api.TRACKS.find(track => track.id === 'forest'), api.CONFIG.DIFFICULTY.EASY, { recovery: true, recoveryRevision: 2 });
    assert.equal(forest.platforms.length, 2);
    assert.ok(forest.platforms.every(item => item.style === 'canopy' && item.y === 500));
    for (const track of api.TRACKS.filter(track => track.id !== 'forest'))
        assert.equal(new api.Course(track, api.CONFIG.DIFFICULTY.EASY, { recovery: true, recoveryRevision: 2 }).platforms.length, 0);
});

test('recovery-2 applies only the scoped pacing shifts over frozen recovery-1', () => {
    const api = runtime();
    for (const track of api.TRACKS) {
        const oldManifest = api.RECOVERY_1_MANIFESTS[track.id], current = api.RECOVERY_2_MANIFESTS[track.id];
        assert.equal(current.nominalSeconds, oldManifest.nominalSeconds - 4);
        assert.equal(current.beats.at(-1).at, oldManifest.beats.at(-1).at - 4);
        assert.equal(current.beats.at(-1).recovery.until, oldManifest.beats.at(-1).recovery.until - 4);
    }
    const texas = api.RECOVERY_2_MANIFESTS.texas.beats.find(item => item.id === 'bridge-run');
    assert.equal(texas.at, 35); assert.equal(texas.recovery.until, 40);
    const forestChoice = api.RECOVERY_2_MANIFESTS.forest.beats.find(item => item.id === 'canopy-choice');
    const forestRebound = api.RECOVERY_2_MANIFESTS.forest.beats.find(item => item.id === 'second-rebound');
    assert.deepEqual([forestChoice.at, forestChoice.recovery.until], [17,21.5]);
    assert.deepEqual([forestRebound.at, forestRebound.recovery.until], [24,29]);
    const foam = api.RECOVERY_2_MANIFESTS.coast.beats.find(item => item.id === 'tide-combination').primitives
        .find(item => item.phrase === 'foam-pearls');
    assert.equal(Array.from(foam.heights).join(','), '95,145,215,275');
    assert.equal(foam.offset, 4); assert.equal(foam.optional, true);
    assert.throws(() => new api.Course(api.TRACKS[0], api.CONFIG.DIFFICULTY.EASY, { recovery: true, recoveryRevision: 4 }),
        /Unsupported recovery revision/);
});

test('final optional souvenir is physically collectible and photographs an airborne chosen finish', () => {
    const api = runtime();
    for (let trackIndex = 0; trackIndex < api.TRACKS.length; trackIndex++) for (const difficulty of [0,1,2]) for (const dogIndex of [0,1]) {
        const game = gameFor(api, difficulty, trackIndex, dogIndex);
        // Isolate the resolving choice while retaining real acceleration,
        // character physics, pickup collision, and finish timing.
        game.course.obstacles = [];
        const finalPhrase = Object.values(game.course.phrases).filter(phrase => phrase.optional)
            .sort((a,b) => b.pickups.at(-1).worldX - a.pickups.at(-1).worldX)[0];
        const target = finalPhrase.pickups.at(-1);
        let jumped = false;
        for (let step = 0; step < 20000 && game.state === 'PLAYING'; step++) {
            if (!jumped && target.worldX > game.distance && target.worldX - game.distance < game.gameSpeed * 60 * .55) {
                game.jump(); jumped = true;
            }
            game.updatePlaying(1 / 120);
        }
        assert.equal(game.state, 'COMPLETE');
        assert.equal(game.course.pickups.find(item => item.type === 'souvenir' && item.slot === 2).collected, true,
            `${api.TRACKS[trackIndex].id}/${difficulty}/${dogIndex} final souvenir`);
        assert.equal(game.finishPhoto.pose.state === 'run', false, `${api.TRACKS[trackIndex].id}/${difficulty}/${dogIndex} airborne photo`);

        const grounded = gameFor(api, difficulty, trackIndex, dogIndex);
        grounded.course.obstacles = [];
        while (grounded.state === 'PLAYING') grounded.updatePlaying(1 / 120);
        assert.equal(grounded.state, 'COMPLETE');
        assert.equal(grounded.finishPhoto.pose.state, 'run', `${api.TRACKS[trackIndex].id}/${difficulty}/${dogIndex} grounded photo`);
        assert.equal(grounded.course.pickups.find(item => item.type === 'souvenir' && item.slot === 2).collected, false);
    }
});
