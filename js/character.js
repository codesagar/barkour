// World position is the shared paw/root pivot, never the changing opaque silhouette.
// The fallbacks keep isolated legacy test harnesses readable; index.html loads the
// manifest first, so production always uses the declared canonical contract.
const characterContract = () => typeof EQUAL_PET_GAMEPLAY_BODY !== 'undefined' ? EQUAL_PET_GAMEPLAY_BODY : {
    frameSize: { w: 512, h: 512 }, pawRoot: { x: 256, y: 456 }, bounds: { x: 150, y: 210, w: 220, h: 230 }
};
const characterPresentation = asset => typeof PetManifest !== 'undefined' ? PetManifest.presentationFor(asset) : asset;
const normalizeCharacterAsset = (asset, fallback) => typeof PetManifest !== 'undefined' ? PetManifest.normalize(asset, fallback) : asset;
class Character {
    constructor(asset, x, groundY = CONFIG.GROUND.Y_POSITION) {
        const buddy = typeof CHARACTER_ASSETS !== 'undefined' ? CHARACTER_ASSETS.find(pack => pack.assetId === 'buddy') : asset;
        this.asset = normalizeCharacterAsset(asset, buddy);
        if (!this.asset) throw new Error('No valid pet presentation asset');
        this.x = x;
        this.groundY = groundY;
        this.size = CONFIG.CHARACTER.DISPLAY_SIZE;
        this.reset();
    }

    setAsset(asset) {
        // Invalid presentation metadata is a cosmetic failure, never a gameplay
        // failure. Game selects a known Buddy fallback before reaching here.
        this.asset = normalizeCharacterAsset(asset, this.asset);
        this.reset();
    }

    setState(state) {
        if (this.animationState === state) return;
        this.animationState = state;
        this.animationTime = 0;
    }

    stateDuration(state) {
        const definition = this.asset.states[state];
        const clip = this.asset.animations[definition.animation];
        return definition.frames.reduce((sum, frame) => sum + clip.durationsMs[frame], 0);
    }

    jump(mode = 'full') {
        // A late press just before touching down is consumed on contact.
        if (this.isJumping) {
            this.jumpBuffer = CONFIG.PHYSICS.JUMP_BUFFER_MS / 1000;
            this.bufferMode = mode;
            return;
        }
        this.velocityY = mode === 'hop' ? -640 : CONFIG.PHYSICS.JUMP_VELOCITY;
        this.released = mode === 'hop'; this.automaticLaunch = false;
        this.isJumping = true;
        this.jumpBuffer = 0;
        this.setState('takeoff');
    }

    releaseJump() {
        if (this.jumpBuffer > 0) this.bufferMode = 'hop';
        if (!this.automaticLaunch && this.isJumping && this.velocityY < -640) this.velocityY = -640;
        this.released = true;
    }

    // Presentation reactions never alter the shared collision body or physics.
    react(kind) {
        this.reaction = kind;
        this.reactionTime = { bump: .30, impact: .16, compress: .12, launch: .15, finish: 1.2 }[kind] || .18;
    }

