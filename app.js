import { TimerEngine } from './timer-engine.mjs';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const storageKey = 'cubecam-connect-solves-v1';
const urlForPhone = () => {
  const url = new URL(location.href);
  url.search = new URLSearchParams({mode:'phone',code:sessionCode}).toString();
  return url.toString();
};
function setStatus(label, good=false) { $('linkStatus').textContent='● '+label; $('linkStatus').classList.toggle('good',good); }
function showMode(mode) {
  for (const id of ['choose','laptop','phone']) $(id).classList.toggle('hidden',id!==mode);
  setStatus('Not paired');
  if (mode==='phone' && cameraSource==='local') selectCameraSource('phone');
  if (mode==='laptop') { renderStats(); void newScramble(); }
  history.replaceState(null,'',new URL(location.href).pathname+'?mode='+mode+(mode==='phone'&&params.get('code')?'&code='+encodeURIComponent(params.get('code')):''));
}
for(const [id,mode] of [['chooseLaptop','laptop'],['choosePhone','phone']]) $(id).addEventListener('click',()=>showMode(mode));
for(const id of ['changeLaptop','changePhone']) $(id).addEventListener('click',()=>location.assign(location.pathname));

// Laptop: PeerJS data connection. The pairing code is an unlisted peer ID, not a password.
let sessionCode = '', hostPeer = null, hostConn = null, hostReady = false, lastSignalAt = 0;
let cameraSource = 'phone';
function generateCode() {
  const b = new Uint8Array(8); crypto.getRandomValues(b);
  return Array.from(b,v => codeChars[v % codeChars.length]).join('');
}
function connectionClosed() {
  hostConn=null; lastSignalAt=0;
  if(cameraSource!=='phone') return;
  engine.feed(false,false);
  setStatus('Phone disconnected');
  $('peerState').textContent=hostReady?'Waiting for phone':'Not connected';
  $('hostHint').textContent='Open the phone link and connect again with this code.';
}
function attachHostConnection(conn) {
  if (hostConn && hostConn.open) {conn.close();return;}
  hostConn=conn;
  conn.on('open',()=>{
    if(hostConn!==conn)return;
    setStatus('Phone paired ✓',true);
    $('peerState').textContent='Connected';
    $('hostHint').textContent='Now start camera on your phone, or try its test pads.';
    conn.send({type:'hello',version:1});
  });
  conn.on('data',msg=>{
    if (hostConn!==conn || cameraSource!=='phone' || !msg || msg.type!=='pads')return;
    lastSignalAt=performance.now();
    engine.feed(Boolean(msg.left),Boolean(msg.right));
  });
  conn.on('close',()=>{if(hostConn===conn)connectionClosed();});
  conn.on('error',()=>{if(hostConn===conn)connectionClosed();});
}
function startHost() {
  if (typeof window.Peer !== 'function') { $('hostHint').textContent='PeerJS did not load. Check internet or reload.'; return; }
  if (hostConn) hostConn.close();
  if (hostPeer) hostPeer.destroy();
  hostConn=null; hostReady=false;
  sessionCode=generateCode();
  $('pairCode').textContent=sessionCode;
  $('hostButton').textContent='New code';
  $('copyPhoneLink').disabled=true;
  $('peerState').textContent='Registering…';
  $('hostHint').textContent='Registering the laptop. Do not close this tab.';
  const peer = new Peer('cubecam-v1-'+sessionCode.toLowerCase());
  hostPeer=peer;
  peer.on('open',()=>{
    if(hostPeer!==peer)return;
    hostReady=true; $('copyPhoneLink').disabled=false;
    $('peerState').textContent='Waiting for phone';
    $('hostHint').textContent='Type this code on your phone, or copy the phone link.';
    setStatus('Waiting for phone');
  });
  peer.on('connection',c=>{if(hostPeer===peer)attachHostConnection(c);else c.close();});
  peer.on('disconnected',()=>{
    if(hostPeer!==peer)return;
    hostReady=false;
    $('peerState').textContent='Signaling disconnected';
    $('hostHint').textContent='Reconnect to internet then press New code.';
  });
  peer.on('error',err=>{
    if(hostPeer!==peer)return;
    hostReady=false;
    $('peerState').textContent='Connection error';
    $('hostHint').textContent='Pairing service error: '+String(err?.type||err?.message||err)+'. Press New code to retry.';
  });
}
$('hostButton').addEventListener('click',startHost);
$('copyPhoneLink').addEventListener('click',async()=>{
  try {await navigator.clipboard.writeText(urlForPhone());$('hostHint').textContent='Phone link copied! Open it in Safari on your iPhone.';}
  catch { $('hostHint').textContent='Copy this address manually: '+urlForPhone(); }
});

