// Local progress is optional: private browsing or blocked storage must not stop play.
const ADVENTURE_RECORDS_V2_KEY = 'barkour_adventure_records_v2';
const ADVENTURE_RECORDS_V3_KEY = 'barkour_adventure_records_v3';
const ADVENTURE_RECORDS_V3_ARCHIVE_KEY = 'barkour_adventure_records_v3_archive';
const ADVENTURE_RECORDS_V4_KEY = 'barkour_adventure_records_v4';
const ADVENTURE_RECORDS_V4_ARCHIVE_KEY = 'barkour_adventure_records_v4_archive';
const FINISH_PHOTOS_V1_KEY = 'barkour_finish_photos_v1';
const FINISH_PHOTOS_V2_KEY = 'barkour_finish_photos_v2';
const FINISH_PHOTOS_V3_KEY = 'barkour_finish_photos_v3';
const FINISH_PHOTOS_V4_KEY = 'barkour_finish_photos_v4';
const FINISH_PHOTOS_DYNAMIC_KEY = 'barkour_finish_photos_v4_dynamic_2';
const FINISH_PHOTOS_RECOVERY_KEY = 'barkour_finish_photos_v4_recovery_1';
const FINISH_PHOTOS_REFINED_KEY = 'barkour_finish_photos_v4_recovery_2';
const FINISH_PHOTOS_TRAVERSAL_KEY = 'barkour_finish_photos_v4_recovery_3';
const FINISH_HEIGHT_RANGE = 400;
const knownPetAssetIds = () => typeof PetManifest !== 'undefined' ? PetManifest.knownAssetIds : [];
const petDisplayName = assetId => typeof PetManifest !== 'undefined' ? PetManifest.presentationFor({ assetId }).displayName : assetId;

