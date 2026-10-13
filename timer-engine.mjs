// Device-agnostic timer logic. Times are measured on the laptop's monotonic clock.
export class TimerEngine {
  constructor(onSolve = () => {}) {
    this.onSolve = onSolve;
    this.phase = 'idle';
    this.left = false;
    this.right = false;
    this.holdAt = null;
    this.releaseAt = null;
    this.stopAt = null;
    this.rearmAt = null;
    this.startedAt = null;
    this.lastMs = 0;
    this.manual = false;
  }
  feed(left, right) { if (!this.manual) { this.left = !!left; this.right = !!right; } }
  reset() { this.phase='idle'; this.left=false; this.right=false; this.holdAt=null; this.releaseAt=null; this.stopAt=null; this.rearmAt=null; this.startedAt=null; this.lastMs=0; this.manual=false; }
  manualToggle(now) {
    if (this.phase === 'running') {
      const ms = now - this.startedAt;
      this.lastMs = ms; this.phase = 'stopped'; this.manual = false;
      this.onSolve(ms); return;
    }
    if (this.phase === 'stopped' || this.phase === 'idle' || this.phase === 'arming' || this.phase === 'ready') {
      this.manual=true; this.phase='running'; this.startedAt=now; this.lastMs=0;
      this.holdAt=this.releaseAt=this.stopAt=null;
    }
  }
  update(now) {
    const both = this.left && this.right;
    if (this.phase === 'idle') {
      if (both) { this.holdAt=now; this.phase='arming'; }
    } else if (this.phase === 'arming') {
      if (!both) { this.holdAt=null; this.phase='idle'; }
      else if (now-this.holdAt>=600) { this.phase='ready'; this.releaseAt=null; }
    } else if (this.phase === 'ready') {
      if (!this.left && !this.right) {
        if (this.releaseAt === null) this.releaseAt=now;
        if (now-this.releaseAt>=100) {
          this.startedAt=this.releaseAt;
          this.phase='running'; this.stopAt=null;
        }
      } else this.releaseAt=null;
    } else if (this.phase === 'running') {
      this.lastMs=Math.max(0,now-this.startedAt);
      if (!this.manual && both && this.lastMs>400) {
        if (this.stopAt === null) this.stopAt=now;
        if (now-this.stopAt>=140) {
          this.lastMs=this.stopAt-this.startedAt;
          this.phase='stopped'; this.rearmAt=null;
          this.onSolve(this.lastMs);
        }
      } else this.stopAt=null;
    } else if (this.phase === 'stopped') {
      if (!this.left && !this.right) {
        if (this.rearmAt === null) this.rearmAt=now;
        if (now-this.rearmAt>=250) this.phase='idle';
      } else this.rearmAt=null;
    }
    return this.phase;
  }
  elapsed(now) {return this.phase==='running' && this.startedAt!==null ? Math.max(0,now-this.startedAt) : this.lastMs;}
}