// Laptop timer/state/statistics.
let records=[];
try {const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))records=saved.filter(x=>Number.isFinite(x.ms)&&typeof x.event==='string');}catch{}
let scrambleText = '', scrambleModule = null, scrambleGeneration=0;
const display = ms => ms===null||!Number.isFinite(ms)?'—':(Math.round(ms/10)/100).toFixed(2);
const average = arr => arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
const currentRecords = () => records.filter(r=>r.event===$('event').value);
const averageOf = n => {const arr=currentRecords().slice(0,n).map(r=>r.ms).sort((a,b)=>a-b);return arr.length===n?average(arr.slice(1,-1)):null;};
function renderStats() {
  const list=currentRecords(),times=list.map(r=>r.ms);
  $('solveCount').textContent=String(list.length);
  $('pb').textContent=display(times.length?Math.min(...times):null);
  $('ao5').textContent=display(averageOf(5));
  $('ao12').textContent=display(averageOf(12));
  $('mean').textContent=display(average(times));
  const ul=$('history');ul.replaceChildren();
  if(!list.length){const li=document.createElement('li');li.textContent='No solves yet';ul.append(li);}
  for(const [i,r] of list.slice(0,30).entries()) {
    const li=document.createElement('li'); li.title=r.scramble||'';
    li.textContent='#'+(list.length-i);
    const span=document.createElement('span');span.textContent=display(r.ms)+' s';li.append(span);ul.append(li);
  }
}
function randomIndex(n) {const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;}
function randomMoves(event) {
  const faces=event==='222'?['U','R','F']:['U','D','R','L','F','B'];
  const axes={U:0,D:0,R:1,L:1,F:2,B:2};
  const endings=['',"'",'2'];let last=-1;
  return Array.from({length:event==='222'?11:25},()=>{
    const options=faces.filter(f=>axes[f]!==last);const f=options[randomIndex(options.length)];
    last=axes[f];return f+endings[randomIndex(3)];
  }).join(' ');
}
async function newScramble() {
  const job=++scrambleGeneration,event=$('event').value;
  $('scramble').textContent='Generating scramble…';
  try {
    if(!scrambleModule) scrambleModule=await import('https://cdn.cubing.net/v0/js/cubing/scramble');
    const alg=await scrambleModule.randomScrambleForEvent(event);
    if(job!==scrambleGeneration)return;
    scrambleText=alg.toString();$('scrambleHint').textContent='cubing.js · Random-state scramble';
  } catch(err) {
    if(job!==scrambleGeneration)return;
    scrambleText=randomMoves(event);
    $('scrambleHint').textContent='Offline random-move fallback · Not official random-state';
  }
  $('scramble').textContent=scrambleText;
}
function recordSolve(ms) {
  records.unshift({ms,scramble:scrambleText,event:$('event').value,at:new Date().toISOString()});
  try{localStorage.setItem(storageKey,JSON.stringify(records));}catch{}
  renderStats();void newScramble();
}
const engine=new TimerEngine(recordSolve);
$('nextScramble').addEventListener('click',()=>{void newScramble();});
$('event').addEventListener('change',()=>{engine.reset();renderStats();void newScramble();});
$('manualStopStart').addEventListener('click',()=>engine.manualToggle(performance.now()));
$('resetTimer').addEventListener('click',()=>engine.reset());
$('clearHistory').addEventListener('click',()=>{
  if(!confirm('Delete all times saved on this laptop?'))return;
  records=[];try{localStorage.setItem(storageKey,'[]');}catch{}renderStats();
});
document.addEventListener('keydown',e=>{
  if(e.code!=='Space' || e.repeat || $('laptop').classList.contains('hidden') || ['INPUT','TEXTAREA','BUTTON','SELECT'].includes(document.activeElement?.tagName))return;
  e.preventDefault();engine.manualToggle(performance.now());
});
function laptopLoop(now) {
  if(cameraSource==='phone' && lastSignalAt && now-lastSignalAt>1700){lastSignalAt=0;engine.feed(false,false);$('peerState').textContent='Phone signal paused';}
  engine.update(now);
  $('leftStatus').classList.toggle('on',engine.left);
  $('rightStatus').classList.toggle('on',engine.right);
  $('leftStatus').textContent=engine.left?'✋ LEFT · IN ZONE':'✋ LEFT · OFF';
  $('rightStatus').textContent=engine.right?'✋ RIGHT · IN ZONE':'✋ RIGHT · OFF';
  const phase=engine.phase;
  const phrases={idle:['WAITING FOR HANDS','Put one hand into each marked camera zone.'],arming:['HOLD BOTH HANDS','Keep your hands in the zones for 0.6 seconds.'],ready:['READY — LIFT HANDS','Move both hands out of the zones to start.'],running:['SOLVING','Return both hands into the zones to stop.'],stopped:['SOLVE SAVED','Remove hands from the zones before the next attempt.']};
  $('phase').textContent=phrases[phase][0];$('help').textContent=phrases[phase][1];
  $('clock').textContent=display(engine.elapsed(now));
  $('clock').className='clock'+(phase==='ready'?' ready':phase==='arming'?' arming':phase==='running'?' running':'');
  $('nextScramble').disabled=phase==='running';$('event').disabled=phase==='running';
  requestAnimationFrame(laptopLoop);
}
renderStats();requestAnimationFrame(laptopLoop);

