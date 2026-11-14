// Recuperación automática: se a pestana se pecha sen querer, ao volver pódese
// seguir onde se deixou. Gárdase no almacenamento privado do navegador (OPFS),
// neste mesmo ordenador. Cada vídeo escríbese unha soa vez; despois só se
// reescribe a descrición da liña de tempo, que é pequena.
//
// Aquí nada dá erros á vista: se non hai sitio ou o navegador non o permite,
// simplemente non hai recuperación.
import { project, makeClip } from './model.js';
import { loadMedia, mediaFromFrames, mediaFromCanvas } from './media.js';
import { blobOfCanvas, canvasFromBlob } from './projectfile.js';
import { makeSfx, decode } from './audio.js';

const DIR = 'recuperacion';
const STATE = 'estado.json';
const DELAY = 3000;

let dir = null;
let armed = false;      // ata que se decide que facer co que había, non se toca nada
let disabled = false;
let timer = 0;
let chain = Promise.resolve();
const written = new Set();
let hooks = { isDirty: () => true, name: () => null, keepKeys: () => new Set() };

const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const keyOfName = (name) => name.split('_')[1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Só unha pestana leva a recuperación, para que dúas non se pisen.
function takeLock() {
  if (!navigator.locks) return Promise.resolve(true);
  return new Promise((res) => {
    navigator.locks.request('cromanenos-recuperacion', { ifAvailable: true }, (lock) => {
      res(!!lock);
      return lock ? new Promise(() => {}) : undefined;
    }).catch(() => res(false));
  });
}

export async function init(h) {
  hooks = { ...hooks, ...h };
  try {
    if (!navigator.storage?.getDirectory) return;
    let got = false;
    for (let i = 0; i < 4 && !got; i++) {
      got = await takeLock();
      if (!got) await sleep(250); // ao recargar, a páxina anterior tarda un chisco en soltalo
    }
    if (!got) return;
    const root = await navigator.storage.getDirectory();
    dir = await root.getDirectoryHandle(DIR, { create: true });
    for await (const name of dir.keys()) if (name !== STATE) written.add(name);
  } catch {
    dir = null;
  }
}

export const available = () => !!dir && !disabled;

// O que quedou da vez anterior ({ name, saved, … }) ou null.
export async function peek() {
  if (!dir) return null;
  try {
    const file = await (await dir.getFileHandle(STATE)).getFile();
    const st = JSON.parse(await file.text());
    return st?.v === 1 && Array.isArray(st.media) ? st : null;
  } catch {
    return null;
  }
}

async function fileOf(name, asName, type) {
  const f = await (await dir.getFileHandle(name)).getFile();
  return new File([f], asName, { type: type || f.type });
}

// Reconstrúe o proxecto gardado. Devolve { tracks, overlay, sounds } ou null.
export async function restore(st) {
  const made = [];
  try {
    const byKey = new Map();
    for (const row of st.media) {
      let m;
      if (row.kind === 'frames') {
        const frames = [];
        for (let i = 0; i < row.n; i++) frames.push(await canvasFromBlob(await fileOf(`m_${row.key}_${i}`, 'f', 'image/jpeg')));
        m = mediaFromFrames(frames, row.fps, row.name);
      } else if (row.file) {
        m = await loadMedia(await fileOf(`m_${row.key}`, row.name, row.type));
      } else {
        m = mediaFromCanvas(await canvasFromBlob(await fileOf(`m_${row.key}`, 'c', 'image/png')), row.name);
      }
      m.rk = row.key;
      made.push(m);
      byKey.set(row.key, m);
    }
    const tracks = st.tracks.map((clips) => ({
      clips: clips.map((c) => makeClip(byKey.get(c.media), { in: c.in, out: c.out, fx: c.fx || {} })),
    }));
    const sounds = [];
    for (const s of st.sounds || []) {
      if (s.kind === 'voice') {
        const blob = await fileOf(`s_${s.key}`, 'voz', s.type);
        sounds.push({ kind: 'voice', at: s.at, blob, rk: s.key, buffer: await decode(await blob.arrayBuffer()) });
      } else {
        sounds.push({ kind: s.kind, at: s.at, buffer: await makeSfx(s.kind) });
      }
    }
    return { tracks, overlay: st.overlay || [], sounds };
  } catch {
    for (const m of made) if (m.url) URL.revokeObjectURL(m.url);
    return null;
  }
}

async function removeState() {
  try { await dir.removeEntry(STATE); } catch { /* non había */ }
}

// Borra os blobs que xa non usa nin o proxecto nin o historial de desfacer.
async function gc(keep) {
  for (const name of [...written]) {
    if (keep.has(keyOfName(name))) continue;
    try { await dir.removeEntry(name); } catch { /* xa non estaba */ }
    written.delete(name);
  }
}

async function put(name, getBlob) {
  if (written.has(name)) return;
  const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
  try {
    await w.write(await getBlob());
    await w.close();
  } catch (err) {
    try { await w.abort(); } catch { /* xa pechado */ }
    throw err;
  }
  written.add(name);
}

async function flush() {
  if (!dir || !armed || disabled) return;
  const empty = !project.tracks.some((tr) => tr.clips.length) && !project.overlay.length && !project.sounds.length;
  try {
    if (empty || !hooks.isDirty()) {
      // Baleiro ou xa gardado nun ficheiro: non hai nada que recuperar.
      await removeState();
      if (empty) await gc(hooks.keepKeys());
      return;
    }
    const keep = new Set(hooks.keepKeys());
    const media = [];
    const seen = new Set();
    for (const tr of project.tracks) {
      for (const c of tr.clips) {
        const m = c.media;
        if (seen.has(m)) continue;
        seen.add(m);
        m.rk ??= newKey();
        keep.add(m.rk);
        const row = { key: m.rk, kind: m.kind, name: m.name };
        if (m.kind === 'frames') {
          row.fps = m.fps;
          row.n = m.frames.length;
          for (let i = 0; i < m.frames.length; i++) {
            const f = m.frames[i];
            await put(`m_${m.rk}_${i}`, () => blobOfCanvas(f, 'image/jpeg', 0.92));
          }
        } else if (m.file) {
          row.file = true;
          row.type = m.file.type;
          await put(`m_${m.rk}`, () => m.file);
        } else {
          await put(`m_${m.rk}`, () => blobOfCanvas(m.el, 'image/png'));
        }
        media.push(row);
      }
    }
    const sounds = [];
    for (const s of project.sounds) {
      if (s.kind !== 'voice') { sounds.push({ kind: s.kind, at: s.at }); continue; }
      if (!s.blob) continue;
      s.rk ??= newKey();
      keep.add(s.rk);
      await put(`s_${s.rk}`, () => s.blob);
      sounds.push({ kind: 'voice', at: s.at, key: s.rk, type: s.blob.type });
    }
    const state = {
      v: 1,
      name: hooks.name(),
      saved: Date.now(),
      media,
      tracks: project.tracks.map((tr) => tr.clips.map((c) => ({ media: c.media.rk, in: c.in, out: c.out, fx: c.fx }))),
      overlay: project.overlay.map(({ kind, text, x, y, size, at, dur }) => ({ kind, text, x, y, size, at, dur })),
      sounds,
    };
    const w = await (await dir.getFileHandle(STATE, { create: true })).createWritable();
    await w.write(JSON.stringify(state));
    await w.close();
    await gc(keep);
  } catch (err) {
    // Sen sitio (ou calquera outro problema): déixase de intentar, sen avisos.
    if (err?.name === 'QuotaExceededError') disabled = true;
    await removeState();
  }
}

function run(fn) {
  chain = chain.then(fn).catch(() => {});
  return chain;
}

// Hai cambios: gárdase dentro dun chisco.
export function schedule() {
  if (!dir || !armed || disabled) return;
  clearTimeout(timer);
  timer = setTimeout(() => run(flush), DELAY);
}

// Gardar xa (ao agochar ou pechar a pestana, e nas probas).
export function flushNow() {
  clearTimeout(timer);
  return run(flush);
}

// A partir de aquí xa se pode gardar (decidiuse que facer co anterior).
export function arm() { armed = true; }

// O proxecto gardouse nun ficheiro: xa non hai nada pendente de recuperar.
export function forgetState() {
  if (!dir) return Promise.resolve();
  clearTimeout(timer);
  return run(removeState);
}

// Proxecto novo, ou non se quixo recuperar: bórrase todo.
export function clear() {
  if (!dir) return Promise.resolve();
  clearTimeout(timer);
  return run(async () => { await removeState(); await gc(new Set()); });
}

// Para as probas: nomes do que hai gardado.
export async function listStored() {
  if (!dir) return [];
  const names = [];
  for await (const name of dir.keys()) names.push(name);
  return names.sort();
}
