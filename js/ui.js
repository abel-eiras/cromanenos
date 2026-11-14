// Interface: liña de tempo, paleta de efectos por anaco, adhesivos, sons,
// diálogos e idioma.
import { t, tricks, setLang, getLang, applyI18n, onLangChange, LANGS } from './i18n.js';
import {
  W, H, FPS, FREEZE_SECONDS, FX_DEFAULTS, FX_ORDER, project, ui, uid, duration, trackAt, srcTime,
  clipDur, clipStart, findClip, splitClip, removeClip, moveClip, insertClip, makeClip, trimClip, placeClip,
} from './model.js';
import { loadMedia, grabFrame, mediaFromCanvas, mediaFromFrames } from './media.js';
import * as preview from './preview.js';
import * as overlay from './overlay.js';
import * as audio from './audio.js';
import { exportProject } from './exporter.js';
import { initStopMotion, openStopMotion, retranslate as retranslateStopMotion } from './stopmotion.js';
import { readColor, invalidate } from './compositor.js';
import * as projects from './projects.js';
import * as updates from './updates.js';
import * as history from './history.js';
import * as recovery from './recovery.js';
import * as camera from './camera.js';
import { thumbOf, keyOf as thumbKey } from './thumbs.js';

const $ = (id) => document.getElementById(id);

function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'aria') e.setAttribute('aria-label', v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e[k] = v;
  }
  e.append(...kids.filter(Boolean));
  return e;
}

const FX_ICON = { chroma: '🟩', split: '👯', ghost: '👻', size: '🔍', mirror: '🪞', filter: '🎨', speed: '⏩', reverse: '⏪', mute: '🔇' };
const NEEDS_BELOW = ['chroma', 'split', 'ghost', 'size']; // mesturan co que hai debaixo
const KIND_ICON = { video: '🎞', image: '🖼', frames: '📸' };
const STICKERS = ['⭐', '❤️', '😂', '😎', '😱', '👻', '💥', '🔥', '🎩', '👑', '💬', '🌈', '🦄', '🐱', '🚀', '❓'];
const SPEEDS = [[0.25, '🐌 ×¼'], [0.5, '🐢 ×½'], [2, '🐇 ×2'], [4, '🚀 ×4']];
const FILTERS = ['bw', 'sepia', 'neg', 'comic'];

let canvas;
let status = null;
let recAt = 0;

// ------------------------------------------------------------------ selección
const selClip = () => (ui.sel?.type === 'clip' ? findClip(ui.sel.id) : null);
const selItem = () => (ui.sel?.type === 'overlay' ? project.overlay.find((o) => o.id === ui.sel.id) : null);
const selSound = () => (ui.sel?.type === 'sound' ? project.sounds.find((s) => s.id === ui.sel.id) : null);

function select(type, id) {
  ui.sel = type ? { type, id } : null;
  if (ui.picking) setPicking(false);
  overlay.markDirty();
  refresh();
}

function clipHasPlayhead(f) {
  const st = clipStart(f.ti, f.clip);
  return ui.t >= st && ui.t < st + clipDur(f.clip);
}

// O anaco sobre o que actúan "cortar" e "conxelar": o escollido se a liña
// vermella está nel; se non, o que haxa baixo a liña.
function targetAtPlayhead() {
  const s = selClip();
  if (s && clipHasPlayhead(s)) return { ti: s.ti, clip: s.clip, local: ui.t - clipStart(s.ti, s.clip) };
  for (const ti of (s ? [s.ti, 1 - s.ti] : [1, 0])) {
    const a = trackAt(ti, ui.t);
    if (a && !a.hold) return { ti, clip: a.clip, local: a.local };
  }
  return null;
}

// ---------------------------------------------------------------------- avisos
// Aviso tranquilo na parte de arriba; marcha só aos poucos segundos se non é
// "sticky".
let notice = null;
let noticeTimer = 0;
function notify(key, vars, { sticky = false } = {}) {
  clearTimeout(noticeTimer);
  notice = key ? [key, vars] : null;
  $('notice').hidden = !notice;
  if (notice) $('noticeText').textContent = t(...notice);
  if (notice && !sticky) noticeTimer = setTimeout(() => notify(null), 5000);
}

// ------------------------------------------------------------------- proxectos
function renderProjectBar() {
  const dirty = projects.isDirty();
  const name = projects.displayName();
  $('projName').textContent = `${name}${dirty ? ' •' : ''}`;
  $('projName').title = dirty ? t('pj_unsaved') : '';
  document.title = `${dirty ? '• ' : ''}${name} – Cromanenos`;
  const busy = ui.exporting || projects.state.busy;
  for (const id of ['pjNew', 'pjOpen', 'pjSave', 'pjSaveAs']) $(id).disabled = busy;
  $('undoBtn').disabled = busy || !history.canUndo();
  $('redoBtn').disabled = busy || !history.canRedo();
}

// ------------------------------------------------------- desfacer e refacer
// Rematou un xesto: anótase para poder desfacelo e para a recuperación.
function commit() {
  if (history.commit()) recovery.schedule();
}

function afterHistory() {
  preview.pause();
  if (ui.picking) { ui.picking = false; canvas.classList.remove('picking'); }
  overlay.markDirty();
  invalidate();
  preview.forgetUnused();
  preview.seek(ui.t);
  recovery.schedule();
  refresh();
}

function doUndo() { return !(ui.exporting || projects.state.busy) && history.undo(); }
function doRedo() { return !(ui.exporting || projects.state.busy) && history.redo(); }

function confirmDiscard() {
  return new Promise((res) => {
    const d = $('confirmDialog');
    const done = (answer) => { d.close(); res(answer); };
    $('cfSave').onclick = () => done('save');
    $('cfDiscard').onclick = () => done('discard');
    $('cfCancel').onclick = () => done('cancel');
    d.oncancel = () => res('cancel');
    d.showModal();
  });
}

