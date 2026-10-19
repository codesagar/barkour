class GameUI {
    constructor(game) {
        this.game = game;
        this.elements = {};
        for (const id of ['stage','adventureMenu','loadingScreen','gameHUD','powerHUD','courseToast','countdown','runHint',
            'hazardCue','resultPanel','pausePanel','recordsPanel','optionsPanel','playButton','pauseButton','soundButton','hudTrack','hudHearts','hudSection',
            'hudPercent','progressFill','progressBar','hudTreats','soundStatus','destinationRegion','destinationName','destinationTag'])
            this.elements[id] = document.getElementById(id);
        this.buildChoices();
        const on = (id, callback) => document.getElementById(id).addEventListener('click', () => callback());
        on('playButton', () => game.startGame());
        on('pauseButton', () => game.pause());
        on('resumeButton', () => game.resume());
        on('soundButton', () => { game.audio.toggle(); this.updateSound(); });
        on('retryButton', () => game.startGame(game.runContext?.kind === 'practice' ? {retry:true,practiceId:game.runContext.practiceId} : {retry:true}));
        on('practiceButton', () => { if (game.lastFailure?.practiceId) game.startGame({practiceId:game.lastFailure.practiceId}); });
        on('fullTrailButton', () => game.startGame());
        on('menuButton', () => game.returnToMenu());
        on('pauseMenuButton', () => game.returnToMenu());
        on('nextButton', () => { game.selectTrack((game.selectedTrackIndex + 1) % TRACKS.length); game.startGame(); });
        on('optionsButton', () => this.showOptions());
        on('closeOptionsButton', () => this.closeOptions());
        on('recordsButton', () => this.showRecords());
        on('closeRecordsButton', () => this.closeRecords());
        on('downloadFinishPhoto', () => { if(game.finishPhoto) this.downloadHomecomingPhoto(game.finishPhoto); });
        document.getElementById('finishAlbum').addEventListener('toggle', () => { if(document.getElementById('finishAlbum').open) this.drawFinishAlbum(); });
        const savedDifficulty = Storage.read('barkour_difficulty', null);
        const savedIndex = game.speedOptions.indexOf(savedDifficulty);
        if (savedIndex >= 0) game.selectedSpeedIndex = savedIndex;
        const quality = document.getElementById('qualityToggle'); quality.checked = game.lowQuality;
        quality.addEventListener('change', () => { game.lowQuality = quality.checked; Storage.write('barkour_low_quality',game.lowQuality); });
        on('fullscreenButton', async () => {
            try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('.app-shell').requestFullscreen(); }
            catch (_) { game.notify('Full screen is unavailable here. Landscape also gives more room.'); }
        });
        document.addEventListener('keydown', event => {
            const modal = document.querySelector('.panel-overlay:not(.hidden)');
            if (!modal || event.key !== 'Tab') return;
            const buttons = [...modal.querySelectorAll('button, summary, a[href], input, select, [tabindex="0"]')].filter(b => b.getClientRects().length && !b.disabled);
            if (!buttons.length) return;
            const first = buttons[0], last = buttons.at(-1);
            if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
        });
        this.updateSound();
    }
    show(id, visible) { this.elements[id].classList.toggle('hidden', !visible); }
    focus(id) { document.getElementById(id)?.focus({preventScroll:true}); }
    closeRecords() {
        this.show('recordsPanel', false); this.elements.adventureMenu.inert = false; this.syncState();
        if (this.game.state === 'START') this.focus('recordsButton');
    }
    showOptions() {
        this.game.pause(); this.show('pausePanel', false); this.show('optionsPanel', true);
        this.elements.adventureMenu.inert = true; document.querySelector('.header-actions').inert = true;
        this.updateSelection(); this.focus('closeOptionsButton');
    }
    closeOptions() {
        this.show('optionsPanel', false); this.elements.adventureMenu.inert = false;
        this.syncState();
        if (this.game.state !== 'PAUSED') this.focus('optionsButton');
    }
    text(id, value) { if (this.elements[id].textContent !== String(value)) this.elements[id].textContent = value; }
    buildChoices() {
        const game = this.game;
        game.dogSprites.forEach((pack, index) => {
            const button = document.createElement('button'); button.className = 'dog-choice';
            const label = pack.displayName || pack.assetId;
            button.innerHTML = `<canvas width="128" height="112" aria-hidden="true"></canvas><span>${label}</span><span class="choice-check">✓</span>`;
            button.setAttribute('aria-label', `Run with ${label}`);
            button.addEventListener('click', () => game.selectCharacter(index));
            document.getElementById('dogChoices').appendChild(button);
        });
        game.speedOptions.forEach((key, index) => {
            const button = document.createElement('button'); button.className = 'difficulty-choice';
            button.textContent = CONFIG.DIFFICULTY[key].LABEL; button.setAttribute('aria-label', `${key.toLowerCase()}: ${button.textContent}`);
            button.addEventListener('click', () => { game.selectedSpeedIndex = index; Storage.write('barkour_difficulty', key); this.updateSelection(); });
            document.getElementById('difficultyChoices').appendChild(button);
        });
        TRACKS.forEach((track, index) => {
            const button = document.createElement('button'); button.className = 'track-choice';
            button.innerHTML = `<canvas width="400" height="140" aria-hidden="true"></canvas><span class="track-number">${track.icon}</span><span class="track-label">${track.name}</span><span class="track-meta"><span>About a minute</span></span>`;
            button.setAttribute('aria-label', `${track.name}: ${track.tag}`);
            button.addEventListener('click', () => game.selectTrack(index));
            document.getElementById('trackChoices').appendChild(button);
            const ctx = button.querySelector('canvas').getContext('2d'); ctx.scale(.25, .25); ctx.translate(0, -155);
            game.background.draw(ctx, track, 0, 0);
            Art.obstacle(ctx, track.types[0], 1240, 600, 160, 220);
        });
    }
    updateSelection() {
        const game = this.game, track = TRACKS[game.selectedTrackIndex];
        document.querySelectorAll('.dog-choice').forEach((button, i) => button.setAttribute('aria-pressed', i === game.selectedCharacterIndex));
        document.querySelectorAll('.difficulty-choice').forEach((button, i) => button.setAttribute('aria-pressed', i === game.selectedSpeedIndex));
        document.querySelectorAll('.track-choice').forEach((button, i) => button.setAttribute('aria-pressed', i === game.selectedTrackIndex));
        this.text('destinationRegion', track.region); this.text('destinationName', track.name); this.text('destinationTag', track.tag);
        document.querySelector('.menu-intro').textContent = `${track.name} · About a minute`;
        const difficulty = game.speedOptions[game.selectedSpeedIndex];
        const help = {EASY:'Explorer keeps the journey going after bumps.',MEDIUM:'Adventurer is a three-heart challenge.',HARD:'Trailblazer is the fastest two-heart challenge.'};
        document.getElementById('difficultyHelp').textContent = `${help[difficulty] || ''}${game.state === 'PAUSED' ? ' Applies to your next run.' : ''}`;
        document.getElementById('controlHint').textContent = 'Press once to leap';
        this.elements.stage.style.setProperty('--accent', track.accent);
        this.elements.stage.classList.toggle('night-theme', track.id === 'ember');
        document.querySelector('.destination-caption').style.color = track.id === 'ember' ? '#FFF0D5' : '#405B4C';
    }
    updateSound() {
        this.text('soundStatus', this.game.audio.enabled ? 'On' : 'Off');
        this.elements.soundButton.setAttribute('aria-pressed', this.game.audio.enabled);
    }
    syncState() {
        const state = this.game.state;
        this.show('adventureMenu', state === 'START');
        this.elements.stage.classList.toggle('menu-open', state === 'START');
        this.show('gameHUD', ['PLAYING','COUNTDOWN','PAUSED'].includes(state));
        this.show('powerHUD', state === 'PLAYING');
        this.show('pauseButton', ['PLAYING','COUNTDOWN'].includes(state));
        this.show('pausePanel', state === 'PAUSED');
        if (state === 'START') this.show('optionsPanel', false);
        this.show('resultPanel', ['COMPLETE','GAME_OVER','PRACTICE_COMPLETE','PRACTICE_GAME_OVER'].includes(state));
        this.show('countdown', state === 'COUNTDOWN');
        this.show('courseToast', false); this.show('runHint', false); this.show('hazardCue',false);
        if (state === 'START') { this.show('recordsPanel', false); this.updateSelection(); }
        if (['COMPLETE','GAME_OVER','PRACTICE_COMPLETE','PRACTICE_GAME_OVER'].includes(state)) this.showResult();
        this.updateHUD();
        document.querySelector('.header-actions').inert = ['PAUSED','COMPLETE','GAME_OVER','PRACTICE_COMPLETE','PRACTICE_GAME_OVER'].includes(state);
        if (state === 'PAUSED') this.focus('resumeButton');
        else if (['COMPLETE','GAME_OVER','PRACTICE_COMPLETE','PRACTICE_GAME_OVER'].includes(state)) this.focus(state === 'PRACTICE_COMPLETE' ? 'fullTrailButton' : state === 'COMPLETE' ? 'nextButton' : 'retryButton');
        else if (['COUNTDOWN','PLAYING'].includes(state)) this.focus('gameCanvas');
        else if (state === 'START') this.focus('playButton');
    }
    stars(count) { const n = Math.max(0, Math.min(3, Math.floor(Number(count) || 0))); return '★'.repeat(n) + '☆'.repeat(3 - n); }
    updateHUD() {
        const g = this.game;
        if (!g.course) return;
        const percent = Math.min(100, Math.floor(g.distance / g.course.length * 100));
        this.text('hudTrack', g.course.track.name);
        const forgiving = Boolean(g.forgivingExplorer);
        this.text('hudHearts', forgiving ? '' : '♥'.repeat(Math.max(0, g.hearts)) + '♡'.repeat(Math.max(0, g.maxHearts - g.hearts)));
        this.elements.hudHearts.setAttribute('aria-label', forgiving ? '' : `${g.hearts} of ${g.maxHearts} hearts`);
        this.text('hudSection', g.course.sectionAt(g.distance).name);
        this.text('hudPercent', `${percent}%`); this.elements.progressFill.style.width = `${percent}%`;
        this.elements.progressBar.setAttribute('aria-valuenow', percent);
        this.text('hudTreats', `${g.treats} ${g.treats === 1 ? 'treat' : 'treats'}`);
        const powers = Object.entries(g.powers).filter(([, value]) => value > 0).map(([key, value]) => `<span class="power-pill ${key === 'star' && value <= 1.5 ? 'expiring' : ''}"><b style="background:${CONFIG.POWERS[key].color}"></b>${CONFIG.POWERS[key].short} · ${key === 'shield' ? '1 hit' : Math.ceil(value) + 's'}</span>`).join('');
        if (this.elements.powerHUD.innerHTML !== powers) this.elements.powerHUD.innerHTML = powers;
        this.show('runHint', g.state === 'PLAYING');
        const warning = g.course.nextWarning?.(g.distance);
        const next = g.course.obstacles.find(o=>!o.hit&&!o.passed&&o.worldX>g.distance);
        const warningTarget = warning?.target || next;
        const showCue = g.portrait && g.state === 'PLAYING' && warning && (warningTarget?.worldX ?? warning.worldX)-g.distance <= warning.lead;
        this.show('hazardCue',Boolean(showCue));
        if (showCue) {
            const closing = g.gameSpeed*60 + (warningTarget?.motion === 'roll' ? warningTarget.rate : warningTarget?.motion === 'patrol' ? 83 : 0);
            const arrival = Math.max(0,((warningTarget?.worldX ?? warning.worldX)-g.distance-90)/(closing*CONFIG.CAMERA.PORTRAIT_PACE));
            const names={snowball:'Snowball',tumbleweed:'Rolling tumbleweed',crab:'Patrolling crab',crystal:warningTarget?.motion==='phase'?'Pulsing crystal':'Crystal',fence:'Fence'};
            const label = warning.kind === 'surface' ? 'Spring · stay grounded' : names[warningTarget?.type] || warning?.cue || 'Trail marker';
            document.getElementById('hazardLabel').textContent = `${label} · ~${arrival.toFixed(1)}s${warningTarget?.motion === 'phase' ? (warningTarget.warning ? ' · returning' : warningTarget.active === false ? ' · safe' : ' · solid') : ''}`;
            const icon=document.getElementById('hazardIcon').getContext('2d');icon.clearRect(0,0,100,80);
            if (warning.kind === 'surface' && Art.launch) Art.launch(icon,50,72,62,warningTarget.kind,true);
            else if (warning.kind === 'obstacle' && warningTarget) { icon.save(); if(warningTarget.active===false) icon.globalAlpha=.25; Art.obstacle(icon,warningTarget.type,50,72,Math.min(62,warningTarget.width),Math.min(64,warningTarget.height),g.reducedMotion?0:g.playTime); icon.restore(); }
        }
        const opening = g.course.beats?.[0];
        let hint = !g.firstCleared ? (g.cueSectionIndex === 0 ? opening?.cue || 'Press once for a full leap.' : 'Press Space, Up, or the trail to leap.')
            : g.powers.star ? 'SUPER PAWS · Stay on the trail to smash ★ obstacles' : '';
        const gate = g.course.routeGates?.find(item => !item.selected && item.worldX - g.distance < 1000);
        if (gate) hint = g.course.beatById?.[gate.beatId]?.cue || 'Stay grounded for the safe trail · press for the high rosette';
        else if (next?.choice && next.worldX-g.distance<1000) hint = 'Low rosette: spend a shield · Leap for the safe high trail';
        else if (next?.pair && next.worldX-g.distance<1000) hint = 'Two low obstacles · One press clears the pair';
        else if (next?.tutorial && next.worldX-g.distance<1000) hint = g.course.beatById?.[next.beatId]?.cue || 'Press once for a full leap';
        else if (next?.low && next.worldX-g.distance<1000) hint = 'One press makes a full leap over this obstacle';
        else if (next?.motion && next.worldX-g.distance<1000) hint = g.course.journey.tip;
        const guidance = g.guidance?.() || {message:'',priority:0};
        if (guidance.message) hint = guidance.message;
        const photoAhead = g.course.length-g.distance < g.gameSpeed*60*2.5;
        if(photoAhead && (guidance.priority || 0) < 80) hint='GOOD DOG arch ahead · Your finish photo is automatic';
        if (g.course.recovery) {
            // The scenery and rewards carry routine decisions. Only brief
            // teaching, recovery and power feedback interrupts the run.
            hint = guidance.message || '';
        }
        const visibleHint = hint;
        this.text('runHint', visibleHint);
        const showToast = g.state === 'PLAYING' && g.toastTime > 0 && !g.portrait && !guidance.message;
        this.show('runHint', g.state === 'PLAYING' && Boolean(visibleHint) && !showToast);
        this.show('courseToast', showToast);
        if (g.toastTime > 0) this.text('courseToast', g.toast);
        if (g.state === 'COUNTDOWN') this.text('countdown', g.countdown > .7 ? Math.ceil(g.countdown) : 'Let’s go!');
    }
    drawCompanions() {
        document.querySelectorAll('.dog-choice canvas').forEach((canvas, i) => {
            const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
            Character.drawPose(ctx, this.game.dogSprites[i], 'idle', this.game.menuTime, 63, 104, 123);
        });
    }
    async downloadHomecomingPhoto(photo) {
        const status = document.getElementById('finishPhotoStatus');
        try {
            const result = await FinishPhoto.download(photo, this.game.dogSprites);
            if (photo === this.game.finishPhoto) status.textContent = result?.requested
                ? 'Photo download requested. Check your browser’s downloads.'
                : 'The photo could not download. Try Save photo again.';
        } catch (_) {
            if (photo === this.game.finishPhoto) status.textContent = 'The photo could not download. Try Save photo again.';
        }
    }
    showResult() {
        const g = this.game, finished = g.state === 'COMPLETE', practicing = g.runContext?.kind === 'practice';
        document.getElementById('runDetails').open = false;
        const hasPhoto = finished && Boolean(g.finishPhoto);
        document.getElementById('resultPanel').classList.toggle('has-finish-photo',hasPhoto);
        document.getElementById('finishMemory').classList.toggle('hidden',!hasPhoto);
        document.getElementById('downloadFinishPhoto').classList.toggle('hidden',!hasPhoto);
        if(hasPhoto) {
            const canvas=document.getElementById('finishPhotoCanvas');
            FinishPhoto.draw(canvas,g.finishPhoto,g.dogSprites);
            canvas.setAttribute('aria-label',FinishPhoto.description(g.finishPhoto));
            document.getElementById('finishPhotoStatus').textContent=g.persistence?.recordSaved === false || !g.finishPhotoSaved ? 'This finish could not be saved here. Save photo to keep it.' : 'Saved in your photo album.';
        }
        document.getElementById('resultStars').textContent = finished ? this.stars(g.result.stars) : practicing ? '↻' : '↻';
        document.getElementById('resultTitle').textContent = practicing ? (g.state === 'PRACTICE_COMPLETE' ? `${g.practice?.title || 'Section'} practiced.` : 'Give it another go.') : finished ? `Good dog, ${g.character.asset.displayName || g.character.asset.assetId}.` : 'Shake it off.';
        const dogName = g.character.asset.displayName || g.character.asset.assetId;
        document.getElementById('resultMessage').textContent = practicing ? 'Practice progress is not saved. Start the full trail when you are ready.' : finished ? g.course.recovery ? g.result.proudMoment : `${dogName} finished ${g.course.track.name}!` : g.lastFailure?.message || `You made it ${Math.floor(g.distance / g.course.length * 100)}% of the way. Watch the next obstacle and choose your takeoff.`;
        document.getElementById('resultStats').innerHTML = practicing ? `<div><strong>${(g.wallTime || g.playTime).toFixed(1)}s</strong><span>PRACTICE TIME</span></div>` : `<div><strong>${Math.floor(g.score).toLocaleString()}</strong><span>TRAIL SCORE</span></div><div><strong>${g.treats} / ${g.course.totalTreats}</strong><span>TREATS FOUND</span></div><div><strong>${g.souvenirs} / 3</strong><span>ROSETTES</span></div><div><strong>${(g.wallTime || g.playTime).toFixed(1)}s</strong><span>ON THE TRAIL</span></div><div><strong>${g.damage || 0}</strong><span>BUMPS</span></div>`;
        const goals = [[finished, 'Cross the finish line'], [finished && g.treats >= Math.ceil(g.course.totalTreats * .6), `Find at least ${Math.ceil(g.course.totalTreats * .6)} treats (60%)`], [finished && g.damage === 0, 'Finish without a damaging bump']];
        document.getElementById('starGoals').innerHTML = practicing ? '<div>Practice stays separate from trail stars, records, rosettes, and finish photos.</div>' : goals.map(([earned, text]) => `<div class="${earned ? 'earned' : ''}">${earned ? '★' : '☆'} &nbsp; ${text}</div>`).join('');
        const mastery = document.createElement('div'); mastery.className = g.souvenirs === 3 && finished ? 'earned' : '';
        mastery.textContent = `${g.souvenirs === 3 && finished ? '◆ Souvenir earned' : '◇ Rosettes'}: ${g.souvenirs}/3 · ${g.course.journey.souvenir}`;
        if (!practicing) document.getElementById('starGoals').appendChild(mastery);
        const goal = finished ? g.result.nextGoal : g.nextGoal();
        if (!practicing && goal?.label) { const nextGoal = document.createElement('div'); nextGoal.textContent = `Try next: ${goal.label}`; document.getElementById('starGoals').appendChild(nextGoal); }
        if (finished && Storage.recordsComparable(g.previousRecord, g.runContext)
            && g.previousRecord?.sections?.length === g.sectionScores.length) {
            const comparison = document.createElement('div'); comparison.className='section-comparison';
            comparison.textContent = 'Against your best score run: ' + g.sectionScores.map((n,i)=>`${g.course.sections[i].name} ${n-(g.previousRecord.sections[i]||0)>=0?'+':''}${n-(g.previousRecord.sections[i]||0)}`).join(' · ');
            document.getElementById('starGoals').appendChild(comparison);
        }
        const next = document.getElementById('nextButton'); next.classList.toggle('hidden', !finished);
        next.textContent = `Next: ${TRACKS[(g.selectedTrackIndex + 1) % TRACKS.length].name} →`;
        const practice = document.getElementById('practiceButton'), fullTrail = document.getElementById('fullTrailButton');
        practice.classList.toggle('hidden', practicing || g.state !== 'GAME_OVER' || !g.lastFailure?.practiceId);
        fullTrail.classList.toggle('hidden', !practicing);
        document.getElementById('retryButton').textContent = practicing ? 'Practice again' : finished ? 'Run again' : 'Try again';
        this.updateSelection();
    }
    static recordGroups(track, activeVersion, activeRecords, v2Records = {}) {
        const rowsFor = records => ['EASY','MEDIUM','HARD'].map(level => ({ level, modes: (activeVersion === 4 ? ['fixed'] : ['variable','fixed']).map(mode => ({ mode, record: records[Storage.recordKey(track.id,level,mode)] || null })) }));
        const archive = activeVersion === 3 && Object.keys(v2Records).some(key => key.startsWith(track.id + ':')) ? rowsFor(v2Records) : null;
        return { current: rowsFor(activeRecords), archive };
    }
    static renderRecordRows(rows, stars, includeTime = false) {
        return rows.map(({ level, modes }) => {
            const lines = modes.map(({ mode, record }) => {
                const label = mode === 'fixed' ? 'Fixed leap' : 'Tap / hold';
                if (!record) return `${label}: No run yet`;
                const time = includeTime && Number.isFinite(record.time) ? ` · ${record.time.toFixed(1)}s` : '';
                return `${label}: ${stars(record.stars)} · ${Math.floor(record.score).toLocaleString()} · ◈ ${record.souvenirs}/3${time}`;
            });
            return `<small><b>${CONFIG.DIFFICULTY[level].LABEL}</b><br>${lines.join('<br>')}</small>`;
        }).join('');
    }
    showRecords() {
        this.game.pause(); this.show('pausePanel', false);
        const buckets=Storage.getFinishPhotoBuckets();
        const photoCount = Object.values(buckets).reduce((sum, photos) => sum + (Array.isArray(photos) ? photos.length : 0), 0);
        document.getElementById('finishAlbumSummary').textContent=`Finish photo album (${photoCount})`;
        document.getElementById('finishAlbumGrid').replaceChildren();
        if(document.getElementById('finishAlbum').open) this.drawFinishAlbum();
        const recordSets = [
            {version:4,label:'New adventure · v4',records:Storage.getV4Records ? Storage.getV4Records() : Storage.getRecords(4)},
            {version:3,label:'Original adventure · v3',records:Storage.getRecords(3)},
            {version:2,label:'Earlier adventure · v2',records:Storage.getRecords(2)}
        ];
        document.getElementById('recordsList').innerHTML = recordSets.map(set => {
            const hasAny = Object.keys(set.records).length;
            const trails = TRACKS.map(track => `<section class="record-row"><strong>${track.name}</strong>${GameUI.renderRecordRows(GameUI.recordGroups(track,set.version,set.records).current,count=>this.stars(count),true)}</section>`).join('');
            return `<details ${set.version===4?'open':''}><summary>${set.label}${hasAny?'':' · no runs yet'}</summary>${trails}</details>`;
        }).join('');
        const earlierV4 = Storage.getArchivedV4Records();
        if (earlierV4.length) {
            const archive = document.createElement('details'), summary = document.createElement('summary');
            summary.textContent = 'Earlier v4 records · not comparable'; archive.appendChild(summary);
            for (const entry of earlierV4) {
                const [trackId, difficulty, control] = entry.key.split(':'), track = TRACKS.find(item => item.id === trackId);
                const line = document.createElement('p');
                line.textContent = `${track?.name || trackId} · ${CONFIG.DIFFICULTY[difficulty]?.LABEL || difficulty} · ${control === 'fixed' ? 'Fixed leap' : 'Tap / hold'}: ${this.stars(entry.record.stars)} · ${Storage.number(entry.record.score).toLocaleString()} · preserved, not comparable`;
                archive.appendChild(line);
            }
            document.getElementById('recordsList').appendChild(archive);
        }
        const earlierV3 = Storage.getArchivedV3Records();
        if (earlierV3.length) {
            const archive = document.createElement('details'), summary = document.createElement('summary');
            summary.textContent = 'Earlier Barkour Next records · not comparable'; archive.appendChild(summary);
            for (const entry of earlierV3) {
                const [trackId, difficulty, control] = entry.key.split(':'), track = TRACKS.find(item => item.id === trackId), line = document.createElement('small');
                line.textContent = `${track?.name || trackId} · ${CONFIG.DIFFICULTY[difficulty]?.LABEL || difficulty} · ${control === 'fixed' ? 'Fixed leap' : 'Tap / hold'}: ${this.stars(entry.record.stars)} · ${Math.floor(entry.record.score).toLocaleString()} · archived, not comparable`;
                archive.appendChild(line); archive.appendChild(document.createElement('br'));
            }
            document.getElementById('recordsList').appendChild(archive);
        }
        const legacy = Storage.getLegacyRecords();
        if (legacy && typeof legacy === 'object' && Object.keys(legacy).length) {
            const archive = document.createElement('details'), summary = document.createElement('summary');
            summary.textContent='Previous adventure records (v1)'; archive.appendChild(summary);
            for (const track of TRACKS) for (const level of ['EASY','MEDIUM','HARD']) {
                const r=legacy[`${track.id}:${level}`]; if (!r || typeof r!=='object') continue;
                const line=document.createElement('p'), score=Number.isFinite(r.score)?Math.floor(r.score):0;
                line.textContent=`${track.name} · ${CONFIG.DIFFICULTY[level].LABEL}: ${score.toLocaleString()} · ${Math.max(0,Math.min(3,Number(r.stars)||0))} stars`;
                archive.appendChild(line);
            }
            document.getElementById('recordsList').appendChild(archive);
        }
        this.show('recordsPanel', true); document.querySelector('.header-actions').inert = true; this.elements.adventureMenu.inert = true; this.focus('closeRecordsButton');
    }
    drawFinishAlbum() {
        const grid=document.getElementById('finishAlbumGrid');grid.replaceChildren();
        const buckets=Storage.getFinishPhotoBuckets();
        const unchangedTrail = photo => ['coast','ember'].includes(photo.track);
        const current = [...(buckets.traversal || []), ...(buckets.refined || []).filter(unchangedTrail)].sort((a,b)=>b.created-a.created);
        const groups=[['Trail memories',current],['Earlier trail memories',(buckets.refined || []).filter(photo=>!unchangedTrail(photo))],['Previous trail memories',buckets.recovery || []],['Earlier dynamic trail memories',buckets.dynamic || []],['Earlier adventure memories (v4)',buckets.next || []],['Original adventure memories (v3)',buckets.current || []],['Previous finish memories (v2)',buckets.previous || []],['Classic finish memories (v1)',buckets.classic || []]];
        if(!groups.some(([,photos])=>photos.length)){const p=document.createElement('p');p.textContent='Finish a trail to capture your first photo beneath GOOD DOG.';grid.appendChild(p);}
        for(const [label, photos] of groups) {
            if (!photos.length) continue;
            const heading=document.createElement('h3');heading.className='album-version-heading';heading.textContent=label;grid.appendChild(heading);
            for(const photo of photos){
            const card=document.createElement('figure'),canvas=document.createElement('canvas'),button=document.createElement('button');
            canvas.width=360;canvas.height=300;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',FinishPhoto.description(photo));
            FinishPhoto.draw(canvas,photo,this.game.dogSprites);
            const name=photo.petLabel || photo.dog || photo.assetId || 'finish';
            button.className='secondary-button';button.textContent=`Download ${name} · ${FinishPhoto.time(photo.seconds)} ↓`;
            button.setAttribute('aria-label',`Download photo: ${FinishPhoto.description(photo)}`);
            button.addEventListener('click',()=>this.downloadHomecomingPhoto(photo));
            if (photo.assetAvailable === false) { const note=document.createElement('figcaption');note.textContent='Archived photo · original companion art unavailable';card.append(note); }
            card.append(canvas,button);grid.appendChild(card);
            }
        }
    }

}
