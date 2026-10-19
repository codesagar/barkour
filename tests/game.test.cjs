const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function runtime() {
    const saved = new Map();
    const context = vm.createContext({console, window:{addEventListener(){}}, document:{},
        localStorage:{getItem:key=>saved.get(key) ?? null, setItem:(key,value)=>saved.set(key,value)}});
    for (const file of ['config','pet-manifest','storage','character-assets','character','tracks','art','background','collision','finish-photo','game','game-ui'])
        vm.runInContext(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'), context);
    return vm.runInContext('({CONFIG,Storage,CHARACTER_ASSETS,Character,TRACKS,OBSTACLE_TYPES,Course,Background,Collision,FinishPhoto,Game,GameUI,Art,PetManifest,EQUAL_PET_GAMEPLAY_BODY,EQUAL_PET_GAMEPLAY_BODY_ID,DEV_SILHOUETTE_FIXTURES,courseVersionForTrack,TEXAS_V3_MANIFEST,validateCourseManifest,localStorage})', context);
}
function gameFor(api, trackIndex=0, speedIndex=0, dogIndex=0) {
    const game = Object.create(api.Game.prototype);
    Object.assign(game, {canvas:{width:1600,height:800}, selectedTrackIndex:trackIndex, selectedSpeedIndex:speedIndex,
        selectedCharacterIndex:dogIndex, speedOptions:['EASY','MEDIUM','HARD'], dogSprites:api.CHARACTER_ASSETS,
        character:new api.Character(api.CHARACTER_ASSETS[dogIndex],260), background:new api.Background({width:1600,height:800}),
        audio:{unlock(){},play(){}}, uiTime:0, reducedMotion:true});
    // Preserve the historical v3 contract and immutable Stage A fixtures. New rules have explicit RC tests.
    game.startGame = function(options = {}) { return api.Game.prototype.startGame.call(this, { ...options, legacyRules: true }); };
    game.startGame(); game.state='PLAYING'; game.character.setState('run');
    return game;
}
function autoRun(game, maxSteps=20000) {
    for (let i=0;i<maxSteps && game.state==='PLAYING';i++) {
        const next=game.course.obstacles.find(o=>!o.hit && !o.passed && o.worldX>game.distance-80);
        // Aim to cross the obstacle near the natural apex; no invincibility cheat.
        if(next && !game.character.isJumping && next.worldX-game.distance < game.gameSpeed*60*.57 && next.worldX>game.distance)
            game.jump();
        game.updatePlaying(1/120);
    }
    return game;
}
test('runtime sheets preserve both source packs and decode as real WebP files',()=>{
    const api=runtime();
    for(const pack of api.CHARACTER_ASSETS) {
        const source=JSON.parse(fs.readFileSync(path.join(root,'new-assets',pack.name.toLowerCase(),pack.name.toLowerCase()+'.animations.json')));
        assert.equal(JSON.stringify(pack.pivot),JSON.stringify(source.pivot));
        for(const [name,clip] of Object.entries(pack.animations)) {
            const bytes=fs.readFileSync(path.join(root,clip.sheet)); assert.equal(bytes.toString('ascii',8,12),'WEBP');
            assert.equal(JSON.stringify(clip.durationsMs),JSON.stringify(source.animations[name].durationsMs));
        }
    }
});
test('longer jump has a 279px apex, 1.16s airtime and all authored pose transitions',()=>{
    const api=runtime();
    for(const pack of api.CHARACTER_ASSETS) {
        const dog=new api.Character(pack,260);dog.jump();const states=new Set([dog.animationState]);let minY=600,land=0;
        for(let i=0;i<180;i++){dog.update(1/120,6);states.add(dog.animationState);minY=Math.min(minY,dog.y);if(!land&&!dog.isJumping)land=(i+1)/120;assert.ok(dog.y<=600);}
        assert.deepEqual([...states],['takeoff','rise','apex','fall','land','run']);
        assert.ok(600-minY>278&&600-minY<281); assert.ok(land>1.15&&land<1.18);
        dog.reset();assert.equal(dog.animationState,'idle');
    }
});
test('late input buffers on landing; early aerial input never creates an automatic second jump',()=>{
    const api=runtime();const dog=new api.Character(api.CHARACTER_ASSETS[0],260);dog.jump();
    for(let i=0;i<129;i++)dog.update(1/120,6);dog.jump();for(let i=0;i<13;i++)dog.update(1/120,6);
    assert.ok(dog.isJumping&&dog.velocityY<0);assert.equal(dog.jumpBuffer,0);
    dog.reset();dog.jump();dog.update(1/120,6);dog.jump();for(let i=0;i<180;i++)dog.update(1/120,6);assert.equal(dog.isJumping,false);
});
test('every obstacle, both dogs, and all difficulty endpoints have a generous jump window',()=>{
    const api=runtime();
    for(const pack of api.CHARACTER_ASSETS)for(const profile of Object.values(api.CONFIG.DIFFICULTY))for(const speed of [profile.INITIAL_SPEED,profile.MAX_SPEED*1.2])for(const spec of Object.values(api.OBSTACLE_TYPES)){
        let successes=0;
        for(let start=0;start<250;start++){
            const dog=new api.Character(pack,260);let x=950,hit=false;
            for(let step=0;step<380;step++){
                if(step===start)dog.jump();dog.update(1/120,speed);x-=speed/2;
                const box={x:x-spec.w/2+9,y:600-spec.h+10,width:spec.w-18,height:spec.h-14};
                if(api.Collision.checkCollision(dog.getBounds(),box)){hit=true;break;}
                if(box.x+box.width<dog.getBounds().x)break;
            }
            if(!hit)successes++;
        }
        assert.ok(successes>=30,`${pack.name}, speed ${speed}, ${JSON.stringify(spec)}: ${successes} safe ticks`);
    }
});
test('30/60/120/144 Hz produce identical course travel, score, speed and character state',()=>{
    const api=runtime();const results=[30,60,120,144].map(hz=>{
        const g=gameFor(api);g.jump();for(let i=0;i<hz*2;i++)g.update(1000/hz);
        return [g.distance,g.score,g.gameSpeed,g.character.y,g.character.animationState,g.character.animationTime];
    });for(const result of results)assert.deepEqual(result,results[0]);
});
test('v3 course manifests remain finite, deterministic, theme-specific, and preserve all-treat accounting',()=>{
    const api=runtime();assert.equal(api.TRACKS.length,5);
    for(const track of api.TRACKS)for(const difficulty of Object.values(api.CONFIG.DIFFICULTY)){
        const course=new api.Course(track,difficulty);assert.equal(JSON.stringify(course),JSON.stringify(new api.Course(track,difficulty)));
        assert.equal(course.version,3);assert.ok(course.obstacles.length>=3);assert.ok(course.obstacles.every(o=>o.worldX<course.length));
        assert.equal(course.pickups.filter(p=>p.type==='star').length,1);
        assert.equal(course.totalTreats,course.pickups.filter(p=>p.type==='treat').length);
        assert.ok(course.sections.length>=7); assert.equal(course.pickups.filter(p=>p.type==='souvenir').length,3);
    }
});
test('all five courses finish with both dogs on every difficulty without losing hearts',()=>{
    const api=runtime();
    for(let track=0;track<5;track++)for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++){
        const g=autoRun(gameFor(api,track,speed,dog));
        assert.equal(g.state,'COMPLETE',`${track}/${speed}/${dog} should finish`);
        assert.equal(g.damage,0);assert.equal(g.distance,g.course.length);assert.ok(g.playTime>=30&&g.playTime<70);
        assert.equal(g.result.stars,3,`${track}/${speed}/${dog}: ${g.treats}/${g.course.totalTreats} treats`);
    }
});
test('shield absorbs one hit, star smashes obstacles, and damage respects recovery immunity',()=>{
    const api=runtime(),g=gameFor(api);const a=g.course.obstacles;
    g.powers.shield=1;g.hitObstacle(a[0]);assert.equal(g.hearts,3);assert.equal(g.powers.shield,0);
    g.invulnerable=0;g.powers.star=5;g.hitObstacle(a[1]);assert.equal(g.hearts,3);assert.ok(a[1].hit);
    g.powers.star=0;g.invulnerable=0;g.hitObstacle(a[2]);assert.equal(g.hearts,2);g.hitObstacle(a[3]);assert.equal(g.hearts,2);
    g.invulnerable=0;g.hitObstacle(a[3]);g.invulnerable=0;g.hitObstacle(a[4]);assert.equal(g.state,'GAME_OVER');
});
test('pickups activate automatically; magnet attracts treats; timed powers expire',()=>{
    const api=runtime(),g=gameFor(api);const bounds=g.character.getBounds();
    g.course.pickups=[{worldX:0,y:540,type:'magnet',collected:false},{worldX:200,y:410,type:'treat',collected:false}];
    g.collectPickups(bounds,1/120);assert.equal(g.powers.magnet,9);
    for(let i=0;i<240;i++)g.collectPickups(bounds,1/120);
    assert.equal(g.treats,1);assert.equal(g.course.pickups[1].collected,true);
    g.course.obstacles=[];g.powers.star=.02;g.powers.magnet=.02;for(let i=0;i<5;i++)g.updatePlaying(1/120);
    assert.equal(g.powers.star,0);assert.equal(g.powers.magnet,0);
});
test('pause freezes timers and progress; restart clears powers, health and collectibles',()=>{
    const api=runtime(),g=gameFor(api);g.powers.star=4;g.update(16);g.pause();const d=g.distance,p=g.powers.star;
    for(let i=0;i<60;i++)g.update(1000/60);assert.equal(g.distance,d);assert.equal(g.powers.star,p);
    g.resume();assert.equal(g.state,'PLAYING');g.update(16);assert.ok(g.distance>d);
    g.hearts=1;g.treats=9;g.startGame();assert.equal(g.hearts,3);assert.equal(g.treats,0);assert.equal(g.powers.star,0);assert.ok(g.course.pickups.every(p=>!p.collected));
});
test('v3 finish saves best per-course/per-difficulty records once, without overwriting better runs',()=>{
    const api=runtime(),g=gameFor(api,1);g.damage=0;g.treats=g.course.totalTreats;g.finish();
    assert.equal(g.result.stars,3);const record=api.Storage.getRecords(3)['alpine:EASY:fixed'];assert.equal(record.completions,1);g.finish();assert.equal(api.Storage.getRecords(3)['alpine:EASY:fixed'].completions,1);
    api.Storage.saveCourse('alpine','EASY',{version:3,stars:1,score:2,time:100,control:'fixed'});assert.equal(api.Storage.bestStars('alpine',3),3);assert.equal(api.Storage.getRecords(3)['alpine:EASY:fixed'].score,record.score);
    api.Storage.saveCourse('alpine','HARD',{version:3,stars:2,score:100,time:30});assert.equal(api.Storage.bestStars('alpine',3),3);
});
test('long frames are capped instead of leaping through the course',()=>{
    const api=runtime(),g=gameFor(api);g.update(30000);assert.ok(g.distance<=37);assert.ok(g.playTime<=.101);
});