// Navegadores sen File System Access: pídese o ficheiro cun <input>.
function pickFile() {
  return new Promise((res) => {
    const inp = $('pjFile');
    inp.value = '';
    inp.onchange = () => res(inp.files[0] || null);
    inp.oncancel = () => res(null);
    inp.click();
  });
}

async function showOpenDialog() {
  if (ui.exporting || projects.state.busy) return;
  const list = await projects.listRecent();
  $('recentNote').textContent = !projects.HAS_FS ? t('recent_unsupported') : list.length ? '' : t('recent_none');
  $('recentList').replaceChildren(...list.map((r) => el('button', {
    class: 'recent',
    onclick: async () => { $('openDialog').close(); await projects.openRecent(r.id); },
  },
  el('span', { class: 'rname', text: `🎬 ${r.name}` }),
  el('span', { class: 'rdate', text: new Date(r.when).toLocaleDateString(getLang()) }))));
  if (!$('openDialog').open) $('openDialog').showModal();
}

// --------------------------------------------------------------------- versións
const upd = { msg: null, apply: false, link: false, busy: false };
function renderUpdates() {
  const i = updates.info;
  $('verLine').textContent = i.version ? t('ver_line', { v: i.version }) : '';
  $('updCheck').hidden = !i.launcher;
  $('updCheck').disabled = upd.busy;
  $('updApply').hidden = !upd.apply;
  $('updApply').disabled = upd.busy;
  $('updMsg').textContent = upd.msg ? t(...upd.msg) : '';
  $('updLink').hidden = !(upd.link || !i.launcher);
}

async function checkUpdates() {
  Object.assign(upd, { msg: ['upd_checking'], apply: false, link: false, busy: true });
  renderUpdates();
  const r = await updates.check();
  upd.busy = false;
  if (!r.ok) Object.assign(upd, { msg: ['upd_fail'], link: true });
  else if (!r.available) upd.msg = ['upd_latest'];
  else Object.assign(upd, { msg: ['upd_new', { v: r.latest }], apply: updates.info.canUpdate, link: !updates.info.canUpdate });
  renderUpdates();
  return r;
}

async function applyUpdate() {
  Object.assign(upd, { msg: ['upd_applying'], apply: false, link: false, busy: true });
  renderUpdates();
  const r = await updates.apply();
  upd.busy = false;
  if (r.ok) upd.msg = ['upd_done'];
  else Object.assign(upd, { msg: ['upd_failApply'], link: true });
  renderUpdates();
  return r;
}

// Ao arrancar, sen molestar: se hai versión nova e se pode, instálase soa.
async function startupUpdate() {
  await updates.init();
  renderUpdates();
  const v = await updates.autoUpdate();
  if (v) {
    upd.msg = ['upd_done'];
    renderUpdates();
    notify('upd_ready', { v }, { sticky: true });
  }
  return v;
}

// ------------------------------------------------- tamaño da vista do vídeo
const SIZE_KEY = 'cromanenos.viewSize';
const SIZE_MIN = 25, SIZE_MAX = 100;
let viewPct = null; // null = automático (que colla a liña de tempo na pantalla)

function autoViewPct() {
  const stageW = $('viewWrap').parentElement.clientWidth;
  if (!stageW) return SIZE_MAX;
  const wantH = Math.max(180, window.innerHeight * 0.5);
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, ((wantH * 16) / 9 / stageW) * 100));
}

function applyViewSize() {
  const pct = viewPct ?? autoViewPct();
  $('viewWrap').style.width = `${pct}%`;
  $('viewHandle').setAttribute('aria-valuenow', String(Math.round(pct)));
}

function setViewSize(pct, store = true) {
  viewPct = pct == null ? null : Math.min(SIZE_MAX, Math.max(SIZE_MIN, pct));
  applyViewSize();
  if (!store) return;
  try {
    if (viewPct == null) localStorage.removeItem(SIZE_KEY);
    else localStorage.setItem(SIZE_KEY, String(Math.round(viewPct * 10) / 10));
  } catch { /* sen almacenamento: vale para esta vez */ }
}

function initViewSize() {
  const handle = $('viewHandle');
  try {
    const saved = parseFloat(localStorage.getItem(SIZE_KEY));
    if (Number.isFinite(saved)) viewPct = Math.min(SIZE_MAX, Math.max(SIZE_MIN, saved));
  } catch { /* automático */ }
  applyViewSize();
  window.addEventListener('resize', applyViewSize);

  handle.addEventListener('pointerdown', (ev) => {
    const stageW = $('viewWrap').parentElement.clientWidth;
    const h0 = canvas.getBoundingClientRect().height;
    const y0 = ev.clientY;
    try { handle.setPointerCapture(ev.pointerId); } catch { /* punteiro sen captura */ }
    const move = (e) => setViewSize((((h0 + e.clientY - y0) * 16) / 9 / stageW) * 100, false);
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      setViewSize(viewPct);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
    ev.preventDefault();
  });
  handle.addEventListener('dblclick', () => setViewSize(null));
  handle.addEventListener('keydown', (e) => {
    const now = viewPct ?? autoViewPct();
    const step = { ArrowDown: 5, ArrowRight: 5, ArrowUp: -5, ArrowLeft: -5 }[e.key];
    if (step) setViewSize(now + step);
    else if (e.key === 'Home') setViewSize(SIZE_MIN);
    else if (e.key === 'End') setViewSize(SIZE_MAX);
    else if (e.key === 'Enter' || e.key === ' ') setViewSize(null);
    else return;
    e.preventDefault();
  });
}

// --------------------------------------------------------------------- estado
export function setStatus(key, vars) {
  status = key ? [key, vars] : null;
  $('status').textContent = status ? t(...status) : '';
}

