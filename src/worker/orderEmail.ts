import type { Env } from './index';
import type { AdminSaleOrder } from '../types/admin';
import { HttpError, json, rateLimit } from './security';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const emailAddress = (value: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);

function configuration(env: Env) {
  const recipient = (env.ORDER_NOTIFICATION_TO || '').trim();
  const routingConfigured = emailAddress(recipient) && !!env.SITE_URL;
  return { configured: env.ORDER_NOTIFICATION_ENABLED === 'true' && routingConfigured, routingConfigured, recipient };
}

export function orderEmailConfigured(env: Env) { return configuration(env).configured; }
export function orderEmailRoutingConfigured(env: Env) { return configuration(env).routingConfigured; }

export function createOrderEmail(order: AdminSaleOrder, env: Env, payment: { paidAt: string; sessionId: string; paymentIntentId?: string; amountPaid: number; test: boolean }) {
  const amount = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: order.currency }).format(n) + ` ${order.currency}`;
  const heading = payment.test ? 'COMPRA DE PRUEBA — NO ES UN COBRO REAL' : 'COMPRA PAGADA AL 100%';
  const lines = [heading, '', `Folio: ${order.folio}`, `Pedido creado: ${order.createdAt}`, `Pago confirmado: ${payment.paidAt}`,
    '', 'CLIENTE', `Nombre: ${order.clientName}`, `Teléfono: ${order.clientPhone}`, `Correo: ${order.clientEmail}`,
    '', 'ENTREGA', `Dirección: ${order.shippingAddress}`, `Ciudad: ${order.shippingCity}`, `Estado: ${order.shippingState}`,
    `Código postal: ${order.shippingZip || 'Por coordinar'}`, '', 'EQUIPOS',
    ...order.items.flatMap(item => [`${item.name}`, `SKU: ${item.sku} · Cantidad: ${item.quantity}`, `Precio unitario: ${amount(item.unitPrice)} · Importe: ${amount(item.total)}`, '']),
    'IMPORTES', `Subtotal: ${amount(order.subtotal)}`, `IVA: ${amount(order.iva)}`, `Total de equipos: ${amount(order.total)}`,
    `Pagado: ${amount(payment.amountPaid)}`, `Saldo de equipos: ${amount(Math.max(0, order.total - payment.amountPaid))}`,
    'Flete aparte: costo y fecha de entrega por coordinar con el cliente.',
    '', 'FACTURACIÓN', `Solicita factura: ${order.requiresInvoice ? 'Sí' : 'No'}`,
    ...(order.requiresInvoice ? [`RFC: ${order.rfc || 'Por confirmar'}`, `Razón social: ${order.businessName || order.clientName}`] : []),
    'Este aviso no sustituye un CFDI.', '', 'REFERENCIAS DEL PAGO', 'Método: Stripe', `Sesión: ${payment.sessionId}`,
    ...(payment.paymentIntentId ? [`Pago Stripe: ${payment.paymentIntentId}`] : []),
    '', 'El pedido también está registrado en el administrador.', `${new URL(env.SITE_URL!).origin}/#admin`];
  const text = lines.join('\n');
  return { recipient: configuration(env).recipient, subject: `${payment.test ? '[PRUEBA] ' : ''}Compra pagada · ${order.folio}`,
    text, html: `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#172033"><h1 style="font-size:22px;color:#2563eb">Maquinaria Rentería</h1><pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(text)}</pre></div>`,
    fields: { name: order.clientName, email: order.clientEmail, Telefono: order.clientPhone, Folio: order.folio,
      Estado_del_pago: heading, Direccion: order.shippingAddress, Ciudad: order.shippingCity,
      Estado: order.shippingState, Codigo_postal: order.shippingZip || 'Por coordinar',
      Equipos: order.items.map(item => `${item.name} · SKU ${item.sku} · ${item.quantity} x ${amount(item.unitPrice)} = ${amount(item.total)}`).join('\n'),
      Subtotal: amount(order.subtotal), IVA: amount(order.iva), Total: amount(order.total), Pagado: amount(payment.amountPaid),
      Factura: order.requiresInvoice ? 'Sí' : 'No', RFC: order.requiresInvoice ? order.rfc || 'Por confirmar' : 'No solicitado',
      Razon_social: order.requiresInvoice ? order.businessName || order.clientName : 'No solicitado' } };
}

