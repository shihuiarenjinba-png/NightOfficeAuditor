"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),E=require("../src/engine.js");
test("all six premises are revisited in a different context with hidden answers across 100 seeds",()=>{
 for(let seed=1;seed<=100;seed++){
  let s=E.initial(seed),previousTitles=[];
  for(let day=0;day<12;day++){
   const page=E.current(s);
   if(day<6)previousTitles.push(page.title);
   else{assert.equal(page.title,previousTitles[day-6]);assert.ok(page.priorEvidence);assert.match(page.intro,/前半|引き継|交代|前回|新しい|変更|窓口|別の日/);}
   const candidate=page.sources.find(x=>x.available);
   s=E.inspect(s,candidate.id).state;
   assert.ok(E.current(s).minutesLeft<page.minutesLeft);
   s=E.decide(s,"review").state;
   assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))),s);
  }
  assert.equal(s.history.length,12);assert.equal(s.complete,true);
  assert.equal(E.current(s).complete,true);
 }
});