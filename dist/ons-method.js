(function(root){'use strict';
// Recomposição aritmética das taxas, sem substituir a consistência de eventos feita pelo ONS.
const fields=['ug','mes','potencia_mw','hp','hdp','hedp','hdf','hedf','hs','hrd','hdce'];
const numbers=fields.slice(2);
function readCSV(raw){
 if(typeof raw!=='string'||raw.length>2500000)throw Error('CSV ausente ou acima de 2,5 MB');
 const lines=raw.replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(x=>x.trim());
 if(lines.length<2)throw Error('Informe cabeçalho e pelo menos uma linha');
 const header=lines.shift().split(';').map(x=>x.trim().toLowerCase());
 if(fields.some(x=>!header.includes(x)))throw Error('Cabeçalho obrigatório: '+fields.join(';'));
 if(new Set(header).size!==header.length)throw Error('Coluna duplicada');
 if(lines.length>20000)throw Error('Limite de 20.000 linhas');
 return lines.map((line,i)=>{
  const cells=line.split(';');if(cells.length!==header.length)throw Error('Linha '+(i+2)+': número de colunas diferente');
  return Object.fromEntries(fields.map(k=>[k,cells[header.indexOf(k)].trim()]));
 });
}
function num(v,label,positive){
 if(v===null||v===undefined||v===''||typeof v==='boolean')throw Error(label+': valor ausente');
 const n=typeof v==='number'?v:Number(String(v).replace(',','.'));
 if(!Number.isFinite(n)||n<0||(positive&&n<=0))throw Error(label+': deve ser '+(positive?'positivo':'não negativo'));
 return n;
}
function calculate(input){
 if(!Array.isArray(input)||!input.length||input.length>20000)throw Error('Informe de 1 a 20.000 registros mensais por UG');
 const totals={programmed:0,period:0,forced:0,forcedBasis:0};
 const keys=new Set(),perUG=new Map();let unbalanced=0,maxDifferenceHours=0;
 input.forEach((r,i)=>{
  const label='Linha '+(i+1),ug=String(r.ug??'').trim(),mes=String(r.mes??'').trim();
  if(!ug||ug.length>100||!/^(\d{4})-(0[1-9]|1[0-2])$/.test(mes))throw Error(label+': UG ou mês AAAA-MM inválido');
  const key=ug+'|'+mes;if(keys.has(key))throw Error(label+': UG/mês duplicado '+key);keys.add(key);
  const v={};for(const k of numbers)v[k]=num(r[k],label+' '+k,k==='potencia_mw'||k==='hp');
  if(v.hdp+v.hedp>v.hp+0.01)throw Error(label+': HDP + HEDP excedem HP');
  const closed=v.hdp+v.hedp+v.hdf+v.hedf+v.hs+v.hrd+v.hdce;
  const error=Math.abs(v.hp-closed);if(error>0.01){unbalanced++;maxDifferenceHours=Math.max(maxDifferenceHours,error)}
  totals.programmed+=v.potencia_mw*(v.hdp+v.hedp);totals.period+=v.potencia_mw*v.hp;
  totals.forced+=v.potencia_mw*(v.hdf+v.hedf);
  totals.forcedBasis+=v.potencia_mw*(v.hdf+v.hedf+v.hs+v.hrd+v.hdce);
  if(!perUG.has(ug))perUG.set(ug,[]);
  perUG.get(ug).push(Number(mes.slice(0,4))*12+Number(mes.slice(5))-1);
 });
 if(totals.period<=0||totals.forcedBasis<=0)throw Error('Denominador de TEIP ou TEIFa igual a zero');
 const teip=100*totals.programmed/totals.period,teifa=100*totals.forced/totals.forcedBasis;
 if(teip>100+1e-8||teifa>100+1e-8)throw Error('Taxas acima de 100%: confira as parcelas');
 const allMonths=[...new Set([...perUG.values()].flat())].sort((a,b)=>a-b);
 const fullWindow=allMonths.length===60&&allMonths.every((m,k)=>k===0||m===allMonths[k-1]+1)
  &&[...perUG.values()].every(a=>a.length===60&&a.every(m=>m>=allMonths[0]&&m<=allMonths[59]));
 return {teifa,teip,availability:100*(1-teifa/100)*(1-teip/100),totals,rows:input.length,units:perUG.size,months:allMonths.length,fullWindow,unbalanced,maxDifferenceHours};
}
const api={fields,readCSV,calculate};root.ONSMethod=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
(function(){
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id),raw=$('onsHoursCsv'),out=$('onsHoursResult'),status=$('onsHoursStatus');if(!raw||!out||!status)return;
 const fmt=x=>Number(x).toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:6});
 $('onsHoursExample').onclick=()=>{raw.value='ug;mes;potencia_mw;hp;hdp;hedp;hdf;hedf;hs;hrd;hdce\nUG01;2026-09;110,8;720;36;0;12;0;672;0;0\nUG02;2026-09;110,8;720;24;0;0;0;696;0;0';status.textContent='Exemplo ilustrativo de apenas 1 mês: não representa qualquer UG real.';out.textContent=''};
 $('onsHoursCompute').onclick=()=>{
  try{const d=ONSMethod.calculate(ONSMethod.readCSV(raw.value));
   const complete=d.fullWindow&&d.unbalanced===0;
   status.textContent=complete?'60 meses completos e horas consistentes na entrada. Conferir regras, eventos e consistência oficiais do ONS antes de usar o resultado.':'AMOSTRA NÃO HOMOLOGÁVEL: '+d.months+' mês(es) distintos, '+d.units+' UG(s), '+d.unbalanced+' linha(s) com fechamento de horas divergente. Para apuração comparável, use 60 meses completos e critérios regulatórios.';
   out.textContent='TEIFa = '+fmt(d.teifa)+'% = '+fmt(d.totals.forced)+' / '+fmt(d.totals.forcedBasis)+' MW·h  |  TEIP = '+fmt(d.teip)+'% = '+fmt(d.totals.programmed)+' / '+fmt(d.totals.period)+' MW·h  |  Disponibilidade equivalente calculada = '+fmt(d.availability)+'%.';
  }catch(e){status.textContent='Não foi possível calcular: '+e.message;out.textContent=''}
 };
})();