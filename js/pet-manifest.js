// Presentation metadata is deliberately separate from the one shared gameplay body.
// It is embedded so index.html continues to work when opened directly from disk.
const PET_MANIFEST_SCHEMA_VERSION = 1;
const EQUAL_PET_GAMEPLAY_BODY_ID = 'equal-pet-v1';
const EQUAL_PET_GAMEPLAY_BODY = Object.freeze({
    id: EQUAL_PET_GAMEPLAY_BODY_ID,
    frameSize: Object.freeze({ w: 512, h: 512 }),
    pawRoot: Object.freeze({ x: 256, y: 456 }),
    bounds: Object.freeze({ x: 150, y: 210, w: 220, h: 230 })
});

const PET_PRESENTATIONS = Object.freeze({
    buddy: Object.freeze({ schemaVersion: 1, assetId: 'buddy', displayName: 'Buddy', pawRoot: Object.freeze({ x: 256, y: 456 }), visualBounds: Object.freeze({ x: 82, y: 72, w: 365, h: 387 }), focusPoint: Object.freeze({ x: 256, y: 258 }), presentation: Object.freeze({ scale: 1, baselineOffset: 0 }), gameplayBodyId: EQUAL_PET_GAMEPLAY_BODY_ID, tags: Object.freeze(['medium']) }),
    neet: Object.freeze({ schemaVersion: 1, assetId: 'neet', displayName: 'Neet', pawRoot: Object.freeze({ x: 256, y: 456 }), visualBounds: Object.freeze({ x: 95, y: 65, w: 338, h: 394 }), focusPoint: Object.freeze({ x: 258, y: 250 }), presentation: Object.freeze({ scale: 1, baselineOffset: 0 }), gameplayBodyId: EQUAL_PET_GAMEPLAY_BODY_ID, tags: Object.freeze(['medium', 'fluffy']) })
});

// Development-only presentation fixtures. They never change the gameplay body.
const DEV_SILHOUETTE_FIXTURES = Object.freeze([
    Object.freeze({ id: 'fixture-small', tags: Object.freeze(['small']), visualBounds: Object.freeze({ x: 132, y: 178, w: 246, h: 281 }), presentation: Object.freeze({ scale: .82, baselineOffset: 0 }) }),
    Object.freeze({ id: 'fixture-medium', tags: Object.freeze(['medium']), visualBounds: Object.freeze({ x: 82, y: 72, w: 365, h: 387 }), presentation: Object.freeze({ scale: 1, baselineOffset: 0 }) }),
    Object.freeze({ id: 'fixture-tall', tags: Object.freeze(['tall']), visualBounds: Object.freeze({ x: 104, y: 20, w: 320, h: 439 }), presentation: Object.freeze({ scale: 1.18, baselineOffset: -24 }) }),
    Object.freeze({ id: 'fixture-long', tags: Object.freeze(['long']), visualBounds: Object.freeze({ x: 22, y: 128, w: 474, h: 331 }), presentation: Object.freeze({ scale: 1.08, baselineOffset: 12 }) }),
    Object.freeze({ id: 'fixture-fluffy', tags: Object.freeze(['fluffy']), visualBounds: Object.freeze({ x: 54, y: 44, w: 415, h: 415 }), presentation: Object.freeze({ scale: 1.12, baselineOffset: 0 }) })
]);

