// 1ERDNA Cube Lab — camera-based hand-rest approximation (not physical touch sensing).
// Each zone must contain a sufficiently OPEN and STEADY hand before being treated as down.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const FINGERS=[[5,6,8],[9,10,12],[13,14,16],[17,18,20]];
export const DETECTION_PROFILES=Object.freeze({
  responsive:Object.freeze({holdMs:120,releaseMs:75,maxDrift:0.040,maxSpeed:0.60,minStraightFingers:3}),
  balanced:Object.freeze({holdMs:185,releaseMs:65,maxDrift:0.028,maxSpeed:0.42,minStraightFingers:3}),
  strict:Object.freeze({holdMs:280,releaseMs:55,maxDrift:0.021,maxSpeed:0.32,minStraightFingers:4})
});
function straightFingerCount(hand){
  let count=0;
  for(const [mcp,pip,tip] of FINGERS){
    const a=hand[mcp],b=hand[pip],c=hand[tip];
    const ab={x:a.x-b.x,y:a.y-b.y},bc={x:c.x-b.x,y:c.y-b.y};
    const ma=Math.hypot(ab.x,ab.y),mb=Math.hypot(bc.x,bc.y);
    if(ma<0.002||mb<0.002)continue;
    const angleCos=(ab.x*bc.x+ab.y*bc.y)/(ma*mb);
    if(angleCos< -0.62 && distance(a,c)>ma*1.14)count++;
  }
  return count;
}
function palmCenter(hand,mirror){
  let x=0,y=0;
  for(const i of [0,5,9,13,17]){x+=hand[i].x;y+=hand[i].y;}
  x/=5;y/=5;
  return {x:mirror?1-x:x,y};
}
function newState(){
  return {anchor:null,previous:null,previousAt:null,steadySince:null,active:false,activeSince:null,interruptedAt:null};
}
export class HandRestDetector {
  constructor({profile='strict'}={}){
    this.setProfile(profile);
  }
  setProfile(profile){
    this.profile=Object.hasOwn(DETECTION_PROFILES,profile)?profile:'balanced';
    this.settings=DETECTION_PROFILES[this.profile];
    this.reset();
  }
  reset(){this.states=[newState(),newState()];}
  update(hands,zones,now,{mirror=false}={}){
    const candidate=[null,null];
    for(const hand of (Array.isArray(hands)?hands:[])){
      if(!Array.isArray(hand)||hand.length<21||
        !hand.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))continue;
      const center=palmCenter(hand,mirror);
      const fingers=straightFingerCount(hand);
      for(let i=0;i<2;i++){
        const z=zones[i];
        if(!z||center.x<z.x0||center.x>z.x1||center.y<z.y0||center.y>z.y1)continue;
        if(!candidate[i]||fingers>candidate[i].fingers)candidate[i]={center,fingers};
      }
    }
    const active=candidate.map((c,i)=>{
      const state=this.states[i];
      const eligible=Boolean(c&&c.fingers>=this.settings.minStraightFingers);
      if(!eligible){
        state.anchor=null;state.previous=null;state.previousAt=null;state.steadySince=null;
        if(state.active){
          if(state.interruptedAt===null)state.interruptedAt=now;
          if(now-state.interruptedAt>=this.settings.releaseMs){
            state.active=false;state.activeSince=null;
          }
        }
        return state.active;
      }
      const point=c.center;
      const dt=state.previousAt===null?Infinity:now-state.previousAt;
      const velocity=state.previous&&dt>0?distance(point,state.previous)*1000/dt:0;
      const unstable=(dt>450&&state.previousAt!==null)
        ||velocity>this.settings.maxSpeed
        ||(state.anchor!==null&&distance(point,state.anchor)>this.settings.maxDrift);
      if(unstable||state.steadySince===null){
        state.steadySince=now;
        state.anchor={...point};
      }else{
        state.anchor.x=state.anchor.x*.94+point.x*.06;
        state.anchor.y=state.anchor.y*.94+point.y*.06;
      }
      state.previous={...point};
      state.previousAt=now;
      if(!unstable&&now-state.steadySince>=this.settings.holdMs){
        if(!state.active)state.activeSince=state.steadySince;
        state.active=true;
        state.interruptedAt=null;
      }else if(state.active){
        if(state.interruptedAt===null)state.interruptedAt=now;
        if(now-state.interruptedAt>=this.settings.releaseMs){
          state.active=false;state.activeSince=null;
        }
      }
      return state.active;
    });
    const left=active[0],right=active[1];
    return {
      left,right,
      leftSince:left?this.states[0].activeSince:null,
      rightSince:right?this.states[1].activeSince:null,
      seenLeft:Boolean(candidate[0]),seenRight:Boolean(candidate[1]),
      openLeft: Boolean(candidate[0]?.fingers>=this.settings.minStraightFingers),
      openRight:Boolean(candidate[1]?.fingers>=this.settings.minStraightFingers)
    };
  }
}
