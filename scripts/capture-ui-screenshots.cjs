"use strict";
// Capture the actual Electron-rendered customer UI on a GitHub-hosted Windows runner.
// Read-only: this process does not modify game logic or save files.
const {app,BrowserWindow}=require("electron");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const out=path.join(root,"ui-review-screenshots");
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function capture(width,height){
  const win=new BrowserWindow({width,height,useContentSize:true,show:true,
    backgroundColor:"#142027",autoHideMenuBar:true,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  win.webContents.setWindowOpenHandler(()=>({action:"deny"}));
  try{
    await win.loadFile(path.join(root,"index.html"));
    await pause(650);
    const state=await win.webContents.executeJavaScript(
      "({title:document.title,ready:document.readyState,caseText:(document.querySelector('#case')?.textContent||'').trim().length,bodyWidth:document.body.scrollWidth,viewportWidth:innerWidth})");
    if(state.ready!=="complete"||state.caseText===0)throw Error("Main case did not render: "+JSON.stringify(state));
    const key=width+"x"+height;
    const top=await win.webContents.capturePage();
    if(top.isEmpty())throw Error("Empty screenshot: "+key);
    fs.writeFileSync(path.join(out,"night-office-"+key+"-top.png"),top.toPNG());
    await win.webContents.executeJavaScript("document.querySelector('.decision').scrollIntoView({block:'start',behavior:'instant'})");
    await pause(250);
    const lower=await win.webContents.capturePage();
    if(lower.isEmpty())throw Error("Empty decision screenshot: "+key);
    fs.writeFileSync(path.join(out,"night-office-"+key+"-decision.png"),lower.toPNG());
    return {size:key,...state};
  }finally{win.destroy();}
}
app.whenReady().then(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const summary=[];
  for(const [w,h] of [[1024,768],[1280,720]])summary.push(await capture(w,h));
  fs.writeFileSync(path.join(out,"UI_REVIEW_RESULT.json"),JSON.stringify({sourceCommit:process.env.GITHUB_SHA||null,mode:"real Windows Electron screenshot; not MSIX installation QA",screenshots:summary},null,2)+"\n");
  console.log("UI_SCREENSHOT_PASS "+JSON.stringify(summary));
  app.quit();
}).catch(error=>{console.error("UI_SCREENSHOT_FAIL",error?.stack||String(error));app.exit(1);});
