// 1ERDNA Cube Lab — website-only manual recording, with optional browser-tab capture.
// Website-only mode draws our own Cube Lab session canvas. It never sees other tabs,
// system windows, or desktop pixels. No uploads or external recording services.
const rec = id => document.getElementById(id);
const startButton = rec('startScreenRecording');
const stopButton = rec('stopScreenRecording');
const target = rec('recordingTarget');
const badge = rec('recordingBadge');
const timerLabel = rec('recordingElapsed');
const message = rec('recordingMessage');
const result = rec('recorderResult');
const player = rec('recordingPlayback');
const downloadLink = rec('recordingDownload');
const sizeText = rec('recordingSize');
const studioCanvas = rec('studioRecordingCanvas');
const studio = studioCanvas.getContext('2d', { alpha: false });

let stream = null;
let mediaRecorder = null;
let chunks = [];
let clipUrl = null;
let pending = false;
let startedAt = 0;
let clockFrame = null;
let videoFrame = null;
let streamMode = 'website';
let lastCanvasDrawAt = 0;

const c = {
  background: '#05070b', panel: '#0b1018', edge: '#2d4558',
  foreground: '#f1f8ff', muted: '#8da8bc', blue: '#29baff',
  bright: '#93dfff', quiet: '#0e1b28'
};

function badgeStatus(label, state='idle') {
  badge.textContent = label;
  badge.dataset.state = state;
}

function smallTime(ms) {
  const s = Math.floor(ms/1000);
  return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
}

function rounded(x,y,w,h,r=16) {
  r=Math.min(r,w/2,h/2);
  studio.beginPath();
  studio.moveTo(x+r,y);
  studio.lineTo(x+w-r,y);studio.quadraticCurveTo(x+w,y,x+w,y+r);
  studio.lineTo(x+w,y+h-r);studio.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  studio.lineTo(x+r,y+h);studio.quadraticCurveTo(x,y+h,x,y+h-r);
  studio.lineTo(x,y+r);studio.quadraticCurveTo(x,y,x+r,y);
  studio.closePath();
}
function panel(x,y,w,h) {
  rounded(x,y,w,h,2);
  studio.fillStyle=c.panel;studio.fill();
  studio.strokeStyle=c.edge;studio.lineWidth=1.5;studio.stroke();
}
function label(str,x,y,{size=15,color=c.muted,bold=false,align='left'}={}) {
  studio.save();
  studio.fillStyle=color;
  studio.font=(bold?'700 ':'500 ')+size+'px system-ui, sans-serif';
  studio.textAlign=align;studio.textBaseline='alphabetic';
  studio.fillText(String(str),x,y);
  studio.restore();
}
function wrapLines(str,x,y,maxWidth,lineHeight,maxLines=3) {
  studio.font='600 27px system-ui, sans-serif';
  studio.fillStyle=c.foreground;
  studio.textAlign='left';
  const words=String(str||'Waiting for scramble…').split(/\s+/);
  let line='',lineIndex=0;
  for(const word of words) {
    const next=(line?line+' ':'')+word;
    if(studio.measureText(next).width>maxWidth && line) {
      if(lineIndex<maxLines) studio.fillText(line,x,y+lineIndex*lineHeight);
      lineIndex++;line=word;
    } else line=next;
  }
  if(lineIndex<maxLines)studio.fillText(line,x,y+lineIndex*lineHeight);
}

function cameraVideo() {
  const usingLocal=rec('sourceLaptop')?.classList.contains('active');
  const video=rec(usingLocal?'cameraVideo':'remotePhoneVideo');
  return {video,usingLocal};
}

