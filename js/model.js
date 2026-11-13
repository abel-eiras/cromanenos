// O proxecto: dúas pistas de vídeo con anacos seguidos, adhesivos e sons con
// tempo propio. Os efectos viven en cada anaco (clip.fx), non na pista.
export const W = 1280, H = 720, FPS = 30;
export const STILL_SECONDS = 3;
export const FREEZE_SECONDS = 2;
export const ITEM_SECONDS = 3;

let nextId = 1;
export const uid = () => nextId++;

export const project = {
  // tracks[0] = fondo, tracks[1] = enriba
  tracks: [{ clips: [] }, { clips: [] }],
  overlay: [],  // { id, kind: 'sticker' | 'text', text, x, y, size, at, dur }
  sounds: [],   // { id, kind, at, buffer }
};

// Estado da interface (non forma parte do vídeo).
// sel = { type: 'clip' | 'overlay' | 'sound', id }
export const ui = { t: 0, playing: false, exporting: false, picking: false, sel: null };

// Efectos posibles en clip.fx (cada un só existe se está aplicado):
//   chroma  { key: [r,g,b], tol, soft }
//   split   { pos, soft }
//   ghost   { opacity }
//   size    { zoom, x, y }      x, y: desprazamento en fraccións do cadro
//   mirror  {}
//   filter  { name }            'bw' | 'sepia' | 'neg' | 'comic'
//   speed   { v }
//   reverse {}
export const FX_DEFAULTS = {
  chroma: () => ({ key: [0.1, 0.8, 0.2], tol: 0.13, soft: 0.06 }),
  split: () => ({ pos: 0.5, soft: 0.01 }),
  ghost: () => ({ opacity: 0.5 }),
  size: () => ({ zoom: 0.5, x: 0, y: 0 }),
  mirror: () => ({}),
  filter: () => ({ name: 'bw' }),
  speed: () => ({ v: 2 }),
  reverse: () => ({}),
};
export const FX_ORDER = Object.keys(FX_DEFAULTS);

// Un anaco usa o tramo [in, out] (en segundos) do seu medio.
export function makeClip(media, extra = {}) {
  const out = media.kind === 'video' ? media.dur
    : media.kind === 'frames' ? media.frames.length / media.fps
    : STILL_SECONDS;
  return { id: uid(), media, in: 0, out, fx: {}, ...extra };
}

export const speedOf = (c) => c.fx.speed?.v ?? 1;
export const isReverse = (c) => !!c.fx.reverse;
export const clipDur = (c) => (c.out - c.in) / speedOf(c);
export const trackDur = (tr) => tr.clips.reduce((s, c) => s + clipDur(c), 0);
export const duration = () => Math.max(...project.tracks.map(trackDur));

export function findClip(id) {
  for (let ti = 0; ti < project.tracks.length; ti++) {
    const idx = project.tracks[ti].clips.findIndex((c) => c.id === id);
    if (idx >= 0) return { ti, idx, clip: project.tracks[ti].clips[idx] };
  }
  return null;
}

export function clipStart(ti, clip) {
  let s = 0;
  for (const c of project.tracks[ti].clips) {
    if (c === clip) return s;
    s += clipDur(c);
  }
  return s;
}

// Que anaco toca na pista ti no instante t. O fondo mantén o seu último
// fotograma cando remata (hold); a pista de enriba desaparece.
export function trackAt(ti, t) {
  const clips = project.tracks[ti].clips;
  let s = 0;
  for (const c of clips) {
    const d = clipDur(c);
    if (t < s + d) return { clip: c, local: Math.max(0, t - s), start: s, hold: false };
    s += d;
  }
  if (ti === 0 && clips.length) {
    const c = clips[clips.length - 1];
    return { clip: c, local: clipDur(c), start: s - clipDur(c), hold: true };
  }
  return null;
}

// Tempo dentro do medio para un instante local do anaco.
export function srcTime(c, local) {
  const x = Math.min(Math.max(local * speedOf(c), 0), c.out - c.in);
  return isReverse(c) ? c.out - x : c.in + x;
}

export function insertClip(ti, idx, clip) {
  project.tracks[ti].clips.splice(idx, 0, clip);
  return clip;
}

// Corta un anaco no instante t do proxecto; as dúas metades levan os mesmos
// efectos. Devolve [primeiro, segundo] ou null se t cae xunto a un extremo.
export function splitClip(id, t) {
  const f = findClip(id);
  if (!f) return null;
  const c = f.clip;
  const local = t - clipStart(f.ti, c);
  if (local < 0.04 || local > clipDur(c) - 0.04) return null;
  const x = local * speedOf(c);
  const second = { ...c, id: uid(), fx: structuredClone(c.fx) };
  if (isReverse(c)) { second.out = c.out - x; c.in = c.out - x; }
  else { second.in = c.in + x; c.out = c.in + x; }
  project.tracks[f.ti].clips.splice(f.idx + 1, 0, second);
  return [c, second];
}

export function removeClip(id) {
  const f = findClip(id);
  if (f) project.tracks[f.ti].clips.splice(f.idx, 1);
}

export function moveClip(id, dir) {
  const f = findClip(id);
  if (!f) return;
  const clips = project.tracks[f.ti].clips;
  const j = f.idx + dir;
  if (j < 0 || j >= clips.length) return;
  [clips[f.idx], clips[j]] = [clips[j], clips[f.idx]];
}
