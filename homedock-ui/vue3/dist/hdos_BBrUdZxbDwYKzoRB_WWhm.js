import{y as F,z as L,at as O,C as w,D as V,X as _,E as A,b4 as W,d as X,au as K,K as I,bm as R,r as v,w as j,J as N,o as U,a9 as q,e as o,M,aq as G,aP as b,bn as J,S as c}from"./hdos_D7aSCFL4UvFrWXA16SYVB.js";import{K as C}from"./hdos_CaYxDlfwW2kUaZ5aP_Icr.js";import{u as Q,o as Y}from"./hdos_lgSvMSNReVzNZOmcAhJsO.js";const Z=i=>{const{componentCls:n}=i,e=`${n}-inner`;return{[n]:{[`&${n}-small`]:{minWidth:i.switchMinWidthSM,height:i.switchHeightSM,lineHeight:`${i.switchHeightSM}px`,[`${n}-inner`]:{paddingInlineStart:i.switchInnerMarginMaxSM,paddingInlineEnd:i.switchInnerMarginMinSM,[`${e}-checked`]:{marginInlineStart:`calc(-100% + ${i.switchPinSizeSM+i.switchPadding*2}px - ${i.switchInnerMarginMaxSM*2}px)`,marginInlineEnd:`calc(100% - ${i.switchPinSizeSM+i.switchPadding*2}px + ${i.switchInnerMarginMaxSM*2}px)`},[`${e}-unchecked`]:{marginTop:-i.switchHeightSM,marginInlineStart:0,marginInlineEnd:0}},[`${n}-handle`]:{width:i.switchPinSizeSM,height:i.switchPinSizeSM},[`${n}-loading-icon`]:{top:(i.switchPinSizeSM-i.switchLoadingIconSize)/2,fontSize:i.switchLoadingIconSize},[`&${n}-checked`]:{[`${n}-inner`]:{paddingInlineStart:i.switchInnerMarginMinSM,paddingInlineEnd:i.switchInnerMarginMaxSM,[`${e}-checked`]:{marginInlineStart:0,marginInlineEnd:0},[`${e}-unchecked`]:{marginInlineStart:`calc(100% - ${i.switchPinSizeSM+i.switchPadding*2}px + ${i.switchInnerMarginMaxSM*2}px)`,marginInlineEnd:`calc(-100% + ${i.switchPinSizeSM+i.switchPadding*2}px - ${i.switchInnerMarginMaxSM*2}px)`}},[`${n}-handle`]:{insetInlineStart:`calc(100% - ${i.switchPinSizeSM+i.switchPadding}px)`}},[`&:not(${n}-disabled):active`]:{[`&:not(${n}-checked) ${e}`]:{[`${e}-unchecked`]:{marginInlineStart:i.marginXXS/2,marginInlineEnd:-i.marginXXS/2}},[`&${n}-checked ${e}`]:{[`${e}-checked`]:{marginInlineStart:-i.marginXXS/2,marginInlineEnd:i.marginXXS/2}}}}}}},k=i=>{const{componentCls:n}=i;return{[n]:{[`${n}-loading-icon${i.iconCls}`]:{position:"relative",top:(i.switchPinSize-i.fontSize)/2,color:i.switchLoadingIconColor,verticalAlign:"top"},[`&${n}-checked ${n}-loading-icon`]:{color:i.switchColor}}}},ii=i=>{const{componentCls:n}=i,e=`${n}-handle`;return{[n]:{[e]:{position:"absolute",top:i.switchPadding,insetInlineStart:i.switchPadding,width:i.switchPinSize,height:i.switchPinSize,transition:`all ${i.switchDuration} ease-in-out`,"&::before":{position:"absolute",top:0,insetInlineEnd:0,bottom:0,insetInlineStart:0,backgroundColor:i.colorWhite,borderRadius:i.switchPinSize/2,boxShadow:i.switchHandleShadow,transition:`all ${i.switchDuration} ease-in-out`,content:'""'}},[`&${n}-checked ${e}`]:{insetInlineStart:`calc(100% - ${i.switchPinSize+i.switchPadding}px)`},[`&:not(${n}-disabled):active`]:{[`${e}::before`]:{insetInlineEnd:i.switchHandleActiveInset,insetInlineStart:0},[`&${n}-checked ${e}::before`]:{insetInlineEnd:0,insetInlineStart:i.switchHandleActiveInset}}}}},ni=i=>{const{componentCls:n}=i,e=`${n}-inner`;return{[n]:{[e]:{display:"block",overflow:"hidden",borderRadius:100,height:"100%",paddingInlineStart:i.switchInnerMarginMax,paddingInlineEnd:i.switchInnerMarginMin,transition:`padding-inline-start ${i.switchDuration} ease-in-out, padding-inline-end ${i.switchDuration} ease-in-out`,[`${e}-checked, ${e}-unchecked`]:{display:"block",color:i.colorTextLightSolid,fontSize:i.fontSizeSM,transition:`margin-inline-start ${i.switchDuration} ease-in-out, margin-inline-end ${i.switchDuration} ease-in-out`,pointerEvents:"none"},[`${e}-checked`]:{marginInlineStart:`calc(-100% + ${i.switchPinSize+i.switchPadding*2}px - ${i.switchInnerMarginMax*2}px)`,marginInlineEnd:`calc(100% - ${i.switchPinSize+i.switchPadding*2}px + ${i.switchInnerMarginMax*2}px)`},[`${e}-unchecked`]:{marginTop:-i.switchHeight,marginInlineStart:0,marginInlineEnd:0}},[`&${n}-checked ${e}`]:{paddingInlineStart:i.switchInnerMarginMin,paddingInlineEnd:i.switchInnerMarginMax,[`${e}-checked`]:{marginInlineStart:0,marginInlineEnd:0},[`${e}-unchecked`]:{marginInlineStart:`calc(100% - ${i.switchPinSize+i.switchPadding*2}px + ${i.switchInnerMarginMax*2}px)`,marginInlineEnd:`calc(-100% + ${i.switchPinSize+i.switchPadding*2}px - ${i.switchInnerMarginMax*2}px)`}},[`&:not(${n}-disabled):active`]:{[`&:not(${n}-checked) ${e}`]:{[`${e}-unchecked`]:{marginInlineStart:i.switchPadding*2,marginInlineEnd:-i.switchPadding*2}},[`&${n}-checked ${e}`]:{[`${e}-checked`]:{marginInlineStart:-i.switchPadding*2,marginInlineEnd:i.switchPadding*2}}}}}},ei=i=>{const{componentCls:n}=i;return{[n]:w(w(w(w({},V(i)),{position:"relative",display:"inline-block",boxSizing:"border-box",minWidth:i.switchMinWidth,height:i.switchHeight,lineHeight:`${i.switchHeight}px`,verticalAlign:"middle",background:i.colorTextQuaternary,border:"0",borderRadius:100,cursor:"pointer",transition:`all ${i.motionDurationMid}`,userSelect:"none",[`&:hover:not(${n}-disabled)`]:{background:i.colorTextTertiary}}),_(i)),{[`&${n}-checked`]:{background:i.switchColor,[`&:hover:not(${n}-disabled)`]:{background:i.colorPrimaryHover}},[`&${n}-loading, &${n}-disabled`]:{cursor:"not-allowed",opacity:i.switchDisabledOpacity,"*":{boxShadow:"none",cursor:"not-allowed"}},[`&${n}-rtl`]:{direction:"rtl"}})}},ai=F("Switch",i=>{const n=i.fontSize*i.lineHeight,e=i.controlHeight/2,t=2,h=n-t*2,l=e-t*2,s=L(i,{switchMinWidth:h*2+t*4,switchHeight:n,switchDuration:i.motionDurationMid,switchColor:i.colorPrimary,switchDisabledOpacity:i.opacityLoading,switchInnerMarginMin:h/2,switchInnerMarginMax:h+t+t*2,switchPadding:t,switchPinSize:h,switchBg:i.colorBgContainer,switchMinWidthSM:l*2+t*2,switchHeightSM:e,switchInnerMarginMinSM:l/2,switchInnerMarginMaxSM:l+t+t*2,switchPinSizeSM:l,switchHandleShadow:`0 2px 4px 0 ${new O("#00230b").setAlpha(.2).toRgbString()}`,switchLoadingIconSize:i.fontSizeIcon*.75,switchLoadingIconColor:`rgba(0, 0, 0, ${i.opacityLoading})`,switchHandleActiveInset:"-30%"});return[ei(s),ni(s),ii(s),k(s),Z(s)]}),ci=W("small","default"),ti=()=>({id:String,prefixCls:String,size:c.oneOf(ci),disabled:{type:Boolean,default:void 0},checkedChildren:c.any,unCheckedChildren:c.any,tabindex:c.oneOfType([c.string,c.number]),autofocus:{type:Boolean,default:void 0},loading:{type:Boolean,default:void 0},checked:c.oneOfType([c.string,c.number,c.looseBool]),checkedValue:c.oneOfType([c.string,c.number,c.looseBool]).def(!0),unCheckedValue:c.oneOfType([c.string,c.number,c.looseBool]).def(!1),onChange:{type:Function},onClick:{type:Function},onKeydown:{type:Function},onMouseup:{type:Function},"onUpdate:checked":{type:Function},onBlur:Function,onFocus:Function}),di=X({compatConfig:{MODE:3},name:"ASwitch",__ANT_SWITCH:!0,inheritAttrs:!1,props:ti(),slots:Object,setup(i,n){let{attrs:e,slots:t,expose:h,emit:l}=n;const s=Q(),x=K(),g=I(()=>{var a;return(a=i.disabled)!==null&&a!==void 0?a:x.value});R(()=>{});const S=v(i.checked!==void 0?i.checked:e.defaultChecked),m=I(()=>S.value===i.checkedValue);j(()=>i.checked,()=>{S.value=i.checked});const{prefixCls:d,direction:f,size:y}=N("switch",i),[P,z]=ai(d),u=v(),p=()=>{var a;(a=u.value)===null||a===void 0||a.focus()};h({focus:p,blur:()=>{var a;(a=u.value)===null||a===void 0||a.blur()}}),U(()=>{q(()=>{i.autofocus&&!g.value&&u.value.focus()})});const $=(a,r)=>{g.value||(l("update:checked",a),l("change",a,r),s.onFieldChange())},E=a=>{l("blur",a)},H=a=>{p();const r=m.value?i.unCheckedValue:i.checkedValue;$(r,a),l("click",r,a)},T=a=>{a.keyCode===C.LEFT?$(i.unCheckedValue,a):a.keyCode===C.RIGHT&&$(i.checkedValue,a),l("keydown",a)},D=a=>{var r;(r=u.value)===null||r===void 0||r.blur(),l("mouseup",a)},B=I(()=>({[`${d.value}-small`]:y.value==="small",[`${d.value}-loading`]:i.loading,[`${d.value}-checked`]:m.value,[`${d.value}-disabled`]:g.value,[d.value]:!0,[`${d.value}-rtl`]:f.value==="rtl",[z.value]:!0}));return()=>{var a;return P(o(J,null,{default:()=>[o("button",M(M(M({},Y(i,["prefixCls","checkedChildren","unCheckedChildren","checked","autofocus","checkedValue","unCheckedValue","id","onChange","onUpdate:checked"])),e),{},{id:(a=i.id)!==null&&a!==void 0?a:s.id.value,onKeydown:T,onClick:H,onBlur:E,onMouseup:D,type:"button",role:"switch","aria-checked":S.value,disabled:g.value||i.loading,class:[e.class,B.value],ref:u}),[o("div",{class:`${d.value}-handle`},[i.loading?o(G,{class:`${d.value}-loading-icon`},null):null]),o("span",{class:`${d.value}-inner`},[o("span",{class:`${d.value}-inner-checked`},[b(t,i,"checkedChildren")]),o("span",{class:`${d.value}-inner-unchecked`},[b(t,i,"unCheckedChildren")])])])]}))}}}),hi=A(di);export{hi as S};
