import type { Env } from './index';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export async function digest(text: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), b => b.toString(16).padStart(2, '0')).join('');
}
export async function rateLimit(request: Request, env: Env, scope: string, limit: number, seconds: number) {
  if (!env.DB) throw new HttpError(503, 'Servicio temporalmente no disponible.');
  // CF-Connecting-IP is supplied by Cloudflare, not trusted from browser JSON.
  const key = await digest(`${env.ADMIN_PASSWORD || ''}:${scope}:${request.headers.get('CF-Connecting-IP') || 'local'}`);
  const now = Date.now();
  const row = await env.DB.prepare(`INSERT INTO request_limits(key, hits, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET hits = CASE WHEN expires_at <= ? THEN 1 ELSE hits + 1 END,
    expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END RETURNING hits`)
    .bind(key, now + seconds * 1000, now, now).first();
  if (!row || row.hits > limit) throw new HttpError(429, 'Demasiados intentos. Espera unos minutos antes de volver a intentar.');
}
export async function readBytes(request: Request, max = 60000): Promise<Uint8Array> {
  if (Number(request.headers.get('Content-Length') || 0) > max) throw new HttpError(413, 'Solicitud demasiado grande.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Solicitud vacía.');
  const chunks: Uint8Array[] = []; let bytes = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength;
    if (bytes > max) { await reader.cancel(); throw new HttpError(413, 'Solicitud demasiado grande.'); } chunks.push(value); }
  const data = new Uint8Array(bytes); let offset = 0; for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  return data;
}
export async function readJson(request: Request, max = 60000): Promise<any> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Se requiere JSON.');
  const bytes = await readBytes(request, max);
  try { const value = JSON.parse(new TextDecoder().decode(bytes)); if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(); return value; }
  catch { throw new HttpError(400, 'Solicitud inválida.'); }
}
export function withSecurity(response: Response) {
  const out = new Response(response.body, response);
  out.headers.set('Cache-Control', 'no-store');
  out.headers.set('Referrer-Policy', 'no-referrer');
  out.headers.set('X-Content-Type-Options', 'nosniff');
  out.headers.set('X-Frame-Options', 'DENY');
  out.headers.set('Strict-Transport-Security', 'max-age=31536000');
  out.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), usb=()');
  out.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  if (out.status === 429) out.headers.set('Retry-After', '600');
  return out;
}
