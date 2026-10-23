import {readFile,writeFile} from 'node:fs/promises';
import {FLUENT_WORDS} from '../src/fluent-emoji.mjs';

export async function embedLocalArtwork(){
  const artwork={};
  for(const src of [...new Set(Object.values(FLUENT_WORDS).map(a=>a.src))].sort()){
    const bytes=await readFile(new URL('../public/'+src.slice(2),import.meta.url));
    artwork[src]='data:image/webp;base64,'+bytes.toString('base64');
  }
  await writeFile(new URL('../src/embedded-artwork.mjs',import.meta.url),'// Generated from the included, licensed Fluent assets for direct local play.\nexport const EMBEDDED_ARTWORK='+JSON.stringify(artwork)+';\n');
  return artwork;
}
