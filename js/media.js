// Abrir ficheiros do disco local e sacar fotogramas soltos.
import { Input, BlobSource, ALL_FORMATS, CanvasSink } from '../vendor/mediabunny.min.mjs';
import { uid } from './model.js';
import { tErr } from './i18n.js';

function waitEvent(el, ok, bad) {
  return new Promise((res, rej) => {
    el.addEventListener(ok, res, { once: true });
    el.addEventListener(bad, () => rej(new Error(bad)), { once: true });
  });
}

export async function loadMedia(file) {
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith('image/')) {
      // 'load' e non img.decode(): decode() non remata se a xanela non se está a pintar.
      const img = new Image();
      const loaded = waitEvent(img, 'load', 'error');
      img.src = url;
      await loaded;
      return { id: uid(), kind: 'image', name: file.name, file, url, el: img, w: img.naturalWidth, h: img.naturalHeight };
    }
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.src = url;
    await waitEvent(v, 'loadeddata', 'error');
    const { videoWidth: w, videoHeight: h, duration: dur } = v;
    v.removeAttribute('src');
    v.load();
    if (!w || !Number.isFinite(dur) || dur <= 0) throw new Error('unsupported');
    return { id: uid(), kind: 'video', name: file.name, file, url, w, h, dur };
  } catch {
    URL.revokeObjectURL(url);
    // Os móbiles gravan ás veces en HEVC (H.265), que moitos navegadores non len.
    if (!file.type.startsWith('image/') && await isHevc(file)) throw tErr('err_hevc', { name: file.name });
    throw tErr('err_open', { name: file.name });
  }
}

async function isHevc(file) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    return (await input.getPrimaryVideoTrack())?.codec === 'hevc';
  } catch {
    return false;
  } finally {
    input.dispose();
  }
}

export function mediaFromCanvas(canvas, name) {
  return { id: uid(), kind: 'image', name, el: canvas, w: canvas.width, h: canvas.height };
}

export function mediaFromFrames(frames, fps, name) {
  return { id: uid(), kind: 'frames', name, frames, fps, w: frames[0].width, h: frames[0].height };
}

export function frameIndex(media, src) {
  return Math.min(media.frames.length - 1, Math.max(0, Math.floor(src * media.fps + 1e-6)));
}

function copyToCanvas(source, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(source, 0, 0, w, h);
  return c;
}

// Fotograma exacto dun anaco no tempo src do seu medio, como canvas propio.
export async function grabFrame(clip, src) {
  const m = clip.media;
  if (m.kind === 'image') return copyToCanvas(m.el, m.w, m.h);
  if (m.kind === 'frames') { const f = m.frames[frameIndex(m, src)]; return copyToCanvas(f, f.width, f.height); }
  const input = new Input({ source: new BlobSource(m.file), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (track && await track.canDecode()) {
      const first = await track.getFirstTimestamp();
      const end = await track.computeDuration();
      const r = await new CanvasSink(track).getCanvas(Math.min(first + src, end - 0.001));
      if (r) return copyToCanvas(r.canvas, r.canvas.width, r.canvas.height);
    }
  } finally {
    input.dispose();
  }
  // Plan B: buscar o instante cun elemento <video>.
  const v = document.createElement('video');
  v.muted = true;
  v.preload = 'auto';
  v.src = m.url;
  await waitEvent(v, 'loadeddata', 'error');
  v.currentTime = Math.min(src, m.dur - 0.03);
  await waitEvent(v, 'seeked', 'error');
  const c = copyToCanvas(v, m.w, m.h);
  v.removeAttribute('src');
  v.load();
  return c;
}
