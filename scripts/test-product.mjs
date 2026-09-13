// Start `npm run dev` first. Uses installed Microsoft Edge with isolated profiles.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8787';
await mkdir('test-results', { recursive:true });
const browser = await chromium.launch({ channel:'msedge', headless:true });
const published = [];
const errors = [];
browser.on('context',()=>{});
function watch(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});}
async function capture(page,name,width){await noOverflow(page);await page.screenshot({path:`test-results/${name}-${width}.png`,fullPage:true,animations:'disabled'});}
async function motionStyle(page,selector,name){const style=await page.locator(selector).evaluate(e=>({name:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}));assert.ok(style.name.includes(name),`${selector}: ${JSON.stringify(style)}`);assert.ok(parseFloat(style.duration)>0);return style;}

async function noOverflow(page) {
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(overflow){await page.screenshot({path:'test-results/overflow.png',fullPage:true});console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&e.getClientRects().length).map(e=>[e.tagName,e.className,e.id,e.getBoundingClientRect().right]).slice(0,20)));}
  assert.equal(overflow,false,'horizontal overflow');
}
async function step(page, key) {
  await page.waitForFunction(key => document.getElementById('mobileWizard')?.dataset.step === key, key);
}
try {
  for (const [width,height] of [[320,740],[390,844],[430,932],[768,1024],[1366,768],[1440,900],[1920,1080]]) {
    const context = await browser.newContext({viewport:{width,height}, hasTouch:width<900, serviceWorkers:'block'});
    const page = await context.newPage();
    watch(page);
    await page.goto(base);
    await page.locator('.magic-home').waitFor();
    assert.equal(await page.locator('.magic-draft').count(),0,'no fake initial draft');
    assert.equal(await page.locator('.home-stats-panel').count(),0);
    await noOverflow(page);
    await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true,animations:'disabled'});
    await page.locator('#magicDemoBtn').click();
    await page.locator('.magic-demo-envelope').click();
    await page.locator('.magic-dialog .rs-paper').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('.magic-dialog').waitFor({state:'detached'});
    assert.equal(await page.locator('#magicDemoBtn').evaluate(el=>el===document.activeElement),true,'dialog restores focus');
    for(const route of ['library','ideas']){await page.locator('[data-app-route="'+route+'"]').click();await noOverflow(page);await page.screenshot({path:'test-results/'+route+'-'+width+'.png',fullPage:true,animations:'disabled'});}
    await page.locator('#maSettingsBtn').click();await noOverflow(page);await page.screenshot({path:'test-results/settings-'+width+'.png',fullPage:true,animations:'disabled'});
    await page.locator('[data-app-route="home"]').click();
    await page.locator('#maStartBtn').click();
    await step(page,'basic');
    assert.equal(await page.locator('#mwCount').textContent(),'1 з 3');
    await page.locator('#mwNextBtn').click();
    await page.locator('.mw-inline-error').waitFor();
    await page.locator('#mwRecipient').fill('Олексій');
    await page.locator('#mwNextBtn').click();
    await step(page,'letter');
    assert.equal(await page.locator('#mwCount').textContent(),'2 з 3');
    await page.locator('#mwLetterTitle').fill('Трохи магії для тебе');
    await page.locator('#mwLetterMessage').fill('Ти робиш цей світ теплішим.\nДякую, що поруч. <script>neverExecute()</script>');
    await page.locator('#mwLetterSign').fill('З ніжністю');
    await page.locator('.magic-font-options summary').click();
    await page.locator('[data-letter-font="handwritten"]').click();
    assert.match(await page.locator('#magicSaveStatus').textContent(),/збережено/);
    await noOverflow(page);
    await page.reload();
    await step(page,'letter');
    assert.match(await page.locator('#mwLetterMessage').inputValue(),/Ти робиш/,'draft restored with step');
    assert.equal(await page.evaluate(()=>document.getElementById('letterFont').value),'handwritten','font restored');
    await page.locator('#mwNextBtn').click();
    await step(page,'review');
    assert.equal(await page.locator('#mwCount').textContent(),'3 з 3');
    assert.match(await page.locator('.magic-review-paper .rs-to').textContent(),/Олексій/,'no old sample name');
    await noOverflow(page);
    await page.screenshot({path:`test-results/review-${width}.png`,fullPage:true,animations:'disabled'});
    await page.locator('#magicReviewOpen').click();
    await page.locator('.magic-demo-envelope').click();
    await page.locator('.magic-dialog .rs-paper').waitFor();
    assert.match(await page.locator('.magic-dialog .rs-message').textContent(),/<script>neverExecute/);
    await page.keyboard.press('Escape');
    // Optional settings remain reachable, without forcing the long wizard.
    await page.locator('.magic-customize summary').click();
    await page.locator('[data-magic-step="first"]').click();
    await step(page,'first');
    await page.locator('#mwIntroMain').fill('Маленьке диво');
    await page.locator('.magic-return-review').click();
    await step(page,'review');
    if(width===390){
      await page.locator('.magic-customize summary').click();
      await page.locator('[data-magic-step="secret"]').click();
      await step(page,'secret');
      await page.locator('[data-secret="on"]').click();
      await page.locator('.magic-return-review').click();
      assert.equal(await page.locator('#mobileWizard').getAttribute('data-step'),'secret','empty secret cannot be skipped');
      await page.locator('[data-secret="off"]').click();
      await page.locator('.magic-return-review').click();
      await step(page,'review');
      await page.route('**/api/story',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({message:'Немає зв’язку. Спробуй ще раз.'})}));
      await page.locator('#mwNextBtn').click();
      await page.waitForFunction(()=>!document.getElementById('mwNextBtn').disabled);
      assert.equal(await page.locator('#mobileWizard').getAttribute('data-step'),'review','failed publish preserves review');
      assert.equal(await page.locator('.ma-ready').count(),0);
      assert.ok(await page.evaluate(()=>localStorage.getItem(DRAFT_KEY)),'draft retained after failed publish');
      await page.unroute('**/api/story');
    }
    await page.locator('.magic-customize summary').click();
    await page.locator('[data-magic-step="secret"]').click();await step(page,'secret');
    await page.locator('[data-secret="on"]').click();await page.locator('#mwSecretQuestion').fill('Наше слово?');await page.locator('#mwSecretAnswer').fill('тепло');
    await capture(page,'create-secret',width);await page.locator('.magic-return-review').click();await step(page,'review');
    const createResponse = page.waitForResponse(r=>r.url()===base+'/api/story' && r.request().method()==='POST');
    await page.locator('#mwNextBtn').click();
    const created = await (await createResponse).json();
    assert.ok(created.id);
    published.push(created);
    await page.locator('.ma-ready').waitFor();
    assert.equal(await page.locator('#maReadyCopy').count(),1);
    await capture(page,'ready',width);
    const recipientContext = await browser.newContext({viewport:{width,height}, serviceWorkers:'block'});
    const recipient = await recipientContext.newPage();
    watch(recipient);
    await recipient.goto(base+created.path);
    await recipient.locator('#secretInput').waitFor();await capture(recipient,'recipient-secret',width);
    await recipient.locator('#secretInput').fill('wrong');await recipient.keyboard.press('Enter');assert.match(await recipient.locator('#secretError').textContent(),/Не те/);
    await recipient.locator('#secretInput').fill('тепло');await recipient.keyboard.press('Enter');await recipient.locator('#toEnvelopeBtn').waitFor();await capture(recipient,'recipient-intro',width);
    await recipient.locator('#toEnvelopeBtn').click();await capture(recipient,'recipient-envelope',width);
    await recipient.locator('#envBtn').click();
    await recipient.locator('#toChoicesBtn').waitFor();
    assert.match(await recipient.locator('#storyStage .rs-message').textContent(),/Ти робиш цей світ/);
    await noOverflow(recipient);
    await recipient.screenshot({path:`test-results/recipient-${width}.png`,fullPage:true,animations:'disabled'});
    await recipient.locator('#toChoicesBtn').click();
    await capture(recipient,'recipient-choices',width);
    await recipient.locator('.rs-choice').first().click();
    await recipient.locator('.rs-final-card').waitFor();
    await capture(recipient,'recipient-final',width);
    assert.equal(await recipient.locator('.rs-final-time').count(),0,'no stale sample time');
    await noOverflow(recipient);
    if(width===390){
      await recipient.goto(base+created.editPath);
      await recipient.locator('#toEnvelopeBtn').waitFor();
      assert.equal(new URL(recipient.url()).pathname,created.path,'legacy edit link resolves');
      assert.equal(await recipient.evaluate(id=>Boolean(localStorage.getItem(`love-letter-edit-${id}`)),created.id),true);
    }
    await recipientContext.close();
    await page.locator('#maReadyHome').click();
    await page.locator('.magic-recent').waitFor();
    assert.equal(await page.locator('.magic-draft').count(),0,'published draft cleared');
    await capture(page,'home-recent',width);
    await page.locator('[data-app-route=library]').click();await capture(page,'library-populated',width);
    await page.locator('[data-letter-menu]').first().click();await capture(page,'library-menu',width);await page.keyboard.press('Escape');
    assert.equal(await page.locator('#appSheet').getAttribute('aria-hidden'),'true');
    await context.close();
    console.log(`PASS ${width}px: home, demo, validation, draft restore, three steps, optional settings, publish, recipient, final`);
  }
  // MOTION QA: real running animations; never disable animations in these captures.
  const motionContext=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const mp=await motionContext.newPage();watch(mp);await mp.goto(base);await mp.locator('.magic-envelope').waitFor();
  await motionStyle(mp,'.magic-envelope','magic-float');await mp.screenshot({path:'test-results/motion-hero.png',fullPage:true});
  const fixture=published[0];const data=await(await fetch(base+'/api/story/'+fixture.id)).json();
  await mp.evaluate(({fixture,payload})=>{upsertLocalLetter({id:fixture.id,editKey:fixture.editKey,payload});renderAppHome();},{fixture,payload:data.payload});
  await mp.locator('.ma-letter-card').first().hover();await motionStyle(mp,'.ma-letter-card','archive-lift');await mp.waitForTimeout(500);await mp.screenshot({path:'test-results/motion-archive-end.png',fullPage:true});
  await mp.goto(base+fixture.path);await mp.locator('#secretInput').fill('тепло');await mp.locator('#secretOpenBtn').click();await mp.locator('#toEnvelopeBtn').click();await mp.locator('#envBtn').click();
  await motionStyle(mp,'.rs-envelope.is-opening','envelope-open');await mp.waitForTimeout(200);await mp.screenshot({path:'test-results/motion-opening.png'});
  await mp.locator('.rs-paper').waitFor();await motionStyle(mp,'.rs-paper','paper-unfold');await mp.waitForTimeout(1000);await noOverflow(mp);await mp.screenshot({path:'test-results/motion-paper-end.png',fullPage:true});
  await mp.locator('#toChoicesBtn').click();await mp.locator('.rs-choice').first().click();assert.equal(await mp.locator('.rs-choice.is-selected').getAttribute('aria-pressed'),'true');await mp.locator('.rs-final-card').waitFor();await mp.waitForTimeout(1000);await mp.screenshot({path:'test-results/motion-final-end.png',fullPage:true});
  await motionContext.close();console.log('PASS MOTION QA: hero, archive hover, envelope opening, paper unfold, final reveal');
  const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
  const page = await context.newPage();
  await page.goto(base);
  await page.locator('.magic-envelope').waitFor();
  assert.equal(await page.locator('.magic-envelope').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.locator('[data-magic-occasion="thanks"]').click();
  await step(page,'basic');
  await page.locator('#mwRecipient').fill('Мамо');
  await page.locator('#mwNextBtn').click();
  await step(page,'letter');
  assert.match(await page.locator('#mwLetterMessage').inputValue(),/Дякую/);
  assert.equal(await page.locator('.magic-particles i').count(),0);
  await context.close();
  console.log('PASS reduced motion and occasion starter');
  const storageContext=await browser.newContext({serviceWorkers:'block'});
  const storagePage=await storageContext.newPage();
  await storagePage.goto(base);
  await storagePage.locator('#maStartBtn').click();
  await storagePage.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError')};});
  await storagePage.locator('#mwRecipient').fill('Олена');
  assert.match(await storagePage.locator('#magicSaveStatus').textContent(),/Не вдалося зберегти/);
  await storageContext.close();
  console.log('PASS storage failure feedback');
  const offlineContext=await browser.newContext({viewport:{width:390,height:844}});
  const offlinePage=await offlineContext.newPage();
  await offlinePage.goto(base);
  await offlinePage.locator('.magic-home').waitFor();
  await offlinePage.evaluate(()=>navigator.serviceWorker.ready);
  await offlinePage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await offlineContext.setOffline(true);
  await offlinePage.reload();
  await offlinePage.locator('.magic-home').waitFor();
  await offlinePage.locator('#magicDemoBtn').click();
  await offlinePage.locator('.magic-demo-envelope').click();
  await offlinePage.locator('.magic-dialog .rs-paper').waitFor();
  assert.equal(await offlinePage.evaluate(()=>typeof window.LetterMagic.preview),'function');
  assert.equal(await offlinePage.locator('.magic-home').evaluate(el=>getComputedStyle(el).color),'rgb(80, 49, 63)');
  await offlineContext.close();
  console.log('PASS offline app shell, styles and demo');
  assert.deepEqual(errors,[],'no browser exceptions');
} finally {
  await browser.close();
  for (const item of published) {
    await fetch(base+`/api/story/${item.id}`, {method:'DELETE',headers:{'x-edit-token':item.editKey}});
  }
}