test('legacy character hops remain isolated; new runs always ignore release',()=>{
 const api=runtime();
 for(const pack of api.CHARACTER_ASSETS){
  const dog=new api.Character(pack,260);dog.jump();dog.releaseJump();let min=600;
  for(let i=0;i<100;i++){dog.update(1/120,6);min=Math.min(min,dog.y);}
  assert.ok(600-min>120&&600-min<126);
  dog.reset();dog.jump();for(let i=0;i<129;i++)dog.update(1/120,6);dog.jump();dog.releaseJump();
  for(let i=0;i<12;i++)dog.update(1/120,6);assert.ok(dog.velocityY>=-640&&dog.velocityY<0);
 }
 const g=gameFor(api);g.assisted=true;g.jump();g.releaseJump();assert.equal(g.character.velocityY,-960);
 g.assisted=false;g.releaseJump();assert.equal(g.character.velocityY,-960);
});

test('moving hazard collision follows deterministic bounded motion; phase has real safe state',()=>{
 const api=runtime();
 for(const track of [0,1,2,4]){
  const g=gameFor(api,track),o=g.course.obstacles.find(o=>o.motion),origin=o.originX;
  g.distance=origin-1100;
  for(let i=0;i<480;i++)g.course.update(1/120,g.distance,i/120);
  assert.ok(Math.abs(o.worldX-origin)<= (o.travel||o.amplitude||1));
  assert.equal(g.course.bounds(o,g.distance).x,260+o.worldX-g.distance-o.width/2+9);
  if(o.motion==='phase') {g.course.update(0,g.distance,2.6-o.phase);assert.equal(o.active,false);}
  else assert.notEqual(o.worldX,origin);
 }
});

test('desktop sightline and portrait advance-preview budget include dog extent and fastest closing speed',()=>{
 const api=runtime();let minimum=Infinity;
 for(const pack of api.CHARACTER_ASSETS)for(const d of Object.values(api.CONFIG.DIFFICULTY))for(const [width,pace] of [[api.CONFIG.CAMERA.DESKTOP_WIDTH,1],[260+api.CONFIG.CAMERA.PREVIEW_DISTANCE,api.CONFIG.CAMERA.PORTRAIT_PACE]]){
  const dog=new api.Character(pack,260),body=dog.getBounds();
  const warning=(width-(body.x+body.width)-50)/((d.MAX_SPEED*60*1.2+83)*pace);
  minimum=Math.min(minimum,warning);assert.ok(warning>=1.35,`${width}: ${warning}`);
  const first=(width-(body.x+body.width)-50)/(d.INITIAL_SPEED*60*pace);assert.ok(first>=1.8);
 }
 console.log('Minimum conservative warning seconds:',minimum.toFixed(3));
});

test('all ordinary courses survive imperfect takeoff offsets without powers',()=>{
 const api=runtime();
 for(let track=0;track<5;track++)for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++)for(const offset of [-.12,0,.12]){
  const g=gameFor(api,track,speed,dog);g.course.pickups=g.course.pickups.filter(p=>p.type==='treat'||p.type==='souvenir');
  for(let i=0;i<10000&&g.state==='PLAYING';i++){
   const next=g.course.obstacles.find(o=>!o.hit&&!o.passed&&o.worldX>g.distance-80);
   if(next&&!g.character.isJumping&&next.worldX-g.distance<g.gameSpeed*60*(.57+offset)&&next.worldX>g.distance)g.jump();
   g.updatePlaying(1/120);
  }
  assert.equal(g.state,'COMPLETE',`${track}/${speed}/${dog}/${offset}`);
  assert.equal(g.damage,0,`${track}/${speed}/${dog}/${offset}`);
 }
});

test('every v3 power moment covers both marked obstacles and leaves a safe expiry exit',()=>{
    const api=runtime();
 for(let track=0;track<5;track++)for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++){
  const g=gameFor(api,track,speed,dog),power=g.course.pickups.find(p=>p.type==='star');
  g.distance=power.worldX-150;g.course.obstacles=g.course.obstacles.filter(o=>o.smash);
  let lastSmashRemaining=0;
  for(let i=0;i<1200;i++){
   const before=g.smashes;g.updatePlaying(1/120);if(g.smashes>before)lastSmashRemaining=g.powers.star;
   if(g.expiryWarned&&g.powers.star===0)break;
  }
  assert.equal(g.smashes,2,`${track}/${speed}/${dog}`);assert.equal(g.damage,0);
  assert.ok(lastSmashRemaining>=.75,`exit: ${lastSmashRemaining}`);
  assert.ok(g.course.obstacles.every(o=>o.hit));
 }
});

test('launch surfaces have real impulses and airborne players can bypass them',()=>{
 const api=runtime();
 for(const track of [1,3])for(const dog of [0,1]){
  const g=gameFor(api,track,0,dog),pad=g.course.surfaces[0];g.distance=pad.worldX-40;g.updatePlaying(1/120);
  assert.equal(pad.used,true);assert.equal(g.character.velocityY,-1120);assert.equal(g.character.isJumping,true);
  g.startGame();g.state='PLAYING';const other=g.course.surfaces[0];g.distance=other.worldX-40;g.jump();g.updatePlaying(1/120);assert.equal(other.used,false);
 }
});

test('Texas pipeline creates real elevated support, a leapable gap, and safe ground fallback',()=>{
 const api=runtime(),course=new api.Course(api.TRACKS[0],api.CONFIG.DIFFICULTY.EASY);
 assert.equal(course.platforms.length,2);assert.equal(course.platforms[0].y,430);assert.ok(course.platforms[0].worldEnd<course.platforms[1].worldStart);
 const ramp=course.surfaces.find(surface=>surface.kind==='pipeline');assert.ok(ramp);assert.equal(course.supportAt(course.platforms[0].worldStart,400),course.platforms[0]);assert.equal(course.supportAt(course.platforms[0].worldStart,500),null);
 const run=gameFor(api);run.course.obstacles=[];run.course.pickups=[];run.distance=ramp.worldX-ramp.triggerRadius;
 let touchedFirst=false,fellBelowSecond=false;
 for(let i=0;i<1800&&run.distance<course.platforms[1].worldEnd+80;i++){
  run.updatePlaying(1/120);
  if(run.character.groundY===430&&!run.character.isJumping)touchedFirst=true;
  if(run.distance>course.platforms[1].worldStart&&run.character.y>442)fellBelowSecond=true;
 }
 assert.equal(touchedFirst,true);assert.equal(fellBelowSecond,true);assert.equal(run.character.groundY,600);
 const mastery=gameFor(api);mastery.course.obstacles=[];mastery.course.pickups=[];const pipes=mastery.course.platforms;const launch=mastery.course.surfaces.find(surface=>surface.kind==='pipeline');mastery.distance=launch.worldX-launch.triggerRadius;
 let landedSecond=false;
 for(let i=0;i<1800&&mastery.distance<pipes[1].worldEnd+40;i++){
  if(!mastery.character.isJumping&&mastery.character.groundY===430&&pipes[0].worldEnd-mastery.distance<mastery.gameSpeed*60*.22&&pipes[0].worldEnd>mastery.distance)mastery.jump();
  mastery.updatePlaying(1/120);if(!mastery.character.isJumping&&mastery.character.groundY===430&&mastery.distance>=pipes[1].worldStart)landedSecond=true;
 }
 assert.equal(landedSecond,true);
});

