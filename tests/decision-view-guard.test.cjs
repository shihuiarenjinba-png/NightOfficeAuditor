"use strict";const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/app.js","utf8"),tabs=fs.readFileSync("src/operation-tabs.js","utf8");
test("report opens only after accepted and persisted decision",()=>{
 // A decision must reach durable storage BEFORE the screen advances.
 assert.match(app,/const result=G\.decide\(state,choice\.id\);\s*localStorage\.setItem\(KEY,JSON\.stringify\(result\.state\)\);\s*state=result\.state/);
 assert.match(app,/render\(\);globalThis\.OperationTabs\?\.open\("report"\)/);
 assert.doesNotMatch(app,/state=result\.state;\s*persist\(\)/);
 assert.match(app,/!confirm\("まだ証拠を確認していません/);
 assert.doesNotMatch(tabs,/queueMicrotask\(\(\)=>open\("report"\)\)/);
});
test("reset and next-case navigation return to case",()=>{
 assert.match(app,/new G|G\.initial\(\)/);
 assert.match(app,/globalThis\.OperationTabs\?\.open\("case"\)/);
 assert.match(tabs,/getElementById\("nextCase"\)\.addEventListener\("click"/);
});