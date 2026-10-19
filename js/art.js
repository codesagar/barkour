// Smooth, resolution-independent illustration shared by the game and destination postcards.
const Art = {
    // Material colours are shared with gameplay's small break/landing particles.
    material(type, track) {
        const id = typeof track === 'string' ? track : track?.id;
        if (type === 'piston') return '#ADB7B4';
        if (['snowball', 'snowpile', 'snowbank', 'pine'].includes(type)) return '#DCEEF0';
        if (['crystal', 'phaseCrystal', 'basalt', 'emberstone'].includes(type)) return '#BC9BB7';
        if (['log', 'stump', 'spring', 'mushroom'].includes(type)) return '#B69470';
        if (type === 'cactus') return '#86A77D';
        if (type === 'tumbleweed') return '#C6A271';
        if (type === 'crab') return '#D49479';
        return { texas: '#D3A579', alpine: '#E4F0F1', coast: '#DCC79F', forest: '#A9B383', ember: '#A493A4' }[id] || '#BBA285';
    },
    ellipse(ctx, x, y, rx, ry, fill) {
        ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    },
    rounded(ctx, x, y, w, h, r, fill) {
        ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    },
    grain(ctx, x, y, w, h, color, count = 24) {
        // Fixed brush marks: no random allocations, image decoding, or shimmer.
        ctx.fillStyle = color;
        for (let i = 0; i < count; i++) {
            const px = x + ((i * 47 + 11) % 101) / 101 * w;
            const py = y + ((i * 31 + 7) % 97) / 97 * h;
            ctx.beginPath(); ctx.ellipse(px, py, 1 + i % 3 * .7, .55, -.35, 0, Math.PI * 2); ctx.fill();
        }
    },
    star(ctx, x, y, size, fill) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = -Math.PI / 2 + i * Math.PI / 5;
            const radius = i % 2 ? size * 0.46 : size;
            const px = x + Math.cos(angle) * radius, py = y + Math.sin(angle) * radius;
            if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    },
    bone(ctx, x, y, size, color = '#FFF4C8') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(-0.48);
        this.rounded(ctx, -size * 0.64, -size * 0.23, size * 1.28, size * 0.46, size * 0.2, color);
        for (const direction of [-1, 1]) for (const side of [-1, 1])
            this.ellipse(ctx, direction * size * 0.58, side * size * 0.22, size * 0.31, size * 0.31, color);
        ctx.restore();
    },
    souvenir(ctx, x, y, size = 28, track = 'texas', time = 0, recovery = false) {
        const id = typeof track === 'string' ? track : track.id;
        const tint = { texas: '#B86E42', alpine: '#568DA4', coast: '#378F8E', forest: '#658552', ember: '#977296' }[id] || '#B86E42';
        ctx.save(); ctx.translate(x, y);
        if (recovery) {
            // Small, still place marks remain legible at their 28-unit play size.
            this.ellipse(ctx, 0, 1, size * 1.02, size * 1.02, '#6A4B3938');
            this.ellipse(ctx, 0, 0, size * .94, size * .94, '#E8C879');
            this.ellipse(ctx, 0, 0, size * .77, size * .77, '#FFF3D1');
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            if (id === 'texas') {
                ctx.fillStyle = tint;
                for (let i = 0; i < 5; i++) {
                    const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
                    ctx.beginPath(); ctx.ellipse(Math.cos(a) * size * .28, Math.sin(a) * size * .28, size * .19, size * .31, a + Math.PI / 2, 0, Math.PI * 2); ctx.fill();
                }
                this.star(ctx, 0, 0, size * .22, '#F8D57A');
            } else if (id === 'alpine') {
                ctx.strokeStyle = tint; ctx.lineWidth = Math.max(2.6, size * .11);
                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3, ex = Math.cos(a) * size * .53, ey = Math.sin(a) * size * .53;
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex, ey);
                    for (const side of [-1, 1]) {
                        const ba = a + Math.PI + side * .68;
                        ctx.moveTo(ex * .66, ey * .66); ctx.lineTo(ex * .66 + Math.cos(ba) * size * .16, ey * .66 + Math.sin(ba) * size * .16);
                    }
                    ctx.stroke();
                }
            } else if (id === 'coast') {
                ctx.fillStyle = tint; ctx.beginPath(); ctx.moveTo(-size * .5, size * .32);
                ctx.quadraticCurveTo(-size * .46, -size * .42, 0, -size * .5);
                ctx.quadraticCurveTo(size * .46, -size * .42, size * .5, size * .32); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#FFF3D1'; ctx.lineWidth = Math.max(1.8, size * .075);
                for (const spread of [-.32, -.16, 0, .16, .32]) { ctx.beginPath(); ctx.moveTo(0, size * .3); ctx.lineTo(size * spread, -size * (.43 - Math.abs(spread) * .28)); ctx.stroke(); }
            } else if (id === 'forest') {
                ctx.fillStyle = '#9B6D3E'; ctx.beginPath(); ctx.moveTo(0, size * .53);
                ctx.bezierCurveTo(-size * .35, size * .36, -size * .38, -.04 * size, -size * .22, -size * .22);
                ctx.quadraticCurveTo(0, -size * .36, size * .22, -size * .22);
                ctx.bezierCurveTo(size * .38, -.04 * size, size * .35, size * .36, 0, size * .53); ctx.fill();
                ctx.fillStyle = tint; ctx.beginPath(); ctx.moveTo(-size * .35, -size * .16); ctx.quadraticCurveTo(0, -size * .5, size * .35, -size * .16); ctx.lineTo(size * .27, size * .02); ctx.quadraticCurveTo(0, -size * .1, -size * .27, size * .02); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#5A6548'; ctx.lineWidth = Math.max(2, size * .08); ctx.beginPath(); ctx.moveTo(size * .05, -size * .4); ctx.quadraticCurveTo(size * .1, -size * .56, size * .2, -size * .59); ctx.stroke();
            } else {
                ctx.fillStyle = tint; ctx.beginPath(); ctx.moveTo(0, -size * .57); ctx.lineTo(size * .45, -size * .2); ctx.lineTo(size * .34, size * .43); ctx.lineTo(0, size * .57); ctx.lineTo(-size * .34, size * .43); ctx.lineTo(-size * .45, -size * .2); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#CDBDE1'; ctx.beginPath(); ctx.moveTo(0, -size * .57); ctx.lineTo(0, size * .57); ctx.lineTo(-size * .34, size * .43); ctx.lineTo(-size * .45, -size * .2); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#F4D8F0'; ctx.beginPath(); ctx.moveTo(0, -size * .57); ctx.lineTo(size * .45, -size * .2); ctx.lineTo(0, size * .05); ctx.lineTo(-size * .45, -size * .2); ctx.closePath(); ctx.fill();
            }
            ctx.strokeStyle = '#7A5B3F'; ctx.lineWidth = Math.max(1.4, size * .055); ctx.beginPath(); ctx.arc(0, 0, size * .77, 0, Math.PI * 2); ctx.stroke();
            ctx.restore(); return;
        }
        // A permanent scalloped seal and ribbon distinguish mastery from treats.
        ctx.fillStyle = '#F5D27A'; ctx.beginPath();
        for (let i = 0; i < 24; i++) {
            const a = i * Math.PI / 12, r = size * (i % 2 ? .93 : 1.08);
            if (!i) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
        this.ellipse(ctx, 0, 0, size * .81, size * .81, '#FFF6D8');
        this.ellipse(ctx, 0, 0, size * .68, size * .68, tint);
        if (id === 'texas') this.star(ctx, 0, 0, size * .5, '#FFF1C3');
        else if (id === 'alpine') {
            ctx.strokeStyle = '#F1FAF5'; ctx.lineWidth = 2.4;
            for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -size * .48); ctx.moveTo(0, -size * .26); ctx.lineTo(-size * .13, -size * .37); ctx.stroke(); }
        } else if (id === 'coast') {
            ctx.strokeStyle = '#FFF1C3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, size * .37, Math.PI * .9, Math.PI * 2.4); ctx.stroke();
        } else if (id === 'forest') {
            this.ellipse(ctx, 0, 0, size * .24, size * .48, '#E8EFC0');
            ctx.strokeStyle = tint; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, size * .4); ctx.lineTo(0, -size * .3); ctx.stroke();
        } else this.star(ctx, 0, 0, size * .48, '#F4D8F0');
        ctx.strokeStyle = '#FFF7DC'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-2, -2, size * .91, Math.PI * 1.05, Math.PI * 1.64); ctx.stroke();
        ctx.restore();
    },
    launch(ctx, x, ground, width = 110, kind = 'spring', ready = true, surface = {}, recovery = false) {
        ctx.save(); ctx.translate(x, ground);
        if (kind === 'pipeline' || kind === 'photo') {
            // These surfaces apply an impulse, so they read as spring-loaded
            // launchers rather than painted inclines the dog never climbs.
            const pipe = kind === 'pipeline', deckY = ready ? -27 : -17;
            const accent = pipe ? '#B76543' : '#D39A36', dark = pipe ? '#6D4138' : '#6C5131';
            this.ellipse(ctx, 4, 5, width * .6, 8, '#263C3330');
            this.rounded(ctx,-width*.48,-8,width*.96,10,5,dark);
            ctx.strokeStyle=ready?'#EAC17A':'#987C56';ctx.lineWidth=5;ctx.lineCap='round';
            for(const offset of [-width*.28,0,width*.28]){
                ctx.beginPath();ctx.moveTo(offset-11,-9);ctx.lineTo(offset-4,deckY+11);ctx.lineTo(offset+4,-9);ctx.lineTo(offset+11,deckY+11);ctx.stroke();
            }
            const deck=ctx.createLinearGradient(0,deckY,0,deckY+18);deck.addColorStop(0,pipe?'#E6A36D':'#F0C45D');deck.addColorStop(1,accent);
            this.rounded(ctx,-width/2,deckY,width,18,9,deck);
            ctx.strokeStyle='#FFF1C8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-width*.36,deckY+5);ctx.lineTo(width*.36,deckY+5);ctx.stroke();
            ctx.fillStyle='#FFF6D9';ctx.font='800 12px system-ui';ctx.textAlign='center';ctx.fillText(pipe?'PIPE SPRING':'PHOTO SPRING',0,deckY+15);
            ctx.strokeStyle='#FFF1C8';ctx.lineWidth=3.5;
            for(const offset of [-width*.25,0,width*.25]){ctx.beginPath();ctx.moveTo(offset-7,deckY-7);ctx.lineTo(offset,deckY-14);ctx.lineTo(offset+7,deckY-7);ctx.stroke();}
            if(!ready){ctx.strokeStyle='#F7D78B';ctx.lineWidth=3;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*width*.54,-19);ctx.lineTo(side*width*.66,-31);ctx.stroke();}}
            ctx.restore(); return;
        }
        this.ellipse(ctx, 4, 3, width * .55, 5, '#263C3320');
        const snow = kind === 'snowbank' || kind === 'snow';
        const compression = Math.min(1, surface.compression || 0), rebound = Math.min(1, surface.rebound || 0);
        if (compression || rebound) ctx.translate(0, compression * 10 - rebound * 12);
        if (recovery && kind === 'snow-ramp') {
            // One directional powder face: flush approach, high flexible lip.
            const press = compression * 9 - rebound * 6, left = -width * .52, right = width * .52;
            ctx.fillStyle = '#BED9DF'; ctx.beginPath(); ctx.moveTo(left, 1); ctx.lineTo(right, 1);
            ctx.lineTo(right, -36 + press); ctx.quadraticCurveTo(width * .28, -43 + press, width * .05, -25 + press);
            ctx.quadraticCurveTo(-width * .23, -6, left, 1); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#F8FCF8'; ctx.beginPath(); ctx.moveTo(left + 5, -1);
            ctx.quadraticCurveTo(-width * .18, -7, width * .08, -28 + press);
            ctx.quadraticCurveTo(width * .3, -45 + press, right - 3, -37 + press);
            ctx.lineTo(right - 3, -29 + press); ctx.quadraticCurveTo(width * .26, -35 + press, width * .04, -20 + press);
            ctx.quadraticCurveTo(-width * .24, -3, left + 5, -1); ctx.fill();
            ctx.strokeStyle = ready ? '#70A9B7' : '#9DB9BE'; ctx.lineWidth = 3; ctx.beginPath();
            ctx.moveTo(-width * .38, -3); ctx.quadraticCurveTo(width * .03, -13, width * .39, -37 + press); ctx.stroke();
            if (ready) { ctx.strokeStyle = '#D9F1F0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(right - 10, -46 + press); ctx.quadraticCurveTo(right + 4, -42 + press, right + 12, -33 + press); ctx.stroke(); }
            ctx.restore(); return;
        }
        if (recovery && kind === 'log-ramp') {
            const press = compression * 8 - rebound * 5, left = -width * .52, right = width * .52;
            ctx.strokeStyle = '#5F483A'; ctx.lineWidth = 25; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(left, -5); ctx.quadraticCurveTo(-width * .05, -15, right, -39 + press); ctx.stroke();
            ctx.strokeStyle = '#987658'; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(left, -8); ctx.quadraticCurveTo(-width * .05, -18, right, -42 + press); ctx.stroke();
            ctx.strokeStyle = '#C4A77B'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(left + 12, -14); ctx.quadraticCurveTo(0, -22, right - 8, -45 + press); ctx.stroke();
            ctx.strokeStyle = '#516044'; ctx.lineWidth = 7; for (const dx of [-width * .28, width * .27]) { ctx.beginPath(); ctx.moveTo(dx, -10); ctx.quadraticCurveTo(dx - 8, -3, dx - 18, 1); ctx.stroke(); }
            if (ready) { this.ellipse(ctx, right - 5, -45 + press, 13, 6, '#80946A'); this.ellipse(ctx, right + 7, -49 + press, 10, 5, '#93A878'); }
            ctx.restore(); return;
        }
        if (recovery && snow) {
            // A wind-packed powder lip reads as terrain, not a mechanical pad.
            const lift = ready ? 0 : 5;
            ctx.fillStyle = '#D5E8E9'; ctx.beginPath(); ctx.moveTo(-width * .56, 1);
            ctx.quadraticCurveTo(-width * .2, -11 + lift, width * .02, -22 + lift);
            ctx.quadraticCurveTo(width * .28, -31 + lift, width * .56, -11 + lift);
            ctx.lineTo(width * .58, 3); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#F8FCF8'; ctx.beginPath(); ctx.moveTo(-width * .52, -2);
            ctx.quadraticCurveTo(-width * .12, -12 + lift, width * .05, -25 + lift);
            ctx.quadraticCurveTo(width * .29, -28 + lift, width * .51, -12 + lift);
            ctx.quadraticCurveTo(width * .16, -15 + lift, -width * .52, -2); ctx.fill();
            ctx.strokeStyle = '#9FC6CE'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(-width * .43, -2); ctx.quadraticCurveTo(width * .03, -15 + lift, width * .43, -11 + lift); ctx.stroke();
            ctx.restore(); return;
        }
        if (recovery && !snow) {
            // The elastic surface is a broad mushroom cap with a rooted stem.
            const squash = compression * 7 - rebound * 4;
            this.rounded(ctx, -11, -22 + squash, 22, 24 - squash * .25, 8, '#CBBE9F');
            ctx.fillStyle = '#A85F58'; ctx.beginPath(); ctx.moveTo(-width * .51, -11 + squash);
            ctx.bezierCurveTo(-width * .38, -51 + squash, width * .37, -51 + squash, width * .51, -11 + squash);
            ctx.quadraticCurveTo(0, 2 + squash, -width * .51, -10 + squash); ctx.fill();
            ctx.fillStyle = '#CBA78D'; ctx.beginPath(); ctx.moveTo(-width * .47, -9 + squash);
            ctx.quadraticCurveTo(0, -1 + squash, width * .47, -9 + squash); ctx.quadraticCurveTo(0, 7 + squash, -width * .47, -9 + squash); ctx.fill();
            for (const [px, py, r] of [[-.26,-.23,5],[.04,-.29,4],[.28,-.18,5]]) this.ellipse(ctx, width * px, width * py + squash, r, r * .65, '#EBD8BB');
            ctx.restore(); return;
        }
        if (!snow) {
            ctx.strokeStyle='#769269';ctx.lineWidth=4;
            for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*width*.38,0);ctx.quadraticCurveTo(side*width*.20,-30+compression*16-rebound*10,0,-16);ctx.stroke();}
        }
        this.rounded(ctx, -width / 2, -13, width, 15, 7, snow ? '#BEDAE0' : '#658469');
        this.rounded(ctx, -width / 2 + 3, -17, width - 6, 9, 5, snow ? '#F5FCF9' : '#B4CEA0');
        ctx.strokeStyle = ready ? (snow ? '#3F8296' : '#385B45') : '#8A9D93'; ctx.lineWidth = 3.5;
        for (const offset of [-width * .25, 0, width * .25]) {
            ctx.beginPath(); ctx.moveTo(offset - 7, -23); ctx.lineTo(offset, -30); ctx.lineTo(offset + 7, -23); ctx.stroke();
        }
        ctx.restore();
    },
    platform(ctx, start, end, top, style = 'pipeline', segmentIndex = 0, time = 0, reduced = false, recovery = false) {
        if (end <= start) return;
        ctx.save();
        const width = end - start, center = (start + end) / 2;
        if (recovery && style === 'snow-shelf') {
            // The bright top edge is the exact supported collision plane.
            this.ellipse(ctx, center, 603, Math.max(64, width * .46), 8, '#46667320');
            ctx.fillStyle = '#B7D1D7'; ctx.beginPath(); ctx.moveTo(start, top + 2); ctx.lineTo(end, top + 2);
            ctx.lineTo(end - 18, 585); ctx.quadraticCurveTo(center, 604, start + 18, 585); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#EAF4F2'; ctx.beginPath(); ctx.moveTo(start, top); ctx.lineTo(end, top);
            ctx.quadraticCurveTo(end - 31, top + 18, center, top + 13); ctx.quadraticCurveTo(start + 28, top + 18, start, top); ctx.fill();
            ctx.strokeStyle = '#FAFDF8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(start + 3, top); ctx.lineTo(end - 3, top); ctx.stroke();
            ctx.strokeStyle = '#8FB7C1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(start + 20, top + 16); ctx.quadraticCurveTo(center, top + 26, end - 22, top + 15); ctx.stroke();
            ctx.restore(); return;
        }
        if (recovery && style === 'log-ledge') {
            // A thick fallen timber with visible roots; its upper edge is `top`.
            const supportX = segmentIndex ? end - 34 : start + 34;
            ctx.strokeStyle = '#554438'; ctx.lineWidth = 29; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(supportX, 590); ctx.quadraticCurveTo(supportX + (segmentIndex ? -18 : 18), top + 62, supportX, top + 14); ctx.stroke();
            ctx.strokeStyle = '#765A45'; ctx.lineWidth = 31; ctx.beginPath(); ctx.moveTo(start + 7, top + 17); ctx.quadraticCurveTo(center, top + 8, end - 7, top + 19); ctx.stroke();
            ctx.strokeStyle = '#B38D62'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(start + 10, top); ctx.quadraticCurveTo(center, top - 2, end - 10, top + 1); ctx.stroke();
            ctx.strokeStyle = '#4B4938'; ctx.lineWidth = 7; for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(supportX, 584); ctx.quadraticCurveTo(supportX + side * 22, 590, supportX + side * 47, 600); ctx.stroke(); }
            for (const px of [start + 24, end - 27]) { this.ellipse(ctx, px, top - 5, 21, 10, '#74845D'); this.ellipse(ctx, px + (px < center ? 14 : -14), top - 12, 14, 8, '#8A9B6D'); }
            ctx.restore(); return;
        }
        if (style === 'canopy' && recovery) {
            // Thick living branches connect visibly to the forest floor. Their
            // upper edge is the exact collision plane at `top`.
            const trunkX = segmentIndex ? end - 38 : start + 38;
            ctx.strokeStyle = '#5D5741'; ctx.lineWidth = 42; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(trunkX, 594); ctx.quadraticCurveTo(trunkX + (segmentIndex ? 13 : -13), top + 64, trunkX + (segmentIndex ? -8 : 8), top + 16); ctx.stroke();
            ctx.strokeStyle = '#7A6848'; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(start + 8, top + 18);
            ctx.quadraticCurveTo(center, top - 6 + (segmentIndex ? 3 : -2), end - 8, top + 15); ctx.stroke();
            ctx.strokeStyle = '#A8B982'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(start + 12, top); ctx.lineTo(end - 12, top); ctx.stroke();
            ctx.strokeStyle='#4F4737';ctx.lineWidth=2;
            for (const px of [start + width * .3, start + width * .7]) { ctx.beginPath(); ctx.ellipse(px, top + 14, 8, 4, -.2, 0, Math.PI * 2); ctx.stroke(); }
            for (const px of [start + 28, end - 30]) { this.ellipse(ctx, px, top - 6, 24, 12, '#718C5A'); this.ellipse(ctx, px + (px < center ? 18 : -18), top - 14, 17, 10, '#829B67'); }
            ctx.strokeStyle = '#4E4938'; ctx.lineWidth = 7;
            for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(trunkX, 586); ctx.quadraticCurveTo(trunkX + side * 23, 590, trunkX + side * 48, 600); ctx.stroke(); }
            ctx.restore(); return;
        }
        if (style === 'canopy') {
            // The landing deck is at the actual support y. Ropes sway with its
            // authored motion; they never imply a different collision plane.
            for(const x of [start+18,end-18]){ctx.strokeStyle='#566D4A';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,top-220);ctx.quadraticCurveTo(x+(segmentIndex?16:-16)+(reduced?0:Math.sin(time*1.6+segmentIndex)*8),top-110,x,top+12);ctx.stroke();}
            this.rounded(ctx,start,top,width,22,10,'#84674A');
            this.rounded(ctx,start,top,width,6,3,'#BDCEA0');
            ctx.strokeStyle='#ADC38A';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(start,top+9);ctx.quadraticCurveTo(center,top+32,end,top+9);ctx.stroke();
            for(let x=start+15;x<end;x+=35){this.ellipse(ctx,x,top+16,16,6,'#79955D');}
            ctx.fillStyle='#F5F0C6';ctx.font='800 13px system-ui';ctx.textAlign='center';ctx.fillText(segmentIndex?'LANDING BRANCH':'CANOPY →',center,top+17);
            ctx.restore();return;
        }
        this.ellipse(ctx, center + 8, 606, Math.max(50,width * .42), 10, '#2B352F22');
        ctx.strokeStyle='#624B42';ctx.lineWidth=9;ctx.globalAlpha=.62;
        for(const x of [start+width*.22,start+width*.78]){ctx.beginPath();ctx.moveTo(x,top+34);ctx.lineTo(x+(segmentIndex?20:-20),590);ctx.stroke();}
        ctx.globalAlpha=1;
        const body=ctx.createLinearGradient(0,top,0,top+48);body.addColorStop(0,'#E29A67');body.addColorStop(.46,'#A85D45');body.addColorStop(1,'#6F443E');
        this.rounded(ctx,start,top,width,44,20,body);
        ctx.fillStyle='#F6C48B';ctx.fillRect(start+18,top+6,Math.max(0,width-36),6);
        ctx.strokeStyle='#6A4139';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(start+20,top+39);ctx.lineTo(end-20,top+39);ctx.stroke();
        for(const x of [start+26,end-26]){this.ellipse(ctx,x,top+22,19,21,'#71463D');this.ellipse(ctx,x-4,top+17,10,11,'#C77A54');}
        if(segmentIndex===0){ctx.fillStyle='#FFF1C9';ctx.font='800 14px system-ui';ctx.textAlign='left';ctx.fillText('RUN →',start+34,top+33);
            ctx.textAlign='right';ctx.fillText('LEAP ↑',end-28,top-14);}
        else {ctx.fillStyle='#FFF1C9';ctx.font='800 14px system-ui';ctx.textAlign='right';ctx.fillText('LAND!',end-34,top+33);}
        ctx.restore();
    },
    finishGate(ctx, x, ground = 600, accent = '#BD633F', options = {}) {
        ctx.save();
        const bannerTop=ground-414,bannerHeight=82,tapeY=ground-116,poleX=154;
        this.ellipse(ctx,x+5,ground+5,205,10,'#263C3328');
        // A checked stripe grounds the finish plane even when the runner is airborne.
        for(let column=-5;column<6;column++)for(let row=0;row<2;row++){
            ctx.fillStyle=(column+row)%2?'#FFF4D3':'#355A4D';ctx.fillRect(x+column*18,ground-13+row*7,18,7);
        }
        for(const side of [-1,1]){
            this.rounded(ctx,x+side*poleX-7,bannerTop+30,14,ground-bannerTop-30,7,'#F8EDD0');
            this.ellipse(ctx,x+side*poleX,bannerTop+24,12,12,'#E8C47A');
            for(let row=0;row<4;row++){
                ctx.fillStyle=row%2?'#355A4D':accent;ctx.fillRect(x+side*poleX-7,ground-92+row*19,14,19);
            }
        }
        const banner=ctx.createLinearGradient(x-142,bannerTop,x+142,bannerTop+bannerHeight);banner.addColorStop(0,accent);banner.addColorStop(1,'#D99B5C');
        this.rounded(ctx,x-144,bannerTop,288,bannerHeight,13,banner);
        ctx.strokeStyle='#FFF0C7';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x-137,bannerTop+7,274,bannerHeight-14,9);ctx.stroke();
        ctx.fillStyle='#FFF4D3';ctx.font='800 13px system-ui';ctx.textAlign='center';ctx.fillText('FINISH LINE',x,bannerTop+25);
        ctx.font='800 31px system-ui';ctx.fillText('GOOD DOG!',x,bannerTop+61);
        // Break-through tape sits in the action plane and is painted before the
        // dog, so the captured runner always remains the hero.
        ctx.strokeStyle='#FFF4D3';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(x-poleX+8,tapeY);ctx.quadraticCurveTo(x,tapeY+14,x+poleX-8,tapeY);ctx.stroke();
        ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.setLineDash([12,11]);ctx.beginPath();ctx.moveTo(x-poleX+9,tapeY);ctx.quadraticCurveTo(x,tapeY+14,x+poleX-9,tapeY);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='#6B4A34';ctx.font='800 11px system-ui';
        for(const offset of [-82,0,82])ctx.fillText('FINISH',x+offset,tapeY+5);
        // Small checked flags make the structure unmistakably a race finish.
        for(const side of [-1,1]){
            const flagX=x+side*(poleX+2),flagY=bannerTop+30,dir=side;
            ctx.fillStyle='#FFF4D3';ctx.fillRect(flagX,flagY,dir*66,42);
            for(let row=0;row<3;row++)for(let column=0;column<4;column++)if((row+column)%2===0){ctx.fillStyle='#355A4D';ctx.fillRect(flagX+dir*column*16,flagY+row*14,dir*16,14);}
        }
        if(options.celebrate){
            const colors=['#F4C966','#7BA58D',accent,'#FFF0C7'];
            for(let i=0;i<18;i++){
                const side=i%2?-1:1,px=x+side*(188+(i*29)%126),py=bannerTop+38+(i*47)%214;
                ctx.save();ctx.translate(px,py);ctx.rotate((i%5-2)*.28);ctx.fillStyle=colors[i%colors.length];ctx.fillRect(-5,-2,10,5);ctx.restore();
            }
        }
        ctx.restore();
    },
    phaseCue(ctx, x, ground, width, height, active, warning = false) {
        ctx.save();
        ctx.strokeStyle = active ? '#F6CC87' : warning ? '#F9E3B7' : '#A7D8C8';
        ctx.lineWidth = active ? 3 : 2;
        if (!active) ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.roundRect(x - width * .63, ground - height - 9, width * 1.26, height + 12, 9); ctx.stroke();
        ctx.setLineDash([]);
        // State is encoded in both geometry and colour; no flashing is needed.
        if (active || warning) {
            this.rounded(ctx, x - 2, ground - height - 26, 4, 10, 2, ctx.strokeStyle);
            this.ellipse(ctx, x, ground - height - 12, 2, 2, ctx.strokeStyle);
        } else {
            ctx.beginPath(); ctx.moveTo(x - 6, ground - height - 19); ctx.lineTo(x - 1, ground - height - 14); ctx.lineTo(x + 8, ground - height - 24); ctx.stroke();
        }
        ctx.restore();
    },
    power(ctx, type, x, y, size, time = 0) {
        const color = CONFIG.POWERS[type].color;
        ctx.save(); ctx.translate(x, y);
        const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, size * 1.65);
        glow.addColorStop(0, color + '88'); glow.addColorStop(1, color + '00');
        this.ellipse(ctx, 0, 0, size * 1.65, size * 1.65, glow);
        this.ellipse(ctx, 0, 0, size, size, '#FFF9EA');
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, size + 4, time, time + Math.PI * 1.5); ctx.stroke();
        if (type === 'star') this.star(ctx, 0, 0, size * 0.72, '#DEA139');
        if (type === 'shield') {
            ctx.fillStyle = '#4CAEC4'; ctx.beginPath(); ctx.moveTo(-size * .52, -size * .5); ctx.lineTo(0, -size * .68);
            ctx.lineTo(size * .52, -size * .5); ctx.quadraticCurveTo(size * .65, size * .32, 0, size * .68);
            ctx.quadraticCurveTo(-size * .65, size * .32, -size * .52, -size * .5); ctx.fill();
            ctx.strokeStyle = '#E6FCF9'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-size * .25, 0); ctx.lineTo(-size * .05, size * .22); ctx.lineTo(size * .3, -size * .25); ctx.stroke();
        }
        if (type === 'magnet') {
            ctx.strokeStyle = '#B46BBE'; ctx.lineWidth = size * .34; ctx.lineCap = 'round'; ctx.beginPath();
            ctx.moveTo(-size * .4, -size * .4); ctx.lineTo(-size * .4, size * .08); ctx.arc(0, size * .08, size * .4, Math.PI, 0, true); ctx.lineTo(size * .4, -size * .4); ctx.stroke();
        }
        ctx.restore();
    },
    texasLandmark(ctx, style, x, ground = 600, recovery = false) {
        ctx.save();
        if (recovery && /^(powder|cornice|summit)/.test(style)) {
            ctx.globalAlpha = .7;
            ctx.fillStyle = '#D7E9E9'; ctx.beginPath(); ctx.moveTo(x - 210, ground);
            ctx.quadraticCurveTo(x - 135, ground - 35, x - 62, ground - 19);
            ctx.quadraticCurveTo(x + 28, ground - 48, x + 210, ground - 8); ctx.lineTo(x + 210, ground); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#F8FCF7'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 194, ground - 5);
            ctx.quadraticCurveTo(x - 117, ground - 34, x - 60, ground - 19); ctx.quadraticCurveTo(x + 38, ground - 47, x + 190, ground - 11); ctx.stroke();
            if (/summit/.test(style)) { ctx.strokeStyle='#D6B65F';ctx.lineWidth=4;for(const dx of [-42,42]){ctx.beginPath();ctx.moveTo(x+dx,ground-12);ctx.lineTo(x+dx,ground-92);ctx.stroke();} }
        } else if (recovery && /^(moss|branch|forest)/.test(style)) {
            ctx.globalAlpha = .72; ctx.strokeStyle = '#5D6044'; ctx.lineWidth = 19; ctx.lineCap = 'round';
            for (const dx of [-142, 128]) { ctx.beginPath(); ctx.moveTo(x + dx, ground - 3); ctx.quadraticCurveTo(x + dx + 16, ground - 92, x + dx - 8, ground - 158); ctx.stroke(); }
            ctx.strokeStyle='#879D65';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-170,ground-155);ctx.quadraticCurveTo(x,ground-196,x+172,ground-148);ctx.stroke();
            for(const dx of [-145,-72,4,78,145]) this.ellipse(ctx,x+dx,ground-166-(dx%3)*5,30,17,dx%2?'#718A5B':'#809767');
        } else if (recovery && /^(shore|tide|drift|coast|sunset)/.test(style)) {
            ctx.globalAlpha=.68;ctx.strokeStyle='#D7E7CB';ctx.lineWidth=3;
            ctx.beginPath();ctx.moveTo(x-220,ground-16);ctx.bezierCurveTo(x-130,ground-34,x-42,ground-4,x+40,ground-18);ctx.bezierCurveTo(x+118,ground-34,x+175,ground-9,x+220,ground-20);ctx.stroke();
            if(/drift|sunset/.test(style)){ctx.strokeStyle='#9B8061';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x-88,ground-22);ctx.quadraticCurveTo(x,ground-42,x+94,ground-18);ctx.stroke();}
        } else if (recovery && /^(ember|prism)/.test(style)) {
            ctx.globalAlpha=.64;ctx.fillStyle='#5C5669';ctx.beginPath();ctx.moveTo(x-205,ground);ctx.lineTo(x-145,ground-70);ctx.lineTo(x-78,ground-36);ctx.lineTo(x-18,ground-88);ctx.lineTo(x+55,ground-42);ctx.lineTo(x+128,ground-76);ctx.lineTo(x+205,ground);ctx.closePath();ctx.fill();
            ctx.strokeStyle='#B28DA6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-136,ground-16);ctx.lineTo(x-78,ground-28);ctx.lineTo(x-12,ground-13);ctx.lineTo(x+54,ground-32);ctx.lineTo(x+131,ground-18);ctx.stroke();
        } else if (recovery && ['dry-wash','wind-sage','sage-rest','open-range','windbreak','wind-brush','golden-hour-finish'].includes(style)) {
            // Low natural marks belong to the landscape and never imply a
            // second collision plane.
            if (style === 'dry-wash') {
                ctx.globalAlpha = .64; ctx.strokeStyle = '#996449'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(x - 230, ground - 8);
                ctx.bezierCurveTo(x - 142, ground - 28, x - 74, ground + 2, x + 15, ground - 14);
                ctx.bezierCurveTo(x + 93, ground - 28, x + 162, ground - 3, x + 235, ground - 18); ctx.stroke();
                ctx.strokeStyle = '#EFC993'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x - 197, ground - 5); ctx.quadraticCurveTo(x - 62, ground - 18, x + 70, ground - 8); ctx.stroke();
            }
            const clumps = style === 'dry-wash' ? [-190, 174] : [-176, -72, 54, 166];
            for (let i = 0; i < clumps.length; i++) {
                const px = x + clumps[i], scale = .72 + i % 3 * .16;
                ctx.strokeStyle = i % 2 ? '#6F7753' : '#81835A'; ctx.lineWidth = 3;
                for (let blade = -2; blade <= 2; blade++) {
                    ctx.beginPath(); ctx.moveTo(px, ground - 3);
                    ctx.quadraticCurveTo(px + blade * 6, ground - 25 * scale, px + blade * 12, ground - (35 + Math.abs(blade) * 4) * scale); ctx.stroke();
                }
                this.ellipse(ctx, px, ground - 7, 18 * scale, 6, '#67563E35');
            }
            if (style === 'windbreak') {
                ctx.strokeStyle = '#E8C889'; ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 84 + i * 18, ground - 92 - i * 15); ctx.quadraticCurveTo(x + 4, ground - 105 - i * 13, x + 96 + i * 10, ground - 88 - i * 15); ctx.stroke(); }
            }
            if (style === 'golden-hour-finish') {
                ctx.globalAlpha = .44; ctx.strokeStyle = '#F5D895'; ctx.lineWidth = 3;
                for (const offset of [-96, 0, 96]) { ctx.beginPath(); ctx.moveTo(x + offset - 24, ground - 118); ctx.lineTo(x + offset + 24, ground - 118); ctx.stroke(); }
            }
        } else if (style === 'bridge') {
            // Distant rails frame the leap but never resemble a traversable deck.
            ctx.strokeStyle='#8B5945';ctx.lineWidth=5;ctx.globalAlpha=.72;
            ctx.beginPath();ctx.moveTo(x-220,ground-155);ctx.lineTo(x+220,ground-155);ctx.stroke();
            for(const post of [-180,-90,0,90,180]) { ctx.beginPath();ctx.moveTo(x+post,ground-155);ctx.lineTo(x+post,ground-66);ctx.stroke(); }
        } else if (style === 'arch') {
            ctx.strokeStyle='#E8B34E';ctx.lineWidth=12;ctx.globalAlpha=.88;
            ctx.beginPath();ctx.arc(x,ground-18,112,Math.PI,0);ctx.stroke();
            ctx.lineWidth=5;ctx.strokeStyle='#FFF0B4';ctx.beginPath();ctx.arc(x,ground-18,104,Math.PI,0);ctx.stroke();
        } else if (style === 'big-sky') {
            ctx.strokeStyle='#F5D895';ctx.lineWidth=3;ctx.globalAlpha=.7;
            for(const offset of [-90,0,90]) { ctx.beginPath();ctx.moveTo(x+offset-22,ground-205);ctx.lineTo(x+offset+22,ground-205);ctx.stroke(); }
        } else if (style === 'stampede') {
            ctx.strokeStyle='#C98552';ctx.lineWidth=3;ctx.globalAlpha=.5;
            for(const offset of [-95,-45,10,65,120]) { ctx.beginPath();ctx.moveTo(x+offset,ground-35);ctx.lineTo(x+offset-24,ground-9);ctx.stroke(); }
        } else if (style === 'alpine-descent' || style === 'avalanche' || style === 'summit') {
            ctx.globalAlpha=.66; ctx.strokeStyle = style === 'avalanche' ? '#F8FCFF' : '#8FB8CC'; ctx.lineWidth=5;
            ctx.beginPath();ctx.moveTo(x-175,ground-145);ctx.lineTo(x-55,ground-210);ctx.lineTo(x+55,ground-148);ctx.lineTo(x+180,ground-224);ctx.stroke();
            if (style === 'summit') { ctx.strokeStyle='#E9C75F'; for (const offset of [-42,0,42]) { ctx.beginPath();ctx.moveTo(x+offset,ground-15);ctx.lineTo(x+offset,ground-110);ctx.stroke(); } }
        } else if (style === 'shore' || style === 'pier' || style === 'sunset-pier') {
            ctx.globalAlpha=.62; ctx.strokeStyle=style === 'pier' ? '#9A7048' : '#EAD59A'; ctx.lineWidth=5;
            ctx.beginPath();ctx.moveTo(x-190,ground-98);ctx.quadraticCurveTo(x-80,ground-145,x+10,ground-94);ctx.quadraticCurveTo(x+110,ground-43,x+205,ground-103);ctx.stroke();
            if (style !== 'shore') for (const offset of [-120,-35,50,135]) { ctx.beginPath();ctx.moveTo(x+offset,ground-18);ctx.lineTo(x+offset,ground-110);ctx.stroke(); }
        } else if (style === 'mossy-floor' || style === 'canopy-bound' || style === 'forest-opening') {
            ctx.globalAlpha=.58;ctx.strokeStyle='#466D4E';ctx.lineWidth=8;
            for (const offset of [-155,-70,30,125]) { ctx.beginPath();ctx.moveTo(x+offset,ground-12);ctx.lineTo(x+offset+18,ground-178);ctx.stroke(); }
            ctx.strokeStyle='#A7C66A';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-205,ground-174);ctx.quadraticCurveTo(x,ground-255,x+205,ground-160);ctx.stroke();
        } else if (style === 'ember-rest' || style === 'prism-break' || style === 'prism-resolve') {
            ctx.globalAlpha=.66;ctx.strokeStyle=style === 'prism-break' ? '#F0A26A' : '#B89BE2';ctx.lineWidth=5;
            for (const offset of [-92,0,92]) { ctx.beginPath();ctx.moveTo(x+offset,ground-12);ctx.lineTo(x+offset+28,ground-125);ctx.lineTo(x+offset+58,ground-12);ctx.stroke(); }
        }
        ctx.restore();
    },
    stampedeSign(ctx, x, ground = 600, label = 'SUPER PAWS') {
        // A painted roadside cue names the temporary rule before the power is reachable.
        ctx.save();
        this.rounded(ctx, x - 72, ground - 170, 144, 48, 8, '#F8EBC4');
        ctx.strokeStyle = '#9A633F'; ctx.lineWidth = 3; ctx.strokeRect(x - 72, ground - 170, 144, 48);
        this.rounded(ctx, x - 4, ground - 122, 8, 122, 3, '#8B5945');
        ctx.fillStyle = '#7A4935'; ctx.font = '700 14px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(label, x, ground - 150);
        this.star(ctx, x + 52, ground - 149, 8, '#D89B36');
        ctx.restore();
    },
    stampedeFenceCue(ctx, x, ground, width, height, powered) {
        ctx.save();
        // The gold mark says "breakable while powered"; it does not change the fence bounds.
        ctx.strokeStyle = powered ? '#FFF2A8' : '#E6B350'; ctx.lineWidth = powered ? 4 : 3;
        ctx.globalAlpha = powered ? .95 : .78;
        ctx.beginPath(); ctx.arc(x, ground - height - 24, 13, 0, Math.PI * 2); ctx.stroke();
        this.star(ctx, x, ground - height - 24, 8, powered ? '#FFE694' : '#C98552');
        ctx.restore();
    },
    destinationEvent(ctx, course, distance, time, viewWidth = 1800, reduced = false) {
        if (!course?.dynamic) return;
        const id = course.track.id;
        const recovery = course.recovery === true;
        // Every event is anchored to an authored mechanism, never a looping fake
        // foreground hazard. Decorative bulk ends behind the action plane at 568.
        const visible = course.obstacles.filter(o => {
            if (!o.mechanism) return false;
            if (o.mechanism === 'mountain-snowball') {
                const originScreenX = course.screenX(Number.isFinite(o.originX) ? o.originX : o.worldX, distance);
                return originScreenX > -520 && originScreenX < viewWidth + 350;
            }
            const obstacleScreenX = course.screenX(o.worldX, distance);
            return obstacleScreenX > -350 && obstacleScreenX < viewWidth + 350;
        });
        if (!visible.length) return;
        ctx.save();
        for (const o of visible) {
            const x = course.screenX(o.worldX,distance), phase = o.phaseProgress || 0;
            if (id === 'texas' && recovery && /roll|tumble|wind/.test(`${o.mechanism} ${o.type}`)) {
                // Sage bends behind the rolling brush. The sparse gust lines
                // explain acceleration without becoming another object.
                const direction = Number.isFinite(o.velocityX) && o.velocityX < 0 ? -1 : 1;
                ctx.globalAlpha = o.hit ? .28 : .68;
                for (let clump = 0; clump < 3; clump++) {
                    const px = x - direction * (82 + clump * 45), base = 586 + clump % 2 * 4;
                    ctx.strokeStyle = clump % 2 ? '#777951' : '#8A8355'; ctx.lineWidth = 2.5;
                    for (let blade = -2; blade <= 2; blade++) {
                        const bend = direction * (13 + Math.abs(blade) * 4);
                        ctx.beginPath(); ctx.moveTo(px + blade * 5, base);
                        ctx.quadraticCurveTo(px + bend * .35, base - 18, px + bend, base - 29 - Math.abs(blade) * 3); ctx.stroke();
                    }
                }
                if (!reduced && !o.hit) {
                    ctx.strokeStyle = '#F3D59A88'; ctx.lineWidth = 2;
                    for (let gust = 0; gust < 3; gust++) {
                        const drift = (time * (24 + gust * 5) + gust * 37) % 72;
                        ctx.beginPath(); ctx.moveTo(x - direction * (142 + drift), 520 + gust * 22);
                        ctx.quadraticCurveTo(x - direction * (91 + drift), 510 + gust * 22, x - direction * (42 + drift), 523 + gust * 22); ctx.stroke();
                    }
                }
                ctx.globalAlpha = 1;
            } else if (id === 'texas' && o.mechanism === 'piston' && !recovery) {
                const h = o.hit ? 22 : o.height;
                // A pumping station rises behind the striped moving ram. The
                // connecting rod moves by exactly the ram's live stroke.
                ctx.strokeStyle='#84614B';ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(x-164,566);ctx.lineTo(x-164,422);ctx.quadraticCurveTo(x-164,393,x-132,393);ctx.lineTo(x+135,393);ctx.quadraticCurveTo(x+164,393,x+164,423);ctx.lineTo(x+164,566);ctx.stroke();
                ctx.strokeStyle='#D6A173';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-170,552);ctx.lineTo(x-170,423);ctx.quadraticCurveTo(x-170,388,x-132,388);ctx.lineTo(x+138,388);ctx.stroke();
                this.rounded(ctx,x-46,416,92,86,9,'#87705A');this.rounded(ctx,x-38,424,76,70,6,'#BE9766');
                ctx.strokeStyle='#ECE0B9';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x,492);ctx.lineTo(x,568-h*.45);ctx.stroke();
                this.ellipse(ctx,x-101,434,25,25,'#5F5B4C');
                ctx.save();ctx.translate(x-101,434);ctx.rotate(reduced?0:phase*Math.PI*2);ctx.strokeStyle='#D8BD83';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-19,0);ctx.lineTo(19,0);ctx.moveTo(0,-19);ctx.lineTo(0,19);ctx.stroke();ctx.restore();
                ctx.fillStyle='#FFF0C8';ctx.font='700 13px system-ui';ctx.textAlign='center';ctx.fillText(o.hit?'PRESSURE RELEASED':'PIPELINE PRESSURE',x,380);
                if(o.hit||o.warning){ctx.globalAlpha=.24;for(let i=0;i<4;i++)this.ellipse(ctx,x+151+(reduced?0:Math.sin(time*3+i)*9),366-i*24,12+i*5,16+i*5,'#FFF0CF');ctx.globalAlpha=1;}
            } else if (id === 'alpine' && o.mechanism === 'mountain-snowball') {
                // One fixed foothill carries the sole sphere from source to lane.
                const origin = Number.isFinite(o.originX) ? o.originX : o.worldX;
                const landingX = course.screenX(origin, distance), sourceX = course.screenX(origin + 140, distance);
                ctx.save();
                ctx.globalAlpha = .85; ctx.fillStyle = '#7FA9BA'; ctx.beginPath();
                // Trace the exact bottom-contact path from lane back to source.
                for (let step = 12; step >= 0; step--) {
                    const u = step / 12, px = course.screenX(origin + 140 * (1 - u), distance), py = 365 + 235 * u * u;
                    if (step === 12) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.bezierCurveTo(sourceX + 30, 340, sourceX + 72, 333, sourceX + 92, 344);
                ctx.bezierCurveTo(sourceX + 185, 405, sourceX + 282, 525, sourceX + 350, 600);
                ctx.closePath(); ctx.fill();
                ctx.globalAlpha = .92; ctx.strokeStyle = '#F5FAF3'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
                for (let step = 12; step >= 0; step--) {
                    const u = step / 12, px = course.screenX(origin + 140 * (1 - u), distance), py = 365 + 235 * u * u;
                    if (step === 12) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.restore();
            } else if (id === 'alpine' && /snowball|avalanche/.test(o.mechanism)) {
                const avalanche=o.mechanism==='avalanche-bank', buildup=o.hit ? .15 : Math.max(.2,phase);
                // Far-slope snow plume communicates the travelling bank. It never
                // covers the dog or suggests a second collision front.
                ctx.globalAlpha=o.hit ? .18 : .76;ctx.fillStyle='#D4E8E9';ctx.beginPath();ctx.moveTo(x-235,560);ctx.lineTo(x-120,360);
                ctx.bezierCurveTo(x-25,415,x+110,442,x+235,563);ctx.closePath();ctx.fill();
                ctx.fillStyle='#F5FAF3';ctx.beginPath();ctx.moveTo(x-118,365);ctx.bezierCurveTo(x-62,450,x+45,440,x+200,556);ctx.lineTo(x+92,551);ctx.bezierCurveTo(x-24,470,x-99,467,x-118,365);ctx.fill();
                if(avalanche){for(let i=0;i<7;i++){const offset=reduced?0:Math.sin(time*1.6+i)*8;this.ellipse(ctx,x-130+i*49+offset,541-i%3*15,(o.hit?16:38)+buildup*16,(o.hit?8:23)+buildup*14,i%2?'#EDF7F4':'#C4DEE3');}}
                ctx.globalAlpha=1;
            } else if (id === 'coast' && ['surf','tidal-drift'].includes(o.mechanism)) {
                const active=o.active!==false&&!o.hit;
                const retreat=active?0:phase*38;
                // Keep the continuous background sea visible. Open foam contours
                // describe the retreat without painting an opaque water patch.
                ctx.strokeStyle='#BDE7D8';ctx.lineWidth=2;ctx.globalAlpha=.65;
                ctx.beginPath();ctx.moveTo(x-240,506);ctx.bezierCurveTo(x-123,484-retreat*.3,x+111,521-retreat*.3,x+236,504);ctx.stroke();
                ctx.globalAlpha=1;
                ctx.strokeStyle='#D4F4E3';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-266,553-retreat*.2);ctx.bezierCurveTo(x-123,523-retreat,x+121,553-retreat,x+266,535);ctx.stroke();
                // Wet sand and withdrawal reveal the incoming solid blue crest;
                // harmless water remains visibly behind the runner's ground line.
                ctx.strokeStyle='#8BAC99';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-230+i*45,573+i*4);ctx.lineTo(x-155+i*45,573+i*4);ctx.stroke();}
            } else if (id === 'forest' && o.mechanism === 'falling-log') {
                const branchY=252, flex=o.state==='falling' ? 14 : o.warning?8:0;
                ctx.strokeStyle='#6C6348';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(x-226,566);ctx.quadraticCurveTo(x-215,302,x-158,branchY);ctx.quadraticCurveTo(x-65,branchY-23,x+75,branchY+flex);ctx.stroke();
                ctx.strokeStyle='#91AA77';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-182,326);ctx.quadraticCurveTo(x-111,branchY-18,x+60,branchY+flex-6);ctx.stroke();
                for(let i=0;i<5;i++)this.ellipse(ctx,x-132+i*44,branchY-20+i%2*9,43,23,i%2?'#78966B':'#62875E');
                if(o.warning){ctx.strokeStyle='#D2BC80';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-34+i*24,branchY+30);ctx.lineTo(x-30+i*24,branchY+47);ctx.stroke();}}
            } else if (id === 'ember' && recovery && o.mechanism === 'pressure-crystal') {
                // A low volcanic seam supports the crystal encounter without
                // surrounding it with a diagram, halo, or smoke machine.
                ctx.globalAlpha = o.hit ? .25 : .72; ctx.fillStyle = '#514B60';
                ctx.beginPath(); ctx.moveTo(x - 150, 568); ctx.lineTo(x - 103, 544); ctx.lineTo(x - 55, 556);
                ctx.lineTo(x - 12, 538); ctx.lineTo(x + 41, 553); ctx.lineTo(x + 96, 542); ctx.lineTo(x + 150, 568); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = o.warning ? '#D99063' : '#8E748E'; ctx.lineWidth = o.warning ? 3 : 2;
                ctx.beginPath(); ctx.moveTo(x - 92, 560); ctx.lineTo(x - 48, 550); ctx.lineTo(x - 5, 562); ctx.lineTo(x + 39, 548); ctx.lineTo(x + 91, 559); ctx.stroke();
                ctx.globalAlpha = 1;
            } else if (id === 'ember' && o.mechanism === 'pressure-crystal' && !recovery) {
                const pressure=o.hit?0:o.warning?1:o.active ? .6 : .15;
                ctx.fillStyle='#68536F';ctx.beginPath();ctx.moveTo(x-202,568);ctx.lineTo(x-144,477);ctx.lineTo(x-61,512);ctx.lineTo(x-22,464);ctx.lineTo(x+88,510);ctx.lineTo(x+196,567);ctx.closePath();ctx.fill();
                ctx.strokeStyle=pressure>.8?'#EFAD7B':'#AB85A9';ctx.lineWidth=2+pressure*3;ctx.beginPath();ctx.moveTo(x-161,553);ctx.lineTo(x-105,532);ctx.lineTo(x-50,549);ctx.lineTo(x+20,518);ctx.lineTo(x+120,552);ctx.stroke();
                if(o.hit){
                    this.ellipse(ctx,x,561,Math.min(70,o.width*.55),7,'#443E56');
                    ctx.strokeStyle='#AE8CBA';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-o.width*.6,560);ctx.lineTo(x-o.width*.32,553);ctx.lineTo(x,562);ctx.lineTo(x+o.width*.33,553);ctx.lineTo(x+o.width*.6,560);ctx.stroke();
                }
                if(pressure>.4){ctx.globalAlpha=pressure*.25;for(let i=0;i<4;i++)this.ellipse(ctx,x+(i-1.5)*34,493-i%2*26-(reduced?0:Math.sin(time*2+i)*8),16,29,'#EDBFB2');ctx.globalAlpha=1;}
            }
        }
        ctx.restore();
    },
    // One bounded analytic fracture, painted behind the runner. The owner stores
    // at most 18 events, advances age, and scrolls x with world travel.
    fracture(ctx, event, reduced = false) {
        const age = Math.max(0, event.age || 0), duration = event.duration || 1.1;
        if (age >= duration) return;
        const type = event.type;
        const snow = /snow|pine/.test(type), water = type === 'wave';
        const crystal = /crystal/i.test(type), wood = /fence|log|stump|driftwood/.test(type);
        const straw = type === 'tumbleweed', leaf = type === 'cactus';
        const color = water ? '#A5E9E1' : this.material(type);
        const ground = event.groundY || 600;
        const count = reduced ? 4 : snow || water ? 14 : 10;
        const t = age;
        ctx.save();
        // A brief split retains the construction of the contacted obstacle.
        // The two jagged halves peel apart before becoming the smaller debris.
        if (age < .16 && event.width && event.height) {
            const width = event.width, height = event.height;
            for (const side of [-1, 1]) {
                ctx.save();
                ctx.globalAlpha = (1 - age / .16) * .95;
                ctx.translate(event.x + (event.centerOffset || 0) + age * ((event.speed || 360) + side * 155), ground - age * 140);
                ctx.rotate(side * age * .9);
                ctx.beginPath();ctx.moveTo(side * width * .6, 4);ctx.lineTo(side * width * .6,-height-5);
                ctx.lineTo(0,-height-5);ctx.lineTo(-7,-height*.75);ctx.lineTo(6,-height*.5);ctx.lineTo(-5,-height*.25);ctx.lineTo(0,4);ctx.closePath();ctx.clip();
                this.obstacle(ctx,type,0,0,width,height,0);
                ctx.restore();
            }
        }
        // Contact is the actual overlap point, never a fixed ground-relative burst.
        const contactLife = reduced ? .30 : .24;
        if (age < contactLife) {
            ctx.globalAlpha = (1 - age / contactLife) * .9;
            ctx.strokeStyle = crystal ? '#FFF1FF' : '#FFF1B9'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(event.x, event.y, 45 + (reduced ? 0 : age * 100), -1.3, 1.4); ctx.stroke();
            this.star(ctx, event.x, event.y, 20 * (1 - age / .18), '#FFF4CB');
        }
        for (let i = 0; i < count; i++) {
            const seed = ((i * 47 + (event.seed || 0) * 13) % 97) / 97;
            const vx = (event.speed || 360) * 1.05 + 140 + seed * 250;
            const vy = -(190 + ((i * 31) % 101) * 1.6);
            const px = event.x + vx * t;
            const py = Math.min(ground - 3 - i % 3 * 2, event.y + vy * t + 400 * t * t);
            ctx.globalAlpha = Math.min(1, (duration - age) / .3) * (snow || water ? .65 : .94);
            ctx.save(); ctx.translate(px, py); ctx.rotate(reduced ? i : i + age * (i % 2 ? 7 : -6));
            const size = (7 + i % 4 * 2) * 1.5;
            if (snow || water) {
                this.ellipse(ctx, 0, 0, size * (1 + age * .7), size * .75, i % 2 ? '#F8FFFC' : color);
                ctx.strokeStyle = snow ? '#ABCBD3' : '#6EBEBE';ctx.lineWidth=1.2;ctx.stroke();
            } else if (wood || straw) {
                ctx.fillStyle = i % 2 ? '#D8B583' : '#876043';
                ctx.beginPath(); ctx.moveTo(-size * 2, -3); ctx.lineTo(size * 1.9, -4); ctx.lineTo(size, 1); ctx.lineTo(size * 1.8, 4); ctx.lineTo(-size * 1.5, 3); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#F4D9AB'; ctx.lineWidth = 1; ctx.beginPath();ctx.moveTo(-size,0);ctx.lineTo(size,0);ctx.stroke();
            } else if (leaf) {
                this.ellipse(ctx, 0, 0, size * .7, size * 1.5, '#78A07A');
            } else {
                ctx.fillStyle = crystal ? (i % 2 ? '#D9D6FA' : '#9C81C5') : color;
                ctx.beginPath(); ctx.moveTo(-size, 2); ctx.lineTo(-size * .4, -size); ctx.lineTo(size, -size * .4);ctx.lineTo(size * .7,size);ctx.closePath();ctx.fill();
                ctx.strokeStyle = crystal ? '#FFF3FF' : '#E0CBC0'; ctx.lineWidth = 1.5;
                ctx.beginPath();ctx.moveTo(-size*.4,-size);ctx.lineTo(0,0);ctx.lineTo(size*.7,size);ctx.stroke();
            }
            ctx.restore();
        }
        // Harmless aftermath: a low, fading scatter behind the next encounter.
        if (age > .26) {
            ctx.globalAlpha = Math.min(.65, (duration - age) * .8);
            for (let i = 0; i < 5; i++) this.ellipse(ctx, event.x + 12 + i * 16, ground + 3, 8 + i % 2 * 5, 2, color);
        }
        ctx.restore();
    },
    dynamicCue(ctx, obstacle, x, ground = 600, time = 0, recovery = false) {
        const mechanism = obstacle.mechanism;
        if (!mechanism) return;
        const width = obstacle.width, height = obstacle.height;
        const warn = Boolean(obstacle.warning), active = obstacle.active !== false;
        ctx.save();
        if (recovery && mechanism === 'wind-brush') {
            ctx.strokeStyle = '#D8B578'; ctx.lineWidth = 2;
            const direction = obstacle.phaseProgress < .5 ? -1 : 1;
            for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - direction * (width * .7 + i * 17), ground - 10 - i * 9); ctx.lineTo(x - direction * (width * .25 + i * 8), ground - 10 - i * 9); ctx.stroke(); }
        } else if (mechanism === 'piston' && !recovery) {
            // Housing is solid scenery below the same moving collision silhouette.
            this.rounded(ctx, x - width * .63, ground - 8, width * 1.26, 14, 4, '#66534A');
            this.rounded(ctx, x - width * .45, ground - height, width * .9, 18, 5, '#D59459');
            ctx.fillStyle = '#554B48';
            for (let i = 0; i < 4; i++) {ctx.beginPath();ctx.moveTo(x-width*.4+i*width*.22,ground-height);ctx.lineTo(x-width*.24+i*width*.22,ground-height);ctx.lineTo(x-width*.34+i*width*.22,ground-height+18);ctx.lineTo(x-width*.5+i*width*.22,ground-height+18);ctx.fill();}
            for (const side of [-1,1]) this.rounded(ctx,x+side*width*.27-5,ground-height+17,10,Math.max(1,height-17),3,'#BEC2BC');
        } else if (mechanism === 'mountain-snowball') {
            // Fixed chute plus rotation already communicates its continuous path.
        } else if (/avalanche|snow/.test(mechanism)) {
            ctx.strokeStyle = '#EAF8F5';ctx.lineWidth=4;
            for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+width*.5+i*17,ground-6-i*8);ctx.lineTo(x+width*.5+32+i*17,ground-6-i*8);ctx.stroke();}
        } else if (/surf|wave/.test(mechanism)) {
            ctx.strokeStyle = active ? '#E9FFFA' : '#5A9B9C';ctx.lineWidth=4;
            ctx.beginPath();ctx.ellipse(x,ground+3,width*.66,6,0,0,Math.PI*2);ctx.stroke();
        } else if (/float|tidal/.test(mechanism)) {
            ctx.strokeStyle = recovery ? '#DDF0D4AA' : '#DDF7EA'; ctx.lineWidth = recovery ? 2 : 3;
            ctx.beginPath(); ctx.moveTo(x - width * .72, ground + 2);
            ctx.quadraticCurveTo(x - width * .35, ground - 3, x, ground + 2);
            ctx.quadraticCurveTo(x + width * .35, ground + 7, x + width * .72, ground + 2); ctx.stroke();
        } else if (mechanism === 'crab-dash') {
            ctx.strokeStyle=warn?'#B47948':'#81745C';ctx.lineWidth=3;
            const direction=obstacle.phaseProgress < .5 ? -1 : 1;
            ctx.beginPath();ctx.moveTo(x+direction*width*.65,ground-14);ctx.lineTo(x+direction*(width*.65+24),ground-14);ctx.lineTo(x+direction*(width*.65+16),ground-20);ctx.stroke();
        } else if (mechanism === 'accelerating-roll') {
            ctx.strokeStyle='#B39065';ctx.lineWidth=2;
            for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+width*.6+i*10,ground-8-i*8);ctx.lineTo(x+width*.6+18+i*12,ground-8-i*8);ctx.stroke();}
        } else if (/fall/.test(mechanism)) {
            // The dashed landing footprint is anticipation, not a solid obstacle.
            ctx.strokeStyle='#946B43';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();ctx.ellipse(x,603,width*.55,6,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
            if(warn){ctx.strokeStyle='#BD9E58';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+(i-1)*19,ground-height-35);ctx.lineTo(x+(i-1)*19,ground-height-18);ctx.stroke();}}
        } else if (/crystal|pressure|grow/.test(mechanism)) {
            if (!active && !recovery) {
                const outline = obstacle.baseHeight || 118;
                ctx.strokeStyle='#9B84B2';ctx.lineWidth=2;ctx.setLineDash([5,5]);
                ctx.beginPath();ctx.moveTo(x-width*.38,ground-3);ctx.lineTo(x-width*.38,ground-outline*.67);ctx.lineTo(x,ground-outline);ctx.lineTo(x+width*.38,ground-outline*.67);ctx.lineTo(x+width*.38,ground-3);ctx.stroke();ctx.setLineDash([]);
            }
            ctx.strokeStyle=warn?'#E99C58':active?'#D8BDEA':'#8A79A2';ctx.lineWidth=recovery ? 2 : 3;
            ctx.beginPath();ctx.moveTo(x-width*.65,ground);ctx.lineTo(x-width*.2,ground-6);ctx.lineTo(x,ground-1);ctx.lineTo(x+width*.3,ground-7);ctx.lineTo(x+width*.65,ground);ctx.stroke();
            if(warn && recovery){
                // Warm fissures rise gently toward the future silhouette. No
                // ring, exclamation mark, or debug-like bounding outline.
                ctx.globalAlpha=.72;ctx.strokeStyle='#E6A06E';ctx.lineWidth=3;
                for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(x+side*width*.18,ground-3);ctx.lineTo(x+side*width*.27,ground-15);ctx.lineTo(x+side*width*.22,ground-26);ctx.stroke();}
            } else if(warn){ctx.globalAlpha=.65;for(const side of [-1,1])this.ellipse(ctx,x+side*width*.4,ground-10,5,10,'#F3BD76');}
        }
        if (warn && !recovery) {
            // Shape plus color remains readable without sound or animated effects.
            const cy = ground - height - 30;
            ctx.fillStyle='#F5D087';ctx.strokeStyle='#76502E';ctx.lineWidth=2;
            ctx.beginPath();ctx.moveTo(x,cy-12);ctx.lineTo(x+12,cy+10);ctx.lineTo(x-12,cy+10);ctx.closePath();ctx.fill();ctx.stroke();
            ctx.fillStyle='#66472E';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText('!',x,cy+6);
        }
        ctx.restore();
    },
    obstacle(ctx, type, center, ground, width, height, time = 0, rotation = null) {
        if (type === 'phaseCrystal') type = 'crystal';
        ctx.save();
        // A descending snowball contacts the fixed mountain edge; its ground
        // shadow appears only after the same sphere reaches the lane.
        if (!(type === 'snowball' && ground < 599)) {
            this.ellipse(ctx, center + width * .14, ground + 4, width * .64, 7, 'rgba(35,31,34,0.10)');
            this.ellipse(ctx, center + 2, ground + 1, width * .40, 3, 'rgba(35,31,34,0.20)');
        }
        ctx.translate(center - width / 2, ground - height); ctx.scale(width / 100, height / 100);
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        if (type === 'piston') {
            this.rounded(ctx,5,2,90,21,5,'#E4B166');
            ctx.fillStyle='#68564A';for(let i=0;i<4;i++)ctx.fillRect(10+i*23,3,10,18);
            this.rounded(ctx,22,23,13,74,3,'#A7B4B4');this.rounded(ctx,66,23,13,74,3,'#A7B4B4');
            this.rounded(ctx,0,88,100,12,4,'#746254');
        } else if (type === 'wave') {
            const water=ctx.createLinearGradient(0,0,0,100);water.addColorStop(0,'#BBF4E8');water.addColorStop(.4,'#5AADA9');water.addColorStop(1,'#327C87');
            ctx.fillStyle=water;ctx.beginPath();ctx.moveTo(0,99);ctx.bezierCurveTo(14,84,14,28,48,9);ctx.bezierCurveTo(73,-8,99,9,94,30);ctx.bezierCurveTo(75,18,66,33,68,52);ctx.bezierCurveTo(76,74,87,92,100,99);ctx.closePath();ctx.fill();
            ctx.strokeStyle='#EEFFF6';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(8,89);ctx.bezierCurveTo(27,54,19,30,51,12);ctx.bezierCurveTo(76,-1,96,14,91,23);ctx.stroke();
            ctx.strokeStyle='#BBEADD';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(24,88);ctx.quadraticCurveTo(44,50,56,41);ctx.stroke();
        } else if (type === 'fence') {
            ctx.fillStyle='#9A6341';ctx.fillRect(12,17,13,83);ctx.fillRect(75,17,13,83);
            ctx.fillStyle='#D9A66E';ctx.fillRect(8,36,84,10);ctx.fillRect(8,68,84,10);
            ctx.strokeStyle='#6F4935';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(18,18);ctx.lineTo(18,98);ctx.moveTo(82,18);ctx.lineTo(82,98);ctx.stroke();
        } else if (type === 'cactus') {
            const gradient = ctx.createLinearGradient(15, 0, 82, 0); gradient.addColorStop(0, '#75956C'); gradient.addColorStop(.5, '#507B58'); gradient.addColorStop(1, '#315944');
            ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(37, 100); ctx.lineTo(37, 61); ctx.lineTo(21, 61);
            ctx.quadraticCurveTo(8, 61, 8, 46); ctx.lineTo(8, 28); ctx.quadraticCurveTo(18, 18, 27, 28);
            ctx.lineTo(27, 43); ctx.lineTo(37, 43); ctx.lineTo(37, 12); ctx.bezierCurveTo(37, -5, 66, -5, 66, 12);
            ctx.lineTo(66, 57); ctx.lineTo(77, 57); ctx.lineTo(77, 38); ctx.quadraticCurveTo(87, 28, 95, 38);
            ctx.lineTo(95, 62); ctx.quadraticCurveTo(95, 77, 66, 76); ctx.lineTo(66, 100); ctx.closePath(); ctx.fill();
            ctx.save(); ctx.clip(); this.grain(ctx, 8, 5, 88, 90, '#DFE3B32C', 35); ctx.restore();
            ctx.strokeStyle = '#A5BE86'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(47, 10); ctx.lineTo(47, 94); ctx.moveTo(17, 30); ctx.lineTo(17, 49); ctx.moveTo(85, 43); ctx.lineTo(85, 65); ctx.stroke();
            ctx.strokeStyle = '#DBD5A4'; ctx.lineWidth = 1;
            for (let y = 19; y < 95; y += 15) { ctx.beginPath(); ctx.moveTo(39, y); ctx.lineTo(34, y - 3); ctx.moveTo(64, y + 4); ctx.lineTo(69, y); ctx.stroke(); }
            this.ellipse(ctx, 53, 5, 9, 4, '#D99590');
        } else if (type === 'snowball') {
            const frost = ctx.createRadialGradient(31, 26, 3, 56, 52, 53);
            frost.addColorStop(0, '#FFFFFF'); frost.addColorStop(.58, '#E5F1F1'); frost.addColorStop(1, '#9FBFCD');
            this.ellipse(ctx, 50, 51, 47, 47, frost);
            ctx.save(); ctx.translate(50, 51); ctx.rotate(rotation ?? time * .65);
            ctx.strokeStyle = '#AFCBD555'; ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) { ctx.rotate(1.5); ctx.beginPath(); ctx.arc(6, 6, 22 + i * 5, -.6, 1.6); ctx.stroke(); }
            ctx.restore();
            for (let i = 0; i < 13; i++) {
                const a = i * 2.4, r = 9 + i % 4 * 9;
                this.ellipse(ctx, 50 + Math.cos(a) * r, 51 + Math.sin(a) * r, 1.6, 1, '#FFFFFFAA');
            }
        } else if (type === 'tumbleweed') {
            ctx.translate(50, 52); ctx.rotate(rotation ?? time * .5);
            const straw = ctx.createRadialGradient(-12, -16, 3, 0, 0, 44);
            straw.addColorStop(0, '#DFBF83AA'); straw.addColorStop(.7, '#B78956AA'); straw.addColorStop(1, '#8C694255');
            this.ellipse(ctx, 0, 0, 43, 43, straw);
            ctx.lineWidth = 2.3;
            for (let i = 0; i < 13; i++) {
                ctx.rotate(Math.PI / 5); ctx.strokeStyle = i % 3 ? '#98703F' : '#E5C68E';
                ctx.beginPath(); ctx.ellipse(0, 0, 43, 17 + i % 3 * 6, .3, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-35, -25); ctx.lineTo(-8, 12); ctx.lineTo(35, 28); ctx.stroke();
            }
        } else if (type === 'pine') {
            this.rounded(ctx, 44, 73, 13, 27, 4, '#7C766D');
            for (let i = 0; i < 3; i++) {
                const y = 3 + i * 23, inset = 27 - i * 10;
                ctx.fillStyle = ['#668F8F', '#50797C', '#41666A'][i]; ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(100 - inset, y + 40); ctx.quadraticCurveTo(50, y + 49, inset, y + 40); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#EDF7F3'; ctx.beginPath(); ctx.moveTo(50, y - 2); ctx.lineTo(82 - inset / 2, y + 27); ctx.quadraticCurveTo(60, y + 33, 51, y + 26); ctx.quadraticCurveTo(37, y + 36, 20 + inset / 2, y + 28); ctx.closePath(); ctx.fill();
            }
        } else if (type === 'snowpile') {
            ctx.fillStyle = '#BFDAE3'; ctx.beginPath(); ctx.moveTo(0, 96); ctx.bezierCurveTo(4, 66, 22, 66, 23, 43); ctx.bezierCurveTo(29, -4, 67, -5, 77, 45); ctx.bezierCurveTo(89, 46, 102, 75, 100, 96); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#F9FCF8'; ctx.beginPath(); ctx.moveTo(4, 82); ctx.bezierCurveTo(16, 70, 21, 24, 41, 17); ctx.bezierCurveTo(68, -6, 72, 39, 83, 56); ctx.quadraticCurveTo(59, 51, 49, 67); ctx.quadraticCurveTo(27, 86, 4, 82); ctx.fill();
            this.ellipse(ctx, 63, 85, 19, 5, '#D5E9ED');
        } else if (type === 'log' || type === 'driftwood') {
            const pale = type === 'driftwood';
            ctx.save(); ctx.translate(50, 56); ctx.rotate(-.1);
            this.rounded(ctx, -49, -31, 97, 70, 19, pale ? '#AA9575' : '#755546');
            ctx.save(); ctx.clip();
            const bark = ctx.createLinearGradient(0, -31, 0, 39); bark.addColorStop(0, '#F1DAB12C'); bark.addColorStop(1, '#251C242E');
            ctx.fillStyle = bark; ctx.fillRect(-49, -31, 97, 70); this.grain(ctx, -46, -29, 92, 64, '#E4C29640', 27); ctx.restore();
            this.ellipse(ctx, 36, 4, 14, 33, pale ? '#DBCAA7' : '#BF9568');
            ctx.strokeStyle = pale ? '#B5A07E' : '#916947'; ctx.lineWidth = 2;
            for (const scale of [.35, .7]) { ctx.beginPath(); ctx.ellipse(36, 4, 12 * scale, 30 * scale, 0, 0, Math.PI * 2); ctx.stroke(); }
            ctx.strokeStyle = pale ? '#D1BFA1' : '#9B7660'; ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-40, -17 + i * 19); ctx.quadraticCurveTo(-8, -23 + i * 19, 19, -12 + i * 19); ctx.stroke(); }
            ctx.restore();
            ctx.strokeStyle = pale ? '#AE9778' : '#755546'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(35, 44); ctx.lineTo(20, 13); ctx.lineTo(10, 9); ctx.moveTo(58, 36); ctx.lineTo(68, 15); ctx.stroke();
            if (!pale) { this.ellipse(ctx, 35, 39, 24, 7, '#82966A'); this.ellipse(ctx, 16, 45, 12, 7, '#9CA97B'); }
        } else if (type === 'mushroom') {
            ctx.fillStyle = '#D8CBB0'; ctx.beginPath(); ctx.moveTo(39, 43); ctx.lineTo(60, 43); ctx.lineTo(66, 97); ctx.quadraticCurveTo(51, 105, 34, 97); ctx.closePath(); ctx.fill();
            const gradient = ctx.createLinearGradient(0, 0, 0, 61); gradient.addColorStop(0, '#D29678'); gradient.addColorStop(1, '#A5574F');
            ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(2, 53); ctx.bezierCurveTo(10, -16, 87, -15, 99, 52); ctx.quadraticCurveTo(51, 69, 2, 53); ctx.fill();
            this.ellipse(ctx, 50, 55, 45, 7, '#C7AF98');
            [[27, 31, 7], [55, 16, 6], [76, 39, 9]].forEach(([x, y, r]) => this.ellipse(ctx, x, y, r, r * .6, '#F0DBC0'));
        } else if (type === 'stump') {
            ctx.fillStyle = '#886952'; ctx.beginPath(); ctx.moveTo(23, 10); ctx.lineTo(79, 10); ctx.lineTo(83, 76); ctx.lineTo(98, 99); ctx.lineTo(3, 99); ctx.lineTo(18, 76); ctx.closePath(); ctx.fill();
            this.ellipse(ctx, 51, 13, 29, 13, '#C2A177');
            ctx.strokeStyle = '#956F4F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(51, 13, 19, 8, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = '#B18B65'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(31, 33); ctx.lineTo(29, 81); ctx.moveTo(65, 31); ctx.lineTo(69, 89); ctx.stroke();
            this.ellipse(ctx, 24, 89, 17, 7, '#819567');
        } else if (type === 'crab') {
            ctx.strokeStyle = '#AD6356'; ctx.lineWidth = 6;
            for (let i = 0; i < 3; i++) for (const side of [-1, 1]) {
                ctx.beginPath(); ctx.moveTo(50 + side * 21, 54 + i * 7); ctx.lineTo(50 + side * 43, 66 + i * 8 + Math.sin(time * 6 + i) * 3); ctx.lineTo(50 + side * 48, 89 + i * 3); ctx.stroke();
            }
            const shell = ctx.createRadialGradient(38,42,3,54,62,37); shell.addColorStop(0,'#F0C1A2'); shell.addColorStop(.55,'#C9876F'); shell.addColorStop(1,'#905647');
            this.ellipse(ctx, 50, 60, 32, 27, shell); this.ellipse(ctx, 50, 52, 25, 17, '#E0A389');
            this.ellipse(ctx, 43, 45, 15, 6, '#F0BCA044');
            for (const side of [-1, 1]) {
                ctx.strokeStyle = '#A86858'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(50 + side * 15, 42); ctx.lineTo(50 + side * 18, 19); ctx.stroke();
                this.ellipse(ctx, 50 + side * 18, 18, 6, 7, '#384944'); this.ellipse(ctx, 50 + side * 41, 39, 10, 13, '#D5947B');
            }
        } else if (type === 'crystal') {
            [[7, 42, 30, '#A9A7CC'], [33, 0, 41, '#CDC2E0'], [70, 36, 27, '#BD9CC4']].forEach(([x, y, w, color]) => {
                ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y + 23); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + 23); ctx.lineTo(x + w - 3, 98); ctx.lineTo(x + 3, 98); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#6C658A'; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 26); ctx.lineTo(x + w, y + 23); ctx.lineTo(x + w - 3, 98); ctx.lineTo(x + w / 2, 98); ctx.fill();
                ctx.strokeStyle = '#EEE4F0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 5); ctx.lineTo(x + 5, y + 24); ctx.lineTo(x + 7, 84); ctx.stroke();
            });
        } else {
            const dark = type === 'basalt' || type === 'emberstone';
            const gradient = ctx.createLinearGradient(0, 0, 80, 90); gradient.addColorStop(0, dark ? '#918398' : '#BFAC92'); gradient.addColorStop(1, dark ? '#514C64' : '#8E806E');
            ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(3, 90); ctx.quadraticCurveTo(0, 75, 14, 46); ctx.lineTo(32, 13); ctx.quadraticCurveTo(50, -1, 67, 12); ctx.lineTo(90, 48); ctx.quadraticCurveTo(102, 65, 96, 95); ctx.quadraticCurveTo(47, 105, 3, 90); ctx.fill();
            ctx.save(); ctx.clip(); this.grain(ctx, 3, 8, 94, 90, dark ? '#D8B8CE32' : '#F7DFB53B', 40); ctx.restore();
            const face=ctx.createLinearGradient(22,12,65,67);face.addColorStop(0,dark?'#B8A8BB':'#E4D4B9');face.addColorStop(1,dark?'#ADA0AF44':'#D8CBB344');ctx.fillStyle=face; ctx.beginPath(); ctx.moveTo(14, 45); ctx.lineTo(33, 16); ctx.lineTo(63, 13); ctx.lineTo(48, 43); ctx.lineTo(20, 64); ctx.fill();
            ctx.strokeStyle = type === 'emberstone' ? '#EAA277' : dark ? '#444558' : '#9D8F7B'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(62, 32); ctx.lineTo(52, 54); ctx.lineTo(64, 67); ctx.lineTo(51, 87); ctx.stroke();
        }
        ctx.restore();
    }
};