test('every v3 trail ends with a visible photo spring before the GOOD DOG gate',()=>{
 const api=runtime();for(const track of api.TRACKS){const course=new api.Course(track,api.CONFIG.DIFFICULTY.EASY),ramp=course.surfaces.find(surface=>surface.photo);assert.ok(ramp);assert.equal(ramp.kind,'photo');assert.equal(ramp.velocity,-840);assert.ok(ramp.triggerRadius<ramp.width/2);assert.ok(ramp.worldX<course.length);assert.ok(course.length-ramp.worldX<course.unit);}
 assert.equal(typeof api.Art.finishGate,'function');
});

test('the finish spring creates a readable mid-air crossing instead of the full jump apex',()=>{
 const api=runtime(),g=gameFor(api);g.course.obstacles=[];g.course.pickups=[];const spring=g.course.surfaces.find(surface=>surface.photo);
 g.distance=spring.worldX-spring.triggerRadius;
 for(let i=0;i<600&&g.state==='PLAYING';i++)g.updatePlaying(1/120);
 assert.equal(g.state,'COMPLETE');const height=api.FinishPhoto.height(g.finishPhoto);
 assert.ok(height>70&&height<220,`finish height ${height}`);
});

test('v3 route gates offer one optional high decision and always rejoin',()=>{
 const api=runtime();for(let track=0;track<5;track++)for(let d=0;d<3;d++){
  const g=gameFor(api,track,d),gate=g.course.routeGates[0];assert.ok(gate,`${track} gate`);
  g.course.obstacles=[];g.distance=gate.worldX-180;g.jump();for(let i=0;i<90;i++)g.updatePlaying(1/120);
  assert.equal(gate.route,'high');while(!gate.rejoined)g.updatePlaying(1/120);
  assert.equal(g.course.activeRoute,'main');assert.equal(g.damage,0);
 }
});

test('missed main treats break combo, bonus misses do not; rosettes never count toward stars',()=>{
 const api=runtime(),g=gameFor(api);g.combo=8;g.multiplier=2;g.comboTime=3;
 g.course.pickups=[{worldX:-200,y:500,type:'treat',bonus:true}];g.collectPickups(g.character.getBounds(),1/120);assert.equal(g.combo,8);
 g.course.pickups=[{worldX:-200,y:500,type:'treat'}];g.collectPickups(g.character.getBounds(),1/120);assert.equal(g.combo,0);
 g.course.pickups=[{worldX:0,y:535,type:'souvenir'}];g.collectPickups(g.character.getBounds(),1/120);assert.equal(g.souvenirs,1);assert.equal(g.treats,0);
});

test('record versions and controls stay separate while original records remain intact',()=>{
 const api=runtime();api.Storage.write('barkour_adventure_records_v1',{'texas:EASY':{score:99999,stars:3}});
 assert.deepEqual(Object.keys(api.Storage.getRecords()),[]);
 api.Storage.saveCourse('texas','EASY',{score:400,stars:2,time:54,control:'variable',sections:[10,20],souvenirs:1});
 api.Storage.saveCourse('texas','EASY',{score:800,stars:3,time:52,control:'fixed',souvenirs:2});
 assert.equal(api.Storage.getRecords()['texas:EASY:variable'].score,400);
 assert.equal(api.Storage.getRecords()['texas:EASY:fixed'].score,800);
 assert.equal(api.Storage.getLegacyRecords()['texas:EASY'].score,99999);
 api.Storage.write('barkour_adventure_records_v2',{'texas:EASY:fixed':{version:1,score:999}});assert.equal(Object.keys(api.Storage.getRecords()).length,0);
});

test('surface launch ignores release; protected practice hit completes teaching',()=>{
 const api=runtime();for(const t of [1,3]){
  const g=gameFor(api,t);g.distance=g.course.surfaces[0].worldX-40;g.updatePlaying(1/120);
  g.releaseJump();assert.equal(g.character.velocityY,-1120);
 }
 const g=gameFor(api);g.powers.shield=1;g.hitObstacle(g.course.obstacles[0]);assert.equal(g.firstCleared,true);assert.equal(g.damage,0);
});

test('every v3 destination keeps all three rosettes obtainable without pet-specific mechanics',()=>{
 const api=runtime();
 for(let track=0;track<5;track++)for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++)for(const assisted of [false,true]){
  const g=gameFor(api,track,speed,dog);g.assisted=assisted;
  for(const pickup of g.course.pickups.filter(p=>p.type==='souvenir')){
   const bounds=g.character.getBounds();g.course.activeRoute=pickup.route||'main';pickup.worldX=g.distance;pickup.y=bounds.y+bounds.height/2;g.collectPickups(bounds,1/120);
  }
  assert.equal(g.souvenirs,3,`${track}/${speed}/${dog}/${assisted}`);
 }
});

test('mastery inputs collect all three physical rosettes on every v3 destination',()=>{
 const api=runtime();
 for(let track=0;track<5;track++)for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++)for(const assisted of [false,true]){
  const g=gameFor(api,track,speed,dog);g.assisted=assisted;
  for(let i=0;i<20000&&g.state==='PLAYING';i++){
   const finale=g.course.pickups.find(p=>p.type==='souvenir'&&p.slot===2&&!p.collected);
   const obstacle=g.course.obstacles.find(o=>!o.hit&&!o.passed&&o.worldX>g.distance-80);
   const gate=g.course.routeGates.find(item=>!item.selected);
   const platformGap=g.course.platforms?.[0]&&!g.course.platformGapCleared?{worldX:g.course.platforms[0].worldEnd}:null;
   const candidate=[[finale,.30],[obstacle,.57],[gate,.57],[platformGap,.22]].filter(([item])=>item&&item.worldX>g.distance).sort((a,b)=>a[0].worldX-b[0].worldX)[0];
   if(candidate&&!g.character.isJumping&&candidate[0].worldX-g.distance<g.gameSpeed*60*candidate[1])g.jump();
   g.updatePlaying(1/120);if(platformGap&&g.distance>=platformGap.worldX)g.course.platformGapCleared=true;
  }
  assert.equal(g.state,'COMPLETE',`${track}/${speed}/${dog}/${assisted}`);assert.equal(g.damage,0);assert.equal(g.souvenirs,3,`${track}/${speed}/${dog}/${assisted}`);
 }
});

test('Ember outlined-prism stays inactive at real contact for every difficulty and control mode',()=>{
 const api=runtime();
 for(let speed=0;speed<3;speed++)for(const assisted of [false,true]){
  const g=gameFor(api,4,speed);g.assisted=assisted;
  const prism=g.course.obstacles.find(o=>o.beatId==='outlined-prism');g.course.obstacles=[prism];
  for(let i=0;i<3000&&!prism.passed&&!prism.hit;i++)g.updatePlaying(1/120);
  assert.equal(prism.hit,false,`${speed}/${assisted}: outlined prism hit`);assert.equal(prism.passed,true,`${speed}/${assisted}: prism was not reached`);
  assert.equal(prism.active,false,`${speed}/${assisted}: prism became solid at contact`);assert.equal(g.damage,0);
 }
});

