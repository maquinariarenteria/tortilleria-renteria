import type { Env } from './index';
import type { MachineProduct } from '../types';
import { auditLog, readCatalog, validateCatalog } from './records';
import { HttpError, json, rateLimit, readBytes, readJson } from './security';

const IMAGE_KEY = /^catalog\/[a-f0-9-]{36}\.(jpg|png|webp)$/;
const MACHINE_ID = /^[a-zA-Z0-9_-]{1,100}$/;
export const supabaseConfigured = (env: Env) => !!(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY && env.SUPABASE_MEDIA_BUCKET);

function config(env: Env) {
  if (!supabaseConfigured(env)) throw new HttpError(503, 'La conexión de fotos con Supabase está pendiente.');
  const url = new URL(env.SUPABASE_URL!);
  if (url.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) || url.port || url.username || url.password || !/^[a-z0-9-]{1,63}$/.test(env.SUPABASE_MEDIA_BUCKET!)) throw new HttpError(503, 'Revisa la configuración de fotos en el servidor.');
  return { origin: url.origin, bucket: env.SUPABASE_MEDIA_BUCKET!, key: env.SUPABASE_SECRET_KEY! };
}

async function supabase(env: Env, path: string, options: RequestInit = {}) {
  const { origin, key } = config(env);
  let response: Response;
  try {
    // Workers supports manual/follow, not redirect:error. Treat 3xx as errors below
    // so the server key is never forwarded to a redirected destination.
    response = await fetch(origin + path, { ...options, redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { apikey: key, ...options.headers } });
  } catch { throw new HttpError(503, 'No se pudo conectar con Supabase. Las fotos publicadas se conservan.'); }
  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpError(503, 'Supabase no pudo completar la operación. Revisa el estado del proyecto y vuelve a intentarlo.');
  }
  return response;
}

