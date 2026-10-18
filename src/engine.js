/* NightOfficeAuditor — offline, deterministic evidence-and-judgment game. */
(function(root,factory){
  const game=factory();
  if(typeof module==="object"&&module.exports)module.exports=game;
  else root.NightOfficeGame=game;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const VERSION=1,CASE_COUNT=12,BUDGET=10;
const SOURCES=Object.freeze([
 {id:"ledger",label:"台帳・金額を照合",cost:3},
 {id:"timeline",label:"時刻と操作履歴を調べる",cost:4},
 {id:"approval",label:"承認記録と連絡を読む",cost:5}
]);
const CHOICES=Object.freeze([
 {id:"clear",label:"問題なしとして閉じる"},
 {id:"review",label:"追加確認が必要と報告する"},
 {id:"escalate",label:"重大な不一致として報告する"}
]);
const SCENARIOS=Object.freeze([
 {title:"消えた伝票",intro:"締め後に伝票番号が飛んでいます。書類が消されたのでしょうか。",subject:"伝票"},
 {title:"夜更けの納品",intro:"納品記録と受付台帳の時刻が合いません。夜の便に何があったのでしょうか。",subject:"納品"},
 {title:"倉庫の差額",intro:"棚卸し数と帳簿が一致しません。計上の遅れか、別の理由か。",subject:"在庫"},
 {title:"白紙の承認欄",intro:"重要な変更申請に署名がありません。手順漏れなのでしょうか。",subject:"申請"},
 {title:"変わった振込先",intro:"支払先情報が月末に更新されています。正規の依頼か確かめましょう。",subject:"支払"},
 {title:"出張の精算",intro:"経費申請の交通費が通常より高めです。説明がつくのでしょうか。",subject:"精算"}
]);
const RATING=Object.freeze([
 [115,28,-110],[-35,95,-55],[-155,24,150]
]); // rows: verified case state (clear/review/escalate), cols: player judgment
const TRUST=Object.freeze([
 [3,0,-9],[-4,3,-6],[-15,-3,4]
]);
const integer=(v,label,min,max)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw Error(label+"が不正です。");return v;};
function random(seed,index,salt){
 let a=(seed^Math.imul(index+1,0x9e3779b1)^Math.imul(salt+1,0x85ebca6b))>>>0;
 a^=a>>>16;a=Math.imul(a,0x7feb352d);a^=a>>>15;a=Math.imul(a,0x846ca68b);a^=a>>>16;
 return(a>>>0)/4294967296;
}
const clone=x=>JSON.parse(JSON.stringify(x));
function spec(seed,index){
 integer(seed,"seed",1,2147483647);integer(index,"index",0,CASE_COUNT-1);
 // Each 12-case campaign contains four of each resolution; the ordering is
 // seeded and shuffled so the next answer cannot be inferred from the day number.
 const scenario=SCENARIOS[(index+seed%SCENARIOS.length)%SCENARIOS.length];
 const answers=Array.from({length:CASE_COUNT},(_,i)=>i%3);
 for(let i=answers.length-1;i>0;i--){
  const j=Math.floor(random(seed,i,800+i)* (i+1));
  [answers[i],answers[j]]=[answers[j],answers[i]];
 }
 const truth=answers[index];
 const key=Math.floor(random(seed,index,26)*SOURCES.length);
 const followUp=index>=SCENARIOS.length?" 今度は別の担当者による似た案件です。前回の判断をそのまま当てはめず、記録を確かめてください。":" 依頼人は明朝までの報告を待っています。";
 return {index,title:scenario.title,intro:scenario.intro+followUp,subject:scenario.subject,truth,key};
}
function initial(seed=20261018){
 integer(seed,"seed",1,2147483647);
 return {version:VERSION,seed,index:0,score:0,trust:60,history:[],active:{checked:[],minutesLeft:BUDGET},complete:false};
}
function scoreFor(truth,choice,checked){
 const choiceIndex=CHOICES.findIndex(x=>x.id===choice);
 if(choiceIndex<0)throw Error("報告の種類が不正です。");
 const effort=checked.reduce((sum,id)=>sum+SOURCES.find(x=>x.id===id).cost,0);
 return {scoreDelta:RATING[truth][choiceIndex]-2*effort,
  trustDelta:TRUST[truth][choiceIndex],effort};
}
function calculateRecord(seed,index,choice,checked){
 const c=spec(seed,index);
 const outcome=scoreFor(c.truth,choice,checked);
 return {index,choice,checked:[...checked],truth:c.truth,...outcome};
}
function validate(raw){
 if(!raw||raw.version!==VERSION||!Array.isArray(raw.history)||!raw.active||
   !Array.isArray(raw.active.checked))throw Error("セーブ形式が不正です。");
 const seed=integer(raw.seed,"seed",1,2147483647);
 const index=integer(raw.index,"index",0,CASE_COUNT);
 if(raw.history.length!==index||raw.complete!==(index===CASE_COUNT))throw Error("案件の進行状況が不正です。");
 let score=0,trust=60;
 function verifyChecked(list){
  if(!Array.isArray(list)||list.length>2)throw Error("調査記録が多すぎます。");
  const unique=new Set(list);
  if(unique.size!==list.length)throw Error("調査記録に重複があります。");
  let sum=0;
  for(const id of list){
   const source=SOURCES.find(x=>x.id===id);
   if(!source)throw Error("調査記録の種類が不正です。");
   sum+=source.cost;
  }
  if(sum>BUDGET)throw Error("制限時間を超えた調査記録です。");
  return sum;
 }
 for(let i=0;i<index;i++){
  const row=raw.history[i];
  if(!row||row.index!==i)throw Error("監査履歴の順序が不正です。");
  verifyChecked(row.checked);
  const expected=calculateRecord(seed,i,row.choice,row.checked);
  if(JSON.stringify(row)!==JSON.stringify(expected))throw Error("監査の得点・結果が一致しません。");
  score+=expected.scoreDelta;trust=Math.max(0,Math.min(100,trust+expected.trustDelta));
 }
 const used=verifyChecked(raw.active.checked);
 if(raw.active.minutesLeft!==BUDGET-used)throw Error("調査時間の残量が一致しません。");
 if(index===CASE_COUNT&&raw.active.checked.length!==0)throw Error("完了済み案件に調査記録があります。");
 if(raw.score!==score||raw.trust!==trust)throw Error("得点・信用度が履歴と一致しません。");
 return clone(raw);
}
function clue(seed,index,id){
 const c=spec(seed,index),i=SOURCES.findIndex(x=>x.id===id);
 if(i<0)throw Error("存在しない調査先です。");
 const stable=Math.floor(random(seed,index,100+i)*3);
 if(i===c.key){
  const line=[
   [c.subject+"の差分は翌朝の取消記録と一致。誰がいつ処理したかも追跡できる。",
    c.subject+"の根拠資料が1点不足。数字は合うが、承認の順番を証明できない。",
    c.subject+"の訂正履歴と提出済みの証憑が食い違う。複数の独立記録で不一致が続く。"],
   ["追加の作業ログから、処理のタイミングに正当な説明がつく。",
    "一部の操作ログが残っていない。入力漏れの可能性もある。",
    "二つのシステムの時刻を突合しても、同一の変更を説明できない。"],
   ["関係者の承認は事前に記録されており、取引先の返信も整合する。",
    "承認依頼は残るが、承認の返信が見つからない。追加の確認が必要。",
    "承認者本人が依頼を否定し、連絡履歴とも一致していない。"]
  ][i][c.truth];
  return {id,title:SOURCES[i].label,detail:line,reliability:"主要な証拠"};
 }
 const ambiguous=[
  ["金額は合っているが、記録の備考は短い。","合計欄と内訳が一部ずれて見える。","手入力の丸めがありそうだ。"],
  ["時刻の差は数分ある。","夜間の更新ログが残る。","サーバーの時計に補正履歴がある。"],
  ["メールの件名は通常どおりだ。","承認者の代理名義が含まれる。","連絡先欄に旧表記が残る。"]
 ][i][stable];
 return {id,title:SOURCES[i].label,detail:ambiguous,reliability:"参考情報"};
}
function current(raw){
 const s=validate(raw);
 if(s.complete)return {complete:true,processed:CASE_COUNT};
 const c=spec(s.seed,s.index);
 return {complete:false,caseNumber:s.index+1,caseCount:CASE_COUNT,title:c.title,intro:c.intro,
  minutesLeft:s.active.minutesLeft,
  sources:SOURCES.map(v=>({...v,checked:s.active.checked.includes(v.id),
   available:!s.active.checked.includes(v.id)&&s.active.minutesLeft>=v.cost})),
  findings:s.active.checked.map(id=>clue(s.seed,s.index,id)),
  choices:CHOICES.map(x=>({...x})),
  score:s.score,trust:s.trust};
}
function inspect(raw,id){
 const s=validate(raw);
 if(s.complete)throw Error("すべての案件を終了しました。");
 const source=SOURCES.find(x=>x.id===id);
 if(!source)throw Error("存在しない調査先です。");
 if(s.active.checked.includes(id))throw Error("この証拠はすでに確認しています。");
 if(s.active.minutesLeft<source.cost)throw Error("この調査を行う時間が残っていません。");
 s.active.checked.push(id);
 s.active.minutesLeft-=source.cost;
 return {state:validate(s),finding:clue(s.seed,s.index,id)};
}
function decide(raw,choice){
 const s=validate(raw);
 if(s.complete)throw Error("これ以上の案件はありません。");
 if(!CHOICES.some(c=>c.id===choice))throw Error("報告の種類が不正です。");
 const c=spec(s.seed,s.index),record=calculateRecord(s.seed,s.index,choice,s.active.checked);
 const oldScore=s.score;
 s.history.push(record);s.index++;s.score+=record.scoreDelta;
 s.trust=Math.max(0,Math.min(100,s.trust+record.trustDelta));
 s.complete=s.index===CASE_COUNT;
 s.active={checked:[],minutesLeft:BUDGET};
 const report={caseNumber:c.index+1,title:c.title,
  judgment:CHOICES.find(x=>x.id===choice).label,
  actual:CHOICES[c.truth].label,
  correct:CHOICES[c.truth].id===choice,
  scoreDelta:s.score-oldScore,trustDelta:record.trustDelta,
  keyFinding:clue(s.seed,c.index,SOURCES[c.key].id).detail,
  message:CHOICES[c.truth].id===choice?"証拠に合った判断でした。":
   c.truth===2&&choice==="clear"?"重大な不一致を見逃しました。次は独立した記録を優先しましょう。":
   c.truth===0&&choice==="escalate"?"正当な処理を疑いすぎました。確かな根拠と推測を区別しましょう。":
   "判断に迷うときは、追加確認として記録する選択もあります。"};
 return {state:validate(s),report};
}
return Object.freeze({VERSION,CASE_COUNT,BUDGET,SOURCES,CHOICES,SCENARIOS,initial,validate,random,current,inspect,decide});
});