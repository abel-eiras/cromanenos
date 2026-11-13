// Mestura as dúas pistas (cada unha cos efectos do seu anaco) e os adhesivos
// nun canvas WebGL. Úsase igual para a vista previa e para gardar o vídeo.
import { W, H } from './model.js';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
varying vec2 vUv;

struct Layer {
  float has;
  vec2 scale;      // encher o cadro recortando o que sobre
  float mir;       // espello
  float zoom;      // tamaño
  vec2 pos;        // posición
  float opacity;   // pantasma
  float chroma, tol, soft, spill;
  vec3 key;
  float splitOn, split, splitSoft;
  float tint;
};
uniform sampler2D uT0, uT1, uO;
uniform Layer uL0, uL1;
uniform float uHasO;

// Compárase só o ton (Cb/Cr), non o brillo: así as sombras e as engurras
// dun calcetín verde seguen contando como "verde".
vec2 tone(vec3 c) {
  return vec2(-0.1687 * c.r - 0.3313 * c.g + 0.5 * c.b,
               0.5 * c.r - 0.4187 * c.g - 0.0813 * c.b);
}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec3 applyFilter(vec3 c, float f) {
  if (f < 0.5) return c;
  if (f < 1.5) return vec3(luma(c));
  if (f < 2.5) return vec3(dot(c, vec3(0.393, 0.769, 0.189)), dot(c, vec3(0.349, 0.686, 0.168)), dot(c, vec3(0.272, 0.534, 0.131)));
  if (f < 3.5) return 1.0 - c;
  c = mix(vec3(luma(c)), c, 1.5);
  return floor(clamp(c, 0.0, 1.0) * 4.0 + 0.5) / 4.0;
}

// Cor e opacidade dunha pista neste píxel.
vec4 layer(sampler2D tex, Layer p) {
  if (p.has < 0.5) return vec4(0.0);
  vec2 q = (vUv - 0.5 - p.pos) / p.zoom + 0.5;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return vec4(0.0);
  if (p.mir > 0.5) q.x = 1.0 - q.x;
  vec3 b = texture2D(tex, (q - 0.5) * p.scale + 0.5).rgb;
  float alpha = p.opacity;
  if (p.chroma > 0.5) {
    float d = distance(tone(b), tone(p.key));
    alpha *= smoothstep(p.tol, p.tol + p.soft, d);
    // Quita o reflexo de cor que queda nos bordos.
    float near = 1.0 - smoothstep(p.tol + p.soft, p.tol + p.soft + 0.15, d);
    if (p.spill > 0.5 && p.spill < 1.5) b.g = mix(b.g, min(b.g, max(b.r, b.b)), near);
    else if (p.spill > 1.5) b.b = mix(b.b, min(b.b, max(b.r, b.g)), near);
  }
  if (p.splitOn > 0.5) {
    alpha *= smoothstep(p.split - p.splitSoft - 0.0005, p.split + p.splitSoft + 0.0005, vUv.x);
  }
  return vec4(applyFilter(b, p.tint), alpha);
}

void main() {
  vec3 c = vec3(0.0);
  vec4 a = layer(uT0, uL0);
  c = mix(c, a.rgb, a.a);
  vec4 b = layer(uT1, uL1);
  c = mix(c, b.rgb, b.a);
  if (uHasO > 0.5) {
    vec4 o = texture2D(uO, vUv);
    c = mix(c, o.rgb, o.a);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

const FILTERS = { bw: 1, sepia: 2, neg: 3, comic: 4 };
const FIELDS = ['has', 'scale', 'mir', 'zoom', 'pos', 'opacity', 'chroma', 'tol', 'soft', 'spill', 'key',
  'splitOn', 'split', 'splitSoft', 'tint'];

let gl;
const U = { L: [{}, {}] };
let textures = [];
const scales = [[1, 1], [1, 1]];
let lastSrc = [null, null];
let overlayVersion = -1;

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export function initCompositor(canvas) {
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: false });
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.viewport(0, 0, W, H);

  for (let i = 0; i < 2; i++) for (const f of FIELDS) U.L[i][f] = gl.getUniformLocation(prog, `uL${i}.${f}`);
  U.hasO = gl.getUniformLocation(prog, 'uHasO');
  textures = [0, 1, 2].map((unit) => {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    return tex;
  });
  gl.uniform1i(gl.getUniformLocation(prog, 'uT0'), 0);
  gl.uniform1i(gl.getUniformLocation(prog, 'uT1'), 1);
  gl.uniform1i(gl.getUniformLocation(prog, 'uO'), 2);
}