test('declared v3 safe responses survive their real arrival timing',()=>{
 const api=runtime();
 for(let track=0;track<5;track++)for(let speed=0;speed<3;speed++)for(const assisted of [false,true]){
  const template=new api.Course(api.TRACKS[track],api.CONFIG.DIFFICULTY[['EASY','MEDIUM','HARD'][speed]]);
  for(const beat of template.beats){
   const authored=template.obstacles.filter(o=>o.beatId===beat.id),surface=template.surfaces.find(item=>item.beatId===beat.id),gate=template.routeGates.find(item=>item.beatId===beat.id);
   if(!authored.length&&!surface&&!gate)continue;
   const g=gameFor(api,track,speed);g.assisted=assisted;g.course.obstacles=authored;
   const runtimeSurface=g.course.surfaces.find(item=>item.beatId===beat.id),runtimeGate=g.course.routeGates.find(item=>item.beatId===beat.id);
   // Safe power beats must also work as ordinary jumps if the optional star is missed.
   g.course.pickups=g.course.pickups.filter(p=>p.type!=='star');
   const target=Math.max(...authored.map(o=>o.worldX),surface?.worldX||0,gate?.rejoinX||0);
   for(let i=0;i<10000&&g.state==='PLAYING'&&g.distance<target+260;i++){
    const next=g.course.obstacles.find(o=>!o.hit&&!o.passed&&o.worldX>g.distance-80);
    const needsJump=['tap','leap','power-fallback'].includes(beat.intent.safe.response);
    if(needsJump&&next&&!g.character.isJumping&&next.worldX>g.distance&&next.worldX-g.distance<g.gameSpeed*60*(beat.intent.safe.response==='tap'?.39:.57)){
     g.jump();if(beat.intent.safe.response==='tap')g.releaseJump();
    }
    g.updatePlaying(1/120);
   }
   assert.equal(g.damage,0,`${api.TRACKS[track].id}/${speed}/${assisted}/${beat.id}`);
   if(surface)assert.equal(runtimeSurface.used,true,`${beat.id} surface`);
   if(gate&&beat.intent.safe.response==='none')assert.equal(runtimeGate.route,'main',`${beat.id} safe route`);
  }
 }
});

test('all v3 Explorer-safe paths work for both pets, difficulties, and control modes',()=>{
 const api=runtime();
 for(let track=0;track<5;track++)for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++)for(const assisted of [false,true]){
  const g=gameFor(api,track,speed,dog);g.assisted=assisted;
  autoRun(g);assert.equal(g.state,'COMPLETE');assert.equal(g.damage,0);assert.equal(g.result.stars,3);assert.equal(g.course.routeHistory[0]?.route,'main');
 }
});

test('reduced motion freezes decorative layers and removes landing particles; recovery survives one deliberate error',()=>{
 const api=runtime();const g=gameFor(api);g.reducedMotion=true;g.jump();for(let i=0;i<160;i++)g.updatePlaying(1/120);
 assert.equal(g.background.distance,0);assert.equal(g.character.dust.length,0);assert.equal(g.effects.length,0);
 for(let t=0;t<5;t++)for(let d=0;d<3;d++){
  const run=gameFor(api,t,d);run.powers.shield=0;run.hitObstacle(run.course.obstacles[2]);autoRun(run);assert.equal(run.state,'COMPLETE');assert.equal(run.damage,1);
 }
});

test('v3 moving signatures retain a contiguous quarter-second full-leap input window',()=>{
 const api=runtime();let worst=Infinity;
 for(let track=0;track<5;track++)for(const profile of Object.values(api.CONFIG.DIFFICULTY))for(const pack of api.CHARACTER_ASSETS){
  for(const pattern of ['signature']){
   let longest=0,streak=0;
   for(let leadTick=30;leadTick<=110;leadTick++){
    const course=new api.Course(api.TRACKS[track],profile),dog=new api.Character(pack,260);
    const source=[course.obstacles.find(o=>o.motion)||course.obstacles.find(o=>o.smash)];
    const origin=source[0].originX;
    course.obstacles=source.map(o=>({...o,worldX:1200+o.worldX-origin,originX:1200+o.originX-origin}));
    let distance=0,jumped=false,hit=false;const speed=profile.MAX_SPEED*60*1.2;
    for(let tick=0;tick<600;tick++){
     course.update(1/120,distance,tick/120);
     if(!jumped&&course.obstacles[0].worldX-distance<speed*leadTick/120){dog.jump();jumped=true;}
     dog.update(1/120,speed/60);distance+=speed/120;
     for(const o of course.obstacles)if(o.active!==false&&api.Collision.checkCollision(dog.getBounds(),course.bounds(o,distance)))hit=true;
     if(hit||course.bounds(course.obstacles.at(-1),distance).x+course.obstacles.at(-1).width<dog.getBounds().x)break;
    }
    streak=!hit&&jumped?streak+1:0;longest=Math.max(longest,streak);
   }
   worst=Math.min(worst,longest);assert.ok(longest>=30,`${track}/${profile.LABEL}/${pack.name}/${pattern}: ${longest} ticks`);
  }
 }
 console.log('Minimum contiguous moving/pair jump window seconds:',(worst/120).toFixed(3));
});

test('half-resolution gameplay sheets preserve source pixels and world-space pivots',()=>{
 const api=runtime();
 for(const pack of api.CHARACTER_ASSETS)for(const state of ['idle','run','rise']){
  const clip=pack.animations[pack.states[state].animation],resolution=state==='idle'?512:256;
  assert.deepEqual(fs.readFileSync(path.join(root,clip.sheet)),fs.readFileSync(path.join(root,'new-assets',pack.name.toLowerCase(),String(resolution),pack.states[state].animation+'.webp')));
  let draw;const ctx={save(){},restore(){},drawImage(...args){draw=args;}};
  api.Character.drawPose(ctx,pack,state,0,260,600,224);
  assert.equal(draw[3],resolution);assert.equal(draw[4],resolution);
  assert.equal(draw[5],148);assert.equal(draw[6],600-456*224/512);assert.equal(draw[7],224);
 }
});

test('finish photos freeze the crossing sprite frame and height for both dogs on all trails',()=>{
 const api=runtime();
 for(let track=0;track<5;track++)for(let dog=0;dog<2;dog++)for(const flight of [0,.15,.57,.95]){
  const g=gameFor(api,track,0,dog);g.course.obstacles=[];g.course.pickups=[];g.course.surfaces=[];
  if(flight){g.jump();for(let i=0;i<flight*120;i++)g.character.update(1/120,g.gameSpeed);}
  g.wallTime=54.321;g.distance=g.course.length-.01;g.updatePlaying(1/120);
  assert.equal(g.state,'COMPLETE');const photo=g.finishPhoto;
  assert.equal(photo.pose.frame,api.Character.frameAt(g.character.asset,g.character.animationState,g.character.animationTime));
  assert.equal(photo.pose.clip,g.character.asset.states[g.character.animationState].animation);
  assert.equal(api.FinishPhoto.height(photo),g.character.groundY-g.character.y);assert.equal(photo.seconds,54.321);
  assert.equal(photo.assetId,g.character.asset.assetId);assert.equal(photo.track,g.course.track.id);
  if(flight)assert.ok(api.FinishPhoto.height(photo)>0);
  const frozen=JSON.stringify(photo);g.update(1000);g.returnToMenu();g.startGame();
  assert.equal(JSON.stringify(photo),frozen);assert.equal(g.finishPhoto,null);
 }
});

test('finish album preserves newest 24 memories independently of records and rejects corrupt entries',()=>{
 const api=runtime(),g=gameFor(api);g.wallTime=49.9;const photo=api.FinishPhoto.capture(g);
 for(let i=0;i<30;i++)api.Storage.saveFinishPhoto({...photo,created:1000+i});
 const photos=api.Storage.getFinishPhotos();assert.equal(photos.length,24);assert.equal(photos[0].created,1029);assert.equal(photos.at(-1).created,1006);
 assert.equal(Object.keys(api.Storage.getRecords()).length,0);
 api.Storage.write(api.Storage.PHOTO_KEYS.v3,[]);
 api.Storage.write('barkour_finish_photos_v1',[{...photo,frame:99},{...photo,height:NaN},{...photo,dog:'unknown'}, {...photo,version:1,dog:'Buddy',clip:'run',frame:0,height:0}]);
 assert.equal(api.Storage.getFinishPhotos().length,1);
 assert.equal(api.FinishPhoto.time(59.96),'1:00.0');assert.equal(api.FinishPhoto.time(54.321),'0:54.3');
});

test('pet manifests validate to a safe Buddy fallback and retain diagnostics',()=>{
 const api=runtime();api.PetManifest.resetDiagnostics();
 assert.equal(api.EQUAL_PET_GAMEPLAY_BODY_ID,'equal-pet-v1');
 assert.deepEqual(Array.from(api.CHARACTER_ASSETS,p=>p.assetId),['buddy','neet']);
 for(const pack of api.CHARACTER_ASSETS){
  assert.equal(pack.schemaVersion,1);assert.equal(pack.gameplayBodyId,'equal-pet-v1');
  assert.ok(pack.presentation.scale>=.82&&pack.presentation.scale<=1.18);
  assert.ok(Math.abs(pack.presentation.baselineOffset)<=48);
  assert.equal(api.PetManifest.validate(pack).valid,true);
 }
 const malformed={...api.CHARACTER_ASSETS[1],animations:{...api.CHARACTER_ASSETS[1].animations,run:{...api.CHARACTER_ASSETS[1].animations.run,durationsMs:[]}}};
 const fallback=api.PetManifest.normalize(malformed,api.CHARACTER_ASSETS[0]);
 assert.equal(fallback.assetId,'buddy');assert.equal(api.PetManifest.diagnostics.length,1);
});