// Phone: only hand positions (not video frames) travel to the laptop.
let phonePeer=null, phoneConn=null, connectionTimeout=null;
const phoneMessage = text => $('phoneConnection').textContent=text;
const normalCode=s=>s.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
$('inputCode').addEventListener('input',()=>{$('inputCode').value=normalCode($('inputCode').value);});
function connectPhone() {
  const code=normalCode($('inputCode').value);
  if(code.length!==8){phoneMessage('Enter the exact 8-character pairing code from the laptop.');return;}
  if(typeof window.Peer!=='function'){phoneMessage('PeerJS failed to load. Check internet and reload.');return;}
  if(phoneConn)phoneConn.close();if(phonePeer)phonePeer.destroy();
  phoneConn=null;phoneMessage('Connecting to laptop…');$('joinButton').disabled=true;
  const peer=new Peer();phonePeer=peer;
  peer.on('open',()=>{
    if(phonePeer!==peer)return;
    const c=peer.connect('cubecam-v1-'+code.toLowerCase(),{reliable:true});phoneConn=c;
    connectionTimeout=setTimeout(()=>{
      if(!c.open && phoneConn===c){phoneMessage('Connection timed out. Check code and ensure laptop tab is open.');$('joinButton').disabled=false;}
    },13000);
    c.on('open',()=>{
      if(phoneConn!==c)return;
      clearTimeout(connectionTimeout);
      $('joinButton').disabled=false;phoneMessage('Connected! Start camera or hold both test pads.');setStatus('Connected to laptop ✓',true);sendPads(true);
    });
    c.on('data',()=>{});
    c.on('close',()=>{if(phoneConn===c){phoneMessage('Laptop disconnected. Connect again using its code.');setStatus('Not paired');$('joinButton').disabled=false;}});
    c.on('error',e=>{phoneMessage('Connection issue: '+(e?.message||e));$('joinButton').disabled=false;});
  });
  peer.on('error',e=>{if(phonePeer===peer){phoneMessage('Pairing error: '+(e?.type||e?.message||e));$('joinButton').disabled=false;}});
}
$('joinButton').addEventListener('click',connectPhone);