function coverScale(w, h) {
  const sa = w / h, oa = W / H;
  return sa > oa ? [oa / sa, 1] : [1, sa / oa];
}

function upload(unit, source) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, textures[unit]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

// Obriga a volver subir as texturas (por exemplo despois de gardar).
export function invalidate() { lastSrc = [null, null]; overlayVersion = -1; }

function setLayer(i, has, fx) {
  const u = U.L[i];
  const key = fx.chroma?.key ?? [0, 1, 0];
  const spill = key[1] > key[0] && key[1] > key[2] ? 1 : (key[2] > key[0] && key[2] > key[1] ? 2 : 0);
  gl.uniform1f(u.has, has ? 1 : 0);
  gl.uniform2fv(u.scale, scales[i]);
  gl.uniform1f(u.mir, fx.mirror ? 1 : 0);
  gl.uniform1f(u.zoom, fx.size?.zoom ?? 1);
  gl.uniform2f(u.pos, fx.size?.x ?? 0, -(fx.size?.y ?? 0));
  gl.uniform1f(u.opacity, fx.ghost?.opacity ?? 1);
  gl.uniform1f(u.chroma, fx.chroma ? 1 : 0);
  gl.uniform1f(u.tol, fx.chroma?.tol ?? 0.1);
  gl.uniform1f(u.soft, fx.chroma?.soft ?? 0.05);
  gl.uniform1f(u.spill, spill);
  gl.uniform3fv(u.key, key);
  gl.uniform1f(u.splitOn, fx.split ? 1 : 0);
  gl.uniform1f(u.split, fx.split?.pos ?? 0.5);
  gl.uniform1f(u.splitSoft, fx.split?.soft ?? 0.01);
  gl.uniform1f(u.tint, FILTERS[fx.filter?.name] ?? 0);
}

// scene = {
//   layers: [l0, l1]   l = { has, frame, fx }
//       frame = { src, w, h, live } ou null para manter a textura anterior
//       fx    = clip.fx do anaco que toca (ou {} )
//   overlay: { canvas, version, visible }
// }
export function draw(scene) {
  scene.layers.forEach((l, i) => {
    const f = l.frame;
    if (f) {
      if (f.live || lastSrc[i] !== f.src) { upload(i, f.src); lastSrc[i] = f.src; }
      scales[i] = coverScale(f.w, f.h);
    }
    setLayer(i, l.has, l.fx || {});
  });
  const ov = scene.overlay;
  const showO = !!(ov && ov.visible);
  if (showO && ov.version !== overlayVersion) { upload(2, ov.canvas); overlayVersion = ov.version; }
  gl.uniform1f(U.hasO, showO ? 1 : 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Cor media dunha zona pequena do canvas (para o contagotas). x, y en píxeles
// do cadro, coa orixe arriba á esquerda.
export function readColor(x, y, n = 7) {
  const x0 = Math.max(0, Math.min(W - n, Math.round(x) - (n >> 1)));
  const y0 = Math.max(0, Math.min(H - n, Math.round(y) - (n >> 1)));
  const buf = new Uint8Array(n * n * 4);
  gl.readPixels(x0, H - y0 - n, n, n, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  const sum = [0, 0, 0];
  for (let p = 0; p < buf.length; p += 4) { sum[0] += buf[p]; sum[1] += buf[p + 1]; sum[2] += buf[p + 2]; }
  return sum.map((v) => v / (n * n) / 255);
}
