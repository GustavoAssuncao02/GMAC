import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel:'msedge', headless:true })
mkdirSync('artifacts/revision',{recursive:true})
const errors=[],report={}
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'})
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.querySelector('#transformacao').offsetTop)})
 await page.waitForSelector('.metal-stage[data-ready="true"]',{timeout:60000})
 const nav=page.locator('.metal-step-nav button'),canvas=page.locator('.metal-canvas')
 const data=()=>canvas.evaluate(el=>({...el.dataset}))
 const at=async(step,phase)=>{await page.evaluate(([s,p])=>window.__METALURGICA_SCROLL__.setStepPhase(s,p),[step,phase]);await page.waitForTimeout(80)}
 await nav.nth(2).click();await page.waitForTimeout(500)
 assert.ok(Number((await data()).operationPhase)<.5)
 await page.mouse.wheel(0,120);await page.waitForTimeout(100)
 assert.equal((await data()).operation,'bend','wheel skips unfinished cut')
 await page.waitForTimeout(400);await page.mouse.wheel(0,120);await page.waitForTimeout(100)
 assert.equal((await data()).operation,'weld','wheel skips unfinished bend')
 report.skipping=true
 await nav.nth(8).click();await page.waitForTimeout(450)
 await page.mouse.wheel(0,140);await page.waitForTimeout(70)
 const finalY=await page.evaluate(()=>scrollY)
 for(let i=0;i<12;i++){await page.mouse.wheel(0,650);await page.waitForTimeout(100)}
 assert.ok(Math.abs((await page.evaluate(()=>scrollY))-finalY)<3,'fast scroll cannot leave final animation')
 for(let i=0;i<7;i++){await page.mouse.wheel(0,120);await page.waitForTimeout(90)}
 assert.ok(Math.abs((await page.evaluate(()=>scrollY))-finalY)<3,'same inertial gesture stays held after animation')
 await page.waitForTimeout(260);await page.mouse.wheel(0,400);await page.waitForTimeout(150)
 assert.ok(await page.evaluate(y=>scrollY>y+20,finalY),'fresh gesture leaves completed final')
 report.finalGuard=true
 await nav.nth(9).evaluate(el=>el.click());await page.waitForTimeout(100)
 // Link must work during the protected intro too, without waiting for animation end.
 await page.locator('.metal-cta').click();await page.waitForTimeout(400)
 assert.equal(await page.evaluate(()=>location.hash),'#orcamento')
 assert.ok(Math.abs(await page.locator('#orcamento').evaluate(el=>el.getBoundingClientRect().top))<100)
 report.contactCTA=true
 // No GPU frames are scheduled while outside the 3D section.
 const stopped=Number((await data()).renderCount);await page.waitForTimeout(400)
 assert.equal(Number((await data()).renderCount),stopped)
 await nav.nth(2).evaluate(el=>el.click());await page.waitForTimeout(250)
 const begin=Number((await data()).renderCount),start=Date.now();await page.waitForTimeout(2000)
 const fps=(Number((await data()).renderCount)-begin)/((Date.now()-start)/1000)
 assert.ok(fps>=55&&fps<=62,`60 fps budget: ${fps}`);report.fps=fps
 await page.waitForFunction(()=>document.querySelector('.metal-canvas').dataset.operationPhase==='1.0000')
 const resting=Number((await data()).renderCount);await page.waitForTimeout(300)
 assert.equal(Number((await data()).renderCount),resting,'no continuous rendering at rest')
 await at(3,.15);const a=await data();await at(3,.30);const b=await data();await at(3,.6);const c=await data()
 assert.equal(a.bendAngle,b.bendAngle,'no deformation during approach')
 assert.ok(Number(a.pressGap)>.2&&Number(b.pressGap)===0,'tools arrive before deformation')
 assert.ok(Number(c.pressGap)===0&&Number(c.bendAngle)<Number(b.bendAngle),'force remains applied throughout bending')
 report.bending=true
 for(const [step,phase,label] of [[3,.15,'bend-approach'],[3,.3,'bend-contact'],[3,.6,'bend-force'],[4,.7,'welding'],[6,1,'finish'],[8,1,'quality'],[9,1,'final']]){
  await at(step,phase);await page.screenshot({path:`artifacts/revision/${label}.png`})
 }
 await at(8,1);assert.equal(await page.locator('.metal-quality-list li[data-status="verified"]').count(),6)
 await at(9,1);assert.equal((await data()).boltCount,'4')
 // Inspect all requested photograph sections and make sure real assets decode.
 for(const id of ['gmac','servicos']){
  await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(900)
  const photos=await page.locator(`#${id} img`).evaluateAll(nodes=>nodes.map(n=>({src:n.currentSrc,ok:n.complete&&n.naturalWidth>0})))
  assert.ok(photos.every(p=>p.src.includes('/gmac-real/')&&p.ok));await page.screenshot({path:`artifacts/revision/photos-${id}.png`})
 }
 const gallery=page.getByRole('heading',{name:'PORTFÓLIO INDUSTRIAL EM DETALHE'});await gallery.scrollIntoViewIfNeeded();await page.waitForTimeout(900)
 await page.screenshot({path:'artifacts/revision/photos-gallery.png'})
 report.realPhotos=true
 // Mobile: touch can skip, final gesture is held, contact remains clickable.
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true})
 await mobile.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'})
 await mobile.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.querySelector('#transformacao').offsetTop)})
 await mobile.waitForSelector('.metal-stage[data-ready="true"]',{timeout:60000})
 await mobile.locator('.metal-step-nav button').nth(2).tap();await mobile.waitForTimeout(400)
 const cdp=await mobile.context().newCDPSession(mobile)
 const swipe=async()=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:650}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y:480}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 await swipe();await mobile.waitForTimeout(100)
 assert.equal(await mobile.locator('.metal-canvas').getAttribute('data-operation'),'bend')
 await mobile.locator('.metal-step-nav button').nth(9).tap();await mobile.waitForTimeout(100)
 const y=await mobile.evaluate(()=>scrollY);await swipe();await mobile.waitForTimeout(200)
 assert.ok(Math.abs((await mobile.evaluate(()=>scrollY))-y)<3)
 await mobile.waitForTimeout(1400);await mobile.screenshot({path:'artifacts/revision/final-mobile.png'})
 await mobile.locator('.metal-cta').tap();await mobile.waitForTimeout(600)
 assert.equal(await mobile.evaluate(()=>location.hash),'#orcamento')
 assert.ok(Math.abs(await mobile.locator('#orcamento').evaluate(el=>el.getBoundingClientRect().top))<100)
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 report.mobile=true
 assert.deepEqual(errors,[]);report.errors=errors
 console.log('PASS',report)
 writeFileSync('artifacts/revision/report.json',JSON.stringify(report,null,2))
} finally {await browser.close()}
