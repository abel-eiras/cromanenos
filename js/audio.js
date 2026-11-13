// Son: efectos sintetizados, gravación da voz, reprodución na vista previa
// e mestura final para gardar.
import { project, clipDur, speedOf, isReverse } from './model.js';

export const RATE = 48000;

let decodeCtx;
export function decode(arrayBuffer) {
  decodeCtx ??= new OfflineAudioContext(2, 1, RATE);
  return decodeCtx.decodeAudioData(arrayBuffer);
}

// Son dun vídeo (null se non ten ou non se pode ler). Calcúlase unha soa vez.
export function mediaAudio(media) {
  if (media.kind !== 'video') return Promise.resolve(null);
  media._audio ??= (async () => {
    try { return await decode(await media.file.arrayBuffer()); } catch { return null; }
  })();
  return media._audio;
}

function reversedOf(media, buf) {
  if (!media._audioRev) {
    const rev = new AudioBuffer({ length: buf.length, numberOfChannels: buf.numberOfChannels, sampleRate: buf.sampleRate });
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      rev.copyToChannel(Float32Array.from(buf.getChannelData(ch)).reverse(), ch);
    }
    media._audioRev = rev;
  }
  return media._audioRev;
}

// ------------------------------------------------------- efectos sintetizados
export const SFX = { boing: '🦘', pop: '🎈', laser: '🔫', whoosh: '💨', drum: '🥁', ding: '🔔' };

function noise(ctx, seconds) {
  const buf = ctx.createBuffer(1, Math.ceil(seconds * RATE), RATE);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function tone(ctx, type, gainPoints, freqPoints) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqPoints[0][1], 0);
  for (const [t, f] of freqPoints.slice(1)) o.frequency.exponentialRampToValueAtTime(f, t);
  g.gain.setValueAtTime(gainPoints[0][1], 0);
  for (const [t, v] of gainPoints.slice(1)) g.gain.exponentialRampToValueAtTime(v, t);
  o.connect(g).connect(ctx.destination);
  o.start(0);
  return o;
}

const RECIPES = {
  boing(ctx) {
    const o = tone(ctx, 'sine', [[0, 0.8], [0.6, 0.001]], [[0, 160], [0.1, 520], [0.55, 130]]);
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 22;
    depth.gain.value = 45;
    lfo.connect(depth).connect(o.frequency);
    lfo.start(0);
    return 0.62;
  },
  pop(ctx) { tone(ctx, 'sine', [[0, 0.9], [0.09, 0.001]], [[0, 900], [0.07, 120]]); return 0.12; },
  laser(ctx) { tone(ctx, 'sawtooth', [[0, 0.45], [0.32, 0.001]], [[0, 2000], [0.3, 150]]); return 0.35; },
  whoosh(ctx) {
    const n = noise(ctx, 0.7);
    const bp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, 0);
    bp.frequency.exponentialRampToValueAtTime(3500, 0.3);
    bp.frequency.exponentialRampToValueAtTime(400, 0.65);
    g.gain.setValueAtTime(0.001, 0);
    g.gain.exponentialRampToValueAtTime(0.9, 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, 0.68);
    n.connect(bp).connect(g).connect(ctx.destination);
    n.start(0);
    return 0.7;
  },
  drum(ctx) {
    tone(ctx, 'sine', [[0, 1], [0.3, 0.001]], [[0, 160], [0.18, 45]]);
    const n = noise(ctx, 0.08);
    const hp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    hp.type = 'highpass';
    hp.frequency.value = 1000;
    g.gain.setValueAtTime(0.4, 0);
    g.gain.exponentialRampToValueAtTime(0.001, 0.06);
    n.connect(hp).connect(g).connect(ctx.destination);
    n.start(0);
    return 0.35;
  },
  ding(ctx) {
    tone(ctx, 'sine', [[0, 0.5], [1, 0.001]], [[0, 1320], [1, 1320]]);
    tone(ctx, 'sine', [[0, 0.2], [0.7, 0.001]], [[0, 1980], [1, 1980]]);
    tone(ctx, 'sine', [[0, 0.1], [0.4, 0.001]], [[0, 2640], [1, 2640]]);
    return 1.0;
  },
};

