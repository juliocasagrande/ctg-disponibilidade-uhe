const assert=require('node:assert/strict'),fs=require('node:fs');
const Config=require('./dist/config-model.js'),M=require('./dist/ctg-model.js'),Bridge=require('./dist/sheet-bridge.js');
const payload=JSON.parse(fs.readFileSync('sheet-data.json')),c=Config.compile(payload),state=M.initial(c.plants,c.units,c.settings);
const r=M.summarize(state,c.plants,c.units,c.refs);assert.equal(r.unitCount,68);assert.equal(r.plantCount,12);assert.ok(Math.abs(r.power-7538.46)<1e-7);assert.equal(r.invalid,0);
const s=structuredClone(state),a=s.units.find(u=>u.id==='JUP-UG01');Object.assign(a,{mw:20,teif:10,ip:20});
let result=M.summarize(s,c.plants,c.units,c.refs),j=result.plants.find(p=>p.id==='JUP'),others=state.units.filter(u=>u.id.startsWith('JUP-')&&u.id!==a.id),original=c.plants.find(p=>p.id==='JUP'),d=100*(1-original.teif/100)*(1-original.ip/100);
assert.ok(Math.abs(j.disp-(20*72+others.length*110.8*d)/(20+others.length*110.8))<1e-9);assert.deepEqual(j.bands,[1,3]);assert.equal(result.bands[0].n,r.bands[0].n+1);assert.equal(result.bands[2].n,r.bands[2].n-1);
a.include=false;result=M.summarize(s,c.plants,c.units,c.refs);assert.equal(result.unitCount,67);assert.equal(result.plants.find(p=>p.id==='JUP').n,13);assert.ok(Math.abs(result.power-(r.power-110.8))<1e-7);
for(const u of s.units.filter(u=>u.id.startsWith('JUP-')))u.include=false;result=M.summarize(s,c.plants,c.units,c.refs);assert.equal(result.plants.find(p=>p.id==='JUP').disp,null);assert.equal(result.plantCount,11);
for(const invalid of ['',null,-1,101]){const x=structuredClone(state);x.units[0].teif=invalid;assert.throws(()=>M.validateUnits(x,c.plants,c.units,c.settings))}
let bad=structuredClone(state);bad.units[0].mw=0;assert.throws(()=>M.validateUnits(bad,c.plants,c.units,c.settings));bad=structuredClone(state);bad.units[1].id=bad.units[0].id;assert.throws(()=>M.validateUnits(bad,c.plants,c.units,c.settings));
const old={...state,version:2};delete old.units;old.rows[0].teif=15;old.rows[0].edited=true;const migrated=M.validateUnits(old,c.plants,c.units,c.settings);assert.equal(migrated.version,3);assert.ok(migrated.units.filter(u=>u.id.startsWith('JUP-')).every(u=>u.teif===15));
let sheet=structuredClone(payload);sheet.sheets.UGs[1][8]=0;sheet.sheets.UGs[1][9]=100;sheet.sheets.UGs[1][10]=0;let u=Config.compile(sheet).units[0];assert.equal(u.teif,0);assert.equal(u.ip,100);assert.equal(u.include,false);assert.equal(Config.compile(payload).units[0].teif,c.plants[0].teif);
sheet.sheets.UGs[1][8]=101;assert.throws(()=>Config.compile(sheet));
const next=structuredClone(state.units);next[0].teif=8;let writes=Bridge.writes(c.units,c.units,next,payload.sheets.UGs);assert.deepEqual(writes,[{range:'UGs!E2',values:[[110.8]]},{range:'UGs!I2:K2',values:[[8,c.units[0].ip,1]]}]);
const reordered=[payload.sheets.UGs[0],...payload.sheets.UGs.slice(1).reverse()];assert.equal(Bridge.writes(c.units,c.units,next,reordered)[0].range,'UGs!E77');
const changed=structuredClone(c.units);changed[0].teif=9;assert.throws(()=>Bridge.writes(c.units,changed,next,payload.sheets.UGs),/Conflito/);assert.deepEqual(Bridge.writes(c.units,c.units,state.units,payload.sheets.UGs),[]);
console.log('OK: cálculo por UG, faixas distintas, exclusões, migração, validação, gravação seletiva por ID e conflitos de edição.');