test('representative silhouettes remain presentation-only and share canonical collision bounds',()=>{
 const api=runtime(),base=api.CHARACTER_ASSETS[0],body=new api.Character(base,260).getBounds();
 assert.deepEqual(Array.from(api.DEV_SILHOUETTE_FIXTURES,f=>f.tags[0]),['small','medium','tall','long','fluffy']);
 for(const fixture of api.DEV_SILHOUETTE_FIXTURES){
  const dog=new api.Character(api.PetManifest.fixture(base,fixture.id),260);
  assert.deepEqual(dog.getBounds(),body,fixture.id);
  const visual=dog.getVisualBounds();assert.ok(visual.width>0&&visual.height>0,fixture.id);
 }
});

test('identical input histories keep Buddy and Neet mechanically equivalent',()=>{
 const api=runtime(),dogs=api.CHARACTER_ASSETS.map(pack=>new api.Character(pack,260));
 for(let step=0;step<360;step++){
  if(step===0||step===180)dogs.forEach(d=>d.jump());
  if(step===22||step===202)dogs.forEach(d=>d.releaseJump());
  dogs.forEach(d=>d.update(1/120,7));
  assert.deepEqual(dogs[0].getBounds(),dogs[1].getBounds());
  assert.equal(dogs[0].y,dogs[1].y);assert.equal(dogs[0].velocityY,dogs[1].velocityY);
 }
});

test('v3 records use an isolated key while v2 remains the active course boundary',()=>{
 const api=runtime();
 api.Storage.saveCourse('texas','EASY',{version:2,control:'variable',stars:3,score:400,time:50});
 api.Storage.saveCourse('texas','EASY',{version:3,control:'variable',stars:1,score:12,time:99});
 assert.equal(api.Storage.getRecords(2)['texas:EASY:variable'].score,400);
 assert.equal(api.Storage.getRecords(3)['texas:EASY:variable'].score,12);
 assert.equal(api.Storage.read(api.Storage.RECORD_KEYS.v2,{})['texas:EASY:variable'].version,2);
 assert.equal(api.Storage.read(api.Storage.RECORD_KEYS.v3,{})['texas:EASY:variable'].version,3);
});

test('v3 finish records persist asset id and normalized pose while v1 photos remain readable',()=>{
 const api=runtime(),g=gameFor(api),photo=api.FinishPhoto.capture(g);
 assert.equal(photo.version,3);assert.equal(photo.assetId,'buddy');assert.ok(photo.pose.normalizedHeight>=0&&photo.pose.normalizedHeight<=1);
 api.Storage.saveFinishPhoto(photo);
 const raw=api.Storage.read(api.Storage.PHOTO_KEYS.v3,[])[0];
 assert.equal(raw.assetId,'buddy');assert.equal(raw.height,undefined);assert.equal(raw.pose.state,'run');
 api.Storage.write(api.Storage.PHOTO_KEYS.v1,[{version:1,track:'alpine',dog:'Neet',clip:'jump',frame:2,height:120,seconds:40,created:2,distance:100,difficulty:'EASY',control:'variable'}]);
 assert.equal(api.Storage.getLegacyFinishPhotos()[0].assetId,'neet');
 assert.equal(api.Storage.getFinishPhotos().length,2);
});

test('a structurally valid future pet loads, stays mechanically equal, and round-trips a v2 finish photo',()=>{
 const api=runtime(),future={...api.CHARACTER_ASSETS[0],assetId:'mystery-pup',displayName:'Mystery Pup',tags:['tall'],visualBounds:{x:100,y:30,w:330,h:429},focusPoint:{x:250,y:230},presentation:{scale:1.12,baselineOffset:-12}};
 assert.equal(api.PetManifest.validate(future).valid,true);
 assert.equal(api.PetManifest.normalize(future,api.CHARACTER_ASSETS[0]).assetId,'mystery-pup');
 const buddy=new api.Character(api.CHARACTER_ASSETS[0],260),pup=new api.Character(future,260);
 buddy.jump();pup.jump();for(let i=0;i<180;i++){buddy.update(1/120,7);pup.update(1/120,7);assert.deepEqual(pup.getBounds(),buddy.getBounds());}
 const g=gameFor(api),photo=api.FinishPhoto.capture(g);api.Storage.saveFinishPhoto({...photo,assetId:'mystery-pup'});
 const restored=api.Storage.getCurrentFinishPhotos()[0];assert.equal(restored.assetId,'mystery-pup');assert.equal(restored.pose.normalizedHeight,photo.pose.normalizedHeight);
});

test('a staged Texas v3 course reads, compares, and writes only v3 records',()=>{
 const api=runtime(),texas=api.TRACKS[0];texas.courseVersion=3;
 try {
  api.Storage.saveCourse('texas','EASY',{version:2,control:'variable',stars:3,score:999,time:40});
  api.Storage.saveCourse('texas','EASY',{version:3,control:'fixed',stars:1,score:10,time:80});
  const g=gameFor(api);assert.equal(g.course.version,3);assert.equal(g.previousRecord.score,10);
  g.damage=0;g.treats=g.course.totalTreats;g.finish();
  assert.equal(g.result.version,3);assert.ok(api.Storage.getRecords(3)['texas:EASY:fixed'].score>10);
  assert.equal(api.Storage.getRecords(2)['texas:EASY:variable'].score,999);
 } finally { delete texas.courseVersion; }
});

test('storage rejects unsupported course versions without aliasing them to v3',()=>{
 const api=runtime();
 assert.equal(api.Storage.recordVersion(4),null);assert.equal(api.Storage.recordsKey(4),null);
 assert.equal(Object.keys(api.Storage.getRecords(4)).length,0);
 assert.equal(api.Storage.saveCourse('texas','EASY',{version:4,control:'variable',score:100,stars:3,time:1}),null);
 assert.equal(api.Storage.read(api.Storage.RECORD_KEYS.v3, null),null);
});

test('blocked storage does not prevent a completed run or its current finish photo',()=>{
 const api=runtime(),g=gameFor(api);api.localStorage.getItem=()=>{throw new Error('blocked');};api.localStorage.setItem=()=>{throw new Error('blocked');};
 g.damage=0;g.treats=g.course.totalTreats;g.finish();
 assert.equal(g.state,'COMPLETE');assert.equal(g.result.version,3);assert.ok(g.finishPhoto);assert.equal(g.finishPhotoSaved,false);
});

test('staged v3 record groups keep current rows separate from a readable v2 archive',()=>{
 const api=runtime(),track=api.TRACKS[0];
 const current={'texas:EASY:variable':{version:3,stars:2,score:321,souvenirs:1,time:48}};
 const archived={'texas:EASY:variable':{version:2,stars:3,score:999,souvenirs:3,time:42.4},'texas:HARD:fixed':{version:2,stars:1,score:80,souvenirs:0,time:66}};
 const groups=api.GameUI.recordGroups(track,3,current,archived);
 assert.equal(groups.current[0].modes[0].record.score,321);
 assert.equal(groups.archive[0].modes[0].record.score,999);
 assert.equal(groups.archive[2].modes[1].record.time,66);
 const currentMarkup=api.GameUI.renderRecordRows(groups.current,stars=>`S${stars}`);
 const archiveMarkup=api.GameUI.renderRecordRows(groups.archive,stars=>`S${stars}`,true);
 assert.match(currentMarkup,/321/);assert.doesNotMatch(currentMarkup,/999/);
 assert.match(archiveMarkup,/999/);assert.match(archiveMarkup,/42\.4s/);assert.match(archiveMarkup,/66\.0s/);
 assert.equal(api.GameUI.recordGroups(track,2,current,archived).archive,null);
});

