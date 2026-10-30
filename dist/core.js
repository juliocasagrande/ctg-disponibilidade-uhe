(function(root){
const refs=[[29,1.684,3.796],[59,1.844,3.641],[199,1.591,3.707],[499,2.681,3.478],[1300,2.107,2.399]];
function num(v,label,min=0,max=100){if(v===''||v===null||!Number.isFinite(Number(v))||Number(v)<min||Number(v)>max)throw Error(label+' inválido');return Number(v)}
function availability(t,i){return 100*(1-num(t,'TEIF')/100)*(1-num(i,'IP')/100)}
function band(p){num(p,'Potência',Number.MIN_VALUE,1300);return refs.findIndex(r=>p<=r[0])+1}
function aggregate(rows,weight='n'){let w=0,t=0,i=0;rows.forEach(r=>{let v=num(r[weight],'Peso',Number.MIN_VALUE,1e9);t+=num(r.teif,'TEIF')*v;i+=num(r.ip,'IP')*v;w+=v});if(!w)return null;return {weight:w,teif:t/w,ip:i/w,disp:availability(t/w,i/w)}}
const api={refs,availability,band,aggregate};root.Engine=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
