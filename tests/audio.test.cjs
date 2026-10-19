// Scheduling/integration tests only: a mock cannot establish audible mix quality.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function runtime() {
    const saved = new Map();
    const contexts = [];
    class Param {
        setValueAtTime(value, at) { assert.ok(Number.isFinite(value) && Number.isFinite(at)); }
        linearRampToValueAtTime(value, at) { assert.ok(Number.isFinite(value) && Number.isFinite(at)); }
        exponentialRampToValueAtTime(value, at) { assert.ok(value > 0 && Number.isFinite(at)); }
    }
    class Node {
        constructor(context, kind) {
            this.context = context; this.kind = kind; this.connected = false;
            this.gain = new Param(); this.frequency = new Param();
        }
        connect() { this.connected = true; }
        disconnect() { this.connected = false; }
        start(at) {
            assert.ok(at >= this.context.currentTime);
            this.context.started.push(this); this.context.active.add(this);
        }
        stop(at = this.context.currentTime) { this.end = at; }
    }
    class Context {
        constructor() {
            this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 48000;
            this.destination = {}; this.started = []; this.active = new Set(); this.buffers = 0;
            contexts.push(this);
        }
        createGain() { return new Node(this, 'gain'); }
        createOscillator() { return new Node(this, 'oscillator'); }
        createBiquadFilter() { return new Node(this, 'filter'); }
        createBufferSource() { return new Node(this, 'noise'); }
        createBuffer(channels, length, rate) {
            assert.equal(channels, 1); assert.equal(length, rate); this.buffers++;
            const data = new Float32Array(length);
            return { getChannelData: () => data };
        }
        resume() { this.state = 'running'; return Promise.resolve(); }
        suspend() { this.state = 'suspended'; return Promise.resolve(); }
        advance(dt) {
            if (this.state === 'running') this.currentTime += dt;
            // Includes queued onended events caused by explicit stop while suspended.
            for (const node of this.active) if (node.end <= this.currentTime) {
                this.active.delete(node); node.onended?.();
            }
        }
    }
    const sandbox = vm.createContext({ console, window: { AudioContext: Context, addEventListener() {} }, document: {},
        localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) } });
    for (const file of ['config', 'storage', 'character-assets', 'character', 'tracks', 'art', 'background', 'collision', 'audio', 'finish-photo', 'game'])
        vm.runInContext(fs.readFileSync(path.join(root, 'js', file + '.js'), 'utf8'), sandbox);
    const api = vm.runInContext('({GameAudio, Game, Character, CHARACTER_ASSETS, Background, Storage})', sandbox);
    return { ...api, contexts };
}
function gameFor(api) {
    const game = Object.create(api.Game.prototype);
    Object.assign(game, { canvas: { width: 1600, height: 800 }, selectedTrackIndex: 0, selectedSpeedIndex: 0,
        selectedCharacterIndex: 0, speedOptions: ['EASY', 'MEDIUM', 'HARD'], dogSprites: api.CHARACTER_ASSETS,
        character: new api.Character(api.CHARACTER_ASSETS[0], 260), background: new api.Background({ width: 1600, height: 800 }),
        audio: new api.GameAudio(), uiTime: 0, reducedMotion: true });
    game.startGame(); game.state = 'PLAYING'; game.character.setState('run');
    return game;
}

test('audio creates no context before a gesture, including mute and saved-off starts', () => {
    const api = runtime(); const audio = new api.GameAudio();
    audio.update(1 / 60, 'texas', 0, true, 400); audio.play('power'); audio.pause(); audio.stop();
    assert.equal(api.contexts.length, 0);
    audio.toggle(); // Turn sound off before any unlock gesture.
    audio.unlock(); audio.play('finish');
    assert.equal(api.contexts.length, 0);
    const savedOff = new api.GameAudio();
    assert.equal(savedOff.enabled, false); savedOff.unlock();
    assert.equal(api.contexts.length, 0);
    audio.toggle(); // Sound-on button is itself a user gesture.
    assert.equal(api.contexts.length, 1); assert.equal(audio.context.state, 'running');
});

test('mute/pause stop pending notes, suppress updates, and safely resume from a gesture', () => {
    const audio = new (runtime().GameAudio)(); audio.unlock(); audio.play('power');
    assert.ok(audio.voices.size > 1);
    const pending = [...audio.voices]; audio.toggle();
    assert.equal(audio.voices.size, 0); assert.equal(audio.context.state, 'suspended');
    assert.ok(pending.every(node => node.end === audio.context.currentTime && !node.connected));
    const starts = audio.context.started.length;
    audio.update(.1, 'coast', 5, true, 500); audio.play('expire');
    assert.equal(audio.context.started.length, starts);
    audio.toggle(); audio.update(1 / 60, 'coast', 0, true, 500);
    assert.ok(audio.context.started.length > starts);
    audio.pause(); assert.equal(audio.context.state, 'suspended'); assert.equal(audio.voices.size, 0);
    audio.unlock(); audio.play('jump'); assert.ok(audio.voices.size > 0);
    audio.stop(); audio.context.advance(.01);
    assert.equal(audio.voices.size, 0); assert.equal(audio.context.active.size, 0);
});

