# Metodologia — disponibilidade UHE, ONS e Portaria MME 42/2022

## Grandezas distintas

**TEIFa e TEIP**: taxas acumuladas apuradas pelo ONS a partir dos eventos operacionais e da janela móvel de 60 meses. Dados públicos por usina: https://dados.ons.org.br/dataset/taxa_teif_teip

**TEIF e IP de referência**: parâmetros publicados na Portaria GM/MME 42/2022 por faixas de potência **unitária**. Não são as taxas operacionais de uma usina específica. Fonte oficial: https://www.gov.br/mme/pt-br/acesso-a-informacao/legislacao/portarias/2022/portaria-normativa-n-42-gm-mme-2022.pdf

**Projeção janeiro/2028**: extrapolação indicativa com fatores multiplicativos sobre taxas acumuladas ONS de 2026. Não é publicação oficial, não recompõe a janela 2022–2026 nem substitui o PMO.

## Fórmulas do ONS (REN ANEEL 1.033/2022, Submódulo 6.5 e RO-AO.BR.04, Anexo 3)

- TEIP = 100 × Σ[Pᵢ × (HDPᵢⱼ + HEDPᵢⱼ)] / Σ[Pᵢ × HPᵢⱼ].
- TEIFa = 100 × Σ[Pᵢ × (HDFᵢⱼ + HEDFᵢⱼ)] / Σ[Pᵢ × (HDFᵢⱼ + HEDFᵢⱼ + HSᵢⱼ + HRDᵢⱼ + HDCEᵢⱼ)].
- Disponibilidade equivalente calculada = 100 × (1 − TEIFa/100) × (1 − TEIP/100).

P = potência instalada em MW, HP = horas do período, HDP/HEDP = horas de desligamento/equivalentes programadas, HDF/HEDF = horas de desligamento/equivalentes forçadas, HS = horas em serviço, HRD = reserva desligada, HDCE = condições externas.

Para reconstrução aritmética, utilize a calculadora por horas (aba **Metodologia e Dados ONS**) com CSV `ug;mes;potencia_mw;hp;hdp;hedp;hdf;hedf;hs;hrd;hdce`, uma UG e mês por registro (`AAAA-MM`). O modelo valida duplicação, meses consecutivos e fechamento das horas. **Não realiza consistência oficial dos eventos, expurgos regulatórios, complementação de períodos sem 60 meses ou homologação.** Dados: https://dados.ons.org.br/dataset/taxa_teif_teip_parametro

## Referências normativas da Portaria 42/2022

| Faixa de potência por UG | TEIF | IP | D publicada |
|---|---:|---:|---:|
| Até 29 MW | 1,684% | 3,796% | 94,584% |
| 29 a 59 MW | 1,844% | 3,641% | 94,582% |
| 59 a 199 MW | 1,591% | 3,707% | 94,761% |
| 199 a 499 MW | 2,681% | 3,478% | 93,934% |
| 499 a 1300 MW | 2,107% | 2,399% | 95,545% |

Uma usina com UGs em faixas distintas utiliza **médias de TEIF/IP ponderadas pelas respectivas potências unitárias**, e D é obtida do produto das duas taxas médias. No art. 5º, a Portaria prevê valores apurados pelo ONS para usinas com mais de 60 meses de operação comercial após completa motorização nos estudos de garantia física, não necessariamente os valores genéricos da tabela.

## Indicadores gerenciais CTG

Disponibilidade de conjunto = Σ(P × D da UG) / ΣP (média de disponibilidades por potência). Já o **benchmark de uma usina** com várias faixas = D(Σ(P × TEIF de referência)/ΣP, Σ(P × IP de referência)/ΣP). Não misturar os dois indicadores.

As taxas ONS importadas por usina são **herdadas** pelas UGs na interface enquanto não existirem valores detalhados por máquina. Isso é hipótese, não medição específica de UG.

## Limitações de dados e auditoria

O histórico `dist/historical.json` não reconcilia a faixa 1 do Anexo I da Revisão 4: 56 UGs na transcrição contra 58 publicadas; há A.S.OLIVEIRA repetida. Não corrigir por preenchimento artificial. As demais faixas reproduzem a tabela a três casas.

`dist/ons.json` é um recorte fixo de setembro de 2026, sujeito a revisões do ONS. Revalidar frente ao portal antes de uso regulatório. A base SIN estimada para 2028 exige reconciliar histórico completo, PMO, critérios de inclusão e motorização.