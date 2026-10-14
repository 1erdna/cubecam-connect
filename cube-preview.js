// Original cube-facelet visualization for Cube Lab. No external code or packages.
const FACE_ORDER=['U','L','F','R','B','D'];
const PALETTE={U:'#f3f8ff',D:'#f8d751',F:'#2ed19a',B:'#489bff',L:'#ffab53',R:'#f36677'};
const META={
 U:{axis:1,layer:1,turn:1},D:{axis:1,layer:-1,turn:-1},
 R:{axis:0,layer:1,turn:1},L:{axis:0,layer:-1,turn:-1},
 F:{axis:2,layer:1,turn:-1},B:{axis:2,layer:-1,turn:1}
};
const facesPos=(face,row,col,size)=>{
 const v=i=>2*i-(size-1),last=size-1;
 switch(face){
  case 'U':return {p:[v(col),last,v(row)],n:[0,1,0]};
  case 'D':return {p:[v(col),-last,v(size-1-row)],n:[0,-1,0]};
  case 'F':return {p:[v(col),v(size-1-row),last],n:[0,0,1]};
  case 'B':return {p:[v(size-1-col),v(size-1-row),-last],n:[0,0,-1]};
  case 'R':return {p:[last,v(size-1-row),v(size-1-col)],n:[1,0,0]};
  case 'L':return {p:[-last,v(size-1-row),v(col)],n:[-1,0,0]};
 }
};
const rotate=(v,axis,dir)=>{
 const [x,y,z]=v;
 if(axis===0)return dir===1?[x,-z,y]:[x,z,-y];
 if(axis===1)return dir===1?[z,y,-x]:[-z,y,x];
 return dir===1?[-y,x,z]:[y,-x,z];
};
const key=(p,n)=>p.join(',')+'|'+n.join(',');
export function cubeState(size=3,algorithm=''){
 const stickers=[];
 for(const face of FACE_ORDER){
  for(let r=0;r<size;r++)for(let col=0;col<size;col++)stickers.push({...facesPos(face,r,col,size),color:face});
 }
 for(const raw of String(algorithm).trim().split(/\s+/)){
  const m=/^([URFDLB])([2']|2')?$/.exec(raw);
  if(!m)continue;
  const {axis,layer,turn}=META[m[1]];
  const count=m[2]?.includes('2')?2:m[2]==="'"?3:1;
  for(let k=0;k<count;k++){
   for(const sticker of stickers){
    if(sticker.p[axis]!==layer*(size-1))continue;
    sticker.p=rotate(sticker.p,axis,turn);
    sticker.n=rotate(sticker.n,axis,turn);
   }
  }
 }
 const byKey=new Map(stickers.map(s=>[key(s.p,s.n),s.color]));
 const result={};
 for(const face of FACE_ORDER){
  result[face]=[];
  for(let r=0;r<size;r++)for(let col=0;col<size;col++){
   const {p,n}=facesPos(face,r,col,size);
   result[face].push(byKey.get(key(p,n))||'?');
  }
 }
 return result;
}
function faceNode(name,colors,size){
 const face=document.createElement('div');
 face.className='cubeFace cubeFace-'+name;
 face.style.setProperty('--grid-size',String(size));
 face.setAttribute('aria-label',name+' face');
 for(const value of colors){
  const sticker=document.createElement('span');
  sticker.className='cubeSticker';
  sticker.style.backgroundColor=PALETTE[value]||'#1b2738';
  face.appendChild(sticker);
 }
 return face;
}
const preview=document.getElementById('scramblePreview');
if(preview){
 const net=document.getElementById('scrambleNet'),shape=document.getElementById('scramble3D');
 const mode=document.getElementById('scrambleViewMode');
 const caption=document.getElementById('scrambleVisualHint');
 const source=document.getElementById('scramble');
 const event=document.getElementById('event');
 let last='';
 function paint(){
  const size=event?.value==='222'?2:3;
  const algorithm=source?.textContent||'';
  const signature=size+'|'+algorithm;
  if(signature===last)return;
  last=signature;
  const faces=cubeState(size,algorithm);
  net.replaceChildren(...FACE_ORDER.map(n=>faceNode(n,faces[n],size)));
  shape.replaceChildren(...FACE_ORDER.map(n=>faceNode(n,faces[n],size)));
  const known=algorithm.trim().split(/\s+/).filter(m=>/^[URFDLB]([2']|2')?$/.test(m)).length;
  caption.textContent=known?size+'×'+size+' visualized · '+known+' moves':'Waiting for a scramble…';
 }
 function view(){
  const threeD=mode.value==='3d';
  net.classList.toggle('hidden',threeD);
  shape.parentElement.classList.toggle('hidden',!threeD);
 }
 mode.addEventListener('change',view);
 event.addEventListener('change',()=>{last='';paint()});
 new MutationObserver(paint).observe(source,{childList:true,characterData:true,subtree:true});
 paint();view();
}
