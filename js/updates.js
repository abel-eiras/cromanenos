// Versións novas. A páxina non pode saír a internet: só lle pregunta ao seu
// propio lanzador (tools/serve.py ou tools/serve.ps1), que é quen consulta cal
// é a última versión e a descarga. Se non hai lanzador, conexión ou permiso,
// aquí non pasa nada nin se amosa ningún erro.
export const RELEASES_URL = 'https://github.com/abel-eiras/cromanenos/releases/latest';

export const info = { version: '', launcher: false, canUpdate: false };

async function call(path, method) {
  const r = await fetch(path, { method, cache: 'no-store' });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

let ready = null;
export function init() {
  ready ??= (async () => {
    try {
      // VERSION existe sempre; a cabeceira di se quen serve é o lanzador.
      // Así non se piden enderezos que noutro servidor darían un 404.
      const r = await fetch('VERSION', { cache: 'no-store' });
      if (r.ok) {
        info.version = (await r.text()).trim().slice(0, 20);
        info.launcher = r.headers.get('X-Cromanenos') === 'launcher';
      }
    } catch { /* sen versión: non pasa nada */ }
    if (info.launcher) {
      try {
        const v = await call('/api/version', 'GET');
        if (v.version) info.version = v.version;
        info.canUpdate = !!v.canUpdate;
      } catch {
        info.launcher = false;
      }
    }
    return info;
  })();
  return ready;
}

// { ok, current, latest, available } ou { ok: false }
export async function check() {
  await init();
  if (!info.launcher) return { ok: false };
  try { return await call('/api/update/check', 'POST'); } catch { return { ok: false }; }
}

// { ok, version } ou { ok: false }
export async function apply() {
  await init();
  if (!info.launcher || !info.canUpdate) return { ok: false };
  try { return await call('/api/update/apply', 'POST'); } catch { return { ok: false }; }
}

// Ao arrancar: se hai versión nova e se pode, instálase en silencio.
// Devolve o número da versión instalada, ou null.
export async function autoUpdate() {
  const c = await check();
  if (!c.ok || !c.available || !info.canUpdate) return null;
  const a = await apply();
  return a.ok ? a.version : null;
}
