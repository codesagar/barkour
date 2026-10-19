// Original procedural score and foley. No downloads, timers, or sound before a gesture.
class GameAudio {
    constructor() {
        this.enabled = Storage.read('barkour_sound', true);
        this.context = null; this.voices = new Set(); this.noiseBuffer = null;
        this.lastImpactAt = -Infinity; this.lastEventAt = -Infinity;
        this.trackId = 'texas'; this.beatClock = 0; this.beat = 0;
        this.ambientClock = 0; this.stepDistance = 0; this.wasGrounded = true;
        // One shared pentatonic melody, with distinct registers, envelopes and material beds.
        this.themes = {
            texas: { root: 196, wave: 'triangle', decay: .30, tempo: .40, air: 650, step: 850, pitch: 105 },
            alpine: { root: 261.63, wave: 'sine', decay: .60, tempo: .48, air: 1700, step: 2100, pitch: 150 },
            coast: { root: 220, wave: 'sine', decay: .46, tempo: .44, air: 500, step: 580, pitch: 92 },
            forest: { root: 174.61, wave: 'triangle', decay: .23, tempo: .43, air: 1100, step: 1350, pitch: 120 },
            ember: { root: 164.81, wave: 'sine', decay: .65, tempo: .46, air: 300, step: 2600, pitch: 175 }
        };
    }
    unlock() {
        if (!this.enabled) return;
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        try {
            if (!this.context) {
                this.context = new Audio();
                this.master = this.context.createGain();
                this.master.gain.value = .65;
                // A soft bus limiter catches coincident landings, fractures and
                // score notes without changing the deterministic event schedule.
                if (this.context.createDynamicsCompressor) {
                    this.limiter = this.context.createDynamicsCompressor();
                    this.limiter.threshold.value = -10; this.limiter.knee.value = 18;
                    this.limiter.ratio.value = 5; this.limiter.attack.value = .005; this.limiter.release.value = .12;
                    this.master.connect(this.limiter); this.limiter.connect(this.context.destination);
                } else this.master.connect(this.context.destination);
            }
            this.context.resume().catch(() => {});
        } catch (_) { /* Audio is optional, including on restrictive browsers. */ }
    }
    toggle() {
        this.enabled = !this.enabled; Storage.write('barkour_sound', this.enabled);
        if (this.enabled) this.unlock();
        else this.pause();
    }
    ready() { return this.enabled && this.context?.state === 'running'; }
    register(source, nodes, end) {
        this.voices.add(source);
        source.onended = () => {
            this.voices.delete(source); source.disconnect();
            for (const node of nodes) node.disconnect();
        };
        source.stop(end);
    }
    tone(frequency, duration = .12, delay = 0, type = 'sine', volume = .045) {
        if (!this.ready() || this.voices.size >= 24) return;
        const at = this.context.currentTime + Math.max(0, delay);
        const length = Math.max(.035, duration);
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(volume, at + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, at + length);
        oscillator.connect(gain); gain.connect(this.master);
        oscillator.start(at);
        this.register(oscillator, [gain], at + length + .02);
    }
    noise(duration, cutoff, volume, delay = 0) {
        if (!this.ready() || this.voices.size >= 24) return;
        if (!this.noiseBuffer) {
            const count = this.context.sampleRate;
            this.noiseBuffer = this.context.createBuffer(1, count, count);
            const data = this.noiseBuffer.getChannelData(0);
            let seed = 314159;
            for (let i = 0; i < count; i++) {
                seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                data[i] = seed / 2147483648 - 1;
            }
        }
        const at = this.context.currentTime + delay;
        const source = this.context.createBufferSource();
        const filter = this.context.createBiquadFilter();
        const gain = this.context.createGain();
        source.buffer = this.noiseBuffer; source.loop = true;
        filter.type = 'lowpass'; filter.frequency.value = cutoff;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(volume, at + Math.min(.12, duration * .2));
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        source.connect(filter); filter.connect(gain); gain.connect(this.master);
        source.start(at);
        this.register(source, [filter, gain], at + duration + .02);
    }
    update(dt, trackId, sectionIndex = 0, grounded = true, speed = 0, flowPhrase = 0) {
        if (!this.ready() || !Number.isFinite(dt) || dt <= 0) return;
        dt = Math.min(dt, .1); // No burst of overdue sound after a stalled/suspended tab.
        if (this.trackId !== trackId) {
            this.stop(); this.trackId = this.themes[trackId] ? trackId : 'texas';
        }
        const theme = this.themes[this.trackId];
        this.beatClock -= dt; this.ambientClock -= dt;
        if (this.beatClock <= 0) {
            // Eight bars: statement, answer, breath, home. Space leaves event cues readable.
            const melody = [0, 7, 12, null, 9, 7, 4, null, 2, 7, 9, null, 7, 4, 0, null,
                0, 4, 7, null, 12, 9, 7, null, 4, 2, 0, null, null, null, 7, null];
            const index = this.beat % melody.length;
            const note = melody[index];
            // Texas v3 has ten authored beats; finale harmony belongs to
            // Golden Arch (index 9), after the bridge and stampede peak.
            const finale = this.trackId === 'texas' ? sectionIndex >= 9 : sectionIndex >= 6;
            const texasShowcase = this.trackId === 'texas' && sectionIndex >= 7;
            const flowing = flowPhrase > 0;
            if (note !== null) this.tone(theme.root * Math.pow(2, note / 12), theme.decay, 0, theme.wave, finale ? .026 : .020);
            if (this.beat % 8 === 0) {
                const bass = this.beat % 32 < 16 ? theme.root / 2 : theme.root * .75;
                this.tone(bass, .7, 0, 'sine', .019);
                if (finale) this.tone(bass * 3, .55, .03, 'sine', .012);
            }
            // One quiet answer voice makes a successful phrase feel lifted without adding a control.
            if ((texasShowcase || sectionIndex >= 5) && flowing && this.beat % 4 === 0)
                this.tone(theme.root * 2.5, .18, .035, 'sine', .011);
            this.beat++; this.beatClock += theme.tempo * (finale ? .88 : 1);
        }
        if (this.ambientClock <= 0) {
            this.noise(1.8, theme.air, this.trackId === 'coast' ? .019 : .009);
            if (this.trackId === 'forest') {
                this.tone(1550, .09, .7, 'sine', .004);
                this.tone(1850, .1, .83, 'sine', .003);
            }
            this.ambientClock = this.trackId === 'coast' ? 3.2 : 5.5;
        }
        if (grounded && !this.wasGrounded) {
            this.noise(.16, theme.step, .055);
            this.tone(theme.pitch * .65, .12, 0, 'sine', .027);
            this.stepDistance = 0;
        } else if (grounded && speed > 0) {
            this.stepDistance += speed * dt;
            if (this.stepDistance >= 125) {
                this.stepDistance %= 125;
                this.noise(.055, theme.step, .023);
                this.tone(theme.pitch, .045, 0, 'sine', .009);
            }
        }
        this.wasGrounded = grounded;
    }
    pause() {
        this.stop();
        if (this.context && this.context.state === 'running') this.context.suspend().catch(() => {});
    }
    stop() {
        for (const voice of this.voices) {
            try { voice.stop(); voice.disconnect(); } catch (_) { /* Already ended. */ }
        }
        this.voices.clear();
        this.beatClock = 0; this.beat = 0; this.ambientClock = 0;
        this.stepDistance = 0; this.wasGrounded = true;
    }
    play(name, value = 1) {
        const theme = this.themes[this.trackId];
        if (name === 'jump') { this.tone(280, .10, 0, 'sine', .025); this.tone(420, .12, .045, 'sine', .02); }
        if (name === 'treat') this.tone(660 + Math.min(3, Number(value) || 1) * 110, .09, 0, 'sine', .024);
        if (name === 'power') [0, 4, 7, 12].forEach((n, i) => this.tone(theme.root * 2 * Math.pow(2, n / 12), .23, i * .07, 'triangle', .036));
        if (name === 'flow') this.tone(theme.root * 2.5, .16, 0, 'sine', .018);
        if (name === 'stampede') {
            this.noise(.11, 1250, .05);
            [0, 5, 9].forEach((n, i) => this.tone(theme.root * Math.pow(2, n / 12), .16, i * .045, 'triangle', .024));
        }
        if (name === 'hit') { this.noise(.15, 650, .055); this.tone(120, .22, 0, 'triangle', .045); }
        if (name === 'break') {
            if (!this.ready() || this.context.currentTime - this.lastImpactAt < .075) return;
            this.lastImpactAt = this.context.currentTime;
            const material = typeof value === 'string' ? value : '';
            if (['crystal', 'phaseCrystal'].includes(material)) {
                this.noise(.11, 2800, .045);
                [740, 1120, 1660].forEach((f, i) => this.tone(f, .22, i * .025, 'sine', .024));
            } else if (material === 'piston') {
                this.noise(.13, 1750, .046); this.tone(220, .15, 0, 'triangle', .028);
                this.tone(640, .2, .035, 'sine', .019);
            } else if (['basalt', 'emberstone', 'rock'].includes(material)) {
                this.noise(.16, 1500, .055); this.tone(92, .14, 0, 'triangle', .032);
                this.tone(165, .10, .06, 'sine', .019);
            } else if (material === 'wave') {
                this.noise(.30, 900, .075); this.tone(210, .08, 0, 'sine', .018);
            } else if (material === 'tumbleweed' || material === 'cactus') {
                this.noise(.20, 2400, .045); this.tone(190, .07, 0, 'triangle', .018);
            } else if (['snowpile', 'snowball', 'snowbank', 'pine'].includes(material)) {
                this.noise(.27, 1600, .08); this.tone(170, .09, 0, 'sine', .025);
            } else {
                this.noise(.14, 1000, .06);
                this.tone(150, .12, 0, 'triangle', .035); this.tone(210, .1, .045, 'triangle', .022);
            }
        }
        if (['piston', 'surf', 'avalanche', 'spring', 'eruption'].includes(name)) {
            if (!this.ready() || this.context.currentTime - this.lastEventAt < .25) return;
            this.lastEventAt = this.context.currentTime;
            if (name === 'spring') {this.tone(150,.12,0,'triangle',.032);this.tone(430,.18,.07,'sine',.025);}
            else if (name === 'piston') {this.noise(.2,750,.045);this.tone(110,.15,0,'triangle',.023);}
            else if (name === 'eruption') {this.noise(.32,350,.04);this.tone(85,.3,0,'sine',.026);}
            else this.noise(name === 'surf' ? .55 : .4,name === 'surf' ? 700 : 1600,.045);
        }
        if (name === 'expire') [7, 4, 0].forEach((n, i) => this.tone(theme.root * 2 * Math.pow(2, n / 12), .18, i * .13, 'sine', .036));
        if (name === 'finale') [0, 7, 12].forEach((n, i) => this.tone(theme.root * Math.pow(2, n / 12), .4, i * .18, theme.wave, .029));
        if (name === 'finish') {
            this.stop();
            [0, 4, 7, 12, 9, 12].forEach((n, i) => this.tone(theme.root * 2 * Math.pow(2, n / 12), .42, i * .13, theme.wave, .038));
            this.tone(theme.root, 1.2, .65, 'sine', .035);
        }
    }
}