function cameraFrame(x,y,w,h) {
  studio.save();
  rounded(x,y,w,h,2);studio.clip();
  studio.fillStyle='#050e1c';studio.fillRect(x,y,w,h);

  const {video,usingLocal}=cameraVideo();
  if(video && video.readyState>=2 && video.videoWidth>0 && video.videoHeight>0) {
    const ratio=Math.min(w/video.videoWidth,h/video.videoHeight);
    const dw=video.videoWidth*ratio,dh=video.videoHeight*ratio;
    const dx=x+(w-dw)/2,dy=y+(h-dh)/2;
    try {
      studio.save();
      if(video.classList.contains('front')){
        studio.translate(dx+dw,dy);studio.scale(-1,1);
        studio.drawImage(video,0,0,dw,dh);
      } else studio.drawImage(video,dx,dy,dw,dh);
      studio.restore();
      if(usingLocal){
        const overlay=rec('cameraOverlay');
        if(overlay && overlay.width>0 && overlay.height>0){
          studio.drawImage(overlay,dx,dy,dw,dh);
        }
      }else {
        // Recreate the paired-phone overlay from received live zone settings.
        const guides=rec('remoteGuides');
        const zoneWidth=Math.min(.45,Math.max(.20,(parseFloat(guides?.style.getPropertyValue('--zone-width'))||26.8)/100));
        const zoneTop=Math.min(.65,Math.max(.10,(parseFloat(guides?.style.getPropertyValue('--zone-top'))||32)/100));
        const leftX=(parseFloat(guides?.style.getPropertyValue('--left-zone-x'))||1.2)/100;
        const rightX=(parseFloat(guides?.style.getPropertyValue('--right-zone-x'))||72)/100;
        ['remoteLeftZone','remoteRightZone'].forEach((id,i)=>{
          const xx=dx+dw*(i===0?leftX:rightX);
          const yy=dy+dh*zoneTop;
          const ww=dw*zoneWidth,hh=dh*(.988-zoneTop);
          studio.fillStyle=rec(id)?.classList.contains('detected')?'#32b9ff55':'#0879dc25';
          studio.fillRect(xx,yy,ww,hh);
          studio.strokeStyle='#55c6ff';studio.lineWidth=2;
          studio.strokeRect(xx,yy,ww,hh);
        });
      }
    }catch(err){
      label('Camera frame temporarily unavailable',x+w/2,y+h/2,{size:13,align:'center'});
    }
  } else {
    label('CAMERA PREVIEW',x+w/2,y+h/2-12,{size:17,bold:true,color:c.bright,align:'center'});
    label(usingLocal?'Start your laptop camera to include video':'Pair phone + enable live video sharing',x+w/2,y+h/2+16,{size:12,align:'center'});
  }
  studio.restore();
  rounded(x,y,w,h,2);studio.strokeStyle='#2c546d';studio.lineWidth=1.5;studio.stroke();
}

function padPill(x,y,w,left) {
  const el=rec(left?'leftStatus':'rightStatus');
  const lit=Boolean(el?.classList.contains('on'));
  rounded(x,y,w,44,2);
  studio.fillStyle=lit?'#12415d':'#0d1e2b';studio.fill();
  studio.strokeStyle=lit?'#59ccff':'#2a4765';studio.lineWidth=1;studio.stroke();
  label((left?'LEFT':'RIGHT')+(lit?' · RESTING':' · OFF'),x+w/2,y+29,{
    size:15,bold:true,align:'center',color:lit?'#b8efff':'#8ea7c2'
  });
}

function drawStudio() {
  if(!studio)return;
  const w=studioCanvas.width,h=studioCanvas.height;
  studio.fillStyle=c.background;studio.fillRect(0,0,w,h);
  // Flat studio backdrop: intentionally no glassmorphism or background gradients.
  studio.fillStyle='#05070b';studio.fillRect(0,0,w,h);
  studio.fillStyle=c.blue;studio.fillRect(48,82,1184,2);

  label('1E  /  1ERDNA',48,59,{size:29,bold:true,color:c.bright});
  label('CUBE LAB  /  PRACTICE RECORDING',251,56,{size:13,bold:true,color:c.muted});
  label('WEBSITE ONLY  •  NO DESKTOP CAPTURE',1231,56,{size:13,color:c.blue,align:'right'});
  studio.strokeStyle='#2b4860';studio.lineWidth=1;studio.beginPath();studio.moveTo(48,84);studio.lineTo(1232,84);studio.stroke();

  panel(48,108,755,161);
  label('01  /  SCRAMBLE',74,145,{size:14,bold:true,color:c.blue});
  label(rec('event')?.selectedOptions?.[0]?.textContent||'3×3 cube',772,145,{size:13,align:'right'});
  wrapLines(rec('scramble')?.textContent,74,193,690,31,3);

  panel(48,286,755,356);
  label('02  /  LIVE TIMER',74,324,{size:14,bold:true,color:c.blue});
  const time=rec('clock')?.textContent||'0.00';
  const size=time.length>8?105:time.length>6?121:151;
  label(time,425,480,{size,bold:true,color:c.foreground,align:'center'});
  label(rec('phase')?.textContent||'WAITING FOR HANDS',425,525,{size:17,bold:true,color:c.blue,align:'center'});
  padPill(188,552,194,true);padPill(404,552,194,false);

  panel(818,108,414,383);
  label('03  /  CAMERA MONITOR',842,145,{size:14,bold:true,color:c.blue});
  label(rec('dockMode')?.textContent||'LIVE CAMERA',1208,145,{size:11,align:'right'});
  cameraFrame(842,164,366,256);
  label('Blue zones show hand placement',842,458,{size:13});

  panel(818,508,414,134);
  label('04  /  SESSION STATISTICS',842,537,{size:14,bold:true,color:c.blue});
  const fields=[['SOLVES','solveCount'],['BEST','pb'],['AO5','ao5'],['MEAN','mean']];
  fields.forEach(([title,id],i)=>{
    const x=842+i*94;
    label(title,x,568,{size:11,bold:true});
    label(rec(id)?.textContent?.trim()||'—',x,604,{size:23,bold:true,color:c.foreground});
  });

  label('1ERDNA / BUILD SPEED. BEAT TIME.',48,685,{size:12,bold:true,color:c.muted});
  label('RECORDED LOCALLY  •  VIDEO ONLY',1230,685,{size:12,color:c.muted,align:'right'});
}

