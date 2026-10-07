import { pathToFileURL } from 'node:url'
import { mkdirSync,writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const {chromium}=await import(pathToFileURL(process.argv[2]).href)
const browser=await chromium.launch({channel:'msedge',headless:true})
mkdirSync('artifacts/laser-cut',{recursive:true})
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'})
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.querySelector('#transformacao').offsetTop)})
 await page.waitForSelector('.metal-stage[data-ready="true"]',{timeout:60000})
 const canvas=page.locator('.metal-canvas')
 const at=async(step,phase)=>{await page.evaluate(([s,p])=>window.__METALURGICA_SCROLL__.setStepPhase(s,p),[step,phase]);return canvas.evaluate(el=>({...el.dataset,filter:el.style.filter}))}
 let d=await at(2,.05);assert.equal(d.laserSparks,'0');assert.equal(d.bloom,'0.000','beam stays off while the head descends')
 d=await at(2,.074);assert.ok(Number(d.laserFlash)>.05&&Number(d.laserBloom)>1,'pierce flare drives the bloom');assert.equal(d.filter,'')
 await page.screenshot({path:'artifacts/laser-cut/pierce.png'})
 d=await at(2,.3);assert.equal(d.filter,'');assert.ok(Number(d.laserSparks)>60&&Number(d.laserFumes)>0&&Number(d.bloom)>.5)
 await page.screenshot({path:'artifacts/laser-cut/outline.png'})
 await page.waitForTimeout(250);const reference=await canvas.screenshot()
 d=await at(2,.4408);assert.equal(d.bloom,'0.000');assert.ok(Number(d.laserSparks)>0,'beam off between contours, sparks keep falling')
 d=await at(2,.455);assert.ok(Number(d.laserFlash)>.05,'each contour starts with a pierce')
 await page.screenshot({path:'artifacts/laser-cut/bore.png'})
 d=await at(2,.82);assert.equal(d.bloom,'0.000');assert.ok(Number(d.laserSparks)>0,'residual sparks outlive the beam')
 await at(2,.3);await page.waitForTimeout(100)
 // HDR bloom may differ by one 8-bit level between identical frames; anything larger is a real change.
 const maxDifference=await page.evaluate(async images=>{
  const [a,b]=await Promise.all(images.map(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.src='data:image/png;base64,'+src})))
  const context=new OffscreenCanvas(a.width,a.height).getContext('2d')
  context.drawImage(a,0,0);const first=context.getImageData(0,0,a.width,a.height).data
  context.clearRect(0,0,a.width,a.height);context.drawImage(b,0,0);const second=context.getImageData(0,0,a.width,a.height).data
  let max=0;for(let i=0;i<first.length;i++)max=Math.max(max,Math.abs(first[i]-second[i]));return max
 },[reference.toString('base64'),(await canvas.screenshot()).toString('base64')])
 assert.ok(maxDifference<=2,`seeking backward reproduces the same cut (max difference ${maxDifference})`)
 for(const step of [1,2,3,4,9]) { d=await at(step,1);assert.equal(d.laserSparks,'0');assert.equal(d.laserFumes,'0');assert.equal(d.laserFlash,'0.0000') }
 // Profile the complete live operation, including every pierce.
 await page.evaluate(()=>{
  const canvas=document.querySelector('.metal-canvas')
  window.__LASER_PROFILE__={start:performance.now(),first:Number(canvas.dataset.renderCount),previous:performance.now(),deltas:[],running:true}
  const tick=now=>{const p=window.__LASER_PROFILE__;p.deltas.push(now-p.previous);p.previous=now;if(p.running)requestAnimationFrame(tick)}
  requestAnimationFrame(tick);document.querySelectorAll('.metal-step-nav button')[2].click()
 })
 await page.waitForFunction(()=>{const c=document.querySelector('.metal-canvas');return c.dataset.operation==='cut'&&c.dataset.operationPhase==='1.0000'})
 const report=await page.evaluate(()=>{
  const p=window.__LASER_PROFILE__;p.running=false
  return {fps:(Number(document.querySelector('.metal-canvas').dataset.renderCount)-p.first)*1000/(performance.now()-p.start),maxFrameGap:Math.max(...p.deltas.slice(2))}
 })
 assert.ok(report.fps>55&&report.fps<62,`full cutting sequence: ${report.fps} fps`)
 assert.ok(report.maxFrameGap<100,'no long frame freeze at the pierce')
 const stopped=await canvas.getAttribute('data-render-count');await page.waitForTimeout(300);assert.equal(await canvas.getAttribute('data-render-count'),stopped)
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,document.querySelector('#transformacao').offsetTop));await at(2,.3)
 await page.screenshot({path:'artifacts/laser-cut/mobile.png'})
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150)
 assert.equal(await canvas.getAttribute('data-laser-sparks'),'0')
 assert.deepEqual(errors,[])
 writeFileSync('artifacts/laser-cut/report.json',JSON.stringify({...report,errors},null,2))
 console.log('PASS: pierce flare, hot kerf, sparks and dross, beam off between contours, residual particles, repeatable seek, HDR bloom, resting frame, mobile, reduced motion.',report)
}finally{await browser.close()}
