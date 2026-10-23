// Presentation only: labels, currency, rewards and project rules live elsewhere.
export const STATION_VISUALS=Object.freeze({
 pickup:{icon:'clip',accent:'#8b744a'},
 conversation:{icon:'chat',accent:'#576f98'},tablet:{icon:'tablet',accent:'#41796b'},delivery:{icon:'crate',accent:'#9b7047'},recipe:{icon:'prep',accent:'#a86e4d'},ticket:{icon:'clip',accent:'#947445'},repair:{icon:'repair',accent:'#617d55'},wash:{icon:'sink',accent:'#407f8b'}
});
export const ARENA_VISUALS=Object.freeze({
 courtyard:{icon:'courtyard',accent:'#4d8267',surface:'#edf2df',description:'Garden pergola · sandstone · terracotta'},
 bistro:{icon:'bistro',accent:'#34787a',surface:'#e4eeea',description:'Roomier dining · teal upholstery · copper trim'},
 banquet:{icon:'banquet',accent:'#66658c',surface:'#ece9f2',description:'Grand dining · ivory linen · brass chandeliers'}
});
export const PROJECT_VISUALS=Object.freeze({
 receiving:{icon:'crate',features:['Framed cart and handles','Stock bins and manifest','Striped awning and lantern']},
 kitchen:{icon:'prep',features:['Joinery and lower storage','Tilework and utensil rail','Bench with preparation storage']},
 pass:{icon:'trolley',features:['Plate cubbies and pass lip','Brass rail and tray parking','Two-tier trolley with rails']}
});
export const ticketStateIcon=state=>({waiting:'chat',queued:'clip',prepared:'prep',cooking:'flame',ready:'serve',delivering:'trolley',leaving:'check'}[state]||'clock');
