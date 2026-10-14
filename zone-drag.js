// Cube Lab adjustable camera zones. All positions are normalized (0..1).
// Works for the local webcam and the phone sensor; paired laptop can send adjustments.
(function(){
 const own=Object.hasOwn;
 const source=document.getElementById('zoneDragLayer');
 const remote=document.getElementById('remoteDragLayer');
 if(!source)return;
 const id='cubecam-zone-positions-v1';
 const initial={leftX:.012,rightX:.72};
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 let current={...initial};
 let zoneWidth=.28,zoneTop=.32;
 try {
  const v=JSON.parse(localStorage.getItem(id)||'null');
  if(v&&Number.isFinite(v.leftX)&&Number.isFinite(v.rightX)){
   current.leftX=v.leftX;current.rightX=v.rightX;
  }
 }catch{}
 function normalize(){
  const w=zoneWidth-.012;
  current.leftX=clamp(current.leftX,.006,Math.max(.006,.988-2*w-.034));
  current.rightX=clamp(current.rightX,current.leftX+w+.034,.988-w);
 }
 function rects(width=zoneWidth,top=zoneTop){
  const w=Math.max(.10,width-.012);
  const left=clamp(current.leftX,.006,Math.max(.006,.988-2*w-.034));
  const right=clamp(current.rightX,left+w+.034,.988-w);
  return [
   {x0:left,x1:left+w,y0:top,y1:.988},
   {x0:right,x1:right+w,y0:top,y1:.988}
  ];
 }
 function readDimensions(){
  const slider=document.getElementById('zoneWidth');
  const topSlider=document.getElementById('zoneTop');
  zoneWidth=clamp((Number(slider?.value)||28)/100,.22,.45);
  zoneTop=clamp((Number(topSlider?.value)||32)/100,.10,.65);
 }
 function sync(){
  readDimensions();normalize();
  const boxes=rects();
  for(const [container,ids] of [
    [source,['dragLeftZone','dragRightZone']],
    [remote,['remoteDragLeft','remoteDragRight']]
  ]){
   if(!container)continue;
   boxes.forEach((z,i)=>{
    const el=document.getElementById(ids[i]);
    if(!el)return;
    el.style.left=(z.x0*100)+'%';el.style.width=((z.x1-z.x0)*100)+'%';
    el.style.top=(z.y0*100)+'%';el.style.bottom='1.2%';
   });
  }
  const guides=document.getElementById('remoteGuides');
  if(guides){
   guides.style.setProperty('--left-zone-x',(boxes[0].x0*100)+'%');
   guides.style.setProperty('--right-zone-x',(boxes[1].x0*100)+'%');
   guides.style.setProperty('--zone-width',((boxes[0].x1-boxes[0].x0)*100)+'%');
   guides.style.setProperty('--zone-top',(zoneTop*100)+'%');
  }
 }
 function persist(){
  try{localStorage.setItem(id,JSON.stringify(current))}catch{}
 }
 function emit(sourceName,remoteControl=false){
  sync();persist();
  window.dispatchEvent(new CustomEvent('cubeLab:zoneChanged',{
   detail:{...current,origin:sourceName,remoteControl}
  }));
 }
 function setPositions(positions,{origin='incoming',remoteControl=false}={}){
  if(!positions||!Number.isFinite(positions.leftX)||!Number.isFinite(positions.rightX))return;
  current={leftX:positions.leftX,rightX:positions.rightX};
  emit(origin,remoteControl);
 }
 function reset(isRemote=false){
  readDimensions();
  current={leftX:.012,rightX:1-zoneWidth};
  emit('reset',isRemote);
 }
 function drag(handle,side,isRemote){
  let pointer=null,offset=0;
  handle.addEventListener('pointerdown',event=>{
   if(event.button!==undefined&&event.button!==0)return;
   const el=isRemote?remote:source;
   const r=el.getBoundingClientRect();
   if(r.width<=0)return;
   pointer=event.pointerId;offset=(event.clientX-r.left)/r.width-current[side];
   handle.setPointerCapture?.(event.pointerId);
   handle.classList.add('dragging');event.preventDefault();
  });
  handle.addEventListener('pointermove',event=>{
   if(pointer!==event.pointerId)return;
   const el=isRemote?remote:source;
   const r=el.getBoundingClientRect();if(r.width<=0)return;
   readDimensions();
   const p=(event.clientX-r.left)/r.width-offset;
   const w=zoneWidth-.012;
   if(side==='leftX')current.leftX=clamp(p,.006,current.rightX-w-.034);
   else current.rightX=clamp(p,current.leftX+w+.034,.988-w);
   emit('drag',isRemote);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']){
   handle.addEventListener(type,()=>{
    pointer=null;handle.classList.remove('dragging');
   });
  }
  handle.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
   event.preventDefault();readDimensions();
   const w=zoneWidth-.012,delta=event.key==='ArrowLeft'?-.015:.015;
   if(side==='leftX')current.leftX=clamp(current.leftX+delta,.006,current.rightX-w-.034);
   else current.rightX=clamp(current.rightX+delta,current.leftX+w+.034,.988-w);
   emit('keyboard',isRemote);
  });
 }
 drag(document.getElementById('dragLeftZone'),'leftX',false);
 drag(document.getElementById('dragRightZone'),'rightX',false);
 if(remote){
  drag(document.getElementById('remoteDragLeft'),'leftX',true);
  drag(document.getElementById('remoteDragRight'),'rightX',true);
 }
 document.getElementById('resetZonePosition')?.addEventListener('click',()=>reset(false));
 document.getElementById('resetRemoteZones')?.addEventListener('click',()=>reset(true));
 for(const id of ['zoneWidth','zoneTop']){
  document.getElementById(id)?.addEventListener('input',()=>{
   emit('dimension',false);
  });
 }
 window.CubeLabZones={
  zones:()=>{readDimensions();normalize();return rects()},
  setPositions,reset,
  remoteGuideUpdate:(data)=>{
   const guides=document.getElementById('remoteGuides');
   if(!guides)return;
   if(Number.isFinite(data?.leftX)&&Number.isFinite(data?.rightX)){
    const w=clamp(Number(data.zoneWidth)||28,22,45)/100-.012;
    guides.style.setProperty('--left-zone-x',(data.leftX*100)+'%');
    guides.style.setProperty('--right-zone-x',(data.rightX*100)+'%');
    guides.style.setProperty('--zone-width',(w*100)+'%');
    guides.style.setProperty('--zone-top',clamp(Number(data.zoneTop)||32,10,65)+'%');
    // The remote draggable areas follow the real phone layout.
    for(const [idx,handleId] of ['remoteDragLeft','remoteDragRight'].entries()){
     const h=document.getElementById(handleId);if(!h)continue;
     h.style.left=((idx===0?data.leftX:data.rightX)*100)+'%';
     h.style.width=(w*100)+'%';
     h.style.top=clamp(Number(data.zoneTop)||32,10,65)+'%';
    }
    // Keep positions so the next laptop drag begins from the phone's last coordinates.
    current={leftX:data.leftX,rightX:data.rightX};
   }
  },
  state:()=>({...current})
 };
 sync();
})();