const PetManifest = {
    diagnostics: [],
    _presentations: new Map(Object.entries(PET_PRESENTATIONS)),
    get knownAssetIds() { return [...this._presentations.keys()]; },
    presentationFor(asset) {
        if (asset?.visualBounds && asset?.focusPoint && asset?.presentation && asset?.pawRoot) return asset;
        return this._presentations.get(asset?.assetId) || PET_PRESENTATIONS.buddy;
    },
    validate(asset) {
        const problems = [], finite = value => Number.isFinite(value), pointInFrame = point => point && finite(point.x) && finite(point.y) && point.x >= 0 && point.y >= 0 && point.x <= asset.frameSize.w && point.y <= asset.frameSize.h;
        if (!asset || typeof asset !== 'object') return { valid: false, problems: ['asset is missing'] };
        if (asset.schemaVersion !== PET_MANIFEST_SCHEMA_VERSION) problems.push('unsupported schema version');
        if (typeof asset.assetId !== 'string' || !/^[a-z][a-z0-9-]{1,63}$/.test(asset.assetId)) problems.push('invalid asset id');
        if (typeof asset.displayName !== 'string' || !asset.displayName.trim() || asset.displayName.length > 80) problems.push('invalid display name');
        if (!asset.frameSize || !Number.isInteger(asset.frameSize.w) || !Number.isInteger(asset.frameSize.h) || asset.frameSize.w <= 0 || asset.frameSize.h <= 0) problems.push('invalid frame size');
        else {
            if (!pointInFrame(asset.pawRoot)) problems.push('paw root outside frame');
            if (!pointInFrame(asset.focusPoint)) problems.push('focus point outside frame');
        }
        const bounds = asset.visualBounds;
        if (!bounds || !finite(bounds.x) || !finite(bounds.y) || !finite(bounds.w) || !finite(bounds.h) || bounds.w <= 0 || bounds.h <= 0) problems.push('invalid visual bounds');
        if (asset.gameplayBodyId !== EQUAL_PET_GAMEPLAY_BODY_ID) problems.push('non-canonical gameplay body');
        const scale = asset.presentation?.scale, offset = asset.presentation?.baselineOffset;
        if (!finite(scale) || scale < .82 || scale > 1.18) problems.push('presentation scale out of bounds');
        if (!finite(offset) || offset < -48 || offset > 48) problems.push('baseline offset out of bounds');
        if (!Array.isArray(asset.tags) || asset.tags.some(tag => typeof tag !== 'string' || !tag)) problems.push('invalid presentation tags');
        const requiredClips = ['idle', 'run', 'jump'];
        if (!asset.animations || typeof asset.animations !== 'object') problems.push('animation contract missing');
        else for (const clipName of requiredClips) {
            const clip = asset.animations[clipName];
            if (!clip || !Number.isInteger(clip.columns) || clip.columns <= 0 || !Number.isInteger(clip.frameCount) || clip.frameCount <= 0 || !Array.isArray(clip.durationsMs) || clip.durationsMs.length !== clip.frameCount || clip.durationsMs.some(duration => !finite(duration) || duration <= 0) || typeof clip.sheet !== 'string' || !clip.sheet || !finite(clip.sheetScale) || clip.sheetScale <= 0) problems.push(`invalid ${clipName} clip`);
        }
        const requiredStates = ['idle', 'run', 'takeoff', 'rise', 'apex', 'fall', 'land'];
        if (!asset.states || typeof asset.states !== 'object') problems.push('state contract missing');
        else for (const stateName of requiredStates) {
            const state = asset.states[stateName], clip = state && asset.animations && asset.animations[state.animation];
            if (!state || typeof state.animation !== 'string' || !clip || !Array.isArray(state.frames) || !state.frames.length || state.frames.some(frame => !Number.isInteger(frame) || frame < 0 || frame >= clip.frameCount) || typeof state.loop !== 'boolean') problems.push(`invalid ${stateName} state`);
        }
        return { valid: problems.length === 0, problems };
    },
    register(asset) {
        const result = this.validate(asset);
        if (result.valid) this._presentations.set(asset.assetId, asset);
        return result;
    },
    normalize(asset, fallback) {
        const result = this.register(asset);
        if (result.valid) return asset;
        this.diagnostics.push({ assetId: asset?.assetId || null, problems: result.problems });
        const candidate = fallback || (typeof CHARACTER_ASSETS !== 'undefined' && CHARACTER_ASSETS.find(pack => pack.assetId === 'buddy'));
        const fallbackResult = this.validate(candidate);
        if (fallbackResult.valid) { this.register(candidate); return candidate; }
        this.diagnostics.push({ assetId: candidate?.assetId || null, problems: ['fallback invalid', ...fallbackResult.problems] });
        return null;
    },
    fixture(asset, id) {
        const fixture = DEV_SILHOUETTE_FIXTURES.find(item => item.id === id), base = this.normalize(asset, asset);
        return fixture && base ? { ...base, visualBounds: fixture.visualBounds, presentation: fixture.presentation, tags: fixture.tags, fixtureId: fixture.id } : base;
    },
    resetDiagnostics() { this.diagnostics.length = 0; }
};