test('five v3 manifests validate, compile deterministically, and retain distinct authored signatures',()=>{
 const api=runtime();assert.equal(api.validateCourseManifest(api.TEXAS_V3_MANIFEST).valid,true);
 const texas=new api.Course(api.TRACKS[0],api.CONFIG.DIFFICULTY.EASY);
 assert.equal(texas.version,3);assert.equal(texas.length,62*6*60);assert.equal(JSON.stringify(texas),JSON.stringify(new api.Course(api.TRACKS[0],api.CONFIG.DIFFICULTY.EASY)));
 assert.deepEqual(Array.from(texas.beats,b=>b.id),['first-hop','first-leap','canyon-fork','tumble-one','tumble-two','tumble-three','big-sky','bridge-run','stampede','golden-arch']);
 assert.ok(texas.platforms.some(platform=>platform.style==='pipeline'));assert.ok(texas.recoveryZones.some(z=>z.beatId==='big-sky'));
 const signatures=[...api.TRACKS].map(track=>{const course=new api.Course(track,api.CONFIG.DIFFICULTY.EASY);assert.equal(course.version,3);assert.equal(JSON.stringify(course),JSON.stringify(new api.Course(track,api.CONFIG.DIFFICULTY.EASY)));return `${course.beats.map(b=>b.id).join('/')}:${course.obstacles.map(o=>o.motion||o.type).join('/')}`;});
 assert.equal(new Set(signatures).size,5);
 assert.ok(new api.Course(api.TRACKS[1],api.CONFIG.DIFFICULTY.EASY).surfaces.some(s=>s.kind==='snow'));
 assert.ok(new api.Course(api.TRACKS[2],api.CONFIG.DIFFICULTY.EASY).obstacles.some(o=>o.motion==='patrol'));
 assert.ok(new api.Course(api.TRACKS[3],api.CONFIG.DIFFICULTY.EASY).surfaces.some(s=>s.kind==='spring'));
 assert.ok(new api.Course(api.TRACKS[4],api.CONFIG.DIFFICULTY.EASY).obstacles.some(o=>o.motion==='phase'));
});

test('v3 preserves the three-rosette and all-available-treat reward contracts',()=>{
 const api=runtime();
 for(let track=0;track<5;track++){
  const course=new api.Course(api.TRACKS[track],api.CONFIG.DIFFICULTY.MEDIUM),rosettes=course.pickups.filter(p=>p.type==='souvenir'),treats=course.pickups.filter(p=>p.type==='treat');
  assert.equal(rosettes.length,3);assert.deepEqual(Array.from(rosettes,p=>p.slot),[0,1,2]);assert.equal(course.totalTreats,treats.length);
  const threshold=Math.ceil(course.totalTreats*.6),below=gameFor(api,track);below.treats=threshold-1;below.damage=0;below.finish();assert.equal(below.result.stars,2);
  const at=gameFor(api,track);at.treats=threshold;at.damage=0;at.finish();assert.equal(at.result.stars,3);
 }
});

test('v3 records retain every authored beat while v2 remains capped to seven sections',()=>{
 const api=runtime(),v3=Array.from({length:10},(_,i)=>i+1),v2=Array.from({length:10},(_,i)=>i+1);
 api.Storage.saveCourse('texas','EASY',{version:3,control:'variable',score:100,stars:1,time:60,souvenirs:0,sections:v3});
 api.Storage.saveCourse('alpine','EASY',{version:2,control:'variable',score:100,stars:1,time:60,souvenirs:0,sections:v2});
 assert.equal(api.Storage.getRecords(3)['texas:EASY:variable'].sections.length,10);
 assert.equal(api.Storage.getRecords(2)['alpine:EASY:variable'].sections.length,7);
});

test('Texas Explorer-safe completion works for every equal pet, difficulty, and control mode',()=>{
 const api=runtime();
 for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++)for(const assisted of [false,true]){
  const g=gameFor(api,0,speed,dog);g.assisted=assisted;autoRun(g);
  assert.equal(g.state,'COMPLETE',`${speed}/${dog}/${assisted}`);assert.equal(g.damage,0);assert.equal(g.course.routeHistory[0]?.route,'main');
 }
});

test('Texas canyon gate selects the optional high line by timing and always rejoins the main route',()=>{
 const api=runtime(),g=gameFor(api),gate=g.course.routeGates[0];
 g.course.obstacles=[];g.distance=gate.worldX-180;g.jump();for(let i=0;i<90;i++)g.updatePlaying(1/120);
 assert.equal(gate.route,'high');assert.ok(g.course.pickups.some(p=>p.route==='high'&&p.collected));
 while(!gate.rejoined)g.updatePlaying(1/120);
 assert.equal(g.course.activeRoute,'main');assert.equal(g.damage,0);
});

test('every v3 authored warning and recovery meets its declared runtime contract',()=>{
 const api=runtime();
 for(const track of api.TRACKS)for(const profile of Object.values(api.CONFIG.DIFFICULTY)){
  const course=new api.Course(track,profile);
  assert.equal(course.recoveryZones.length,course.beats.length);
  for(const zone of course.recoveryZones){
   assert.ok(zone.until>zone.start,`${track.id}/${zone.beatId} recovery`);
   assert.ok(['main','finish'].includes(zone.exit),`${track.id}/${zone.beatId} exit`);
  }
  for(const warning of course.warnings){
   const obstacle=course.obstacles.find(o=>o.beatId===warning.beatId),closing=profile.MAX_SPEED*60*1.2+(obstacle?.rate||0);
   const seconds=(warning.lead-90)/(closing*api.CONFIG.CAMERA.PORTRAIT_PACE);
   assert.ok(seconds>=warning.minSeconds,`${track.id}/${warning.beatId}: ${seconds}`);
  }
 }
});

test('Texas stampede fences retain an ordinary full-leap fallback when Super Paws is missed',()=>{
 const api=runtime();
 for(const profile of Object.values(api.CONFIG.DIFFICULTY))for(const pack of api.CHARACTER_ASSETS){
  for(const fence of new api.Course(api.TRACKS[0],profile).obstacles.filter(o=>o.smash)){
   let success=0;
   for(let lead=30;lead<110;lead++){
    const course=new api.Course(api.TRACKS[0],profile),dog=new api.Character(pack,260);const target=course.obstacles.find(o=>o.beatId===fence.beatId&&o.smash);target.worldX=1200;target.originX=1200;course.obstacles=[target];let distance=0,hit=false,jumped=false;const speed=profile.MAX_SPEED*60*1.2;
    for(let tick=0;tick<500;tick++){if(!jumped&&target.worldX-distance<speed*lead/120){dog.jump();jumped=true;}dog.update(1/120,speed/60);distance+=speed/120;if(api.Collision.checkCollision(dog.getBounds(),course.bounds(target,distance)))hit=true;if(course.bounds(target,distance).x+target.width<dog.getBounds().x)break;}
    if(!hit)success++;
   }
   assert.ok(success>=30,`${profile.LABEL}/${pack.assetId}/${fence.beatId}`);
  }
 }
});

test('Texas Flow is limited to clean clears and completed phrases; damage only resets the active phrase',()=>{
 const api=runtime(),g=gameFor(api),obstacle=g.course.obstacles.find(o=>!o.tutorial);
 g.distance=obstacle.worldX+200;g.updatePlaying(1/120);assert.equal(g.flow.lastEvent,'Clean clear');assert.ok(g.flow.phrase>0);
 const phrase=g.course.phrases['hop-line'];phrase.pickups.forEach(p=>p.collected=true);assert.equal(g.course.completePhrase('hop-line'),true);g.addFlow('Treat phrase complete');const total=g.flow.total;
 g.hitObstacle(g.course.obstacles.find(o=>!o.hit&&!o.tutorial));assert.equal(g.flow.phrase,0);assert.equal(g.flow.total,total);
});

test('Texas Flow gently decays during inactivity without erasing run totals',()=>{
 const api=runtime(),g=gameFor(api);g.course.obstacles=[];g.course.pickups=[];g.flow.phrase=2;g.flow.total=5;
 for(let i=0;i<479;i++)g.updatePlaying(1/120);
 assert.equal(g.flow.phrase,2);
 g.updatePlaying(1/120);assert.equal(g.flow.phrase,1);assert.equal(g.flow.total,5);assert.equal(g.flow.lastEvent,'Flow eases');
});

test('Texas failure keeps a recorded diagnosis and retry resets it with a short ready beat',()=>{
 const api=runtime(),g=gameFor(api),obstacle=g.course.obstacles.find(o=>!o.tutorial);
 g.hitObstacle(obstacle);assert.equal(g.lastFailure.diagnosis,'no-jump');assert.equal(g.lastFailure.beatId,obstacle.beatId);
 g.flow.phrase=3;g.startGame({retry:true});assert.equal(g.countdown,.6);assert.equal(g.lastFailure,null);assert.equal(g.flow.phrase,0);assert.equal(g.course.version,3);
 g.state='PLAYING';g.pause();const distance=g.distance;g.update(1000);assert.equal(g.distance,distance);
});

