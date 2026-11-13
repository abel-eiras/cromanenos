// Vista previa en tempo real: move os <video> ao instante que toca e debuxa.
import { project, ui, duration, trackAt, srcTime, speedOf, isReverse, findClip } from './model.js';
import { frameIndex } from './media.js';
import { draw } from './compositor.js';
import * as overlay from './overlay.js';
import { startSounds, stopSounds } from './audio.js';

// Un <video> por pista e medio: dous anacos seguidos do mesmo vídeo (despois
// dun corte) seguen soando sen salto.
const els = new Map();
function elFor(ti, media) {
  const k = `${ti}:${media.id}`;
  let el = els.get(k);
  if (!el) {
    el = document.createElement('video');
    el.playsInline = true;
    el.preload = 'auto';
    el.preservesPitch = false; // igual ca no vídeo gardado: rápido = voz aguda
    el.src = media.url;
    els.set(k, el);
  }
  return el;
}

let wallStart = 0;
let onTick = () => {};
export function setOnTick(fn) { onTick = fn; }

export function play() {
  const D = duration();
  if (!D || ui.exporting) return;
  if (ui.t >= D - 0.05) ui.t = 0;
  wallStart = performance.now() - ui.t * 1000;
  ui.playing = true;
  startSounds(ui.t);
}

export function pause() {
  ui.playing = false;
  for (const el of els.values()) if (!el.paused) el.pause();
  stopSounds();
}

export function seek(t) {
  if (ui.playing) pause();
  ui.t = Math.min(Math.max(0, t), duration());
}

function syncTrack(ti, a) {
  let active = null;
  if (a && a.clip.media.kind === 'video') {
    const c = a.clip, m = c.media;
    const el = elFor(ti, m);
    active = el;
    const want = Math.min(srcTime(c, a.local), m.dur - 0.03);
    const forward = ui.playing && !isReverse(c) && !a.hold && want < m.dur - 0.06;
    if (forward) {
      const speed = speedOf(c);
      if (el.playbackRate !== speed) el.playbackRate = speed;
      if (el.paused) {
        if (Math.abs(el.currentTime - want) > 0.05) el.currentTime = want;
        el.play().catch(() => {});
      } else if (Math.abs(el.currentTime - want) > 0.3 + 0.1 * speed) {
        el.currentTime = want;
      }
    } else {
      // Parado ou marcha atrás: búscase o fotograma un a un.
      if (!el.paused) el.pause();
      if (!el.seeking && Math.abs(el.currentTime - want) > 0.02) el.currentTime = want;
    }
  }
  for (const [k, el] of els) {
    if (k.startsWith(`${ti}:`) && el !== active && !el.paused) el.pause();
  }
}

function frameFor(ti, a) {
  if (!a) return null;
  const m = a.clip.media;
  if (m.kind === 'image') return { src: m.el, w: m.w, h: m.h };
  if (m.kind === 'frames') {
    const f = m.frames[frameIndex(m, srcTime(a.clip, a.local))];
    return { src: f, w: f.width, h: f.height };
  }
  const el = elFor(ti, m);
  return el.readyState >= 2 ? { src: el, w: m.w, h: m.h, live: true } : null;
}

// Debuxa o instante actual. Chámao o bucle en cada fotograma; tamén se pode
// chamar á man para ter o cadro ao día (por exemplo, antes do contagotas).
export function renderNow() {
  if (ui.exporting) return;
  const D = duration();
  if (ui.playing) {
    ui.t = (performance.now() - wallStart) / 1000;
    if (ui.t >= D) { ui.t = D; pause(); }
  } else if (ui.t > D) {
    ui.t = D;
  }
  const at = [trackAt(0, ui.t), trackAt(1, ui.t)];
  at.forEach((a, ti) => syncTrack(ti, a));
  const layers = at.map((a, ti) => ({ has: !!a, frame: frameFor(ti, a), fx: a ? a.clip.fx : {} }));

  let ov = overlay.renderAt(ui.t, true);
  if (ui.picking) {
    // Contagotas: amósase só o anaco escollido, sen efectos, para tocar a cor.
    const sel = ui.sel?.type === 'clip' ? findClip(ui.sel.id) : null;
    layers.forEach((l, ti) => {
      if (!sel || ti !== sel.ti) l.has = false;
      l.fx = l.fx.mirror ? { mirror: {} } : {};
    });
    ov = null;
  }
  draw({ layers, overlay: ov });
  onTick();
}

function tick() {
  requestAnimationFrame(tick);
  renderNow();
}

export function start() { requestAnimationFrame(tick); }

// Para liberar os <video> dun medio que xa non se usa.
export function forgetUnused() {
  const used = new Set();
  project.tracks.forEach((tr, ti) => tr.clips.forEach((c) => used.add(`${ti}:${c.media.id}`)));
  for (const [k, el] of els) {
    if (!used.has(k)) { el.pause(); el.removeAttribute('src'); el.load(); els.delete(k); }
  }
}
