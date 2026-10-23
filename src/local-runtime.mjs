import languageBank from '../public/data/language.json' with {type:'json'};
import {EMBEDDED_ARTWORK} from './embedded-artwork.mjs';

// The classic browser bundle includes its lessons; file:// never needs fetch.
export function getLanguageBank(){return languageBank;}
export function artworkSource(src,{protocol=globalThis.location?.protocol}={}){
  return protocol==='file:'?(EMBEDDED_ARTWORK[src]||src):src;
}
export function messageTargetOrigin(location=globalThis.location){return location?.protocol==='file:'?'*':location?.origin;}
