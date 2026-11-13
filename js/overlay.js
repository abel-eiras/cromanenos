// Adhesivos e textos: debúxanse nun canvas 2D que o compositor pon enriba de todo.
// Cada un ten comezo (at) e duración (dur), coma os anacos.
import { W, H, ITEM_SECONDS, project, ui, uid } from './model.js';

export const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

let version = 0;
let signature = null;
let dirty = true;

export function markDirty() { dirty = true; }

export const visibleAt = (t) => project.overlay.filter((o) => t >= o.at && t < o.at + o.dur);

function fontOf(o) {
  return o.kind === 'sticker'
    ? `${o.size}px "Noto Color Emoji", "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
    : `bold ${o.size}px system-ui, sans-serif`;
}

function boxOf(o) {
  ctx.font = fontOf(o);
  const w = Math.max(ctx.measureText(o.text).width, o.size * 0.5);
  return { x: o.x - w / 2 - 10, y: o.y - o.size * 0.62 - 10, w: w + 20, h: o.size * 1.24 + 20 };
}

// Debuxa o que toca no instante t. Devolve o que precisa o compositor.
export function renderAt(t, showSelection) {
  const items = visibleAt(t);
  const selId = showSelection && ui.sel?.type === 'overlay' ? ui.sel.id : null;
  const sig = `${items.map((o) => o.id).join(',')}|${selId}`;
  if (dirty || sig !== signature) {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const o of items) {
      ctx.font = fontOf(o);
      if (o.kind === 'text') {
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(4, o.size / 7);
        ctx.strokeStyle = '#1d2233';
        ctx.strokeText(o.text, o.x, o.y);
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#000000';
      }
      ctx.fillText(o.text, o.x, o.y);
      if (o.id === selId) {
        const b = boxOf(o);
        ctx.save();
        ctx.setLineDash([14, 10]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffc83d';
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.restore();
      }
    }
    signature = sig;
    dirty = false;
    version++;
  }
  return { canvas, version, visible: items.length > 0 };
}

// Que adhesivo hai nese punto do cadro (o de máis arriba), ou null.
export function hitTest(t, x, y) {
  const items = visibleAt(t);
  for (let i = items.length - 1; i >= 0; i--) {
    const b = boxOf(items[i]);
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return items[i];
  }
  return null;
}

export function addItem(kind, text, at, extra = {}) {
  const o = { id: uid(), kind, text, x: W / 2, y: H / 2, size: kind === 'sticker' ? 180 : 90, at, dur: ITEM_SECONDS, ...extra };
  project.overlay.push(o);
  dirty = true;
  return o;
}

export function removeItem(id) {
  const i = project.overlay.findIndex((o) => o.id === id);
  if (i >= 0) project.overlay.splice(i, 1);
  dirty = true;
}
