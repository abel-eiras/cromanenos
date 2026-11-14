// Miniaturas para os anacos da liña de tempo: un fotograma do punto onde
// comeza cada anaco. Fanse unha a unha, en segundo plano, e gárdanse.
import { srcTime } from './model.js';
import { grabFrame } from './media.js';

const TW = 160, TH = 90, MAX = 300;
const cache = new Map(); // clave → enderezo ('' se non se puido) ou promesa
let chain = Promise.resolve();

export function keyOf(clip) {
  const m = clip.media;
  return `${m.id}:${m.kind === 'image' ? 0 : Math.round(srcTime(clip, 0) * 10)}`;
}

async function make(clip) {
  const src = await grabFrame(clip, srcTime(clip, 0));
  const c = document.createElement('canvas');
  c.width = TW; c.height = TH;
  const s = Math.max(TW / src.width, TH / src.height);
  c.getContext('2d').drawImage(src, (TW - src.width * s) / 2, (TH - src.height * s) / 2, src.width * s, src.height * s);
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.7));
  return blob ? URL.createObjectURL(blob) : '';
}

// Devolve o enderezo se xa está feita. Se non, encárgaa e avisa con
// onReady(clave, enderezo) cando estea.
export function thumbOf(clip, onReady) {
  const k = keyOf(clip);
  const v = cache.get(k);
  if (typeof v === 'string') return v || null;
  if (!v) {
    const p = chain.then(() => make(clip)).catch(() => '').then((url) => {
      cache.set(k, url);
      if (cache.size > MAX) {
        const [old, oldUrl] = cache.entries().next().value;
        cache.delete(old);
        if (typeof oldUrl === 'string' && oldUrl) URL.revokeObjectURL(oldUrl);
      }
      if (url) onReady(k, url);
    });
    chain = p;
    cache.set(k, p);
  }
  return null;
}
