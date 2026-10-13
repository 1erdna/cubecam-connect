// 1ERDNA Cube Lab — manual screen recorder
// Separate from the timer and hand tracking. Nothing is uploaded.
const recEl = id => document.getElementById(id);
const startBtn = recEl('startScreenRecording');
const stopBtn = recEl('stopScreenRecording');
const badge = recEl('recordingBadge');
const elapsed = recEl('recordingElapsed');
const message = recEl('recordingMessage');
const resultPanel = recEl('recorderResult');
const playback = recEl('recordingPlayback');
const download = recEl('recordingDownload');
const sizeLabel = recEl('recordingSize');

let captureStream = null;
let activeRecorder = null;
let pieces = [];
let videoUrl = null;
let starting = false;
let recordingStart = 0;
let elapsedFrame = null;

function status(label, state = 'idle') {
  badge.textContent = label;
  badge.dataset.state = state;
}

function clockLabel(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' +
    String(seconds % 60).padStart(2, '0');
}

function tick() {
  if (!activeRecorder || activeRecorder.state !== 'recording') return;
  elapsed.textContent = clockLabel(performance.now() - recordingStart);
  elapsedFrame = requestAnimationFrame(tick);
}

function releaseStream() {
  if (!captureStream) return;
  for (const track of captureStream.getTracks()) track.stop();
  captureStream = null;
}

function discardOldPlayback() {
  playback.pause();
  playback.removeAttribute('src');
  playback.load();
  download.removeAttribute('href');
  if (videoUrl) URL.revokeObjectURL(videoUrl);
  videoUrl = null;
  resultPanel.classList.add('hidden');
  sizeLabel.textContent = '';
}

function resetControls() {
  starting = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (elapsedFrame !== null) cancelAnimationFrame(elapsedFrame);
  elapsedFrame = null;
}

function bestMimeType() {
  const options = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];
  return options.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function stopRecording() {
  if (!activeRecorder || activeRecorder.state !== 'recording') return;
  stopBtn.disabled = true;
  status('FINISHING…', 'processing');
  message.textContent = 'Finishing your clip… Please keep this tab open.';
  try {
    activeRecorder.stop();
  } catch (error) {
    releaseStream();
    activeRecorder = null;
    resetControls();
    status('RECORDING ERROR', 'error');
    message.textContent = 'Could not finish the clip: ' + (error?.message || error);
  }
}

async function startRecording() {
  if (starting || (activeRecorder && activeRecorder.state !== 'inactive')) return;
  if (!window.isSecureContext || !navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
    status('UNAVAILABLE', 'error');
    message.textContent = 'Screen recording needs desktop Chrome/Edge and a secure HTTPS page.';
    return;
  }

  starting = true;
  startBtn.disabled = true;
  stopBtn.disabled = true;
  status('SELECT A SCREEN…', 'processing');
  message.textContent = 'In the browser prompt, choose this Cube Lab tab (or a window/screen), then click Share.';

  try {
    // This permission prompt happens directly from the Start button press.
    // The browser decides what is shared; the app never bypasses permission.
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30, max: 30 } },
      audio: false
    });

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      for (const track of stream.getTracks()) track.stop();
      throw new Error('No video was selected.');
    }

    captureStream = stream;
    const mime = bestMimeType();
    const instance = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    activeRecorder = instance;
    pieces = [];

    instance.addEventListener('dataavailable', event => {
      if (event.data && event.data.size > 0) pieces.push(event.data);
    });

    instance.addEventListener('error', event => {
      message.textContent = 'Recording error: ' +
        (event.error?.message || 'Try recording again.');
      status('RECORDING ERROR', 'error');
      if (instance.state === 'recording') stopRecording();
    });

    instance.addEventListener('stop', () => {
      if (activeRecorder !== instance) return;

      const type = instance.mimeType || mime || 'video/webm';
      const blob = new Blob(pieces, { type });
      pieces = [];
      releaseStream();
      activeRecorder = null;
      resetControls();

      if (!blob.size) {
        status('EMPTY CLIP', 'error');
        message.textContent = 'Nothing was captured. Try sharing your Cube Lab tab again.';
        return;
      }

      discardOldPlayback();
      videoUrl = URL.createObjectURL(blob);
      playback.src = videoUrl;
      const extension = type.includes('mp4') ? 'mp4' : 'webm';
      download.href = videoUrl;
      download.download = '1erdna-cube-lab-' +
        new Date().toISOString().replace(/[:.]/g, '-') + '.' + extension;
      sizeLabel.textContent = (blob.size / (1024 * 1024)).toFixed(1) + ' MB · ' +
        extension.toUpperCase();
      resultPanel.classList.remove('hidden');
      status('CLIP READY', 'ready');
      message.textContent = 'Your recording is ready! Preview it below, then download before closing this tab.';
    }, { once: true });

    videoTrack.addEventListener('ended', () => {
      // Also handles the browser's own Stop sharing button.
      if (activeRecorder === instance && instance.state === 'recording') stopRecording();
    }, { once: true });

    discardOldPlayback();
    instance.start(1000);
    recordingStart = performance.now();
    elapsed.textContent = '00:00';
    starting = false;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    status('● RECORDING', 'recording');
    message.textContent = 'Recording your selected tab/window/screen. Click Stop recording when you are finished.';
    elapsedFrame = requestAnimationFrame(tick);

  } catch (error) {
    releaseStream();
    activeRecorder = null;
    resetControls();
    if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
      status('NOT RECORDING');
      message.textContent = 'Screen sharing was cancelled. No recording was made.';
    } else {
      status('COULD NOT START', 'error');
      message.textContent = 'Screen capture could not start: ' + (error?.message || error);
    }
  }
}

startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);

if (!window.isSecureContext || !navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
  startBtn.disabled = true;
  message.textContent = 'Manual screen recording works in supported desktop browsers over HTTPS (Chrome or Edge recommended).';
}

window.addEventListener('beforeunload', () => {
  releaseStream();
  if (videoUrl) URL.revokeObjectURL(videoUrl);
});
