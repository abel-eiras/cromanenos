// Gravar un vídeo coa cámara sen saír de Cromanenos. A gravación queda só
// neste ordenador, coma calquera outro vídeo.
import {
  Input, Output, BlobSource, BufferTarget, ALL_FORMATS, Mp4OutputFormat, WebMOutputFormat, Conversion,
} from '../vendor/mediabunny.min.mjs';
import { t } from './i18n.js';

const $ = (id) => document.getElementById(id);
const TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
];

// ------------------------------------------------------------------ gravación
// Comeza a gravar un MediaStream. stop() devolve a gravación en bruto.
export function startRecorder(stream) {
  const mimeType = TYPES.find((m) => MediaRecorder.isTypeSupported(m));
  const mr = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 5_000_000 } : undefined);
  const chunks = [];
  mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise((res) => { mr.onstop = res; });
  mr.start(1000);
  return {
    async stop() {
      if (mr.state !== 'inactive') mr.stop();
      await done;
      return new Blob(chunks, { type: mr.mimeType || mimeType || 'video/webm' });
    },
  };
}

// O que sae do gravador non trae duración nin índice para saltar a un
// instante. Reescríbese o contedor (sen recodificar) para que sexa un vídeo
// normal: con duración, con saltos e listo para recortar ou gardar.
export async function makeSeekable(blob, name) {
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error('no-video');
    const mp4 = track.codec === 'avc' || track.codec === 'hevc';
    const output = new Output({ format: mp4 ? new Mp4OutputFormat() : new WebMOutputFormat(), target: new BufferTarget() });
    const conversion = await Conversion.init({ input, output });
    if (!conversion.isValid) throw new Error('no-conversion');
    await conversion.execute();
    return new File([output.target.buffer], `${name}.${mp4 ? 'mp4' : 'webm'}`, { type: mp4 ? 'video/mp4' : 'video/webm' });
  } finally {
    input.dispose();
  }
}

// --------------------------------------------------------------------- diálogo
let stream = null;
let recorder = null;
let file = null;
let done = null;
let count = 0;
let timer = 0;
let startedAt = 0;
let takes = 0;
let phase = 'off'; // off | live | count | rec | busy | review | nocam

function setPhase(p) {
  phase = p;
  const live = p === 'live' || p === 'count' || p === 'rec';
  $('camVideo').hidden = p === 'review';
  $('camPlay').hidden = p !== 'review';
  $('camCount').hidden = p !== 'count';
  $('camCount').textContent = count ? String(count) : '';
  $('camRec').hidden = !(p === 'live' || p === 'rec' || p === 'count');
  $('camRec').disabled = p === 'count';
  $('camRec').textContent = t(p === 'rec' ? 'cam_stop' : 'cam_rec');
  $('camRec').classList.toggle('on', p === 'rec');
  $('camUse').hidden = p !== 'review';
  $('camRetry').hidden = p !== 'review';
  $('camTime').hidden = p !== 'rec';
  $('camView').classList.toggle('nocam', p === 'nocam');
  $('camMsg').textContent = p === 'nocam' ? t('err_camRec') : p === 'busy' ? t('cam_busy') : live || p === 'review' ? '' : '';
}

function stopStream() {
  if (stream) stream.getTracks().forEach((tr) => tr.stop());
  stream = null;
  $('camVideo').srcObject = null;
}

function clearReview() {
  const v = $('camPlay');
  if (v.src) { URL.revokeObjectURL(v.src); v.removeAttribute('src'); v.load(); }
  file = null;
}

async function openCamera() {
  clearReview();
  try {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('no-camera');
    const video = { width: { ideal: 1280 }, height: { ideal: 720 } };
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({ video }); // sen micrófono: só imaxe
    }
    $('camVideo').srcObject = stream;
    setPhase('live');
  } catch {
    stream = null;
    setPhase('nocam');
  }
}

function tick() {
  const s = Math.floor((performance.now() - startedAt) / 1000);
  $('camTime').textContent = `⏺ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function beginCountdown() {
  count = 3;
  setPhase('count');
  timer = setInterval(() => {
    count--;
    if (count > 0) { $('camCount').textContent = String(count); return; }
    clearInterval(timer);
    recorder = startRecorder(stream);
    startedAt = performance.now();
    setPhase('rec');
    tick();
    timer = setInterval(tick, 500);
  }, 1000);
}

async function endRecording() {
  clearInterval(timer);
  const r = recorder;
  recorder = null;
  setPhase('busy');
  try {
    takes++;
    file = await makeSeekable(await r.stop(), `${t('cam_name')} ${takes}`);
    stopStream();
    $('camPlay').src = URL.createObjectURL(file);
    setPhase('review');
  } catch {
    file = null;
    setPhase(stream ? 'live' : 'nocam');
    $('camMsg').textContent = t('err_camSave');
  }
}

function finish(result) {
  clearInterval(timer);
  if (recorder) { recorder.stop().catch(() => {}); recorder = null; }
  stopStream();
  const f = result ? file : null;
  clearReview();
  phase = 'off';
  if ($('camDialog').open) $('camDialog').close();
  const cb = done;
  done = null;
  if (cb && f) cb(f);
}

export function initCamera() {
  $('camRec').addEventListener('click', () => {
    if (phase === 'live') beginCountdown();
    else if (phase === 'rec') endRecording();
  });
  $('camRetry').addEventListener('click', openCamera);
  $('camUse').addEventListener('click', () => finish(true));
  $('camCancel').addEventListener('click', () => finish(false));
  $('camDialog').addEventListener('cancel', () => finish(false));
}

// onDone(File) chámase só se se preme "Usar".
export function openCameraDialog(onDone) {
  done = onDone;
  setPhase('off');
  $('camDialog').showModal();
  openCamera();
}

export function retranslate() {
  if ($('camDialog').open) setPhase(phase);
}
