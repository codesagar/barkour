const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function runtime() {
    const data = new Map();
    const localStorage = { getItem: key => data.get(key) ?? null, setItem: (key,value) => data.set(key,value) };
    const context = vm.createContext({ localStorage });
    for (const file of ['config','tracks','storage']) vm.runInContext(fs.readFileSync(`js/${file}.js`,'utf8'), context);
    return { ...vm.runInContext('({CONFIG,Course,TRACKS,Storage,V3_MANIFESTS,DYNAMIC_MANIFESTS})',context), data, localStorage };
}
function result(layout='texas-v3-dynamic-2') {
    return {version:4,rulesId:'explorer-recovery-v1',courseVersion:3,courseLayoutId:layout,capabilityProfile:'equal-pet-v1',control:'fixed',score:100,stars:2,time:50,sections:[100]};
}
function photo(layout='texas-v3-dynamic-2') {
    return {...result(layout),track:'texas',assetId:'buddy',petLabel:'Buddy',pose:{state:'run',clip:'run',frame:0,normalizedHeight:0},seconds:50,created:1,distance:100,difficulty:'EASY'};
}

test('dynamic layout dispatch preserves original authored manifests and identities', () => {
    const api=runtime();
    const signatures=new Set();
    for(const track of api.TRACKS) {
        const historical=new api.Course(track,api.CONFIG.DIFFICULTY.EASY);
        const current=new api.Course(track,api.CONFIG.DIFFICULTY.EASY,{dynamic:true});
        assert.equal(historical.layoutId,`${track.id}-v3-elevation-1`);
        assert.equal(current.layoutId,`${track.id}-v3-dynamic-2`);
        assert.equal(historical.obstacles.some(item=>item.mechanism),false);
        assert.ok(current.obstacles.some(item=>item.mechanism));
        assert.equal(JSON.stringify(api.V3_MANIFESTS[track.id]).includes('mechanism'),false);
        signatures.add(current.dynamicSignature);
    }
    assert.equal(signatures.size,5);
});

test('timed solid states and collider geometry match current physical state', () => {
    const api=runtime();
    for(const track of api.TRACKS) {
        const course=new api.Course(track,api.CONFIG.DIFFICULTY.HARD,{dynamic:true});
        for(let time=0;time<10;time+=.04) {
            course.update(.04,0,time);
            for(const item of course.obstacles) {
                const bounds=course.bounds(item,0);
                assert.ok(Number.isFinite(bounds.x+ bounds.y+ bounds.width+ bounds.height));
                assert.equal(bounds.y,item.baseY-item.height+10);
                assert.ok(bounds.width>0 && bounds.height>=0);
                assert.ok(item.height<=118);
            }
        }
        assert.ok(course.events.length<=48,'event queue must remain bounded without consumer');
    }
    for(const index of [2,4]) {
        const course=new api.Course(api.TRACKS[index],api.CONFIG.DIFFICULTY.EASY,{dynamic:true});
        const hazard=course.obstacles.find(item=>['surf','pressure-crystal'].includes(item.mechanism));
        const states=new Set();
        for(let time=0;time<6;time+=.02) { course.update(.02,0,time); states.add(hazard.active); }
        assert.equal(states.size,2,'surf and crystals must have real safe and solid states');
    }
});

test('approach-triggered growth and falling settle predictably across frame partitions', () => {
    const api=runtime();
    for(const index of [0,1,3]) {
        const snapshots=[];
        for(const hz of [30,60,120]) {
            const course=new api.Course(api.TRACKS[index],api.CONFIG.DIFFICULTY.EASY,{dynamic:true});
            const hazard=course.obstacles.find(item=>['accelerating-roll','snowball-growth','falling-log'].includes(item.mechanism));
            const speed=430, start=hazard.originX-1350;
            // Seed the previous observation as a continuous real approach.
            course.lastDynamicDistance=start;
            for(let step=0;step<=hz*4;step++) course.update(1/hz,start+speed*step/hz,step/hz);
            snapshots.push([hazard.worldX,hazard.height,hazard.baseY,hazard.activatedAt]);
        }
        for(let i=1;i<snapshots.length;i++) snapshots[0].forEach((value,index)=>assert.ok(Math.abs(value-snapshots[i][index])<1e-7,`${api.TRACKS[index]?.id} partition divergence`));
    }
});

test('canopy gap has traversable support above a continuous main-route fallback', () => {
    const api=runtime(), course=new api.Course(api.TRACKS[3],api.CONFIG.DIFFICULTY.EASY,{dynamic:true});
    const [first,second]=course.platforms;
    assert.equal(first.style,'canopy');
    assert.ok(first.worldEnd<second.worldStart);
    assert.equal(course.obstacles.some(item => item.worldX >= first.worldStart && item.worldX <= second.worldEnd),false,'missed canopy launch/gap must have an obstacle-free floor');
    assert.equal(new api.Course(api.TRACKS[3],api.CONFIG.DIFFICULTY.EASY).obstacles.some(item => item.beatId === 'second-rebound'),true,'historical low log must remain in its original layout');
    assert.equal(course.supportAt(first.worldStart+10,first.y),first);
    assert.equal(course.supportAt(first.worldStart+10,600),null,'ground path must not teleport dog onto canopy');
    assert.equal(course.supportAt((first.worldEnd+second.worldStart)/2,first.y),null);
    const spring=course.surfaces.find(item=>item.kind==='canopy');
    assert.equal(course.triggerSurface(spring,2),true);
    assert.equal(course.triggerSurface(spring,2.1),false);
    assert.equal(spring.compression,1);
    course.update(.1,spring.worldX,2.1);
    assert.ok(spring.compression>0 && spring.compression<1);
    assert.equal(course.drainEvents().filter(event=>event.kind==='launch').length,1);
});

test('new layout archives incompatible v4 record before replacement without comparing awards', () => {
    const api=runtime();
    api.Storage.saveCourse('texas','EASY',{...result('texas-v3-elevation-1'),score:9000,stars:3});
    const write=api.Storage.saveCourse('texas','EASY',result());
    assert.equal(write.saved,true); assert.equal(write.archived,true);
    assert.equal(write.record.score,100); assert.equal(write.record.stars,2); assert.equal(write.record.completions,1);
    assert.equal(api.Storage.getArchivedV4Records()[0].record.score,9000);
    assert.equal(api.Storage.recordsComparable(result(),result('texas-v3-elevation-1')),false);
});

test('archive failure leaves old v4 bytes intact and both photo albums retain independent identities', () => {
    const api=runtime();
    api.Storage.saveCourse('texas','EASY',result('texas-v3-elevation-1'));
    api.Storage.saveFinishPhoto(photo('texas-v3-elevation-1'));
    const oldRecord=api.data.get('barkour_adventure_records_v4');
    const oldPhoto=api.data.get('barkour_finish_photos_v4');
    const set=api.localStorage.setItem;
    api.localStorage.setItem=(key,value)=>{ if(key.endsWith('v4_archive')) throw Error('quota'); set(key,value); };
    assert.equal(api.Storage.saveCourse('texas','EASY',result()).saved,false);
    assert.equal(api.data.get('barkour_adventure_records_v4'),oldRecord);
    for(let index=0;index<30;index++) assert.equal(api.Storage.saveFinishPhoto({...photo(),created:index+2}),true);
    assert.equal(api.data.get('barkour_finish_photos_v4'),oldPhoto);
    assert.equal(api.Storage.getV4FinishPhotos().length,1);
    assert.equal(api.Storage.getDynamicFinishPhotos().length,24);
    assert.equal(api.Storage.getFinishPhotos().length,25);
});
