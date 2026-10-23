import {readFile} from 'node:fs/promises';
import {auditLanguageBank} from '../src/language-integrity.mjs';
const report=auditLanguageBank(JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url))));
console.log(JSON.stringify(report,null,2));if(report.issues.length)process.exitCode=1;
