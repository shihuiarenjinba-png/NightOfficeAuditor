const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("src/app.js","utf8");
test("visual evidence desk is state derived and does not reveal truth",()=>{
 assert.match(html,/id="evidenceBoard"/);
 assert.match(app,/function evidenceDesk\(current\)/);
 assert.match(app,/current\.findings/);
 assert.match(app,/evidenceDesk\(current\);sources\(current\)/);
 assert.doesNotMatch(app.slice(app.indexOf("function evidenceDesk("),app.indexOf("function priorNotebook(")),/state\.truth|current\.truth/);
});
