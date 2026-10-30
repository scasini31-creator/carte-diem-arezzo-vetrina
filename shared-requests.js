
const reqKey='carte-diem-richieste-v1';
function getRequests(){try{return JSON.parse(localStorage.getItem(reqKey)||'[]')}catch(e){return []}}
function setRequests(v){localStorage.setItem(reqKey,JSON.stringify(v));updateRequestCount();if(typeof renderRequests==='function')renderRequests()}
function updateRequestCount(){document.querySelectorAll('.request-count').forEach(e=>e.textContent=getRequests().length)}
function toggleRequest(i){const a=getRequests();setRequests(a.includes(i)?a.filter(x=>x!==i):[...a,i]);if(typeof updateDetailRequest==='function')updateDetailRequest()}
window.addEventListener('storage',updateRequestCount);document.addEventListener('DOMContentLoaded',updateRequestCount);
