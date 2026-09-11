
/* Love Letter 2.1.3 — tiny recipient enhancer.
   It reuses the current main story renderer; only the Demo's presentation copy is normalized.
*/
(() => {
  const qs = (s, root=document) => root.querySelector(s);

  function syncDemoRecipient(){
    if(!document.body.classList.contains('story-open')) return;
    const stage = qs('#storyStage');
    if(!stage) return;

    const step = stage.dataset.storyStep;
    if(step === '2'){
      const envelope = qs('.recipient-envelope', stage);
      const note = qs('#envelopeNote', stage);
      if(envelope) envelope.setAttribute('aria-label','Торкнись, щоб відкрити лист');
      if(note && note.dataset.demoCopy !== '1'){
        note.dataset.demoCopy = '1';
        note.setAttribute('aria-label','Торкнись, щоб відкрити');
      }
    }
  }

  const observer = new MutationObserver(syncDemoRecipient);
  const start = () => {
    syncDemoRecipient();
    const story = qs('#storyView');
    if(story) observer.observe(story,{subtree:true,childList:true,attributes:true,attributeFilter:['data-story-step','class']});
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
