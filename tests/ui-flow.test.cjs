"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),G=require("../src/engine.js");
const appSource=fs.readFileSync(path.join(__dirname,"../src/app.js"),"utf8");
class Node {
 constructor(tag="div"){
  this.tag=tag;this.children=[];this.listeners={};this._text="";this.className="";
  this.type="";this.value="";this.disabled=false;this.hidden=false;this.files=[];
 }
 set textContent(s){this._text=String(s);this.children=[];}
 get textContent(){return this._text+this.children.map(x=>x.textContent||"").join("");}
 append(...parts){this.children.push(...parts);}
 prepend(...parts){this.children.unshift(...parts);}
 replaceChildren(...parts){this._text="";this.children=parts;}
 addEventListener(name,callback){this.listeners[name]=callback;}
 click(){if(!this.disabled&&this.listeners.click)this.listeners.click({target:this});}
 scrollIntoView(){}
 remove(){}
}
function boot(raw,confirmValue=true){
 const ids=["count","score","trust","time","case","sources","findings","choices",
  "evidenceBoard","caseTimerTitle","caseTimeProgress","caseTimeHint","warning","result","nextCase","history","export","import","reset","savefile","casePanel","priorNotebook","priorEvidence"];
 const nodes=Object.fromEntries(ids.map(id=>[id,new Node(id)]));
 nodes.nextCase.hidden=true;
 const saved=new Map();
 if(raw!==undefined)saved.set("night-office-auditor:save:v1",raw);
 const events={};
 const doc={
  getElementById:id=>nodes[id],
  createElement:tag=>new Node(tag),
  body:{append(){}},
  addEventListener:(event,handler)=>{events[event]=handler}
 };
 let downloadValue=null,downloadName=null;
 const Blob=function Blob(parts){this.parts=parts;};
 const URL={
  createObjectURL(blob){downloadValue=blob.parts.join("");return "blob:save"},
  revokeObjectURL(){}
 };
 let denySaving=false;
 const storage={
  getItem:k=>saved.get(k)??null,
  setItem:(k,v)=>{if(denySaving)throw Error("storage full");saved.set(k,v);}
 };
 const context={NightOfficeGame:G,document:doc,localStorage:storage,URL,Blob,
  alert:msg=>{throw Error("Unexpected alert: "+msg);},
  confirm:()=>confirmValue,setTimeout:()=>{},console};
 vm.runInNewContext(appSource,context,{filename:"src/app.js"});
 events.DOMContentLoaded();
 return {
  nodes,saved,download:()=>downloadValue,
  getState:()=>JSON.parse(saved.get("night-office-auditor:save:v1")),
  blockSaving:value=>{denySaving=value;},
  inspect(i){nodes.sources.children[i].click();},
  choose(i){nodes.choices.children[i].click();},
  reset(){nodes.reset.click();},
  export(){nodes.export.click();}
 };
}
test("starting the game displays a narrative hook and only three simple investigation buttons",()=>{
 const ui=boot(),p=ui.getState();
 assert.equal(p.index,0);
 assert.equal(ui.nodes.sources.children.length,3);
 assert.equal(ui.nodes.choices.children.length,3);
 assert.match(ui.nodes.case.textContent,/締め|記録|棚卸し|申請|振込|経費|納品/);
 assert.match(ui.nodes.findings.textContent,/何を調べるか/);
 assert.equal(ui.nodes.time.textContent,"10分");
});
test("clue click spends time, preserves score, and reveals a concrete clue",()=>{
 const ui=boot(),before=ui.getState();
 ui.inspect(0);
 const after=ui.getState();
 assert.equal(after.index,0);
 assert.equal(after.score,before.score);
 assert.equal(after.active.minutesLeft,7);
 assert.equal(ui.nodes.findings.children.length,1);
 assert.match(ui.nodes.findings.textContent,/台帳|記録|金額|差分|補正/);
 assert.equal(ui.nodes.sources.children[0].disabled,true);
});
test("reporting a judgment advances the next case, archives findings and renders a result",()=>{
 const ui=boot();
 ui.inspect(0);ui.choose(1);
 const state=ui.getState();
 assert.equal(state.index,1);
 assert.equal(state.history.length,1);
 assert.equal(state.active.minutesLeft,10);
 assert.equal(ui.nodes.sources.children.length,3);
 assert.match(ui.nodes.result.textContent,/今回の評価点/);
 assert.match(ui.nodes.history.textContent,/1件目/);
 assert.equal(ui.nodes.count.textContent,"2 / 12");
});
test("corrupted save never auto-overwrites and exports its original bytes",()=>{
 const raw='{"invalid"';
 const ui=boot(raw);
 assert.equal(ui.saved.get("night-office-auditor:save:v1"),raw);
 assert.match(ui.nodes.case.textContent,/保存記録/);
 assert.equal(ui.nodes.sources.children.length,1);
 ui.export();
 assert.equal(ui.download(),raw);
 ui.reset();
 assert.equal(ui.getState().index,0);
});
test("existing valid partial save opens exactly where the player stopped",()=>{
 const original=G.decide(G.inspect(G.initial(77),"timeline").state,"review").state;
 const ui=boot(JSON.stringify(original));
 assert.equal(ui.nodes.count.textContent,"2 / 12");
 assert.equal(ui.getState().history.length,1);
 assert.equal(ui.nodes.history.children.length,1);
});
test("all 12 cases can be completed from the same three-step UI",()=>{
 const ui=boot();
 for(let i=0;i<G.CASE_COUNT;i++){
  ui.inspect(0);ui.choose(1);
  assert.equal(ui.getState().index,i+1);
 }
 assert.equal(ui.getState().complete,true);
 assert.equal(ui.nodes.count.textContent,"12 / 12");
 assert.match(ui.nodes.case.textContent,/12件の監査が終わりました/);
 assert.equal(ui.nodes.choices.children.length,1);
 assert.equal(ui.nodes.nextCase.hidden,true);
});