function errStatus(err, fallback) {
  if (err?.i18n) setStatus(...err.i18n);
  else setStatus(...fallback);
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ------------------------------------------------------------- liña de tempo
function dragInTime(block, obj, strip) {
  block.addEventListener('pointerdown', (ev) => {
    const D = duration();
    if (!D || ui.exporting) return;
    const width = strip.getBoundingClientRect().width;
    const x0 = ev.clientX, at0 = obj.at;
    let moved = false;
    try { block.setPointerCapture(ev.pointerId); } catch { /* punteiro sen captura */ }
    const move = (e) => {
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) moved = true;
      if (!moved) return;
      obj.at = Math.min(Math.max(0, at0 + (dx / width) * D), Math.max(0, D - 0.1));
      block.style.left = `${(obj.at / D) * 100}%`;
    };
    const up = () => {
      block.removeEventListener('pointermove', move);
      block.removeEventListener('pointerup', up);
      block.removeEventListener('pointercancel', up);
      if (moved) setTimeout(refresh, 0); // pode cambiar canto dura o vídeo
    };
    block.addEventListener('pointermove', move);
    block.addEventListener('pointerup', up);
    block.addEventListener('pointercancel', up);
  });
}

// ----------------------------------------------- anacos: miniatura e arrastre
function paintThumb(b, url) {
  b.style.backgroundImage = `url("${url}")`;
  b.style.backgroundSize = 'auto 100%';
  b.style.backgroundRepeat = 'no-repeat';
}

function onThumb(key, url) {
  document.querySelectorAll('.block').forEach((b) => { if (b.dataset.thumb === key) paintThumb(b, url); });
}

function setBlockWidths() {
  const D = duration() || 1;
  document.querySelectorAll('.block').forEach((b) => {
    const f = findClip(+b.dataset.clip);
    if (f) b.style.flex = `0 0 ${(clipDur(f.clip) / D) * 100}%`;
  });
}

// Onde caería un anaco soltado nese punto: { ti, idx, x } ou null.
function dropSpot(x, y, dragged) {
  for (const ti of [1, 0]) {
    const strip = $(`strip${ti}`);
    const r = strip.getBoundingClientRect();
    if (y < r.top - 8 || y > r.bottom + 8) continue;
    const blocks = [...strip.querySelectorAll('.block')].filter((b) => b !== dragged);
    let idx = 0;
    let left = 0;
    for (const b of blocks) {
      const br = b.getBoundingClientRect();
      if (x > br.left + br.width / 2) { idx++; left = br.right - r.left; }
    }
    if (idx === 0 && blocks.length) left = blocks[0].getBoundingClientRect().left - r.left;
    return { ti, idx, left, strip };
  }
  return null;
}

function clearDropMarks() {
  document.querySelectorAll('.ins').forEach((e) => e.remove());
  document.querySelectorAll('.clipdrop').forEach((e) => e.classList.remove('clipdrop'));
}

let suppressClick = false;

// Arrastrar un anaco: polo medio cámbiase de sitio (ou de pista); polos
// bordos recórtase.
function clipPointer(b, c) {
  b.addEventListener('pointerdown', (ev) => {
    if (ui.exporting || projects.state.busy || ev.button > 0) return;
    const r = b.getBoundingClientRect();
    const stripW = b.parentElement.getBoundingClientRect().width;
    const D0 = duration() || 1;
    const edgeW = Math.min(12, r.width / 3);
    const edge = ev.clientX - r.left <= edgeW ? 'l' : r.right - ev.clientX <= edgeW ? 'r' : null;
    const x0 = ev.clientX, y0 = ev.clientY;
    const base = { in: c.in, out: c.out };
    let mode = null;
    try { b.setPointerCapture(ev.pointerId); } catch { /* punteiro sen captura */ }

    const move = (e) => {
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (!mode) {
        if (Math.hypot(dx, dy) < 6) return;
        mode = edge ? 'trim' : 'move';
        preview.pause();
        if (ui.picking) setPicking(false);
        if (mode === 'move') b.classList.add('dragging');
      }
      if (mode === 'trim') {
        trimClip(c, edge, (dx / stripW) * D0, base);
        setBlockWidths();
        // Vese o fotograma onde queda o corte.
        const f = findClip(c.id);
        const st = clipStart(f.ti, c);
        ui.t = edge === 'l' ? st : st + Math.max(0, clipDur(c) - 1 / FPS);
        updatePlayheads();
      } else {
        b.style.transform = `translate(${dx}px, ${dy}px)`;
        clearDropMarks();
        const d = dropSpot(e.clientX, e.clientY, b);
        if (d) {
          d.strip.classList.add('clipdrop');
          const ins = el('div', { class: 'ins' });
          ins.style.left = `${d.left}px`;
          d.strip.append(ins);
        }
      }
    };
    const up = (e) => {
      b.removeEventListener('pointermove', move);
      b.removeEventListener('pointerup', up);
      b.removeEventListener('pointercancel', up);
      if (!mode) return; // foi un toque: escóllese co clic de sempre
      b.classList.remove('dragging');
      b.style.transform = '';
      clearDropMarks();
      if (mode === 'move' && e.type === 'pointerup') {
        const d = dropSpot(e.clientX, e.clientY, b);
        if (d) placeClip(c.id, d.ti, d.idx);
      }
      ui.sel = { type: 'clip', id: c.id };
      suppressClick = true;
      setTimeout(() => {
        suppressClick = false;
        preview.forgetUnused();
        preview.seek(ui.t);
        refresh();
      }, 0);
    };
    b.addEventListener('pointermove', move);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
  });
}

// Mover o anaco escollido co teclado (Alt + frechas).
function nudgeClip(key) {
  const s = selClip();
  if (!s || ui.exporting) return false;
  if (key === 'ArrowLeft') moveClip(s.clip.id, -1);
  else if (key === 'ArrowRight') moveClip(s.clip.id, 1);
  else if (key === 'ArrowUp' && s.ti === 0) placeClip(s.clip.id, 1, s.idx);
  else if (key === 'ArrowDown' && s.ti === 1) placeClip(s.clip.id, 0, s.idx);
  else return false;
  preview.forgetUnused();
  preview.seek(ui.t);
  refresh();
  return true;
}

