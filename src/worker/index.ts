import { handleStripe } from './stripe';
import { ADMIN_COOKIE, adminToken, createAdminToken, verifyAdminToken } from './adminAuth';
import { digest, HttpError, json, rateLimit, readJson, readBytes, withSecurity } from './security';
import { auditLog, handleRecords } from './records';

export interface Env {
  ADMIN_PASSWORD?: string;
  ADMIN_JWT_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SITE_URL?: string;
  DB?: any;
  MEDIA_BUCKET?: any;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

async function dispatch(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/media/')) return env.ASSETS.fetch(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  const origin = request.headers.get('Origin');
  // Webhooks are authenticated by Stripe's signature, independent of browser origin.
  if (pathname !== '/api/stripe/webhook' && origin && origin !== new URL(env.SITE_URL || request.url).origin) throw new HttpError(403, 'Origen inválido.');
  if (request.method !== 'GET' && pathname !== '/api/stripe/webhook' && origin !== new URL(env.SITE_URL || request.url).origin) throw new HttpError(403, 'Origen inválido.');

  if (pathname === '/api/admin/login' && request.method === 'POST') {
    await rateLimit(request, env, 'login', 10, 600);
    const body = await readJson(request, 2000);
    if (!env.ADMIN_PASSWORD) throw new HttpError(503, 'Acceso temporalmente no disponible.');
    if (typeof body.password !== 'string' || body.password.length > 500) throw new HttpError(400, 'Credencial inválida.');
    const provided = await digest(body.password.trim());
    const expected = await digest(env.ADMIN_PASSWORD.trim());
    if (provided !== expected) throw new HttpError(401, 'Clave de acceso incorrecta.');
    const token = await createAdminToken(env.ADMIN_JWT_SECRET || env.ADMIN_PASSWORD);
    const now = Date.now();
    await env.DB.prepare('INSERT INTO admin_sessions(token_hash, expires_at, last_seen) VALUES (?, ?, ?)').bind(await digest(token), now + 28800000, now).run();
    await auditLog(env, 'admin.login', 'administrator');
    const response = json({ success: true, token, expiresIn: 28800 });
    response.headers.set('Set-Cookie', `${ADMIN_COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800`);
    return response;
  }
  if (pathname.startsWith('/api/admin/')) {
    if (!await verifyAdminToken(request, env.ADMIN_JWT_SECRET || env.ADMIN_PASSWORD, env.DB)) throw new HttpError(401, 'Inicia sesión nuevamente.');
    if (pathname === '/api/admin/verify' && request.method === 'GET') {
      const response = json({ valid: true, secretConfigured: !!env.ADMIN_PASSWORD });
      if (request.headers.get('Authorization')?.match(/^Bearer \S+$/)) response.headers.set('Set-Cookie', `${ADMIN_COOKIE}=${adminToken(request)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800`);
      return response;
    }
    if (pathname === '/api/admin/health' && request.method === 'GET') {
      const start = Date.now(); await env.DB.prepare('SELECT 1 AS ok').first();
      return json({ database: true, databaseLatencyMs: Date.now() - start, checkedAt: new Date().toISOString(), stripeMode: /^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY || '') ? 'live' : 'test', r2Configured: !!env.MEDIA_BUCKET, stripeConfigured: !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET) });
    }
    if (pathname === '/api/admin/audit-log' && request.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT id, action, details, timestamp FROM audit_logs ORDER BY id DESC LIMIT 100').all();
      return json({ logs: results });
    }
    if (pathname === '/api/admin/logout' && request.method === 'POST') {
      await env.DB.prepare('UPDATE admin_sessions SET expires_at = ? WHERE token_hash = ?').bind(Date.now() - 1, await digest(adminToken(request))).run();
      const response = json({ success: true });
      response.headers.set('Set-Cookie', `${ADMIN_COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`);
      return response;
    }
  }
  if (pathname === '/api/stripe/create-checkout-session') await rateLimit(request, env, 'checkout', 10, 600);
  if (pathname.startsWith('/api/notify/')) await rateLimit(request, env, 'contact', 10, 600);
  const records = await handleRecords(request, env);
  if (records) return records;
  const stripe = await handleStripe(request, env);
  if (stripe) return stripe;

  if (pathname === '/api/admin/upload' && request.method === 'POST') {
    if (!env.MEDIA_BUCKET) throw new HttpError(503, 'El almacenamiento de imágenes aún no está configurado.');
    await rateLimit(request, env, 'upload', 10, 600);
    if (Number(request.headers.get('Content-Length') || 0) > 5500000) throw new HttpError(413, 'La imagen supera 5 MB.');
    const bytes = await readBytes(request, 5500000);
    const form = await new Request(request.url, { method: 'POST', headers: request.headers, body: bytes }).formData(); const file = form.get('file');
    if (!file || typeof file === 'string' || file.size > 5000000 || file.size < 12) throw new HttpError(400, 'Envía una imagen PNG, JPEG o WebP de hasta 5 MB.');
    const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const type = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? 'image/jpeg' :
      [137,80,78,71,13,10,26,10].every((v,i) => b[i] === v) ? 'image/png' :
      new TextDecoder().decode(b.slice(0,4)) === 'RIFF' && new TextDecoder().decode(b.slice(8,12)) === 'WEBP' ? 'image/webp' : '';
    if (!type || file.type !== type) throw new HttpError(415, 'Formato de imagen inválido.');
    const extension = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';
    const key = `catalog/${crypto.randomUUID()}.${extension}`;
    await env.MEDIA_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: type } });
    await auditLog(env, 'image.upload', key); return json({ success: true, url: '/media/' + key, key });
  }
  if (pathname.startsWith('/media/')) {
    if (request.method !== 'GET' || !/^\/media\/catalog\/[a-f0-9-]+\.(png|jpg|webp)$/.test(pathname) || !env.MEDIA_BUCKET) return new Response('Imagen no encontrada', { status: 404 });
    const object = await env.MEDIA_BUCKET.get(pathname.slice('/media/'.length));
    if (!object) return new Response('Imagen no encontrada', { status: 404 });
    const headers = new Headers(); object.writeHttpMetadata(headers); headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); return new Response(object.body, { headers });
  }
  if (pathname === '/api/admin/send-test-report') throw new HttpError(503, 'El envío de reportes por correo todavía no está configurado. Las solicitudes se consultan en el administrador.');
  if (pathname === '/api/admin/cleanup' && request.method === 'POST') {
    // Only expired security state; business records and the audit trail are retained.
    const a = await env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').bind(Date.now() - 86400000).run();
    const b = await env.DB.prepare('DELETE FROM request_limits WHERE expires_at < ?').bind(Date.now()).run();
    return json({ success: true, deletedRows: (a.meta?.changes || 0) + (b.meta?.changes || 0), freedKB: 0, message: 'Sesiones y límites vencidos eliminados. Los pedidos y registros de auditoría se conservan.' });
  }
  if (pathname === '/api/admin/limits' && request.method === 'GET') return json({ source: 'configuration', measured: false, d1Configured: !!env.DB, r2Configured: !!env.MEDIA_BUCKET, message: 'Consulta el consumo real y el plan en Cloudflare.' });
  return json({ error: 'Ruta no disponible.' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const response = await dispatch(request, env);
      const pathname = new URL(request.url).pathname;
      return pathname.startsWith('/api/') ? withSecurity(response) : response;
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 503;
      console.error('Worker request failed:', error instanceof HttpError ? `HTTP ${status}` : 'ServiceError');
      return withSecurity(json({ success: false, error: error instanceof HttpError ? error.message : 'Servicio temporalmente no disponible. Intenta nuevamente.' }, status));
    }
  },
};
