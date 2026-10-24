/* Decorative scene headers only. All values remain owned by existing simulation controllers. */
/* No external images, sounds, paid assets, network calls or save format changes. */
(() => {"use strict";
const CONFIG={"case":["今夜の案件ファイル","机に届いた依頼と違和感を読み、どこを疑うか決めます。","audit-case"],"evidence":["調査デスク","限られた時間で資料を選び、見落としと疑いすぎの両方を避けます。","audit-evidence"],"decision":["監査報告","集めた証拠をもとに、あなた自身の判断を報告します。","audit-decision"],"report":["判定記録","今回の判断が評価点と依頼主の信用にどう響いたか確認します。","audit-report"],"history":["監査記録","過去の判断とセーブ記録を整理し、次の案件へ備えます。","paper-files"]};
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
   words.append(heading,explainer);figure.append(illustration,words);
   if(panel.tagName==="DETAILS"){
    // The actual <summary> must stay first in the details element for native toggling.
    const summary=panel.querySelector("summary");
    if(summary)summary.insertAdjacentElement("afterend",figure);else panel.append(figure);
   }else panel.insertBefore(figure,panel.firstChild);
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