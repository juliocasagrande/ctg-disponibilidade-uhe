# Disponibilidade UHE — CTG Brasil

Calculadora estática de TEIF, IP e disponibilidade das UHEs da CTG Brasil, preparada para GitHub Pages. Mantém a identidade visual CTG, as abas técnicas, os cenários editáveis, a persistência no navegador, os backups e as exportações CSV/JSON.

## Planilha de configuração

[CTG Brasil — Disponibilidade UHE — Configuração](https://docs.google.com/spreadsheets/d/14oKP3hlqoObH7hwhoD_IVdSpAoVArOi0CYW6K33WnYQ/edit)

| Aba | Campos configuráveis |
| --- | --- |
| Usinas | Taxas TEIF/IP em pontos percentuais, seleção padrão, identificação, grupo e fonte |
| UGs | Identificador único, potência ativa em MW, elegibilidade e participação |
| Referencia | Cinco faixas com limites superiores e taxas de referência |
| Parametros | Ano, título, hipótese, participação padrão, data e cores |
| Instrucoes | Orientações e origem dos dados |

Potências e quantidade de UGs são calculadas a partir da aba **UGs**, sem dividir capacidade institucional pelo número de máquinas. A configuração inicial tem 68 UGs e 7.538,46 MW nas 12 UHEs operadas; com São Manoel, são 72 UGs e 8.238,46 MW. O inventário completo contém 76 UGs. As quatro unidades excluídas permanecem identificadas, sem taxas zero inventadas.

### Opção A — Atualização manual, sem credenciais no GitHub

1. Na planilha, abra **Extensões → Apps Script**.
2. Cole o conteúdo de `google-apps-script/Code.gs`, salve e recarregue a planilha. O Google poderá solicitar autorização para ler a própria planilha.
3. Use o menu **Disponibilidade UHE → Exportar configuração JSON**.
4. No site, abra **Configuração → Importar dados da planilha**.

A importação muda a base **apenas naquele navegador**. Ela é validada integralmente antes de substituir a configuração anterior. O botão **Usar configuração publicada** reverte a importação local. Não é preciso publicar a planilha na internet nem implantar o Apps Script como aplicativo web.

Para distribuir a atualização a todos, substitua `sheet-data.json` pelo JSON exportado e faça um commit. O workflow valida os dados, gera `dist/config.json` e publica a nova base. Alternativamente, use a opção B.

### Opção B — Leitura da planilha privada pelo GitHub Actions

Essa integração está implementada, mas precisa da configuração inicial abaixo. Nenhuma credencial foi criada ou inserida automaticamente.

1. Em um projeto Google Cloud, habilite a **Google Sheets API** e crie uma conta de serviço dedicada. Não é necessário atribuir papéis administrativos ao projeto.
2. Compartilhe **somente a planilha de configuração**, como **Leitor**, com o e-mail da conta de serviço.
3. Crie uma chave JSON dessa conta e cadastre seu conteúdo em **Settings → Secrets and variables → Actions → New repository secret**, com nome **`GOOGLE_SERVICE_ACCOUNT_JSON`**.
4. Execute **Publicar GitHub Pages**.

O workflow usa a ação oficial `google-github-actions/auth`, pede escopo `spreadsheets.readonly` e consulta as quatro abas com `UNFORMATTED_VALUE`. O arquivo `sheets.config.json` contém somente o ID/URL da planilha, sem credenciais. Se a credencial não estiver configurada, a publicação usa a base versionada `sheet-data.json`. Se a credencial existir, mas a leitura ou validação falhar, a publicação para; ela não troca silenciosamente por dados antigos.

Alterações na planilha não disparam uma publicação por conta própria: execute o workflow após editar os dados. Não foi criado agendamento recorrente.

## Cenários locais e atualização de dados

- **Configuração** é a base recebida da planilha: potências, elegibilidade, referências e valores iniciais.
- **Cenário CTG** contém a seleção e as taxas editadas para simulação. Continua salvo separadamente no navegador.
- Atualizar a base preserva as taxas locais. Para adotar as taxas da planilha no cenário atual, use **Usar valores da configuração**. Exporte um backup antes de substituir um cenário que deseja conservar.
- A página não escreve diretamente na planilha. As duas opções acima são fluxos de leitura/importação, e não sincronização bidirecional.
- Backups do site anterior podem ser importados na aba CTG. O armazenamento do navegador é específico de cada domínio; o GitHub Pages não acessa o armazenamento do antigo endereço ChatGPT Sites.

## Validação dos dados

O compilador rejeita UGs duplicadas, taxas ausentes ou fora de 0–100%, potência inválida, UG elegível sem taxas na aba Usinas, parâmetros ausentes e limites de faixa fora de ordem. UGs da mesma usina em faixas diferentes precisam ser separadas em conjuntos com taxas próprias antes de serem incluídas; o sistema não inventa uma desagregação de taxas da usina.

O valor `1.591` na coluna `teif_pct` representa **1,591%**. Não use `0.01591` nem formate a entrada como fração percentual. A lista usa MW, não MVA.

## Executar localmente

```bash
npm test
npm run build
npm run preview
```

Requisitos: Node.js 22 ou superior e Python 3 para o servidor local. Abra o endereço exibido pelo servidor. Abrir `index.html` diretamente por `file://` não permite carregar os arquivos JSON em alguns navegadores.

## Estrutura

- `dist/`: site estático e dados compilados, incluindo logo CTG.
- `sheet-data.json`: cópia inicial editável dos dados da planilha.
- `scripts/compile-config.mjs`: valida e gera a configuração publicada.
- `scripts/sync-sheets.mjs`: lê Google Sheets com token de curta duração fornecido pelo workflow.
- `google-apps-script/Code.gs`: exportação manual do JSON da planilha.
- `.github/workflows/pages.yml`: validação e publicação no Pages.
- `test-*.cjs`: testes de cálculos, cadastro, migração e configuração.

## Fontes e limites

Taxas apuradas ONS: setembro/2026. Potências por UG: relação informada por Júlio em 30/10/2026. Referência normativa consultada: Portaria MME 42/2022. A base histórica preserva as divergências do Anexo I identificadas na ferramenta. O cenário de 2027 mantém as taxas observadas como hipótese inicial e não é referência homologada.

Fontes: [ONS taxas](https://dados.ons.org.br/dataset/taxa_teif_teip), [ONS parâmetros](https://dados.ons.org.br/dataset/taxa_teif_teip_parametro), [Portaria 42/2022](https://www.gov.br/mme/pt-br/acesso-a-informacao/legislacao/portarias/2022/portaria-normativa-n-42-gm-mme-2022.pdf), [CTG Brasil](https://www.ctgbr.com.br/operacoes/energia-hidreletrica/).

O logo e as cores pertencem à CTG Brasil; sua origem está em `dist/assets/brand-source.json`. Os dados ONS são utilizados com atribuição CC-BY. Não foi atribuída licença aberta ao código ou às marcas sem decisão do proprietário.

O Pages entrega os arquivos e dados da versão publicada aos visitantes. A planilha pode permanecer privada; segredos de autenticação ficam nos Secrets do GitHub e não são incluídos nos arquivos estáticos. Nunca coloque chaves de conta de serviço em `dist/`, no JSON de configuração ou em commits.