const sfxCache = {};
export function makeSfx(kind) {
  sfxCache[kind] ??= (async () => {
    // Renderízase con marxe e recórtase á duración que di a receita.
    const ctx = new OfflineAudioContext(1, Math.ceil(1.2 * RATE), RATE);
    const seconds = RECIPES[kind](ctx);
    const full = await ctx.startRendering();
    const out = new AudioBuffer({ length: Math.ceil(seconds * RATE), numberOfChannels: 1, sampleRate: RATE });
    out.copyToChannel(full.getChannelData(0).subarray(0, out.length), 0);
    return out;
  })();
  return sfxCache[kind];
}

// ---------------------------------------------------------------- vista previa
let actx = null;
let live = [];

function audioCtx() {
  actx ??= new AudioContext();
  if (actx.state === 'suspended') actx.resume().catch(() => {});
  return actx;
}

export function startSounds(t) {
  stopSounds();
  if (!project.sounds.length) return;
  const c = audioCtx();
  for (const s of project.sounds) {
    if (s.at + s.buffer.duration <= t) continue;
    const n = c.createBufferSource();
    n.buffer = s.buffer;
    n.connect(c.destination);
    n.start(c.currentTime + Math.max(0, s.at - t), Math.max(0, t - s.at));
    live.push(n);
  }
}

export function stopSounds() {
  for (const n of live) { try { n.stop(); } catch { /* xa parara */ } }
  live = [];
}

export function playOnce(buffer) {
  try {
    const c = audioCtx();
    const n = c.createBufferSource();
    n.buffer = buffer;
    n.connect(c.destination);
    n.start();
  } catch { /* sen son na vista previa */ }
}

// ------------------------------------------------------------- gravar a voz
let rec = null;
export const isRecording = () => !!rec;

export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('no-mic');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mr = new MediaRecorder(stream);
  const chunks = [];
  mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise((res) => { mr.onstop = res; });
  mr.start();
  rec = { mr, stream, chunks, done };
}

export async function stopRecording() {
  const r = rec;
  rec = null;
  try {
    r.mr.stop();
    await r.done;
  } finally {
    r.stream.getTracks().forEach((tr) => tr.stop());
  }
  const blob = new Blob(r.chunks, { type: r.mr.mimeType });
  return decode(await blob.arrayBuffer());
}

// ---------------------------------------------------------- mestura para gardar
// Son dos anacos (coa súa posición, velocidade e marcha atrás) máis os sons
// soltos. Devolve null se non hai nada que soar.
export async function mixProject(D) {
  const ctx = new OfflineAudioContext(2, Math.max(1, Math.ceil(D * RATE)), RATE);
  let any = false;
  for (const tr of project.tracks) {
    let start = 0;
    for (const c of tr.clips) {
      const buf = await mediaAudio(c.media);
      if (buf) {
        const src = ctx.createBufferSource();
        const speed = speedOf(c);
        let off = c.in, len = c.out - c.in, when = start;
        if (isReverse(c)) {
          src.buffer = reversedOf(c.media, buf);
          off = buf.duration - c.out;
          if (off < 0) { when += -off / speed; len += off; off = 0; }
        } else {
          src.buffer = buf;
        }
        if (len > 0 && off < buf.duration) {
          src.playbackRate.value = speed;
          src.connect(ctx.destination);
          src.start(when, off, len);
          any = true;
        }
      }
      start += clipDur(c);
    }
  }
  for (const s of project.sounds) {
    if (s.at >= D) continue;
    const src = ctx.createBufferSource();
    src.buffer = s.buffer;
    src.connect(ctx.destination);
    src.start(s.at);
    any = true;
  }
  return any ? ctx.startRendering() : null;
}
