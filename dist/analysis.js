(()=>{'use strict';
let current;
const $=id=>document.getElementById(id),format=(v,d=3)=>v===null||!Number.isFinite(v)?'—':fmt(v,d);
function render(){
 if(!current)return;
 const plant=current.plants.find(p=>p.id===$('analysisPlant').value);if(!plant)return;
 const previous=$('analysisUnit').value;
 $('analysisUnit').innerHTML='<option value="">Todas as UGs</option>'+plant.units.map(u=>`<option value="${esc(u.id)}">${esc(u.ug)}${u.selected?'':' · fora do cenário'}</option>`).join('');
 if(plant.units.some(u=>u.id===previous))$('analysisUnit').value=previous;
 const rows=plant.units.filter(u=>(!$('analysisUnit').value||u.id===$('analysisUnit').value)&&(!$('analysisIncluded').checked||u.selected));
 const valid=rows.length&&rows.every(u=>u.disp!==null),power=rows.reduce((s,u)=>s+Number(u.mw||0),0),mean=key=>valid&&power?rows.reduce((s,u)=>s+u.mw*u[key],0)/power:null;
 const disp=mean('disp'),ref=mean('refDisp'),delta=disp===null||ref===null?null:disp-ref;
 $('analysisPower').textContent=rows.length?format(power)+' MW':'—';$('analysisDisp').textContent=format(disp)+(disp===null?'':'%');$('analysisRef').textContent=format(ref)+(ref===null?'':'%');$('analysisDelta').textContent=format(delta)+(delta===null?'':' p.p.');
 $('analysisSummary').textContent=plant.name+' · '+rows.length+' UG(s) exibida(s)'+(disp===null?'':' · Potência equivalente: '+format(power*disp/100)+' MW · TEIF média: '+format(mean('teif'),6)+'% · IP média: '+format(mean('ip'),6)+'%');
 $('analysisEmpty').hidden=!!rows.length;
 $('analysisRows').innerHTML=rows.map(u=>`<tr class="${u.selected?'':'outside-scenario'}"><td><b>${esc(u.ug)}</b></td><td>${u.selected?'Incluída':'Fora do cenário'}</td><td>${format(u.mw===''?null:Number(u.mw),3)}</td><td>${u.band||'—'}</td><td>${format(u.teif===''?null:Number(u.teif),6)}</td><td>${format(u.ip===''?null:Number(u.ip),6)}</td><td>${format(u.disp,6)}</td><td>${format(u.refDisp,6)}</td><td>${u.disp===null||u.refDisp===null?'—':format(u.disp-u.refDisp,6)}</td></tr>`).join('');
 $('analysisChart').innerHTML=rows.map(u=>`<div class="analysis-chart-row"><b>${esc(u.ug)}</b><div class="analysis-track" role="img" aria-label="${esc(u.ug)}: disponibilidade ${format(u.disp,3)}%; referência ${format(u.refDisp,3)}%"><span class="analysis-fill" style="width:${u.disp??0}%"></span>${u.refDisp===null?'':`<span class="analysis-marker" style="left:${u.refDisp}%"></span>`}</div><span>${format(u.disp)}%</span></div>`).join('');
}
document.addEventListener('ctg:updated',e=>{current=e.detail;const chosen=$('analysisPlant').value;$('analysisPlant').innerHTML=current.plants.map(p=>`<option value="${p.id}">${esc(p.name)}${p.selected?'':' · fora do cenário'}</option>`).join('');if(current.plants.some(p=>p.id===chosen))$('analysisPlant').value=chosen;render()});
$('analysisPlant').onchange=()=>{$('analysisUnit').value='';render()};$('analysisUnit').onchange=render;$('analysisIncluded').onchange=render;
})();