    update(dt, gameSpeed = 0) {
        this.reactionTime = Math.max(0, (this.reactionTime || 0) - dt);
        this.previousY = this.y;
        this.animationTime += dt * 1000 * (this.animationState === 'run'
            ? Math.max(0.8, Math.min(1.65, gameSpeed / 6 * (this.powered ? 1.12 : 1))) : 1);
        this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
        this.dust = this.dust.filter(particle => {
            particle.life -= dt;
            particle.x -= gameSpeed * 60 * dt * 0.6;
            particle.y -= dt * 15;
            return particle.life > 0;
        });

        if (this.isJumping) {
            const previousVelocity = this.velocityY;
            this.velocityY = Math.min(CONFIG.PHYSICS.MAX_FALL_SPEED,
                this.velocityY + CONFIG.PHYSICS.GRAVITY * dt);
            this.y += (previousVelocity + this.velocityY) * 0.5 * dt;

            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.velocityY = 0;
                this.isJumping = false;
                this.setState('land');
                this.dust = (this.reducedMotion ? [] : [-28, 10, 36]).map(offset => ({
                    x: this.x + offset, y: this.groundY - 3, life: 0.28
                }));
                if (this.jumpBuffer > 0) this.jump(this.bufferMode);
            } else if (this.animationState !== 'takeoff' ||
                       this.animationTime >= this.stateDuration('takeoff')) {
                this.setState(Math.abs(this.velocityY) < CONFIG.PHYSICS.APEX_SPEED
                    ? 'apex' : this.velocityY < 0 ? 'rise' : 'fall');
            }
        } else if (this.animationState !== 'land' ||
                   this.animationTime >= this.stateDuration('land')) {
            this.setState(gameSpeed > 0 ? 'run' : 'idle');
        }
    }

    static frameAt(asset, state, elapsed) {
        const definition = asset.states[state];
        const clip = asset.animations[definition.animation];
        const duration = definition.frames.reduce((sum, index) => sum + clip.durationsMs[index], 0);
        let time = definition.loop ? elapsed % duration : Math.min(elapsed, duration - 0.001);
        for (const frame of definition.frames) {
            if (time < clip.durationsMs[frame]) return frame;
            time -= clip.durationsMs[frame];
        }
        return definition.frames[definition.frames.length - 1];
    }

    static drawPose(ctx, asset, state, elapsed, x, y, size) {
        const clip = asset.animations[asset.states[state].animation];
        const frame = Character.frameAt(asset, state, elapsed);
        Character.drawFrame(ctx, asset, clip, frame, x, y, size);
    }

    static drawFrame(ctx, asset, clip, frame, x, y, size) {
        const { w, h } = asset.frameSize;
        const presentation = characterPresentation(asset);
        const sourceScale = size / w;
        const scale = sourceScale * presentation.presentation.scale;
        const pawRoot = asset.pawRoot || presentation.pawRoot;
        const baselineOffset = presentation.presentation.baselineOffset * sourceScale;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const sheetScale = clip.sheetScale || 1;
        ctx.drawImage(clip.image, (frame % clip.columns) * w * sheetScale,
            Math.floor(frame / clip.columns) * h * sheetScale, w * sheetScale, h * sheetScale,
            x - pawRoot.x * scale, y - pawRoot.y * scale + baselineOffset, w * scale, h * scale);
        // Preserve the original expression; facial attachments failed visual review.
        ctx.restore();
    }

    draw(ctx, alpha = 1) {
        const y = this.previousY + (this.y - this.previousY) * alpha;
        const height = Math.max(0, this.groundY - y);
        const proximity = Math.max(0.25, 1 - height / 280);
        ctx.save();
        ctx.fillStyle = `rgba(35, 38, 25, ${0.2 * proximity})`;
        ctx.beginPath();
        ctx.ellipse(this.x + 5, this.groundY + 3, 57 * proximity, 7 * proximity, 0, 0, Math.PI * 2);
        ctx.fill();
        for (const particle of this.dust) {
            ctx.fillStyle = this.terrainColor || '#B39A7188';
            ctx.beginPath();
            ctx.ellipse(particle.x, particle.y, 12 * (1 - particle.life), 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        let state = this.animationState, elapsed = this.animationTime;
        if (this.reactionTime > 0) {
            if (this.reaction === 'compress' || this.reaction === 'bump') { state = 'land'; elapsed = 65; }
            else if (this.reaction === 'launch') { state = 'takeoff'; elapsed = 65; }
            else if (this.reaction === 'impact' && !this.isJumping) { state = 'run'; elapsed = 100; }
            else if (this.reaction === 'finish') { state = 'idle'; elapsed = (1.2 - this.reactionTime) * 1000; }
        }
        Character.drawPose(ctx, this.asset, state, elapsed, this.x, y, this.size);
    }

    getBounds() {
        // Collision and reach are permanently tied to the canonical equal-pet
        // body. No visual scale, crop, ears, tail, or fluff can alter physics.
        const body = characterContract(), scale = this.size / body.frameSize.w;
        const box = body.bounds;
        return {
            x: this.x + (box.x - body.pawRoot.x) * scale,
            y: this.y + (box.y - body.pawRoot.y) * scale,
            width: box.w * scale,
            height: box.h * scale
        };
    }

    getVisualBounds() {
        const presentation = characterPresentation(this.asset);
        const sourceScale = this.size / this.asset.frameSize.w;
        const scale = sourceScale * presentation.presentation.scale;
        const root = this.asset.pawRoot || presentation.pawRoot;
        const bounds = presentation.visualBounds;
        return {
            x: this.x + (bounds.x - root.x) * scale,
            y: this.y + (bounds.y - root.y) * scale + presentation.presentation.baselineOffset * sourceScale,
            width: bounds.w * scale,
            height: bounds.h * scale
        };
    }

    getFocusPoint() {
        const presentation = characterPresentation(this.asset);
        const sourceScale = this.size / this.asset.frameSize.w;
        const scale = sourceScale * presentation.presentation.scale;
        const root = this.asset.pawRoot || presentation.pawRoot;
        return { x: this.x + (presentation.focusPoint.x - root.x) * scale,
            y: this.y + (presentation.focusPoint.y - root.y) * scale + presentation.presentation.baselineOffset * sourceScale };
    }

    reset() {
        this.y = this.groundY;
        this.previousY = this.y;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpBuffer = 0; this.bufferMode = 'full'; this.released = false;
        this.reaction = ''; this.reactionTime = 0; this.powered = false;
        this.animationState = 'idle';
        this.animationTime = 0;
        this.dust = [];
    }
}
