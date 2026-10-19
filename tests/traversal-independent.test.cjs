const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function runtime() {
  const saved = new Map();
  const context = vm.createContext({ console, window: { addEventListener() {}, devicePixelRatio: 1 }, document: {},
    localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key,value) => saved.set(key,value) } });
  for (const file of ['config','pet-manifest','storage','character-assets','character','tracks','art','background','collision','finish-photo','game','game-ui'])
    vm.runInContext(fs.readFileSync(path.join(root,'js',`${file}.js`),'utf8'),context);
  return vm.runInContext('({CONFIG,TRACKS,Course,CHARACTER_ASSETS,Character,Background,Game})',context);
}
function gameFor(api, track, difficulty, dog) {
  const game=Object.create(api.Game.prototype); Object.assign(game,{canvas:{width:1600,height:800},selectedTrackIndex:track,selectedSpeedIndex:difficulty,
    selectedCharacterIndex:dog,speedOptions:['EASY','MEDIUM','HARD'],dogSprites:api.CHARACTER_ASSETS,character:new api.Character(api.CHARACTER_ASSETS[dog],260),
    background:new api.Background({width:1600,height:800}),audio:{unlock(){},play(){},stop(){},update(){}},uiTime:0,reducedMotion:true});
  game.startGame();game.state='PLAYING';game.character.setState('run');return game;
}
function isolateAt(game, x) {
  game.distance=x;game.background.distance=x;game.character.groundY=600;game.character.reset();
  for(const item of [...game.course.obstacles,...game.course.pickups,...game.course.surfaces]) if(item.worldX<x-100){item.passed=true;item.missed=true;}
}
function advance(game, predicate, limit=2400) { for(let i=0;i<limit&&game.state==='PLAYING';i++){game.updatePlaying(1/120);if(predicate())return i;}return -1; }

test('boosted launch physically lands first support and one deliberate leap crosses the short gap',()=>{
  const api=runtime();
  for(const track of [0,1,3])for(let difficulty=0;difficulty<3;difficulty++)for(let dog=0;dog<2;dog++){
    const game=gameFor(api,track,difficulty,dog),surface=game.course.surfaces.find(s=>game.course.platforms.some(p=>p.beatId===s.beatId&&p.y===450));
    const ledges=game.course.platforms.filter(p=>p.beatId===surface.beatId).sort((a,b)=>a.worldStart-b.worldStart);
    isolateAt(game,surface.worldX-260);let maxHeight=0,landedFirst=false,landedSecond=false,jumpedGap=false;
    for(let i=0;i<2600&&game.state==='PLAYING'&&!landedSecond;i++){
      maxHeight=Math.max(maxHeight,600-game.character.y);
      if(!game.character.isJumping&&game.character.groundY===450&&game.distance>=ledges[0].worldStart&&game.distance<=ledges[0].worldEnd)landedFirst=true;
      if(landedFirst&&!jumpedGap&&!game.character.isJumping&&ledges[0].worldEnd-game.distance<game.gameSpeed*60*.18){game.jump();jumpedGap=true;}
      game.updatePlaying(1/120);
      if(jumpedGap&&!game.character.isJumping&&game.character.groundY===450&&game.distance>=ledges[1].worldStart&&game.distance<=ledges[1].worldEnd)landedSecond=true;
    }
    assert.ok(surface.used,`${game.course.track.id}/${difficulty}/${dog}: launcher`);
    assert.ok(landedFirst,`${game.course.track.id}/${difficulty}/${dog}: first landing`);
    assert.ok(jumpedGap&&landedSecond,`${game.course.track.id}/${difficulty}/${dog}: gap landing`);
    assert.ok(maxHeight>=440,`${game.course.track.id}/${difficulty}/${dog}: boosted height ${maxHeight}`);
  }
});

test('ordinary early leap bypasses each launcher and returns to continuous ground fallback',()=>{
  const api=runtime();
  for(const track of [0,1,3])for(let difficulty=0;difficulty<3;difficulty++)for(let dog=0;dog<2;dog++){
    const game=gameFor(api,track,difficulty,dog),surface=game.course.surfaces.find(s=>game.course.platforms.some(p=>p.beatId===s.beatId&&p.y===450));
    isolateAt(game,surface.worldX-game.gameSpeed*60*.55);game.jump();
    advance(game,()=>game.distance>game.course.platforms.filter(p=>p.beatId===surface.beatId).at(-1).worldEnd+200);
    assert.equal(surface.used,false,`${game.course.track.id}/${difficulty}/${dog}`);
    assert.equal(game.character.groundY,600,`${game.course.track.id}/${difficulty}/${dog}`);
    assert.ok(!game.character.isJumping,`${game.course.track.id}/${difficulty}/${dog}`);
  }
});