// Only image assignments are replicated. Customers, payments and prices stay in D1.
export async function savePhotoMappings(env: Env, previous: MachineProduct[], machines: MachineProduct[]) {
  if (!supabaseConfigured(env)) return;
  const before = new Map(previous.map(m => [m.id, m.imageUrl]));
  const changed = machines.filter(m => before.get(m.id) !== m.imageUrl);
  if (!changed.length) return;
  const rows = changed.map(m => {
    const key = m.imageUrl?.startsWith('/media/') ? m.imageUrl.slice('/media/'.length) : null;
    if (key && !IMAGE_KEY.test(key)) throw new HttpError(400, 'La ruta de la foto no es válida.');
    return { machine_id: m.id, object_key: key, updated_at: new Date().toISOString() };
  });
  const response = await supabase(env, '/rest/v1/catalog_photos?on_conflict=machine_id', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
  await response.body?.cancel();
}

export async function mediaStatus(env: Env) {
  const row = await env.DB.prepare("SELECT data_json FROM app_records WHERE kind = 'media-sync' AND id = 'main'").first();
  return { provider: supabaseConfigured(env) ? 'supabase' : env.MEDIA_BUCKET ? 'r2' : 'static', configured: supabaseConfigured(env) || !!env.MEDIA_BUCKET, lastSync: row ? JSON.parse(row.data_json) : null };
}

export async function handleMedia(request: Request, env: Env): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (pathname === '/api/admin/media/status' && request.method === 'GET') return json(await mediaStatus(env));
  if (pathname === '/api/admin/media/sync' && request.method === 'POST') {
    config(env);
    await rateLimit(request, env, 'media-sync', 10, 600);
    await readJson(request, 2000);
    const previous = await readCatalog(env);
    // Query actual photo records, rather than a health endpoint or a keep-alive ping.
    const ids = previous.map((m: MachineProduct) => m.id);
    if (!ids.every((id: string) => MACHINE_ID.test(id))) throw new HttpError(400, 'Catálogo inválido.');
    const query = new URLSearchParams({ select: 'machine_id,object_key', machine_id: `in.(${ids.join(',')})`, limit: '101' });
    const response = await supabase(env, '/rest/v1/catalog_photos?' + query);
    const rows = await response.json() as unknown;
    if (!Array.isArray(rows) || rows.length > 100) throw new HttpError(503, 'El registro de fotos de Supabase no es válido.');
    const photos = new Map<string, string>();
    const seen = new Set<string>();
    for (const row of rows) {
      if (!row || !MACHINE_ID.test(row.machine_id) || seen.has(row.machine_id) || (row.object_key !== null && (typeof row.object_key !== 'string' || !IMAGE_KEY.test(row.object_key)))) throw new HttpError(503, 'Hay una referencia de foto inválida en Supabase. No se modificó el catálogo.');
      seen.add(row.machine_id);
      if (row.object_key) photos.set(row.machine_id, '/media/' + row.object_key);
    }
    let updatedCount = 0;
    const machines = previous.map((m: MachineProduct) => {
      const imageUrl = photos.get(m.id);
      if (!imageUrl || imageUrl === m.imageUrl) return m;
      updatedCount++;
      return { ...m, imageUrl };
    });
    validateCatalog(machines);
    const syncedAt = new Date().toISOString();
    if (updatedCount) {
      // Compare before writing so synchronization cannot overwrite a simultaneous price edit.
      const result = await env.DB.prepare("INSERT INTO app_records(kind,id,data_json,updated_at) VALUES ('catalog','main',?,?) ON CONFLICT(kind,id) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at WHERE app_records.data_json=?").bind(JSON.stringify(machines), syncedAt, JSON.stringify(previous)).run();
      if (!result.meta?.changes) throw new HttpError(409, 'El catálogo cambió durante la sincronización. Vuelve a sincronizar.');
    }
    const lastSync = { syncedAt, photoCount: photos.size, updatedCount };
    await env.DB.prepare("INSERT INTO app_records(kind,id,data_json,updated_at) VALUES ('media-sync','main',?,?) ON CONFLICT(kind,id) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at").bind(JSON.stringify(lastSync), syncedAt).run();
    await auditLog(env, 'images.sync', `${photos.size} photos; ${updatedCount} updated`);
    return json({ success: true, ...lastSync });
  }
  if (pathname === '/api/admin/upload' && request.method === 'POST' && supabaseConfigured(env)) {
    await rateLimit(request, env, 'upload', 10, 600);
    if (Number(request.headers.get('Content-Length') || 0) > 5500000) throw new HttpError(413, 'La imagen supera 5 MB.');
    const bytes = await readBytes(request, 5500000);
    const form = await new Request(request.url, { method: 'POST', headers: request.headers, body: bytes }).formData();
    const file = form.get('file');
    if (!file || typeof file === 'string' || file.size > 5000000 || file.size < 12) throw new HttpError(400, 'Envía una imagen PNG, JPEG o WebP de hasta 5 MB.');
    const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const type = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? 'image/jpeg' :
      [137,80,78,71,13,10,26,10].every((v,i) => b[i] === v) ? 'image/png' :
      new TextDecoder().decode(b.slice(0,4)) === 'RIFF' && new TextDecoder().decode(b.slice(8,12)) === 'WEBP' ? 'image/webp' : '';
    if (!type || file.type !== type) throw new HttpError(415, 'Formato de imagen inválido.');
    const extension = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';
    const key = `catalog/${crypto.randomUUID()}.${extension}`;
    const response = await supabase(env, `/storage/v1/object/${config(env).bucket}/${key}`, { method: 'POST', headers: { 'Content-Type': type, 'Cache-Control': 'max-age=31536000', 'x-upsert': 'false' }, body: file });
    await response.body?.cancel();
    await auditLog(env, 'image.upload', key);
    return json({ success: true, provider: 'supabase', url: '/media/' + key, key });
  }
  if (pathname.startsWith('/media/') && supabaseConfigured(env)) {
    const key = pathname.slice('/media/'.length);
    if (request.method !== 'GET' || !IMAGE_KEY.test(key)) return new Response('Imagen no encontrada', { status: 404 });
    const response = await supabase(env, `/storage/v1/object/authenticated/${config(env).bucket}/${key}`);
    const type = response.headers.get('Content-Type')?.split(';')[0];
    if (!type || !['image/jpeg','image/png','image/webp'].includes(type)) { await response.body?.cancel(); return new Response('Imagen no encontrada', { status: 404 }); }
    return new Response(response.body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', ...(response.headers.get('etag') ? { etag: response.headers.get('etag')! } : {}) } });
  }
  return null;
}
