"use strict";const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/app.js","utf8"),tabs=fs.readFileSync("src/operation-tabs.js","utf8");
test("report opens only after accepted and persisted decision",()=>{
 assert.match(app,/const result=G\.decide\(state,choice\.id\);state=result\.state/);
 assert.match(app,/persist\(\);render\(\);window\.OperationTabs\?\.open\("report"\)/);
 assert.match(app,/!confirm\("まだ証拠を確認していません/);
 assert.doesNotMatch(tabs,/queueMicrotask\(\(\)=>open\("report"\)\)/);
});
test("reset and next-case navigation return to case",()=>{
 assert.match(app,/new G|G\.initial\(\)/);
 assert.match(app,/window\.OperationTabs\?\.open\("case"\)/);
 assert.match(tabs,/getElementById\("nextCase"\)\.addEventListener\("click"/);
});