// ------------------------------------------------- soltar ficheiros do escritorio
async function dropFiles(ti, files) {
  const pj = files.find((f) => f.name.toLowerCase().endsWith('.cromanenos'));
  if (pj) return projects.openDropped(pj);
  const ok = files.filter((f) => /^(video|image)\//.test(f.type));
  return ok.length ? addFiles(ti, ok) : null;
}

function initDrops() {
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
  // Fóra das zonas de soltar, que o navegador non abra o ficheiro e marche da páxina.
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => { if (hasFiles(e)) e.preventDefault(); });
  const zone = (elm, trackOf) => {
    elm.addEventListener('dragover', (e) => {
      if (!hasFiles(e) || ui.exporting) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      elm.classList.add('filedrop');
    });
    elm.addEventListener('dragleave', () => elm.classList.remove('filedrop'));
    elm.addEventListener('drop', (e) => {
      elm.classList.remove('filedrop');
      if (!hasFiles(e) || ui.exporting) return;
      e.preventDefault();
      dropFiles(trackOf(), [...e.dataTransfer.files]);
    });
  };
  zone($('strip0'), () => 0);
  zone($('strip1'), () => 1);
  zone(canvas, () => (project.tracks[0].clips.length ? 1 : 0));
}

function renderTimeline() {
  const D = duration() || 1;
  for (const ti of [0, 1]) {
    const strip = $(`strip${ti}`);
    strip.replaceChildren();
    for (const c of project.tracks[ti].clips) {
      const chips = FX_ORDER.filter((k) => c.fx[k]).map((k) => FX_ICON[k]).join('');
      const b = el('button', {
        class: `block${ui.sel?.type === 'clip' && ui.sel.id === c.id ? ' sel' : ''}`,
        title: c.media.name,
        onclick: (ev) => {
          if (suppressClick) { ev.stopPropagation(); return; }
          select('clip', c.id);
        },
      },
      el('span', { class: 'grip l' }),
      el('span', { class: 'bname', text: `${KIND_ICON[c.media.kind]} ${c.media.name}` }),
      chips && el('span', { class: 'chips', text: chips }),
      el('span', { class: 'grip r' }));
      b.dataset.clip = c.id;
      b.dataset.thumb = thumbKey(c);
      b.style.flex = `0 0 ${(clipDur(c) / D) * 100}%`;
      const thumb = thumbOf(c, onThumb);
      if (thumb) paintThumb(b, thumb);
      clipPointer(b, c);
      strip.append(b);
    }
    strip.append(el('div', { class: 'ph' }));
  }

  const itemRow = (strip, list, type, labelOf, durOf) => {
    strip.replaceChildren();
    for (const o of list) {
      const b = el('button', {
        class: `item${ui.sel?.type === type && ui.sel.id === o.id ? ' sel' : ''}`,
        text: labelOf(o),
        onclick: (ev) => { ev.stopPropagation(); select(type, o.id); },
      });
      b.style.left = `${(o.at / D) * 100}%`;
      b.style.width = `${(durOf(o) / D) * 100}%`;
      dragInTime(b, o, strip);
      strip.append(b);
    }
    strip.append(el('div', { class: 'ph' }));
  };
  itemRow($('stripO'), project.overlay, 'overlay', (o) => o.text, (o) => o.dur);
  itemRow($('stripS'), project.sounds, 'sound',
    (s) => (s.kind === 'voice' ? `🎤 ${t('s_voice')}` : `${audio.SFX[s.kind]} ${t(`s_${s.kind}`)}`),
    (s) => s.buffer.duration);
  updatePlayheads();
}

function updatePlayheads() {
  const D = duration();
  const left = `${D ? (ui.t / D) * 100 : 0}%`;
  document.querySelectorAll('.strip .ph').forEach((ph) => { ph.style.left = left; });
}

// ------------------------------------------------------------ anaco escollido
function renderClipCard() {
  const s = selClip();
  const busy = ui.exporting;
  $('clipName').textContent = s ? `${KIND_ICON[s.clip.media.kind]} ${s.clip.media.name}` : t('noClip');
  const target = targetAtPlayhead();
  $('opSplit').disabled = busy || !target;
  $('opFreeze').disabled = busy || !target;
  $('opDel').disabled = busy || !s;
  const still = s && s.clip.media.kind === 'image';
  $('stillRow').hidden = !still;
  if (still) $('stillDur').value = s.clip.out - s.clip.in;
}

function splitHere() {
  const target = targetAtPlayhead();
  if (!target) return;
  const parts = splitClip(target.clip.id, ui.t);
  if (parts) ui.sel = { type: 'clip', id: parts[1].id };
  refresh();
}

async function freezeHere(seconds = FREEZE_SECONDS) {
  const target = targetAtPlayhead();
  if (!target) return null;
  preview.pause();
  let shot;
  try {
    shot = await grabFrame(target.clip, srcTime(target.clip, target.local));
  } catch (err) {
    console.error(err);
    setStatus('err_freeze');
    return null;
  }
  // O conxelado herda os efectos de imaxe do anaco (non a velocidade).
  const fx = structuredClone(target.clip.fx);
  delete fx.speed;
  delete fx.reverse;
  const still = makeClip(mediaFromCanvas(shot, `🧊 ${t('freezeName')}`), { out: seconds, fx });
  const before = target.local < clipDur(target.clip) / 2;
  const parts = splitClip(target.clip.id, ui.t);
  const f = findClip(target.clip.id);
  insertClip(f.ti, parts || !before ? f.idx + 1 : f.idx, still);
  ui.sel = { type: 'clip', id: still.id };
  refresh();
  return still;
}

function deleteSelection() {
  if (ui.exporting || !ui.sel) return;
  const { type, id } = ui.sel;
  if (type === 'clip') { removeClip(id); preview.forgetUnused(); }
  else if (type === 'overlay') overlay.removeItem(id);
  else if (type === 'sound') project.sounds.splice(project.sounds.findIndex((s) => s.id === id), 1);
  ui.sel = null;
  if (ui.picking) setPicking(false);
  preview.seek(ui.t);
  refresh();
}

