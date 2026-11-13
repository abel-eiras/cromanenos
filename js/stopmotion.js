// Diálogo de stop motion: fotos coa cámara web (con "pel de cebola" da foto
// anterior) ou escollidas do ordenador.
import { t } from './i18n.js';

const MAX_W = 1280;
const $ = (id) => document.getElementById(id);

let stream = null;
let frames = [];
let fps = 8;
let done = null;

function toCanvas(source, sw, sh) {
  const s = Math.min(1, MAX_W / sw);
  const c = document.createElement('canvas');
  c.width = Math.round(sw * s);
  c.height = Math.round(sh * s);
  c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
  return c;
}

function refresh() {
  const strip = $('smStrip');
  strip.replaceChildren();
  for (const f of frames.slice(-12)) {
    const th = document.createElement('canvas');
    th.width = 96;
    th.height = Math.round(96 * f.height / f.width);
    th.getContext('2d').drawImage(f, 0, 0, th.width, th.height);
    strip.append(th);
  }
  const onion = $('smOnion');
  const last = frames[frames.length - 1];
  onion.hidden = !last;
  if (last) {
    onion.width = last.width;
    onion.height = last.height;
    onion.getContext('2d').drawImage(last, 0, 0);
  }
  $('smUse').textContent = t('sm_use', { n: frames.length });
  $('smUse').disabled = !frames.length;
  $('smUndo').disabled = !frames.length;
  $('smSnap').disabled = !stream;
  document.querySelectorAll('#smFps button').forEach((b) => b.classList.toggle('on', +b.dataset.fps === fps));
}

function stopCamera() {
  if (stream) stream.getTracks().forEach((tr) => tr.stop());
  stream = null;
  $('smVideo').srcObject = null;
}

async function startCamera() {
  const view = $('smView');
  $('smMsg').textContent = '';
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera');
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
    $('smVideo').srcObject = stream;
    view.classList.remove('nocam');
  } catch {
    stream = null;
    view.classList.add('nocam');
    $('smMsg').textContent = t('err_cam');
  }
  refresh();
}

function finish(result) {
  stopCamera();
  $('smDialog').close();
  const cb = done;
  done = null;
  if (cb && result) cb(result);
}

export function initStopMotion() {
  $('smSnap').addEventListener('click', () => {
    const v = $('smVideo');
    if (!stream || !v.videoWidth) return;
    frames.push(toCanvas(v, v.videoWidth, v.videoHeight));
    refresh();
  });
  $('smUndo').addEventListener('click', () => { frames.pop(); refresh(); });
  $('smFiles').addEventListener('change', async (e) => {
    const files = [...e.target.files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    e.target.value = '';
    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
        frames.push(toCanvas(img, img.naturalWidth, img.naturalHeight));
      } catch { /* sáltase a foto que non se poida ler */ }
      URL.revokeObjectURL(url);
    }
    refresh();
  });
  document.querySelectorAll('#smFps button').forEach((b) => b.addEventListener('click', () => { fps = +b.dataset.fps; refresh(); }));
  $('smCancel').addEventListener('click', () => finish(null));
  $('smUse').addEventListener('click', () => finish(frames.length ? { frames, fps } : null));
  $('smDialog').addEventListener('cancel', () => { stopCamera(); done = null; });
}

// onDone({ frames: [canvas…], fps }) chámase só se se preme "Usar".
export function openStopMotion(onDone) {
  frames = [];
  done = onDone;
  $('smDialog').showModal();
  refresh();
  startCamera();
}

// Se cambia o idioma co diálogo aberto.
export function retranslate() {
  if ($('smDialog').open) {
    refresh();
    if (!stream) $('smMsg').textContent = t('err_cam');
  }
}
