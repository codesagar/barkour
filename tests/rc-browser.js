// Development-only release candidate visual scenarios. Never loaded by index.html.
// Uses real courses from their start. Unlike the old harness, actual storage is exercised.
(() => {
 const g = window.barkourGame;
 cancelAnimationFrame(g.animationId);
 const trace = [];
 const result = () => ({state:g.state,track:g.course?.track.id,dog:g.character.asset.assetId,time:g.playTime,wallTime:g.wallTime,distance:g.distance,damage:g.damage,jumps:g.jumps,treats:g.treats,smashes:g.smashes,pose:g.finishPhoto?.pose,persistence:g.persistence,toast:g.toast,guidance:g.guidance(),effects:g.effects.length,held:g.inputHandler.held.size});
 function advance(seconds, policy='safe') {
  for(let tick=0;tick<Math.round(seconds*120)&&g.state==='PLAYING';tick++) {
   const next=g.course.obstacles.find(o=>!o.hit&&!o.passed&&o.worldX>g.distance);
   const star=g.course.pickups.find(p=>p.type==='star'&&!p.collected&&!p.missed&&p.worldX>g.distance);
   const target=policy==='miss-power'&&star&&star.worldX<(next?.worldX||Infinity)?star:next;
   if(policy!=='none'&&!g.character.isJumping&&target&&target.worldX-g.distance<g.gameSpeed*60*.57&&!(policy==='smash'&&g.powers.star>0&&target.smash)){g.jump();g.releaseJump();}
   if(policy==='pipe'&&!g.character.isJumping&&g.character.groundY===430&&g.distance<g.course.platforms[0].worldEnd&&g.course.platforms[0].worldEnd-g.distance<g.gameSpeed*60*.2){g.jump();g.releaseJump();}
   const prior=g.damage,previous=g.toast;
   g.wallTime+=(1/120)/(g.portrait?CONFIG.CAMERA.PORTRAIT_PACE:1);g.updatePlaying(1/120);
   if(g.damage!==prior||g.toast!==previous)trace.push({time:g.playTime,damage:g.damage,message:g.toast,priority:g.toastPriority});
  }
  g.render();g.ui.updateHUD();return result();
 }
 window.barkourRC={trace,result,advance,
  start(track=0,dog=0,difficulty=0){g.selectedTrackIndex=track;g.selectedCharacterIndex=dog;g.selectedSpeedIndex=difficulty;g.startGame();g.state='PLAYING';g.character.setState('run');g.audio.pause();g.render();g.ui.syncState();trace.length=0;return result();},
  finish(policy='safe'){return advance(75,policy);},
  snapshot(){return {...result(),viewport:[innerWidth,innerHeight],pageOverflow:document.documentElement.scrollWidth>innerWidth,focus:document.activeElement.id,ui:[...document.querySelectorAll('#gameHUD,#runHint,#courseToast,#hazardCue,#powerHUD')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))};}
 };
})();