// -------------------------------------------------------------------- efectos
function slider(labelKey, min, max, step, value, oninput) {
  return el('label', {}, el('span', { text: t(labelKey) }),
    el('input', { type: 'range', min, max, step, value, oninput: (e) => oninput(+e.target.value) }));
}

function fxSection(s, k) {
  const p = s.clip.fx[k];
  const name = t(`fx_${k}`);
  const sec = el('div', { class: 'fxsec', id: `fx-${k}` },
    el('div', { class: 'fxhead' },
      el('strong', { text: `${FX_ICON[k]} ${name}` }),
      el('button', { class: 'x', text: '✖', title: t('removeFx', { name }), aria: t('removeFx', { name }), onclick: () => removeFx(k) })));
  const info = (key) => sec.append(el('p', { class: 'hint', text: t(key) }));

  if (k === 'chroma') {
    info('chromaInfo');
    const sw = el('span', { class: 'swatch', title: t('keyColor') });
    sw.style.background = `rgb(${p.key.map((v) => Math.round(v * 255)).join(',')})`;
    sec.append(el('div', { class: 'row' }, sw,
      el('button', { class: ui.picking ? 'on' : '', text: t('pick'), onclick: () => setPicking(!ui.picking) })),
    slider('tol', 0.02, 0.45, 0.005, p.tol, (v) => { p.tol = v; }),
    slider('soft', 0.005, 0.25, 0.005, p.soft, (v) => { p.soft = v; }));
  } else if (k === 'split') {
    info('splitInfo');
    sec.append(slider('splitPos', 0, 1, 0.002, p.pos, (v) => { p.pos = v; }),
      slider('splitSoft', 0, 0.15, 0.002, p.soft, (v) => { p.soft = v; }));
  } else if (k === 'ghost') {
    sec.append(slider('opacity', 0.05, 1, 0.01, p.opacity, (v) => { p.opacity = v; }));
  } else if (k === 'size') {
    sec.append(slider('zoom', 0.2, 2.5, 0.01, p.zoom, (v) => { p.zoom = v; }));
    info('dragTip');
    sec.append(el('button', { text: t('reset'), onclick: () => { Object.assign(p, { zoom: 1, x: 0, y: 0 }); refresh(); } }));
  } else if (k === 'mirror') {
    info('mirrorInfo');
  } else if (k === 'filter') {
    sec.append(el('div', { class: 'speed' }, ...FILTERS.map((f) => el('button', {
      class: p.name === f ? 'on' : '', text: t(`f_${f}`), onclick: () => { p.name = f; refresh(); },
    }))));
  } else if (k === 'speed') {
    sec.append(el('div', { class: 'speed' }, ...SPEEDS.map(([v, label]) => el('button', {
      class: p.v === v ? 'on' : '', text: label, onclick: () => { preview.pause(); p.v = v; preview.seek(ui.t); refresh(); },
    }))));
  } else if (k === 'reverse') {
    info('reverseInfo');
  } else if (k === 'mute') {
    info('muteInfo');
  }
  if (s.ti === 0 && NEEDS_BELOW.includes(k)) sec.append(el('p', { class: 'hint warn', text: t('fxBottomHint') }));
  return sec;
}

function renderFx() {
  const s = selClip();
  $('fxHint').hidden = !!s;
  const still = s && s.clip.media.kind === 'image';
  $('fxPalette').replaceChildren(...FX_ORDER.map((k) => el('button', {
    class: `fxbtn${s && s.clip.fx[k] ? ' on' : ''}`,
    disabled: !s || ui.exporting || (still && (k === 'speed' || k === 'reverse'))
      || (k === 'mute' && s.clip.media.kind !== 'video'),
    onclick: () => addFx(k),
  }, el('span', { class: 'ico', text: FX_ICON[k] }), el('span', { text: t(`fx_${k}`) }))));
  $('fxList').replaceChildren(...(s ? FX_ORDER.filter((k) => s.clip.fx[k]).map((k) => fxSection(s, k)) : []));
}

function addFx(k, params) {
  const s = selClip();
  if (!s) return;
  preview.pause();
  if (!s.clip.fx[k]) s.clip.fx[k] = FX_DEFAULTS[k]();
  if (params) Object.assign(s.clip.fx[k], params);
  preview.seek(ui.t);
  refresh();
  $(`fx-${k}`)?.scrollIntoView({ block: 'nearest' });
}

function removeFx(k) {
  const s = selClip();
  if (!s) return;
  preview.pause();
  delete s.clip.fx[k];
  if (k === 'chroma' && ui.picking) setPicking(false);
  preview.seek(ui.t);
  refresh();
}

// Contagotas do croma: lévase a liña vermella ao anaco e amósase sen efectos.
function setPicking(on) {
  const s = selClip();
  if (on && (!s || !s.clip.fx.chroma)) return;
  if (on && !clipHasPlayhead(s)) preview.seek(clipStart(s.ti, s.clip) + Math.min(0.2, clipDur(s.clip) / 2));
  if (on) preview.pause();
  ui.picking = on;
  canvas.classList.toggle('picking', on);
  refresh();
}

// ------------------------------------------------------ interacción no cadro
function canvasPos(ev) {
  const r = canvas.getBoundingClientRect();
  return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * H];
}