async function sendEmail(env: Env, payload: { recipient?: string; subject: string; text: string; fields?: object }) {
  const recipient = payload.recipient || configuration(env).recipient;
  if (!emailAddress(recipient)) throw new Error('invalid_notification_recipient');
  const origin = new URL(env.SITE_URL!).origin;
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, { method: 'POST', headers: {
    'Content-Type': 'application/json', Accept: 'application/json',
    Origin: origin, Referer: `${origin}/`, 'User-Agent': 'MaquinariaRenteriaOrderNotifications/1.0',
  }, body: JSON.stringify({ ...payload.fields, _subject: payload.subject, message: payload.text,
    _template: 'table', _captcha: 'false', _honey: '', _url: `${new URL(env.SITE_URL!).origin}/` }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw Object.assign(new Error(`formsubmit_http_${response.status}`), { status: response.status,
    confirmedRejection: response.status >= 400 && response.status < 500 });
  const data: any = await response.json();
  // The provider retains submissions until the recipient activates the form.
  // It returns success:false for this state even though it has queued the notice.
  const activationRequired = typeof data.message === 'string' && /\bneeds\s+activation\b/i.test(data.message);
  if (activationRequired) return { activationRequired: true };
  if (data.success !== true && data.success !== 'true') throw Object.assign(new Error('formsubmit_rejected'), { confirmedRejection: true });
  return { activationRequired: false };
}

export async function sendPendingOrderEmail(env: Env, orderId: string) {
  if (!orderEmailConfigured(env)) return;
  const now = Date.now();
  // FormSubmit has no documented idempotency key. An interrupted attempt must be
  // reviewed, rather than silently re-sent and potentially delivered twice.
  await env.DB.prepare("UPDATE order_email_notifications SET status='blocked', last_error='email_delivery_uncertain', locked_until=0 WHERE order_id=? AND status='sending' AND locked_until<=?")
    .bind(orderId, now).run();
  const lockToken = crypto.randomUUID();
  const claimed = await env.DB.prepare("UPDATE order_email_notifications SET status='sending', attempts=attempts+1, first_attempt_at=?, locked_until=?, lock_token=? WHERE order_id=? AND status='pending' AND next_attempt_at<=? AND locked_until<=?")
    .bind(now, now + 180000, lockToken, orderId, now, now).run();
  if (!claimed.meta?.changes) return;
  const row = await env.DB.prepare("SELECT n.*, o.order_json, o.amount_due, o.paid_at, o.session_id FROM order_email_notifications n JOIN stripe_orders o ON o.id=n.order_id WHERE n.order_id=? AND n.lock_token=? AND o.payment_status='paid'")
    .bind(orderId, lockToken).first();
  if (!row) return;
  let requestStarted = false;
  try {
    const payload = row.payload_json ? JSON.parse(row.payload_json) : createOrderEmail(JSON.parse(row.order_snapshot_json), env,
      { paidAt: row.paid_at, sessionId: row.session_id, paymentIntentId: row.payment_intent_id || undefined, amountPaid: row.amount_due / 100, test: row.is_test === 1 });
    // Persist the complete notice before transmitting it.
    await env.DB.prepare('UPDATE order_email_notifications SET payload_json=COALESCE(payload_json,?) WHERE order_id=? AND lock_token=?')
      .bind(JSON.stringify(payload), orderId, lockToken).run();
    requestStarted = true;
    const result = await sendEmail(env, payload);
    await env.DB.prepare("UPDATE order_email_notifications SET status='sent', sent_at=?, last_error=?, locked_until=0 WHERE order_id=? AND lock_token=?")
      .bind(new Date().toISOString(), result.activationRequired ? 'activation_required' : null, orderId, lockToken).run();
  } catch (error) {
    const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0;
    const rejected = error && typeof error === 'object' && 'confirmedRejection' in error && error.confirmedRejection;
    const permanent = requestStarted && (!rejected || status !== 429);
    const code = status ? `formsubmit_http_${status}` : requestStarted ? (rejected ? 'formsubmit_rejected' : 'email_delivery_uncertain') : 'email_prepare_failed';
    const backoff = Math.min(6 * 3600000, 5 * 60000 * 3 ** Math.min(row.attempts - 1, 5));
    await env.DB.prepare('UPDATE order_email_notifications SET status=?, next_attempt_at=?, locked_until=0, last_error=? WHERE order_id=? AND lock_token=?')
      .bind(permanent ? 'blocked' : 'pending', now + backoff, code, orderId, lockToken).run();
    console.error('Order notification pending:', code); // No customer data or provider response body in logs.
  }
}

export async function processPendingOrderEmails(env: Env) {
  if (!env.DB || !orderEmailConfigured(env)) return;
  const { results } = await env.DB.prepare("SELECT order_id FROM order_email_notifications WHERE status IN ('pending','sending') AND next_attempt_at<=? AND locked_until<=? ORDER BY created_at LIMIT 8")
    .bind(Date.now(), Date.now()).all();
  for (const row of results) {
    try { await sendPendingOrderEmail(env, row.order_id); }
    catch { console.error('Order notification retry failed'); }
  }
}

export async function orderEmailHealth(env: Env) {
  const { results } = await env.DB.prepare('SELECT status, COUNT(*) AS count FROM order_email_notifications GROUP BY status').all();
  const counts = Object.fromEntries(results.map((r: any) => [r.status, r.count]));
  const activation = await env.DB.prepare("SELECT COUNT(*) AS count FROM order_email_notifications WHERE status='sent' AND last_error='activation_required'").first();
  return { configured: orderEmailConfigured(env), provider: 'FormSubmit', pending: (counts.pending || 0) + (counts.sending || 0), sent: (counts.sent || 0) - (activation?.count || 0), activationPending: activation?.count || 0, blocked: counts.blocked || 0 };
}

export async function handleOrderEmail(request: Request, env: Env): Promise<Response | null> {
  if (new URL(request.url).pathname !== '/api/admin/order-notifications/test') return null;
  if (request.method !== 'POST') throw new HttpError(405, 'Método no disponible.');
  if (!orderEmailConfigured(env)) throw new HttpError(503, 'Falta conectar el proveedor de correo.');
  await rateLimit(request, env, 'order-email-test', 3, 3600);
  const payload = {
    subject: '[PRUEBA] Avisos de compra · Maquinaria Rentería',
    text: 'Este es un correo de prueba de Maquinaria Rentería.\nLa conexión con el proveedor funciona. No corresponde a una compra ni a un cobro.\nLos pedidos pagados enviarán folio, cliente, contacto, dirección, equipos, importes y datos de facturación.\nEl registro del administrador se conserva.',
  };
  try {
    const result = await sendEmail(env, payload);
    if (!result.activationRequired) await env.DB.prepare("UPDATE order_email_notifications SET last_error=NULL WHERE status='sent' AND last_error='activation_required' AND json_extract(payload_json,'$.recipient')=?")
      .bind(configuration(env).recipient).run();
    return json({ success: true, activationRequired: result.activationRequired, message: result.activationRequired
      ? 'FormSubmit envió el enlace de activación al correo de Maquinaria Rentería. Abre ese mensaje y pulsa «Activate Form»; después envía otra prueba.'
      : 'FormSubmit aceptó el correo de prueba. Revisa la bandeja de entrada y spam para confirmar que llegó.' });
  }
  catch (error) {
    const code = error instanceof Error && /^(formsubmit_http_\d{3}|formsubmit_rejected|invalid_notification_recipient)$/.test(error.message)
      ? error.message : error instanceof Error ? error.name : 'ServiceError';
    console.error('Order email diagnostic failed:', code); // Codes only; no customer or provider content.
    throw new HttpError(502, 'El proveedor no confirmó el envío. Revisa su configuración.');
  }
}
