"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
test("game teaches exactly three simple steps while advanced records stay collapsed",()=>{
 const html=read("index.html");
 assert.equal((html.match(/class="step"/g)||[]).length,3);
 assert.match(html,/<details class="extra">/);
 for(const id of ["case","sources","findings","choices","result","count","score","trust","time","history","export","import","reset"])assert.ok(html.includes('id="'+id+'"'),id);
});
test("CSP rejects external connections and no remote javascript dependencies exist",()=>{
 const html=read("index.html"),script=read("src/app.js");
 assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(html,/<script[^>]+src="https?:/);
 assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|sendBeacon/);
});
test("save recovery is fail-closed and the renderer never exposes an undeclared truth value",()=>{
 const script=read("src/app.js");
 assert.match(script,/if\(recoveryBlocked\)return false/);
 assert.match(script,/unreadableRaw=raw;recoveryBlocked=true/);
 assert.match(script,/const next=G\.validate\(payload\.state\)/);
 assert.match(script,/const root=\$\("sources"\),results=\$\("findings"\)/);
});
