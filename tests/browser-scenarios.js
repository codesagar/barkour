// Local development harness. Load via DevTools only; never loaded by index.html.
// Freezes RAF for repeatable visual/input tests and suppresses record writes.
(() => {
 const g=window.barkourGame;
 cancelAnimationFrame(g.animationId);
 Storage.saveCourse=()=>({});
 Storage.saveFinishPhoto=()=>false;
 window.barkourQA={
  scene(track=0,seconds=3.5,dog=0,speed=0){
   g.selectedTrackIndex=track;g.selectedSpeedIndex=speed;g.selectedCharacterIndex=dog;
   g.startGame();g.state='PLAYING';g.audio.pause();g.ui.syncState();g.render();
   for(let i=0;i<seconds*120&&g.state==='PLAYING';i++){
    const next=g.course.obstacles.find(o=>!o.hit&&!o.passed&&o.worldX>g.distance-80);
    if(next&&!g.character.isJumping&&!next.choice&&!g.powers.star&&next.worldX-g.distance<g.gameSpeed*60*(next.low?.39:.57)&&next.worldX>g.distance){g.jump();if(next.low)g.releaseJump();}
    g.wallTime += (1/120)/(g.portrait?CONFIG.CAMERA.PORTRAIT_PACE:1);
    g.updatePlaying(1/120);
   }
   g.wallTime=g.playTime/(g.portrait?.9:1);g.render();g.ui.syncState();g.render();
   return {state:g.state,damage:g.damage,souvenirs:g.souvenirs,stars:g.result?.stars,time:g.playTime,smashes:g.smashes};
  },
  step(seconds){for(let i=0;i<seconds*120;i++)g.updatePlaying(1/120);g.render();g.ui.updateHUD();return {y:g.character.y,velocity:g.character.velocityY,jumping:g.character.isJumping};},
  layout(){return {width:innerWidth,height:innerHeight,view:g.viewWidth,portrait:g.portrait,canvas:g.canvas.getBoundingClientRect().toJSON(),focus:document.activeElement.id,
   text:[...document.querySelectorAll('.hud-track,.hud-right,.power-pill,.run-hint,.quiet-button')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,size:getComputedStyle(e).fontSize,height:e.getBoundingClientRect().height})),overflow:document.documentElement.scrollWidth>innerWidth};}
 };
})();
