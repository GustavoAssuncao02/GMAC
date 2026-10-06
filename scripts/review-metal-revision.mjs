import { pathToFileURL } from 'node:url'
import { mkdirSync,writeFileSync } from 'node:fs'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser=await chromium.launch({channel:'msedge',headless:true})
const page=await browser.newPage({viewport:{width:1440,height:1000}})
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'})
await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.querySelector('#transformacao').offsetTop)})
await page.waitForSelector('.metal-stage[data-ready="true"]',{timeout:60000})
mkdirSync('artifacts/revision',{recursive:true})
for(const [step,phase,label] of [[3,.15,'bend-approach'],[3,.3,'bend-contact'],[3,.6,'bend-force'],[4,.7,'welding'],[6,1,'finish'],[8,1,'quality'],[9,1,'final']]){
 await page.evaluate(([s,p])=>window.__METALURGICA_SCROLL__.setStepPhase(s,p),[step,phase]);await page.screenshot({path:`artifacts/revision/${label}.png`})
}
const cta=page.locator('.metal-cta');console.log('CTA',await cta.evaluate(el=>{const r=el.getBoundingClientRect();return {rect:r.toJSON(),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML,style:getComputedStyle(el).pointerEvents}}))
await cta.click();await page.waitForTimeout(1600);console.log('afterCTA',await page.evaluate(()=>({y:scrollY,hash:location.hash,target:document.querySelector('#orcamento').getBoundingClientRect().top})))
console.log('errors',errors);writeFileSync('artifacts/revision/errors.json',JSON.stringify(errors,null,2));await browser.close()
