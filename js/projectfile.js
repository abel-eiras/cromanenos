// O ficheiro de proxecto (.cromanenos): un só ficheiro con todo dentro.
//
//   [ sinatura de 20 bytes ][ lonxitude do índice, uint32 LE ][ índice JSON ][ blobs seguidos ]
//
// O índice describe a liña de tempo e lista os blobs (vídeos, fotos, fotogramas
// de stop motion, imaxes conxeladas e gravacións de voz) na orde en que van.
// Ao gardar pásanse os Blob tal cal, sen cargalos en memoria; ao abrir lense
// con file.slice(), así que os vídeos seguen no disco ata que fan falta.
import { project, makeClip } from './model.js';
import { loadMedia, mediaFromFrames } from './media.js';
import { makeSfx, decode } from './audio.js';
import { tErr } from './i18n.js';

export const EXT = '.cromanenos';
export const FORMAT = 1;
const MAGIC = 'CROMANENOS-PROXECTO\n';
const HEAD = MAGIC.length + 4;
const MAX_INDEX = 20 * 1024 * 1024;

// Blob xa codificado de cada canvas (conxelados e stop motion), para non
// volver codificalo en cada gardado.
const canvasBlobs = new WeakMap();

function encodeCanvas(canvas, type, quality) {
  return new Promise((res, rej) => {
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), type, quality);
  });
}

async function blobOfCanvas(canvas, type, quality) {
  let b = canvasBlobs.get(canvas);
  if (!b) {
    b = await encodeCanvas(canvas, type, quality);
    canvasBlobs.set(canvas, b);
  }
  return b;
}

