// Gardar o vídeo: descodifícase fotograma a fotograma, pásase polo mesmo
// compositor ca a vista previa e codifícase a MP4. Todo dentro do navegador.
import {
  Input, Output, BlobSource, ALL_FORMATS, Mp4OutputFormat, BufferTarget,
  CanvasSource, CanvasSink, AudioBufferSource, QUALITY_HIGH, QUALITY_MEDIUM,
  getFirstEncodableVideoCodec, getFirstEncodableAudioCodec,
} from '../vendor/mediabunny.min.mjs';
import { W, H, FPS, duration, trackAt, srcTime, isReverse } from './model.js';
import { frameIndex } from './media.js';
import { draw } from './compositor.js';
import * as overlay from './overlay.js';
import { mixProject } from './audio.js';
import { tErr } from './i18n.js';

const REVERSE_CHUNK = 20;

// Lector de fotogramas dun anaco. stamps = tempos do medio, un por fotograma
// de saída mentres o anaco está en pantalla. next() devolve null para "igual
// ca o anterior".
async function makeReader(clip, stamps, openMedia) {
  const m = clip.media;
  if (m.kind === 'image') {
    let sent = false;
    return { next: async () => (sent ? null : (sent = true, { src: m.el, w: m.w, h: m.h, live: true })), close() {} };
  }
  if (m.kind === 'frames') {
    let k = 0, last = -1;
    return {
      next: async () => {
        const i = frameIndex(m, stamps[k++]);
        if (i === last) return null;
        last = i;
        const f = m.frames[i];
        return { src: f, w: f.width, h: f.height, live: true };
      },
      close() {},
    };
  }

  const { track, first, end } = await openMedia(m);
  const ts = stamps.map((s) => Math.min(first + s, end - 0.001));
  const wrap = (canvas) => (canvas ? { src: canvas, w: W, h: H, live: true } : null);

  if (!isReverse(clip)) {
    const sink = new CanvasSink(track, { width: W, height: H, fit: 'cover', poolSize: 2 });
    const gen = sink.canvasesAtTimestamps(ts);
    return {
      next: async () => { const r = await gen.next(); return wrap(!r.done && r.value ? r.value.canvas : null); },
      close() { gen.return?.(); },
    };
  }

  // Marcha atrás: descodifícase cara adiante en tandas pequenas e sérvese
  // cada tanda do revés. Así é exacto sen descodificar todo de cada vez.
  const sink = new CanvasSink(track, { width: W, height: H, fit: 'cover' });
  let k = 0, buf = [];
  return {
    next: async () => {
      if (!buf.length) {
        const asc = ts.slice(k, k + REVERSE_CHUNK).reverse();
        k += asc.length;
        const got = [];
        for await (const r of sink.canvasesAtTimestamps(asc)) got.push(r ? r.canvas : null);
        buf = got.reverse();
      }
      return wrap(buf.shift());
    },
    close() { buf = []; },
  };
}

// onProgress(fracción de 0 a 1). Devolve { blob, audio, vcodec, frames }.
export async function exportProject(canvas, onProgress) {
  const D = duration();
  const N = Math.max(1, Math.round(D * FPS));
  const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });
  const inputs = new Map();
  const readers = [new Map(), new Map()];

  async function openMedia(m) {
    if (!inputs.has(m.id)) {
      const input = new Input({ source: new BlobSource(m.file), formats: ALL_FORMATS });
      const track = await input.getPrimaryVideoTrack();
      if (!track || !(await track.canDecode())) {
        const hevc = track?.codec === 'hevc';
        input.dispose();
        throw tErr(hevc ? 'err_hevc' : 'err_decode', { name: m.name });
      }
      inputs.set(m.id, { input, track, first: await track.getFirstTimestamp(), end: await track.computeDuration() });
    }
    return inputs.get(m.id);
  }

  try {
    const vcodec = await getFirstEncodableVideoCodec(output.format.getSupportedVideoCodecs(), { width: W, height: H });
    if (!vcodec) throw tErr('err_encode');
    const vsrc = new CanvasSource(canvas, { codec: vcodec, bitrate: QUALITY_HIGH });
    output.addVideoTrack(vsrc, { frameRate: FPS });

    const mixed = await mixProject(D);
    let asrc = null;
    if (mixed) {
      const acodec = await getFirstEncodableAudioCodec(output.format.getSupportedAudioCodecs(),
        { numberOfChannels: 2, sampleRate: mixed.sampleRate });
      if (acodec) {
        asrc = new AudioBufferSource({ codec: acodec, bitrate: QUALITY_MEDIUM });
        output.addAudioTrack(asrc);
      }
    }

    await output.start();
    const audioDone = asrc ? asrc.add(mixed).then(() => asrc.close()) : Promise.resolve();

    for (let i = 0; i < N; i++) {
      const t = i / FPS;
      const layers = [];
      for (let ti = 0; ti < 2; ti++) {
        const a = trackAt(ti, t);
        const layer = { has: !!a, frame: null, fx: a ? a.clip.fx : {} };
        layers.push(layer);
        if (!a || a.hold) continue;
        let r = readers[ti].get(a.clip.id);
        if (!r) {
          for (const old of readers[ti].values()) old.close();
          readers[ti].clear();
          const stamps = [];
          for (let j = i; j < N; j++) {
            const b = trackAt(ti, j / FPS);
            if (!b || b.hold || b.clip !== a.clip) break;
            stamps.push(srcTime(b.clip, b.local));
          }
          r = await makeReader(a.clip, stamps, openMedia);
          readers[ti].set(a.clip.id, r);
        }
        layer.frame = await r.next();
      }
      draw({ layers, overlay: overlay.renderAt(t, false) });
      await vsrc.add(t, 1 / FPS);
      onProgress((i + 1) / N);
    }
    vsrc.close();
    await audioDone;
    await output.finalize();
    return { blob: new Blob([output.target.buffer], { type: 'video/mp4' }), audio: !!asrc, vcodec, frames: N };
  } catch (err) {
    if (output.state === 'started') await output.cancel().catch(() => {});
    throw err;
  } finally {
    readers.forEach((map) => map.forEach((r) => r.close()));
    inputs.forEach(({ input }) => input.dispose());
  }
}
