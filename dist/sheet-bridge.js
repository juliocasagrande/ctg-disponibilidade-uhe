(function(root){'use strict';
const fields=['mw','teif','ip','include'];
function equal(a,b){return fields.every(k=>a[k]===b[k])}
function changes(baseline,rows){return rows.filter(r=>!equal(r,baseline.find(u=>u.id===r.id)||{}))}
function writes(baseline,remote,rows,grid){
 const headers=grid[0],expected=['unidade_id','usina_id','usina','ug','potencia_mw','elegivel','participacao','motivo','teif_pct','ip_pct','incluir_cenario'];
 if(expected.some((h,i)=>headers[i]!==h))throw Error('Colunas da aba UGs incompatíveis.');
 const data=[];
 for(const row of changes(baseline,rows)){
  const before=baseline.find(u=>u.id===row.id),current=remote.find(u=>u.id===row.id&&u.eligible),indexes=grid.map((r,i)=>r[0]===row.id?i:-1).filter(i=>i>=1);
  if(!before||!current||indexes.length!==1)throw Error('Cadastro alterado na planilha: '+row.id+'. Recarregue a base.');
  if(!equal(before,current))throw Error('Conflito em '+row.id+': a planilha foi alterada. Carregue a versão atual antes de salvar.');
  const n=indexes[0]+1;
  data.push({range:'UGs!E'+n,values:[[row.mw]]},{range:'UGs!I'+n+':K'+n,values:[[row.teif,row.ip,row.include?1:0]]});
 }
 return data;
}
const api={equal,changes,writes};if(typeof module!=='undefined'){module.exports=api;return}
root.SheetBridge=api;
let client,token='',expires=0,pending,connection;
function setup(){const id=root.UHE_CONFIG.googleClientId;if(!id)return;if(!/^[A-Za-z0-9._-]+\.apps\.googleusercontent\.com$/.test(id))return;const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=()=>{client=google.accounts.oauth2.initTokenClient({client_id:id,scope:'https://www.googleapis.com/auth/spreadsheets',callback:r=>{if(r.error){pending?.reject(Error('Autorização recusada: '+r.error));pending=null;return}token=r.access_token;expires=Date.now()+Math.max(0,Number(r.expires_in)-60)*1000;pending?.resolve();pending=null},error_callback:r=>{pending?.reject(Error(r.type==='popup_closed'?'Login cancelado.':'Não foi possível abrir o login Google.'));pending=null}})};script.onerror=()=>{document.getElementById('sheetStatus').textContent='Não foi possível carregar a autorização Google.'};document.head.append(script)}
api.authorize=()=>{
 if(token&&Date.now()<expires)return Promise.resolve();
 if(!root.UHE_CONFIG.googleClientId)return Promise.reject(Error('Gravação pendente: preencha google_oauth_client_id na aba Parametros e publique a configuração.'));
 if(!client)return Promise.reject(Error('A autorização Google está carregando. Tente novamente.'));
 if(pending)return Promise.reject(Error('Conclua o login Google em andamento.'));
 return new Promise((resolve,reject)=>{pending={resolve,reject};try{client.requestAccessToken({prompt:'select_account'})}catch(e){pending=null;reject(e)}});
};
async function request(url,options={}){if(!token||Date.now()>=expires)throw Error('Sessão Google expirada. Conecte novamente.');const response=await fetch(url,{...options,headers:{Authorization:'Bearer '+token,...options.headers},signal:AbortSignal.timeout(30000)});if(!response.ok){if(response.status===401){token='';expires=0}throw Error(response.status===403?'Sem permissão. Use uma conta com acesso de edição à planilha.':'Google Sheets: HTTP '+response.status)}return response.json()}
async function config(){if(!connection){const r=await fetch('sheets-connection.json');if(!r.ok)throw Error('Conexão da planilha indisponível.');connection=await r.json()}return connection}
api.read=async()=>{const c=await config(),url=new URL('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(c.spreadsheetId)+'/values:batchGet');for(const range of ['Usinas!A1:M1000','UGs!A1:K5000','Referencia!A1:D6','Parametros!A1:C100'])url.searchParams.append('ranges',range);url.searchParams.set('valueRenderOption','UNFORMATTED_VALUE');const r=await request(url),sheets={};['Usinas','UGs','Referencia','Parametros'].forEach((name,i)=>sheets[name]=r.valueRanges[i].values);const payload={version:1,sheets};ConfigModel.compile(payload);return payload};
api.save=async(baseline,state,plants,units)=>{
 CTGModel.validateUnits(state,plants,units,root.UHE_CONFIG);
 const live=await api.read(),compiled=ConfigModel.compile(live);if(JSON.stringify(compiled.units.filter(u=>u.eligible).map(u=>u.id).sort())!==JSON.stringify(units.filter(u=>u.eligible).map(u=>u.id).sort()))throw Error('Elegibilidade alterada na planilha. Recarregue a base.');const data=writes(baseline,compiled.units,state.units,live.sheets.UGs);if(!data.length)return {payload:live,count:0};const c=await config();
 await request('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(c.spreadsheetId)+'/values:batchUpdate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({valueInputOption:'RAW',data})});
 const payload=await api.read(),saved=ConfigModel.compile(payload);
 for(const row of changes(baseline,state.units))if(!equal(row,saved.units.find(u=>u.id===row.id)||{}))throw Error('Gravação não confirmada para '+row.id+'. Recarregue a planilha antes de tentar novamente.');
 return {payload,count:data.length/2};
};
setup();
})(globalThis);
