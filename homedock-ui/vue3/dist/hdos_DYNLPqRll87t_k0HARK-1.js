import{n as e}from"./hdos_Dd_uD5pTc47_Tz_uT_MGp.js";import{$n as t,E as n,Ht as r,J as i,Lt as a,On as o,Yt as s,Zn as c,_ as l,b as u,bt as d,ct as ee,er as f,et as p,fn as m,ft as h,g,gt as _,it as v,k as y,mt as b,o as x,qt as S,tr as C,tt as w,u as T,v as E,vn as D,w as O,wn as k,wt as A,xn as j,xt as M,y as N}from"./hdos_D2BQ9i86mLac4AwOM-XJP.js";import{S as te,w as P}from"./hdos_CLw9PYon_oj7cLR41CBXj.js";import{a as F,c as I,d as L,f as R,l as z,m as B,o as V,p as ne,s as H,u as re}from"./hdos_BDQ4s84kX23vrosL_Ixol.js";
/*
* Prism Window Manager (@prism-wm)
* Copyright (C) 2023-2026 Banshee Technologies S.L.
* Authors: Claudio González, Néstor González
* https://www.banshee.pro/
*
* Extracted from HomeDock OS: https://github.com/BansheeTech/HomeDockOS
*
* @license AGPL-3.0-or-later
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
*
* SPDX-License-Identifier: AGPL-3.0-or-later
*/
var U=.75,W=12e4,G=3e5,ie=5e3;function ae(){let e=navigator.deviceMemory;return!e||e<2?4:e<=2?2:e<=4?4:e<=8?6:8}function oe(){let e=performance.memory;return e?e.usedJSHeapSize/e.jsHeapSizeLimit>U:!1}var K=class{constructor(e=()=>Date.now()){this.tracked=new Map,this.interval=null,this.now=e}onMinimize(e,t){this.tracked.set(e,{id:e,minimizedAt:this.now(),destroy:t}),this.start()}onRestore(e){this.tracked.delete(e),this.stopIfEmpty()}dispose(){this.tracked.clear(),this.stopIfEmpty()}expired(e){let t=this.now();return Array.from(this.tracked.values()).filter(n=>t-n.minimizedAt>e).sort((e,t)=>e.minimizedAt-t.minimizedAt)}cleanupOldest(e=1){let t=Array.from(this.tracked.values()).sort((e,t)=>e.minimizedAt-t.minimizedAt);for(let n=0;n<Math.min(e,t.length);n++)t[n].destroy(),this.tracked.delete(t[n].id);this.stopIfEmpty()}start(){this.interval||=setInterval(()=>this.tick(),ie)}tick(){let e=ae(),t=this.tracked.size;if(oe()&&t>0){this.cleanupOldest(1);return}let n=this.expired(G);if(n.length>0){for(let e of n)e.destroy(),this.tracked.delete(e.id);this.stopIfEmpty();return}if(t>e){let n=this.expired(W),r=Math.min(n.length,t-e);for(let e=0;e<r;e++)n[e].destroy(),this.tracked.delete(n[e].id);this.stopIfEmpty()}}stopIfEmpty(){this.tracked.size===0&&this.interval&&(clearInterval(this.interval),this.interval=null)}},q=`__pwm_dialog`,se=e({DEFAULT_LABELS:()=>J,DEFAULT_MIN_HEIGHT:()=>300,DEFAULT_MIN_WIDTH:()=>400,DIALOG_BOUNDARY_MARGIN:()=>16,EMPTY_CLASSES:()=>Y,KEEP_ON_SCREEN:()=>100,PRISM_CONTEXT:()=>X,PWM_CLOSE_ANIMATION_MS:()=>200,PWM_EXTERNAL_DIALOG_APP_ID:()=>q,PWM_MINIMIZE_ANIMATION_MS:()=>200,PWM_OPEN_ANIMATION_MS:()=>200,PWM_UNSNAP_ANIMATION_MS:()=>200,PrismDialog:()=>Te,PrismWindow:()=>Z,PrismWindowManager:()=>$,RamManager:()=>K,SNAP_EDGE_THRESHOLD:()=>20,UNSNAP_DRAG_THRESHOLD:()=>4,WindowManagerStore:()=>F,centerDialog:()=>V,clampDialogPosition:()=>H,clampPosition:()=>I,clampSize:()=>z,computeResize:()=>re,computeSnapBounds:()=>L,computeUnsnapFlip:()=>R,createWindowManager:()=>ce,detectSnapEdge:()=>ne,prefersReducedMotion:()=>B,resolveCapabilities:()=>ue,useWindowManager:()=>le})
/*
* Prism Window Manager (@prism-wm)
* Copyright (C) 2023-2026 Banshee Technologies S.L.
* Authors: Claudio González, Néstor González
* https://www.banshee.pro/
*
* Extracted from HomeDock OS: https://github.com/BansheeTech/HomeDockOS
*
* @license AGPL-3.0-or-later
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
*
* SPDX-License-Identifier: AGPL-3.0-or-later
*/
/*
* Prism Window Manager (@prism-wm)
* Copyright (C) 2023-2026 Banshee Technologies S.L.
* Authors: Claudio González, Néstor González
* https://www.banshee.pro/
*
* Extracted from HomeDock OS: https://github.com/BansheeTech/HomeDockOS
*
* @license AGPL-3.0-or-later
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
*
* SPDX-License-Identifier: AGPL-3.0-or-later
*/
;
/*
* Prism Window Manager (@prism-wm), Vue 3 adapter
* Copyright (C) 2023-2026 Banshee Technologies S.L.
* Authors: Claudio González, Néstor González
* https://www.banshee.pro/
*
* Extracted from HomeDock OS: https://github.com/BansheeTech/HomeDockOS
*
* @license AGPL-3.0-or-later
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
*
* SPDX-License-Identifier: AGPL-3.0-or-later
*/
function ce(e={}){return new F(e)}function le(e){let t=j(e.getState()),n=e.subscribe(()=>{t.value=e.getState()});return h(n),t}
/*
* Prism Window Manager (@prism-wm), Vue 3 adapter
* Copyright (C) 2023-2026 Banshee Technologies S.L.
* Authors: Claudio González, Néstor González
* https://www.banshee.pro/
*
* Extracted from HomeDock OS: https://github.com/BansheeTech/HomeDockOS
*
* @license AGPL-3.0-or-later
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
*
* SPDX-License-Identifier: AGPL-3.0-or-later
*/
var J={minimize:`Minimize`,maximize:`Maximize`,restore:`Restore`,close:`Close`},Y={manager:``,window:``,windowInactive:``,windowActive:``,titleBar:``,title:``,titleActive:``,iconContainer:``,iconContainerActive:``,control:``,closeControl:``,body:``,snapPreview:``,dialogFooter:``,dialogButton:``,dialogButtonPrimary:``,dialogButtonDanger:``},X=Symbol.for(`prism-wm.context.v1`);function ue(e){return{resizable:e?.resizable!==!1,maximizable:e?.maximizable!==!1,minimizable:e?.minimizable!==!1,closeable:e?.closeable!==!1,minWidth:e?.minWidth,minHeight:e?.minHeight,maxWidth:e?.maxWidth,maxHeight:e?.maxHeight}}var de=[`data-pwm-window`,`data-pwm-blocked`,`data-pwm-autoheight`],fe=[`inert`],pe={class:`pwm-window-controls`},me=[`title`],he=[`title`],ge=[`data-glyph`],_e=[`title`],ve=[`inert`],ye=[`data-pwm-slot`],be=[`onPointerdown`],xe=300,Z=y({__name:`PrismWindow`,props:{window:{},isActive:{type:Boolean},isBlocked:{type:Boolean,default:!1}},setup(e){let a=e,_=i(X);if(!_)throw Error(`PrismWindow must be used inside PrismWindowManager`);let v=_,y=g(()=>v.classes.value),S=D(null),w=D(!1),T=null;function O(e){if(v.store.setMeasuredHeight(a.window.id,e),w.value)return;let t=a.window.modality===`window`&&a.window.ownerId?v.store.getWindowById(a.window.ownerId):null,n=V(a.window.width,e,{width:window.innerWidth,height:window.innerHeight},t);v.store.updateWindowPosition(a.window.id,n.x,n.y)}ee(()=>{!a.window.autoHeight||!S.value||(O(S.value.offsetHeight),!(typeof ResizeObserver>`u`)&&(T=new ResizeObserver(()=>{let e=S.value?.offsetHeight;e&&O(e)}),T.observe(S.value)))}),h(()=>{T?.disconnect(),T=null});let k=[`n`,`s`,`e`,`w`,`ne`,`nw`,`se`,`sw`],j=g(()=>v.appearance.value===`cupertino`?[`close`,`minimize`,`maximize`]:[`minimize`,`maximize`,`close`]),F=g(()=>{let e=ue(v.resolveConfig(a.window));return a.window.kind===`dialog`?{...e,resizable:!1,minimizable:!1,maximizable:!1}:e}),I=g(()=>{let e=v.resolveComponent(a.window);return e?m(e):null}),L=D(!B()),z=L.value?setTimeout(()=>L.value=!1,200):null,H=D(!1),U=D(!1),W=null;r(()=>a.window.isMinimized,e=>{if(W&&clearTimeout(W),B()){H.value=!1,U.value=!1;return}H.value=e,U.value=!e,W=setTimeout(()=>{W=null,H.value=!1,U.value=!1},200)});let G=D(!0);r(()=>a.window.isMinimized,e=>{v.ram&&(e?v.ram.onMinimize(a.window.id,()=>G.value=!1):(v.ram.onRestore(a.window.id),G.value=!0))},{immediate:!0});let ie=()=>({width:typeof window<`u`?window.innerWidth:1920,height:typeof window<`u`?window.innerHeight:1080}),ae=g(()=>$.value?{"--pwm-unsnap-from":$.value.transform,"--pwm-unsnap-from-content":$.value.contentTransform}:{}),oe=g(()=>v.isMobile.value&&a.window.kind!==`dialog`?{top:`0`,left:`0`,width:`100vw`,height:`calc(100% - ${v.taskbarHeight.value}px)`,zIndex:a.window.zIndex}:a.window.isMaximized?{top:`0`,left:`0`,width:`100%`,height:`calc(100% - ${v.taskbarHeight.value}px)`,zIndex:a.window.zIndex}:{top:`${a.window.y}px`,left:`${a.window.x}px`,width:`${a.window.width}px`,height:a.window.autoHeight?void 0:`${a.window.height}px`,zIndex:a.window.zIndex});function K(){a.isActive||v.store.focusWindow(a.window.id)}function q(e){if(a.isBlocked){v.store.dismissDialogFor(a.window.id);return}e.target.closest(`.pwm-window-controls`)||K()}function se(){v.store.minimizeWindow(a.window.id)}function ce(){v.store.toggleMaximize(a.window.id)}function le(){v.requestClose(a.window.id)}let J=D(!1),Y=0,Z=null,Q=D(!1),$=D(null);function Se(e,t){var n;try{(n=e.setPointerCapture)==null||n.call(e,t)}catch{}}function Ce(e,t){var n;try{(n=e.releasePointerCapture)==null||n.call(e,t)}catch{}}function we(e){if(a.window.isMaximized||v.isMobile.value||e.button!==0)return;let t=Date.now();if(t-Y<xe){Y=0;return}Y=t,K();let n=e.currentTarget,r=a.window.x,i=a.window.y,o=e.clientX,s=e.clientY,c=!!a.window.isSnapped;J.value=!c;let l=e=>{if(c){if(Math.abs(e.clientX-o)<4&&Math.abs(e.clientY-s)<4)return;c=!1;let t=v.store.getPreSnapBounds(a.window.id);if(t){let n={x:a.window.x,y:a.window.y,width:a.window.width,height:a.window.height},c=(o-a.window.x)/a.window.width;r=o-t.width*c,i=s-20,$.value=R(n,{x:r+(e.clientX-o),y:i+(e.clientY-s),width:t.width,height:t.height}),v.store.unSnapWindow(a.window.id)}J.value=!0,Q.value=!0,Z=setTimeout(()=>{Z=null,Q.value=!1,$.value=null},200)}w.value=!0,v.store.updateWindowPosition(a.window.id,r+(e.clientX-o),i+(e.clientY-s)),!v.isMobile.value&&F.value.maximizable&&v.store.setSnapPreview(ne(e.clientX,ie().width))},u=()=>{v.store.snapPreview&&!v.isMobile.value&&F.value.maximizable&&v.store.snapWindow(a.window.id,v.store.snapPreview,v.taskbarHeight.value),v.store.clearSnapPreview(),Z&&=(clearTimeout(Z),null),Q.value=!1,$.value=null,J.value=!1,Ce(n,e.pointerId),n.removeEventListener(`pointermove`,l),n.removeEventListener(`pointerup`,u),n.removeEventListener(`pointercancel`,u)};Se(n,e.pointerId),n.addEventListener(`pointermove`,l),n.addEventListener(`pointerup`,u),n.addEventListener(`pointercancel`,u),e.preventDefault()}function Te(e){F.value.maximizable&&ce(),e.preventDefault(),e.stopPropagation()}let Ee=D(!1);function De(e,t){if(a.window.isMaximized)return;let n=t.currentTarget,r=t.clientX,i=t.clientY,o=a.window.width,s=a.window.height,c=a.window.x,l=a.window.y;K(),Ee.value=!0;let u=t=>{let n=F.value,u=re({direction:e,deltaX:t.clientX-r,deltaY:t.clientY-i,initialX:c,initialY:l,initialWidth:o,initialHeight:s,minWidth:n.minWidth,minHeight:n.minHeight,maxWidth:n.maxWidth,maxHeight:n.maxHeight});v.store.updateWindowSize(a.window.id,u.width,u.height),(u.x!==c||u.y!==l)&&v.store.updateWindowPosition(a.window.id,u.x,u.y)},d=()=>{Ee.value=!1,Ce(n,t.pointerId),n.removeEventListener(`pointermove`,u),n.removeEventListener(`pointerup`,d),n.removeEventListener(`pointercancel`,d)};Se(n,t.pointerId),n.addEventListener(`pointermove`,u),n.addEventListener(`pointerup`,d),n.addEventListener(`pointercancel`,d),t.preventDefault(),t.stopPropagation()}return h(()=>{z&&clearTimeout(z),Z&&clearTimeout(Z),W&&clearTimeout(W),v.ram&&v.ram.onRestore(a.window.id)}),(r,i)=>s((b(),u(`div`,{class:c([`pwm-window`,[y.value.window,e.isActive?y.value.windowActive:y.value.windowInactive,{"pwm-active":e.isActive,"pwm-dialog":e.window.kind===`dialog`,"pwm-maximized":e.window.isMaximized,"pwm-fullscreen-mobile":o(v).isMobile.value&&e.window.kind!==`dialog`,"pwm-dragging":J.value,"pwm-resizing":Ee.value,"pwm-closing":e.window.isClosing,"pwm-unsnapping":Q.value,"pwm-minimizing":H.value,"pwm-restoring":U.value,"pwm-opening":L.value,[`pwm-${o(v).appearance.value}`]:!0}]]),ref_key:`rootEl`,ref:S,"data-pwm-window":e.window.id,"data-pwm-blocked":e.isBlocked?``:void 0,"data-pwm-autoheight":e.window.autoHeight?``:void 0,style:f([oe.value,ae.value]),onMousedown:q},[l(`div`,{class:c([`pwm-window-header`,y.value.titleBar]),inert:e.isBlocked||void 0},[l(`div`,{class:`pwm-window-header-draggable`,onPointerdown:we,onDblclick:Te},[l(`div`,{class:c([`pwm-window-icon-container`,e.isActive?y.value.iconContainerActive:y.value.iconContainer])},[M(r.$slots,`icon`,{window:e.window},()=>[i[0]||=l(`svg`,{class:`pwm-fallback-icon`,"data-glyph":`window`,viewBox:`0 0 24 24`,fill:`currentColor`,"aria-hidden":`true`},[l(`path`,{d:`M21.53 5.15a.99.99 0 0 0-.97-.04l-10 5a1 1 0 0 0-.55.89v10a1 1 0 0 0 1 1c.15 0 .31-.04.45-.11l10-5a1 1 0 0 0 .55-.89V6c0-.35-.18-.67-.47-.85ZM20 15.38l-8 4v-7.76l8-4z`}),l(`path`,{d:`m16.55 3.11l-10 5A1 1 0 0 0 6 9v10h2V9.62l9.45-4.72l-.89-1.79Z`}),l(`path`,{d:`m12.55 1.11l-10 5A1 1 0 0 0 2 7v10h2V7.62l9.45-4.73l-.89-1.79Z`})],-1)])],2),l(`span`,{class:c([`pwm-window-title`,e.isActive?y.value.titleActive:y.value.title])},[n(C(e.window.title)+` `,1),M(r.$slots,`titleBarExtra`,{window:e.window})],2)],32),l(`div`,pe,[(b(!0),u(x,null,d(j.value,t=>(b(),u(x,{key:t},[t===`minimize`&&F.value.minimizable?(b(),u(`button`,{key:0,type:`button`,class:c([`pwm-window-control pwm-minimize`,y.value.control]),title:o(v).labels.minimize,"aria-label":`minimize`,onClick:P(se,[`stop`])},[M(r.$slots,`minimize-icon`,{window:e.window},()=>[i[1]||=l(`svg`,{class:`pwm-fallback-icon`,"data-glyph":`minimize`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":`2`,"stroke-linecap":`round`,"aria-hidden":`true`},[l(`path`,{d:`M5 12h14`})],-1)])],10,me)):t===`maximize`&&!o(v).isMobile.value&&F.value.maximizable?(b(),u(`button`,{key:1,type:`button`,class:c([`pwm-window-control pwm-maximize`,y.value.control]),title:e.window.isMaximized?o(v).labels.restore:o(v).labels.maximize,"aria-label":`maximize`,onClick:P(ce,[`stop`])},[M(r.$slots,`maximize-icon`,{window:e.window},()=>[(b(),u(`svg`,{class:`pwm-fallback-icon`,"data-glyph":e.window.isMaximized?`restore`:`maximize`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":`2`,"stroke-linejoin":`round`,"aria-hidden":`true`},[e.window.isMaximized?(b(),u(x,{key:0},[i[2]||=l(`path`,{d:`M8.5 8.5V6.5A1.5 1.5 0 0 1 10 5h7.5A1.5 1.5 0 0 1 19 6.5V14a1.5 1.5 0 0 1-1.5 1.5h-2`},null,-1),i[3]||=l(`rect`,{x:`5`,y:`8.5`,width:`10.5`,height:`10.5`,rx:`1.5`},null,-1),i[4]||=l(`path`,{d:`M5 12h10.5`},null,-1)],64)):(b(),u(x,{key:1},[i[5]||=l(`rect`,{x:`5`,y:`5`,width:`14`,height:`14`,rx:`1.5`},null,-1),i[6]||=l(`path`,{d:`M5 9h14`},null,-1)],64))],8,ge))])],10,he)):t===`close`&&F.value.closeable?(b(),u(`button`,{key:2,type:`button`,class:c([`pwm-window-control pwm-close`,y.value.closeControl]),title:o(v).labels.close,"aria-label":`close`,onClick:P(le,[`stop`])},[M(r.$slots,`close-icon`,{window:e.window},()=>[i[7]||=l(`svg`,{class:`pwm-fallback-icon`,"data-glyph":`close`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":`2`,"stroke-linecap":`round`,"aria-hidden":`true`},[l(`path`,{d:`M6 6l12 12M18 6L6 18`})],-1)])],10,_e)):N(``,!0)],64))),128))])],10,fe),l(`div`,{class:c([`pwm-window-body`,y.value.body]),inert:e.isBlocked||void 0},[e.window.external?(b(),u(`div`,{key:0,class:`pwm-window-slot`,"data-pwm-slot":e.window.id},null,8,ye)):I.value&&G.value?(b(),E(A(I.value),t(p({key:1},e.window.data)),null,16)):M(r.$slots,`loading`,{key:2},()=>[i[8]||=l(`div`,{class:`pwm-window-loading`},[l(`svg`,{class:`pwm-loading-icon`,viewBox:`0 0 24 24`,fill:`none`,role:`status`,"aria-label":`Loading`},[l(`path`,{stroke:`currentColor`,"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M12 3c4.97 0 9 4.03 9 9`})])],-1)])],10,ve),!e.window.isMaximized&&!o(v).isMobile.value&&F.value.resizable?(b(),u(x,{key:0},d(k,e=>l(`div`,{key:e,class:c([`pwm-resize-handle`,`pwm-resize-${e}`]),onPointerdown:P(t=>De(e,t),[`stop`])},null,42,be)),64)):N(``,!0)],46,de)),[[te,!e.window.isMinimized||H.value]])}}),Q={key:0,class:`pwm-modal-layer`},$=y({__name:`PrismWindowManager`,props:{store:{},resolveComponent:{},resolveConfig:{type:Function,default:void 0},taskbarHeight:{default:0},isMobile:{type:Boolean,default:!1},labels:{default:void 0},classes:{default:void 0},enableRamManager:{type:Boolean,default:!0},appearance:{default:`redmond`}},setup(e){let t=e,n=le(t.store),i=g(()=>n.value.windows),a=g(()=>n.value.activeWindowId),o=g(()=>n.value.snapPreview),s=g(()=>n.value.windows.filter(e=>e.kind===`dialog`&&!e.isClosing)),m=g(()=>n.value.windows.filter(e=>e.kind===`dialog`&&(e.modality??`app`)===`app`)),v=g(()=>m.value.filter(e=>!e.isClosing)),y=g(()=>{let e=v.value.length?v.value:m.value;return e.length?Math.min(...e.map(e=>e.zIndex))-1:null}),C=g(()=>m.value.length>0&&v.value.length===0),w=e=>e.kind===`dialog`&&(e.modality??`app`)===`app`,D=g(()=>i.value.filter(w)),A=g(()=>i.value.filter(e=>!w(e))),j=g(()=>new Set(s.value.filter(e=>e.modality===`window`&&e.ownerId).map(e=>e.ownerId))),te=g(()=>({...Y,...t.classes})),P=t.enableRamManager?new K:null,F=new Map;async function I(e){await t.store.requestClose(e)}r(()=>n.value.windows,e=>{for(let n of e)if(!(!n.isClosing||F.has(n.id))){if(B()){t.store.closeWindow(n.id);continue}F.set(n.id,setTimeout(()=>{F.delete(n.id),t.store.closeWindow(n.id)},200))}},{immediate:!0});let L={store:t.store,ram:P,resolveComponent:t.resolveComponent,resolveConfig:t.resolveConfig??(()=>void 0),isMobile:k(t,`isMobile`),appearance:k(t,`appearance`),taskbarHeight:k(t,`taskbarHeight`),labels:{...J,...t.labels},classes:te,requestClose:I};_(X,L);function R(e){if(e.key===`Escape`){let n=t.store.dialogs;if(n.length){I(n.reduce((e,t)=>t.zIndex>e.zIndex?t:e).id),e.preventDefault();return}}let n=a.value;n&&(e.key===`Escape`||e.altKey&&e.key===`F4`)&&(I(n),e.preventDefault())}let z=null;function V(){z=setTimeout(()=>{z=null;let e=document.activeElement;if(!e||e.tagName!==`IFRAME`)return;let n=e.closest(`[data-pwm-window]`)?.getAttribute(`data-pwm-window`);!n||n===t.store.activeWindowId||!t.store.getWindowById(n)||t.store.focusWindow(n)})}return ee(()=>{document.addEventListener(`keydown`,R),window.addEventListener(`blur`,V)}),h(()=>{document.removeEventListener(`keydown`,R),window.removeEventListener(`blur`,V),z&&clearTimeout(z),F.forEach(clearTimeout),F.clear(),P?.dispose()}),(t,n)=>(b(),u(x,null,[l(`div`,{class:c([`pwm-manager`,te.value.manager])},[o.value?(b(),u(`div`,{key:0,class:c([`pwm-snap-preview`,[`pwm-snap-${o.value}`,te.value.snapPreview]]),style:f({height:`calc(100% - ${e.taskbarHeight}px)`})},null,6)):N(``,!0),(b(!0),u(x,null,d(A.value,e=>(b(),E(Z,{key:e.id,window:e,"is-active":e.id===a.value,"is-blocked":j.value.has(e.id)},O({icon:S(e=>[M(t.$slots,`icon`,p({ref_for:!0},e))]),titleBarExtra:S(e=>[M(t.$slots,`titleBarExtra`,p({ref_for:!0},e))]),_:2},[t.$slots.loading?{name:`loading`,fn:S(()=>[M(t.$slots,`loading`)]),key:`0`}:void 0,t.$slots[`minimize-icon`]?{name:`minimize-icon`,fn:S(e=>[M(t.$slots,`minimize-icon`,p({ref_for:!0},e))]),key:`1`}:void 0,t.$slots[`maximize-icon`]?{name:`maximize-icon`,fn:S(e=>[M(t.$slots,`maximize-icon`,p({ref_for:!0},e))]),key:`2`}:void 0,t.$slots[`close-icon`]?{name:`close-icon`,fn:S(e=>[M(t.$slots,`close-icon`,p({ref_for:!0},e))]),key:`3`}:void 0]),1032,[`window`,`is-active`,`is-blocked`]))),128))],2),(b(),E(T,{to:`body`},[y.value!==null||D.value.length?(b(),u(`div`,Q,[y.value===null?N(``,!0):(b(),u(`div`,{key:0,class:c([`pwm-scrim`,{"pwm-scrim-closing":C.value}]),style:f({zIndex:y.value}),onMousedown:n[0]||=t=>e.store.dismissTopDialog()},null,38)),(b(!0),u(x,null,d(D.value,e=>(b(),E(Z,{key:e.id,window:e,"is-active":e.id===a.value,"is-blocked":j.value.has(e.id)},O({icon:S(e=>[M(t.$slots,`icon`,p({ref_for:!0},e))]),titleBarExtra:S(e=>[M(t.$slots,`titleBarExtra`,p({ref_for:!0},e))]),_:2},[t.$slots.loading?{name:`loading`,fn:S(()=>[M(t.$slots,`loading`)]),key:`0`}:void 0,t.$slots[`minimize-icon`]?{name:`minimize-icon`,fn:S(e=>[M(t.$slots,`minimize-icon`,p({ref_for:!0},e))]),key:`1`}:void 0,t.$slots[`maximize-icon`]?{name:`maximize-icon`,fn:S(e=>[M(t.$slots,`maximize-icon`,p({ref_for:!0},e))]),key:`2`}:void 0,t.$slots[`close-icon`]?{name:`close-icon`,fn:S(e=>[M(t.$slots,`close-icon`,p({ref_for:!0},e))]),key:`3`}:void 0]),1032,[`window`,`is-active`,`is-blocked`]))),128))])):N(``,!0)]))],64))}}),Se=[`disabled`],Ce={key:0,class:`pwm-dialog-spinner`,"aria-hidden":`true`},we={key:1},Te=y({__name:`PrismDialog`,props:{store:{},classes:{},visible:{type:Boolean,default:!1},title:{default:``},icon:{},width:{default:420},modality:{default:`app`},ownerId:{},maskClosable:{type:Boolean,default:!1},okText:{default:`OK`},cancelText:{default:`Cancel`},dismissText:{default:``},okCancel:{type:Boolean,default:!0},okDisabled:{type:Boolean,default:!1},okDanger:{type:Boolean,default:!1},loading:{type:Boolean,default:!1},reverseButtons:{type:Boolean,default:!1},closeOnOk:{type:Boolean,default:!0},footer:{type:Boolean,default:!0}},emits:[`update:visible`,`ok`,`cancel`,`dismiss`],setup(e,{expose:t,emit:n}){let o=e,s=n,d=i(X,null),ee=a(),f=g(()=>o.store??d?.store??null),p=g(()=>({...Y,...d?.classes.value??{},...o.classes??{}})),m=g(()=>o.footer&&!ee.footer),h=D(null),_=D(null);function y(){if(!f.value||_.value)return;let e=f.value.openDialog(q,{external:!0,title:o.title,icon:o.icon??null,width:o.width,modality:o.modality,ownerId:o.ownerId,maskClosable:o.maskClosable,onResult:()=>{_.value&&(_.value=null,h.value=null,s(`cancel`),s(`update:visible`,!1))}});_.value=e,x(e)}async function x(e){await w(),await w(),_.value===e&&(h.value=document.querySelector(`[data-pwm-slot="${e}"]`))}function S(){let e=_.value;!e||!f.value||(_.value=null,h.value=null,f.value.beginClose(e))}function O(){s(`ok`),o.closeOnOk&&(S(),s(`update:visible`,!1))}function k(){S(),s(`cancel`),s(`update:visible`,!1)}function A(){S(),s(`dismiss`),s(`update:visible`,!1)}return r(()=>o.visible,e=>e?y():S(),{immediate:!0}),r(()=>o.title,e=>{_.value&&f.value&&f.value.updateWindowTitle(_.value,e)}),v(S),t({close:S}),(t,n)=>h.value?(b(),E(T,{key:0,to:h.value},[M(t.$slots,`default`),M(t.$slots,`footer`,{ok:O,cancel:k,dismiss:A},()=>[m.value?(b(),u(`div`,{key:0,class:c([`pwm-dialog-footer`,[p.value.dialogFooter,{"pwm-dialog-footer-reversed":e.reverseButtons}]])},[e.okCancel?(b(),u(`button`,{key:0,type:`button`,class:c([`pwm-dialog-btn`,p.value.dialogButton]),onClick:k},C(e.cancelText),3)):N(``,!0),e.dismissText?(b(),u(`button`,{key:1,type:`button`,class:c([`pwm-dialog-btn`,p.value.dialogButton]),onClick:A},C(e.dismissText),3)):N(``,!0),l(`button`,{type:`button`,class:c([`pwm-dialog-btn`,[e.okDanger?p.value.dialogButtonDanger:p.value.dialogButtonPrimary,{"pwm-dialog-btn-loading":e.loading}]]),disabled:e.loading||e.okDisabled,onClick:O},[e.loading?(b(),u(`span`,Ce)):(b(),u(`span`,we,C(e.okText),1))],10,Se)],2)):N(``,!0)])],8,[`to`])):N(``,!0)}});export{K as a,q as i,$ as n,se as r,Te as t};