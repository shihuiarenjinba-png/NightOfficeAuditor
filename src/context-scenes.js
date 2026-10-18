/* Decorative scene headers only. All values remain owned by existing simulation controllers. */
/* No external images, sounds, paid assets, network calls or save format changes. */
(() => {"use strict";
const CONFIG={"case":["今夜の案件ファイル","依頼文を読む画面。ここでは証拠の正誤を示しません。","audit-case"],"evidence":["調査デスク","既存の証拠ボタンと資料から調査します。未取得の証拠は表示しません。","audit-evidence"],"decision":["報告書作成","判断を選ぶ画面。答えや正誤のヒントは描画しません。","audit-decision"],"report":["調査結果の記録","報告済みの結果と信用の変化をゲーム本体が表示します。","audit-report"],"history":["監査記録","過去の決定とセーブデータを確認します。","paper-files"]};
const theme="audit";
const $=id=>document.getElementById(id);
function build(){
 const nav=$("operationTabs");if(!nav)return;
 const scenes=[];
 for(const [key,[title,description,visual]] of Object.entries(CONFIG)){
   const panel=document.querySelector('[data-operation-screen="'+key+'"]');
   if(!panel||panel.querySelector(".context-scene"))continue;
   const figure=document.createElement("div");figure.className="context-scene";
   figure.dataset.sceneKey=key;figure.dataset.sceneVisual=visual;figure.dataset.sceneTheme=theme;
   const illustration=document.createElement("div");illustration.className="context-illustration";illustration.setAttribute("aria-hidden","true");
   for(const shape of ["backdrop","floor","structure","object","object-secondary","detail","worker"]){
    const piece=document.createElement("span");piece.className="scene-shape scene-"+shape;illustration.append(piece);
   }
   const words=document.createElement("div");words.className="context-description";
   const heading=document.createElement("h3");heading.textContent=title;
   const explainer=document.createElement("p");explainer.textContent=description;
   words.append(heading,explainer);figure.append(illustration,words);panel.insertBefore(figure,panel.firstChild);
   scenes.push(figure);
 }
 const staffControl=$(theme==="small"?"employees":theme==="factory"?"workers":null);
 const staffCount=$(theme==="small"?"headcount":null);
 function updateStaff(){
  const value=staffControl?.value??staffCount?.textContent??"0";
  const count=Number(String(value).replace(/[^0-9]/g,""));
  for(const element of scenes)element.dataset.workerVisible=Number.isFinite(count)&&count>0?"true":"false";
 }
 if(staffControl){staffControl.addEventListener("input",updateStaff);staffControl.addEventListener("change",updateStaff);}
 if(staffCount){const observer=new MutationObserver(updateStaff);observer.observe(staffCount,{childList:true,subtree:true,characterData:true});}
 updateStaff();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build,{once:true});else build();
})();