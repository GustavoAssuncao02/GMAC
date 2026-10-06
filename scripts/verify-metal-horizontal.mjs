import { pathToFileURL } from 'node:url'
import { mkdirSync } from 'node:fs'
import assert from 'node:assert/strict'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({channel:'msedge',headless:true})
mkdirSync('artifacts/horizontal',{recursive:true})
try {
 for (const mobile of [false,true]) {
  const context = await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile,isMobile:mobile})
  const page = await context.newPage(); const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'})
  await page.screenshot({path:`artifacts/horizontal/hero-${mobile}.png`})
  assert.ok(await page.locator('#inicio img').evaluate(el=>el.complete && el.naturalWidth>0 && el.src.endsWith('hero-soldagem.jpeg')))
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.querySelector('#transformacao').offsetTop)})
  await page.waitForSelector('.metal-stage[data-ready="true"]',{timeout:60000})
  const stage=page.locator('.metal-stage'); const next=page.locator('.metal-arrows button').nth(1); const prev=page.locator('.metal-arrows button').nth(0)
  const step=async n=>assert.equal(await stage.getAttribute('data-step'),String(n))
  await step(0);assert.ok(await prev.isDisabled())
  const y=await page.evaluate(()=>scrollY)
  await next.click();await page.waitForTimeout(100);await step(1)
  assert.equal(await page.evaluate(()=>scrollY),y)
  const box=await stage.boundingBox()
  if(mobile){
   const cdp=await context.newCDPSession(page)
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:550}]})
   for(let x=280;x>=100;x-=30) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:550}]})
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  }else{
   await page.mouse.move(box.x+box.width*.8,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.55,box.y+box.height*.55,{steps:10});await page.mouse.up()
  }
  await page.waitForTimeout(100);await step(2)
  await page.evaluate(()=>window.__METALURGICA_SCROLL__.setStepPhase(2,1))
  await page.screenshot({path:`artifacts/horizontal/cut-${mobile}.png`})
  await page.evaluate(()=>window.__METALURGICA_SCROLL__.clearOverride())
  await stage.focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(100);await step(1)
  await page.locator('.metal-step-nav button').last().click();await page.waitForTimeout(1700);await step(9);assert.ok(await next.isDisabled())
  await page.screenshot({path:`artifacts/horizontal/final-${mobile}.png`})
  await page.locator('.metal-step-nav button').nth(3).click();await page.waitForTimeout(100)
  await page.mouse.move(200,500);await page.mouse.wheel(0,350);await page.waitForTimeout(250)
  await step(3);assert.ok(await page.evaluate(()=>scrollY)>y+100)
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  assert.deepEqual(errors,[])
  console.log(`${mobile?'Mobile touch':'Desktop'}: arrows, drag, keyboard, bounds, native scroll and images passed`)
  await context.close()
 }
}finally{await browser.close()}