test('450 seconds across five terrain scores remain bounded and reuse one noise buffer', () => {
    const audio = new (runtime().GameAudio)(); audio.unlock();
    let peak = 0;
    for (const theme of Object.keys(audio.themes)) {
        for (let frame = 0; frame < 90 * 60; frame++) {
            audio.context.advance(1 / 60);
            audio.update(1 / 60, theme, Math.min(6, Math.floor(frame / 800)), frame % 140 < 80, 450);
            if (frame % 73 === 0) audio.play('treat', 3);
            if (frame % 499 === 0) audio.play('break', 'crystal');
            if (frame === 4200) audio.play('expire');
            peak = Math.max(peak, audio.voices.size);
            assert.ok(audio.voices.size <= 24);
        }
        audio.pause(); assert.equal(audio.voices.size, 0); audio.unlock();
    }
    assert.ok(peak > 3, 'exercise overlapping music, ambience and event sources');
    assert.equal(audio.context.buffers, 1);
    audio.stop(); audio.context.advance(.1); assert.equal(audio.context.active.size, 0);
});

test('stalled updates never emit a catch-up burst and sources disconnect naturally', () => {
    const audio = new (runtime().GameAudio)(); audio.unlock();
    audio.update(20, 'texas', 6, true, 450);
    assert.ok(audio.voices.size > 0 && audio.voices.size < 10);
    const sources = [...audio.voices]; audio.context.advance(3);
    assert.equal(audio.voices.size, 0); assert.ok(sources.every(source => !source.connected));
    const starts = audio.context.started.length;
    for (const dt of [NaN, Infinity, -1, 0]) audio.update(dt, 'texas', 6, true, 450);
    assert.equal(audio.context.started.length, starts);
});

test('Game sends world pixels per second and grounded state; expiry/finale cues fire once', () => {
    const api = runtime(); const game = gameFor(api); const updates = []; const events = [];
    const update = game.audio.update.bind(game.audio), play = game.audio.play.bind(game.audio);
    game.audio.update = (...args) => { updates.push(args); return update(...args); };
    game.audio.play = (...args) => { events.push(args); return play(...args); };
    const speed = game.gameSpeed;
    game.updatePlaying(1 / 120);
    assert.deepEqual(updates[0], [1 / 120, 'texas', 0, true, speed * 60, 0]);
    game.jump(); game.updatePlaying(1 / 120); assert.equal(updates.at(-1)[3], false);
    game.powers.star = 1.5;
    for (let i = 0; i < 20; i++) game.updatePlaying(1 / 120);
    assert.equal(events.filter(([name]) => name === 'expire').length, 1);
    const finale = game.course.sections.find(section => section.beatId === 'golden-arch') || game.course.sections.at(-1);
    game.distance = finale.x;
    game.updatePlaying(1 / 120); game.updatePlaying(1 / 120);
    assert.equal(events.filter(([name]) => name === 'finale').length, 1);
    assert.equal(updates.at(-1)[2], finale.index);
});

test('Game lifecycle clears audio for pause, menu, restart and ends with a finish phrase', () => {
    const api = runtime(); const game = gameFor(api);
    game.updatePlaying(1 / 120); assert.ok(game.audio.voices.size > 0);
    game.pause(); assert.equal(game.audio.voices.size, 0); assert.equal(game.audio.context.state, 'suspended');
    const starts = game.audio.context.started.length;
    game.update(1000); assert.equal(game.audio.context.started.length, starts);
    game.resume(); assert.equal(game.audio.context.state, 'running'); game.updatePlaying(1 / 120);
    game.returnToMenu(); assert.equal(game.audio.voices.size, 0);
    game.startGame(); assert.equal(game.audio.voices.size, 0);
    game.state = 'PLAYING'; game.updatePlaying(1 / 120);
    const scoreSources = [...game.audio.voices]; game.finish();
    assert.equal(game.state, 'COMPLETE'); assert.ok(game.audio.voices.size > 0);
    assert.ok(scoreSources.every(source => !source.connected), 'finish clears running score before playing its phrase');
    game.audio.context.advance(3); assert.equal(game.audio.voices.size, 0);
});

test('Game supplies obstacle material for the Super Paws break cue', () => {
    const game = gameFor(runtime()); const events = [];
    game.audio.play = (...args) => events.push(args);
    game.powers.star = 3;
    game.hitObstacle({ type: 'crystal', worldX: game.distance });
    assert.deepEqual(events, [['break', 'crystal']]);
});

test('Texas Flow layer and stampede punctuation stay bounded and remain optional', () => {
    const audio = new (runtime().GameAudio)(); audio.unlock();
    audio.update(.1, 'texas', 8, true, 480, 2);
    const before = audio.voices.size; audio.play('flow'); audio.play('stampede');
    assert.ok(before > 0); assert.ok(audio.voices.size <= 24);
    audio.toggle(); const muted = audio.context.started.length;
    audio.update(.1, 'texas', 8, true, 480, 2); audio.play('flow'); audio.play('stampede');
    assert.equal(audio.context.started.length, muted);
});

test('Texas finale harmony waits for the authored Golden Arch beat', () => {
    const Api = runtime(), bridge = new Api.GameAudio(), finale = new Api.GameAudio();
    bridge.unlock(); finale.unlock();
    bridge.update(.1, 'texas', 8, true, 480, 2);
    finale.update(.1, 'texas', 9, true, 480, 2);
    assert.ok(finale.context.started.length > bridge.context.started.length);
});
