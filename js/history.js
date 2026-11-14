// Desfacer e refacer. Gárdase unha copia lixeira do proxecto despois de cada
// xesto (os vídeos non se copian: só se lembra que anaco usa que medio).
import { project, ui } from './model.js';

const MAX = 50;
let undoStack = [];
let redoStack = [];
let current = null;
let hooks = { restored() {} };

function snapshot() {
  return {
    tracks: project.tracks.map((tr) => tr.clips.map((c) => ({ ...c, fx: structuredClone(c.fx) }))),
    overlay: project.overlay.map((o) => ({ ...o })),
    sounds: project.sounds.map((s) => ({ ...s })),
    sel: ui.sel ? { ...ui.sel } : null,
  };
}

// O que conta como cambio (a selección non).
function signature(s) {
  return JSON.stringify([
    s.tracks.map((clips) => clips.map((c) => [c.id, c.media.id, c.in, c.out, c.fx])),
    s.overlay,
    s.sounds.map((x) => [x.id, x.at]),
  ]);
}

function restore(s) {
  s.tracks.forEach((clips, i) => {
    project.tracks[i].clips = clips.map((c) => ({ ...c, fx: structuredClone(c.fx) }));
  });
  project.overlay.splice(0, Infinity, ...s.overlay.map((o) => ({ ...o })));
  project.sounds.splice(0, Infinity, ...s.sounds.map((x) => ({ ...x })));
  ui.sel = s.sel ? { ...s.sel } : null;
  hooks.restored();
}

export function init(h) { hooks = { ...hooks, ...h }; reset(); }

// Proxecto novo ou aberto: non hai nada que desfacer.
export function reset() {
  undoStack = [];
  redoStack = [];
  current = snapshot();
  current.sig = signature(current);
}

// Chámase ao rematar cada xesto. Se nada cambiou, non fai nada.
export function commit() {
  const s = snapshot();
  s.sig = signature(s);
  if (current && s.sig === current.sig) { current.sel = s.sel; return false; }
  undoStack.push(current);
  if (undoStack.length > MAX) undoStack.shift();
  redoStack = [];
  current = s;
  return true;
}

export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;

export function undo() {
  commit(); // por se quedaba un xesto a medias
  if (!undoStack.length) return false;
  redoStack.push(current);
  current = undoStack.pop();
  restore(current);
  return true;
}

export function redo() {
  if (!redoStack.length) return false;
  undoStack.push(current);
  current = redoStack.pop();
  restore(current);
  return true;
}

// Despois de gardar nun ficheiro, os medios que xa non están no proxecto
// poden deixar de lerse: esquécense os pasos que os usan.
export function keepOnly(mediaSet) {
  const foreign = (s) => s.tracks.some((clips) => clips.some((c) => !mediaSet.has(c.media)));
  const cut = (stack) => {
    let i = stack.length - 1;
    while (i >= 0 && !foreign(stack[i])) i--;
    return stack.slice(i + 1);
  };
  undoStack = cut(undoStack);
  redoStack = cut(redoStack);
}

// Claves de recuperación (rk) dos medios e sons que aínda fan falta para
// poder desfacer, ademais dos do proxecto.
export function keysInHistory() {
  const set = new Set();
  for (const s of [...undoStack, ...redoStack]) {
    for (const clips of s.tracks) for (const c of clips) if (c.media.rk) set.add(c.media.rk);
    for (const x of s.sounds) if (x.rk) set.add(x.rk);
  }
  return set;
}
