/* This classic script runs before the game, including from file:// folders. */
(function(){
  var state='loading',timer;
  function fail(error){
    if(state==='failed')return;
    var started=state==='ready';
    state='failed';clearTimeout(timer);
    var panel=document.getElementById('loading');if(!panel)return;
    panel.hidden=false;panel.replaceChildren();
    var title=document.createElement('strong');title.textContent=started?'The café needs a restart.':'The café could not open yet.';
    var help=document.createElement('span');help.textContent=started?'Try again to reopen the restaurant. If this happens again, report the message below.':'Extract the whole ZIP into one folder, then open index.html in a current browser. Keep game.js, startup.js, assets and the CSS files together.';
    var details=document.createElement('small');details.style.maxWidth='560px';details.style.overflowWrap='anywhere';details.textContent=String(error&&error.message||error||'The game did not finish starting.');
    var retry=document.createElement('button');retry.className='primary-button';retry.textContent='Try again';retry.addEventListener('click',function(){location.reload();});
    panel.append(title,help,details,retry);
  }
  window.LanguiniStartup=window.RuneBistroStartup={ready:function(){if(state==='failed')return false;state='ready';clearTimeout(timer);return true;},fail:fail};
  window.addEventListener('error',function(event){
    if(state!=='loading')return;
    if(event.target&&event.target.tagName==='SCRIPT')fail('A game file could not be opened. Please extract all files before playing.');
    else if(event.error||event.message)fail(event.error||event.message);
  },true);
  window.addEventListener('unhandledrejection',function(event){if(state==='loading')fail(event.reason);});
  timer=setTimeout(function(){fail('Starting took too long. Reload the extracted index.html file.');},15000);
}());
