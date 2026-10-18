/* NightOfficeAuditor — offline evidence game screen and safe local save. */
(function(){"use strict";
const G=globalThis.NightOfficeGame,$=id=>document.getElementById(id),KEY="night-office-auditor:save:v1";
let state=null,lastReport=null,unreadableRaw=null,recoveryBlocked=false,notice="";
const make=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
function load(){
 let raw=null;
 try{raw=localStorage.getItem(KEY);return raw?G.validate(JSON.parse(raw)):G.initial();}
 catch(error){unreadableRaw=raw;recoveryBlocked=true;notice="保存した記録を確認できませんでした。元のデータは保持しています。";return G.initial();}
}
function persist(){
 if(recoveryBlocked)return false;
 try{localStorage.setItem(KEY,JSON.stringify(state));return true;}
 catch(error){notice="端末への自動保存ができません。セーブを書き出してください。";return false;}
}
function stats(current){
 $("count").textContent=state.complete?"12 / 12":current.caseNumber+" / "+G.CASE_COUNT;
 $("score").textContent=state.score.toLocaleString("ja-JP");
 $("trust").textContent=state.trust+" / 100";
 $("time").textContent=state.complete?"終了":current.minutesLeft+"分";
}
function caseView(current){
 const root=$("case");root.replaceChildren();
 if(recoveryBlocked){
  root.append(make("h3","保存記録の確認が必要です"),make("p",unreadableRaw!==null?
   "元のセーブは上書きしていません。下のセーブ管理から元データを書き出し、正常な記録を読み込むか、確認して新規開始してください。":
   "保存領域にアクセスできません。端末の設定を確認するか、明示的に新規開始してください。"));
  return;
 }
 if(current.complete){
  root.append(make("h3",current.rating+" — 今夜の12件の監査が終わりました"),
   make("p","すべての案件を確認しました。高い評価点と依頼主の信用を両立できたでしょうか。記録を書き出すか、新しい夜を始めてください。"));return;
 }
 root.append(make("h3",current.title),make("p",current.intro));
 if(current.continuity)root.append(make("p",current.continuity,"continuity"));
}
function priorNotebook(current){
 const root=$("priorEvidence"),panel=$("priorNotebook");
 root.replaceChildren();
 if(recoveryBlocked||current.complete||!current.priorEvidence){panel.hidden=true;return;}
 panel.hidden=false;
 const previous=current.priorEvidence;
 root.append(make("p",previous.caseNumber+"件目の判断："+previous.judgment,"muted"));
 if(!previous.findings.length)root.append(make("p","前回は証拠を調べていませんでした。今回の調査を優先しましょう。","muted"));
 for(const note of previous.findings){
  const box=make("div",undefined,"finding");
  box.append(make("strong",note.title),make("p",note.detail));root.append(box);
 }
 root.append(make("p","これは過去に確認した証拠です。今夜の案件に同じ真相が当てはまるとは限りません。","muted"));
}
function sources(current){
 const root=$("sources"),results=$("findings");root.replaceChildren();results.replaceChildren();
 if(recoveryBlocked||current.complete){
  root.append(make("p",recoveryBlocked?"保存データの復旧が必要です。":"すべての証拠調査を終了しました。","muted"));
  return;
 }
 for(const source of current.sources){
  const b=make("button",undefined,source.checked?"source checked":"source");b.type="button";
  b.disabled=!source.available||recoveryBlocked;
  b.append(make("strong",source.label),make("span",source.checked?"確認済み":source.available?"調査時間 "+source.cost+"分":"残り時間が足りません"));
  b.addEventListener("click",()=>{
   try{const next=G.inspect(state,source.id);state=next.state;notice="";persist();render();}
   catch(e){notice=e.message;render();}
  });root.append(b);
 }
 if(!current.findings.length)results.append(make("p","何を調べるか選んでください。すべての証拠を見る時間はありません。","hint"));
 for(const finding of current.findings){
  const box=make("div",undefined,"finding"),head=make("div");
  head.append(make("strong",finding.title),make("span",finding.reliability,"rank"));
  box.append(head,make("p",finding.detail));results.append(box);
 }
}
function decisions(current){
 const root=$("choices");root.replaceChildren();
 if(recoveryBlocked||current.complete){root.append(make("p",recoveryBlocked?"保存記録を復旧してください。":"判断は完了しました。","muted"));return;}
 const descriptions={
  clear:"根拠が揃っていると判断して終了",
  review:"残る疑問を明確にして追加確認を依頼",
  escalate:"重大な不一致を示す証拠として報告"
 };
 for(const choice of current.choices){
  const b=make("button",undefined,"choice");b.type="button";
  b.append(make("strong",choice.label),make("span",descriptions[choice.id]));
  b.addEventListener("click",()=>{
   if(choice.id==="escalate"&&!state.active.checked.length&&
     !confirm("まだ証拠を確認していません。重大な不一致として報告しますか？"))return;
   try{
    const result=G.decide(state,choice.id);state=result.state;lastReport=result.report;
    notice=result.report.correct?"判断を記録しました。":"判断を記録しました。次の案件に学びを活かしましょう。";
    persist();render();$("result").scrollIntoView({block:"nearest",behavior:"smooth"});
   }catch(e){notice=e.message;render();}
  });root.append(b);
 }
}
function resultView(){
 const root=$("result");root.replaceChildren();
 if(!lastReport){
  root.append(make("p","証拠を調べて報告すると、判断の結果と見落とした根拠をここで確認できます。","muted"));
  $("nextCase").hidden=true;return;
 }
 const r=lastReport,box=make("div",undefined,"outcome");
 box.append(make("h3",r.caseNumber+"件目「"+r.title+"」の検証結果"));
 const row=make("div",undefined,"metrics");
 for(const [label,val] of [["今回の評価点",(r.scoreDelta>=0?"+":"")+r.scoreDelta],
  ["信用の変化",(r.trustDelta>=0?"+":"")+r.trustDelta]]){
  const d=make("div",undefined,"metric");d.append(make("small",label),make("strong",val));row.append(d);
 }
 box.append(row,make("p","あなたの報告："+r.judgment),make("p","実際の記録："+r.actual));
 box.append(make("p",r.message,r.correct?"good":"bad"));
 box.append(make("p","決め手となった証拠："+r.keyFinding,"muted"));
 root.append(box);
 $("nextCase").hidden=state.complete||recoveryBlocked;
}
function historyView(){
 const root=$("history");root.replaceChildren();
 if(!state.history.length){root.append(make("p","監査を1件終えると、その結果がここに残ります。","muted"));return;}
 for(const h of state.history.slice(-8).reverse()){
  const r=G.CHOICES[h.truth],c=G.CHOICES.find(x=>x.id===h.choice);
  root.append(make("div",(h.index+1)+"件目 ｜ 判断："+c.label+" / 実際："+r.label+
    " ｜ 評価 "+(h.scoreDelta>=0?"+":"")+h.scoreDelta,"history-entry"));
 }
}
function render(){
 const current=G.current(state);stats(current);caseView(current);priorNotebook(current);sources(current);decisions(current);resultView();historyView();
 $("warning").textContent=notice;const next=$("nextCase");next.hidden=next.hidden||state.complete;
}
function download(name,raw){
 const url=URL.createObjectURL(new Blob([raw],{type:"application/json"})),a=make("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportSave(){
 if(recoveryBlocked&&unreadableRaw===null){alert("端末の保存領域から元データを取得できません。");return;}
 download(recoveryBlocked?"night-audit-unreadable-original.json":"night-audit-case-"+state.index+".json",
 recoveryBlocked?unreadableRaw:JSON.stringify({schema:G.VERSION,state},null,2));
}
async function importSave(file){
 if(!file)return;
 try{
  if(file.size>300000)throw Error("セーブファイルが大きすぎます。");
  const payload=JSON.parse(await file.text());
  if(payload.schema!==G.VERSION)throw Error("対応していないセーブバージョンです。");
  const next=G.validate(payload.state);
  if(!confirm("現在の進行状況を読み込んだ記録で置き換えますか？"))return;
  state=next;lastReport=null;unreadableRaw=null;recoveryBlocked=false;notice="セーブ記録を読み込みました。";
  persist();render();
 }catch(error){alert("セーブ読込に失敗しました："+error.message);}
}
function init(){
 state=load();if(!recoveryBlocked)persist();render();
 $("export").addEventListener("click",exportSave);
 $("import").addEventListener("click",()=>$("savefile").click());
 $("savefile").addEventListener("change",event=>{const file=event.target.files[0];event.target.value="";void importSave(file);});
 $("reset").addEventListener("click",()=>{
  const msg=recoveryBlocked?
   "読み取れない元のセーブを上書きします。先にファイルに退避しましたか？":
   "今の12案件の進行を消して最初から始めます。セーブを書き出しましたか？";
  if(!confirm(msg))return;
  state=G.initial();lastReport=null;unreadableRaw=null;recoveryBlocked=false;notice="新しい夜の監査を始めました。";persist();render();
 });
 $("nextCase").addEventListener("click",()=>$("casePanel").scrollIntoView({block:"start",behavior:"smooth"}));
}
document.addEventListener("DOMContentLoaded",init);
})();