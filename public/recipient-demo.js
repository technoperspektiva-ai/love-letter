
/* Love Letter 2.1.4 — recipient Demo enhancer */
(() => {
  const sync = () => {
    if(!document.body.classList.contains('story-open')) return;
    const stage = document.querySelector('#storyStage');
    if(!stage) return;
    if(stage.dataset.storyStep === '2'){
      const btn = stage.querySelector('#envBtn');
      const env = stage.querySelector('.recipient-envelope');
      if(btn) btn.setAttribute('aria-label','Торкнись, щоб відкрити лист');
      if(env) env.setAttribute('aria-hidden','false');
    }
  };
  const start = () => {
    sync();
    const root = document.querySelector('#storyView');
    if(root) new MutationObserver(sync).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-story-step','class']});
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
