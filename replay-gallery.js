// Browser-local Replay Vault. Clips are never uploaded and are not placed in localStorage.
// The browser can clear site storage, so Download is the safe way to keep a clip.
const list=document.getElementById('replayList');
if(list){
 const status=document.getElementById('replayStatus');
 const player=document.getElementById('replayPlayer');
 const panel=document.getElementById('replayPlayerPanel');
 const playerTitle=document.getElementById('replayPlayerTitle');
 const galleryNote=document.getElementById('replayStorageNote');
 let database=null,previewUrl=null;
 const say=text=>{status.textContent=text};
 const formatSize=bytes=>(bytes/(1024*1024)).toFixed(1)+' MB';
 const safeName=name=>String(name||'cube-lab-replay.webm').replace(/[^a-zA-Z0-9._-]/g,'_');
 function openDb(){
  return new Promise((resolve,reject)=>{
   if(!('indexedDB'in window))return reject(new Error('IndexedDB is unavailable'));
   const request=indexedDB.open('1erdna-cube-lab-recordings',1);
   request.onupgradeneeded=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains('replays')){
     const store=db.createObjectStore('replays',{keyPath:'id',autoIncrement:true});
     store.createIndex('savedAt','savedAt');
    }
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||new Error('Storage could not be opened'));
  });
 }
 function store(mode='readonly'){
  if(!database)throw new Error('Local replay storage is unavailable');
  return database.transaction('replays',mode).objectStore('replays');
 }
 function reqPromise(request){
  return new Promise((resolve,reject)=>{
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||new Error('Replay operation failed'));
  });
 }
 async function get(id){return reqPromise(store().get(id))}
 async function save(blob,name){
  if(!database||!blob?.size){
   say('Clip ready to download above, but permanent browser replay storage is unavailable.');
   return;
  }
  try{
   const event=document.getElementById('event')?.value||'333';
   const entry={name:safeName(name),blob,event,size:blob.size,
    savedAt:Date.now(),type:blob.type||'video/webm'};
   await reqPromise(store('readwrite').add(entry));
   await refresh();
   say('Saved to this browser’s Replay Vault. Download important solves for backup.');
  }catch(e){
   say('Could not keep this clip in the vault (browser storage may be full). Download it above.');
  }
 }
 function releasePreview(){
  player.pause();
  player.removeAttribute('src');player.load();
  if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
 }
 async function watch(id){
  try{
   const item=await get(id);
   if(!item)return say('That replay is no longer available.');
   releasePreview();
   previewUrl=URL.createObjectURL(item.blob);
   player.src=previewUrl;playerTitle.textContent=item.name;
   panel.classList.remove('hidden');
   panel.scrollIntoView({behavior:'smooth',block:'nearest'});
   try{await player.play()}catch{}
  }catch{say('Unable to open this replay in the browser.')}
 }
 async function download(id){
  try{
   const item=await get(id);if(!item)return;
   const url=URL.createObjectURL(item.blob);
   const a=document.createElement('a');
   a.href=url;a.download=safeName(item.name);document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),10000);
  }catch{say('Download unavailable. Try refreshing the page.')}
 }
 async function remove(id){
  if(!window.confirm('Delete this locally saved replay? This cannot be undone.'))return;
  try{
   await reqPromise(store('readwrite').delete(id));
   releasePreview();panel.classList.add('hidden');
   await refresh();say('Replay deleted from this browser.');
  }catch{say('Unable to delete the selected replay.')}
 }
 function action(text,aria,handler,className=''){
  const button=document.createElement('button');
  button.type='button';button.className='replayAction '+className;
  button.textContent=text;button.setAttribute('aria-label',aria);
  button.addEventListener('click',handler);
  return button;
 }
 function card(item){
  const li=document.createElement('li');li.className='replayCard';
  const info=document.createElement('div');info.className='replayInfo';
  const title=document.createElement('strong');title.textContent=item.name;
  const meta=document.createElement('span');
  meta.textContent=new Date(item.savedAt).toLocaleString()+' · '+(item.event==='222'?'2×2':'3×3')+' · '+formatSize(item.size);
  info.append(title,meta);
  const buttons=document.createElement('div');buttons.className='replayActions';
  buttons.append(
   action('▶ Watch','Watch '+item.name,()=>watch(item.id)),
   action('↓ Save','Download '+item.name,()=>download(item.id)),
   action('× Delete','Delete '+item.name,()=>remove(item.id),'replayDelete')
  );
  li.append(info,buttons);return li;
 }
 async function refresh(){
  if(!database)return;
  list.replaceChildren();
  let count=0;
  return new Promise(resolve=>{
   let request;
   try{request=store().index('savedAt').openCursor(null,'prev')}
   catch{say('Unable to list saved replays.');return resolve()}
   request.onsuccess=event=>{
    const cursor=event.target.result;
    if(!cursor){
     if(count===0){
      const li=document.createElement('li');li.className='replayEmpty';
      li.textContent='Your saved solve recordings will appear here.';
      list.append(li);
     }
     if(galleryNote)galleryNote.textContent=count+' locally saved clip'+(count===1?'':'s')+' · Browser-only storage';
     resolve();return;
    }
    count++;list.append(card(cursor.value));cursor.continue();
   };
   request.onerror=()=>{say('Error reading saved recordings.');resolve()};
  });
 }
 window.addEventListener('cubeLab:recordingReady',event=>{
  const {blob,name}=event.detail||{};
  if(blob instanceof Blob)void save(blob,name);
 });
 window.addEventListener('beforeunload',releasePreview);
 openDb().then(db=>{
  database=db;void refresh();
  say('Record a solve to save it automatically in this browser.');
 }).catch(()=>{
  say('Replay storage unavailable. You can still download recordings from the recorder above.');
  if(galleryNote)galleryNote.textContent='Browser storage unavailable';
 });
}
