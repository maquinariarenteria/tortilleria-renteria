import type { Env } from './index';
import type { AdminSaleOrder } from '../types/admin';
import { HttpError, json, rateLimit } from './security';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const emailAddress = (value: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);

function configuration(env: Env) {
  const recipient = (env.ORDER_NOTIFICATION_TO || '').trim();
  const from = (env.ORDER_NOTIFICATION_FROM || '').trim();
  let domain = '';
  try { domain = new URL(env.SITE_URL || '').hostname.toLowerCase(); } catch { /* Incomplete configuration. */ }
  const routingConfigured = emailAddress(recipient) && emailAddress(from) && from.split('@')[1].toLowerCase() === domain;
  return { configured: env.ORDER_NOTIFICATION_ENABLED === 'true' && routingConfigured && !!env.ORDER_EMAIL, routingConfigured, recipient, from };
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
  return { recipient: configuration(env).recipient, from: configuration(env).from, replyTo: order.clientEmail,
    subject: `${payment.test ? '[PRUEBA] ' : ''}Compra pagada · ${order.folio}`,
    text, html: `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#172033"><h1 style="font-size:22px;color:#2563eb">Maquinaria Rentería</h1><pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(text)}</pre></div>` };
}

async function sendEmail(env: Env, payload: { recipient?: string; from?: string; replyTo?: string; subject: string; text: string; html?: string }) {
  const recipient = payload.recipient || configuration(env).recipient;
  if (!emailAddress(recipient)) throw new Error('invalid_notification_recipient');
  try {
    const result = await env.ORDER_EMAIL!.send({ to: recipient, from: payload.from || configuration(env).from,
      subject: payload.subject, text: payload.text, html: payload.html,
      ...(payload.replyTo && emailAddress(payload.replyTo) ? { replyTo: payload.replyTo } : {}) });
    if (!result?.messageId) throw new Error('email_acceptance_uncertain');
    return result;
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const verificationRequired = ['E_SENDER_NOT_VERIFIED', 'E_SENDER_DOMAIN_NOT_AVAILABLE', 'E_RECIPIENT_NOT_ALLOWED'].includes(code);
    const rateLimited = ['E_RATE_LIMIT_EXCEEDED', 'E_DAILY_LIMIT_EXCEEDED'].includes(code);
    const invalid = ['E_VALIDATION_ERROR', 'E_FIELD_MISSING', 'E_CONTENT_TOO_LARGE', 'E_RECIPIENT_SUPPRESSED'].includes(code);
    throw Object.assign(new Error(verificationRequired ? 'email_verification_required' : rateLimited ? 'email_rate_limited' : invalid ? 'email_rejected' : 'email_delivery_uncertain'),
      { status: verificationRequired ? 409 : rateLimited ? 429 : invalid ? 400 : 0, verificationRequired, confirmedRejection: verificationRequired || rateLimited || invalid });
  }
}

export async function sendPendingOrderEmail(env: Env, orderId: string) {
  if (!orderEmailConfigured(env)) return;
  const now = Date.now();
  // Email sending has no documented idempotency key. An interrupted attempt must be
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
    await sendEmail(env, payload);
    await env.DB.prepare("UPDATE order_email_notifications SET status='sent', sent_at=?, last_error=NULL, locked_until=0 WHERE order_id=? AND lock_token=?")
      .bind(new Date().toISOString(), orderId, lockToken).run();
  } catch (error) {
    const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0;
    const rejected = error && typeof error === 'object' && 'confirmedRejection' in error && error.confirmedRejection;
    const verification = error && typeof error === 'object' && 'verificationRequired' in error && error.verificationRequired;
    const permanent = requestStarted && !verification && (!rejected || status !== 429);
    const code = verification ? 'email_verification_required' : status === 429 ? 'email_rate_limited' : requestStarted ? (rejected ? 'email_rejected' : 'email_delivery_uncertain') : 'email_prepare_failed';
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
  const activation = await env.DB.prepare("SELECT COUNT(*) AS count FROM order_email_notifications WHERE status='pending' AND last_error='email_verification_required'").first();
  return { configured: orderEmailConfigured(env), provider: 'Cloudflare', pending: (counts.pending || 0) + (counts.sending || 0), sent: counts.sent || 0, activationPending: activation?.count || 0, blocked: counts.blocked || 0 };
}

export async function handleOrderEmail(request: Request, env: Env): Promise<Response | null> {
  if (new URL(request.url).pathname !== '/api/admin/order-notifications/test') return null;
  if (request.method !== 'POST') throw new HttpError(405, 'Método no disponible.');
  if (!orderEmailConfigured(env)) throw new HttpError(503, 'Falta conectar el proveedor de correo.');
  await rateLimit(request, env, 'order-email-test:cloudflare', 3, 3600);
  const payload = {
    subject: '[PRUEBA] Avisos de compra · Maquinaria Rentería',
    text: 'Este es un correo de prueba de Maquinaria Rentería.\nLa conexión con el proveedor funciona. No corresponde a una compra ni a un cobro.\nLos pedidos pagados enviarán folio, cliente, contacto, dirección, equipos, importes y datos de facturación.\nEl registro del administrador se conserva.',
  };
  try {
    await sendEmail(env, payload);
    await env.DB.prepare("UPDATE order_email_notifications SET next_attempt_at=0 WHERE status='pending' AND last_error='email_verification_required' AND json_extract(payload_json,'$.recipient')=?")
      .bind(configuration(env).recipient).run();
    return json({ success: true, message: 'Cloudflare aceptó el correo de prueba. Revisa la bandeja de entrada y spam para confirmar que llegó.' });
  }
  catch (error) {
    const code = error instanceof Error && /^(email_verification_required|email_rate_limited|email_rejected|email_delivery_uncertain|invalid_notification_recipient)$/.test(error.message)
      ? error.message : error instanceof Error ? error.name : 'ServiceError';
    console.error('Order email diagnostic failed:', code); // Codes only; no customer or provider content.
    if (code === 'email_verification_required') throw new HttpError(409, 'Falta verificar el correo o el dominio en Cloudflare. Abre el mensaje enviado a Maquinaria Rentería y pulsa «Verify email address».');
    if (code === 'email_rate_limited') throw new HttpError(429, 'Cloudflare limitó temporalmente los envíos. Espera unos minutos y vuelve a comprobar.');
    throw new HttpError(502, 'El proveedor no confirmó el envío. Revisa su configuración.');
  }
}