function stopDrawing() {
  if(videoFrame!==null)cancelAnimationFrame(videoFrame);
  videoFrame=null;
}
function keepDrawing(now){
  if(!mediaRecorder || mediaRecorder.state!=='recording' || streamMode!=='website')return;
  // Webcam hand tracking and the recording canvas run in the same browser tab.
  // Limit redrawing to ~24fps to avoid overloading MediaPipe on slower laptops.
  if(now-lastCanvasDrawAt>=42){
    drawStudio();
    lastCanvasDrawAt=now;
  }
  videoFrame=requestAnimationFrame(keepDrawing);
}
function clockTick(){
  if(!mediaRecorder || mediaRecorder.state!=='recording')return;
  timerLabel.textContent=smallTime(performance.now()-startedAt);
  clockFrame=requestAnimationFrame(clockTick);
}
function stopClock(){
  if(clockFrame!==null)cancelAnimationFrame(clockFrame);
  clockFrame=null;
}
function releaseCapture(){
  if(stream)for(const t of stream.getTracks())t.stop();
  stream=null;
}
function clearPreviousClip(){
  player.pause();
  player.removeAttribute('src');
  player.load();
  downloadLink.removeAttribute('href');
  if(clipUrl)URL.revokeObjectURL(clipUrl);
  clipUrl=null;
  sizeText.textContent='';
  result.classList.add('hidden');
}
function resetButtons(){
  pending=false;stopButton.disabled=true;startButton.disabled=false;target.disabled=false;
  stopClock();stopDrawing();
}
function preferredMime(){
  const types=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
  return types.find(type=>MediaRecorder.isTypeSupported(type))||'';
}
function stopRecording(){
  if(!mediaRecorder || mediaRecorder.state!=='recording')return;
  stopButton.disabled=true;
  badgeStatus('FINISHING CLIP…','processing');
  message.textContent='Saving your video to the local preview…';
  try{mediaRecorder.stop();}
  catch(err){
    stopDrawing();releaseCapture();mediaRecorder=null;resetButtons();
    badgeStatus('RECORDING ERROR','error');
    message.textContent='Could not stop recording: '+(err?.message||err);
  }
}
async function startRecording(){
  if(pending || (mediaRecorder && mediaRecorder.state!=='inactive'))return;
  if(!window.isSecureContext || typeof MediaRecorder==='undefined'){
    badgeStatus('UNAVAILABLE','error');
    message.textContent='A secure HTTPS page and MediaRecorder support are required.';
    return;
  }
  streamMode=target.value==='screen'?'screen':'website';
  if(streamMode==='website' && typeof studioCanvas.captureStream!=='function'){
    badgeStatus('UNSUPPORTED','error');
    message.textContent='Website-only recording needs a browser with canvas.captureStream (latest Opera, Chrome, or Edge).';
    return;
  }
  if(streamMode==='screen' && !navigator.mediaDevices?.getDisplayMedia){
    badgeStatus('UNSUPPORTED','error');
    message.textContent='This browser does not support screen sharing.';
    return;
  }
  pending=true;target.disabled=true;startButton.disabled=true;stopButton.disabled=true;
  badgeStatus(streamMode==='website'?'PREPARING CUBE LAB…':'SELECT A TAB…','processing');
  message.textContent=streamMode==='website'
    ?'Preparing your Cube Lab-only video (no screen-sharing dialog).'
    :'In the browser prompt, choose the Cube Lab tab or window to share.';

  try{
    if(streamMode==='website'){
      drawStudio();
      stream=studioCanvas.captureStream(25);
    }else{
      // Only used when the user explicitly selects the browser-sharing fallback.
      stream=await navigator.mediaDevices.getDisplayMedia({
        video:{frameRate:{ideal:25,max:30}},
        audio:false,
        preferCurrentTab:true,
        selfBrowserSurface:'include'
      });
    }
    if(!stream.getVideoTracks().length)throw new Error('No video track was captured.');

    const mime=preferredMime();
    const recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
    mediaRecorder=recorder;
    chunks=[];
    recorder.addEventListener('dataavailable',evt=>{
      if(evt.data?.size>0)chunks.push(evt.data);
    });
    recorder.addEventListener('error',evt=>{
      message.textContent='Recording issue: '+(evt.error?.message||'Unknown encoder error.');
      if(recorder.state==='recording')stopRecording();
    });
    recorder.addEventListener('stop',()=>{
      if(mediaRecorder!==recorder)return;
      stopDrawing();
      releaseCapture();
      mediaRecorder=null;
      resetButtons();
      const type=recorder.mimeType||mime||'video/webm';
      const blob=new Blob(chunks,{type});
      chunks=[];
      if(!blob.size){
        badgeStatus('EMPTY CLIP','error');
        message.textContent='No video frames were saved. Keep this tab visible and try again.';
        return;
      }
      clearPreviousClip();
      clipUrl=URL.createObjectURL(blob);
      player.src=clipUrl;
      const ext=type.includes('mp4')?'mp4':'webm';
      downloadLink.href=clipUrl;
      downloadLink.download='1erdna-cubelab-'+new Date().toISOString().replace(/[:.]/g,'-')+'.'+ext;
      sizeText.textContent=(blob.size/(1024*1024)).toFixed(1)+' MB · '+ext.toUpperCase();
      result.classList.remove('hidden');
      // The local replay vault listens for this event. No network upload occurs.
      window.dispatchEvent(new CustomEvent('cubeLab:recordingReady',{
        detail:{blob,name:downloadLink.download}
      }));
      badgeStatus('CLIP READY','ready');
      message.textContent='Done! Watch your Cube Lab video below and click Download recording before leaving.';
    },{once:true});

    if(streamMode==='screen'){
      const track=stream.getVideoTracks()[0];
      track.addEventListener('ended',()=>{
        if(mediaRecorder===recorder && recorder.state==='recording')stopRecording();
      },{once:true});
    }
    clearPreviousClip();
    recorder.start(1000);
    startedAt=performance.now();
    timerLabel.textContent='00:00';
    pending=false;startButton.disabled=true;stopButton.disabled=false;
    badgeStatus('● RECORDING','recording');
    message.textContent=streamMode==='website'
      ?'Recording Cube Lab only. Keep this tab visible, solve normally, then click Stop recording.'
      :'Recording the selected browser surface. Stop when finished.';
    if(streamMode==='website')videoFrame=requestAnimationFrame(keepDrawing);
    clockFrame=requestAnimationFrame(clockTick);
  }catch(error){
    stopDrawing();releaseCapture();mediaRecorder=null;resetButtons();
    if(error?.name==='NotAllowedError'||error?.name==='AbortError'){
      badgeStatus('NOT RECORDING');
      message.textContent='Sharing was cancelled. Nothing was recorded.';
    } else {
      badgeStatus('COULD NOT START','error');
      message.textContent='Recording could not start: '+(error?.message||error);
    }
  }
}