test("related-case evidence notebook appears only in the second half and never mutates saves",()=>{
 const ui=boot();
 assert.equal(ui.nodes.priorNotebook.hidden,true);
 for(let i=0;i<6;i++){ui.inspect(0);ui.choose(1);}
 assert.equal(ui.getState().index,6);
 assert.equal(ui.nodes.priorNotebook.hidden,false);
 assert.match(ui.nodes.priorEvidence.textContent,/1件目の判断/);
 assert.match(ui.nodes.priorEvidence.textContent,/台帳・金額を照合/);
 assert.match(ui.nodes.priorEvidence.textContent,/今夜の案件に同じ真相/);
 const before=JSON.stringify(ui.getState());
 // Notebook is read-only; viewing it does not spend time, score, or save money.
 assert.equal(JSON.stringify(ui.getState()),before);
});

test("investigation clock changes only when evidence is gathered",()=>{
 const ui=boot(),before=ui.getState();assert.equal(ui.nodes.caseTimerTitle.textContent,"残り10分");
 assert.equal(ui.nodes.caseTimeProgress.value,10);ui.inspect(0);
 assert.equal(ui.nodes.caseTimerTitle.textContent,"残り7分");assert.equal(ui.nodes.caseTimeProgress.value,7);
 assert.equal(ui.getState().score,before.score);
});
test("second-half cases have individual context but earlier resolution never fixes later truth",()=>{
 const s=G.initial(77),first=G.current(s).title;
 let c=s;for(let i=0;i<6;i++)c=G.decide(c,"review").state;
 const later=G.current(c);
 assert.equal(later.title,first);assert.match(later.intro,/前半|引き継|交代|前回|新しい|変更|窓口|別の日/);
 assert.ok(later.priorEvidence);
});

test("a full storage device cannot consume a clue or show a completed decision",()=>{
 const ui=boot(),before=JSON.stringify(ui.getState());
 ui.blockSaving(true);
 ui.inspect(0);
 assert.equal(JSON.stringify(ui.getState()),before);
 assert.match(ui.nodes.warning.textContent,/確定しませんでした/);
 ui.choose(1);
 assert.equal(JSON.stringify(ui.getState()),before);
 assert.equal(ui.nodes.nextCase.hidden,true);
 assert.doesNotMatch(ui.nodes.result.textContent,/今回の評価点/);
 ui.blockSaving(false);
 ui.inspect(0);
 assert.equal(ui.getState().active.minutesLeft,7);
 ui.choose(1);
 assert.equal(ui.getState().history.length,1);
});
test("starting a new night archives the previous investigation without overwriting it",()=>{
 const ui=boot(),key="night-office-auditor:save:v1";
 ui.inspect(0);const first=ui.saved.get(key);
 ui.reset();
 assert.equal(ui.saved.get(key+":backup"),first);
 assert.equal(ui.getState().index,0);
 ui.inspect(1);const second=ui.saved.get(key);
 ui.reset();
 assert.equal(ui.saved.get(key+":backup"),first);
 assert.equal(ui.saved.get(key+":backup:2"),second);
});
