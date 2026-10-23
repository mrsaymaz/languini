import links from '../content/dialogue-links.json' with {type:'json'};
export const DIALOGUE_LINKS=links;
export function dialogueLinksFor(tasks){const ids=new Set(tasks.filter(t=>t.kind==='question').map(t=>t.id));return links.filter(link=>ids.has(link.first)&&ids.has(link.second));}
