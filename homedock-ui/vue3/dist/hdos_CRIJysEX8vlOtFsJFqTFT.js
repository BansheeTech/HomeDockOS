import{J as e,M as t,V as n,Y as r,a as i,d as a,i as o,k as s,m as c,nt as l,q as u,t as d}from"./hdos_m8gfY1eCgJ9jRa7r1Qz-e.js";import{t as f}from"./hdos_DjRzyirK7MnDeOnIwi0OR.js";var p=128,m=48,h=64,g=.8,_=13,v=.045,y=1.02,b=-.22,x=1.6,S=.4,C=.45,w=34,T=.5,E=.3,D=.2,O=-.96,k=2,A=`
attribute vec2 aGrid;
attribute float aLevel;
attribute vec3 aTint;

uniform float uPhase;
uniform float uRowPitch;
uniform float uHeight;
uniform float uDepth;

varying vec3 vTint;
varying vec3 vPosition;
varying float vRow;
varying float vLevel;
varying float vDepth;

void main() {
  float row = aGrid.y;
  float z = row < 0.5 ? 0.0 : -(row - 1.0 + uPhase) * uRowPitch;
  vec3 p = vec3(aGrid.x, aLevel * uHeight, z);

  vTint = aTint;
  vPosition = p;
  vRow = row;
  vLevel = aLevel;
  vDepth = -z / uDepth;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`,j=`
uniform float uFade;

varying vec3 vTint;
varying vec3 vPosition;
varying float vRow;
varying float vLevel;
varying float vDepth;

void main() {
  vec3 normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
  if (normal.y < 0.0) normal = -normal;
  float light = 0.45 + 0.55 * clamp(dot(normal, normalize(vec3(0.35, 1.0, 0.5))), 0.0, 1.0);

  float width = fwidth(vRow);
  float distance = abs(fract(vRow + 0.5) - 0.5);
  float ridge = 1.0 - smoothstep(width * 0.5, width * 1.5, distance);

  vec3 body = vTint * (0.75 + 0.35 * light) * (0.85 + 0.3 * vLevel);
  vec3 crest = min(vTint * (1.15 + 0.6 * vLevel), vec3(1.0));
  vec3 color = mix(body, crest, ridge);

  float fog = 1.0 - smoothstep(0.1, 1.0, vDepth);
  float alpha = mix(0.18 + 0.6 * vLevel, 0.95, ridge) * fog * uFade;

  gl_FragColor = vec4(color, alpha);
}
`,M=class extends f{renderer;scene=new e;camera=new n(w,1,.5,400);geometry=new i;material;levels=new Float32Array(p*m);levelAttribute;phase=0;width=0;height=0;target=new l;anchor=new l;constructor(e){super(e),this.renderer=new d({canvas:e,alpha:!0,antialias:!0}),this.renderer.setClearColor(0,0),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,k));let n=new Float32Array(p*m*2),i=new Float32Array(p*m*3),s=new a,l={r:0,g:0,b:0};for(let e=0;e<m;e++)for(let t=0;t<p;t++){let r=e*p+t,a=t/(p-1);n[r*2]=(a-.5)*h,n[r*2+1]=e,s.setHSL((200+a*60)/360,.8,.55,u),s.getRGB(l,u),i.set([l.r,l.g,l.b],r*3)}let f=[];for(let e=46;e>=0;e--)for(let t=0;t<p-1;t++){let n=e*p+t,r=n+p;f.push(r,n,r+1,r+1,n,n+1)}this.levelAttribute=new o(this.levels,1),this.levelAttribute.setUsage(c),this.geometry.setIndex(f),this.geometry.setAttribute(`position`,new o(new Float32Array(p*m*3),3)),this.geometry.setAttribute(`aGrid`,new o(n,2)),this.geometry.setAttribute(`aTint`,new o(i,3)),this.geometry.setAttribute(`aLevel`,this.levelAttribute),this.material=new r({vertexShader:A,fragmentShader:j,transparent:!0,side:2,uniforms:{uPhase:{value:0},uRowPitch:{value:g},uHeight:{value:_},uDepth:{value:m*g},uFade:{value:0}}});let v=new t(this.geometry,this.material);v.frustumCulled=!1,this.scene.add(v)}advance(e){for(this.phase+=e/v;this.phase>=1;)--this.phase,this.levels.copyWithin(p,0,47*p);this.levels.set(this.spectrum),this.levelAttribute.needsUpdate=!0,this.material.uniforms.uPhase.value=this.phase,this.material.uniforms.uFade.value=this.fade,this.fitCanvas()}render(){this.renderer.render(this.scene,this.camera)}reset(){this.levels.fill(0)}release(){this.geometry.dispose(),this.material.dispose(),this.renderer.dispose()}fitCanvas(){let e=this.canvas.clientWidth,t=this.canvas.clientHeight;if(e===this.width&&t===this.height)return;this.width=e,this.height=t,this.renderer.setSize(e,t,!1);let n=e/Math.max(1,t);this.camera.aspect=n,this.camera.clearViewOffset();let r=h*y/2,i=Math.tan(s.degToRad(w/2)),a=m*g*E;this.target.set(0,_*D,-11.520000000000001);let o=T+s.clamp((x-n)*S,0,C),c=r/(i*n)+a*Math.cos(o);this.camera.position.set(0,Math.sin(o)*c,Math.cos(o)*c).add(this.target),this.camera.lookAt(this.target),this.camera.updateMatrixWorld();let l=this.anchor.set(0,0,0).project(this.camera).y;this.camera.setViewOffset(e,t,0,(O-l)/2*t,e,t),this.material.uniforms.uHeight.value=this.peakHeight()}peakHeight(){let e=e=>this.anchor.set(0,e,0).project(this.camera).y>=b;if(e(_))return _;let t=_,n=104;for(let r=0;r<20;r++){let r=(t+n)/2;e(r)?n=r:t=r}return n}};export{M as SpectrumSceneEngine};