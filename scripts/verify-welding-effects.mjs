import { pathToFileURL } from 'node:url'
import { mkdirSync,writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const {chromium}=await import(pathToFileURL(process.argv[2]).href)
const browser=await chromium.launch({channel:'msedge',headless:true})
mkdirSync('artifacts/cinematic-weld',{recursive:true})
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'})
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.querySelector('#transformacao').offsetTop)})
 await page.waitForSelector('.metal-stage[data-ready="true"]',{timeout:60000})
 const canvas=page.locator('.metal-canvas')
 const at=async(step,phase)=>{await page.evaluate(([s,p])=>window.__METALURGICA_SCROLL__.setStepPhase(s,p),[step,phase]);return canvas.evaluate(el=>({...el.dataset,filter:el.style.filter}))}
 let d=await at(4,.27);assert.equal(d.weldSparks,'0');assert.equal(d.bloom,'0.000')
 d=await at(4,.3065);assert.ok(Number(d.weldFlash)>.05&&Number(d.weldBlur)>.1);assert.match(d.filter,/blur/)
 await page.screenshot({path:'artifacts/cinematic-weld/ignition.png'})
 d=await at(4,.43);assert.equal(d.filter,'none');assert.ok(Number(d.weldSparks)>60&&Number(d.weldSmoke)>0)
 await page.waitForTimeout(250);const reference=await canvas.screenshot()
 d=await at(4,.595);assert.equal(d.bloom,'0.000');assert.ok(Number(d.weldSmoke)>0,'only residual smoke and sparks during retraction')
 d=await at(4,.7);assert.ok(Number(d.bloom)>.5);assert.equal(d.filter,'none')
 await page.screenshot({path:'artifacts/cinematic-weld/second-pass.png'})
 d=await at(4,.94);assert.equal(d.bloom,'0.000');assert.ok(Number(d.weldSparks)>0&&Number(d.weldSmoke)>0,'residual effects outlive the arc')
 await at(4,.43);await page.waitForTimeout(100);assert.ok(reference.equals(await canvas.screenshot()),'seeking backward reproduces the same effect')
 for(const step of [4,5,8,9]) { d=await at(step,1);assert.equal(d.filter,'none');assert.equal(d.weldSparks,'0');assert.equal(d.weldSmoke,'0');assert.equal(d.weldFlash,'0.0000') }
 // Profile the complete live operation, including both ignition focus responses.
 await page.evaluate(()=>{
  const canvas=document.querySelector('.metal-canvas')
  window.__WELD_PROFILE__={start:performance.now(),first:Number(canvas.dataset.renderCount),previous:performance.now(),deltas:[],running:true}
  const tick=now=>{const p=window.__WELD_PROFILE__;p.deltas.push(now-p.previous);p.previous=now;if(p.running)requestAnimationFrame(tick)}
  requestAnimationFrame(tick);document.querySelectorAll('.metal-step-nav button')[4].click()
 })
 await page.waitForFunction(()=>{const c=document.querySelector('.metal-canvas');return c.dataset.operation==='weld'&&c.dataset.operationPhase==='1.0000'})
 const report=await page.evaluate(()=>{
  const p=window.__WELD_PROFILE__;p.running=false
  return {fps:(Number(document.querySelector('.metal-canvas').dataset.renderCount)-p.first)*1000/(performance.now()-p.start),maxFrameGap:Math.max(...p.deltas.slice(2))}
 })
 assert.ok(report.fps>55&&report.fps<62,`full welding sequence: ${report.fps} fps`)
 assert.ok(report.maxFrameGap<100,'no long frame freeze at ignition')
 const stopped=await canvas.getAttribute('data-render-count');await page.waitForTimeout(300);assert.equal(await canvas.getAttribute('data-render-count'),stopped)
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,document.querySelector('#transformacao').offsetTop));await at(4,.43)
 await page.screenshot({path:'artifacts/cinematic-weld/mobile.png'})
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150)
 assert.equal(await canvas.getAttribute('data-weld-sparks'),'0');assert.equal(await canvas.evaluate(el=>el.style.filter),'none')
 assert.deepEqual(errors,[])
 writeFileSync('artifacts/cinematic-weld/report.json',JSON.stringify({...report,errors},null,2))
 console.log('PASS: ignition, blue/white arc, two passes, residual particles, repeatable seek, focus recovery, resting frame, mobile, reduced motion.',report)
}finally{await browser.close()}