function updateTarget(){
  if(mediaRecorder || pending)return;
  const website=target.value!=='screen';
  startButton.innerHTML=website
    ?'<span aria-hidden="true">●</span> Record Cube Lab only'
    :'<span aria-hidden="true">●</span> Record selected tab';
  message.textContent=website
    ?'Records only the Cube Lab timer, scramble, camera and stats. No Opera sharing popup. Keep this tab visible.'
    :'Your browser will open its screen-sharing picker. To avoid capturing other apps, choose only a browser tab.';
}

startButton.addEventListener('click',startRecording);
stopButton.addEventListener('click',stopRecording);
target.addEventListener('change',updateTarget);

// Lightweight preview while idle; full-rate canvas redraw only while recording.
if(studio){
  drawStudio();
  setInterval(()=>{
    if(!pending && (!mediaRecorder || mediaRecorder.state!=='recording') && !document.hidden)drawStudio();
  },450);
}
if(!window.isSecureContext || typeof MediaRecorder==='undefined'){
  startButton.disabled=true;
  message.textContent='Recording requires HTTPS and a browser with MediaRecorder support.';
}
window.addEventListener('beforeunload',()=>{
  stopClock();stopDrawing();releaseCapture();
  if(clipUrl)URL.revokeObjectURL(clipUrl);
});
