import fs from 'node:fs/promises';
import model from '../dist/config-model.js';
const source=process.argv[2]||'sheet-data.json';
const payload=JSON.parse(await fs.readFile(source,'utf8'));
const result=model.compile(payload);
// Validate everything before writing any runtime data.
await fs.writeFile('dist/config.json',JSON.stringify(payload,null,2));
await fs.writeFile('dist/ctg.json',JSON.stringify(result.plants,null,2));
await fs.writeFile('dist/ctg-units.json',JSON.stringify(result.units,null,2));
console.log(`Configuração validada: ${result.plants.length} usinas e ${result.units.length} UGs cadastradas.`);
