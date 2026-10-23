export function checkoutStep(active){
 if(active?.printed)return {number:4,title:'Receipt printed',help:'Your order will continue automatically.'};
 if(active?.completed)return {number:4,title:'Print the receipt',help:'Your correction is ready.'};
 if(active?.repairErased)return {number:3,title:'Choose the correct word',help:'Tap a replacement below.'};
 if(active?.repairFound)return {number:2,title:'Clear the selected word',help:'Tap Clear, or swipe across the word.'};
 return {number:1,title:'Find the mistake',help:'Tap the underlined word.'};
}
