import{j as e,m as x}from"./motion-vendor-ubJsSJQ6.js";import{r as s}from"./react-vendor-DTA-bILe.js";import{D as T,E as F,F as C,G as L,H as k,I,J as w,K as z,M as B,u as _,L as S,a as E}from"./index-Cybz5teD.js";function P(r={}){const{vertexShader:n,fragmentShader:o,uniforms:l=[],attributes:m=[],onFrame:t,autoResize:d=!0}=r,i=s.useRef(null),a=s.useRef(null),u=s.useRef(null),v=s.useRef({}),b=s.useRef({}),p=s.useRef(null),[h,g]=s.useState({gl:null,canvas:null,isInitialized:!1,error:null}),j=s.useCallback(()=>{if(!i.current)return;if(!T()){g(f=>({...f,error:"WebGL is not supported in this browser"}));return}const c=F(i.current);if(!c){g(f=>({...f,error:"Failed to create WebGL context"}));return}a.current=c,d&&C(i.current,c),g({gl:c,canvas:i.current,isInitialized:!0,error:null})},[d]),R=s.useCallback(()=>{if(!a.current||!n||!o)return;const c=L(a.current,n,o);if(!c){g(f=>({...f,error:"Failed to compile shader program"}));return}u.current=c,v.current=k(a.current,c,l),b.current=I(a.current,c,m)},[n,o,l,m]),y=s.useCallback(()=>{if(!a.current||!u.current||!t)return;const c=a.current,f=u.current;c.useProgram(f),t(c,f,v.current),p.current=requestAnimationFrame(y)},[t]);return s.useEffect(()=>(j(),()=>{p.current&&cancelAnimationFrame(p.current),a.current&&u.current&&w(a.current,u.current)}),[j]),s.useEffect(()=>{h.isInitialized&&n&&o&&R()},[h.isInitialized,n,o,R]),s.useEffect(()=>(h.isInitialized&&u.current&&t&&y(),()=>{p.current&&(cancelAnimationFrame(p.current),p.current=null)}),[h.isInitialized,t,y]),s.useEffect(()=>{if(!d||!i.current||!a.current)return;const c=()=>{i.current&&a.current&&C(i.current,a.current)};return window.addEventListener("resize",c),()=>window.removeEventListener("resize",c)},[d]),{canvasRef:i,gl:h.gl,program:u.current,uniforms:v.current,attributes:b.current,isInitialized:h.isInitialized,error:h.error}}const A=s.memo(({vertexShader:r,fragmentShader:n,uniforms:o=[],attributes:l=[],onFrame:m,className:t,style:d,width:i,height:a})=>{const{canvasRef:u,error:v}=P({vertexShader:r,fragmentShader:n,uniforms:o,attributes:l,onFrame:m,autoResize:!i&&!a});return v?e.jsx("div",{className:t,style:d,children:e.jsxs("p",{children:["WebGL Error: ",v]})}):e.jsx("canvas",{ref:u,className:t,style:{display:"block",width:i?`${i}px`:"100%",height:a?`${a}px`:"100%",...d},width:i,height:a})});A.displayName="ShaderCanvas";const G=`// Simple gradient fragment shader
// Creates a smooth gradient effect

precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

varying vec2 v_texCoord;

void main() {
  vec2 uv = v_texCoord;
  
  // Create a gradient based on position and time
  vec3 color1 = vec3(0.2, 0.3, 0.8);
  vec3 color2 = vec3(0.8, 0.2, 0.5);
  
  float t = sin(u_time * 0.5) * 0.5 + 0.5;
  vec3 color = mix(color1, color2, uv.x + uv.y * 0.5 + t * 0.2);
  
  gl_FragColor = vec4(color, 1.0);
}

`,W=`// Noise-based fragment shader
// Creates animated noise patterns

precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

varying vec2 v_texCoord;

// Simple noise function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = v_texCoord * 5.0;
  uv += u_time * 0.1;
  
  float n = noise(uv);
  vec3 color = vec3(n);
  
  // Add some color variation
  color = mix(vec3(0.1, 0.2, 0.4), vec3(0.8, 0.6, 0.4), n);
  
  gl_FragColor = vec4(color, 1.0);
}

`;function M(){const[r,n]=s.useState("gradient"),[o,l]=s.useState(0);s.useEffect(()=>{const t=Date.now(),d=setInterval(()=>{l((Date.now()-t)/1e3)},16);return()=>clearInterval(d)},[]);const m=(t,d,i)=>{const a=B(t);if(!a)return;t.bindBuffer(t.ARRAY_BUFFER,a);const u=t.getAttribLocation(d,"a_position");u!==-1&&(t.enableVertexAttribArray(u),t.vertexAttribPointer(u,2,t.FLOAT,!1,0,0)),i.u_time&&t.uniform1f(i.u_time,o),i.u_resolution&&t.uniform2f(i.u_resolution,t.canvas.width,t.canvas.height),i.u_mouse&&t.uniform2f(i.u_mouse,t.canvas.width/2,t.canvas.height/2),t.drawArrays(t.TRIANGLE_STRIP,0,4)};return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h2",{children:"Shader Test Playground"}),e.jsxs("div",{style:{marginBottom:"1rem"},children:[e.jsx("button",{onClick:()=>n("gradient"),children:"Gradient Shader"}),e.jsx("button",{onClick:()=>n("noise"),children:"Noise Shader"})]}),e.jsx("div",{style:{width:"800px",height:"600px",border:"1px solid #ccc"},children:e.jsx(A,{vertexShader:z,fragmentShader:r==="gradient"?G:W,uniforms:["u_time","u_resolution","u_mouse"],attributes:["a_position","a_texCoord"],onFrame:m,width:800,height:600})})]})}function V({children:r,stagger:n=!1,staggerDelay:o=.1,...l}){const m=_(),t={hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:n&&!m?o:0}}},d={hidden:{opacity:0,y:20},visible:{opacity:1,y:0,transition:{duration:m?0:.3}}};return e.jsx(x.div,{variants:n?t:void 0,initial:m?{}:"hidden",animate:"visible",...l,children:n?e.jsx(e.Fragment,{children:Array.isArray(r)?r.map((i,a)=>e.jsx(x.div,{variants:d,children:i},a)):r}):r})}function D({src:r,alt:n,...o}){const l=_();return e.jsx(x.img,{src:r,alt:n,initial:l?{}:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{duration:.4,ease:[.4,0,.2,1]},style:{willChange:"transform, opacity",...o.style},...o})}function N(){const[r,n]=s.useState(!1);return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h2",{children:"Animation Test Playground"}),e.jsx("div",{style:{marginBottom:"2rem"},children:e.jsxs("button",{onClick:()=>n(!r),children:["Toggle Stagger: ",r?"ON":"OFF"]})}),e.jsxs("div",{style:{marginBottom:"2rem"},children:[e.jsx("h3",{children:"Fade In Animation"}),e.jsx(x.div,{initial:{opacity:0},animate:{opacity:1},transition:{duration:.5},style:{padding:"1rem",background:"#f0f0f0",borderRadius:"8px"},children:"This div fades in"})]}),e.jsxs("div",{style:{marginBottom:"2rem"},children:[e.jsx("h3",{children:"Scale Animation"}),e.jsx(x.div,{initial:{scale:0},animate:{scale:1},transition:{duration:.5,type:"spring"},style:{padding:"1rem",background:"#e0e0e0",borderRadius:"8px",display:"inline-block"},children:"This div scales in"})]}),e.jsxs("div",{style:{marginBottom:"2rem"},children:[e.jsx("h3",{children:"Stagger Container"}),e.jsx(V,{stagger:r,staggerDelay:.1,children:[1,2,3,4,5].map(o=>e.jsxs("div",{style:{padding:"1rem",margin:"0.5rem 0",background:"#d0d0d0",borderRadius:"4px"},children:["Item ",o]},o))})]}),e.jsxs("div",{style:{marginBottom:"2rem"},children:[e.jsx("h3",{children:"Animated Image"}),e.jsx("div",{style:{width:"300px",height:"200px",overflow:"hidden"},children:e.jsx(D,{src:"https://via.placeholder.com/300x200",alt:"Test image",style:{width:"100%",height:"100%",objectFit:"cover"}})})]})]})}function $(){return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h2",{children:"Media Loading Test Playground"}),e.jsxs("div",{style:{marginBottom:"2rem"},children:[e.jsx("h3",{children:"Lazy Loaded Images"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"1rem"},children:[1,2,3,4,5,6].map(r=>e.jsx("div",{style:{minHeight:"200px",background:"#f0f0f0"},children:e.jsx(S,{src:`https://via.placeholder.com/400x300?text=Image+${r}`,alt:`Test image ${r}`,responsive:!0,widths:[400,800,1200],style:{width:"100%",height:"100%",objectFit:"cover"}})},r))})]}),e.jsxs("div",{style:{marginBottom:"2rem"},children:[e.jsx("h3",{children:"Lazy Loaded Video"}),e.jsx("div",{style:{maxWidth:"800px",margin:"0 auto"},children:e.jsx(E,{src:"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",poster:"https://via.placeholder.com/800x450?text=Video+Poster",autoplay:!1,loop:!0,muted:!0,controls:!0})})]}),e.jsxs("div",{style:{marginBottom:"2rem"},children:[e.jsx("h3",{children:"Responsive Image with Breakpoints"}),e.jsx(S,{src:"https://via.placeholder.com/1920x1080?text=Responsive+Image",alt:"Responsive test image",responsive:!0,widths:[640,768,1024,1280,1920],style:{width:"100%",height:"auto"}})]})]})}function q(){const[r,n]=s.useState("shader");return e.jsxs("div",{style:{minHeight:"100vh",background:"#fff"},children:[e.jsxs("div",{style:{padding:"1rem",borderBottom:"1px solid #ccc",display:"flex",gap:"1rem"},children:[e.jsx("button",{onClick:()=>n("shader"),style:{padding:"0.5rem 1rem",background:r==="shader"?"#007bff":"#f0f0f0",color:r==="shader"?"#fff":"#000",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Shader Test"}),e.jsx("button",{onClick:()=>n("animation"),style:{padding:"0.5rem 1rem",background:r==="animation"?"#007bff":"#f0f0f0",color:r==="animation"?"#fff":"#000",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Animation Test"}),e.jsx("button",{onClick:()=>n("media"),style:{padding:"0.5rem 1rem",background:r==="media"?"#007bff":"#f0f0f0",color:r==="media"?"#fff":"#000",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Media Test"})]}),e.jsxs("div",{children:[r==="shader"&&e.jsx(M,{}),r==="animation"&&e.jsx(N,{}),r==="media"&&e.jsx($,{})]})]})}export{q as default};
