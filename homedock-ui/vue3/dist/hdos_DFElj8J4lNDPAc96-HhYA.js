import{I as r,r as c,y as l,o as u,K as d,_ as m,Q as v,a as i,c as _,e as h,h as I,g as f,T as y,n as x,O as z}from"./hdos_DuxgfCoOHZLz1O8RI3nUx.js";const S={name:"AnimatedIcon",components:{Icon:r},props:{icons:{type:Array,required:!0},interval:{type:Number,default:250},iconSize:{type:Number,default:20},containerClass:{type:String,default:""}},setup(n){const t=c(0),e=c(n.icons[0]),a=l(()=>`icon-${t.value}`);let o;return u(()=>{o=setInterval(()=>{t.value=(t.value+1)%n.icons.length,e.value=n.icons[t.value]},n.interval)}),d(()=>{clearInterval(o)}),{currentIcon:e,iconKey:a}}};function g(n,t,e,a,o,p){const s=v("Icon");return i(),_("div",{class:x(["relative",e.containerClass]),style:z({width:`${e.iconSize}px`,height:`${e.iconSize}px`})},[h(y,{name:"fade"},{default:I(()=>[(i(),f(s,{key:a.iconKey,icon:a.currentIcon,class:"absolute inset-0 transition-opacity",width:e.iconSize,height:e.iconSize},null,8,["icon","width","height"]))]),_:1})],6)}const b=m(S,[["render",g],["__scopeId","data-v-d0133a1b"]]);export{b as A};