const video=$('cameraVideo'), overlay=$('cameraOverlay'),ctx=overlay.getContext('2d');
let stream=null, handDetector=null,cameraOn=false,front=false,cameraJob=0,frameAt=0,videoTime=-1;
let camLeft=false,camRight=false,manualLeft=false,manualRight=false,manualTouches=0,lastSentAt=0;
function zones() {
  const width=Number($('zoneWidth').value)/100;
  const top=Number($('zoneTop').value)/100;
  return [{x0:.012,x1:width,y0:top,y1:.988},{x0:1-width,x1:.988,y0:top,y1:.988}];
}
function effectivePads() {return manualTouches>0?{left:manualLeft,right:manualRight}:{left:cameraOn&&camLeft,right:cameraOn&&camRight};}
function sendPads(force=false) {
  const pads=effectivePads(),now=performance.now();
  $('phoneLeft').classList.toggle('on',pads.left);$('phoneRight').classList.toggle('on',pads.right);
  $('phoneLeft').textContent='LEFT · '+(pads.left?'HAND IN ZONE':'NO HAND');
  $('phoneRight').textContent='RIGHT · '+(pads.right?'HAND IN ZONE':'NO HAND');
  if(!force && now-lastSentAt<85)return;
  lastSentAt=now;
  if(cameraSource==='local') {
    if(cameraOn || manualTouches>0) engine.feed(pads.left,pads.right);
  } else if(phoneConn?.open) {
    phoneConn.send({type:'pads',left:pads.left,right:pads.right});
  }
}
setInterval(()=>sendPads(),115);
const inZone=(p,z)=>p.x>=z.x0&&p.x<=z.x1&&p.y>=z.y0&&p.y<=z.y1;
function drawOverlay(result) {
  const W=video.videoWidth||640,H=video.videoHeight||480;
  if(overlay.width!==W||overlay.height!==H){overlay.width=W;overlay.height=H;}
  ctx.clearRect(0,0,W,H);
  const zz=zones();ctx.lineWidth=Math.max(3,W*.007);
  ctx.font=`bold ${Math.max(15,Math.round(W*.032))}px system-ui`;
  zz.forEach((z,i)=>{
    const detected=i===0?camLeft:camRight;
    ctx.strokeStyle=detected?'#58f0ab':'#95c6ff';ctx.fillStyle=detected?'rgba(54,212,157,.20)':'rgba(61,146,229,.16)';
    ctx.fillRect(z.x0*W,z.y0*H,(z.x1-z.x0)*W,(z.y1-z.y0)*H);
    ctx.strokeRect(z.x0*W,z.y0*H,(z.x1-z.x0)*W,(z.y1-z.y0)*H);
    ctx.fillStyle='white';ctx.fillText(i===0?'LEFT HAND':'RIGHT HAND',z.x0*W+9,z.y0*H+25);
  });
  for(const hand of result?.landmarks||[]){
    const ids=[0,5,9,13,17];const p={x:0,y:0};
    for(const id of ids){p.x+=hand[id].x;p.y+=hand[id].y;}
    p.x/=ids.length;p.y/=ids.length;if(front)p.x=1-p.x;
    ctx.beginPath();ctx.arc(p.x*W,p.y*H,Math.max(5,W*.008),0,Math.PI*2);
    ctx.fillStyle='#ffdc90';ctx.fill();
  }
}
function handleHands(result){
  let left=false,right=false;const zz=zones();
  for(const hand of result.landmarks||[]){
    const ids=[0,5,9,13,17];const center={x:0,y:0};
    for(const i of ids){center.x+=hand[i].x;center.y+=hand[i].y;}
    center.x/=ids.length;center.y/=ids.length;
    if(front)center.x=1-center.x;
    if(inZone(center,zz[0]))left=true;if(inZone(center,zz[1]))right=true;
  }
  camLeft=left;camRight=right;drawOverlay(result);sendPads(true);
}
async function getDetector() {
  if(handDetector)return handDetector;
  const {HandLandmarker,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs');
  const fileset=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');
  const settings={baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5};
  try {handDetector=await HandLandmarker.createFromOptions(fileset,settings);}
  catch {settings.baseOptions.delegate='CPU';handDetector=await HandLandmarker.createFromOptions(fileset,settings);}
  return handDetector;
}
function releaseCamera(){
  cameraOn=false;cameraJob++;
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  video.pause();video.srcObject=null;camLeft=camRight=false;
  $('cameraFrame').classList.remove('active');$('cameraStop').disabled=true;
  ctx.clearRect(0,0,overlay.width,overlay.height);sendPads(true);
}
async function startCamera() {
  if(!navigator.mediaDevices?.getUserMedia){$('cameraMessage').textContent='Camera unavailable. Open the published HTTPS website in Safari or Chrome.';return;}
  releaseCamera();
  const job=++cameraJob;$('cameraButton').disabled=true;
  $('cameraMessage').textContent='Requesting camera permission…';
  try {
    const camConstraints={facingMode:{ideal:front?'user':'environment'},width:{ideal:640},height:{ideal:480},frameRate:{ideal:25}};
    const selectedCamera=$('cameraDevice').value;
    if(selectedCamera){delete camConstraints.facingMode;camConstraints.deviceId={exact:selectedCamera};}
    const s=await navigator.mediaDevices.getUserMedia({audio:false,video:camConstraints});
    if(job!==cameraJob){s.getTracks().forEach(t=>t.stop());return;}
    stream=s;video.srcObject=s;video.classList.toggle('front',front && !$('cameraDevice').value);await video.play();
    await listCameraDevices();
    const actualId=s.getVideoTracks()[0]?.getSettings()?.deviceId;
    if(actualId && Array.from($('cameraDevice').options).some(o=>o.value===actualId))$('cameraDevice').value=actualId;
    $('cameraMessage').textContent='Loading on-device hand tracking…';
    await getDetector();
    if(job!==cameraJob)return;
    cameraOn=true;videoTime=-1;frameAt=0;
    $('cameraFrame').classList.add('active');$('cameraStop').disabled=false;
    $('cameraMessage').textContent='Ready! Keep two hands clearly visible in separate rectangles. Only left/right detection is sent to the laptop.';
    requestAnimationFrame(trackCamera);
  } catch(e) {
    releaseCamera();
    $('cameraMessage').textContent='Camera error: '+String(e?.message||e)+'. Check HTTPS, permissions, internet, or another app using the camera.';
  } finally {$('cameraButton').disabled=false;}
}
function trackCamera(now){
  if(!cameraOn)return;
  if(!document.hidden && video.readyState>=2 && video.currentTime!==videoTime && now-frameAt>=65) {
    frameAt=now;videoTime=video.currentTime;
    try{handleHands(handDetector.detectForVideo(video,now));}
    catch(e){$('cameraMessage').textContent='Detection error: '+String(e?.message||e);camLeft=camRight=false;sendPads(true);}
  }
  requestAnimationFrame(trackCamera);
}
$('cameraButton').addEventListener('click',()=>{void startCamera();});
$('cameraStop').addEventListener('click',()=>{
  releaseCamera();
  if(cameraSource==='local')engine.reset();
  $('cameraMessage').textContent='Camera stopped. You can still test using the manual timer.';
});
$('switchCamera').addEventListener('click',()=>{
  front=!front;
  $('cameraDevice').value='';
  $('cameraMessage').textContent='Trying '+(front?'front':'rear')+' camera.';
  if(cameraOn)void startCamera();
});
for(const [slider,label] of [['zoneWidth','zoneWidthDisplay'],['zoneTop','zoneTopDisplay']]) $(slider).addEventListener('input',()=>{$(label).textContent=$(slider).value+'%';});
function bindTestPad(id,side){
  const b=$(id);let active=false;
  const apply=value=>{
    if(value===active)return;active=value;manualTouches+=value?1:-1;
    if(side==='left')manualLeft=value;else manualRight=value;
    b.classList.toggle('down',value);sendPads(true);
  };
  b.addEventListener('pointerdown',e=>{try{b.setPointerCapture(e.pointerId);}catch{}apply(true);e.preventDefault();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>apply(false));
}
bindTestPad('testLeft','left');bindTestPad('testRight','right');
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){camLeft=camRight=false;sendPads(true);if(cameraSource==='local'&&engine.phase!=='running')engine.reset();}
});
if(params.get('code'))$('inputCode').value=normalCode(params.get('code'));
if(['phone','laptop'].includes(params.get('mode')))showMode(params.get('mode'));


