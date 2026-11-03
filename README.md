# Disponibilidade de UHEs — CTG Brasil

Ferramenta estática para análise de indisponibilidade de UHEs, separando:

- **TEIFa/TEIP apuradas pelo ONS**, recorte por usina de setembro de 2026;
- **TEIF/IP de referência**, publicados na Portaria GM/MME 42/2022;
- **cenário condicional de 2028**, não homologado e distinto dos parâmetros oficiais.

O benchmark CTG por faixa não é o valor necessariamente aplicável à garantia física de cada usina. Dados por UG herdados das taxas da usina são simulações, não medições individuais.

Metodologia, equações de apuração em horas, origem dos dados, critérios de ponderação e limitações: [docs/ONS-METODOLOGIA.md](docs/ONS-METODOLOGIA.md).

Fontes: [ONS — taxas](https://dados.ons.org.br/dataset/taxa_teif_teip) e [ONS — parcelas operacionais](https://dados.ons.org.br/dataset/taxa_teif_teip_parametro).

```bash
npm test
npm run build
npm run preview
```

A implantação via GitHub Pages exige aprovação da suíte de testes.