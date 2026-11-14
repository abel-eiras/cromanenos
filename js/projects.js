// Proxectos: novo, abrir, gardar, gardar como e recentes.
//
// Onde o navegador o permite (Chrome, Edge…) úsase a File System Access API:
// "Gardar" escribe no mesmo ficheiro sen preguntar e os proxectos recentes
// lémbranse en IndexedDB. Nos demais navegadores, gardar descarga o ficheiro
// e abrir pídeo cun selector normal.
import { project, ui, uid } from './model.js';
import { buildProjectFile, readProjectFile, EXT } from './projectfile.js';
import * as preview from './preview.js';
import * as overlay from './overlay.js';
import { invalidate } from './compositor.js';
import { t } from './i18n.js';

export const HAS_FS = typeof window.showSaveFilePicker === 'function'
  && typeof window.showOpenFilePicker === 'function';
const MAX_RECENT = 8;
const PICKER_TYPES = [{ description: 'Cromanenos', accept: { 'application/x-cromanenos': [EXT] } }];

export const state = { handle: null, name: null, busy: false };
let hooks = {
  refresh() {}, notify() {}, version: () => '',
  confirmDiscard: async () => 'discard', pickFile: async () => null,
  installed() {},   // cambiouse o proxecto enteiro (novo, aberto, recuperado)
  saved() {},       // gardouse nun ficheiro
  cleared() {},     // empezouse un proxecto novo
};
export function init(h) { hooks = { ...hooks, ...h }; markClean(); }

const baseName = (n) => (n.toLowerCase().endsWith(EXT) ? n.slice(0, -EXT.length) : n);
export const displayName = () => state.name || t('untitled');

// ------------------------------------------------------- cambios sen gardar
function signature() {
  return JSON.stringify([
    project.tracks.map((tr) => tr.clips.map((c) => [c.media.id, c.in, c.out, c.fx])),
    project.overlay.map((o) => [o.kind, o.text, o.x, o.y, o.size, o.at, o.dur]),
    project.sounds.map((s) => [s.id, s.at]),
  ]);
}
let cleanSig = '';
function markClean() { cleanSig = signature(); }
export { markClean };
export const isDirty = () => signature() !== cleanSig;

// true se se pode seguir (gardouse, ou a persoa dixo que non fai falta).
async function okToDiscard() {
  if (!isDirty()) return true;
  const answer = await hooks.confirmDiscard();
  if (answer === 'save') return save();
  return answer === 'discard';
}

// ---------------------------------------------------------- cambiar o proxecto
function mediaInUse() {
  const set = new Set();
  for (const tr of project.tracks) for (const c of tr.clips) set.add(c.media);
  return set;
}

function install(data) {
  preview.pause();
  const old = mediaInUse();
  data.tracks.forEach((tr, i) => project.tracks[i].clips.splice(0, Infinity, ...tr.clips));
  project.overlay.splice(0, Infinity, ...data.overlay.map((o) => ({ id: uid(), ...o })));
  project.sounds.splice(0, Infinity, ...data.sounds.map((s) => ({ id: uid(), ...s })));
  ui.sel = null;
  ui.t = 0;
  ui.picking = false;
  preview.forgetUnused();
  const keep = mediaInUse();
  for (const m of old) if (!keep.has(m) && m.url) URL.revokeObjectURL(m.url);
  overlay.markDirty();
  invalidate();
  hooks.installed();
}

export const mediaNow = () => mediaInUse();

// Proxecto recuperado dunha pestana que se pechou: conta como sen gardar e
// sen ficheiro (así "Gardar" pregunta onde e non pisa nada).
export function adoptRecovered(data, name) {
  install(data);
  state.handle = null;
  state.name = name || null;
  cleanSig = '';
  hooks.refresh();
}

export async function newProject({ force = false } = {}) {
  if (state.busy) return false;
  if (!force && !(await okToDiscard())) return false;
  install({ tracks: [{ clips: [] }, { clips: [] }], overlay: [], sounds: [] });
  state.handle = null;
  state.name = null;
  markClean();
  hooks.cleared();
  hooks.refresh();
  return true;
}

// ---------------------------------------------------------------------- gardar
// Despois de gardar nun ficheiro, cada medio pasa a lerse dese ficheiro novo.
// Fai falta sempre que o proxecto se abrira dese mesmo ficheiro: ao
// substituílo, os trozos vellos deixan de poder lerse.
async function rebindFile(m, blob) {
  const old = m.url;
  const url = URL.createObjectURL(blob);
  if (m.kind === 'image') {
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      m.el = img;
    } catch { /* quédase coa imaxe que xa estaba en memoria */ }
  } else {
    preview.dropMedia(m); // os <video> vólvense crear co enderezo novo
  }
  m.file = blob;
  m.url = url;
  if (old) URL.revokeObjectURL(old);
}

async function writeTo(handle) {
  const built = await buildProjectFile(hooks.version(), { rebindFile });
  const w = await handle.createWritable();
  try {
    for (const part of built.parts) await w.write(part);
    await w.close();
  } catch (err) {
    try { await w.abort(); } catch { /* xa estaba pechado */ }
    throw err;
  }
  const file = await handle.getFile();
  let off = built.dataStart;
  for (const e of built.entries) {
    await e.rebind(file.slice(off, off + e.size, e.type));
    off += e.size;
  }
  overlay.markDirty();
  invalidate();
}

