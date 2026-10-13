// Monotonic laptop time. A confirmed stop is stamped at estimated second-hand landing.
const STOP_CONFIRMATION_MS={responsive:140,balanced:275,strict:425};
export class TimerEngine {
  constructor(onSolve=()=>{}){
    this.onSolve=onSolve;this.stopProfile='balanced';this.reset();
  }
  setStopProfile(profile='balanced'){
    this.stopProfile=Object.hasOwn(STOP_CONFIRMATION_MS,profile)?profile:'balanced';
  }
  feed(left,right,{now,leftSince,rightSince}={}){
    if(this.manual)return;
    this.left=Boolean(left);this.right=Boolean(right);
    const checked=(value,enabled)=>enabled&&Number.isFinite(now)&&Number.isFinite(value)&&value<=now&&now-value<=800?value:null;
    this.leftSince=checked(leftSince,this.left);
    this.rightSince=checked(rightSince,this.right);
  }
  reset(){
    this.phase='idle';this.left=false;this.right=false;
    this.leftSince=null;this.rightSince=null;
    this.holdAt=null;this.releaseAt=null;this.stopAt=null;this.stopConfirmAt=null;
    this.rearmAt=null;this.startedAt=null;this.lastMs=0;this.manual=false;
  }
  manualToggle(now){
    if(this.phase==='running'){
      const ms=Math.max(0,now-this.startedAt);
      this.lastMs=ms;this.phase='stopped';this.manual=false;
      this.stopAt=this.stopConfirmAt=null;
      this.onSolve(ms);return;
    }
    if(['stopped','idle','arming','ready'].includes(this.phase)){
      this.manual=true;this.phase='running';this.startedAt=now;this.lastMs=0;
      this.holdAt=this.releaseAt=this.stopAt=this.stopConfirmAt=null;
    }
  }
  update(now){
    const both=this.left&&this.right;
    if(this.phase==='idle'){
      if(both){this.holdAt=now;this.phase='arming';}
    }else if(this.phase==='arming'){
      if(!both){this.holdAt=null;this.phase='idle';}
      else if(now-this.holdAt>=600){this.phase='ready';this.releaseAt=null;}
    }else if(this.phase==='ready'){
      if(!this.left&&!this.right){
        if(this.releaseAt===null)this.releaseAt=now;
        if(now-this.releaseAt>=100){
          this.startedAt=this.releaseAt;this.phase='running';this.stopAt=this.stopConfirmAt=null;
        }
      }else this.releaseAt=null;
    }else if(this.phase==='running'){
      this.lastMs=Math.max(0,now-this.startedAt);
      if(!this.manual&&both&&this.lastMs>450){
        if(this.stopConfirmAt===null){
          this.stopConfirmAt=now;
          const leftAt=this.leftSince??now;
          const rightAt=this.rightSince??now;
          this.stopAt=Math.max(this.startedAt+400,Math.min(now,Math.max(leftAt,rightAt)));
        }
        if(now-this.stopConfirmAt>=STOP_CONFIRMATION_MS[this.stopProfile]){
          this.lastMs=Math.max(400,this.stopAt-this.startedAt);
          this.phase='stopped';this.rearmAt=null;this.onSolve(this.lastMs);
        }
      }else{this.stopAt=null;this.stopConfirmAt=null;}
    }else if(this.phase==='stopped'){
      if(!this.left&&!this.right){
        if(this.rearmAt===null)this.rearmAt=now;
        if(now-this.rearmAt>=250)this.phase='idle';
      }else this.rearmAt=null;
    }
    return this.phase;
  }
  elapsed(now){
    if(this.phase==='running'&&this.startedAt!==null){
      // Freeze on the first credible both-hands placement during confirmation.
      // If the placement is rejected, resume the live clock automatically.
      if(this.stopConfirmAt!==null&&this.stopAt!==null)
        return Math.max(0,this.stopAt-this.startedAt);
      return Math.max(0,now-this.startedAt);
    }
    return this.lastMs;
  }
}
