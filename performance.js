// Cube Lab progress graph: browser-native Canvas 2D, no charting dependencies.
const CANVAS=document.getElementById('performanceChart');
export function getSeries(records,event,limit=35){
 const filtered=(Array.isArray(records)?records:[])
   .filter(r=>r?.event===event&&Number.isFinite(r.ms)&&r.ms>0)
   .reverse();
 return filtered.slice(-limit).map((entry,index,windowed)=>{
   const values=windowed.slice(Math.max(0,index-4),index+1).map(x=>x.ms);
   const sorted=[...values].sort((a,b)=>a-b);
   return {n:filtered.length-windowed.length+index+1,time:entry.ms/1000,
     ao5:values.length===5?sorted.slice(1,-1).reduce((a,b)=>a+b,0)/3000:null,
     date:entry.at||'',scramble:entry.scramble||''};
 });
}
if(CANVAS){
 const ctx=CANVAS.getContext('2d');
 const empty=document.getElementById('performanceEmpty');
 const summary=document.getElementById('performanceSummary');
 let series=[],hover=-1;
 const nice=n=>n.toFixed(2)+'s';
 const bounds=(w,h)=>({left:46,right:w-18,top:20,bottom:h-38});
 function point(index,value,min,max,rect){
  return {x:rect.left+(series.length===1?.5:index/(series.length-1))*(rect.right-rect.left),
   y:rect.bottom-((value-min)/Math.max(.2,max-min))*(rect.bottom-rect.top)};
 }
 function redraw(){
  if(!ctx)return;
  const parent=CANVAS.parentElement;
  const width=Math.max(280,Math.floor(parent?.clientWidth||520));
  const height=262,dpr=Math.min(2,window.devicePixelRatio||1);
  CANVAS.width=Math.round(width*dpr);CANVAS.height=Math.round(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#091629';ctx.fillRect(0,0,width,height);
  const r=bounds(width,height);
  const values=series.flatMap(p=>p.ao5===null?[p.time]:[p.time,p.ao5]);
  const low=series.length?Math.min(...values):0,high=series.length?Math.max(...values):1;
  const span=Math.max(1,(high-low)*1.3);
  const min=Math.max(0,low-span*.13),max=min+span;
  for(let k=0;k<=4;k++){
   const y=r.top+(r.bottom-r.top)*k/4;
   ctx.strokeStyle='#24405c';ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(r.left,y);ctx.lineTo(r.right,y);ctx.stroke();
   ctx.fillStyle='#7899b9';ctx.font='11px system-ui';ctx.textAlign='right';
   ctx.fillText((max-(max-min)*k/4).toFixed(1)+'s',r.left-8,y+4);
  }
  if(!series.length){
   ctx.fillStyle='#93adc9';ctx.textAlign='center';ctx.font='14px system-ui';
   ctx.fillText('Finish a solve to see your progress',width/2,height/2);
   return;
  }
  const pb=Math.min(...series.map(s=>s.time));
  const pbY=point(0,pb,min,max,r).y;
  ctx.strokeStyle='#ffcc7799';ctx.setLineDash([4,6]);
  ctx.beginPath();ctx.moveTo(r.left,pbY);ctx.lineTo(r.right,pbY);ctx.stroke();ctx.setLineDash([]);
  function drawLine(key,color,dashes=[]){
   ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.lineJoin='round';
   ctx.setLineDash(dashes);ctx.beginPath();let began=false;
   series.forEach((s,i)=>{if(s[key]===null)return;const p=point(i,s[key],min,max,r);
    if(!began){ctx.moveTo(p.x,p.y);began=true;}else ctx.lineTo(p.x,p.y);
   });ctx.stroke();ctx.setLineDash([]);
  }
  drawLine('time','#46baff');
  drawLine('ao5','#ac9bff',[5,5]);
  series.forEach((s,i)=>{
   const p=point(i,s.time,min,max,r);
   ctx.beginPath();ctx.arc(p.x,p.y,i===hover?5:3,0,2*Math.PI);
   ctx.fillStyle=i===hover?'#e1f7ff':'#45baff';ctx.fill();
  });
  ctx.fillStyle='#7899b9';ctx.font='11px system-ui';
  ctx.textAlign='left';ctx.fillText('#'+series[0].n,r.left,r.bottom+24);
  ctx.textAlign='right';ctx.fillText('#'+series[series.length-1].n,r.right,r.bottom+24);
  if(hover>=0&&series[hover]){
   const s=series[hover],p=point(hover,s.time,min,max,r);
   const w=148,x=Math.max(r.left,Math.min(r.right-w,p.x-74)),y=Math.max(12,p.y-54);
   ctx.fillStyle='#193454';ctx.strokeStyle='#519ad0';ctx.lineWidth=1;
   ctx.beginPath();ctx.roundRect(x,y,w,38,7);ctx.fill();ctx.stroke();
   ctx.fillStyle='#f1f9ff';ctx.font='bold 12px system-ui';ctx.textAlign='left';
   ctx.fillText('#'+s.n+' · '+nice(s.time),x+10,y+16);
   ctx.fillStyle='#c4b9ff';ctx.font='11px system-ui';
   ctx.fillText('Ao5: '+(s.ao5===null?'—':nice(s.ao5)),x+10,y+30);
  }
 }
 function refresh(){
  let saved=[];
  try{saved=JSON.parse(localStorage.getItem('cubecam-connect-solves-v1')||'[]');}catch{}
  series=getSeries(saved,document.getElementById('event')?.value||'333');
  if(empty)empty.textContent=series.length
   ?'Hover a point to inspect your solve time · Blue = solve · Violet = Ao5 · Gold = PB'
   :'No solves yet. Your chart will appear after your first solve.';
  if(summary)summary.textContent=series.length
   ?'Showing '+series.length+' recent solves · Fastest '+nice(Math.min(...series.map(s=>s.time)))
   :'Waiting for solves';
  hover=-1;redraw();
 }
 CANVAS.addEventListener('pointermove',ev=>{
  if(!series.length)return;
  const rect=CANVAS.getBoundingClientRect(),width=Math.max(280,CANVAS.parentElement.clientWidth||520);
  const x=(ev.clientX-rect.left)*width/rect.width;
  const r=bounds(width,262),t=(x-r.left)/(r.right-r.left);
  hover=Math.round(Math.max(0,Math.min(1,t))*(series.length-1));
  redraw();
 });
 CANVAS.addEventListener('pointerleave',()=>{hover=-1;redraw()});
 if(window.ResizeObserver)new ResizeObserver(redraw).observe(CANVAS.parentElement);
 else window.addEventListener('resize',redraw);
 window.addEventListener('cubeLab:stats',refresh);
 document.getElementById('event')?.addEventListener('change',refresh);
 refresh();
}
