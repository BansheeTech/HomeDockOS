import{d as j,u as F,r as l,o as E,K as M,c as S,b as x,e as o,h as $,T as P,a as f,g as I,f as a,n as v,O as T,I as C,m as z,_ as N,F as O,x as q,j as R,A as V,k as X,l as U,N as W,p as Y,q as J}from"./hdos_DuxgfCoOHZLz1O8RI3nUx.js";import{a as K}from"./hdos_upsvKRUOqxAMySxF9uzRF.js";import{S as G}from"./hdos_DLGquBG0rCXy8S1XmncFs.js";import{d as Q}from"./hdos_itWSuQ2oYLgMGq-Z_V6WL.js";import{d as Z}from"./hdos_Cz8Dwn1iOWea_GVqOHEOb.js";import{d as ee}from"./hdos_BW-i5UGMkVNRYrcW_CmuW.js";import{d as te}from"./hdos_DPhlMBAcwmj4N6C-RIU0v.js";const ae={class:"fixed inset-0 flex items-center justify-center z-50"},se={class:"relative flex items-center justify-center w-56 h-56"},ne={class:"flex items-center justify-center backdrop-blur-xl rounded-full w-40 h-40 p-10 relative z-[40]"},oe=100,re=j({__name:"OrbitLoader",props:{isChecking:Boolean,isSuccess:Boolean,isError:Boolean,isHttps:Boolean},setup(t){const{themeClasses:s}=F(),i=l(null);let r;const m=l(0),p=l(0);let d=0,_=0,h;const w=()=>{d=Math.random()*40-20,_=Math.random()*40-20},b=()=>{m.value+=(d-m.value)*.1,p.value+=(_-p.value)*.1,requestAnimationFrame(b)},g=[],u=(e,c,y)=>{for(let n=0;n<oe;n++)g.push({angle:Math.random()*2*Math.PI,radius:80+Math.random()*20,speed:.005+Math.random()*.03,size:.5+Math.random()*2})},k=(e,c,y)=>{e.clearRect(0,0,e.canvas.width,e.canvas.height),g.forEach(n=>{const L=c+Math.cos(n.angle)*n.radius,D=y+Math.sin(n.angle)*n.radius;e.beginPath(),e.arc(L,D,n.size,0,2*Math.PI),e.fillStyle="rgba(148, 163, 184, 0.7)",e.fill(),n.angle+=n.speed}),r=requestAnimationFrame(()=>k(e,c,y))};return E(()=>{const e=i.value,c=e.getContext("2d");e.width=256,e.height=256;const y=e.width/2,n=e.height/2;u(),k(c,y,n)}),M(()=>{cancelAnimationFrame(r)}),E(()=>{h=setInterval(w,500),b()}),M(()=>{clearInterval(h)}),(e,c)=>(f(),S("div",ae,[x("div",se,[x("canvas",{ref_key:"canvas",ref:i,class:"absolute inset-0 w-full h-full pointer-events-none z-50"},null,512),x("div",ne,[o(P,{name:"fade-scale",mode:"out-in"},{default:$(()=>[t.isChecking?(f(),I(a(C),{icon:a(Q),class:v([[a(s).appLoadingIcon],"text-6xl"]),style:T({transform:`translate(${m.value}px, ${p.value}px)`}),key:"loading"},null,8,["icon","class","style"])):t.isSuccess?(f(),I(a(C),{icon:a(Z),class:v([[a(s).appLoadingIcon],"text-6xl"]),key:"success"},null,8,["icon","class"])):t.isError?(f(),I(a(C),{icon:a(ee),class:v([[a(s).appLoadingIcon],"text-6xl"]),key:"error"},null,8,["icon","class"])):z("",!0)]),_:1}),o(P,{name:"https",mode:"out-in"},{default:$(()=>[t.isHttps?(f(),S("div",{class:v([[a(s).sslAdvisorBack],"p-2 absolute mt-40 rounded-full"]),key:"https"},[o(a(C),{icon:a(te),class:v([[a(s).sslAdvsisorIcon],"text-xl"])},null,8,["icon","class"])],2)):z("",!0)]),_:1})])])]))}}),ce=N(re,[["__scopeId","data-v-05b57f4d"]]),le={class:"flex items-center justify-cente text-white"},ie=j({__name:"App",setup(t){var g;const{themeClasses:s}=F(),i=l(((g=document.querySelector('meta[name="homedock_csrf_token"]'))==null?void 0:g.getAttribute("content"))||""),r=q("data-port");if(!r)throw new Error("Settings data is missing!");const{selectedPort:m,selectedPath:p}=r,d=l(!0),_=l(!1),h=l(!1),w=l(!1),b=async()=>{if(!m){d.value=!1,h.value=!0;return}try{const u=await K.post("/api/check-port",{port:m},{headers:{"X-HomeDock-CSRF-Token":i.value}});if(u.data.available){const k=u.data.url.toLowerCase();w.value=k.startsWith("https://"),d.value=!1,_.value=!0,setTimeout(()=>{const e=u.data.url+(p?`/${p}`:""),c=window.open(e,"_self");c&&(c.opener=null)},1500);return}}catch{d.value=!1,h.value=!0}};return E(()=>{b()}),(u,k)=>(f(),S(O,null,[o(R),o(V),o(X),o(U),o(W),o(G,{numLines:9,"line-width":2,amplitude:500,"points-per-line":3}),x("div",{class:v([[a(s).back],"flex items-center justify-center relative p-3 overflow-hidden"])},[x("div",le,[o(ce,{isChecking:d.value,isSuccess:_.value,isError:h.value,isHttps:w.value},null,8,["isChecking","isSuccess","isError","isHttps"])])],2)],64))}});function H(t){var i;const s=(i=document.getElementById(t))==null?void 0:i.textContent;if(s)try{const r=atob(s);return JSON.parse(r)}catch(r){console.error(`Error parsing data from element #${t}:`,r)}else console.error(`Element with ID '${t}' not found or is empty.`);return null}const A=H("data-theme"),B=H("data-port");if(A&&B)try{const t=Y(ie);t.provide("data-theme",{selectedTheme:A.selected_theme,selectedBack:A.selected_back}),t.provide("data-port",{selectedPort:B.selected_port,selectedPath:B.selected_path});const s=J();t.use(s),t.mount("#app-app-root")}catch(t){console.error("Error initializing the Vue app:",t)}else console.error("Required data (data-theme or data-initial) is missing or invalid.");