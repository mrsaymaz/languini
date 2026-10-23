// Stable save IDs with progressively larger dining rooms. Each venue shares the same ordered service zones.
const layouts={
 courtyard:{extraWidth:0,extraDepth:0,overviewScale:1},
 bistro:{extraWidth:1,extraDepth:1,overviewScale:1.045},
 banquet:{extraWidth:2,extraDepth:2,overviewScale:1.09}
};
export function venueLayout(arena='courtyard'){
 const v=layouts[arena]||layouts.courtyard;
 return {...v,width:9.4+v.extraWidth,depth:9.1+v.extraDepth,centerZ:-v.extraDepth/2,pickup:[2.9,3.48]};
}
