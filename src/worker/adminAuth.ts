// Signed, expiring sessions: prefixes alone are not proof of authentication.
const encoder = new TextEncoder();
async function key(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function createAdminToken(secret: string): Promise<string> {
  const payload = btoa(JSON.stringify({ expires: Date.now() + 86400000, nonce: crypto.randomUUID() }));
  const signature = await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload));
  return `${payload}.${Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')}`;
}
export async function verifyAdminToken(request: Request, secret?: string): Promise<boolean> {
  if (!secret) return false;
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') || '';
    const [payload, signature, extra] = token.split('.');
    if (extra || !payload || !/^[a-f0-9]{64}$/.test(signature)) return false;
    const valid = await crypto.subtle.verify('HMAC', await key(secret), new Uint8Array(signature.match(/../g)!.map(h => parseInt(h, 16))), encoder.encode(payload));
    return valid && JSON.parse(atob(payload)).expires > Date.now();
  } catch { return false; }
}