async function saveToHandle(handle) {
  if (state.busy) return false;
  state.busy = true;
  preview.pause();
  hooks.refresh();
  hooks.notify('pj_saving', null, { sticky: true });
  try {
    await writeTo(handle);
    state.handle = handle;
    state.name = baseName(handle.name);
    markClean();
    hooks.saved(true);
    await addRecent(handle);
    hooks.notify('pj_saved');
    return true;
  } catch (err) {
    console.error(err);
    hooks.notify('err_saveProject');
    return false;
  } finally {
    state.busy = false;
    hooks.refresh();
  }
}

async function download() {
  if (state.busy) return false;
  state.busy = true;
  try {
    const built = await buildProjectFile(hooks.version(), { rebindFile });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(built.parts, { type: 'application/octet-stream' }));
    a.download = displayName() + EXT;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    markClean();
    hooks.saved(false);
    hooks.notify('pj_downloaded');
    return true;
  } catch (err) {
    console.error(err);
    hooks.notify('err_saveProject');
    return false;
  } finally {
    state.busy = false;
    hooks.refresh();
  }
}

export async function saveAs() {
  if (!HAS_FS) return download();
  let handle;
  try {
    handle = await window.showSaveFilePicker({ suggestedName: displayName() + EXT, types: PICKER_TYPES });
  } catch {
    return false; // cancelouse: non é un erro
  }
  return saveToHandle(handle);
}

export function save() {
  return state.handle ? saveToHandle(state.handle) : saveAs();
}

// ----------------------------------------------------------------------- abrir
// Abre un File. handle é opcional: con el, "Gardar" escribe no mesmo sitio.
export async function openFile(file, handle = null) {
  if (state.busy) return false;
  state.busy = true;
  hooks.refresh();
  hooks.notify('pj_opening', null, { sticky: true });
  try {
    const data = await readProjectFile(file);
    install(data);
    state.handle = handle;
    state.name = baseName(file.name);
    markClean();
    if (handle) await addRecent(handle);
    hooks.notify('pj_opened', { name: state.name });
    return true;
  } catch (err) {
    if (!err?.i18n) console.error(err);
    hooks.notify(...(err?.i18n || ['err_openProject']));
    return false;
  } finally {
    state.busy = false;
    hooks.refresh();
  }
}

// askPermission: para os recentes, que gardan o ficheiro pero non o permiso.
export async function openHandle(handle, { askPermission = false, force = false } = {}) {
  if (!force && !(await okToDiscard())) return false;
  let file;
  try {
    if (askPermission && handle.queryPermission
      && (await handle.queryPermission({ mode: 'readwrite' })) !== 'granted'
      && (await handle.requestPermission({ mode: 'readwrite' })) !== 'granted'
      && (await handle.queryPermission({ mode: 'read' })) !== 'granted') {
      return false; // non deu permiso: non se di nada
    }
    file = await handle.getFile();
  } catch (err) {
    if (err?.name === 'NotFoundError') {
      await removeRecent(handle);
      hooks.notify('pj_gone');
    }
    return false;
  }
  return openFile(file, handle);
}

// Un ficheiro de proxecto soltado enriba da páxina.
export async function openDropped(file) {
  if (!(await okToDiscard())) return false;
  return openFile(file);
}

export async function openPicker() {
  if (!(await okToDiscard())) return false;
  if (HAS_FS) {
    let handle;
    try {
      [handle] = await window.showOpenFilePicker({ types: PICKER_TYPES });
    } catch {
      return false; // cancelouse
    }
    return openHandle(handle, { force: true });
  }
  const file = await hooks.pickFile();
  return file ? openFile(file) : false;
}

// --------------------------------------------------------------------- recentes
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('cromanenos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('recent', { keyPath: 'id', autoIncrement: true });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

function req(r) {
  return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}

async function withStore(mode, fn) {
  const db = await idb();
  try {
    const tx = db.transaction('recent', mode);
    const out = await fn(tx.objectStore('recent'));
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
    return out;
  } finally {
    db.close();
  }
}

async function allRecent() {
  const rows = await withStore('readonly', (st) => req(st.getAll()));
  return rows.sort((a, b) => b.when - a.when);
}

async function sameEntry(a, b) {
  try { return await a.isSameEntry(b); } catch { return false; }
}

async function addRecent(handle) {
  if (!HAS_FS) return;
  try {
    const rows = await allRecent();
    const drop = [];
    for (const r of rows) if (await sameEntry(r.handle, handle)) drop.push(r.id);
    const rest = rows.filter((r) => !drop.includes(r.id));
    for (const r of rest.slice(MAX_RECENT - 1)) drop.push(r.id);
    await withStore('readwrite', (st) => {
      drop.forEach((id) => st.delete(id));
      st.add({ name: baseName(handle.name), when: Date.now(), handle });
    });
  } catch { /* sen IndexedDB (navegación privada…): non hai recentes */ }
}

async function removeRecent(handle) {
  try {
    const rows = await allRecent();
    const drop = [];
    for (const r of rows) if (await sameEntry(r.handle, handle)) drop.push(r.id);
    if (drop.length) await withStore('readwrite', (st) => { drop.forEach((id) => st.delete(id)); });
  } catch { /* ignórase */ }
}

// [{ id, name, when }], o máis recente primeiro.
export async function listRecent() {
  if (!HAS_FS) return [];
  try {
    return (await allRecent()).map(({ id, name, when }) => ({ id, name, when }));
  } catch {
    return [];
  }
}

export async function openRecent(id) {
  let row;
  try { row = (await allRecent()).find((r) => r.id === id); } catch { return false; }
  return row ? openHandle(row.handle, { askPermission: true }) : false;
}

export async function clearRecent() {
  try { await withStore('readwrite', (st) => { st.clear(); }); } catch { /* ignórase */ }
}