function initCanvas() {
  let drag = null;
  canvas.addEventListener('pointerdown', (ev) => {
    if (ui.exporting) return;
    const [x, y] = canvasPos(ev);
    if (ui.picking) {
      const s = selClip();
      preview.renderNow(); // o cadro, sen efectos, tal como está agora
      if (s?.clip.fx.chroma) s.clip.fx.chroma.key = readColor(x, y);
      setPicking(false);
      return;
    }
    const hit = overlay.hitTest(ui.t, x, y);
    if (hit) {
      drag = { item: hit, dx: x - hit.x, dy: y - hit.y };
      select('overlay', hit.id);
    } else {
      const s = selClip();
      const size = s?.clip.fx.size;
      if (size && clipHasPlayhead(s)) drag = { size, x0: x, y0: y, px: size.x, py: size.y };
    }
    if (drag) { try { canvas.setPointerCapture(ev.pointerId); } catch { /* punteiro sen captura */ } }
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const [x, y] = canvasPos(ev);
    if (drag.item) {
      drag.item.x = Math.min(Math.max(0, x - drag.dx), W);
      drag.item.y = Math.min(Math.max(0, y - drag.dy), H);
      overlay.markDirty();
    } else {
      drag.size.x = drag.px + (x - drag.x0) / W;
      drag.size.y = drag.py + (y - drag.y0) / H;
    }
  });
  const end = () => { if (drag) commit(); drag = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

// ---------------------------------------------------------- engadir material
async function addFiles(ti, files) {
  let last = null;
  for (const file of files) {
    try {
      last = insertClip(ti, project.tracks[ti].clips.length, makeClip(await loadMedia(file)));
      setStatus(null);
    } catch (err) {
      errStatus(err, ['err_open', { name: file.name }]);
    }
  }
  if (last) ui.sel = { type: 'clip', id: last.id };
  refresh();
  return last;
}

function addFrames(ti, frames, fps) {
  const clip = insertClip(ti, project.tracks[ti].clips.length, makeClip(mediaFromFrames(frames, fps, t('sm_name'))));
  ui.sel = { type: 'clip', id: clip.id };
  refresh();
  return clip;
}

function addOverlayItem(kind, text, extra) {
  if (!text) return null;
  const o = overlay.addItem(kind, text, Math.min(ui.t, Math.max(0, duration() - 0.1)), extra);
  select('overlay', o.id);
  return o;
}

async function addSfx(kind, at = ui.t) {
  const buffer = await audio.makeSfx(kind);
  const s = { id: uid(), kind, at, buffer };
  project.sounds.push(s);
  audio.playOnce(buffer);
  select('sound', s.id);
  return s;
}

async function toggleRecording() {
  if (audio.isRecording()) {
    preview.pause();
    try {
      const { buffer, blob } = await audio.stopRecording();
      const s = { id: uid(), kind: 'voice', at: recAt, buffer, blob };
      project.sounds.push(s);
      ui.sel = { type: 'sound', id: s.id };
      setStatus(null);
    } catch (err) {
      console.error(err);
      setStatus('err_mic');
    }
  } else {
    try {
      await audio.startRecording();
      setStatus(null);
      if (duration()) preview.play(); // vese o vídeo mentres se fala
      recAt = ui.t;
    } catch {
      setStatus('err_mic');
    }
  }
  refresh();
}

// ---------------------------------------------------------------------- gardar
async function exportVideo() {
  if (!duration() || ui.exporting) return null;
  preview.pause();
  if (ui.picking) setPicking(false);
  ui.exporting = true;
  refresh();
  $('download').hidden = true;
  $('progress').hidden = false;
  $('progress').value = 0;
  setStatus('st_preparing');
  let result = null;
  try {
    let lastPct = -1;
    result = await exportProject(canvas, (p) => {
      $('progress').value = p;
      const pct = Math.round(p * 100);
      if (pct !== lastPct) { lastPct = pct; setStatus('st_saving', { p: pct }); }
    });
    const a = $('download');
    if (a.href) URL.revokeObjectURL(a.href);
    a.href = URL.createObjectURL(result.blob);
    a.download = 'cromanenos.mp4';
    a.hidden = false;
    setStatus(result.audio ? 'st_done' : 'st_doneMute', { mb: (result.blob.size / 1e6).toFixed(1) });
  } catch (err) {
    console.error(err);
    errStatus(err, ['err_save', { msg: err.message }]);
  } finally {
    $('progress').hidden = true;
    ui.exporting = false;
    overlay.markDirty();
    invalidate();
    refresh();
  }
  return result;
}

// -------------------------------------------------------------- pintar todo
function renderItemBox() {
  const o = selItem();
  $('itemBox').hidden = !o;
  $('noItem').hidden = !!o || !project.overlay.length;
  if (o) { $('itemSize').value = o.size; $('itemDur').value = o.dur; }
  const s = selSound();
  $('soundBox').hidden = !s;
  $('noSound').hidden = !!s || !project.sounds.length;
}

function renderStatic() {
  $('stickerPalette').replaceChildren(...STICKERS.map((s) => el('button', {
    text: s, aria: t('addSticker', { s }), onclick: () => addOverlayItem('sticker', s),
  })));
  $('sfxPalette').replaceChildren(...Object.entries(audio.SFX).map(([k, icon]) => el('button', {
    class: 'fxbtn', onclick: () => addSfx(k),
  }, el('span', { class: 'ico', text: icon }), el('span', { text: t(`s_${k}`) }))));
  $('langButtons').replaceChildren(...Object.entries(LANGS).map(([code, name]) => el('button', {
    class: `big${getLang() === code ? ' on' : ''}`, text: name, lang: code, onclick: () => setLang(code),
  })));
  $('tricksBody').replaceChildren(...tricks().map((r, i) => el('details', { open: i === 0 },
    el('summary', { text: r.title }),
    el('ol', {}, ...r.steps.map((step) => el('li', { text: step }))),
    examplesOk && EXAMPLES[i] && el('button', { class: 'try', text: t('ex_try'), onclick: () => loadExample(i) }))));
}

// ------------------------------------------------------- exemplos dos trucos
// Cada truco pode probarse cuns vídeos de mostra (test-media/), co efecto xa
// posto. [ficheiro, { out, fx }]
const GREEN = { key: [32 / 255, 192 / 255, 48 / 255], tol: 0.22, soft: 0.1 };
const EXAMPLES = [
  { bottom: [['ex-sitio.mp4']], top: [['ex-calcetin.mp4', { fx: { chroma: GREEN } }]] },
  { bottom: [['ex-monstro-esquerda.mp4']], top: [['ex-monstro-dereita.mp4', { fx: { split: { pos: 0.5, soft: 0.01 } } }]] },
  { bottom: [['ex-sitio.mp4', { out: 1.5 }], ['ex-monstro-esquerda.mp4', { out: 2 }], ['ex-sitio.mp4', { out: 1.5 }]], top: [] },
  { bottom: [['ex-paisaxe.png', { out: 4 }]], top: [['ex-verde.mp4', { fx: { chroma: GREEN, size: { zoom: 1.15, x: -0.12, y: 0.06 } } }]] },
  { bottom: [['ex-sitio.mp4']], top: [['ex-monstro-dereita.mp4', { fx: { ghost: { opacity: 0.45 } } }]] },
];
let examplesOk = false;

async function probeExamples() {
  try {
    examplesOk = (await fetch('test-media/ex-paisaxe.png', { cache: 'no-store' })).ok;
  } catch {
    examplesOk = false;
  }
  renderStatic();
  return examplesOk;
}

async function loadExample(i) {
  const ex = EXAMPLES[i];
  if (!ex || ui.exporting || projects.state.busy) return false;
  $('tricksDialog').close();
  if (!(await projects.newProject())) return false; // pregunta se hai cambios sen gardar
  try {
    const loaded = new Map();
    const get = async (name) => {
      if (!loaded.has(name)) {
        const r = await fetch(`test-media/${name}`);
        if (!r.ok) throw new Error(name);
        const blob = await r.blob();
        const type = blob.type && blob.type !== 'application/octet-stream' ? blob.type : name.endsWith('.png') ? 'image/png' : 'video/mp4';
        loaded.set(name, await loadMedia(new File([blob], name, { type })));
      }
      return loaded.get(name);
    };
    let pick = null;
    for (const [ti, list] of [[0, ex.bottom], [1, ex.top]]) {
      for (const [name, extra = {}] of list) {
        const c = insertClip(ti, project.tracks[ti].clips.length, makeClip(await get(name), structuredClone(extra)));
        if (ti === 1 || !pick) pick = c;
      }
    }
    ui.sel = pick ? { type: 'clip', id: pick.id } : null;
    history.reset();
    projects.markClean(); // un exemplo non é traballo que haxa que gardar
    refresh();
    seekTo(Math.min(1, duration() / 2));
    notify('ex_loaded');
    return true;
  } catch {
    await projects.newProject({ force: true });
    notify('ex_fail');
    return false;
  }
}

// ----------------------------------------------------- recuperación automática
function askRecover(st) {
  return new Promise((res) => {
    const d = $('recoverDialog');
    $('rcText').textContent = t('rc_text', { name: st.name || t('untitled') });
    const done = (answer) => { d.close(); res(answer); };
    $('rcYes').onclick = () => done(true);
    $('rcNo').onclick = () => done(false);
    d.oncancel = (e) => e.preventDefault(); // hai que escoller: Esc non decide por ninguén
    d.showModal();
  });
}

// Ao arrancar: se a última vez quedou traballo sen gardar, ofrécese seguir.
async function startupRecovery(answer) {
  await recovery.init({
    isDirty: projects.isDirty,
    name: () => projects.state.name,
    keepKeys: history.keysInHistory,
  });
  const st = await recovery.peek();
  let result = null;
  if (st) {
    const yes = answer ?? await askRecover(st);
    const data = yes ? await recovery.restore(st) : null;
    if (data) {
      projects.adoptRecovered(data, st.name);
      notify('rc_done');
    } else {
      await recovery.clear();
      if (yes) notify('rc_fail');
    }
    result = !!data;
  } else {
    await recovery.clear(); // restos sen descrición: non valen para nada
  }
  recovery.arm();
  return result;
}

export function refresh() {
  commit();
  const D = duration();
  const busy = ui.exporting;
  if (ui.sel && !(selClip() || selItem() || selSound())) ui.sel = null;
  if (ui.t > D) ui.t = D;
  $('play').disabled = !D || busy;
  $('play').textContent = t(ui.playing ? 'pause' : 'play');
  $('seek').disabled = !D || busy;
  if (!ui.playing) $('seek').value = D ? Math.round((ui.t / D) * 1000) : 0;
  $('export').disabled = !D || busy;
  $('rec').textContent = t(audio.isRecording() ? 'recStop' : 'recVoice');
  $('rec').classList.toggle('on', audio.isRecording());
  $('rec').disabled = busy;
  const [bottom, top] = project.tracks.map((tr) => tr.clips.length);
  $('hint').textContent = ui.picking ? t('hintPick')
    : !bottom && !top ? t('hintEmpty')
    : !top ? t('hintTop')
    : '';
  if (status) $('status').textContent = t(...status);
  if (notice) $('noticeText').textContent = t(...notice);
  renderProjectBar();
  renderUpdates();
  renderTimeline();
  renderClipCard();
  renderFx();
  renderItemBox();
}

let wasPlaying = false;
function onTick() {
  const D = duration();
  $('clock').textContent = `${fmt(ui.t)} / ${fmt(D)}`;
  if (ui.playing) $('seek').value = D ? Math.round((ui.t / D) * 1000) : 0;
  updatePlayheads();
  if (wasPlaying !== ui.playing) {
    wasPlaying = ui.playing;
    $('play').textContent = t(ui.playing ? 'pause' : 'play');
    renderClipCard();
  }
}

function seekTo(tt) {
  preview.seek(tt);
  const D = duration();
  $('seek').value = D ? Math.round((ui.t / D) * 1000) : 0;
  updatePlayheads();
  renderClipCard();
}

// ---------------------------------------------------------------------- inicio
export function initUI(view) {
  canvas = view;
  initCanvas();
  initStopMotion();
  camera.initCamera();
  initDrops();
  history.init({ restored: afterHistory });

  $('play').addEventListener('click', () => { if (ui.playing) preview.pause(); else preview.play(); refresh(); });
  $('seek').addEventListener('input', (e) => seekTo((e.target.value / 1000) * duration()));
  $('export').addEventListener('click', exportVideo);

  document.querySelectorAll('.strip').forEach((strip) => strip.addEventListener('click', (ev) => {
    if (ui.exporting) return;
    const r = strip.getBoundingClientRect();
    seekTo(((ev.clientX - r.left) / r.width) * duration());
  }));
  document.querySelectorAll('.tadd input[type=file]').forEach((inp) => inp.addEventListener('change', (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.length) addFiles(+inp.dataset.track, files);
  }));
  document.querySelectorAll('[data-stop]').forEach((b) => b.addEventListener('click', () => {
    preview.pause();
    openStopMotion(({ frames, fps }) => addFrames(+b.dataset.stop, frames, fps));
  }));
  document.querySelectorAll('[data-cam]').forEach((b) => b.addEventListener('click', () => {
    preview.pause();
    camera.openCameraDialog((file) => addFiles(+b.dataset.cam, [file]));
  }));
  $('undoBtn').addEventListener('click', doUndo);
  $('redoBtn').addEventListener('click', doRedo);
  // Soltar un deslizador é o final dun xesto.
  document.addEventListener('change', (e) => {
    if (e.target.matches?.('input[type=range]')) { commit(); renderProjectBar(); }
  });

  $('opSplit').addEventListener('click', splitHere);
  $('opFreeze').addEventListener('click', () => freezeHere());
  $('opDel').addEventListener('click', deleteSelection);
  $('stillDur').addEventListener('input', (e) => {
    const s = selClip();
    if (!s) return;
    s.clip.out = s.clip.in + +e.target.value;
    renderTimeline();
  });

  $('addText').addEventListener('click', () => {
    if (addOverlayItem('text', $('textIn').value.trim())) $('textIn').value = '';
  });
  $('textIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('addText').click(); });
  $('itemSize').addEventListener('input', (e) => { const o = selItem(); if (o) { o.size = +e.target.value; overlay.markDirty(); } });
  $('itemDur').addEventListener('input', (e) => { const o = selItem(); if (o) { o.dur = +e.target.value; renderTimeline(); } });
  $('itemHere').addEventListener('click', () => { const o = selItem(); if (o) { o.at = ui.t; refresh(); } });
  $('itemDel').addEventListener('click', deleteSelection);

  $('rec').addEventListener('click', toggleRecording);
  $('soundHere').addEventListener('click', () => { const s = selSound(); if (s) { s.at = ui.t; refresh(); } });
  $('soundDel').addEventListener('click', deleteSelection);

  $('openSettings').addEventListener('click', () => $('settingsDialog').showModal());
  $('openTricks').addEventListener('click', () => $('tricksDialog').showModal());
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));

  $('pjNew').addEventListener('click', () => projects.newProject());
  $('pjOpen').addEventListener('click', showOpenDialog);
  $('pjSave').addEventListener('click', () => projects.save());
  $('pjSaveAs').addEventListener('click', () => projects.saveAs());
  $('pjBrowse').addEventListener('click', () => { $('openDialog').close(); projects.openPicker(); });
  $('noticeClose').addEventListener('click', () => notify(null));
  $('updCheck').addEventListener('click', checkUpdates);
  $('updApply').addEventListener('click', applyUpdate);
  $('updLink').href = updates.RELEASES_URL;

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && ['s', 'o'].includes(e.key.toLowerCase())) {
      e.preventDefault(); // que o navegador non garde nin abra a páxina
      if (document.querySelector('dialog[open]') || ui.exporting) return;
      if (e.key.toLowerCase() === 'o') showOpenDialog();
      else if (e.shiftKey) projects.saveAs();
      else projects.save();
      return;
    }
    const typing = e.target.closest('input[type=text], textarea');
    if ((e.ctrlKey || e.metaKey) && !e.altKey && ['z', 'y'].includes(e.key.toLowerCase()) && !typing) {
      e.preventDefault();
      if (document.querySelector('dialog[open]')) return;
      if (e.key.toLowerCase() === 'y' || e.shiftKey) doRedo(); else doUndo();
      return;
    }
    if (e.target.closest('input, textarea, dialog')) return;
    if (e.altKey && e.key.startsWith('Arrow')) { if (nudgeClip(e.key)) e.preventDefault(); return; }
    if (e.key === 'Delete') deleteSelection();
  });
  // Ao agochar ou pechar a pestana, gárdase xa o que haxa para recuperar.
  document.addEventListener('visibilitychange', () => { if (document.hidden) recovery.flushNow(); });
  window.addEventListener('pagehide', () => { recovery.flushNow(); });
  window.addEventListener('beforeunload', (e) => {
    if (projects.isDirty()) { e.preventDefault(); e.returnValue = ''; }
  });

  projects.init({
    refresh, notify, confirmDiscard, pickFile, version: () => updates.info.version,
    installed: () => { history.reset(); recovery.schedule(); },
    saved: (toFile) => { if (toFile) history.keepOnly(projects.mediaNow()); recovery.forgetState(); },
    cleared: () => { recovery.clear(); },
  });
  // Os deslizadores cambian o proxecto sen repintar todo: revísase cada pouco.
  setInterval(renderProjectBar, 700);
  initViewSize();

  onLangChange(() => { renderStatic(); retranslateStopMotion(); camera.retranslate(); refresh(); });
  preview.setOnTick(onTick);
  applyI18n();
  renderStatic();
  refresh();
  setTimeout(() => { startupUpdate().catch(() => {}); }, 1500);
  probeExamples();
  // Nas probas automáticas (?proba) a recuperación arráncase á man.
  if (!new URLSearchParams(location.search).has('proba')) startupRecovery().catch(() => recovery.arm());
}

// Para as probas automáticas (e para xogar desde a consola).
export const api = {
  project, ui, refresh, select, seek: seekTo, addFiles, addFrames, addFx, removeFx, splitHere, freezeHere,
  deleteSelection, addOverlayItem, addSfx, exportVideo, setPicking, setLang, renderNow: preview.renderNow,
  moveClip: (id, dir) => { moveClip(id, dir); refresh(); },
  projects, updates, checkUpdates, applyUpdate, startupUpdate, setViewSize, notify,
  history, recovery, camera, undo: doUndo, redo: doRedo, commit, startupRecovery, loadExample, probeExamples,
  dropFiles, nudgeClip, trimClip, placeClip, duration,
};
