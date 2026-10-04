// Apply shared preferences before the first paint. Learning records are untouched.
(() => {
 const root=document.documentElement;
 const read=(key,active,fallback)=>{try{return localStorage.getItem(key)===active?active:fallback;}catch{return fallback;}};
 root.dataset.theme=read('travel-lab-theme','dark','light');
 root.dataset.size=read('travel-lab-text-size','large','standard');
 root.dataset.textSize=root.dataset.size;
})();
