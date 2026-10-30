"""Reconstitui o universo SIN a partir de downloads ONS locais, sem filtrar CTG.
Uso: python scripts/prepare-sin-2028.py /tmp/ons-rates /tmp/ons-capacidade /tmp/sin-rows.json
"""
import csv,json,sys,collections,hashlib
from pathlib import Path
rates_path,capacity_path,out=sys.argv[1:]
rates=list(csv.DictReader(open(rates_path),delimiter=';'));caps=list(csv.DictReader(open(capacity_path),delimiter=';'));month=max(r['din_mes'] for r in rates)
latest=collections.defaultdict(dict);names={}
for r in rates:
 if r['din_mes']==month and r['tip_usina'].strip()=='Hidroelétrica':latest[(r['cod_ceg'],r['nom_usina'])][r['nom_taxa']]=float(r['val_taxa'])*100
by=collections.defaultdict(list)
for r in caps:
 if r['nom_tipousina'].strip()!='HIDROELÉTRICA' or not r['ceg'].startswith('UHE.'):continue
 if not r['dat_entradaoperacao'] or r['dat_entradaoperacao']>'2026-10-30' or (r['dat_desativacao'] and r['dat_desativacao']<='2026-10-30'):continue
 by[r['ceg']].append(r)
limits=[29,59,199,499,1300]
rows=[['id','usina_cadastro','usina_ons','ceg','faixa','ugs','teif_pct','ip_pct','incluir','motivo','fonte','mes_base','motorizacao','potencias_mw']];seen=set()
for i,(ceg,raw) in enumerate(sorted(by.items())):
 # Relatório, seção de resultados: as duas auxiliares de Tucuruí não compõem a amostra.
 is_tucurui=any('TUCUR' in r['nom_usina'].upper() for r in raw)
 raw=[r for r in raw if not(is_tucurui and float(r['val_potenciaefetiva'])==22.5)]
 units={r['cod_equipamento'].strip():r for r in raw};u=list(units.values());powers=[float(x['val_potenciaefetiva']) for x in u];bands={next((i+1 for i,v in enumerate(limits) if 0<p<=v),0) for p in powers};date=max(r['dat_entradaoperacao'] for r in u)
 found=[(k,v) for k,v in latest.items() if k[0]==ceg];chosen=found[0] if len(found)==1 else None
 if len(found)>1 and all('ITAIPU' in k[1] for k,v in found):chosen=(('', 'ITAIPU'),latest[('', 'ITAIPU')])
 reason=[]
 if len(bands)!=1 or 0 in bands:reason.append('UGs em faixas distintas ou potência fora das faixas')
 if date>'2021-12-31':reason.append('Motorização posterior a 31/12/2021')
 if not chosen or not all(k in chosen[1] for k in ['TEIFa','TEIP']):reason.append('Sem par de taxas acumuladas unívoco em '+month[:7])
 if chosen:seen.add(chosen[0]);seen.update(k for k,v in found)
 rows.append(['SIN'+str(i+1),u[0]['nom_usina'].strip(),chosen[0][1] if chosen else '',ceg,next(iter(bands)) if len(bands)==1 else 0,len(u),chosen[1].get('TEIFa','') if chosen else '',chosen[1].get('TEIP','') if chosen else '',int(not reason),'; '.join(reason) if reason else 'Elegível pelo cadastro ONS e critérios do relatório; taxas atuais usadas como proxy', 'https://dados.ons.org.br/dataset/taxa_teif_teip',month,date,' / '.join(map(str,sorted(set(powers))))])
for (ceg,name),v in latest.items():
 if (ceg,name) in seen:continue
 # Garante que todos os registros de taxas estejam visíveis, inclusive agregações sem CEG.
 rows.append(['TAX'+str(len(rows)),name,name,ceg,0,0,v.get('TEIFa',''),v.get('TEIP',''),0,'Registro de taxas sem correspondência individual elegível; agregação não duplicada no cálculo','https://dados.ons.org.br/dataset/taxa_teif_teip',month,'',''])
Path(out).write_text(json.dumps(rows,ensure_ascii=False))
meta={'consulted':'2026-10-30','month':month,'window':'2022–2026','cutoff':'2021-12-31','ratesSha256':hashlib.sha256(Path(rates_path).read_bytes()).hexdigest(),'capacitySha256':hashlib.sha256(Path(capacity_path).read_bytes()).hexdigest(),'records':len(rows)-1,'eligible':sum(r[8] for r in rows[1:])}
Path(out+'.metadata').write_text(json.dumps(meta,ensure_ascii=False));print(meta)
for b in range(1,6):
 r=[x for x in rows[1:] if x[8] and x[4]==b];n=sum(x[5] for x in r);t=sum(x[5]*x[6] for x in r)/n;i=sum(x[5]*x[7] for x in r)/n;print(b,len(r),n,t,i,100*(1-t/100)*(1-i/100))
