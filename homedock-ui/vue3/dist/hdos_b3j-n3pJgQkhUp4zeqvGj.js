import{t as ge,f as Ae,b as Pe,r as W,i as Re,I as x,a as Ee}from"./hdos_DKvxqxWMyn6NThnE3V4Or.js";import{d as k,J as ae,K as M,e as w,M as _,L as j,P as $e,S as Te,b4 as Oe,O as B,r as V,x as ue,aO as Z,ao as le,w as te,H as _e,a8 as me,C,an as F,au as Fe,a9 as ce,ak as Me,Z as Be}from"./hdos_D7aSCFL4UvFrWXA16SYVB.js";import{F as q,V as pe,e as ne,N as he,M as be,C as Ve,o as oe,B as je,R as Le,u as De}from"./hdos_lgSvMSNReVzNZOmcAhJsO.js";import{b as ke}from"./hdos_DU85oPsez3Utv_YdyKXTE.js";const He=k({compatConfig:{MODE:3},name:"AInputGroup",inheritAttrs:!1,props:{prefixCls:String,size:{type:String},compact:{type:Boolean,default:void 0}},setup(e,r){let{slots:n,attrs:a}=r;const{prefixCls:o,direction:h,getPrefixCls:g}=ae("input-group",e),i=q.useInject();q.useProvide(i,{isFormItemInput:!1});const d=M(()=>g("input")),[s,m]=pe(d),c=M(()=>{const l=o.value;return{[`${l}`]:!0,[m.value]:!0,[`${l}-lg`]:e.size==="large",[`${l}-sm`]:e.size==="small",[`${l}-compact`]:e.compact,[`${l}-rtl`]:h.value==="rtl"}});return()=>{var l;return s(w("span",_(_({},a),{},{class:j(c.value,a.class)}),[(l=n.default)===null||l===void 0?void 0:l.call(n)]))}}}),de=e=>e!=null&&(Array.isArray(e)?$e(e).length:!0);function Ne(e){return de(e.addonBefore)||de(e.addonAfter)}const Ge=["text","input"],Ze=k({compatConfig:{MODE:3},name:"ClearableLabeledInput",inheritAttrs:!1,props:{prefixCls:String,inputType:Te.oneOf(Oe("text","input")),value:B(),defaultValue:B(),allowClear:{type:Boolean,default:void 0},element:B(),handleReset:Function,disabled:{type:Boolean,default:void 0},direction:{type:String},size:{type:String},suffix:B(),prefix:B(),addonBefore:B(),addonAfter:B(),readonly:{type:Boolean,default:void 0},focused:{type:Boolean,default:void 0},bordered:{type:Boolean,default:!0},triggerFocus:{type:Function},hidden:Boolean,status:String,hashId:String},setup(e,r){let{slots:n,attrs:a}=r;const o=q.useInject(),h=i=>{const{value:d,disabled:s,readonly:m,handleReset:c,suffix:l=n.suffix}=e,b=!s&&!m&&d,S=`${i}-clear-icon`;return w(Ve,{onClick:c,onMousedown:E=>E.preventDefault(),class:j({[`${S}-hidden`]:!b,[`${S}-has-suffix`]:!!l},S),role:"button"},null)},g=(i,d)=>{const{value:s,allowClear:m,direction:c,bordered:l,hidden:b,status:S,addonAfter:E=n.addonAfter,addonBefore:v=n.addonBefore,hashId:R}=e,{status:y,hasFeedback:I}=o;if(!m)return ne(d,{value:s,disabled:e.disabled});const z=j(`${i}-affix-wrapper`,`${i}-affix-wrapper-textarea-with-clear-btn`,he(`${i}-affix-wrapper`,be(y,S),I),{[`${i}-affix-wrapper-rtl`]:c==="rtl",[`${i}-affix-wrapper-borderless`]:!l,[`${a.class}`]:!Ne({addonAfter:E,addonBefore:v})&&a.class},R);return w("span",{class:z,style:a.style,hidden:b},[ne(d,{style:null,value:s,disabled:e.disabled}),h(i)])};return()=>{var i;const{prefixCls:d,inputType:s,element:m=(i=n.element)===null||i===void 0?void 0:i.call(n)}=e;return s===Ge[0]?g(d,m):null}}}),qe=`
  min-height:0 !important;
  max-height:none !important;
  height:0 !important;
  visibility:hidden !important;
  overflow:hidden !important;
  position:absolute !important;
  z-index:-1000 !important;
  top:0 !important;
  right:0 !important;
  pointer-events: none !important;
`,Ye=["letter-spacing","line-height","padding-top","padding-bottom","font-family","font-weight","font-size","font-variant","text-rendering","text-transform","width","text-indent","padding-left","padding-right","border-width","box-sizing","word-break","white-space"],X={};let P;function Qe(e){let r=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;const n=e.getAttribute("id")||e.getAttribute("data-reactid")||e.getAttribute("name");if(r&&X[n])return X[n];const a=window.getComputedStyle(e),o=a.getPropertyValue("box-sizing")||a.getPropertyValue("-moz-box-sizing")||a.getPropertyValue("-webkit-box-sizing"),h=parseFloat(a.getPropertyValue("padding-bottom"))+parseFloat(a.getPropertyValue("padding-top")),g=parseFloat(a.getPropertyValue("border-bottom-width"))+parseFloat(a.getPropertyValue("border-top-width")),d={sizingStyle:Ye.map(s=>`${s}:${a.getPropertyValue(s)}`).join(";"),paddingSize:h,borderSize:g,boxSizing:o};return r&&n&&(X[n]=d),d}function Ue(e){let r=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1,n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:null,a=arguments.length>3&&arguments[3]!==void 0?arguments[3]:null;P||(P=document.createElement("textarea"),P.setAttribute("tab-index","-1"),P.setAttribute("aria-hidden","true"),document.body.appendChild(P)),e.getAttribute("wrap")?P.setAttribute("wrap",e.getAttribute("wrap")):P.removeAttribute("wrap");const{paddingSize:o,borderSize:h,boxSizing:g,sizingStyle:i}=Qe(e,r);P.setAttribute("style",`${i};${qe}`),P.value=e.value||e.placeholder||"";let d,s,m,c=P.scrollHeight;if(g==="border-box"?c+=h:g==="content-box"&&(c-=o),n!==null||a!==null){P.value=" ";const b=P.scrollHeight-o;n!==null&&(d=b*n,g==="border-box"&&(d=d+o+h),c=Math.max(d,c)),a!==null&&(s=b*a,g==="border-box"&&(s=s+o+h),m=c>s?"":"hidden",c=Math.min(s,c))}const l={height:`${c}px`,overflowY:m,resize:"none"};return d&&(l.minHeight=`${d}px`),s&&(l.maxHeight=`${s}px`),l}const J=0,K=1,ee=2,We=k({compatConfig:{MODE:3},name:"ResizableTextArea",inheritAttrs:!1,props:ge(),setup(e,r){let{attrs:n,emit:a,expose:o}=r,h,g;const i=V(),d=V({}),s=V(ee);ue(()=>{Z.cancel(h),Z.cancel(g)});const m=()=>{try{if(i.value&&document.activeElement===i.value.input){const f=i.value.getSelectionStart(),L=i.value.getSelectionEnd(),D=i.value.getScrollTop();i.value.setSelectionRange(f,L),i.value.setScrollTop(D)}}catch{}},c=V(),l=V();le(()=>{const f=e.autoSize||e.autosize;f?(c.value=f.minRows,l.value=f.maxRows):(c.value=void 0,l.value=void 0)});const b=M(()=>!!(e.autoSize||e.autosize)),S=()=>{s.value=J};te([()=>e.value,c,l,b],()=>{b.value&&S()},{immediate:!0});const E=V();te([s,i],()=>{if(i.value)if(s.value===J)s.value=K;else if(s.value===K){const f=Ue(i.value.input,!1,c.value,l.value);s.value=ee,E.value=f}else m()},{immediate:!0,flush:"post"});const v=me(),R=V(),y=()=>{Z.cancel(R.value)},I=f=>{s.value===ee&&(a("resize",f),b.value&&(y(),R.value=Z(()=>{S()})))};ue(()=>{y()}),o({resizeTextarea:()=>{S()},textArea:M(()=>{var f;return(f=i.value)===null||f===void 0?void 0:f.input}),instance:v}),_e(e.autosize===void 0);const $=()=>{const{prefixCls:f,disabled:L}=e,D=oe(e,["prefixCls","onPressEnter","autoSize","autosize","defaultValue","allowClear","type","maxlength","valueModifiers"]),Y=j(f,n.class,{[`${f}-disabled`]:L}),H=b.value?E.value:null,N=[n.style,d.value,H],O=C(C(C({},D),n),{style:N,class:Y});return(s.value===J||s.value===K)&&N.push({overflowX:"hidden",overflowY:"hidden"}),O.autofocus||delete O.autofocus,O.rows===0&&delete O.rows,w(Le,{onResize:I,disabled:!b.value},{default:()=>[w(je,_(_({},O),{},{ref:i,tag:"textarea"}),null)]})};return()=>$()}});function xe(e,r){return[...e||""].slice(0,r).join("")}function fe(e,r,n,a){let o=n;return e?o=xe(n,a):[...r||""].length<n.length&&[...n||""].length>a&&(o=r),o}const Xe=k({compatConfig:{MODE:3},name:"ATextarea",inheritAttrs:!1,props:ge(),setup(e,r){let{attrs:n,expose:a,emit:o}=r;var h;const g=De(),i=q.useInject(),d=M(()=>be(i.status,e.status)),s=F((h=e.value)!==null&&h!==void 0?h:e.defaultValue),m=F(),c=F(""),{prefixCls:l,size:b,direction:S}=ae("input",e),[E,v]=pe(l),R=Fe(),y=M(()=>e.showCount===""||e.showCount||!1),I=M(()=>Number(e.maxlength)>0),z=F(!1),$=F(),f=F(0),L=t=>{z.value=!0,$.value=c.value,f.value=t.currentTarget.selectionStart,o("compositionstart",t)},D=t=>{var u;z.value=!1;let p=t.currentTarget.value;if(I.value){const T=f.value>=e.maxlength+1||f.value===((u=$.value)===null||u===void 0?void 0:u.length);p=fe(T,$.value,p,e.maxlength)}p!==c.value&&(O(p),W(t.currentTarget,t,Q,p)),o("compositionend",t)},Y=me();te(()=>e.value,()=>{var t;"value"in Y.vnode.props,s.value=(t=e.value)!==null&&t!==void 0?t:""});const H=t=>{var u;Pe((u=m.value)===null||u===void 0?void 0:u.textArea,t)},N=()=>{var t,u;(u=(t=m.value)===null||t===void 0?void 0:t.textArea)===null||u===void 0||u.blur()},O=(t,u)=>{s.value!==t&&(e.value===void 0?s.value=t:ce(()=>{var p,T,A;m.value.textArea.value!==c.value&&((A=(p=m.value)===null||p===void 0?void 0:(T=p.instance).update)===null||A===void 0||A.call(T))}),ce(()=>{u&&u()}))},ye=t=>{t.keyCode===13&&o("pressEnter",t),o("keydown",t)},Se=t=>{const{onBlur:u}=e;u==null||u(t),g.onFieldBlur()},Q=t=>{o("update:value",t.target.value),o("change",t),o("input",t),g.onFieldChange()},Ce=t=>{W(m.value.textArea,t,Q),O("",()=>{H()})},se=t=>{let u=t.target.value;if(s.value!==u){if(I.value){const p=t.target,T=p.selectionStart>=e.maxlength+1||p.selectionStart===u.length||!p.selectionStart;u=fe(T,c.value,u,e.maxlength)}W(t.currentTarget,t,Q,u),O(u)}},we=()=>{var t,u;const{class:p}=n,{bordered:T=!0}=e,A=C(C(C({},oe(e,["allowClear"])),n),{class:[{[`${l.value}-borderless`]:!T,[`${p}`]:p&&!y.value,[`${l.value}-sm`]:b.value==="small",[`${l.value}-lg`]:b.value==="large"},he(l.value,d.value),v.value],disabled:R.value,showCount:null,prefixCls:l.value,onInput:se,onChange:se,onBlur:Se,onKeydown:ye,onCompositionstart:L,onCompositionend:D});return!((t=e.valueModifiers)===null||t===void 0)&&t.lazy&&delete A.onInput,w(We,_(_({},A),{},{id:(u=A==null?void 0:A.id)!==null&&u!==void 0?u:g.id.value,ref:m,maxlength:e.maxlength,lazy:e.lazy}),null)};return a({focus:H,blur:N,resizableTextArea:m}),le(()=>{let t=Ae(s.value);!z.value&&I.value&&(e.value===null||e.value===void 0)&&(t=xe(t,e.maxlength)),c.value=t}),()=>{var t;const{maxlength:u,bordered:p=!0,hidden:T}=e,{style:A,class:Ie}=n,ze=C(C(C({},e),n),{prefixCls:l.value,inputType:"text",handleReset:Ce,direction:S.value,bordered:p,style:y.value?void 0:A,hashId:v.value,disabled:(t=e.disabled)!==null&&t!==void 0?t:R.value});let U=w(Ze,_(_({},ze),{},{value:c.value,status:e.status}),{element:we});if(y.value||i.hasFeedback){const re=[...c.value].length;let G="";typeof y.value=="object"?G=y.value.formatter({value:c.value,count:re,maxlength:u}):G=`${re}${I.value?` / ${u}`:""}`,U=w("div",{hidden:T,class:j(`${l.value}-textarea`,{[`${l.value}-textarea-rtl`]:S.value==="rtl",[`${l.value}-textarea-show-count`]:y.value,[`${l.value}-textarea-in-form-item`]:i.isFormItemInput},`${l.value}-textarea-show-count`,Ie,v.value),style:A,"data-count":typeof G!="object"?G:void 0},[U,i.hasFeedback&&w("span",{class:`${l.value}-textarea-suffix`},[i.feedbackIcon])])}return E(U)}}});var Je={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M942.2 486.2Q889.47 375.11 816.7 305l-50.88 50.88C807.31 395.53 843.45 447.4 874.7 512 791.5 684.2 673.4 766 512 766q-72.67 0-133.87-22.38L323 798.75Q408 838 512 838q288.3 0 430.2-300.3a60.29 60.29 0 000-51.5zm-63.57-320.64L836 122.88a8 8 0 00-11.32 0L715.31 232.2Q624.86 186 512 186q-288.3 0-430.2 300.3a60.3 60.3 0 000 51.5q56.69 119.4 136.5 191.41L112.48 835a8 8 0 000 11.31L155.17 889a8 8 0 0011.31 0l712.15-712.12a8 8 0 000-11.32zM149.3 512C232.6 339.8 350.7 258 512 258c54.54 0 104.13 9.36 149.12 28.39l-70.3 70.3a176 176 0 00-238.13 238.13l-83.42 83.42C223.1 637.49 183.3 582.28 149.3 512zm246.7 0a112.11 112.11 0 01146.2-106.69L401.31 546.2A112 112 0 01396 512z"}},{tag:"path",attrs:{d:"M508 624c-3.46 0-6.87-.16-10.25-.47l-52.82 52.82a176.09 176.09 0 00227.42-227.42l-52.82 52.82c.31 3.38.47 6.79.47 10.25a111.94 111.94 0 01-112 112z"}}]},name:"eye-invisible",theme:"outlined"};function ve(e){for(var r=1;r<arguments.length;r++){var n=arguments[r]!=null?Object(arguments[r]):{},a=Object.keys(n);typeof Object.getOwnPropertySymbols=="function"&&(a=a.concat(Object.getOwnPropertySymbols(n).filter(function(o){return Object.getOwnPropertyDescriptor(n,o).enumerable}))),a.forEach(function(o){Ke(e,o,n[o])})}return e}function Ke(e,r,n){return r in e?Object.defineProperty(e,r,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[r]=n,e}var ie=function(r,n){var a=ve({},r,n.attrs);return w(Me,ve({},a,{icon:Je}),null)};ie.displayName="EyeInvisibleOutlined";ie.inheritAttrs=!1;var et=function(e,r){var n={};for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&r.indexOf(a)<0&&(n[a]=e[a]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,a=Object.getOwnPropertySymbols(e);o<a.length;o++)r.indexOf(a[o])<0&&Object.prototype.propertyIsEnumerable.call(e,a[o])&&(n[a[o]]=e[a[o]]);return n};const tt={click:"onClick",hover:"onMouseover"},nt=e=>e?w(ke,null,null):w(ie,null,null),at=k({compatConfig:{MODE:3},name:"AInputPassword",inheritAttrs:!1,props:C(C({},Re()),{prefixCls:String,inputPrefixCls:String,action:{type:String,default:"click"},visibilityToggle:{type:Boolean,default:!0},visible:{type:Boolean,default:void 0},"onUpdate:visible":Function,iconRender:Function}),setup(e,r){let{slots:n,attrs:a,expose:o,emit:h}=r;const g=F(!1),i=()=>{const{disabled:v}=e;v||(g.value=!g.value,h("update:visible",g.value))};le(()=>{e.visible!==void 0&&(g.value=!!e.visible)});const d=F();o({focus:()=>{var v;(v=d.value)===null||v===void 0||v.focus()},blur:()=>{var v;(v=d.value)===null||v===void 0||v.blur()}});const c=v=>{const{action:R,iconRender:y=n.iconRender||nt}=e,I=tt[R]||"",z=y(g.value),$={[I]:i,class:`${v}-icon`,key:"passwordIcon",onMousedown:f=>{f.preventDefault()},onMouseup:f=>{f.preventDefault()}};return ne(Be(z)?z:w("span",null,[z]),$)},{prefixCls:l,getPrefixCls:b}=ae("input-password",e),S=M(()=>b("input",e.inputPrefixCls)),E=()=>{const{size:v,visibilityToggle:R}=e,y=et(e,["size","visibilityToggle"]),I=R&&c(l.value),z=j(l.value,a.class,{[`${l.value}-${v}`]:!!v}),$=C(C(C({},oe(y,["suffix","iconRender","action"])),a),{type:g.value?"text":"password",class:z,prefixCls:S.value,suffix:I});return v&&($.size=v),w(x,_({ref:d},$),n)};return()=>E()}});x.Group=He;x.Search=Ee;x.TextArea=Xe;x.Password=at;x.install=function(e){return e.component(x.name,x),e.component(x.Group.name,x.Group),e.component(x.Search.name,x.Search),e.component(x.TextArea.name,x.TextArea),e.component(x.Password.name,x.Password),e};export{at as I};
