const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function photoRenderer() {
  let transform = { a:1, d:1, e:0, f:0 }, stack=[], drawn;
  const methods = {
    setTransform(a,b,c,d,e,f) { transform={a,d,e,f}; },
    scale(x,y) { transform.a*=x; transform.d*=y; },
    translate(x,y) { transform.e+=x*transform.a; transform.f+=y*transform.d; },
    save() { stack.push({...transform}); }, restore() { transform=stack.pop(); }
  };
  const ctx = new Proxy(methods, { get(o,k) { return o[k] || (()=>{}); } });
  const context = vm.createContext({ FINISH_HEIGHT_RANGE:400, Background: class {draw(){}}, Art:{finishGate(){},ellipse(){}}, Character:{
    drawFrame(ctx,asset,animation,frame,x,y,size) {
      const p=asset,scale=size/p.frameSize.w*p.presentation.scale,b=p.visualBounds;
      drawn={ frame, animation, scale:transform.a,
        left:transform.e+(x+(b.x-p.pawRoot.x)*scale)*transform.a,
        right:transform.e+(x+(b.x+b.w-p.pawRoot.x)*scale)*transform.a,
        top:transform.f+(y+(b.y-p.pawRoot.y)*scale)*transform.d,
        bottom:transform.f+(y+(b.y+b.h-p.pawRoot.y)*scale)*transform.d };
    }
  }});
  for(const name of ['config','pet-manifest','character-assets','tracks','finish-photo']) vm.runInContext(fs.readFileSync(`js/${name}.js`,'utf8'),context);
  const api=vm.runInContext('({FinishPhoto,CHARACTER_ASSETS})',context);
  return { ...api, render(photo) { api.FinishPhoto.draw({width:1200,height:1000,getContext:()=>ctx},photo,api.CHARACTER_ASSETS); return drawn; } };
}

test('recovery postcard contains both companions at ground, ordinary apex and maximum stored height',()=>{
  const api=photoRenderer();
  for(const asset of api.CHARACTER_ASSETS) for(const height of [0,140,279.27,400]) for(const clip of ['run','jump','idle']) {
    const pose={state:clip==='jump'?'apex':clip,clip,frame:clip==='jump'?3:0,normalizedHeight:height/400};
    const photo={version:4,track:'texas',assetId:asset.assetId,petLabel:asset.displayName,pose,seconds:50,created:1,distance:20000,difficulty:'EASY',control:'fixed',courseLayoutId:'texas-v3-recovery-2'};
    const before=JSON.stringify(photo),r=api.render(photo);
    assert.ok(r.left>=32&&r.right<=1168&&r.top>=32&&r.bottom<=752,`${asset.assetId}/${height}/${clip}: ${JSON.stringify(r)}`);
    assert.equal(r.frame,pose.frame);assert.equal(r.animation,asset.animations[clip]);assert.equal(JSON.stringify(photo),before);
  }
});

test('historical photos retain their original framing',()=>{
  const api=photoRenderer(),asset=api.CHARACTER_ASSETS[0];
  const r=api.render({version:4,track:'texas',assetId:asset.assetId,pose:{state:'run',clip:'run',frame:2,normalizedHeight:0},seconds:50,created:1,distance:20000,difficulty:'EASY',control:'fixed',courseLayoutId:'texas-v3-dynamic-2'});
  assert.equal(r.scale,1136/900);
});
