"use strict";
// Capture the actual Electron-rendered customer UI on a GitHub-hosted Windows runner.
// Read-only: this process does not modify game logic or save files.
const {app,BrowserWindow}=require("electron");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const out=path.join(root,"ui-review-screenshots");
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// Keep Electron alive between the two viewport captures on Windows.
app.on("window-all-closed",()=>{});
async function capture(width,height){
  const win=new BrowserWindow({width,height,useContentSize:true,show:true,
    backgroundColor:"#142027",autoHideMenuBar:true,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  win.webContents.setWindowOpenHandler(()=>({action:"deny"}));
  const debuggerApi=win.webContents.debugger;
  try{
    await win.loadFile(path.join(root,"index.html"));
    // A hosted Windows desktop may clamp actual window width to 1008px. Emulate
    // the requested CSS viewport without changing global runner display settings.
    debuggerApi.attach("1.3");
    await debuggerApi.sendCommand("Page.enable");
    await debuggerApi.sendCommand("Emulation.setDeviceMetricsOverride",{
      width,height,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:height
    });
    await pause(500);
    const state=await win.webContents.executeJavaScript(
      "({title:document.title,ready:document.readyState,caseText:(document.querySelector('#case')?.textContent||'').trim().length,bodyWidth:document.body.scrollWidth,viewportWidth:innerWidth,viewportHeight:innerHeight,tab:globalThis.OperationTabs?.current()})");
    if(state.ready!=="complete"||state.caseText===0||state.viewportWidth!==width||state.viewportHeight!==height){
      throw Error("UI viewport/initial render mismatch: "+JSON.stringify(state));
    }
    const key=width+"x"+height;
    async function shot(name){
      const result=await debuggerApi.sendCommand("Page.captureScreenshot",{
        format:"png",captureBeyondViewport:true,
        clip:{x:0,y:0,width,height,scale:1}
      });
      const bytes=Buffer.from(result.data,"base64");
      if(bytes.length<1000||bytes.readUInt32BE(16)!==width||bytes.readUInt32BE(20)!==height){
        throw Error("Screenshot pixel dimensions mismatch "+key+" "+name);
      }
      fs.writeFileSync(path.join(out,"night-office-"+key+"-"+name+".png"),bytes);
    }
    await shot("top");
    const opened=await win.webContents.executeJavaScript(
      "globalThis.OperationTabs?.open('decision')===true");
    if(!opened)throw Error("Could not switch to the decision tab");
    await win.webContents.executeJavaScript(
      "document.querySelector('.decision').scrollIntoView({block:'start',behavior:'instant'})");
    await pause(250);
    await shot("decision");
    return {size:key,...state,decisionTabOpened:opened,pixelWidth:width,pixelHeight:height};
  }finally{
    if(debuggerApi.isAttached())debuggerApi.detach();
    win.destroy();
  }
}
app.whenReady().then(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const summary=[];
  for(const [w,h] of [[1024,768],[1280,720]])summary.push(await capture(w,h));
  fs.writeFileSync(path.join(out,"UI_REVIEW_RESULT.json"),JSON.stringify({sourceCommit:process.env.GITHUB_SHA||null,mode:"real Windows Electron screenshot; not MSIX installation QA",screenshots:summary},null,2)+"\n");
  console.log("UI_SCREENSHOT_PASS "+JSON.stringify(summary));
  app.quit();
}).catch(error=>{console.error("UI_SCREENSHOT_FAIL",error?.stack||String(error));app.exit(1);});
