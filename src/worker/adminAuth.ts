// Signed, expiring sessions: prefixes alone are not proof of authentication.
import { digest } from './security';
const encoder = new TextEncoder();
export const ADMIN_COOKIE = '__Host-mr_admin';
export function adminToken(request: Request) {
  return request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1] ||
    request.headers.get('Cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith(ADMIN_COOKIE + '='))?.slice(ADMIN_COOKIE.length + 1) || '';
}
async function key(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function createAdminToken(secret: string): Promise<string> {
  const payload = btoa(JSON.stringify({ version: 2, expires: Date.now() + 28800000, nonce: crypto.randomUUID() }));
  const signature = await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload));
  return `${payload}.${Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')}`;
}
export async function verifyAdminToken(request: Request, secret?: string, db?: any): Promise<boolean> {
  if (!secret) return false;
  const token = adminToken(request);
  let claims: any;
  try {
    const [payload, signature, extra] = token.split('.');
    if (extra || !payload || !/^[a-f0-9]{64}$/.test(signature)) return false;
    const valid = await crypto.subtle.verify('HMAC', await key(secret), new Uint8Array(signature.match(/../g)!.map(h => parseInt(h, 16))), encoder.encode(payload));
    claims = JSON.parse(atob(payload));
    if (!valid || !Number.isSafeInteger(claims.expires) || claims.expires <= Date.now()) return false;
  } catch { return false; }
    if (!db) return false;
    const tokenHash = await digest(token);
    let session = await db.prepare('SELECT expires_at, last_seen FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).first();
    // Migrate a still-valid session signed by the previous release. Revoked rows
    // remain as tombstones until the previous 24-hour token lifetime has passed.
    if (!session && claims.version === undefined && typeof claims.nonce === 'string') {
      await db.prepare('INSERT OR IGNORE INTO admin_sessions(token_hash, expires_at, last_seen) VALUES (?, ?, ?)').bind(tokenHash, Math.min(claims.expires, Date.now() + 28800000), Date.now()).run();
      session = await db.prepare('SELECT expires_at, last_seen FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).first();
    }
    if (!session || session.expires_at <= Date.now() || session.last_seen + 1800000 <= Date.now()) return false;
    if (Date.now() - session.last_seen > 60000) await db.prepare('UPDATE admin_sessions SET last_seen = ? WHERE token_hash = ?').bind(Date.now(), tokenHash).run();
    return true;
}
