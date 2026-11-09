/* Layout della navigazione smartphone: Home, Catalogo e Lista. */
(function(){
  'use strict';
  function ensureMobileDock(){
    const nav=document.querySelector('nav.mobile-dock');
    if(!nav||!matchMedia('(max-width:800px)').matches)return;
    const important=(el,prop,value)=>el.style.setProperty(prop,value,'important');
    important(nav,'display','grid');
    important(nav,'grid-template-columns','repeat(3,minmax(0,1fr))');
    important(nav,'position','fixed');
    important(nav,'bottom','0');
    important(nav,'left','0');
    important(nav,'right','0');
    important(nav,'width','100%');
    important(nav,'z-index','90');
    important(nav,'background','#090b14f7');
    important(nav,'border-top','1px solid #b48b50');
    important(nav,'padding','6px 8px calc(6px + env(safe-area-inset-bottom, 0px))');
    important(nav,'box-sizing','border-box');
    nav.querySelectorAll('a').forEach(el=>{
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
    important(document.body,'padding-bottom','calc(72px + env(safe-area-inset-bottom, 0px))');
  }

  ensureMobileDock();
  window.addEventListener('resize',ensureMobileDock);
})();
