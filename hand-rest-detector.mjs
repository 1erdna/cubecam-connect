// Camera-based approximation of hands resting on the table.
// Real physical contact is not measurable from an ordinary webcam.
const DIST=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const FINGERS=[[5,6,8],[9,10,12],[13,14,16],[17,18,20]];

function straightFingerCount(hand){
  let count=0;
  for(const [mcp,pip,tip] of FINGERS){
    const a=hand[mcp],b=hand[pip],c=hand[tip];
    if(!a||!b||!c)continue;
    const ax=a.x-b.x,ay=a.y-b.y,bx=c.x-b.x,by=c.y-b.y;
    const lengthA=Math.hypot(ax,ay),lengthB=Math.hypot(bx,by);
    if(lengthA<0.002||lengthB<0.002)continue;
    const cosine=(ax*bx+ay*by)/(lengthA*lengthB);
    // A straight finger has an angle near 180 degrees at the middle joint.
    if(cosine < -0.57 && DIST(a,c)>DIST(a,b)*1.10)count++;
  }
  return count;
}

function palmCenter(hand,mirror){
  const points=[0,5,9,13,17];
  let x=0,y=0;
  for(const i of points){x+=hand[i].x;y+=hand[i].y;}
  x/=points.length;y/=points.length;
  return {x:mirror?1-x:x,y};
}

function state(){
  return {anchor:null,previous:null,previousAt:null,steadySince:null,active:false,interruptedAt:null};
}

export class HandRestDetector {
  constructor({holdMs=190,releaseMs=95,maxDrift=0.035,maxSpeed=0.65,minStraightFingers=2}={}){
    this.settings={holdMs,releaseMs,maxDrift,maxSpeed,minStraightFingers};
    this.reset();
  }
  reset(){
    this.states=[state(),state()];
  }
  update(hands,zones,now,{mirror=false,mode='rest'}={}){
    const candidates=[null,null];
    if(!Array.isArray(hands))hands=[];
    for(const hand of hands){
      if(!Array.isArray(hand)||hand.length<21||!hand.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))continue;
      const center=palmCenter(hand,mirror);
      const fingers=straightFingerCount(hand);
      for(let i=0;i<2;i++){
        const z=zones[i];
        if(!z||center.x<z.x0||center.x>z.x1||center.y<z.y0||center.y>z.y1)continue;
        if(!candidates[i]||fingers>candidates[i].fingers)candidates[i]={center,fingers};
      }
    }

    const active=candidates.map((candidate,i)=>{
      const s=this.states[i];
      if(mode==='zone'){
        this.states[i]=state();
        return Boolean(candidate);
      }
      const eligible=Boolean(candidate&&candidate.fingers>=this.settings.minStraightFingers);
      if(!eligible){
        s.anchor=null;s.previous=null;s.previousAt=null;s.steadySince=null;
        if(s.active){
          if(s.interruptedAt===null)s.interruptedAt=now;
          if(now-s.interruptedAt>=this.settings.releaseMs)s.active=false;
        }
        return s.active;
      }

      const point=candidate.center;
      const speed=s.previous&&s.previousAt!==null&&now>s.previousAt?
        DIST(point,s.previous)*1000/Math.max(1,now-s.previousAt):0;
      const moving=speed>this.settings.maxSpeed ||
        (s.anchor!==null&&DIST(point,s.anchor)>this.settings.maxDrift) ||
        (s.previousAt!==null && now-s.previousAt>450);

      if(s.steadySince===null||moving){
        s.steadySince=now;
        s.anchor={...point};
      } else {
        // Small, slow positioning changes are okay; a swipe through the zone is not.
        s.anchor.x=s.anchor.x*.93+point.x*.07;
        s.anchor.y=s.anchor.y*.93+point.y*.07;
      }
      s.previous={...point};s.previousAt=now;

      if(!moving&&now-s.steadySince>=this.settings.holdMs){
        s.active=true;s.interruptedAt=null;
      } else if(s.active){
        if(s.interruptedAt===null)s.interruptedAt=now;
        if(now-s.interruptedAt>=this.settings.releaseMs)s.active=false;
      }
      return s.active;
    });

    return {
      left:active[0],right:active[1],
      seenLeft:Boolean(candidates[0]),seenRight:Boolean(candidates[1]),
      openLeft: Boolean(candidates[0]?.fingers>=this.settings.minStraightFingers),
      openRight:Boolean(candidates[1]?.fingers>=this.settings.minStraightFingers)
    };
  }
}
