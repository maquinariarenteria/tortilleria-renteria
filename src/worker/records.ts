import type { Env } from './index';
import { MACHINES_DATA } from '../data/machines';
import { digest, HttpError, json, readJson } from './security';

function str(value: unknown, required = false, max = 500) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new HttpError(400, 'Revisa los datos del formulario.');
  return value.trim();
}
function customer(data: any) {
  str(data.customerName, true, 120);
  if (!/^\+?[\d ()-]{10,25}$/.test(str(data.phone, true, 25)) || !/^\d{10,15}$/.test(data.phone.replace(/\D/g, ''))) throw new HttpError(400, 'Teléfono inválido.');
  const email = str(data.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Correo inválido.');
}
export function validateRecord(kind: string, value: any) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Registro inválido.');
  if (kind === 'quotes') {
    customer(value);
    const allowed = ['Nueva', 'Contactada', 'En Negociación', 'Cerrada', 'Descartada'];
    if (!allowed.includes(value.status)) throw new HttpError(400, 'Estado inválido.');
    if (!Array.isArray(value.items) || value.items.length > 30 || !Number.isFinite(value.estimatedTotal) || value.estimatedTotal < 0) throw new HttpError(400, 'Cotización inválida.');
    for (const item of value.items) {
      if (!item || typeof item !== 'object' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new HttpError(400, 'Artículo inválido.');
      str(item.machineId); str(item.name, true);
      if (item.price !== undefined && (!Number.isFinite(item.price) || item.price < 0)) throw new HttpError(400, 'Precio inválido.');
    }
    str(value.notes, false, 5000); str(value.stateOrCity);
  } else if (kind === 'appointments') {
    customer(value);
    const date = str(value.scheduledDate, true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.scheduledTime)) throw new HttpError(400, 'Fecha u hora inválida.');
    if (!['Pendiente', 'Confirmada', 'Realizada', 'Cancelada'].includes(value.status)) throw new HttpError(400, 'Estado inválido.');
    str(value.notes, false, 5000);
  } else throw new HttpError(400, 'Registro no permitido.');
  return value;
}
export function validateCatalog(machines: any) {
  if (!Array.isArray(machines) || machines.length < 1 || machines.length > 100) throw new HttpError(400, 'Catálogo inválido.');
  const ids = new Set();
  for (const m of machines) {
    if (!m || typeof m !== 'object' || !/^[a-zA-Z0-9_-]{1,100}$/.test(m.id) || ids.has(m.id)) throw new HttpError(400, 'Identificador de máquina inválido.');
    ids.add(m.id); str(m.name, true); str(m.sku, true);
    for (const field of ['priceMXN', 'priceUSD']) if (!Number.isFinite(m[field]) || m[field] <= 0 || m[field] * 100 > 99999999) throw new HttpError(400, 'Precio inválido.');
    for (const field of ['shortDescription', 'fullDescription', 'diameterRange', 'energyType', 'motorPowerHP', 'dimensionsMeters']) str(m[field], true, 5000);
    for (const field of ['capacityPerHour', 'weightKg', 'warrantyYears']) if (!Number.isFinite(m[field]) || m[field] < 0) throw new HttpError(400, 'Especificación inválida.');
    if (!['prensas','hornos','lineas-completas','amasadoras-boleadoras','comales-rotativos','enfriadores'].includes(m.category) || !['press','line','oven','mixer','rotary','cooler'].includes(m.modelType)) throw new HttpError(400, 'Categoría o modelo inválido.');
    if (!Array.isArray(m.features) || m.features.length > 100 || !Array.isArray(m.specs) || m.specs.length > 100) throw new HttpError(400, 'Especificaciones inválidas.');
    m.features.forEach((v: unknown) => str(v, true, 1000)); m.specs.forEach((v: any) => { str(v.label, true); str(v.value, true, 1000); });
    if (m.imageUrl && typeof m.imageUrl !== 'string') throw new HttpError(400, 'Imagen inválida.');
    if (m.imageUrl && !(m.imageUrl.startsWith('/images/') || m.imageUrl.startsWith('/media/catalog/') || /^https:\/\//.test(m.imageUrl))) throw new HttpError(400, 'Imagen inválida.');
    if (m.variants) {
      if (!Array.isArray(m.variants) || m.variants.length > 20) throw new HttpError(400, 'Variantes inválidas.');
      const variantIds = new Set();
      for (const v of m.variants) {
        if (!v || typeof v !== 'object' || !/^[a-zA-Z0-9_-]{1,100}$/.test(v.id) || variantIds.has(v.id)) throw new HttpError(400, 'Variante inválida.');
        variantIds.add(v.id); str(v.name, true);
        for (const f of ['fixedPriceMXN', 'fixedPriceUSD', 'extraPriceMXN', 'extraPriceUSD']) if (v[f] !== undefined && (!Number.isFinite(v[f]) || v[f] < 0)) throw new HttpError(400, 'Precio de variante inválido.');
      }
    }
  }
  return machines;
}
export async function readCatalog(env: Env) {
  const row = await env.DB.prepare("SELECT data_json FROM app_records WHERE kind = 'catalog' AND id = 'main' AND deleted_at IS NULL").first();
  return row ? JSON.parse(row.data_json) : MACHINES_DATA;
}
export async function auditLog(env: Env, action: string, id: string) {
  await env.DB.prepare('INSERT INTO audit_logs(action, details, timestamp) VALUES (?, ?, ?)').bind(action, id.slice(0, 150), new Date().toISOString()).run();
}
export async function handleRecords(request: Request, env: Env): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (pathname === '/api/catalog' && request.method === 'GET') return json({ machines: await readCatalog(env) });
  if (pathname === '/api/site-config' && request.method === 'GET') {
    const row = await env.DB.prepare("SELECT data_json FROM app_records WHERE kind = 'config' AND id = 'main'").first();
    return json({ config: row ? JSON.parse(row.data_json) : {} });
  }
  if (pathname === '/api/admin/site-config' && request.method === 'POST') {
    const body = await readJson(request);
    const config: Record<string, string> = {};
    for (const key of ['businessName', 'slogan', 'experienceYears', 'phone1', 'phone2', 'email', 'address', 'facebookUrl', 'tiktokUrl', 'stripePaymentLink', 'shippingNotice']) if (body[key] !== undefined) config[key] = str(body[key], false, 1000);
    for (const key of ['facebookUrl', 'tiktokUrl', 'stripePaymentLink']) if (config[key] && !/^https:\/\//.test(config[key])) throw new HttpError(400, 'Enlace inválido.');
    await env.DB.prepare("INSERT INTO app_records(kind, id, data_json, updated_at) VALUES ('config', 'main', ?, ?) ON CONFLICT(kind,id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at").bind(JSON.stringify(config), new Date().toISOString()).run();
    await auditLog(env, 'site-config.update', 'main'); return json({ success: true, config });
  }
  if (pathname === '/api/admin/machines' && request.method === 'POST') {
    const body = await readJson(request, 300000); const machines = validateCatalog(body.machines);
    await env.DB.prepare("INSERT INTO app_records(kind, id, data_json, updated_at) VALUES ('catalog', 'main', ?, ?) ON CONFLICT(kind,id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at").bind(JSON.stringify(machines), new Date().toISOString()).run();
    await auditLog(env, 'catalog.update', 'main'); return json({ success: true, count: machines.length });
  }
  if (pathname.startsWith('/api/notify/')) {
    if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
    const body = await readJson(request, 20000);
    const type = pathname.slice('/api/notify/'.length);
    if (!['quote', 'appointment'].includes(type)) return json({ error: 'Ruta no disponible.' }, 404);
    const kind = type === 'quote' ? 'quotes' : 'appointments';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId || '')) throw new HttpError(400, 'Referencia inválida.');
    const record = validateRecord(kind, body.record);
    const id = body.requestId;
    // Public callers cannot choose administrative status, permissions, or payment state.
    const clean = kind === 'quotes' ? {
      id, folio: `COT-${id}`, customerName: str(record.customerName, true), phone: str(record.phone, true), email: str(record.email),
      createdAt: new Date().toISOString(), stateOrCity: str(record.stateOrCity), businessType: 'Otro', items: record.items.map((i: any) => ({ machineId: str(i.machineId), name: str(i.name, true), quantity: Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 20 ? i.quantity : 1, price: 0 })),
      estimatedTotal: 0, status: 'Nueva', priority: 'Alta', notes: str(record.notes, false, 5000),
    } : {
      id, customerName: str(record.customerName, true), phone: str(record.phone, true), email: str(record.email),
      type: str(record.type), machineOfInterest: str(record.machineOfInterest), scheduledDate: record.scheduledDate, scheduledTime: record.scheduledTime,
      status: 'Pendiente', notes: str(record.notes, false, 5000), reminderSent: false,
    };
    const { createdAt: _createdAt, ...input } = clean as any;
    const hash = await digest(JSON.stringify(input));
    await env.DB.prepare('INSERT INTO app_records(kind,id,data_json,updated_at,request_hash) VALUES (?,?,?,?,?) ON CONFLICT(kind,id) DO NOTHING').bind(kind, id, JSON.stringify(clean), new Date().toISOString(), hash).run();
    const stored = await env.DB.prepare('SELECT data_json, request_hash FROM app_records WHERE kind = ? AND id = ? AND deleted_at IS NULL').bind(kind, id).first();
    if (!stored || stored.request_hash !== hash) throw new HttpError(409, 'La referencia ya fue utilizada. Envía una solicitud nueva.');
    return json({ success: true, record: JSON.parse(stored.data_json), notification: 'admin', emailSent: false });
  }
  const match = pathname.match(/^\/api\/admin\/records\/(quotes|appointments)(?:\/([a-zA-Z0-9_-]{1,100}))?$/);
  if (match) {
    const [, kind, id] = match;
    if (request.method === 'GET' && !id) {
      const { results } = await env.DB.prepare('SELECT data_json FROM app_records WHERE kind = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 500').bind(kind).all();
      return json({ records: results.map((r: any) => JSON.parse(r.data_json)) });
    }
    if (request.method === 'POST' && id) {
      const record = validateRecord(kind, (await readJson(request)).record); record.id = id;
      await env.DB.prepare('INSERT INTO app_records(kind,id,data_json,updated_at) VALUES (?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at').bind(kind, id, JSON.stringify(record), new Date().toISOString()).run();
      await auditLog(env, `${kind}.update`, id); return json({ success: true });
    }
    if (request.method === 'DELETE' && id) {
      await env.DB.prepare('UPDATE app_records SET deleted_at = ? WHERE kind = ? AND id = ?').bind(new Date().toISOString(), kind, id).run();
      await auditLog(env, `${kind}.soft-delete`, id); return json({ success: true });
    }
    return json({ error: 'Método no permitido.' }, 405);
  }
  return null;
}
