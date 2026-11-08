/* Mobile dock back navigation for the public storefront. */
(function(){
  'use strict';
  const pages=new Set(['index.html','catalogo.html','richieste.html']);
  const key='cd_public_nav_stack_v1';
  const current=location.pathname.split('/').pop()||'index.html';
  if(!pages.has(current))return;
  function getStack(){try{const a=JSON.parse(sessionStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(x=>pages.has(x)).slice(-30):[]}catch(_){return []}}
  function setStack(a){try{sessionStorage.setItem(key,JSON.stringify(a.slice(-30)))}catch(_){}}
  let stack=getStack();
  if(stack[stack.length-1]!==current){stack.push(current);setStack(stack)}
  function isHome(){return current==='index.html'}
  function exitStorefront(){
    if(!confirm('Vuoi chiudere la vetrina?'))return;
    /* Browsers may refuse to close a tab not opened by script. */
    window.close();
    if(document.visibilityState==='visible'){
      const app=matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
      if(app){alert('La chiusura automatica non è supportata su questo dispositivo. Torna alla Home del telefono per uscire.')}
      else{alert('Il browser non consente di chiudere automaticamente questa scheda. Puoi chiuderla dal menu delle schede.')}
    }
  }
  function goBack(){
    const lightbox=document.getElementById('photoLightbox');
    if(lightbox&&!lightbox.hidden){const close=lightbox.querySelector('.zoom-close');if(close)close.click();else lightbox.hidden=true;return}
    const overlay=document.getElementById('overlay');
    if(overlay&&!overlay.classList.contains('hidden')){
      const close=document.getElementById('close');if(close)close.click();
      else{overlay.classList.add('hidden');document.body.style.overflow=''}
      return;
    }
    if(isHome()){exitStorefront();return}
    let a=getStack();
    if(a[a.length-1]===current)a.pop();
    const destination=a.pop()||'index.html';
    a.push(destination);setStack(a);
    location.href=destination;
  }
  document.querySelectorAll('.cd-back-button').forEach(button=>button.addEventListener('click',goBack));
})();
