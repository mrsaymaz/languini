import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Browser translation would turn the English questions and answers into Turkish.
test('the game and phone preview ask browsers not to translate the page',()=>{
 for(const page of ['index.html','phone-preview.html']){
  const html=fs.readFileSync(new URL('../public/'+page,import.meta.url),'utf8');
  for(const tag of ['html','body']){const open=html.match(new RegExp('<'+tag+'(\\s[^>]*)?>'))?.[0]||'';assert.match(open,/\stranslate="no"/,page+' <'+tag+'>');assert.match(open,/\sclass="[^"]*\bnotranslate\b/,page+' <'+tag+'>');}
  const head=html.slice(html.indexOf('<head>'),html.indexOf('</head>'));assert.match(head,/<meta name="google" content="notranslate">/,page);
 }
});