test('finish memories render only the selected runner through the shared GOOD DOG gate',()=>{
 const api=runtime(),photo=api.FinishPhoto.capture(gameFor(api));
 assert.equal(photo.assetId,'buddy');assert.equal(typeof api.GameUI.companionForPhoto,'undefined');assert.equal(typeof api.GameUI.prototype.drawHomecomingPhoto,'undefined');
 const uiSource=fs.readFileSync(path.join(root,'js','game-ui.js'),'utf8'),photoSource=fs.readFileSync(path.join(root,'js','finish-photo.js'),'utf8');
 assert.doesNotMatch(uiSource,/drawHomecomingPhoto|companionForPhoto/);assert.match(photoSource,/Art\.finishGate\(ctx,pawX,600,track\.accent,\{celebrate:true\}\)/);
});

test('Texas result keeps one proud moment and one contextual next goal',()=>{
 const api=runtime(),g=gameFor(api);g.smashes=2;g.treats=0;g.damage=1;g.souvenirs=0;g.flow.total=0;
 assert.match(g.proudMoment(),/Super Paws stampede/);
 assert.match(g.nextGoal().label,/treats/);
});

test('destination route and Flow copy comes from the active authored trail',()=>{
 const api=runtime();
 for(let index=1;index<api.TRACKS.length;index++){
  const g=gameFor(api,index);const gate=g.course.routeGates[0],beat=g.course.beatById[gate.beatId];
  assert.ok(beat.cue);assert.doesNotMatch(beat.cue,/Canyon fork/i);
  g.flow.total=2;assert.match(g.proudMoment(),new RegExp(g.course.track.name));assert.doesNotMatch(g.proudMoment(),/Suntrail/);
 }
});

test('practice is runtime-only and exits into a clean full run',()=>{
 const api=runtime(),g=gameFor(api),practice=g.course.practiceSections[0],before=JSON.stringify(api.Storage.getRecords(3));
 api.Storage.saveCourse=()=>{throw new Error('practice must not save a record');};
 api.Storage.saveFinishPhoto=()=>{throw new Error('practice must not save a photo');};
 g.startGame({practiceId:practice.id});assert.equal(g.runContext.kind,'practice');assert.equal(g.score,0);assert.equal(g.souvenirs,0);
 g.state='PLAYING';g.distance=g.runContext.endX;g.finish();assert.equal(g.state,'PRACTICE_COMPLETE');assert.equal(g.finishPhoto,null);assert.equal(JSON.stringify(api.Storage.getRecords(3)),before);
 g.startGame();assert.equal(g.runContext.kind,'full');assert.equal(g.distance,0);assert.equal(g.score,0);assert.equal(g.souvenirs,0);
});

test('photo buckets retain every archive version and preserve a removed pet identity',()=>{
 const api=runtime(),g=gameFor(api),photo=api.FinishPhoto.capture(g);
 for(let i=0;i<30;i++)api.Storage.saveFinishPhoto({...photo,created:1000+i});
 api.Storage.write(api.Storage.PHOTO_KEYS.v2,[{version:2,track:'texas',assetId:'removed-pup',petLabel:'Retired Pal',pose:{state:'run',clip:'run',frame:0,normalizedHeight:0},seconds:40,created:5,distance:100,difficulty:'EASY',control:'variable'}]);
 api.Storage.write(api.Storage.PHOTO_KEYS.v1,[{version:1,track:'alpine',dog:'Neet',clip:'run',frame:0,height:0,seconds:40,created:6,distance:100,difficulty:'EASY',control:'variable'}]);
 const buckets=api.Storage.getFinishPhotoBuckets();assert.equal(buckets.current.length,24);assert.equal(buckets.previous.length,1);assert.equal(buckets.classic.length,1);
 assert.equal(buckets.previous[0].assetId,'removed-pup');assert.equal(buckets.previous[0].petLabel,'Retired Pal');assert.equal(buckets.previous[0].assetAvailable,false);
});

test('contextual goal priority selects one bounded next action',()=>{
 const api=runtime(),g=gameFor(api);g.treats=0;g.damage=2;g.souvenirs=0;assert.equal(g.nextGoal().kind,'treat-star');
 g.treats=Math.ceil(g.course.totalTreats*.6);assert.equal(g.nextGoal().kind,'clean-star');
 g.damage=0;assert.equal(g.nextGoal().kind,'rosette');
 g.souvenirs=3;g.flow.total=0;assert.equal(g.nextGoal().kind,'flow');
});

test('incompatible or unknown-provenance v3 records archive before a current record replaces them',()=>{
 const api=runtime(),base={version:3,control:'variable',stars:3,score:100,time:40,souvenirs:3,sections:[10,20],courseLayoutId:'old-layout',capabilityProfile:'old-cap'};
 api.Storage.saveCourse('texas','EASY',base);
 const result=api.Storage.saveCourse('texas','EASY',{...base,score:1,sections:[1,2],courseLayoutId:'new-layout',capabilityProfile:'new-cap'});
 assert.equal(result.saved,true);assert.equal(result.archived,true);
 const stored=api.Storage.getRecords(3)['texas:EASY:variable'];
 assert.equal(stored.score,1);assert.deepEqual(Array.from(stored.sections),[1,2]);assert.equal(stored.courseLayoutId,'new-layout');assert.equal(stored.capabilityProfile,'new-cap');
 assert.equal(api.Storage.getArchivedV3Records()[0].record.score,100);
 api.Storage.write(api.Storage.RECORD_KEYS.v3,{'coast:EASY:variable':{version:3,score:90,stars:2,time:50,souvenirs:1,sections:[9,8]}});
 const migrated=api.Storage.saveCourse('coast','EASY',{...base,score:80,sections:[3,4],courseLayoutId:'coast-v3-core',capabilityProfile:'equal-pet-v1'});
 assert.equal(migrated.saved,true);assert.equal(migrated.archived,true);assert.equal(api.Storage.getArchivedV3Records().some(entry=>entry.key==='coast:EASY:variable'&&entry.record.score===90),true);
 const g=gameFor(api);g.previousRecord={...stored,courseLayoutId:g.course.layoutId,sections:[100,100]};g.sectionScores=[1,1];g.treats=g.course.totalTreats;g.damage=0;g.souvenirs=3;g.flow.total=2;
 assert.equal(g.nextGoal().kind,'favorite');
});

test('Stage A fixed runs exactly match pre-edit fixed physics, scoring, recovery, layout and finish poses',()=>{
 const api=runtime(),baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/stage-a-fixed-baseline.json')));
 for(const row of baseline.rows){
  const g=autoRun(gameFor(api,row.track,row.speed,row.dog));
  const actual={track:row.track,speed:row.speed,dog:row.dog,layout:g.course.layoutId,capability:g.runContext.capabilityProfile,score:g.result.score,time:g.playTime,damage:g.damage,treats:g.treats,souvenirs:g.souvenirs,stars:g.result.stars,sections:g.sectionScores,pose:g.finishPhoto.pose};
  assert.deepEqual(JSON.parse(JSON.stringify(actual)),row);
 }
});