const Storage = {
    RECORD_KEYS: Object.freeze({ v2: ADVENTURE_RECORDS_V2_KEY, v3: ADVENTURE_RECORDS_V3_KEY, v3Archive: ADVENTURE_RECORDS_V3_ARCHIVE_KEY, v4: ADVENTURE_RECORDS_V4_KEY, v4Archive: ADVENTURE_RECORDS_V4_ARCHIVE_KEY }),
    PHOTO_KEYS: Object.freeze({ v1: FINISH_PHOTOS_V1_KEY, v2: FINISH_PHOTOS_V2_KEY, v3: FINISH_PHOTOS_V3_KEY, v4: FINISH_PHOTOS_V4_KEY, dynamic: FINISH_PHOTOS_DYNAMIC_KEY, recovery: FINISH_PHOTOS_RECOVERY_KEY, refined: FINISH_PHOTOS_REFINED_KEY, traversal: FINISH_PHOTOS_TRAVERSAL_KEY }),
    read(key, fallback) { try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch (_) { return fallback; } },
    write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } },
    number(value, max = 1e9) { return Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : 0; },
    // Historical public version dispatch deliberately remains v2/v3. v4 has
    // dedicated accessors so old callers cannot silently start comparing it.
    recordVersion(courseVersion = (typeof COURSE_VERSION === 'number' ? COURSE_VERSION : 2)) { return [2, 3].includes(courseVersion) ? courseVersion : null; },
    recordsKey(courseVersion) { const version = this.recordVersion(courseVersion); return version ? this.RECORD_KEYS[`v${version}`] : null; },
    recordKey(trackId, difficulty, control = 'fixed') { return `${trackId}:${difficulty}:${control}`; },
    knownRulesId(value) { return value === 'explorer-recovery-v1' || value === 'heart-challenge-v1'; },
    knownCourseLayoutId(value) { return /^(texas|alpine|coast|forest|ember)-v3-(elevation-1|dynamic-2|recovery-[12])$/.test(value) || /^(texas|alpine|forest)-v3-recovery-3$/.test(value); },
    layoutMatchesTrack(trackId, layoutId) { return this.knownCourseLayoutId(layoutId) && layoutId.startsWith(`${trackId}-v3-`); },
    knownCapabilityProfile(value) { return value === 'equal-pet-v1'; },
    rulesMatchDifficulty(rulesId, difficulty) {
        return (difficulty === 'EASY' && rulesId === 'explorer-recovery-v1')
            || ((difficulty === 'MEDIUM' || difficulty === 'HARD') && rulesId === 'heart-challenge-v1');
    },
    validV4Provenance(value) {
        return !!value && (value.version === 4 || value.resultVersion === 4) && this.knownRulesId(value.rulesId) && value.courseVersion === 3
            && this.knownCourseLayoutId(value.courseLayoutId) && this.knownCapabilityProfile(value.capabilityProfile);
    },
    // v4 records are only meaningful inside one explicitly named rules/layout/capability contract.
    recordsComparable(record, context) {
        return this.validV4Provenance(record) && this.validV4Provenance(context)
            && record.rulesId === context.rulesId && record.courseVersion === context.courseVersion
            && record.courseLayoutId === context.courseLayoutId && record.capabilityProfile === context.capabilityProfile;
    },
    getLegacyRecords() { return this.read('barkour_adventure_records_v1', {}); },
    getRecords(courseVersion) {
        const version = this.recordVersion(courseVersion), result = {};
        if (!version) return result;
        const source = this.read(this.recordsKey(version), {});
        if (!source || typeof source !== 'object' || Array.isArray(source)) return result;
        for (const [key, value] of Object.entries(source)) {
            if (!/^(texas|alpine|coast|forest|ember):(EASY|MEDIUM|HARD):(fixed|variable)$/.test(key) || !value || value.version !== version) continue;
            if (version === 4 && !this.validV4Provenance(value)) continue;
            const sectionLimit = version === 3 ? 64 : 7;
            result[key] = { version, score: this.number(value.score), stars: Math.floor(this.number(value.stars, 3)), time: this.number(value.time),
                souvenirs: Math.floor(this.number(value.souvenirs, 3)), completions: this.number(value.completions),
                sections: Array.isArray(value.sections) ? value.sections.slice(0, sectionLimit).map(item => this.number(item)) : [],
                courseLayoutId: typeof value.courseLayoutId === 'string' ? value.courseLayoutId : null,
                capabilityProfile: typeof value.capabilityProfile === 'string' ? value.capabilityProfile : null,
                ...(version === 4 ? { rulesId: value.rulesId, courseVersion: value.courseVersion } : {}) };
        }
        return result;
    },
    getArchivedV2Records() { return this.getRecords(2); },
    getArchivedV3Records() {
        const source = this.read(ADVENTURE_RECORDS_V3_ARCHIVE_KEY, []);
        if (!Array.isArray(source)) return [];
        return source.filter(entry => entry && /^(texas|alpine|coast|forest|ember):(EASY|MEDIUM|HARD):(fixed|variable)$/.test(entry.key) && entry.record?.version === 3)
            .slice(0, 48).map(entry => ({ key: entry.key, archivedAt: this.number(entry.archivedAt), reason: String(entry.reason || 'incompatible').slice(0, 40), record: {
                version: 3, score: this.number(entry.record.score), stars: Math.floor(this.number(entry.record.stars, 3)), time: this.number(entry.record.time),
                souvenirs: Math.floor(this.number(entry.record.souvenirs, 3)), completions: this.number(entry.record.completions),
                sections: Array.isArray(entry.record.sections) ? entry.record.sections.slice(0, 64).map(item => this.number(item)) : [],
                courseLayoutId: typeof entry.record.courseLayoutId === 'string' ? entry.record.courseLayoutId : null,
                capabilityProfile: typeof entry.record.capabilityProfile === 'string' ? entry.record.capabilityProfile : null
            } }));
    },
    getArchivedV4Records() {
        const source = this.read(ADVENTURE_RECORDS_V4_ARCHIVE_KEY, []);
        if (!Array.isArray(source)) return [];
        return source.filter(entry => entry && /^(texas|alpine|coast|forest|ember):(EASY|MEDIUM|HARD):(fixed|variable)$/.test(entry.key) && entry.record?.version === 4)
            .slice(0, 48).map(entry => ({ key: entry.key, archivedAt: this.number(entry.archivedAt), reason: String(entry.reason || 'incompatible').slice(0, 40), record: entry.record }));
    },
    getV4Records() {
        const source = this.read(ADVENTURE_RECORDS_V4_KEY, {}), result = {};
        if (!source || typeof source !== 'object' || Array.isArray(source)) return result;
        for (const [key, value] of Object.entries(source)) {
            if (!/^(texas|alpine|coast|forest|ember):(EASY|MEDIUM|HARD):fixed$/.test(key) || value?.version !== 4 || !this.validV4Provenance(value)
                || !this.rulesMatchDifficulty(value.rulesId, key.split(':')[1]) || !this.layoutMatchesTrack(key.split(':')[0], value.courseLayoutId)) continue;
            result[key] = { version: 4, rulesId: value.rulesId, courseVersion: value.courseVersion, courseLayoutId: value.courseLayoutId,
                capabilityProfile: value.capabilityProfile, score: this.number(value.score), stars: Math.floor(this.number(value.stars, 3)),
                time: this.number(value.time), souvenirs: Math.floor(this.number(value.souvenirs, 3)), completions: this.number(value.completions),
                sections: Array.isArray(value.sections) ? value.sections.slice(0, 64).map(item => this.number(item)) : [] };
        }
        return result;
    },
    saveCourse(trackId, difficulty, result) {
        if (result?.version === 4) return this.saveV4Course(trackId, difficulty, result);
        const version = this.recordVersion(result?.version);
        if (!version) return null;
        const records = this.getRecords(version);
        const key = this.recordKey(trackId, difficulty, result?.control || 'fixed');
        let old = records[key] || {};
        const sectionLimit = version === 3 ? 64 : 7;
        const layoutMismatch = old.courseLayoutId && result?.courseLayoutId && old.courseLayoutId !== result.courseLayoutId;
        const capabilityMismatch = old.capabilityProfile && result?.capabilityProfile && old.capabilityProfile !== result.capabilityProfile;
        const unknownProvenance = version === 3 && old.score && (!old.courseLayoutId || !old.capabilityProfile);
        let archived = false;
        if (layoutMismatch || capabilityMismatch || unknownProvenance) {
            const archive = this.getArchivedV3Records();
            const reason = unknownProvenance ? 'unknown-provenance' : 'incompatible-layout';
            const duplicate = archive.some(entry => entry.key === key && entry.record.score === old.score && entry.record.courseLayoutId === old.courseLayoutId && entry.record.capabilityProfile === old.capabilityProfile);
            const nextArchive = duplicate ? archive : [{ key, archivedAt: Date.now(), reason, record: old }, ...archive].slice(0, 48);
            if (!this.write(ADVENTURE_RECORDS_V3_ARCHIVE_KEY, nextArchive)) return { saved: false, record: old, incompatible: true };
            old = {}; archived = true;
        }
        const replacesSections = !old.score || this.number(result?.score) > old.score;
        records[key] = { version, stars: Math.max(old.stars || 0, this.number(result?.stars, 3)), score: Math.max(old.score || 0, this.number(result?.score)),
            time: Math.min(old.time || Infinity, this.number(result?.time)), souvenirs: Math.max(old.souvenirs || 0, Math.floor(this.number(result?.souvenirs, 3))),
            sections: replacesSections ? (Array.isArray(result?.sections) ? result.sections.slice(0, sectionLimit).map(item => this.number(item)) : []) : old.sections,
            courseLayoutId: replacesSections ? (typeof result?.courseLayoutId === 'string' ? result.courseLayoutId : old.courseLayoutId || null) : old.courseLayoutId || result?.courseLayoutId || null,
            capabilityProfile: replacesSections ? (typeof result?.capabilityProfile === 'string' ? result.capabilityProfile : old.capabilityProfile || null) : old.capabilityProfile || result?.capabilityProfile || null,
            completions: (old.completions || 0) + 1 };
        return { saved: this.write(this.recordsKey(version), records), record: records[key], archived };
    },
    saveV4Course(trackId, difficulty, result) {
        if ((result.control && result.control !== 'fixed') || !this.validV4Provenance(result) || !this.rulesMatchDifficulty(result.rulesId, difficulty) || !this.layoutMatchesTrack(trackId, result.courseLayoutId)) return null;
        const key = this.recordKey(trackId, difficulty, result.control || 'fixed');
        if (!/^(texas|alpine|coast|forest|ember):(EASY|MEDIUM|HARD):(fixed|variable)$/.test(key)) return null;
        const source = this.read(ADVENTURE_RECORDS_V4_KEY, {});
        const records = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
        const old = records[key];
        let archived = false;
        // An unknown v4 contract must never enter a comparison. Archive first; if
        // that write fails, leave the original record in place.
        if (old && !this.recordsComparable(old, result)) {
            const rawArchive = this.read(ADVENTURE_RECORDS_V4_ARCHIVE_KEY, []);
            const archive = Array.isArray(rawArchive) ? rawArchive : [];
            const duplicate = archive.some(entry => entry?.key === key && JSON.stringify(entry.record) === JSON.stringify(old));
            const nextArchive = duplicate ? archive : [{ key, archivedAt: Date.now(), reason: this.validV4Provenance(old) ? 'incompatible-provenance' : 'unknown-provenance', record: old }, ...archive].slice(0, 48);
            if (!this.write(ADVENTURE_RECORDS_V4_ARCHIVE_KEY, nextArchive)) return { saved: false, record: old, incompatible: true };
            archived = true;
        }
        const comparable = old && this.recordsComparable(old, result) ? old : null;
        const oldScore = comparable ? this.number(comparable.score) : 0;
        const replacesSections = !comparable || this.number(result.score) > oldScore;
        const record = {
            version: 4, rulesId: result.rulesId, courseVersion: result.courseVersion,
            courseLayoutId: result.courseLayoutId, capabilityProfile: result.capabilityProfile,
            stars: Math.max(comparable ? this.number(comparable.stars, 3) : 0, this.number(result.stars, 3)),
            score: Math.max(oldScore, this.number(result.score)),
            time: Math.min(comparable ? this.number(comparable.time) : Infinity, this.number(result.time)),
            souvenirs: Math.max(comparable ? Math.floor(this.number(comparable.souvenirs, 3)) : 0, Math.floor(this.number(result.souvenirs, 3))),
            sections: replacesSections ? (Array.isArray(result.sections) ? result.sections.slice(0, 64).map(item => this.number(item)) : []) : comparable.sections,
            completions: (comparable ? this.number(comparable.completions) : 0) + 1
        };
        const nextRecords = { ...records, [key]: record };
        return { saved: this.write(ADVENTURE_RECORDS_V4_KEY, nextRecords), record, archived };
    },
    bestStars(trackId, courseVersion) { return Math.max(0, ...Object.entries(this.getRecords(courseVersion)).filter(([key]) => key.startsWith(trackId + ':')).map(([, value]) => value.stars)); },

    normalizeV1Photo(photo) {
        const clips = { run: 12, jump: 8, idle: 6 };
        if (!photo || photo.version !== 1 || !/^(texas|alpine|coast|forest|ember)$/.test(photo.track) || !/^(Buddy|Neet)$/.test(photo.dog) || !clips[photo.clip] || !Number.isInteger(photo.frame) || photo.frame < 0 || photo.frame >= clips[photo.clip] || !Number.isFinite(photo.height) || photo.height < 0 || photo.height > FINISH_HEIGHT_RANGE || !Number.isFinite(photo.seconds) || photo.seconds < 0 || photo.seconds >= 86400 || !Number.isFinite(photo.created) || photo.created <= 0 || !Number.isFinite(photo.distance) || photo.distance < 0 || !['EASY', 'MEDIUM', 'HARD'].includes(photo.difficulty) || !['fixed', 'variable'].includes(photo.control)) return null;
        const assetId = photo.dog === 'Buddy' ? 'buddy' : 'neet';
        return { version: 1, track: photo.track, dog: photo.dog, assetId, clip: photo.clip, frame: photo.frame, height: photo.height, normalizedHeight: photo.height / FINISH_HEIGHT_RANGE, seconds: photo.seconds, created: photo.created, distance: photo.distance, difficulty: photo.difficulty, control: photo.control, archived: true };
    },
    normalizeV2Photo(photo) {
        const pose = photo?.pose, clips = { run: 12, jump: 8, idle: 6 };
        if (!photo || photo.version !== 2 || !/^(texas|alpine|coast|forest|ember)$/.test(photo.track) || !/^[a-z][a-z0-9-]{1,63}$/.test(photo.assetId) || !pose || !['idle', 'run', 'takeoff', 'rise', 'apex', 'fall', 'land'].includes(pose.state) || !clips[pose.clip] || !Number.isInteger(pose.frame) || pose.frame < 0 || pose.frame >= clips[pose.clip] || !Number.isFinite(pose.normalizedHeight) || pose.normalizedHeight < 0 || pose.normalizedHeight > 1 || !Number.isFinite(photo.seconds) || photo.seconds < 0 || photo.seconds >= 86400 || !Number.isFinite(photo.created) || photo.created <= 0 || !Number.isFinite(photo.distance) || photo.distance < 0 || !['EASY', 'MEDIUM', 'HARD'].includes(photo.difficulty) || !['fixed', 'variable'].includes(photo.control)) return null;
        const available = knownPetAssetIds().includes(photo.assetId);
        const displayName = typeof photo.petLabel === 'string' && photo.petLabel.trim() ? photo.petLabel.slice(0, 80) : (typeof photo.dog === 'string' && photo.dog.trim() ? photo.dog.slice(0, 80) : available ? petDisplayName(photo.assetId) : photo.assetId);
        return { version: 2, track: photo.track, assetId: photo.assetId, dog: displayName, petLabel: displayName, assetAvailable: available, archived: true, pose: { state: pose.state, clip: pose.clip, frame: pose.frame, normalizedHeight: pose.normalizedHeight }, clip: pose.clip, frame: pose.frame, normalizedHeight: pose.normalizedHeight, height: pose.normalizedHeight * FINISH_HEIGHT_RANGE, seconds: photo.seconds, created: photo.created, distance: photo.distance, difficulty: photo.difficulty, control: photo.control };
    },
    normalizeV3Photo(photo) {
        const base = this.normalizeV2Photo({ ...photo, version: 2 });
        if (!base || photo?.version !== 3) return null;
        return { ...base, version: 3, archived: false, courseVersion: this.recordVersion(photo.courseVersion) || 3 };
    },
    normalizeV4Photo(photo) {
        const base = this.normalizeV2Photo({ ...photo, version: 2 });
        if (!base || photo?.version !== 4 || photo.control !== 'fixed' || !this.validV4Provenance(photo) || !this.rulesMatchDifficulty(photo.rulesId, photo.difficulty) || !this.layoutMatchesTrack(photo.track, photo.courseLayoutId)) return null;
        return { ...base, version: 4, archived: false, rulesId: photo.rulesId, courseVersion: photo.courseVersion,
            courseLayoutId: photo.courseLayoutId, capabilityProfile: photo.capabilityProfile };
    },
    getLegacyFinishPhotos() {
        const photos = this.read(FINISH_PHOTOS_V1_KEY, []);
        return Array.isArray(photos) ? photos.map(photo => this.normalizeV1Photo(photo)).filter(Boolean).slice(0, 24) : [];
    },
    getCurrentFinishPhotos() {
        const photos = this.read(FINISH_PHOTOS_V3_KEY, []);
        return Array.isArray(photos) ? photos.map(photo => this.normalizeV3Photo(photo)).filter(Boolean).slice(0, 24) : [];
    },
    // v3's reader remains separate so an upgrade cannot hide or rewrite its album.
    getV4FinishPhotos() {
        const photos = this.read(FINISH_PHOTOS_V4_KEY, []);
        return Array.isArray(photos) ? photos.map(photo => this.normalizeV4Photo(photo)).filter(Boolean).slice(0, 24) : [];
    },
    // A separate dynamic album leaves every byte and cap of the shipped v4
    // album untouched. Its reader remains available for historical export.
    getDynamicFinishPhotos() {
        const photos = this.read(FINISH_PHOTOS_DYNAMIC_KEY, []);
        return Array.isArray(photos) ? photos.map(photo => this.normalizeV4Photo(photo)).filter(photo => photo && photo.courseLayoutId.endsWith('-dynamic-2')).slice(0, 24) : [];
    },
    getRecoveryFinishPhotos() {
        const photos = this.read(FINISH_PHOTOS_RECOVERY_KEY, []);
        return Array.isArray(photos) ? photos.map(photo => this.normalizeV4Photo(photo)).filter(photo => photo && photo.courseLayoutId.endsWith('-recovery-1')).slice(0, 24) : [];
    },
    getRefinedFinishPhotos() {
        const photos = this.read(FINISH_PHOTOS_REFINED_KEY, []);
        return Array.isArray(photos) ? photos.map(photo => this.normalizeV4Photo(photo)).filter(photo => photo && photo.courseLayoutId.endsWith('-recovery-2')).slice(0, 24) : [];
    },
    getTraversalFinishPhotos() {
        const photos = this.read(FINISH_PHOTOS_TRAVERSAL_KEY, []);
        return Array.isArray(photos) ? photos.map(photo => this.normalizeV4Photo(photo)).filter(photo => photo && photo.courseLayoutId.endsWith('-recovery-3')).slice(0, 24) : [];
    },
    getPreviousFinishPhotos() {
        const photos = this.read(FINISH_PHOTOS_V2_KEY, []);
        return Array.isArray(photos) ? photos.map(photo => this.normalizeV2Photo(photo)).filter(Boolean).slice(0, 24) : [];
    },
    getFinishPhotoBuckets() { return { traversal: this.getTraversalFinishPhotos(), refined: this.getRefinedFinishPhotos(), recovery: this.getRecoveryFinishPhotos(), dynamic: this.getDynamicFinishPhotos(), next: this.getV4FinishPhotos(), current: this.getCurrentFinishPhotos(), previous: this.getPreviousFinishPhotos(), classic: this.getLegacyFinishPhotos() }; },
    // Compatibility helper. UI uses independent buckets so a full current album never hides archives.
    getFinishPhotos() { const buckets = this.getFinishPhotoBuckets(); return buckets.traversal.concat(buckets.refined, buckets.recovery, buckets.dynamic, buckets.next, buckets.current, buckets.previous, buckets.classic); },
    saveFinishPhoto(photo) {
        if (photo?.version === 4) return this.saveV4FinishPhoto(photo);
        const normalized = this.normalizeV3Photo(photo);
        if (!normalized) return false;
        const stored = { version: 3, track: normalized.track, courseVersion: normalized.courseVersion, assetId: normalized.assetId, petLabel: normalized.petLabel, pose: normalized.pose, seconds: normalized.seconds, created: normalized.created, distance: normalized.distance, difficulty: normalized.difficulty, control: normalized.control };
        const current = this.getCurrentFinishPhotos().map(item => ({ version: 3, track: item.track, courseVersion: item.courseVersion, assetId: item.assetId, petLabel: item.petLabel, pose: item.pose, seconds: item.seconds, created: item.created, distance: item.distance, difficulty: item.difficulty, control: item.control }));
        return this.write(FINISH_PHOTOS_V3_KEY, [stored, ...current].slice(0, 24));
    },
    saveV4FinishPhoto(photo) {
        const normalized = this.normalizeV4Photo(photo);
        if (!normalized) return false;
        const stored = { version: 4, track: normalized.track, rulesId: normalized.rulesId, courseVersion: normalized.courseVersion,
            courseLayoutId: normalized.courseLayoutId, capabilityProfile: normalized.capabilityProfile, assetId: normalized.assetId,
            petLabel: normalized.petLabel, pose: normalized.pose, seconds: normalized.seconds, created: normalized.created,
            distance: normalized.distance, difficulty: normalized.difficulty, control: normalized.control };
        const recovery = normalized.courseLayoutId.endsWith('-recovery-1');
        const refined = normalized.courseLayoutId.endsWith('-recovery-2');
        const traversal = normalized.courseLayoutId.endsWith('-recovery-3');
        const dynamic = normalized.courseLayoutId.endsWith('-dynamic-2');
        const current = (traversal ? this.getTraversalFinishPhotos() : refined ? this.getRefinedFinishPhotos() : recovery ? this.getRecoveryFinishPhotos() : dynamic ? this.getDynamicFinishPhotos() : this.getV4FinishPhotos()).map(item => ({ version: 4, track: item.track, rulesId: item.rulesId, courseVersion: item.courseVersion,
            courseLayoutId: item.courseLayoutId, capabilityProfile: item.capabilityProfile, assetId: item.assetId, petLabel: item.petLabel,
            pose: item.pose, seconds: item.seconds, created: item.created, distance: item.distance, difficulty: item.difficulty, control: item.control }));
        return this.write(traversal ? FINISH_PHOTOS_TRAVERSAL_KEY : refined ? FINISH_PHOTOS_REFINED_KEY : recovery ? FINISH_PHOTOS_RECOVERY_KEY : dynamic ? FINISH_PHOTOS_DYNAMIC_KEY : FINISH_PHOTOS_V4_KEY, [stored, ...current].slice(0, 24));
    },
    getHighScore() { return Number(this.read('barkour_highscore', 0)) || 0; },
    saveHighScore(score) { this.write('barkour_highscore', score); },
    getSelectedCharacter() { return Number(this.read('barkour_character', 0)) || 0; },
    saveSelectedCharacter(index) { this.write('barkour_character', index); }
};
