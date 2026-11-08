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
  function ensureMobileDock(){
    const nav=document.querySelector('nav.mobile-dock');
    if(!nav||!matchMedia('(max-width:800px)').matches)return;
    const important=(el,prop,value)=>el.style.setProperty(prop,value,'important');
    important(nav,'display','grid');
    important(nav,'grid-template-columns','repeat(4,minmax(0,1fr))');
    important(nav,'position','fixed');
    important(nav,'bottom','0');
    important(nav,'left','0');
    important(nav,'right','0');
    important(nav,'width','100%');
    important(nav,'z-index','90');
    important(nav,'background','#090b14f7');
    important(nav,'border-top','1px solid #b48b50');
    important(nav,'padding','6px 8px max(6px,env(safe-area-inset-bottom))');
    important(nav,'box-sizing','border-box');
    nav.querySelectorAll('a,button.cd-back-button').forEach(el=>{
      important(el,'display','flex');
      important(el,'flex-direction','column');
      important(el,'align-items','center');
      important(el,'justify-content','center');
      important(el,'gap','3px');
      important(el,'width','100%');
      important(el,'min-width','0');
      important(el,'min-height','49px');
      important(el,'padding','0');
      important(el,'margin','0');
      important(el,'border','0');
      important(el,'border-radius','0');
      important(el,'background','transparent');
      important(el,'color',el.classList.contains('active')?'#ffd05e':'#f3f4fa');
      important(el,'font','400 10px/1.2 Arial,sans-serif');
      important(el,'text-decoration','none');
      el.querySelectorAll('span').forEach(icon=>{
        important(icon,'display','block');
        important(icon,'font','400 24px/1 Arial,sans-serif');
      });
    });
    important(document.body,'padding-bottom','calc(65px + env(safe-area-inset-bottom))');
  }
  ensureMobileDock();
  window.addEventListener('resize',ensureMobileDock);
  document.querySelectorAll('.cd-back-button').forEach(button=>button.addEventListener('click',goBack));
})();