function inputFor(game) {
 const documentEvents={},canvasEvents={},windowEvents={};
 game.canvas.addEventListener=(type,callback)=>canvasEvents[type]=callback;
 game.canvas.focus=()=>{};game.canvas.setPointerCapture=()=>{};
 const context=vm.createContext({document:{addEventListener:(type,callback)=>documentEvents[type]=callback,getElementById:()=>({classList:{contains:()=>true}})},window:{addEventListener:(type,callback)=>windowEvents[type]=callback}});
 vm.runInContext(fs.readFileSync(path.join(root,'js/input.js'),'utf8'),context);
 game.inputHandler=new (vm.runInContext('InputHandler',context))(game);
 const event=extra=>({preventDefault(){},target:{closest:()=>null},repeat:false,isPrimary:true,button:0,pointerId:1,...extra});
 return {key:(type,code='Space',extra={})=>documentEvents[type](event({code,...extra})),pointer:(type,extra={})=>canvasEvents[type](event(extra)),blur:()=>windowEvents.blur()};
}
function airborneTrace(game,input,releaseTick) {
 input.key('keydown');const trace=[];
 for(let tick=0;tick<180;tick++){
  if(tick===releaseTick)input.key('keyup');
  game.character.update(1/120,6);trace.push([game.character.y,game.character.velocityY,game.character.animationState]);
 }
 return JSON.parse(JSON.stringify(trace));
}
test('handler release duration is invariant for both dogs, including a held key',()=>{
 const api=runtime();
 for(let dog=0;dog<2;dog++){
  let reference;
  for(const release of [0,1,12,36,70,139,Infinity]){
   const g=gameFor(api,0,0,dog),trace=airborneTrace(g,inputFor(g),release);
   if(reference)assert.deepEqual(trace,reference);else reference=trace;
   assert.equal(g.character.isJumping,false);assert.equal(g.jumps,1);
  }
 }
});
test('held keyboard and pointer do not repeat; sources form one gesture until all end',()=>{
 const api=runtime();
 for(const first of ['key','pointer']){
  const g=gameFor(api),input=inputFor(g);
  if(first==='key'){input.key('keydown');input.pointer('pointerdown');}else{input.pointer('pointerdown');input.key('keydown');}
  input.key('keydown','Space',{repeat:true});input.key('keydown','ArrowUp');
  assert.equal(g.jumps,1);assert.equal(g.character.jumpBuffer,0);
  for(let i=0;i<200;i++)g.character.update(1/120,6);
  input.key('keydown','Space',{repeat:true});assert.equal(g.character.isJumping,false);
  input.key('keyup');input.pointer('pointerup');assert.equal(g.inputHandler.held.size,1);
  input.key('keyup','ArrowUp');input.pointer('pointerdown');assert.equal(g.jumps,2);
 }
});
test('pointer cancellation and lost capture clear only the matching pointer, without cutting its arc',()=>{
 const api=runtime();
 for(const end of ['pointerup','pointercancel','lostpointercapture']){
  const g=gameFor(api),input=inputFor(g);input.pointer('pointerdown');
  input.pointer(end,{pointerId:2});assert.equal(g.inputHandler.held.size,1);
  input.pointer(end);assert.equal(g.inputHandler.held.size,0);assert.equal(g.character.velocityY,-960);
  input.pointer(end);assert.equal(g.character.jumpBuffer,0);
  for(let i=0;i<150;i++)g.character.update(1/120,6);
  input.pointer('pointerdown',{isPrimary:false});input.pointer('pointerdown',{button:2});assert.equal(g.jumps,1);
  input.pointer('pointerdown');assert.equal(g.jumps,2);
 }
});
test('deliberate released presses buffer a full leap for 160ms, with no hold-repeat or stale pause input',()=>{
 const api=runtime();assert.equal(api.CONFIG.PHYSICS.JUMP_BUFFER_MS,160);
 for(const source of ['key','pointer'])for(const lead of [10,129]){
  const g=gameFor(api),input=inputFor(g),press=()=>source==='key'?input.key('keydown'):input.pointer('pointerdown'),release=()=>source==='key'?input.key('keyup'):input.pointer('pointercancel');
  press();release();for(let i=0;i<lead;i++)g.character.update(1/120,6);
  press();release();assert.equal(g.character.jumpBuffer,.16);
  for(let i=lead;i<141;i++)g.character.update(1/120,6);
  assert.equal(g.character.isJumping,lead===129);
  if(lead===129)assert.ok(g.character.velocityY < -900);
  for(let i=0;i<150;i++)g.character.update(1/120,6);assert.equal(g.character.isJumping,false);
  press();release();g.character.jumpBuffer=.16;input.blur();assert.equal(g.state,'PAUSED');assert.equal(g.character.jumpBuffer,0);assert.equal(g.inputHandler.held.size,0);
 }
});
test('every spring keeps grounded ownership, including photo springs, with handler release and bypass',()=>{
 const api=runtime();
 for(let track=0;track<5;track++)for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++){
  const template=gameFor(api,track,speed,dog);
  for(let index=0;index<template.course.surfaces.length;index++)for(const bypass of [false,true]){
   const g=gameFor(api,track,speed,dog),input=inputFor(g),surface=g.course.surfaces[index];
   g.distance=surface.worldX-10;
   if(bypass)input.pointer('pointerdown');
   else {input.key('keydown');g.character.reset();} // a held source at grounded contact
   g.updatePlaying(1/120);const velocity=g.character.velocityY;
   assert.equal(surface.used,!bypass);assert.equal(Boolean(g.character.automaticLaunch),!bypass);
   input.pointer('pointercancel');input.key('keyup');assert.equal(g.character.velocityY,velocity);
   if(!bypass)assert.equal(velocity,surface.velocity);
  }
 }
});
test('all destinations resolve the first encounter and announce the opening cue independently of scoring sections',()=>{
 const api=runtime();
 for(let track=0;track<5;track++)for(const bypass of [false,true]){
  const g=gameFor(api,track),first=g.course.beats[0];let heard=false;
  for(let i=0;i<1200 && !g.firstCleared;i++){
   if(g.toast===first.cue)heard=true;
   const obstacle=g.course.obstacles.find(o=>o.beatId===first.id);
   const surface=g.course.surfaces.find(o=>o.beatId===first.id);
   if(bypass&&!g.character.isJumping&&(obstacle||surface).worldX-g.distance<g.gameSpeed*60*.57)g.jump();
   g.updatePlaying(1/120);
  }
  assert.equal(heard,true,first.id);assert.equal(g.firstCleared,true,first.id);
  assert.equal(g.sectionScores.length,0,'opening notification must not invent a score section');
 }
 const texas=gameFor(api);for(const fence of texas.course.obstacles.slice(0,2)){texas.hitObstacle(fence);assert.equal(texas.damage,0);assert.match(texas.toast,/No heart lost/);assert.doesNotMatch(texas.toast,/hold|short hop/i);}
});
test('old saved control preferences and variable records remain untouched by new fixed runs and practice',()=>{
 const api=runtime();api.Storage.write('barkour_assisted_v2',false);
 api.Storage.saveCourse('texas','EASY',{version:3,control:'variable',score:9000,stars:3,time:30});
 const original=api.localStorage.getItem('barkour_adventure_records_v3');
 const g=gameFor(api);assert.equal(g.runContext.control,'fixed');assert.equal(g.previousRecord,undefined);
 g.assisted=false;g.startGame({practiceId:g.course.practiceSections[0].id});assert.equal(g.runContext.control,'fixed');
 g.state='PLAYING';g.jump();g.releaseJump();assert.equal(g.character.velocityY,-960);g.finish();
 assert.equal(api.localStorage.getItem('barkour_adventure_records_v3'),original);
 assert.equal(api.Storage.read('barkour_assisted_v2',true),false);
 g.startGame();g.state='PLAYING';g.finish();
 assert.equal(api.Storage.getRecords(3)['texas:EASY:variable'].score,9000);
 assert.ok(api.Storage.getRecords(3)['texas:EASY:fixed']);assert.equal(g.finishPhoto.control,'fixed');
});
test('fixed full leaps traverse or safely miss the Texas pipe gap after actual arrival for both dogs and all difficulties',()=>{
 const api=runtime();
 for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++)for(const leapGap of [false,true]){
  const g=gameFor(api,0,speed,dog),[first,second]=g.course.platforms;let onFirst=false,onSecond=false,fell=false;
  for(let i=0;i<10000&&g.state==='PLAYING';i++){
   const next=g.course.obstacles.find(o=>!o.hit&&!o.passed&&o.worldX>g.distance);
   if(next&&!g.character.isJumping&&next.worldX-g.distance<g.gameSpeed*60*.57){g.jump();g.releaseJump();}
   if(!g.character.isJumping&&g.character.groundY===430){
    if(g.distance<first.worldEnd)onFirst=true;
    if(g.distance>=second.worldStart)onSecond=true;
    if(leapGap&&g.distance<first.worldEnd&&first.worldEnd-g.distance<g.gameSpeed*60*.2){g.jump();g.releaseJump();}
   }
   if(g.distance>first.worldEnd&&g.distance<second.worldEnd&&g.character.y>442)fell=true;
   g.updatePlaying(1/120);
  }
  assert.equal(onFirst,true);assert.equal(onSecond,leapGap);assert.equal(fell,!leapGap);assert.equal(g.damage,0);assert.equal(g.state,'COMPLETE');
 }
});

test('released full leaps safely finish all 30 combinations after physically jumping over Super Paws',()=>{
 const api=runtime();
 for(let track=0;track<5;track++)for(let speed=0;speed<3;speed++)for(let dog=0;dog<2;dog++){
  const g=gameFor(api,track,speed,dog),star=g.course.pickups.find(p=>p.type==='star');
  for(let i=0;i<10000&&g.state==='PLAYING';i++){
   const next=g.course.obstacles.find(o=>!o.hit&&!o.passed&&o.worldX>g.distance);
   const starAhead=!star.missed&&!star.collected&&star.worldX>g.distance&&star.worldX-g.distance<g.gameSpeed*60*.57;
   if(!g.character.isJumping&&(starAhead||(next&&next.worldX-g.distance<g.gameSpeed*60*.57))){g.jump();g.releaseJump();}
   g.updatePlaying(1/120);
  }
  assert.equal(star.collected,false);assert.equal(star.missed,true);assert.equal(g.smashes,0);
  assert.equal(g.damage,0,`${track}/${speed}/${dog}`);assert.equal(g.state,'COMPLETE');
 }
});
