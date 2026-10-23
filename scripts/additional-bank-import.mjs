import {createHash} from 'node:crypto';
export const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// Source IDs are not catalog IDs: these six sections deliberately change parent.
export const PARENT_UNITS=Object.freeze({g5u9:'g5u3',g5u10:'g5u9',g6u9:'g6u10',g6u10:'g6u10',g8u11:'g8u2',g8u12:'g8u2'});
const REPLIES={g5u2q7:'You spell it D-E-S-K.',g5u8q2:'I am going to travel next Saturday.',g5u9q8:'You can use a clean plaster.',g6u9q2:'You use a thermometer.',g8u4q5:'You spell it K-A-Y-A.',g8u11q6:'Maths deals with numbers.'};
const finish=s=>/[.!?]$/.test(s.trim())?s.trim():s.trim()+'.';
const cleanHalf=s=>s.replace(/…|\.{3}/g,'').trim();
const titleCase=s=>s.toLowerCase().replace(/(^|\s)\p{L}/gu,x=>x.toUpperCase());
export function threeBlocks(blocks){if(blocks.length<3)throw Error('Sentence needs three meaningful chunks');return blocks.length>=5?[blocks.slice(0,2).join(' '),blocks[2],blocks.slice(3).join(' ')]:[blocks[0],blocks[1],blocks.slice(2).join(' ')];}
export function questionType(q){
 const s=normalize(q);for(const type of ['how many','how much','how often','how long','how old','where','when','why','who'])if(s.startsWith(type+' '))return type;
 if(/^(can|could|may|do|does|did|is|are|was|were|will|would|have|has|should|must)\b/.test(s))return 'yes/no';
 return s.split(' ')[0];
}
// Distractors answer a different, incompatible question function from the same section.
const WRONG_TYPES={where:['who','when','how many','why'],when:['where','who','how many','why'],why:['when','where','how many','who'],who:['when','where','how many','why'],'how many':['why','where','who'],'how much':['why','where','who'],'how often':['why','where','who'],'how long':['why','where','who'],'how old':['why','where','who'],what:['when','why','yes/no','how often','how many'],which:['when','why','yes/no','how many'],whose:['when','where','how many','why'],how:['when','why','how many','where'],'yes/no':['when','where','how many','why']};
export function mergeAdditionalBanks(input,sources,pictureTranslations={}){
 const bank=structuredClone(input),sorting=[],report={version:'0.37.0',mappings:[],records:[],duplicates:[],categoryExclusions:[],counts:{added:0,duplicates:0,byKind:{},pictures:0,pictureVocabulary:0,sortingPacks:0}};
 const translations=new Map();for(const g of input)for(const u of g.units)for(const t of u.tasks)if(t.kind==='vocabulary')translations.set(normalize(t.answer),t.translation||t.prompt);
 for(const [word,tr]of Object.entries(pictureTranslations))translations.set(normalize(word),tr);
 for(const g of sources)for(const u of g.units)for(const t of u.translations)translations.set(normalize(t.en),t.tr);
 for(const source of sources){const grade=bank.find(g=>g.grade===source.grade);if(!grade)throw Error('Unknown grade '+source.grade);
  for(const raw of source.units){const parent=PARENT_UNITS[raw.id]||raw.id,unit=grade.units.find(u=>u.id===parent);if(!unit)throw Error('No parent for '+raw.id);
   const origin=record=>({file:`grade${source.grade}-2.json`,grade:source.grade,unit:raw.id,record,parent});
   report.mappings.push({grade:source.grade,sourceUnit:raw.id,sourceTitle:raw.title,targetUnit:unit.id,targetTitle:unit.title,subtheme:raw.id!==parent||['g6u10'].includes(raw.id)?raw.title:null});
   unit.subthemes??=[];for(const title of [ ...(raw.id!==parent||raw.id==='g6u10'?[raw.title]:[]),...raw.categories.map(c=>titleCase(c.title))])if(!unit.subthemes.some(s=>normalize(s.title)===normalize(title)))unit.subthemes.push({title,sourceUnit:raw.id});
   unit.languageFocus??=[];for(const focus of raw.targetLanguage)if(!unit.languageFocus.includes(focus))unit.languageFocus.push(focus);
   const add=(task,record)=>{
    const match=unit.tasks.find(t=>t.kind===task.kind&&(task.kind==='vocabulary'?normalize(t.answer)===normalize(task.answer):task.kind==='question'?normalize(t.prompt)===normalize(task.prompt):task.kind==='sentence'?normalize(t.answer)===normalize(task.answer):normalize(t.prompt)===normalize(task.prompt)&&normalize(t.answer)===normalize(task.answer)));
    if(match){report.duplicates.push({...origin(record),existing:match.id,kind:task.kind});report.records.push({...origin(record),status:'existing',task:match.id});report.counts.duplicates++;return match;}
    const id=`${parent}-extra-${raw.id}-${record}`;if(unit.tasks.some(t=>t.id===id))throw Error('Duplicate source ID '+id);
    task={id,...task,additionalSource:origin(record)};unit.tasks.push(task);report.records.push({...origin(record),status:'added',task:id});report.counts.added++;report.counts.byKind[task.kind]=(report.counts.byKind[task.kind]||0)+1;return task;
   };
   const words=[...new Set([...raw.translations.map(t=>t.en),...raw.pictures.map(p=>p.word)])];
   const vocabularyOptions=(answer,tr)=>[answer,...words.filter(w=>normalize(w)!==normalize(answer)&&normalize(w).replace(/ /g,'')!==normalize(answer).replace(/ /g,'')&&normalize(translations.get(normalize(w)))!==normalize(tr))];
   for(const t of raw.translations)add({kind:'vocabulary',prompt:t.tr,answer:t.en,options:vocabularyOptions(t.en,t.tr),translation:t.tr,readback:''},t.id);
   unit.pictureReferences??=[];
   for(const p of raw.pictures){report.counts.pictures++;unit.pictureReferences.push({...p,source:origin(p.id)});const tr=translations.get(normalize(p.word));if(!tr)throw Error('Missing picture-word translation '+p.word);const previous=report.counts.added;add({kind:'vocabulary',prompt:tr,answer:p.word,options:vocabularyOptions(p.word,tr),translation:tr,readback:''},p.id);if(report.counts.added>previous)report.counts.pictureVocabulary++;}
   for(const d of raw.descriptions){if(!d.options.includes(d.answer)||new Set(d.options).size!==d.options.length)throw Error('Invalid definition '+d.id);add({kind:'description',prompt:d.clue,answer:d.answer,options:d.options,translation:translations.get(normalize(d.answer))||'',readback:d.answer},d.id);}
   for(const q of raw.questions){const answer=finish(REPLIES[q.id]||q.a),type=questionType(q.q),types=WRONG_TYPES[type]||WRONG_TYPES.what;
    const candidates=types.flatMap(t=>raw.questions.filter(other=>other.id!==q.id&&questionType(other.q)===t));
    const wrong=[...new Set(candidates.map(other=>finish(REPLIES[other.id]||other.a)))].filter(a=>normalize(a)!==normalize(answer)).slice(0,3);
    if(wrong.length<2)throw Error('Need reviewed reply options '+q.id);
    add({kind:'question',prompt:q.q,answer,options:[answer,...wrong],readback:answer,translation:'',replyOptionTypes:types.slice()},q.id);
   }
   for(const s of raw.sentences){const blocks=threeBlocks(s.blocks);add({kind:'sentence',prompt:s.tr,answer:blocks.join(' '),blocks,translation:s.tr,difficulty:s.difficulty},s.id);}
   // The supplied wrongEndings often form other valid sentences. Use the correct
   // complete sentence for assembly instead of marking those alternatives wrong.
   for(const h of raw.completions){const left=cleanHalf(h.start),right=cleanHalf(h.end),end=right.split(/\s+/);const blocks=end.length>=2?[left,end[0],end.slice(1).join(' ')]:threeBlocks((left+' '+right).split(/\s+/));add({kind:'sentence',prompt:'Build the English sentence.',answer:blocks.join(' '),blocks,translation:'',adaptedFrom:'completion'},h.id);}
   const categories=raw.categories.map(c=>({id:`${parent}-extra-${c.id}`,name:titleCase(c.title),translation:''})),a=new Set(raw.categories[0].yes.map(normalize)),b=new Set(raw.categories[1].yes.map(normalize)),cards=[];
   for(const [index,c]of raw.categories.entries())for(const [i,word]of c.yes.entries()){
    if(a.has(normalize(word))&&b.has(normalize(word))){report.categoryExclusions.push({...origin(c.id),word,reason:'Fits both headings'});continue;}
    if(cards.some(t=>normalize(t.word)===normalize(word)))continue;
    cards.push({id:`${parent}-extra-${c.id}-${i}`,word,translation:translations.get(normalize(word))||'',category:index,source:origin(c.id)});
   }
   if(cards.filter(c=>c.category===0).length<5||cards.filter(c=>c.category===1).length<5)throw Error('Insufficient exclusive sorting labels '+raw.id);
   sorting.push({unit:parent,title:raw.title,categories,cards});
  }
 }
 report.counts.sortingPacks=sorting.length;report.totalTasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks)).length;report.totalQuestions=bank.flatMap(g=>g.units.flatMap(u=>u.tasks)).filter(t=>t.kind==='question').length;
 return {bank,sorting,report};
}
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
