class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = true;
        this.state = 'LOADING';
        this.selectedCharacterIndex = this.normalizeCharacterIndex(Storage.getSelectedCharacter());
        this.selectedTrackIndex = 0;
        const savedDifficulty = Storage.read('barkour_difficulty', 'EASY');
        this.selectedSpeedIndex = Math.max(0, ['EASY', 'MEDIUM', 'HARD'].indexOf(savedDifficulty));
        this.speedOptions = ['EASY', 'MEDIUM', 'HARD'];
        this.audio = new GameAudio();
        this.background = new Background(this.canvas);
        this.lastTime = null;
        this.accumulator = 0;
        this.menuTime = 0;
        this.uiTime = 0;
        this.effects = [];
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Historical preference remains stored, but every new run uses the full leap.
        this.assisted = true;
        this.lowQuality = Storage.read('barkour_low_quality', false) === true;
        this.frameSamples = []; this.renderSamples = [];
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { this.reducedMotion = e.matches; });
        this.init();
    }
    async init() {
        try {
            await this.loadAssets();
            this.character = new Character(this.dogSprites[this.selectedCharacterIndex], CONFIG.CHARACTER.X_POSITION);
            this.ui = new GameUI(this);
            this.inputHandler = new InputHandler(this);
            this.ui.show('loadingScreen', false);
            this.returnToMenu();
            this.startGameLoop();
        } catch (error) {
            console.error('Unable to start Barkour:', error);
            document.getElementById('loadingScreen').innerHTML = '<p>The trails could not load. Please refresh to try again.</p>';
        }
    }
    async loadAssets() {
        const loaded = await Promise.all(CHARACTER_ASSETS.map(async pack => {
            const animations = {};
            await Promise.all(Object.entries(pack.animations).map(async ([name, clip]) => {
                animations[name] = { ...clip, image: await this.loadImage(clip.sheet) };
            }));
            return { ...pack, animations };
        }));
        const fallback = loaded.find(pack => pack.assetId === 'buddy') || loaded[0];
        this.dogSprites = loaded.map(pack => PetManifest.normalize(pack, fallback)).filter(Boolean);
        if (!this.dogSprites.length) throw new Error('No valid pet presentation assets');
        this.selectedCharacterIndex = this.normalizeCharacterIndex(this.selectedCharacterIndex);
    }
    normalizeCharacterIndex(index, count = this.dogSprites?.length || CHARACTER_ASSETS.length) {
        return Math.max(0, Math.min(Math.max(0, count - 1), Math.floor(Number(index) || 0)));
    }
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image(); image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Could not load ${src}`)); image.src = src;
        });
    }
    startGameLoop() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.pause();
            this.lastTime = null; this.accumulator = 0;
        });
        const loop = timestamp => {
            const elapsed = this.lastTime === null ? 0 : timestamp - this.lastTime;
            this.lastTime = timestamp;
            if (!document.hidden) this.update(elapsed);
            const renderStart = performance.now();
            this.render();
            if (this.state === 'PLAYING') {
                this.frameSamples.push(elapsed); this.renderSamples.push(performance.now() - renderStart);
                if (this.frameSamples.length > 1800) { this.frameSamples.shift(); this.renderSamples.shift(); }
            }
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }
    selectTrack(index) { this.selectedTrackIndex = index; this.background.track = TRACKS[index]; this.ui?.updateSelection(); }
    selectCharacter(index) {
        const selected = this.normalizeCharacterIndex(index);
        this.selectedCharacterIndex = selected; Storage.saveSelectedCharacter(selected);
        this.character.setAsset(this.dogSprites[selected]); this.ui?.updateSelection();
    }
    startGame({ retry = false, practiceId = null, legacyRules = false, historicalDynamic = false } = {}) {
        this.assisted = true;
        this.audio.stop?.(); this.audio.unlock();
        this.currentSpeedProfile = CONFIG.getDifficulty(this.speedOptions[this.selectedSpeedIndex]);
        this.course = new Course(TRACKS[this.selectedTrackIndex], this.currentSpeedProfile,
            { dynamic: !legacyRules, recovery: !legacyRules && !historicalDynamic });
        const practice = practiceId ? this.course.practiceSections.find(item => item.id === practiceId) : null;
        // Legacy dispatch is for historical deterministic regression playback, never a UI mode.
        this.forgivingExplorer = !legacyRules && this.selectedSpeedIndex === 0;
        const resultVersion = legacyRules ? this.course.version : 4;
        const rulesId = legacyRules ? null : this.forgivingExplorer ? 'explorer-recovery-v1' : 'heart-challenge-v1';
        this.runContext = Object.freeze({ resultVersion, rulesId, kind: practice ? 'practice' : 'full', trackId: this.course.track.id,
            courseVersion: this.course.version, courseLayoutId: this.course.layoutId, difficulty: this.speedOptions[this.selectedSpeedIndex],
            control: 'fixed', capabilityProfile: typeof EQUAL_PET_GAMEPLAY_BODY_ID === 'string' ? EQUAL_PET_GAMEPLAY_BODY_ID : 'equal-pet-v1', practiceId: practice?.id || null,
            startX: practice?.entryX || 0, endX: practice?.exitX || this.course.length });
        this.practice = practice || null;
        this.background.track = this.course.track;
        this.background.reset();
        this.character.groundY = CONFIG.GROUND.Y_POSITION;
        this.character.setAsset(this.dogSprites[this.selectedCharacterIndex]);
        this.distance = this.runContext.startX; this.background.distance = this.distance; this.playTime = 0; this.wallTime = 0; this.score = 0; this.treats = 0;
        this.mainTreats = 0; this.souvenirs = 0; this.smashes = 0; this.jumps = 0;
        this.sectionScores = []; this.sectionIndex = this.course.sectionAt(this.distance).index; this.sectionStartScore = 0;
        this.previousRecord = this.runContext.kind === 'full' ? (resultVersion === 4 ? Storage.getV4Records() : Storage.getRecords(resultVersion))[Storage.recordKey(this.course.track.id, this.speedOptions[this.selectedSpeedIndex], this.runContext.control)] : null;
        if (practice) for (const item of [...this.course.obstacles, ...this.course.pickups, ...this.course.surfaces]) if (item.worldX < practice.entryX - this.course.unit) { item.passed = true; item.used = true; item.collected = true; }
        this.expiryWarned = false; this.firstCleared = Boolean(practice); this.cueSectionIndex = -1; this.lastTakeoff = null; this.lastFailure = null;
        this.inputHandler?.clear(); this.frameSamples = []; this.renderSamples = [];
        this.damage = 0; this.maxHearts = this.currentSpeedProfile.HEARTS; this.hearts = this.maxHearts;
        this.baseSpeed = this.currentSpeedProfile.INITIAL_SPEED; this.gameSpeed = this.baseSpeed;
        this.powers = { shield: 0, magnet: 0, star: 0 };
        this.invulnerable = 0; this.combo = 0; this.comboTime = 0; this.multiplier = 1;
        this.flow = { phrase: 0, total: 0, idle: 0, lastEvent: '' };
        this.toast = ''; this.toastTime = 0; this.toastPriority = 0; this.teachingTime = 0; this.effects = []; this.fractures = []; this.shake = 0; this.milestone = 0; this.cameraGroundFraction = null;
        this.countdown = retry ? .6 : 2.4; this.state = 'COUNTDOWN'; this.result = null; this.finishPhoto = null; this.persistence = { recordSaved: null, photoSaved: null };
        this.accumulator = 0; this.lastTime = null;
        this.ui?.show('recordsPanel', false); this.ui?.syncState();
    }
    returnToMenu() {
        this.audio.stop?.(); this.inputHandler?.clear();
        this.state = 'START'; this.lastTime = null; this.accumulator = 0; this.effects = []; this.fractures = [];
        this.character.groundY = CONFIG.GROUND.Y_POSITION; this.character.reset(); this.background.track = TRACKS[this.selectedTrackIndex];
        this.ui?.syncState();
    }
    pause() {
        if (!['PLAYING', 'COUNTDOWN'].includes(this.state)) return;
        this.inputHandler?.clear(); this.audio.pause?.();
        this.resumeState = this.state; this.state = 'PAUSED'; this.accumulator = 0;
        this.ui?.syncState();
    }
    resume() {
        if (this.state !== 'PAUSED') return;
        this.state = this.resumeState || 'PLAYING'; this.lastTime = null; this.accumulator = 0;
        this.audio.unlock(); this.ui?.syncState();
    }
    jump() {
        if (this.state !== 'PLAYING') return;
        if (!this.character.isJumping) {
            this.audio.play('jump'); this.jumps++;
            this.lastTakeoff = { distance: this.distance, beatId: this.course?.beatAt?.(this.distance)?.beatId || null, playTime: this.playTime };
        }
        this.character.jump();
    }
    // Release ends an input gesture; it never changes an ordinary or automatic arc.
    releaseJump() {}
    update(elapsed) {
        const dt = Math.max(0, Math.min(elapsed / 1000, CONFIG.PHYSICS.MAX_FRAME_TIME));
        if (this.state === 'START') { if (!this.reducedMotion) this.menuTime += dt * 1000; this.background.update(0, dt); }
        if (this.state === 'COUNTDOWN') {
            this.countdown = Math.max(0, this.countdown - dt);
            this.character.update(dt, 0);
            if (this.countdown === 0) { this.state = 'PLAYING'; this.character.setState('run'); this.ui?.syncState(); }
        } else if (this.state === 'PLAYING') {
            this.wallTime += dt;
            this.accumulator += dt * (this.portrait ? CONFIG.CAMERA.PORTRAIT_PACE : 1);
            const step = CONFIG.PHYSICS.FIXED_STEP;
            while (this.accumulator + 1e-10 >= step && this.state === 'PLAYING') {
                this.accumulator = Math.max(0, this.accumulator - step);
                this.updatePlaying(step);
            }
        } else if (this.state === 'COMPLETE') this.updateEffects(dt);
        this.uiTime += dt;
        if (this.uiTime >= .08) { this.ui?.updateHUD(); this.uiTime = 0; }
    }
    updatePlaying(dt) {
        this.playTime += dt;
        this.character.reducedMotion = this.reducedMotion || this.lowQuality;
        this.character.terrainColor = this.course.track.ground[0] + '99';
        this.background.reducedMotion = this.reducedMotion;
        this.background.lowQuality = this.lowQuality;
        this.course.update(dt, this.distance, this.playTime);
        for (const event of this.course.drainEvents?.() || []) {
            if (event.kind !== 'anticipation') continue;
            const voice = { piston: 'piston', surf: 'surf', 'tidal-drift': 'surf',
                'avalanche-bank': 'avalanche', 'snowball-growth': 'avalanche',
                'falling-log': 'spring', 'pressure-crystal': 'eruption' }[event.mechanism];
            if (voice) this.audio.play(voice);
        }
        const section = this.course.sectionAt(this.distance);
        if (section.index !== this.sectionIndex) {
            this.sectionScores.push(Math.floor(this.score - this.sectionStartScore));
            this.sectionStartScore = this.score; this.sectionIndex = section.index;
        }
        // Cue bookkeeping is independent of score sections, including the opening beat.
        const beat = this.course.beatById?.[section.beatId];
        if (section.index !== this.cueSectionIndex && (!beat || this.distance >= beat.x - CONFIG.CAMERA.PREVIEW_DISTANCE)) {
            this.cueSectionIndex = section.index;
            const cues = { 'first-hop': 'Press once to leap over the fence.', 'first-leap': 'A taller fence. The same press makes the same leap.', 'canyon-fork': 'Canyon fork: stay grounded, or leap for the high rosette.', 'tumble-one': 'Rolling tumbleweeds: clear each marked approach.', 'big-sky': 'Easy paws. A wide-open stretch to breathe.', 'bridge-run': 'Pipeline flyover: take the ramp, run the pipe, then leap the gap.', stampede: 'Super Paws ahead: stay grounded to collect, then smash!', 'golden-arch': 'GOOD DOG arch ahead. Your finish photo is automatic.' };
            const legacy = ['Press once for a full leap.', 'Low rosette: spend a shield, or leap safely over.', 'Magnet: gather both trails!', 'Easy paws. A moment to breathe.', this.course.journey.tip, 'Super Paws ahead: stay grounded to collect, then smash!', 'The finish is ahead. Your photo is automatic.'];
            if (!this.course.recovery || section.index === 0)
                this.notify(beat?.cue || cues[beat?.id] || beat?.label || legacy[section.index], !this.firstCleared);
            if (beat?.recovery?.exit === 'finish' || (!beat && section.index === 6)) this.audio.play('finale');
        }
        this.audio.update?.(dt, this.course.track.id, this.sectionIndex, !this.character.isJumping, this.gameSpeed * 60, this.flow.phrase);
        this.toastTime = Math.max(0, this.toastTime - dt);
        this.teachingTime = Math.max(0, this.teachingTime - dt);
        this.invulnerable = Math.max(0, this.invulnerable - dt);
        this.shake = Math.max(0, this.shake - dt * 20);
        this.comboTime = Math.max(0, this.comboTime - dt);
        if (!this.comboTime) { this.combo = 0; this.multiplier = 1; }
        if (this.course.version === 3 && this.flow.phrase > 0) {
            this.flow.idle += dt;
            if (this.flow.idle + 1e-10 >= 4) {
                this.flow.phrase = Math.max(0, this.flow.phrase - 1);
                this.flow.idle = 0; this.flow.lastEvent = 'Flow eases';
            }
        }
        if (this.powers.star > 0 && this.powers.star <= 1.5 && !this.expiryWarned) {
            this.expiryWarned = true; this.notify(this.course.recovery ? 'Super Paws fading' : 'Super Paws ending · get ready to leap again.', { priority: 90, duration: 1.8 }); this.audio.play('expire');
        }
        for (const type of ['magnet','star']) this.powers[type] = Math.max(0, this.powers[type] - dt);
        this.baseSpeed = Math.min(this.currentSpeedProfile.MAX_SPEED, this.baseSpeed + this.currentSpeedProfile.SPEED_INCREMENT * dt * 60);
        // Ease into/out of Super Paws instead of abruptly changing obstacle arrival times.
        const targetSpeed = this.baseSpeed * (this.powers.star > 0 ? 1.2 : 1);
        this.gameSpeed += (targetSpeed - this.gameSpeed) * Math.min(1, dt * 5);
        const travel = Math.min(this.gameSpeed * 60 * dt, this.runContext.endX - this.distance);
        this.distance += travel; if (this.runContext.kind === 'full') this.score += travel * .035;
        const support = this.course.supportAt?.(this.distance, this.character.y);
        const supportY = support?.y || CONFIG.GROUND.Y_POSITION;
        if (!this.character.isJumping && supportY > this.character.groundY + 1) {
            this.character.groundY = supportY; this.character.isJumping = true; this.character.velocityY = 0;
            this.character.automaticLaunch = true; this.character.setState('fall');
        } else this.character.groundY = supportY;
        this.character.powered = this.powers.star > 0;
        this.character.update(dt, this.gameSpeed);
        this.course.updateRoutes?.(this.distance, this.character);
        for (const surface of this.course.surfaces) {
            const triggerRadius = surface.triggerRadius || surface.width / 2;
            if (!surface.used && Math.abs(surface.worldX - this.distance) < triggerRadius && !this.character.isJumping) {
                this.course.triggerSurface?.(surface, this.playTime); surface.used = true; surface.triggeredAt = this.playTime; this.character.react?.('launch'); this.character.jump(); this.character.velocityY = surface.velocity; this.character.automaticLaunch = true;
                this.audio.play(this.course.dynamic ? 'spring' : 'jump');
                if (surface.kind === 'photo') this.notify('Photo spring! Break the finish tape beneath GOOD DOG.');
                else if (surface.kind === 'pipeline') this.notify('Pipeline flyover! Run the first pipe, then leap the gap.');
                else if (!this.course.recovery) this.notify(surface.kind === 'canopy' ? 'Into the canopy! Leap near the branch edge.' : this.firstCleared ? 'Up we go!' : 'Lift off! Grounded paws trigger the spring.', { priority: 60, duration: 1.8 });
                if (surface.beatId === this.course.beats?.[0].id) this.firstCleared = true;
                this.burst(this.character.x, 595, this.course.track.ground[0], 12);
            }
        }
        this.background.update(travel, dt);
        this.updateEffects(dt, travel);
        const bounds = this.character.getBounds();
        this.collectPickups(bounds, dt);
        for (const obstacle of this.course.obstacles) {
            if (obstacle.hit) continue;
            const box = this.course.bounds(obstacle, this.distance);
            if (!obstacle.passed && box.x + box.width < bounds.x) {
                obstacle.passed = true; if (this.runContext.kind === 'full') this.score += 40;
                if (obstacle.tutorial || (!this.firstCleared && obstacle.beatId === this.course.beats?.[0].id)) {
                    this.firstCleared = true;
                    this.notify(this.course.recovery ? 'Clear!' : obstacle.active === false ? 'Through safely. Outlined prisms are safe.' : 'Clear! One press, one full leap.', true);
                }
                if (this.course.version === 3) this.addFlow('Clean clear');
                this.burst(this.character.x, this.character.y - 120, '#FFEDAC', 4, '+40');
            }
            if (obstacle.active !== false && Collision.checkCollision(bounds, box)) this.hitObstacle(obstacle);
            if (this.state !== 'PLAYING') break;
        }
        // A bypass or missed first encounter also ends introductory prompting.
        if (!this.firstCleared && this.course.beats?.length) {
            const firstId = this.course.beats[0].id;
            const encounters = [...this.course.obstacles, ...this.course.surfaces].filter(item => item.beatId === firstId);
            if (encounters.length && encounters.every(item => item.hit || item.passed || item.used || this.distance > item.worldX + item.width / 2 + 90)) this.firstCleared = true;
        }
        if (this.distance >= this.runContext.endX && this.state === 'PLAYING') this.finish();
        else if (this.distance / this.course.length >= .75 && this.milestone === 0) {
            this.milestone = 1; this.notify('The home stretch. You’ve got this!');
        }
    }
    collectPickups(bounds, dt) {
        const centerX = bounds.x + bounds.width / 2, centerY = bounds.y + bounds.height / 2;
        for (const pickup of this.course.pickups) {
            if (pickup.collected || pickup.missed || (pickup.route && pickup.route !== this.course.activeRoute)) continue;
            let x = this.course.screenX(pickup.worldX, this.distance);
            if (x + 30 < bounds.x) {
                pickup.missed = true;
                if (pickup.type === 'star') this.notify(this.course.recovery ? 'Missed it? Keep leaping.' : 'Super Paws missed · leap over the marked obstacles.', { priority: 80, duration: 2 });
                if (pickup.type === 'treat' && !pickup.bonus) { this.combo = 0; this.multiplier = 1; this.comboTime = 0; }
                continue;
            }
            if (x > 1700) continue;
            if (pickup.type === 'treat' && this.powers.magnet > 0 && Math.hypot(x - centerX, pickup.y - centerY) < 330) {
                pickup.worldX += (centerX - x) * dt * 9;
                pickup.y += (centerY - pickup.y) * dt * 9;
                x = this.course.screenX(pickup.worldX, this.distance);
            }
            const radius = pickup.type === 'treat' ? 22 : 30;
            const nearX = Math.max(bounds.x, Math.min(x, bounds.x + bounds.width));
            const nearY = Math.max(bounds.y, Math.min(pickup.y, bounds.y + bounds.height));
            if ((x - nearX) ** 2 + (pickup.y - nearY) ** 2 > radius ** 2) continue;
            pickup.collected = true;
            if (pickup.type === 'treat') {
                if (this.runContext?.kind === 'practice') { this.audio.play('treat', 1); this.burst(x, pickup.y, '#FFF1A0', 5); continue; }
                this.treats++; if (!pickup.bonus) this.mainTreats++; this.combo++; this.comboTime = 3.8;
                this.multiplier = Math.min(3, 1 + Math.floor(this.combo / 5));
                this.score += 15 * this.multiplier;
                this.audio.play('treat', this.multiplier);
                this.burst(x, pickup.y, '#FFF1A0', 5);
                if (this.course.version === 3 && pickup.phrase && this.course.completePhrase(pickup.phrase)) this.addFlow('Treat phrase complete');
            } else if (pickup.type === 'souvenir') {
                if (this.runContext?.kind === 'practice') { this.notify('Route marker found · practice progress is not saved.'); this.audio.play('power'); continue; }
                this.souvenirs++; this.score += 150;
                this.notify(this.course.recovery ? `${this.course.journey.souvenir} found` : `Rosette ${this.souvenirs}/3 · ${this.course.journey.souvenir}`);
                this.audio.play('power'); this.burst(x, pickup.y, '#FFD66D', 10, '+150');
            } else {
                this.powers[pickup.type] = CONFIG.POWERS[pickup.type].duration || 1;
                const power = CONFIG.POWERS[pickup.type];
                const powerMoment = this.course.version === 3 && pickup.type === 'star' && pickup.powerMoment;
                this.notify(this.course.recovery && powerMoment ? 'Super Paws! Run right through.' : powerMoment ? `${pickup.powerCue || power.name} · Protected for 6s. Run through marked obstacles!` : `${power.name} · ${power.description}`, { priority: 80, duration: 2.2 });
                this.audio.play('power'); this.burst(x, pickup.y, power.color, 14);
            }
        }
    }
    hitObstacle(obstacle) {
        if (this.invulnerable > 0 && !this.powers.star) return;
        const x = this.course.screenX(obstacle.worldX, this.distance);
        const box = this.course.bounds(obstacle, this.distance), body = this.character.getBounds();
        const contactX = Math.max(box.x, Math.min(body.x + body.width, box.x + box.width));
        const contactY = Math.max(box.y, Math.min(body.y + body.height * .6, box.y + box.height));
        obstacle.hit = true;
        if (obstacle.tutorial || obstacle.beatId === this.course.beats?.[0].id) this.firstCleared = true;
        if (this.powers.star > 0 || this.powers.shield > 0) {
            if (!this.powers.star) { this.powers.shield = 0; this.invulnerable = 1; this.notify('Shield saved you. Keep chasing!'); }
            else {
                this.smashes++; if (this.runContext?.kind !== 'practice') this.score += 75;
                if (obstacle.smash) { if (!this.course.recovery) this.notify(`${this.course.journey.signature} smash!`); this.audio.play('stampede'); }
                this.burst(x, 510, '#FFDA72', 5, '+75');
            }
            this.character.react?.('impact');
            this.fractures ||= [];
            this.fractures.push({ type: obstacle.mechanism === 'piston' ? 'piston' : obstacle.type, x: contactX, y: contactY, groundY: obstacle.baseY || 600,
                age: 0, duration: 1.05, seed: Math.round(obstacle.originX || obstacle.worldX),
                width: obstacle.width, height: obstacle.height, centerOffset: x - contactX, speed: this.gameSpeed * 60 });
            if (this.fractures.length > 18) this.fractures.splice(0, this.fractures.length - 18);
            this.audio.play('break', obstacle.mechanism === 'piston' ? 'piston' : obstacle.type);
            return;
        }
        if (obstacle.tutorial) { this.firstCleared = true; this.recordFailure(obstacle); this.notify(`${this.lastFailure.message} No heart lost.`, true); return; }
        this.recordFailure(obstacle);
        if (!this.forgivingExplorer) this.hearts--;
        this.damage++; this.invulnerable = 1.6; this.combo = 0; this.comboTime = 0; this.multiplier = 1;
        if (this.course.version === 3) { this.flow.phrase = 0; this.flow.idle = 0; this.flow.lastEvent = 'Phrase reset'; }
        this.shake = 0; this.character.react?.('bump');
        if (this.hearts <= 0) this.audio.stop?.();
        this.audio.play('hit'); this.burst(x, 555, '#D2A48B', 13);
        if (this.hearts <= 0) { this.state = this.runContext?.kind === 'practice' ? 'PRACTICE_GAME_OVER' : 'GAME_OVER'; this.ui?.syncState(); }
        else this.notify(this.forgivingExplorer ? `Keep going. ${this.lastFailure.message}` : this.lastFailure.message, true);
    }
    recordFailure(obstacle) {
        if (this.powers.star > 0 || this.powers.shield > 0) return;
        let diagnosis = 'no-jump', contact = 'ground', message = 'That obstacle needs a jump. Watch its approach marker.';
        if (this.course.recovery) message = 'Leap over the next obstacle.';
        if (this.character.isJumping) {
            if (this.character.velocityY < 0) { diagnosis = 'late-takeoff'; contact = 'rising'; message = 'You met it while rising. Take off sooner.'; }
            else { diagnosis = 'early-takeoff'; contact = 'landing'; message = 'You landed on it. Take off a little closer.'; }
        }
        const practice = this.course?.practiceForDistance?.(this.distance);
        this.lastFailure = { beatId: obstacle.beatId || this.course?.beatAt?.(this.distance)?.beatId || null, obstacleId: obstacle.type, practiceId: practice?.id || null,
            takeoff: this.lastTakeoff ? { ...this.lastTakeoff } : null, contact, diagnosis, message };
    }
    addFlow(event) {
        if (this.course?.version !== 3) return;
        this.flow.phrase++; this.flow.total++; this.flow.idle = 0; this.flow.lastEvent = event;
        if (this.runContext?.resultVersion !== 4) this.notify(`On a roll · ${event}`);
        this.audio.play('flow');
    }
    proudMoment() {
        if (this.course.recovery && this.smashes > 0) return {
            texas: 'You sent the tumbleweeds tumbling.', alpine: 'You burst through the powder.',
            coast: 'You scattered the driftwood.', forest: 'You bounded through the fallen branches.',
            ember: 'You broke through the crystal glow.'
        }[this.course.track.id];
        if (this.smashes > 0) return this.course.track.id === 'texas' ? 'You led the Super Paws stampede through the fence line.' : `You powered through the ${this.course.journey.signature.toLowerCase()}.`;
        if (this.souvenirs > 0) return `You brought home ${this.souvenirs === 1 ? 'a rosette' : `${this.souvenirs} rosettes`}.`;
        if (this.flow.total >= 2) return `You found a confident rhythm across ${this.course.track.name}.`;
        return `${this.character.asset.displayName || this.character.asset.assetId} made it home.`;
    }
    nextGoal() {
        if (this.state === 'GAME_OVER') return { kind: 'retry', label: 'Try the full trail again with that obstacle in view.', practiceId: this.lastFailure?.practiceId || null };
        const treatTarget = Math.ceil(this.course.totalTreats * .6);
        if (this.treats < treatTarget) return { kind: 'treat-star', label: `Find ${Math.max(1, treatTarget - this.treats)} more treats for your next star.` };
        if (this.damage > 0) return { kind: 'clean-star', label: 'Finish without a damaging bump for your clean-run star.' };
        if (this.souvenirs < 3) return { kind: 'rosette', label: this.course.recovery ? 'Follow the high treats to find another rosette.' : this.course.track.id === 'texas' ? 'Take the high canyon line for another rosette.' : `Find another ${this.course.journey.souvenir.toLowerCase()}.` };
        const comparable = this.previousRecord?.courseLayoutId === this.course.layoutId
            && this.previousRecord?.capabilityProfile === this.runContext.capabilityProfile
            && this.previousRecord?.sections?.length === this.sectionScores.length;
        if (comparable) {
            const weakest = this.sectionScores.map((score, index) => ({ score, index, delta: score - this.previousRecord.sections[index] })).sort((a,b) => a.delta - b.delta)[0];
            if (weakest?.delta < 0) return { kind: 'cleaner-section', label: `Make ${this.course.sections[weakest.index].name} cleaner.` };
        }
        if (this.course.version === 3 && this.flow.total < 2) return { kind: 'flow', label: 'Carry a stronger Flow phrase through the next section.' };
        return { kind: 'favorite', label: 'Run your favorite trail again.' };
    }
    finish() {
        if (this.state !== 'PLAYING') return;
        this.distance = this.runContext.endX;
        if (this.runContext.kind === 'practice') {
            this.state = 'PRACTICE_COMPLETE'; this.audio.stop?.(); this.audio.play('finish'); this.ui?.syncState(); return;
        }
        this.score += 500;
        this.sectionScores.push(Math.floor(this.score - this.sectionStartScore));
        this.result = { version: this.runContext.resultVersion, rulesId: this.runContext.rulesId, courseVersion: this.course.version, damage: this.damage, courseLayoutId: this.course.layoutId, capabilityProfile: this.runContext.capabilityProfile, control: 'fixed', souvenirs: this.souvenirs, sections: this.sectionScores, stars: 1 + Number(this.treats >= Math.ceil(this.course.totalTreats * .6)) + Number(this.damage === 0), score: Math.floor(this.score), time: this.playTime, wallTime: this.wallTime, proudMoment: this.proudMoment() };
        const recordWrite = Storage.saveCourse(this.course.track.id, this.runContext.difficulty, this.result);
        this.finishPhoto = FinishPhoto.capture(this);
        this.finishPhotoSaved = Storage.saveFinishPhoto(this.finishPhoto);
        this.persistence = { recordSaved: Boolean(recordWrite?.saved), photoSaved: this.finishPhotoSaved };
        this.state = 'COMPLETE'; this.audio.stop?.(); this.audio.play('finish');
        if (this.runContext.resultVersion !== 4) this.result.nextGoal = this.nextGoal();
        if (!this.reducedMotion && !this.lowQuality) for (let i = 0; i < 60; i++) this.effects.push({ x: 380 + Math.random() * 850, y: 20 + Math.random() * 200,
            vx: (Math.random() - .5) * 180, vy: Math.random() * 80, life: 3.5, maxLife: 3.5, color: ['#EDC86B','#95B9A1','#E6B596','#ECF0D9'][i % 4], confetti: true });
        this.ui?.syncState();
    }
    // Higher-priority information survives collection and Flow. Equal priority may refresh.
    // Recovery/first teaching 100; expiry 90; power 80; local encounter 70; launch feedback 60; scenery 20.
    notify(message, teaching = false) {
        const policy = typeof teaching === 'object' ? teaching : { priority: teaching ? 100 : 20, duration: 2.7 };
        const priority = policy.priority ?? 20;
        if (this.toastTime > 0 && this.toastPriority > priority) return;
        this.toast = message; this.toastTime = policy.duration ?? 2.7; this.toastPriority = priority;
        if (teaching === true) this.teachingTime = this.toastTime;
    }
    encounterHint() {
        if (!this.course || this.state !== 'PLAYING') return '';
        const dynamic = this.course.dynamic && this.course.obstacles.find(o => !o.hit && !o.passed && o.worldX > this.distance - 40 && o.worldX - this.distance < this.gameSpeed * 60 * 2.7);
        if (dynamic?.mechanism && !dynamic.smash) {
            const hints = {
                piston: 'Pumping gate · one leap clears its full stroke.',
                'snowball-growth': 'Gathering snowball · leap across its rolling path.',
                'avalanche-bank': 'Snow front ahead · leap the low bank.',
                'crab-dash': dynamic.warning ? 'Crab crouching · it is about to scuttle.' : 'Crab crossing · leap the marked sand.',
                surf: dynamic.warning ? 'Water drawing back · a solid crest is coming.' : dynamic.active === false ? 'Low foam is safe · watch for the next crest.' : 'Solid blue crest · leap over the surf.',
                'tidal-drift': 'Floating timber · leap across the moving log.',
                'falling-log': dynamic.warning ? 'Rustling overhead · a log will fall on the marked spot.' : 'Fallen timber · leap the log.',
                'pressure-crystal': dynamic.warning ? 'Pressure rising · leap before the crystal grows.' : dynamic.active === false ? 'Outlined vent · safe to pass.' : 'Solid crystal · leap over it.'
            };
            if (hints[dynamic.mechanism]) return hints[dynamic.mechanism];
        }
        const speed = this.gameSpeed * 60, pipes = this.course.platforms || [];
        if (pipes.length && this.distance >= pipes[0].worldStart - speed * 1.7 && this.distance < pipes[1].worldEnd) {
            if (this.distance <= pipes[0].worldEnd && this.character.y <= pipes[0].y + 12)
                return this.course.track.id === 'forest' ? 'Canopy gap · leap near the branch edge. The forest floor is safe.' : 'Pipe gap ahead · leap near the edge. The ground below is safe.';
            if (this.distance > pipes[0].worldEnd && this.character.y > pipes[0].y + 12)
                return 'Safe landing below · keep going along the trail.';
        }
        const spring = this.course.surfaces.find(s => !s.used && !s.photo && s.worldX > this.distance && s.worldX - this.distance < speed * 2.3);
        if (spring) return 'Spring ahead · stay grounded for an automatic launch.';
        const power = this.course.pickups.find(p => p.type === 'star' && !p.collected && !p.missed && p.worldX > this.distance && p.worldX - this.distance < speed * 2.7);
        if (power) return 'Super Paws ahead · stay grounded to collect protection.';
        const next = this.course.obstacles.find(o => !o.hit && !o.passed && o.worldX > this.distance - 50);
        if (next && next.worldX - this.distance < speed * 2.3) {
            if (next.smash) return this.powers.star > 0 ? 'Super Paws active · run through the marked obstacles.' : 'No protection · leap over each marked obstacle.';
            if (next.motion === 'phase') return next.warning ? 'Crystal returning · leap over it.' : next.active === false ? 'Outlined crystal · safe to pass.' : 'Solid crystal · press once to leap.';
            if (this.course.track.id === 'coast' && next.beatId === 'tide-combination')
                return next.type === 'crab' ? 'Crab, then driftwood · leap, land, leap again.' : 'Driftwood ahead · one more leap after landing.';
        }
        return '';
    }
    guidance() {
        if (this.course?.recovery) {
            return this.toastTime > 0 ? { message: this.toast, priority: this.toastPriority } : { message: '', priority: 0 };
        }
        const local = this.encounterHint();
        if (this.toastTime > 0 && (this.toastPriority >= 80 || !local)) return { message: this.toast, priority: this.toastPriority };
        return { message: local, priority: local ? 70 : 0 };
    }
    burst(x, y, color, count, label) {
        if (label && !this.reducedMotion && !this.lowQuality && this.runContext?.resultVersion !== 4) this.effects.push({ x, y, vx: 0, vy: -42, life: .7, maxLife: .7, color: '#3C604A', label });
        if (this.reducedMotion || this.lowQuality) return;
        count = Math.min(count, Math.max(0, 180 - this.effects.length));
        for (let i = 0; i < count; i++) this.effects.push({ x, y, vx: (Math.random() - .5) * 190, vy: -Math.random() * 140,
            life: .4 + Math.random() * .3, maxLife: .7, color });
    }
    updateEffects(dt, travel = 0) {
        this.fractures = (this.fractures || []).filter(event => { event.age += dt; event.x -= travel; return event.age < event.duration; });
        this.effects = this.effects.filter(p => {
            p.life -= dt; p.x += p.vx * dt - (p.confetti || p.label ? 0 : travel * .3); p.y += p.vy * dt;
            if (!p.label) p.vy += dt * 220;
            return p.life > 0;
        });
    }
    render() {
        if (!this.character) return;
        const ctx = this.ctx;
        // Composition is a pure function of viewport and menu/run mode. Never follow
        // jump height, velocity, boosts, beats, impacts or recovery with the camera.
        const rect = this.canvas.getBoundingClientRect();
        const aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
        this.portrait = aspect < 1;
        const menu = this.state === 'START';
        const viewWidth = menu ? 1600 : this.portrait ? 900 : this.course?.recovery ? Math.max(1200, 820 * aspect) : Math.max(1400, 900 * aspect);
        const viewHeight = viewWidth / aspect;
        const backingWidth = Math.min(this.lowQuality ? 1000 : 1600,Math.max(640,Math.round(rect.width*(window.devicePixelRatio||1))));
        const backingHeight = Math.round(backingWidth * rect.height / Math.max(1, rect.width));
        if (this.canvas.width !== backingWidth) this.canvas.width = backingWidth;
        if (this.canvas.height !== backingHeight) this.canvas.height = backingHeight;
        ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        ctx.scale(backingWidth/viewWidth,backingWidth/viewWidth);
        // Taller authored launches get air space from a fixed lower ground line,
        // without shrinking the dog or moving the camera during the leap.
        const tallTraversal = this.course?.layoutId?.endsWith('-recovery-3');
        const groundFraction = menu ? .72 : tallTraversal && !this.portrait ? .88 : .82;
        this.cameraGroundFraction = groundFraction;
        this.camera = { viewWidth, viewHeight, groundFraction, groundScreenY: rect.height * groundFraction,
            scale: rect.width / viewWidth, dogScreenX: this.character.x * rect.width / viewWidth };
        this.background.skyTop = Math.min(0,600 - viewHeight * groundFraction);
        ctx.translate(0, viewHeight * groundFraction - 600);
        this.viewWidth = viewWidth; this.background.viewWidth = viewWidth;
        this.background.reducedMotion = this.reducedMotion; this.background.lowQuality = this.lowQuality;
        this.background.recovery = this.state !== 'START' && Boolean(this.course?.recovery);
        this.background.journeyProgress = this.course ? Math.min(1, this.distance / this.course.length) : 0;
        if (this.state === 'START') {
            ctx.fillStyle=TRACKS[this.selectedTrackIndex].ground[1];ctx.fillRect(0,-2000,2000,viewHeight+3000);
            this.background.draw(ctx, TRACKS[this.selectedTrackIndex], 0, this.menuTime / 1000);
            // The partner is part of the destination illustration, at the same paw pivot.
            const narrow = this.canvas.clientWidth / this.canvas.clientHeight < 1.3;
            const heroX = narrow ? 900 : 1150, heroY = 600, heroSize = narrow ? 500 : 460;
            {
                Art.ellipse(ctx, heroX + 10, heroY + 3, heroSize * .3, heroSize * .033, '#40332220');
                Character.drawPose(ctx, this.character.asset, 'idle', this.menuTime, heroX, heroY, heroSize);
            }
            this.ui.drawCompanions();
            return;
        }
        if (!this.course) return;
        ctx.save();
        // Impacts stay local: the stage and ground never shake.
        ctx.fillStyle=this.course.track.sky[0]; ctx.fillRect(0,-2000,viewWidth,2600);
        ctx.fillStyle=this.course.track.ground[1]; ctx.fillRect(0,600,viewWidth,Math.max(2000,viewHeight));
        this.background.draw(ctx);
        Art.destinationEvent?.(ctx, this.course, this.distance, this.playTime, this.viewWidth, this.reducedMotion || this.lowQuality);
        this.drawFinish(ctx);
        for (const landmark of this.course.landmarks || []) {
            const x = this.course.screenX(landmark.worldX, this.distance);
            if (x > -260 && x < this.viewWidth + 260) Art.texasLandmark?.(ctx, landmark.style, x, 600, this.course.recovery);
        }
        for (const pickup of this.course.powerMoments || []) {
            if (pickup.collected) continue;
            const x = this.course.screenX(pickup.worldX, this.distance);
            if (!this.course.recovery && x > -180 && x < this.viewWidth + 180) Art.stampedeSign?.(ctx, x - 112, 600, pickup.powerCue);
        }
        for (const gate of this.course.routeGates || []) {
            const x = this.course.screenX(gate.worldX, this.distance);
            if (!this.course.recovery && x > -90 && x < this.viewWidth + 90 && !gate.rejoined) {
                ctx.save();ctx.strokeStyle='#F7D88B';ctx.lineWidth=3;ctx.setLineDash([7,6]);
                ctx.beginPath();ctx.moveTo(x-28,592);ctx.lineTo(x+48,465);ctx.stroke();ctx.setLineDash([]);
                ctx.fillStyle='#744B3A';ctx.font='600 16px system-ui';ctx.textAlign='center';ctx.fillText(gate.selected?'REJOIN':'HIGH',x+32,452);ctx.restore();
            }
        }
        for (const platform of this.course.platforms || []) {
            const start = this.course.screenX(platform.worldStart, this.distance), end = this.course.screenX(platform.worldEnd, this.distance);
            if (end > -180 && start < this.viewWidth + 180) Art.platform?.(ctx,start,end,platform.y,platform.style,platform.segmentIndex,this.playTime, this.reducedMotion || this.lowQuality, this.course.recovery);
        }
        for (const surface of this.course.surfaces) {
            const x = this.course.screenX(surface.worldX, this.distance);
            if (x > -150 && x < this.viewWidth + 120) Art.launch?.(ctx,x,600,surface.width,surface.kind,!surface.used,surface, this.course.recovery);
        }
        for (const obstacle of this.course.obstacles) {
            const x = this.course.screenX(obstacle.worldX, this.distance);
            if (!obstacle.hit && x > -120 && x < this.viewWidth + 120) {
                ctx.save();
                // A visible descending snowball is physically above the lane,
                // not a ghost/disabled crystal. Keep the same sphere legible.
                if (obstacle.active === false && obstacle.mechanism !== 'mountain-snowball') ctx.globalAlpha = .22;
                Art.obstacle(ctx, obstacle.mechanism === 'piston' ? 'piston' : obstacle.type, x, obstacle.baseY || 600, obstacle.width, obstacle.height, this.playTime, obstacle.rotation);
                ctx.restore();
                Art.dynamicCue?.(ctx, obstacle, x, obstacle.baseY || 600, this.playTime, this.course.recovery);
                if (!this.course.recovery && obstacle.motion === 'phase') Art.phaseCue?.(ctx,x,600,obstacle.width,obstacle.height,obstacle.active,obstacle.warning);
                if (!this.course.recovery && (obstacle.motion === 'roll' || obstacle.motion === 'patrol')) {
                    ctx.strokeStyle = '#704A37'; ctx.lineWidth=3; ctx.setLineDash([8,8]);
                    ctx.beginPath(); ctx.moveTo(x-130,608);ctx.lineTo(x+80,608);ctx.stroke();ctx.setLineDash([]);
                }
                if (obstacle.smash && !this.course.recovery) Art.stampedeFenceCue?.(ctx,x,600,obstacle.width,obstacle.height,this.powers.star > 0);
            }
        }
        // Rare rewards stay legible where a treat arc overlaps their silhouette.
        for (let layer = 0; layer < (this.course.recovery ? 2 : 1); layer++) for (const pickup of this.course.pickups) {
            if (this.course.recovery && Number(pickup.type === 'souvenir') !== layer) continue;
            const x = this.course.screenX(pickup.worldX, this.distance);
            if (pickup.collected || x < -50 || x > this.viewWidth + 60) continue;
            const bob = this.reducedMotion ? 0 : Math.sin(this.playTime * 3 + pickup.worldX / 100) * 3;
            if (pickup.type === 'treat') {
                Art.ellipse(ctx, x, pickup.y + bob, 22, 22, '#D59E4666');
                Art.ellipse(ctx, x, pickup.y + bob - 1, 19, 19, '#F1CB75');
                Art.bone(ctx, x, pickup.y + bob - 1, 15);
            } else if (pickup.type === 'souvenir') Art.souvenir?.(ctx,x,pickup.y+ bob,28,this.course.track.id,this.reducedMotion ? 0 : this.playTime,this.course.recovery);
            else Art.power(ctx, pickup.type, x, pickup.y + bob, 29, this.reducedMotion ? 0 : this.playTime);
        }
        for (const event of this.fractures || []) Art.fracture?.(ctx, event, this.reducedMotion || this.lowQuality);
        const alpha = this.state === 'PLAYING' ? this.accumulator / CONFIG.PHYSICS.FIXED_STEP : 1;
        const dogY = this.character.previousY + (this.character.y - this.character.previousY) * alpha;
        if (this.powers.shield || this.powers.star) {
            const focus = this.character.getFocusPoint(); focus.y += dogY - this.character.y;
            const color = this.powers.star ? '#FFF0A0' : '#8EE0E8';
            ctx.save(); ctx.globalAlpha = .65; ctx.strokeStyle = color; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(focus.x + 6, focus.y - 5, 105, 76, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = .12;
            ctx.fillStyle = color; ctx.fill(); ctx.restore();
        }
        if (this.powers.star && !this.reducedMotion) {
            const focus = this.character.getFocusPoint(); focus.y += dogY - this.character.y;
            for (let i = 0; i < 6; i++) Art.star(ctx, focus.x - 110 - i * 17, focus.y + 18 + Math.sin(this.playTime * 7 + i) * 30, 3 + i % 3, '#FFE9A0');
        }
        ctx.save();
        if (this.invulnerable > 0 && !this.reducedMotion) ctx.globalAlpha = .6 + Math.sin(this.playTime * 25) * .25;
        this.character.draw(ctx, alpha); ctx.restore();
        for (const p of this.effects) {
            ctx.save(); ctx.globalAlpha = Math.min(1, p.life / Math.min(.3, p.maxLife));
            if (p.label) { ctx.fillStyle = p.color; ctx.font = '600 20px system-ui'; ctx.textAlign = 'center'; ctx.fillText(p.label, p.x, p.y); }
            else if (p.confetti) { ctx.translate(p.x, p.y); ctx.rotate(p.life * 3); ctx.fillStyle = p.color; ctx.fillRect(-4, -2, 8, 5); }
            else Art.ellipse(ctx, p.x, p.y, 3, 3, p.color);
            ctx.restore();
        }
        ctx.restore();
    }
    drawFinish(ctx) {
        const x = this.course.screenX(this.course.length, this.distance);
        if (x > this.viewWidth + 150) return;
        Art.finishGate?.(ctx,x,600,this.course.track.accent);
    }
}
window.addEventListener('load', () => { window.barkourGame = new Game(); });
