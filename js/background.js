class Background {
    constructor(canvas) { this.canvas = canvas; this.track = TRACKS[0]; this.recovery = false; this.journeyProgress = 0; this.reset(); }
    reset() { this.distance = 0; this.time = 0; }
    update(travel, dt = 1 / 120) {
        if (this.reducedMotion) return;
        this.distance += travel; this.time += dt;
    }
    draw(ctx, track = this.track, distance = this.distance, time = this.time) {
        // Callers may pass explicit offsets (postcards and camera previews).
        // Reduced motion therefore also gates draw-time values.
        if (this.reducedMotion) { distance = 0; time = 0; }
        const low = Boolean(this.lowQuality);
        const w = Math.max(1800, this.viewWidth || 0), ground = CONFIG.GROUND.Y_POSITION;
        const sky = ctx.createLinearGradient(0, 0, 0, ground);
        sky.addColorStop(0, track.sky[0]); sky.addColorStop(1, track.sky[1]);
        ctx.fillStyle = sky; ctx.fillRect(0, this.skyTop || 0, w, 800 - (this.skyTop || 0));
        const sunX = 340 - distance * .004;
        const glow = ctx.createRadialGradient(sunX, 170, 15, sunX, 170, 230);
        glow.addColorStop(0, track.id === 'ember' ? '#FDEBD43D' : '#FFF5CB88'); glow.addColorStop(1, '#FFF5CB00');
        Art.ellipse(ctx, sunX, 170, 230, 230, glow);
        Art.ellipse(ctx, sunX, 170, track.id === 'ember' ? 36 : 58, track.id === 'ember' ? 36 : 58, '#FFF3D3');
        if (track.id === 'ember') {
            for (let i = 0; i < (low ? 18 : 45); i++) Art.ellipse(ctx, (i * 173 + 37) % w, 30 + (i * 53) % 245, i % 3 === 0 ? 2 : 1, 1.5, '#F7E7DCAA');
        } else {
            for (let i = 0; i < (low ? 3 : 5); i++) {
                const x = ((i * 370 - distance * .035) % 1900 + 1900) % 1900 - 150;
                const y = 115 + i % 3 * 53;
                ctx.save(); ctx.globalAlpha = .38;
                Art.ellipse(ctx, x, y, 102, 16, '#FFFDF1'); Art.ellipse(ctx, x - 20, y - 10, 45, 24, '#FFFDF1'); Art.ellipse(ctx, x + 36, y - 7, 34, 19, '#FFFDF1'); ctx.restore();
            }
        }
        for (let layer = 0; layer < 3; layer++) {
            if (track.id === 'alpine') {
                for (let i = -1; i < 7; i++) {
                    const x = i * 370 - (distance * (.025 + layer * .025)) % 370 + layer * 110;
                    const peak = 220 + layer * 100 + (Math.abs(i) % 2) * 32;
                    ctx.fillStyle = track.hills[layer]; ctx.beginPath(); ctx.moveTo(x - 250, ground);
                    ctx.lineTo(x, peak); ctx.lineTo(x + 250, ground); ctx.closePath(); ctx.fill();
                    if (layer < 2) {
                        const snowWidth = 250 * 78 / (ground - peak);
                        ctx.fillStyle = layer === 0 ? '#F3F6EF' : '#DCEBED'; ctx.beginPath();
                        ctx.moveTo(x, peak); ctx.lineTo(x + snowWidth, peak + 78);
                        ctx.lineTo(x + snowWidth * .35, peak + 59); ctx.lineTo(x + snowWidth * .1, peak + 78);
                        ctx.lineTo(x - snowWidth * .3, peak + 56); ctx.lineTo(x - snowWidth, peak + 78);
                        ctx.closePath(); ctx.fill();
                    }
                }
                continue;
            }
            const base = 370 + layer * 65, amplitude = 85 - layer * 17;
            ctx.fillStyle = track.hills[layer]; ctx.beginPath(); ctx.moveTo(0, ground);
            for (let x = -20; x <= w + 20; x += 20) {
                const sample = x + distance * (.025 + layer * .025);
                let y = base + Math.sin(sample / (230 - layer * 35) + layer * 2) * amplitude;
                if (track.id === 'texas') y = base + Math.min(.4, Math.sin(sample / 220 + layer * 2)) * amplitude;
                if (track.id === 'alpine' || track.id === 'ember') y = base - Math.abs(Math.sin(sample / 260 + layer)) * amplitude * 1.6;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, ground); ctx.closePath(); ctx.fill();
            if (track.id === 'texas' && !low) {
                // Long horizontal strata describe sandstone, below the readable silhouette.
                ctx.save(); ctx.clip();
                ctx.strokeStyle = layer === 0 ? '#F9DFC316' : '#F5D2AE20'; ctx.lineWidth = 3;
                for (let seam = 0; seam < 5; seam++) {
                    ctx.beginPath();
                    for (let x = -20; x <= w + 20; x += 40) {
                        const y = base + 28 + seam * 22 + Math.sin((x + distance * (.025 + layer * .025)) / 190 + seam) * 5;
                        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
        // Atmospheric veil softens distant edges without washing out playable objects.
        const haze = ctx.createLinearGradient(0, 360, 0, ground);
        haze.addColorStop(0, '#FFF1D300'); haze.addColorStop(.7, track.id === 'ember' ? '#C9AFC016' : '#FFF2D529'); haze.addColorStop(1, '#FFF1D300');
        ctx.fillStyle = haze; ctx.fillRect(0, 360, w, ground - 360);
        if (track.id === 'coast') {
            const sea = ctx.createLinearGradient(0, 375, 0, 600); sea.addColorStop(0, '#5FA8A9'); sea.addColorStop(1, '#91CBC0');
            ctx.fillStyle = sea; ctx.fillRect(0, 395, w, 205);
            for (let row = 0; row < (low ? 3 : 6); row++) {
                ctx.strokeStyle = row % 2 ? '#EAF0D277' : '#EAF0D244'; ctx.lineWidth = 2 + row * .5; ctx.beginPath();
                for (let x = 0; x < w + 20; x += 15) {
                    const y = 414 + row * 31 + Math.sin(x / 95 + time * .6 + row) * 5;
                    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                } ctx.stroke();
            }
        }
        if (track.id === 'forest' && this.recovery) {
            const clearing = Math.max(0, Math.min(1, (this.journeyProgress - .82) / .18));
            const trees = low ? [0, 2, 4, 6, 8, 10] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            const spacing = [0, 151, 326, 518, 701, 889, 1086, 1254, 1461, 1635, 1843, 2021];
            for (const i of trees) {
                let x = ((spacing[i] - distance * .13) % 2172 + 2172) % 2172 - 165;
                const height = 212 + [20, 76, 41, 93, 5, 60][i % 6];
                const centerWeight = Math.max(0, 1 - Math.abs(x - w * .5) / (w * .48));
                const fade = 1 - clearing * centerWeight * .88;
                x += clearing * centerWeight * (x < w * .5 ? -92 : 92);
                ctx.save(); ctx.globalAlpha = fade;
                ctx.strokeStyle = i % 3 === 0 ? '#485F50' : '#526C58'; ctx.lineWidth = 17 + i % 4 * 3; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(x, 570); ctx.quadraticCurveTo(x + (i % 2 ? 10 : -12), 468, x + (i % 3 - 1) * 7, 570 - height); ctx.stroke();
                ctx.lineWidth = 7 + i % 2 * 2;
                for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, 420 - i % 4 * 21); ctx.quadraticCurveTo(x + side * 25, 391 - i % 3 * 17, x + side * (44 + i % 3 * 8), 373 - i % 2 * 25); ctx.stroke(); }
                const crownY = 348 - i % 4 * 25;
                Art.ellipse(ctx, x - 24 - i % 2 * 8, crownY, 48 + i % 3 * 6, 54 + i % 2 * 8, i % 2 ? '#5C8065' : '#64876A');
                Art.ellipse(ctx, x + 25, crownY - 17 - i % 3 * 7, 53 + i % 2 * 5, 49 + i % 3 * 6, i % 2 ? '#6D8E6F' : '#587A61');
                Art.ellipse(ctx, x + (i % 3 - 1) * 18, crownY - 58, 43 + i % 4 * 4, 42 + i % 2 * 7, '#718F70');
                ctx.restore();
            }
            ctx.fillStyle = `rgba(255,240,176,${.055 + clearing * .055})`;
            for (let i = 0; i < 4; i++) { const spread = clearing * 34; ctx.beginPath(); ctx.moveTo(300 + i * 330 - spread, 0); ctx.lineTo(390 + i * 330 + spread, 0); ctx.lineTo(190 + i * 330 + spread, 590); ctx.lineTo(55 + i * 330 - spread, 590); ctx.fill(); }
        } else if (track.id === 'forest') {
            for (let i = 0; i < (low ? 6 : 12); i++) {
                const x = ((i * 173 - distance * .13) % 2076 + 2076) % 2076 - 170;
                const height = 220 + i % 3 * 45;
                Art.rounded(ctx, x, 565 - height, 26, height, 7, '#4F6F60');
                Art.rounded(ctx, x + 3, 566 - height, 4, height - 12, 2, '#B5C49D22');
                for (let j = 0; j < 4; j++) Art.ellipse(ctx, x + 10 + (j % 2 ? 25 : -25), 365 - i % 3 * 35 - j * 35, 73, 67, j % 2 ? '#557D64' : '#65896B');
            }
            ctx.fillStyle = '#FFF0B014';
            for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(400 + i * 290, 0); ctx.lineTo(500 + i * 290, 0); ctx.lineTo(220 + i * 290, 590); ctx.lineTo(30 + i * 290, 590); ctx.fill(); }
        } else if (track.id !== 'coast') {
            for (let i = 0; i < (low ? 3 : 7); i++) {
                const x = ((i * 287 - distance * .13) % 2009 + 2009) % 2009 - 170;
                ctx.save(); ctx.globalAlpha = .18;
                Art.obstacle(ctx, track.id === 'texas' ? 'cactus' : track.id === 'alpine' ? 'pine' : 'basalt', x, 578, 35 + i % 3 * 10, 65 + i % 3 * 20); ctx.restore();
            }
        }
        const path = ctx.createLinearGradient(0, ground, 0, 800); path.addColorStop(0, track.ground[0]); path.addColorStop(1, track.ground[1]);
        ctx.fillStyle = path; ctx.fillRect(0, ground, w, 200);
        ctx.fillStyle = track.id === 'alpine' ? '#FAFDF9' : track.id === 'forest' ? '#7E9365' : track.ground[0];
        ctx.beginPath(); ctx.moveTo(0, ground + 4);
        for (let x = 0; x <= w + 20; x += 20) ctx.lineTo(x, ground - 3 + Math.sin((x + distance) / 75) * 2);
        ctx.lineTo(w, ground + 10); ctx.lineTo(0, ground + 10); ctx.fill();
        if (this.recovery && (track.id === 'texas' || track.id === 'forest')) {
            // Two quiet, non-colliding ground-scale pockets give rest beats depth.
            // A 1600-unit repeat guarantees at most two in the 1200-unit camera.
            const offsets = track.id === 'texas' ? [190, 890] : [130, 830];
            for (let i = 0; i < offsets.length; i++) {
                const x = ((offsets[i] - distance * .32) % 1600 + 1600) % 1600 - 90;
                if (x < -90 || x > w + 90) continue;
                ctx.save(); ctx.globalAlpha = track.id === 'texas' ? .46 : .52;
                if (track.id === 'texas') {
                    const blades = low ? 3 : 5;
                    ctx.lineCap = 'round';
                    for (let blade = 0; blade < blades; blade++) {
                        const baseX = x + blade * 11, height = 17 + (blade * 7 + i * 5) % 12;
                        ctx.strokeStyle = blade % 2 ? '#8A7656' : '#68765B'; ctx.lineWidth = blade % 3 === 0 ? 3 : 2;
                        ctx.beginPath(); ctx.moveTo(baseX, ground + 1); ctx.quadraticCurveTo(baseX + 4, ground - height * .55, baseX + 12 + blade % 2 * 5, ground - height); ctx.stroke();
                    }
                    if (!low) Art.ellipse(ctx, x + 41, ground - 22, 3.5, 2, '#A98655');
                } else {
                    const fronds = low ? [-1, 1] : [-1, 0, 1];
                    for (const frond of fronds) {
                        const baseX = x + 31 + frond * 10, tipX = baseX + frond * 21, tipY = ground - 25 - (frond === 0 ? 9 : 0);
                        ctx.strokeStyle = '#526F58'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(baseX, ground + 1); ctx.quadraticCurveTo(baseX + frond * 4, ground - 18, tipX, tipY); ctx.stroke();
                        if (!low) for (let leaf = 1; leaf < 4; leaf++) {
                            const t = leaf / 4, lx = baseX + (tipX - baseX) * t, ly = ground + (tipY - ground) * t;
                            Art.ellipse(ctx, lx - 5, ly + 1, 7, 3.3, '#718A64'); Art.ellipse(ctx, lx + 5, ly - 2, 7, 3.3, '#607B5D');
                        }
                    }
                    if (!low) { Art.ellipse(ctx, x - 5, ground - 2, 8, 2.5, '#7E7450'); Art.ellipse(ctx, x + 72, ground - 3, 6, 2, '#657656'); }
                }
                ctx.restore();
            }
        }
        const tread = ctx.createLinearGradient(0, ground + 8, 0, ground + 53);
        tread.addColorStop(0, '#FFF8DB19'); tread.addColorStop(1, '#FFF8DB00');
        ctx.fillStyle = tread; ctx.fillRect(0, ground + 8, w, 45);
        if (!low) {
            // Loose strokes stay below the paws: the route has no decorative fake gaps.
            ctx.save(); ctx.translate(-distance % 160, 0);
            for (let tile = 0; tile < 11; tile++) {
                Art.grain(ctx, tile * 160, ground + 26, 160, 150, '#FFF1D423', 11);
                Art.grain(ctx, tile * 160, ground + 36, 160, 150, '#4A394114', 7);
            }
            ctx.restore();
            ctx.strokeStyle = track.id === 'alpine' ? '#BACFD22A' : '#573F4020'; ctx.lineWidth = 1.5;
            for (let i = 0; i < 10; i++) {
                const x = ((i * 181 - distance) % 1810 + 1810) % 1810 - 130;
                const y = ground + 65 + i % 3 * 46;
                ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 18, y - 3, x + 43, y + 1); ctx.stroke();
            }
        }
        for (let i = 0; i < (low ? 7 : 13); i++) {
            const x = ((i * 163 - distance) % 2119 + 2119) % 2119 - 180;
            Art.ellipse(ctx, x, 640 + i % 4 * 34, 10 + i % 3 * 7, 2, track.id === 'ember' ? '#DF9A6C44' : '#FFFFFF29');
            Art.ellipse(ctx, x + 73, 655 + i % 3 * 45, 5, 2.5, '#302A3612');
        }
        if (track.id === 'alpine' || track.id === 'ember') {
            for (let i = 0; i < (low ? 12 : 35); i++) {
                const x = ((i * 97 + time * (track.id === 'alpine' ? -15 : 8)) % w + w) % w;
                const y = ((i * 73 + time * (track.id === 'alpine' ? 28 : -12)) % 570 + 570) % 570;
                Art.ellipse(ctx, x, y, 1 + i % 3, 1 + i % 3, track.id === 'alpine' ? '#FFFFFFAA' : '#F7CB8866');
            }
        }
    }
}