// Dual camera mode: reuse the phone camera preview/MediaPipe tracker in the laptop dashboard.
// No frames are sent to a server; laptop camera pad states feed the local timer directly.
const cameraPanel=$('cameraButton').closest('.panel');
const originalCameraParent=cameraPanel.parentElement;
const originalCameraNext=cameraPanel.nextElementSibling;
const originalPlaceholder=$('cameraPlaceholder').innerHTML;
async function listCameraDevices(){
  if(!navigator.mediaDevices?.enumerateDevices)return;
  try{
    const cams=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');
    const picker=$('cameraDevice'),prior=picker.value;
    picker.replaceChildren(new Option('Default camera',''));
    cams.forEach((d,i)=>picker.add(new Option(d.label||'Camera '+(i+1),d.deviceId)));
    if(cams.some(d=>d.deviceId===prior))picker.value=prior;
  } catch(e) {
    $('cameraMessage').textContent='Cannot list cameras: '+(e?.message||e);
  }
}
function selectCameraSource(mode){
  if(!['phone','local'].includes(mode)||mode===cameraSource)return;
  if(engine.phase==='running'&&!confirm('Switch cameras and discard the current unfinished solve?'))return;
  // Stop current detector before moving its DOM elements.
  releaseCamera();
  engine.reset();
  cameraSource=mode;
  $('localCameraHolder').classList.toggle('hidden',mode!=='local');
  $('phonePairPanel').classList.toggle('hidden',mode!=='phone');
  for(const [button,active] of [['sourceLaptop',mode==='local'],['sourcePhone',mode==='phone']]){
    $(button).classList.toggle('active',active);
    $(button).setAttribute('aria-pressed',String(active));
  }
  if(mode==='local'){
    $('localCameraHolder').appendChild(cameraPanel);
    $('cameraHeading').textContent='02 · Laptop webcam / USB camera';
    $('cameraPlaceholder').innerHTML='📷<br>Point your laptop or USB webcam toward both resting hands.';
    $('cameraMessage').textContent='Choose your camera and click Start camera. Allow permission if requested.';
    // Existing paired phone must no longer control the timer.
    const conn=hostConn,peer=hostPeer;
    hostConn=null;hostPeer=null;hostReady=false;lastSignalAt=0;
    if(conn)conn.close();if(peer)peer.destroy();
    $('peerState').textContent='Not connected';
    setStatus('Laptop camera selected');
    void listCameraDevices();
  } else {
    originalCameraParent.insertBefore(cameraPanel,originalCameraNext);
    $('cameraHeading').textContent='02 · Show the tabletop';
    $('cameraPlaceholder').innerHTML=originalPlaceholder;
    $('cameraMessage').textContent='Pair your phone, then start its camera to detect both hands.';
    setStatus('Phone camera selected');
  }
}
$('sourceLaptop').addEventListener('click',()=>selectCameraSource('local'));
$('sourcePhone').addEventListener('click',()=>selectCameraSource('phone'));
$('cameraDevice').addEventListener('change',()=>{if(cameraOn)void startCamera();});
if(navigator.mediaDevices?.addEventListener){
  navigator.mediaDevices.addEventListener('devicechange',()=>{void listCameraDevices();});
}