test('boosted apex keeps both dogs below HUD at recovery landscape viewports',()=>{
  const api=runtime(),noop=()=>{},ctx=new Proxy({measureText:t=>({width:String(t).length*8}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(t,k)=>k in t?t[k]:noop,set:(t,k,v)=>(t[k]=v,true)});
  for(const track of [0,1,3])for(const [width,height]of[[1280,720],[1024,768]])for(let dog=0;dog<2;dog++){
    const game=gameFor(api,track,0,dog),surface=game.course.surfaces.find(s=>s.velocity===-1240);game.ctx=ctx;game.canvas.getBoundingClientRect=()=>({width,height});game.canvas.clientWidth=width;game.canvas.clientHeight=height;game.render();const camera=JSON.stringify(game.camera);
    game.character.groundY=600;game.character.reset();game.character.velocityY=surface.velocity;game.character.isJumping=true;let top=Infinity;
    for(let i=0;i<240&&game.character.isJumping;i++){game.character.update(api.CONFIG.PHYSICS.FIXED_STEP,game.gameSpeed);game.render();const b=game.character.getVisualBounds();top=Math.min(top,(b.y+game.camera.viewHeight*game.camera.groundFraction-600)*game.camera.scale);assert.equal(JSON.stringify(game.camera),camera);}
    assert.ok(top>=70,`${game.course.track.id}/${dog}/${width}x${height}: ${top}`);
  }
});

test('mountain snowball descent is noncolliding and leaves a grounded ordinary-leap timing window',()=>{
  const api=runtime();
  for(let difficulty=0;difficulty<3;difficulty++)for(let dog=0;dog<2;dog++){
    const game=gameFor(api,1,difficulty,dog),ball=game.course.obstacles.find(o=>o.mechanism==='mountain-snowball');isolateAt(game,ball.originX-1150);let descentTicks=0,landTime=null,jumped=false;
    for(let i=0;i<2400&&game.state==='PLAYING'&&!ball.passed;i++){
      if(ball.state==='descending'){descentTicks++;assert.equal(ball.active,false);assert.equal(game.damage,0);}
      if(ball.active&&landTime===null)landTime=game.playTime;
      if(ball.active&&!jumped&&!game.character.isJumping&&ball.worldX-game.distance<game.gameSpeed*60*.57){game.jump();jumped=true;}
      game.updatePlaying(1/120);
    }
    assert.ok(descentTicks>100&&landTime!==null&&jumped,`${difficulty}/${dog}`);assert.equal(game.damage,0,`${difficulty}/${dog}`);assert.equal(ball.hit,false,`${difficulty}/${dog}`);
  }
});

test('changed trails retain clean missed-power ordinary fallback and Coast/Ember stay byte-equivalent recovery-2 geometry',()=>{
  const api=runtime();
  for(const track of [0,1,3])for(let difficulty=0;difficulty<3;difficulty++)for(let dog=0;dog<2;dog++){
    const game=gameFor(api,track,difficulty,dog);
    for(let i=0;i<20000&&game.state==='PLAYING';i++){
      const obstacle=game.course.obstacles.find(o=>!o.hit&&!o.passed&&o.active!==false&&o.worldX>game.distance-60),star=game.course.pickups.find(p=>p.type==='star'&&!p.collected&&!p.missed);
      const candidates=[];if(obstacle)candidates.push({x:obstacle.worldX,lead:.57});if(star)candidates.push({x:star.worldX,lead:.72});candidates.sort((a,b)=>a.x-b.x);const target=candidates[0];
      if(target&&!game.character.isJumping&&target.x>game.distance&&target.x-game.distance<game.gameSpeed*60*target.lead)game.jump();game.updatePlaying(1/120);
    }
    assert.equal(game.state,'COMPLETE',`${track}/${difficulty}/${dog}`);assert.equal(game.damage,0,`${track}/${difficulty}/${dog}`);assert.equal(game.smashes,0);assert.equal(game.course.pickups.find(p=>p.type==='star').collected,false);
  }
  for(const track of [2,4])for(const difficulty of Object.values(api.CONFIG.DIFFICULTY)){
    const current=new api.Course(api.TRACKS[track],difficulty,{recovery:true}),frozen=new api.Course(api.TRACKS[track],difficulty,{recovery:true,recoveryRevision:2});
    const geometry=course=>JSON.stringify({layout:course.layoutId,length:course.length,obstacles:course.obstacles,pickups:course.pickups,surfaces:course.surfaces,platforms:course.platforms});
    assert.equal(geometry(current),geometry(frozen),api.TRACKS[track].id);
  }
});
