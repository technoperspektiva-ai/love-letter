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
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'horizontal overflow');
}
async function step(page, key) {
  await page.waitForFunction(key => document.getElementById('mobileWizard')?.dataset.step === key, key);
}
try {
  for (const width of [320,390,430,1440]) {
    const context = await browser.newContext({viewport:{width,height:900}, hasTouch:width<900, serviceWorkers:'block'});
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.locator('.magic-home').waitFor();
    assert.equal(await page.locator('.magic-draft').count(),0,'no fake initial draft');
    assert.equal(await page.locator('.home-stats-panel').count(),0);
    await noOverflow(page);
    await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true,animations:'disabled'});
    await page.locator('#magicDemoBtn').click();
    await page.locator('.magic-demo-envelope').click();
    await page.locator('.magic-dialog .paper').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('.magic-dialog').waitFor({state:'detached'});
    assert.equal(await page.locator('#magicDemoBtn').evaluate(el=>el===document.activeElement),true,'dialog restores focus');
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
    assert.match(await page.locator('.magic-review-paper .paper .to').textContent(),/Олексій/,'no old sample name');
    await noOverflow(page);
    await page.screenshot({path:`test-results/review-${width}.png`,fullPage:true,animations:'disabled'});
    await page.locator('#magicReviewOpen').click();
    await page.locator('.magic-demo-envelope').click();
    await page.locator('.magic-dialog .paper').waitFor();
    assert.match(await page.locator('.magic-dialog .msg').textContent(),/<script>neverExecute/);
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
      await page.route('**/api/story',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Немає зв’язку. Спробуй ще раз.'})}));
      await page.locator('#mwNextBtn').click();
      await page.waitForFunction(()=>!document.getElementById('mwNextBtn').disabled);
      assert.equal(await page.locator('#mobileWizard').getAttribute('data-step'),'review','failed publish preserves review');
      assert.equal(await page.locator('.ma-ready').count(),0);
      assert.ok(await page.evaluate(()=>localStorage.getItem(DRAFT_KEY)),'draft retained after failed publish');
      await page.unroute('**/api/story');
    }
    const createResponse = page.waitForResponse(r=>r.url()===base+'/api/story' && r.request().method()==='POST');
    await page.locator('#mwNextBtn').click();
    const created = await (await createResponse).json();
    assert.ok(created.id);
    published.push(created);
    await page.locator('.ma-ready').waitFor();
    assert.equal(await page.locator('#maReadyCopy').count(),1);
    const recipientContext = await browser.newContext({viewport:{width,height:900}, serviceWorkers:'block'});
    const recipient = await recipientContext.newPage();
    recipient.on('pageerror', error=>errors.push(error.message));
    await recipient.goto(base+created.path);
    await recipient.locator('#toEnvelopeBtn').click();
    await recipient.locator('#envBtn').click();
    await recipient.locator('#toChoicesBtn').waitFor();
    assert.match(await recipient.locator('#storyStage .msg').textContent(),/Ти робиш цей світ/);
    await noOverflow(recipient);
    await recipient.screenshot({path:`test-results/recipient-${width}.png`,fullPage:true,animations:'disabled'});
    await recipient.locator('#toChoicesBtn').click();
    await recipient.locator('.recipient-choice-card').first().click();
    await recipient.locator('.recipient-final-card').waitFor();
    assert.equal(await recipient.locator('.recipient-final-time').count(),0,'no stale sample time');
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
    await context.close();
    console.log(`PASS ${width}px: home, demo, validation, draft restore, three steps, optional settings, publish, recipient, final`);
  }
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
  await offlinePage.locator('.magic-dialog .paper').waitFor();
  assert.equal(await offlinePage.evaluate(()=>typeof window.LetterMagic.preview),'function');
  assert.equal(await offlinePage.locator('.magic-home').evaluate(el=>getComputedStyle(el).color),'rgb(87, 32, 57)');
  await offlineContext.close();
  console.log('PASS offline app shell, styles and demo');
  assert.deepEqual(errors,[],'no browser exceptions');
} finally {
  await browser.close();
  for (const item of published) {
    await fetch(base+`/api/story/${item.id}`, {method:'DELETE',headers:{'x-edit-token':item.editKey}});
  }
}
