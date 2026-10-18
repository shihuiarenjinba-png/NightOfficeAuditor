"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),G=require("../src/engine.js");
function allCases(seed,choice="review"){
 let state=G.initial(seed),reports=[];
 while(!state.complete){
  let x=G.inspect(state,"ledger");x=G.inspect(x.state,"timeline");
  const done=G.decide(x.state,choice);
  reports.push(done.report);state=done.state;
 }
 return {state,reports};
}
test("same seed and actions yield byte-identical cases, evidence and outcomes",()=>{
 const a=G.initial(42),b=G.initial(42);
 assert.deepEqual(G.current(a),G.current(b));
 const inspected=G.inspect(a,"ledger");
 assert.deepEqual(inspected,G.inspect(b,"ledger"));
 assert.deepEqual(G.decide(inspected.state,"review"),G.decide(inspected.state,"review"));
});
test("12 cases give exactly two of each story theme, and balanced shuffled hidden resolutions",()=>{
 for(const seed of [1,2,17,20261018]){
  const run=allCases(seed),count=new Map(),truth=new Map();
  for(const r of run.reports){count.set(r.title,(count.get(r.title)||0)+1);truth.set(r.actual,(truth.get(r.actual)||0)+1);}
  assert.equal(count.size,6);
  for(const n of count.values())assert.equal(n,2);
  assert.deepEqual([...truth.values()].sort((a,b)=>a-b),[4,4,4]);
  assert.equal(run.state.history.length,12);
  assert.equal(run.state.complete,true);
  assert.equal(run.state.index,G.CASE_COUNT);
 }
});
test("reading clues costs actual time and does not disclose hidden answer in the current case UI",()=>{
 const s=G.initial(19),before=JSON.stringify(s),look=G.current(s);
 assert.equal(look.minutesLeft,10);
 assert.equal("truth" in look,false);
 assert.equal("key" in look,false);
 assert.ok(!look.sources.some(x=>"truth" in x));
 const next=G.inspect(s,"ledger");
 assert.equal(next.state.active.minutesLeft,7);
 assert.equal(next.state.active.checked.length,1);
 assert.equal(G.current(next.state).findings.length,1);
 assert.equal(JSON.stringify(s),before,"inspection must not mutate input");
 assert.throws(()=>G.inspect(next.state,"ledger"),/すでに/);
});
test("time budget disallows inspecting all three leads and refuses unknown IDs",()=>{
 let s=G.initial(22);s=G.inspect(s,"ledger").state;s=G.inspect(s,"timeline").state;
 assert.equal(s.active.minutesLeft,3);
 assert.throws(()=>G.inspect(s,"approval"),/時間/);
 assert.throws(()=>G.inspect(s,"other"),/調査先/);
 assert.equal(G.current(s).sources.find(x=>x.id==="approval").available,false);
});
test("wrong decisive accusations and missed serious issues penalize trust",()=>{
 const results=allCases(43,"escalate");
 const falseAccusations=results.reports.filter(r=>r.actual===G.CHOICES[0].label);
 assert.equal(falseAccusations.length,4);
 assert.ok(falseAccusations.every(r=>r.trustDelta<0 && !r.correct));
 const missing=allCases(43,"clear").reports.filter(r=>r.actual===G.CHOICES[2].label);
 assert.equal(missing.length,4);
 assert.ok(missing.every(r=>r.trustDelta<0&&r.scoreDelta<0));
});
test("records and active time are recomputed rather than trusting save-file claims",()=>{
 let s=G.initial(52);s=G.inspect(s,"approval").state;
 const time=structuredClone(s);time.active.minutesLeft=99;
 assert.throws(()=>G.validate(time),/残量/);
 const extra=structuredClone(s);extra.active.checked.push("approval");
 assert.throws(()=>G.validate(extra),/重複/);
 const finished=G.decide(s,"review").state,score=structuredClone(finished);
 score.score+=99;assert.throws(()=>G.validate(score),/得点/);
 const actual=structuredClone(finished);actual.history[0].truth=(actual.history[0].truth+1)%3;
 assert.throws(()=>G.validate(actual),/結果/);
});
test("valid JSON round-trip survives after a 12-case campaign",()=>{
 const {state}=allCases(3333);
 assert.deepEqual(G.validate(JSON.parse(JSON.stringify(state))),state);
 assert.throws(()=>G.decide(state,"review"),/これ以上/);
 assert.throws(()=>G.inspect(state,"ledger"),/終了/);
});
test("empty investigation is allowed but repeated no-evidence judgments cannot score as reviewed clues",()=>{
 const first=G.initial(80);
 const response=G.decide(first,"review");
 assert.equal(response.state.index,1);
 assert.equal(response.state.history[0].checked.length,0);
 assert.equal(response.state.history[0].effort,0);
 assert.equal(G.validate(response.state).score,response.state.score);
});
test("invalid actions and unsupported save fields cannot crash safe decision logic",()=>{
 const s=G.initial(4);
 assert.throws(()=>G.decide(s,"fire"),/不正/);
 assert.throws(()=>G.inspect(s,"unknown"),/存在/);
 const malformed=structuredClone(s);malformed.history=[{}];
 assert.throws(()=>G.validate(malformed),/進行状況/);
});
test("different seeds alter at least some findings and hidden outcomes",()=>{
 const starts=[G.initial(1),G.initial(2),G.initial(3)];
 assert.ok(new Set(starts.map(s=>G.current(s).title)).size>1);
 const out=starts.map(s=>G.inspect(s,"ledger").finding.detail);
 assert.ok(new Set(out).size>1);
});
