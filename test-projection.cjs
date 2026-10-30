const assert=require('node:assert/strict'),fs=require('node:fs'),C=require('./dist/config-model.js'),P=require('./dist/projection-model.js');
const c=C.compile(JSON.parse(fs.readFileSync('sheet-data.json'))),b=P.forecast(c.sin,c.refs);assert.equal(c.sin.length,165);assert.equal(c.sin.filter(r=>r.include).length,137);assert.equal(b.reduce((s,r)=>s+r.n,0),642);assert.ok(c.sin.some(r=>r.include&&!c.plants.some(p=>p.ceg===r.ceg)));assert.ok(c.sin.filter(r=>r.include).every(r=>r.date<='2021-12-31'));assert.equal(new Set(c.sin.filter(r=>r.include).map(r=>r.ceg)).size,137);
assert.deepEqual(b.map(x=>x.n),[68,107,340,101,26]);assert.ok(Math.abs(b[0].disp-94.57002761968889)<1e-10);assert.ok(Math.abs(b[2].disp-96.04263843660712)<1e-10);
const altered=P.forecast(c.sin,c.refs,.9,1.1);assert.ok(Math.abs(altered[2].teif-b[2].teif*.9)<1e-10);assert.ok(Math.abs(altered[2].ip-b[2].ip*1.1)<1e-10);
let x=structuredClone(c.sin);x.push(x.find(r=>r.include));assert.throws(()=>P.forecast(x,c.refs),/duplicado/);x=c.sin.filter(r=>r.band!==5);assert.throws(()=>P.forecast(x,c.refs),/faixa 5/);assert.throws(()=>P.forecast(c.sin,c.refs,-1,1));
const ctgOnly=c.sin.filter(r=>c.plants.some(p=>p.ceg===r.ceg));assert.throws(()=>P.forecast(ctgOnly,c.refs));
console.log('OK: universo SIN completo, elegibilidade, CEGs únicos, médias ponderadas, sensibilidade, cobertura e ausência de faixas.');
