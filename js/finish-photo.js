// A finish memory stores a sprite frame and normalized canonical-body height, never a replacement pose.
// Small metadata keeps the local album light; PNGs are rendered only on download.
class FinishPhoto {
    static pose(photo) { return photo.pose || photo; }
    static height(photo) { return photo.version === 2 || photo.version === 3 || photo.version === 4 ? this.pose(photo).normalizedHeight * FINISH_HEIGHT_RANGE : photo.height; }
    static capture(game) {
        const dog = game.character;
        const clip = dog.asset.states[dog.animationState].animation;
        const context = game.runContext || {};
        const version = context.resultVersion === 4 ? 4 : 3;
        const photo = {version,track:game.course.track.id,courseVersion:game.course.version,assetId:dog.asset.assetId,petLabel:dog.asset.displayName || dog.asset.assetId,
            pose:Object.freeze({state:dog.animationState,clip,frame:Character.frameAt(dog.asset,dog.animationState,dog.animationTime),
                normalizedHeight:Math.min(1,Math.max(0,dog.groundY-dog.y)/FINISH_HEIGHT_RANGE)}),
            seconds:game.wallTime || game.playTime,
            created:Date.now(),distance:game.background.distance || 0,
            difficulty:context.difficulty || game.speedOptions[game.selectedSpeedIndex],control:context.control || 'fixed'};
        if (version === 4) Object.assign(photo, { rulesId: context.rulesId, courseLayoutId: context.courseLayoutId, capabilityProfile: context.capabilityProfile });
        return Object.freeze(photo);
    }
    static time(seconds) {
        const tenths = Math.round(seconds * 10);
        return `${Math.floor(tenths/600)}:${String(Math.floor(tenths%600/10)).padStart(2,'0')}.${tenths%10}`;
    }
    static description(photo) {
        const track = TRACKS.find(t=>t.id===photo.track);
        const name = photo.petLabel || photo.dog || (typeof PetManifest !== 'undefined' && PetManifest.presentationFor({assetId:photo.assetId}).displayName) || photo.assetId;
        return `${name} finished ${track?.name || 'a trail'} in ${this.time(photo.seconds)}${this.height(photo)>1?' — caught mid-air!':'.'}${photo.assetAvailable === false ? ' Archived photo; original companion art is unavailable.' : ''}`;
    }
    static draw(canvas, photo, assets) {
        const ctx=canvas.getContext('2d'),track=TRACKS.find(t=>t.id===photo.track),requested=assets.find(a=>a.assetId===photo.assetId)||assets.find(a=>a.name===photo.dog),asset=requested||assets[0],pose=this.pose(photo),height=this.height(photo),presentation=PetManifest.presentationFor(asset);
        ctx.setTransform(canvas.width/1200,0,0,canvas.height/1000,0,0);
        ctx.fillStyle='#faf7ee';ctx.fillRect(0,0,1200,1000);
        ctx.save();ctx.beginPath();ctx.rect(32,32,1136,720);ctx.clip();ctx.translate(32,32);
        const recovery=/-recovery-[123]$/.test(photo.courseLayoutId || '');
        const sourceScale=CONFIG.CHARACTER.DISPLAY_SIZE/asset.frameSize.w*presentation.presentation.scale;
        const headroom=(presentation.pawRoot.y-presentation.visualBounds.y)*sourceScale;
        // A still photo can frame its captured height; the live camera stays
        // fixed. Keep close ground portraits without cropping an apex pose.
        const worldWidth=recovery?Math.max(700,(height+headroom+24)*1136/(720*.95)):900;
        const scale=1136/worldWidth,ground=720*(recovery ? .95 : .88)/scale;
        ctx.scale(scale,scale);ctx.translate(0,ground-600);
        const background=new Background(canvas);background.lowQuality=true;background.skyTop=600-ground;
        background.recovery=recovery;background.journeyProgress=1;
        background.draw(ctx,track,photo.distance,0);
        const pawX=worldWidth/2+(presentation.pawRoot.x-presentation.focusPoint.x)*sourceScale;
        // The postcard uses the same GOOD DOG gate as the live crossing. The
        // selected runner is drawn last, preserving the exact captured pose.
        Art.finishGate(ctx,pawX,600,track.accent,{celebrate:true});
        const proximity=Math.max(.25,1-height/280);
        Art.ellipse(ctx,pawX+5,603,57*proximity,7*proximity,'#26362933');
        Character.drawFrame(ctx,asset,asset.animations[pose.clip],pose.frame,pawX,600-height,CONFIG.CHARACTER.DISPLAY_SIZE);
        ctx.restore();
        ctx.textAlign='left';ctx.fillStyle='#526357';ctx.font='600 23px system-ui';ctx.fillText('BARKOUR  /  FINISH MOMENTS',52,802);
        ctx.fillStyle='#293f36';ctx.font='42px Georgia';ctx.fillText(`${photo.petLabel || photo.dog || asset.displayName || asset.name} · ${track.name}`,52,861);
        ctx.font='28px system-ui';ctx.fillStyle='#536458';
        ctx.fillText(CONFIG.DIFFICULTY[photo.difficulty].LABEL + (recovery ? '' : ` · ${photo.control==='fixed'?'Fixed leap':'Tap / hold'}`),52,913);
        ctx.font='23px system-ui';ctx.fillText(new Date(photo.created).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}),52,957);
        ctx.textAlign='right';ctx.font='600 54px system-ui';ctx.fillStyle=track.accent;ctx.fillText(this.time(photo.seconds),1148,921);
        ctx.font='22px system-ui';ctx.fillStyle='#536458';ctx.fillText('MIN : SEC',1148,957);
        if (!requested || photo.assetAvailable === false) { ctx.textAlign='left';ctx.font='20px system-ui';ctx.fillStyle='#7d5d43';ctx.fillText('Archived photo · original companion art unavailable',52,987); }
    }
    static download(photo, assets) {
        const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1000;
        try { this.draw(canvas,photo,assets); } catch (_) { return Promise.resolve({ requested: false }); }
        // Browsers do not report whether the user ultimately kept the file. This
        // resolves only after a PNG was made and a download was requested.
        return new Promise(resolve => {
            try { canvas.toBlob(blob=>{
                if (!blob) return resolve({ requested: false });
                try {
                    const link=document.createElement('a'),url=URL.createObjectURL(blob);
                    link.href=url;link.download=`barkour-${(photo.assetId || photo.dog || 'pet').toLowerCase()}-${photo.track}-${photo.created}.png`;
                    link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
                    resolve({ requested: true });
                } catch (_) { resolve({ requested: false }); }
            },'image/png'); } catch (_) { resolve({ requested: false }); }
        });
    }
}
