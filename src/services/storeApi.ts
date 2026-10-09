export async function storeRequest(path: string, options: RequestInit = {}) {
  const legacy = path === '/api/admin/verify' ? localStorage.getItem('mr_admin_cloudflare_token_v2') : null;
  const response = await fetch(path, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(legacy ? { Authorization: `Bearer ${legacy}` } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'No se pudo guardar en el servidor. Intenta nuevamente.'), { status: response.status });
  if (path === '/api/admin/verify') { localStorage.removeItem('mr_admin_cloudflare_token_v2'); localStorage.removeItem('mr_admin_cloudflare_auth_v2'); }
  return data;
}
export const writeRecord = (kind: 'quotes' | 'appointments', record: any) => storeRequest(`/api/admin/records/${kind}/${encodeURIComponent(record.id)}`, { method: 'POST', body: JSON.stringify({ record }) });
export const removeRecord = (kind: 'quotes' | 'appointments', id: string) => storeRequest(`/api/admin/records/${kind}/${encodeURIComponent(id)}`, { method: 'DELETE' });
