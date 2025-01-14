import{a4 as w,ao as G,W as H,Q as L,U as K,S as X,$ as Z,ay as j,d as I,M as u,E as x,e as f,P as $,F as V,r as F,az as z,J as M,C as Y,D as Q,G as U,L as q,H as J}from"./hdos_C2fhjokps979OUqF3fp3n.js";import{K as ee,C as te,l as re}from"./hdos_BfqkMFbo0NHS7bFBd23qy.js";import{l as ne}from"./hdos_X002W5luTqNeBPpXT63kl.js";import{C as oe}from"./hdos_C3pXxIntKD65gx9B_7H9_.js";import{u as se}from"./hdos_Cmy8JTw8L-tmrunM0U5HM.js";import{T as le}from"./hdos_DS45L8KPpsziPTpyfMLL-.js";const ie=["normal","exception","active","success"],A=()=>({prefixCls:String,type:w(),percent:Number,format:G(),status:w(),showInfo:H(),strokeWidth:Number,strokeLinecap:w(),strokeColor:L(),trailColor:String,width:Number,success:K(),gapDegree:Number,gapPosition:w(),size:X([String,Number,Array]),steps:Number,successPercent:Number,title:String,progressStatus:w()});function P(e){return!e||e<0?0:e>100?100:e}function D(e){let{success:t,successPercent:n}=e,r=n;return t&&"progress"in t&&(Z(!1,"Progress","`success.progress` is deprecated. Please use `success.percent` instead."),r=t.progress),t&&"percent"in t&&(r=t.percent),r}function ae(e){let{percent:t,success:n,successPercent:r}=e;const o=P(D({success:n,successPercent:r}));return[o,P(P(t)-o)]}function ce(e){let{success:t={},strokeColor:n}=e;const{strokeColor:r}=t;return[r||j.green,n||null]}const W=(e,t,n)=>{var r,o,p,l;let s=-1,i=-1;if(t==="step"){const m=n.steps,d=n.strokeWidth;typeof e=="string"||typeof e>"u"?(s=e==="small"?2:14,i=d??8):typeof e=="number"?[s,i]=[e,e]:[s=14,i=8]=e,s*=m}else if(t==="line"){const m=n==null?void 0:n.strokeWidth;typeof e=="string"||typeof e>"u"?i=m||(e==="small"?6:8):typeof e=="number"?[s,i]=[e,e]:[s=-1,i=8]=e}else(t==="circle"||t==="dashboard")&&(typeof e=="string"||typeof e>"u"?[s,i]=e==="small"?[60,60]:[120,120]:typeof e=="number"?[s,i]=[e,e]:(s=(o=(r=e[0])!==null&&r!==void 0?r:e[1])!==null&&o!==void 0?o:120,i=(l=(p=e[0])!==null&&p!==void 0?p:e[1])!==null&&l!==void 0?l:120));return{width:s,height:i}};var ue=function(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);return n};const de=()=>x(x({},A()),{strokeColor:L(),direction:w()}),fe=e=>{let t=[];return Object.keys(e).forEach(n=>{const r=parseFloat(n.replace(/%/g,""));isNaN(r)||t.push({key:r,value:e[n]})}),t=t.sort((n,r)=>n.key-r.key),t.map(n=>{let{key:r,value:o}=n;return`${o} ${r}%`}).join(", ")},ge=(e,t)=>{const{from:n=j.blue,to:r=j.blue,direction:o=t==="rtl"?"to left":"to right"}=e,p=ue(e,["from","to","direction"]);if(Object.keys(p).length!==0){const l=fe(p);return{backgroundImage:`linear-gradient(${o}, ${l})`}}return{backgroundImage:`linear-gradient(${o}, ${n}, ${r})`}},pe=I({compatConfig:{MODE:3},name:"ProgressLine",inheritAttrs:!1,props:de(),setup(e,t){let{slots:n,attrs:r}=t;const o=u(()=>{const{strokeColor:a,direction:g}=e;return a&&typeof a!="string"?ge(a,g):{backgroundColor:a}}),p=u(()=>e.strokeLinecap==="square"||e.strokeLinecap==="butt"?0:void 0),l=u(()=>e.trailColor?{backgroundColor:e.trailColor}:void 0),s=u(()=>{var a;return(a=e.size)!==null&&a!==void 0?a:[-1,e.strokeWidth||(e.size==="small"?6:8)]}),i=u(()=>W(s.value,"line",{strokeWidth:e.strokeWidth})),m=u(()=>{const{percent:a}=e;return x({width:`${P(a)}%`,height:`${i.value.height}px`,borderRadius:p.value},o.value)}),d=u(()=>D(e)),v=u(()=>{const{success:a}=e;return{width:`${P(d.value)}%`,height:`${i.value.height}px`,borderRadius:p.value,backgroundColor:a==null?void 0:a.strokeColor}}),h={width:i.value.width<0?"100%":i.value.width,height:`${i.value.height}px`};return()=>{var a;return f(V,null,[f("div",$($({},r),{},{class:[`${e.prefixCls}-outer`,r.class],style:[r.style,h]}),[f("div",{class:`${e.prefixCls}-inner`,style:l.value},[f("div",{class:`${e.prefixCls}-bg`,style:m.value},null),d.value!==void 0?f("div",{class:`${e.prefixCls}-success-bg`,style:v.value},null):null])]),(a=n.default)===null||a===void 0?void 0:a.call(n)])}}}),he={percent:0,prefixCls:"vc-progress",strokeColor:"#2db7f5",strokeLinecap:"round",strokeWidth:1,trailColor:"#D9D9D9",trailWidth:1},me=e=>{const t=F(null);return z(()=>{const n=Date.now();let r=!1;e.value.forEach(o=>{const p=(o==null?void 0:o.$el)||o;if(!p)return;r=!0;const l=p.style;l.transitionDuration=".3s, .3s, .3s, .06s",t.value&&n-t.value<100&&(l.transitionDuration="0s, 0s")}),r&&(t.value=Date.now())}),e},Ce={gapDegree:Number,gapPosition:{type:String},percent:{type:[Array,Number]},prefixCls:String,strokeColor:{type:[Object,String,Array]},strokeLinecap:{type:String},strokeWidth:Number,trailColor:String,trailWidth:Number,transition:String};var ye=function(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);return n};let _=0;function N(e){return+e.replace("%","")}function R(e){return Array.isArray(e)?e:[e]}function T(e,t,n,r){let o=arguments.length>4&&arguments[4]!==void 0?arguments[4]:0,p=arguments.length>5?arguments[5]:void 0;const l=50-r/2;let s=0,i=-l,m=0,d=-2*l;switch(p){case"left":s=-l,i=0,m=2*l,d=0;break;case"right":s=l,i=0,m=-2*l,d=0;break;case"bottom":i=l,d=2*l;break}const v=`M 50,50 m ${s},${i}
   a ${l},${l} 0 1 1 ${m},${-d}
   a ${l},${l} 0 1 1 ${-m},${d}`,h=Math.PI*2*l,a={stroke:n,strokeDasharray:`${t/100*(h-o)}px ${h}px`,strokeDashoffset:`-${o/2+e/100*(h-o)}px`,transition:"stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s, stroke-width .06s ease .3s, opacity .3s ease 0s"};return{pathString:v,pathStyle:a}}const ve=I({compatConfig:{MODE:3},name:"VCCircle",props:M(Ce,he),setup(e){_+=1;const t=F(_),n=u(()=>R(e.percent)),r=u(()=>R(e.strokeColor)),[o,p]=se();me(p);const l=()=>{const{prefixCls:s,strokeWidth:i,strokeLinecap:m,gapDegree:d,gapPosition:v}=e;let h=0;return n.value.map((a,g)=>{const c=r.value[g]||r.value[r.value.length-1],b=Object.prototype.toString.call(c)==="[object Object]"?`url(#${s}-gradient-${t.value})`:"",{pathString:y,pathStyle:S}=T(h,a,c,i,d,v);h+=a;const k={key:g,d:y,stroke:b,"stroke-linecap":m,"stroke-width":i,opacity:a===0?0:1,"fill-opacity":"0",class:`${s}-circle-path`,style:S};return f("path",$({ref:o(g)},k),null)})};return()=>{const{prefixCls:s,strokeWidth:i,trailWidth:m,gapDegree:d,gapPosition:v,trailColor:h,strokeLinecap:a,strokeColor:g}=e,c=ye(e,["prefixCls","strokeWidth","trailWidth","gapDegree","gapPosition","trailColor","strokeLinecap","strokeColor"]),{pathString:b,pathStyle:y}=T(0,100,h,i,d,v);delete c.percent;const S=r.value.find(C=>Object.prototype.toString.call(C)==="[object Object]"),k={d:b,stroke:h,"stroke-linecap":a,"stroke-width":m||i,"fill-opacity":"0",class:`${s}-circle-trail`,style:y};return f("svg",$({class:`${s}-circle`,viewBox:"0 0 100 100"},c),[S&&f("defs",null,[f("linearGradient",{id:`${s}-gradient-${t.value}`,x1:"100%",y1:"0%",x2:"0%",y2:"0%"},[Object.keys(S).sort((C,O)=>N(C)-N(O)).map((C,O)=>f("stop",{key:O,offset:C,"stop-color":S[C]},null))])]),f("path",k,null),l().reverse()])}}}),be=()=>x(x({},A()),{strokeColor:L()}),$e=3,Se=e=>$e/e*100,ke=I({compatConfig:{MODE:3},name:"ProgressCircle",inheritAttrs:!1,props:M(be(),{trailColor:null}),setup(e,t){let{slots:n,attrs:r}=t;const o=u(()=>{var c;return(c=e.width)!==null&&c!==void 0?c:120}),p=u(()=>{var c;return(c=e.size)!==null&&c!==void 0?c:[o.value,o.value]}),l=u(()=>W(p.value,"circle")),s=u(()=>{if(e.gapDegree||e.gapDegree===0)return e.gapDegree;if(e.type==="dashboard")return 75}),i=u(()=>({width:`${l.value.width}px`,height:`${l.value.height}px`,fontSize:`${l.value.width*.15+6}px`})),m=u(()=>{var c;return(c=e.strokeWidth)!==null&&c!==void 0?c:Math.max(Se(l.value.width),6)}),d=u(()=>e.gapPosition||e.type==="dashboard"&&"bottom"||void 0),v=u(()=>ae(e)),h=u(()=>Object.prototype.toString.call(e.strokeColor)==="[object Object]"),a=u(()=>ce({success:e.success,strokeColor:e.strokeColor})),g=u(()=>({[`${e.prefixCls}-inner`]:!0,[`${e.prefixCls}-circle-gradient`]:h.value}));return()=>{var c;const b=f(ve,{percent:v.value,strokeWidth:m.value,trailWidth:m.value,strokeColor:a.value,strokeLinecap:e.strokeLinecap,trailColor:e.trailColor,prefixCls:e.prefixCls,gapDegree:s.value,gapPosition:d.value},null);return f("div",$($({},r),{},{class:[g.value,r.class],style:[r.style,i.value]}),[l.value.width<=20?f(le,null,{default:()=>[f("span",null,[b])],title:n.default}):f(V,null,[b,(c=n.default)===null||c===void 0?void 0:c.call(n)])])}}}),xe=()=>x(x({},A()),{steps:Number,strokeColor:X(),trailColor:String}),Pe=I({compatConfig:{MODE:3},name:"Steps",props:xe(),setup(e,t){let{slots:n}=t;const r=u(()=>Math.round(e.steps*((e.percent||0)/100))),o=u(()=>{var s;return(s=e.size)!==null&&s!==void 0?s:[e.size==="small"?2:14,e.strokeWidth||8]}),p=u(()=>W(o.value,"step",{steps:e.steps,strokeWidth:e.strokeWidth||8})),l=u(()=>{const{steps:s,strokeColor:i,trailColor:m,prefixCls:d}=e,v=[];for(let h=0;h<s;h+=1){const a=Array.isArray(i)?i[h]:i,g={[`${d}-steps-item`]:!0,[`${d}-steps-item-active`]:h<=r.value-1};v.push(f("div",{key:h,class:g,style:{backgroundColor:h<=r.value-1?a:m,width:`${p.value.width/s}px`,height:`${p.value.height}px`}},null))}return v});return()=>{var s;return f("div",{class:`${e.prefixCls}-steps-outer`},[l.value,(s=n.default)===null||s===void 0?void 0:s.call(n)])}}}),we=new ee("antProgressActive",{"0%":{transform:"translateX(-100%) scaleX(0)",opacity:.1},"20%":{transform:"translateX(-100%) scaleX(0)",opacity:.5},to:{transform:"translateX(0) scaleX(1)",opacity:0}}),Oe=e=>{const{componentCls:t,iconCls:n}=e;return{[t]:x(x({},U(e)),{display:"inline-block","&-rtl":{direction:"rtl"},"&-line":{position:"relative",width:"100%",fontSize:e.fontSize,marginInlineEnd:e.marginXS,marginBottom:e.marginXS},[`${t}-outer`]:{display:"inline-block",width:"100%"},[`&${t}-show-info`]:{[`${t}-outer`]:{marginInlineEnd:`calc(-2em - ${e.marginXS}px)`,paddingInlineEnd:`calc(2em + ${e.paddingXS}px)`}},[`${t}-inner`]:{position:"relative",display:"inline-block",width:"100%",overflow:"hidden",verticalAlign:"middle",backgroundColor:e.progressRemainingColor,borderRadius:e.progressLineRadius},[`${t}-inner:not(${t}-circle-gradient)`]:{[`${t}-circle-path`]:{stroke:e.colorInfo}},[`${t}-success-bg, ${t}-bg`]:{position:"relative",backgroundColor:e.colorInfo,borderRadius:e.progressLineRadius,transition:`all ${e.motionDurationSlow} ${e.motionEaseInOutCirc}`},[`${t}-success-bg`]:{position:"absolute",insetBlockStart:0,insetInlineStart:0,backgroundColor:e.colorSuccess},[`${t}-text`]:{display:"inline-block",width:"2em",marginInlineStart:e.marginXS,color:e.progressInfoTextColor,lineHeight:1,whiteSpace:"nowrap",textAlign:"start",verticalAlign:"middle",wordBreak:"normal",[n]:{fontSize:e.fontSize}},[`&${t}-status-active`]:{[`${t}-bg::before`]:{position:"absolute",inset:0,backgroundColor:e.colorBgContainer,borderRadius:e.progressLineRadius,opacity:0,animationName:we,animationDuration:e.progressActiveMotionDuration,animationTimingFunction:e.motionEaseOutQuint,animationIterationCount:"infinite",content:'""'}},[`&${t}-status-exception`]:{[`${t}-bg`]:{backgroundColor:e.colorError},[`${t}-text`]:{color:e.colorError}},[`&${t}-status-exception ${t}-inner:not(${t}-circle-gradient)`]:{[`${t}-circle-path`]:{stroke:e.colorError}},[`&${t}-status-success`]:{[`${t}-bg`]:{backgroundColor:e.colorSuccess},[`${t}-text`]:{color:e.colorSuccess}},[`&${t}-status-success ${t}-inner:not(${t}-circle-gradient)`]:{[`${t}-circle-path`]:{stroke:e.colorSuccess}}})}},Ie=e=>{const{componentCls:t,iconCls:n}=e;return{[t]:{[`${t}-circle-trail`]:{stroke:e.progressRemainingColor},[`&${t}-circle ${t}-inner`]:{position:"relative",lineHeight:1,backgroundColor:"transparent"},[`&${t}-circle ${t}-text`]:{position:"absolute",insetBlockStart:"50%",insetInlineStart:0,width:"100%",margin:0,padding:0,color:e.colorText,lineHeight:1,whiteSpace:"normal",textAlign:"center",transform:"translateY(-50%)",[n]:{fontSize:`${e.fontSize/e.fontSizeSM}em`}},[`${t}-circle&-status-exception`]:{[`${t}-text`]:{color:e.colorError}},[`${t}-circle&-status-success`]:{[`${t}-text`]:{color:e.colorSuccess}}},[`${t}-inline-circle`]:{lineHeight:1,[`${t}-inner`]:{verticalAlign:"bottom"}}}},De=e=>{const{componentCls:t}=e;return{[t]:{[`${t}-steps`]:{display:"inline-block","&-outer":{display:"flex",flexDirection:"row",alignItems:"center"},"&-item":{flexShrink:0,minWidth:e.progressStepMinWidth,marginInlineEnd:e.progressStepMarginInlineEnd,backgroundColor:e.progressRemainingColor,transition:`all ${e.motionDurationSlow}`,"&-active":{backgroundColor:e.colorInfo}}}}}},Ae=e=>{const{componentCls:t,iconCls:n}=e;return{[t]:{[`${t}-small&-line, ${t}-small&-line ${t}-text ${n}`]:{fontSize:e.fontSizeSM}}}},We=Y("Progress",e=>{const t=e.marginXXS/2,n=Q(e,{progressLineRadius:100,progressInfoTextColor:e.colorText,progressDefaultColor:e.colorInfo,progressRemainingColor:e.colorFillSecondary,progressStepMarginInlineEnd:t,progressStepMinWidth:t,progressActiveMotionDuration:"2.4s"});return[Oe(n),Ie(n),De(n),Ae(n)]});var je=function(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);return n};const Le=I({compatConfig:{MODE:3},name:"AProgress",inheritAttrs:!1,props:M(A(),{type:"line",percent:0,showInfo:!0,trailColor:null,size:"default",strokeLinecap:"round"}),slots:Object,setup(e,t){let{slots:n,attrs:r}=t;const{prefixCls:o,direction:p}=q("progress",e),[l,s]=We(o),i=u(()=>Array.isArray(e.strokeColor)?e.strokeColor[0]:e.strokeColor),m=u(()=>{const{percent:g=0}=e,c=D(e);return parseInt(c!==void 0?c.toString():g.toString(),10)}),d=u(()=>{const{status:g}=e;return!ie.includes(g)&&m.value>=100?"success":g||"normal"}),v=u(()=>{const{type:g,showInfo:c,size:b}=e,y=o.value;return{[y]:!0,[`${y}-inline-circle`]:g==="circle"&&W(b,"circle").width<=20,[`${y}-${g==="dashboard"&&"circle"||g}`]:!0,[`${y}-status-${d.value}`]:!0,[`${y}-show-info`]:c,[`${y}-${b}`]:b,[`${y}-rtl`]:p.value==="rtl",[s.value]:!0}}),h=u(()=>typeof e.strokeColor=="string"||Array.isArray(e.strokeColor)?e.strokeColor:void 0),a=()=>{const{showInfo:g,format:c,type:b,percent:y,title:S}=e,k=D(e);if(!g)return null;let C;const O=c||(n==null?void 0:n.format)||(B=>`${B}%`),E=b==="line";return c||n!=null&&n.format||d.value!=="exception"&&d.value!=="success"?C=O(P(y),P(k)):d.value==="exception"?C=E?f(te,null,null):f(re,null,null):d.value==="success"&&(C=E?f(oe,null,null):f(ne,null,null)),f("span",{class:`${o.value}-text`,title:S===void 0&&typeof C=="string"?C:void 0},[C])};return()=>{const{type:g,steps:c,title:b}=e,{class:y}=r,S=je(r,["class"]),k=a();let C;return g==="line"?C=c?f(Pe,$($({},e),{},{strokeColor:h.value,prefixCls:o.value,steps:c}),{default:()=>[k]}):f(pe,$($({},e),{},{strokeColor:i.value,prefixCls:o.value,direction:p.value}),{default:()=>[k]}):(g==="circle"||g==="dashboard")&&(C=f(ke,$($({},e),{},{prefixCls:o.value,strokeColor:i.value,progressStatus:d.value}),{default:()=>[k]})),l(f("div",$($({role:"progressbar"},S),{},{class:[v.value,y],title:b}),[C]))}}}),Xe=J(Le),Ve={width:24,height:24,body:'<path fill="currentColor" d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18c-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18c.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9M12 4.15L5 8.09v7.82l7 3.94l7-3.94V8.09l-7-3.94Z"/>'},Fe={width:24,height:24,body:'<path fill="currentColor" d="M18 15.38L12 12V5.32l6 3.37v6.69m3 1.12c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18c-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18c.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9M12 4.15L5 8.09v7.82l7 3.94l7-3.94V8.09l-7-3.94Z"/>'},Be={width:24,height:24,body:'<path fill="currentColor" d="m12 5.32l6 3.37v6.62l-6 3.37l-5.94-3.34L12 12V5.32m9 11.18c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18c-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18c.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9M12 4.15L5 8.09v7.82l7 3.94l7-3.94V8.09l-7-3.94Z"/>'},Ge={width:24,height:24,body:'<path fill="currentColor" d="m12 5.32l6 3.37v6.62l-6 3.37l-6-3.37V8.69l6-3.37m9 11.18c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18c-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18c.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9M12 4.15L5 8.09v7.82l7 3.94l7-3.94V8.09l-7-3.94Z"/>'};export{Xe as P,Fe as a,Be as b,Ge as c,Ve as d};