async function canvasFromBlob(blob) {
  let src, w, h;
  try {
    src = await createImageBitmap(blob);
    w = src.width; h = src.height;
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      src = new Image();
      await new Promise((res, rej) => { src.onload = res; src.onerror = rej; src.src = url; });
      w = src.naturalWidth; h = src.naturalHeight;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(src, 0, 0);
  src.close?.();
  canvasBlobs.set(c, blob);
  return c;
}

// ---------------------------------------------------------------------- gardar
// Devolve { parts, entries, dataStart }.
//   parts      trozos para escribir, na orde (cabeceira e despois os blobs)
//   entries    [{ size, type, rebind(blob) }], un por blob: rebind() apunta o
//              medio ao seu novo sitio dentro do ficheiro recén gardado
//   dataStart  byte onde comeza o primeiro blob
export async function buildProjectFile(appVersion, hooks) {
  const blobs = [];
  const entries = [];
  const addBlob = (blob, name, rebind) => {
    blobs.push({ name, type: blob.type || 'application/octet-stream', size: blob.size });
    entries.push({ blob, size: blob.size, type: blob.type, rebind });
    return blobs.length - 1;
  };

  const mediaIndex = new Map();
  const media = [];
  for (const tr of project.tracks) {
    for (const c of tr.clips) {
      const m = c.media;
      if (mediaIndex.has(m)) continue;
      const row = { id: m.id, kind: m.kind, name: m.name, w: m.w, h: m.h };
      if (m.kind === 'video') {
        row.dur = m.dur;
        row.blob = addBlob(m.file, m.name, (b) => hooks.rebindFile(m, b));
      } else if (m.kind === 'image' && m.file) {
        row.blob = addBlob(m.file, m.name, (b) => hooks.rebindFile(m, b));
      } else if (m.kind === 'image') {
        // Imaxe conxelada: só existe como canvas.
        const el = m.el;
        row.blob = addBlob(await blobOfCanvas(el, 'image/png'), m.name, (b) => { canvasBlobs.set(el, b); });
      } else {
        row.fps = m.fps;
        row.frames = [];
        for (const f of m.frames) {
          row.frames.push(addBlob(await blobOfCanvas(f, 'image/jpeg', 0.92), m.name, (b) => { canvasBlobs.set(f, b); }));
        }
      }
      mediaIndex.set(m, row.id);
      media.push(row);
    }
  }

  const sounds = [];
  for (const s of project.sounds) {
    const row = { kind: s.kind, at: s.at };
    if (s.kind === 'voice') {
      if (!s.blob) continue; // non debería pasar: a gravación sempre garda o seu blob
      row.blob = addBlob(s.blob, 'voz', (b) => { s.blob = b; });
    }
    sounds.push(row);
  }

  const index = {
    format: FORMAT,
    app: appVersion,
    blobs,
    media,
    tracks: project.tracks.map((tr) => ({
      clips: tr.clips.map((c) => ({ media: c.media.id, in: c.in, out: c.out, fx: c.fx })),
    })),
    overlay: project.overlay.map(({ kind, text, x, y, size, at, dur }) => ({ kind, text, x, y, size, at, dur })),
    sounds,
  };
  const json = new TextEncoder().encode(JSON.stringify(index));
  const head = new Uint8Array(HEAD + json.length);
  head.set(new TextEncoder().encode(MAGIC), 0);
  new DataView(head.buffer).setUint32(MAGIC.length, json.length, true);
  head.set(json, HEAD);
  return { parts: [head, ...entries.map((e) => e.blob)], entries, dataStart: head.length };
}

// ----------------------------------------------------------------------- abrir
// Le o ficheiro e constrúe o proxecto enteiro sen tocar o actual. Se algo
// falla lanza un erro traducible e o proxecto aberto queda como estaba.
export async function readProjectFile(file) {
  if (file.size < HEAD) throw tErr('err_notProject');
  const headBytes = new Uint8Array(await file.slice(0, HEAD).arrayBuffer());
  if (new TextDecoder().decode(headBytes.subarray(0, MAGIC.length)) !== MAGIC) throw tErr('err_notProject');
  const len = new DataView(headBytes.buffer).getUint32(MAGIC.length, true);
  if (len > MAX_INDEX || HEAD + len > file.size) throw tErr('err_notProject');

  let index;
  try {
    index = JSON.parse(await file.slice(HEAD, HEAD + len).text());
  } catch {
    throw tErr('err_notProject');
  }
  if (typeof index?.format !== 'number' || !Array.isArray(index.blobs)) throw tErr('err_notProject');
  if (index.format > FORMAT) throw tErr('err_newerProject');

  let off = HEAD + len;
  const slices = index.blobs.map((b) => {
    const s = file.slice(off, off + b.size, b.type);
    off += b.size;
    return s;
  });
  if (off > file.size) throw tErr('err_notProject');

  const created = [];
  try {
    const byId = new Map();
    for (const row of index.media) {
      let m;
      if (row.kind === 'frames') {
        const frames = [];
        for (const i of row.frames) frames.push(await canvasFromBlob(slices[i]));
        m = mediaFromFrames(frames, row.fps, row.name);
      } else {
        const b = index.blobs[row.blob];
        m = await loadMedia(new File([slices[row.blob]], row.name, { type: b.type }));
      }
      created.push(m);
      byId.set(row.id, m);
    }

    const tracks = index.tracks.map((tr) => ({
      clips: tr.clips.map((c) => makeClip(byId.get(c.media), { in: c.in, out: c.out, fx: c.fx || {} })),
    }));
    while (tracks.length < 2) tracks.push({ clips: [] });

    const sounds = [];
    for (const s of index.sounds || []) {
      if (s.kind === 'voice') {
        const blob = slices[s.blob];
        sounds.push({ kind: 'voice', at: s.at, blob, buffer: await decode(await blob.arrayBuffer()) });
      } else {
        sounds.push({ kind: s.kind, at: s.at, buffer: await makeSfx(s.kind) });
      }
    }
    return { tracks: tracks.slice(0, 2), overlay: index.overlay || [], sounds };
  } catch (err) {
    for (const m of created) if (m.url) URL.revokeObjectURL(m.url);
    if (err?.i18n) throw err;
    throw tErr('err_openProject');
  }
}
