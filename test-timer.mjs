// Optional diagnostic: run with `node test-timer.mjs`.
import { TimerEngine } from './timer-engine.mjs';
import assert from 'node:assert/strict';
const solves=[];
const t=new TimerEngine(ms=>solves.push(ms));
function update(ms,left,right){t.feed(left,right);t.update(ms);return t.phase;}
assert.equal(update(0,false,false),'idle');
assert.equal(update(10,true,true),'arming');
assert.equal(update(700,true,true),'ready');
assert.equal(update(800,false,false),'ready');
assert.equal(update(915,false,false),'running');
assert.equal(update(5000,true,true),'running');
assert.equal(update(5180,true,true),'stopped');
assert.equal(solves.length,1);
assert.ok(Math.abs(solves[0]-4200)<10);
assert.equal(update(5300,true,true),'stopped');
assert.equal(update(5500,false,false),'stopped');
assert.equal(update(5800,false,false),'idle');
assert.equal(update(5900,true,true),'arming');
t.reset();t.manualToggle(1000);t.update(2000);t.manualToggle(2500);
assert.ok(Math.abs(solves[1]-1500)<1);
console.log('Passed: arm, release, solve, stop, rearm, manual timer.');
