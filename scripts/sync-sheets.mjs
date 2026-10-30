import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const token=process.env.GOOGLE_ACCESS_TOKEN;
if(!token)throw Error('GOOGLE_ACCESS_TOKEN ausente. Use a ação oficial google-github-actions/auth no workflow.');
const cfg=JSON.parse(await fs.readFile('sheets.config.json','utf8'));
const url=new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(cfg.spreadsheetId)}/values:batchGet`);
for(const range of ['Usinas!A1:M1000','UGs!A1:K5000','Referencia!A1:D6','Parametros!A1:C100'])url.searchParams.append('ranges',range);
url.searchParams.set('valueRenderOption','UNFORMATTED_VALUE');
const response=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error('Falha ao ler Google Sheets: HTTP '+response.status);
const data=await response.json(),sheets={};
for(const [i,name] of ['Usinas','UGs','Referencia','Parametros'].entries()){sheets[name]=data.valueRanges?.[i]?.values;if(!sheets[name])throw Error('Aba não retornada: '+name)}
const tmp='.sheet-sync.json';
try{await fs.writeFile(tmp,JSON.stringify({version:1,sheets}));const result=spawnSync(process.execPath,['scripts/compile-config.mjs',tmp],{stdio:'inherit'});if(result.status!==0)process.exitCode=result.status||1;}finally{await fs.rm(tmp,{force:true})}
