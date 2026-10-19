"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const app=fs.readFileSync("src/app.js","utf8"),tabs=fs.readFileSync("src/operation-tabs.js","utf8");
test("next case switches tab before the page scrolls",()=>{
 const i=app.lastIndexOf('$("nextCase").addEventListener("click"');
 assert.ok(i>=0);
 const s=app.slice(i,i+265);
 assert.ok(s.indexOf('OperationTabs?.open("case")')>=0);
 assert.ok(s.indexOf('OperationTabs?.open("case")')<s.indexOf('$("casePanel").scrollIntoView'));
 assert.doesNotThrow(()=>new vm.Script(app));
});
test("reloaded cases do not wrongly claim an empty verdict when history exists",()=>{
 assert.match(app,/state\.history\.length\?/);
 assert.match(app,/前回の調査内容/);
 assert.match(tabs,/OperationTabs=Object\.freeze/);
});