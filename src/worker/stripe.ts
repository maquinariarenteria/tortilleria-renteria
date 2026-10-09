import Stripe from 'stripe';
import type { Env } from './index';
import type { AdminSaleOrder } from '../types/admin';
import { MACHINES_DATA } from '../data/machines';
import { getProductPrice } from '../utils/formatters';
import { digest, readJson, readBytes } from './security';
import { auditLog, readCatalog } from './records';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
class InputError extends Error {}
const text = (value: unknown, required = false) => {
  if (typeof value !== 'string' || value.length > 500 || (required && !value.trim())) {
    if (value === undefined && !required) return '';
    throw new InputError('Revisa los datos del pedido.');
  }
  return value.trim();
};
const client = (env: Env) => new Stripe(env.STRIPE_SECRET_KEY!, { httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 2, timeout: 15000 });

export async function buildStripeOrder(body: any, env: Env) {
  const currency = body.currency;
  if (currency !== 'MXN' && currency !== 'USD') throw new InputError('Moneda inválida.');
  if (body.paymentType !== 'full') throw new InputError('Tipo de pago inválido.');
  if (typeof body.requiresInvoice !== 'boolean') throw new InputError('Facturación inválida.');
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) throw new InputError('Carrito inválido.');
  const customer = body.customer || {};
  const clientName = text(customer.name, true);
  const clientPhone = text(customer.phone, true);
  const clientEmail = text(customer.email, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) || !/^\d{10,15}$/.test(clientPhone.replace(/\D/g, ''))) throw new InputError('Correo o teléfono inválido.');
  const shippingAddress = text(customer.address, true);
  const shippingCity = text(customer.city, true);
  const rfc = text(customer.rfc, body.requiresInvoice);
  const items: AdminSaleOrder['items'] = [];
  const catalog = await readCatalog(env);
  const quantities = new Map<string, number>();
  for (const item of body.items) {
    if (!item || typeof item !== 'object') throw new InputError('Artículo inválido.');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new InputError('Cantidad inválida.');
    const machine = catalog.find((m: typeof MACHINES_DATA[number]) => m.id === item.machineId);
    if (!machine) throw new InputError('Equipo no disponible para pago en línea. Contacta al asesor.');
    const variant = item.variantId ? machine.variants?.find((v: any) => v.id === item.variantId) : undefined;
    if (item.variantId && !variant) throw new InputError('Variante inválida.');
    // D1 is the authoritative base price when the catalog has been synchronized.
    const productKey = `${machine.id}:${variant?.id || 'base'}`;
    const quantity = (quantities.get(productKey) || 0) + item.quantity;
    if (quantity > 20) throw new InputError('Cantidad inválida.');
    quantities.set(productKey, quantity);
    const unitPrice = getProductPrice(machine, variant, currency);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new InputError('Precio no disponible. Contacta al asesor.');
    items.push({ id: machine.id, sku: machine.sku, name: machine.name + (variant ? ` (${variant.name})` : ''), quantity: item.quantity, unitPrice, total: unitPrice * item.quantity });
  }
  const subtotalCents = items.reduce((sum, i) => sum + Math.round(i.unitPrice * 100) * i.quantity, 0);
  // Preserve the existing invoice calculation; amounts sent to Stripe are integer cents.
  const ivaCents = body.requiresInvoice ? Math.round((subtotalCents / 100) * 0.16) * 100 : 0;
  const total = subtotalCents + ivaCents;
  if (!Number.isSafeInteger(body.expectedTotal) || body.expectedTotal !== total) throw new InputError('El precio cambió. Actualiza el catálogo antes de pagar o contacta al asesor.');
  const amount = total;
  if (!Number.isSafeInteger(amount) || amount < 1000 || amount > 99999999) throw new InputError('Monto fuera del límite de pago en línea. Contacta al asesor.');
  const id = `VTA-${crypto.randomUUID()}`;
  const order: AdminSaleOrder = {
    folio: id, createdAt: new Date().toISOString(), clientName, clientPhone, clientEmail,
    shippingAddress, shippingCity, shippingState: 'Por coordinar', shippingZip: text(customer.zip),
    requiresInvoice: body.requiresInvoice, rfc, businessName: text(customer.businessName),
    items, subtotal: subtotalCents / 100, iva: ivaCents / 100, shippingCost: 0, total: total / 100,
    paymentMethod: 'Stripe', manufacturingStatus: 'Pendiente', currency,
    paymentType: body.paymentType, amountPaid: 0, balanceDue: total / 100,
  };
  return { order, amount, total, currency, paymentType: 'full' as const };
}

async function confirmPayment(session: Stripe.Checkout.Session, env: Env) {
  if (session.payment_status !== 'paid') return;
  if (session.livemode !== /^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY!)) throw new Error('Payment environment mismatch');
  const row = await env.DB.prepare('SELECT * FROM stripe_orders WHERE session_id = ? OR id = ?').bind(session.id, session.client_reference_id).first();
  if (!row) throw new Error('Unknown Stripe session'); // Retry if a webhook races with checkout persistence.
  if (session.amount_total !== row.amount_due || session.currency !== row.currency.toLowerCase() || session.client_reference_id !== row.id) throw new Error('Payment mismatch');
  if (row.session_id && row.session_id !== session.id) throw new Error('Payment reference mismatch');
  // One conditional UPDATE makes retries and concurrent deliveries idempotent.
  await env.DB.prepare("UPDATE stripe_orders SET payment_status = 'paid', session_id = ?, paid_at = COALESCE(paid_at, ?) WHERE id = ? AND payment_status != 'paid'")
    .bind(session.id, new Date().toISOString(), row.id).run();
}

export async function handleStripe(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/stripe/') && !url.pathname.startsWith('/api/admin/stripe-orders')) return null;
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET || !env.DB || !env.SITE_URL) return json({ success: false, error: 'Los pagos todavía no están configurados. Contacta al asesor.' }, 503);
  try {
    if (url.pathname === '/api/stripe/create-checkout-session' && request.method === 'POST') {
      if (request.headers.get('Origin') !== new URL(env.SITE_URL).origin) return json({ error: 'Origen inválido.' }, 403);
      const body = await readJson(request, 20000);
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(body.requestId || '')) return json({ error: 'Referencia del intento inválida.' }, 400);
      const { order, amount, total, currency, paymentType } = await buildStripeOrder(body, env);
      order.folio = `VTA-${await digest(body.requestId)}`;
      const newToken = crypto.randomUUID() + crypto.randomUUID();
      await env.DB.prepare('INSERT OR IGNORE INTO stripe_orders (id, access_token, order_json, currency, payment_type, amount_due, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(order.folio, newToken, JSON.stringify(order), currency, paymentType, amount, total, order.createdAt).run();
      const stored = await env.DB.prepare('SELECT * FROM stripe_orders WHERE id = ?').bind(order.folio).first();
      const fingerprint = (value: any) => JSON.stringify({ ...value, createdAt: '', folio: '' });
      if (!stored || fingerprint(JSON.parse(stored.order_json)) !== fingerprint(order)) return json({ error: 'El intento corresponde a otro carrito. Actualiza la página.' }, 409);
      const accessToken = stored.access_token;
      if (stored.session_id) {
        const existing = await client(env).checkout.sessions.retrieve(stored.session_id);
        if (existing.status === 'expired') return json({ error: 'El intento de pago expiró. Cierra y vuelve a abrir el carrito.' }, 409);
        if (!existing.url) return json({ error: 'Este intento ya se completó. Contacta al asesor con tu folio.' }, 409);
        return json({ success: true, checkoutUrl: existing.url, id: existing.id, amount: amount / 100, currency });
      }
      const origin = new URL(env.SITE_URL).origin;
      const session = await client(env).checkout.sessions.create({
        mode: 'payment', integration_identifier: 'renteria_checkout_qmrtvazp', customer_email: order.clientEmail, client_reference_id: order.folio,
        line_items: [{ quantity: 1, price_data: { currency: currency.toLowerCase(), unit_amount: amount,
          product_data: { name: 'Pago completo · Maquinaria Rentería', description: order.items.map(i => `${i.name} x${i.quantity}`).join(', ').slice(0, 1000) } } }],
        metadata: { order_id: order.folio, payment_type: paymentType },
        success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}#stripe_token=${accessToken}`,
        cancel_url: `${origin}/?payment=cancel`,
      }, { idempotencyKey: order.folio });
      if (!session.url) throw new Error('No checkout URL');
      await env.DB.prepare('UPDATE stripe_orders SET session_id = ? WHERE id = ?').bind(session.id, order.folio).run();
      return json({ success: true, checkoutUrl: session.url, id: session.id, amount: amount / 100, currency });
    }
    if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
      let event: Stripe.Event;
      const rawBody = new TextDecoder().decode(await readBytes(request, 250000));
      try {
        event = await client(env).webhooks.constructEventAsync(rawBody, request.headers.get('Stripe-Signature') || '', env.STRIPE_WEBHOOK_SECRET!, undefined, Stripe.createSubtleCryptoProvider());
      } catch { return json({ error: 'Firma inválida.' }, 400); }
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        await confirmPayment(event.data.object as Stripe.Checkout.Session, env);
      }
      if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await env.DB.prepare("UPDATE stripe_orders SET payment_status = ? WHERE session_id = ? AND payment_status != 'paid'")
          .bind(event.type === 'checkout.session.expired' ? 'expired' : 'failed', session.id).run();
      }
      return json({ received: true });
    }
    if (url.pathname === '/api/stripe/session' && ['GET', 'POST'].includes(request.method)) {
      const input = request.method === 'POST' ? await readJson(request, 2000) : {};
      const sessionId = request.method === 'POST' ? input.sessionId : url.searchParams.get('session_id');
      const token = request.method === 'POST' ? input.token : url.searchParams.get('token');
      if (!sessionId || !token) return json({ error: 'Referencia inválida.' }, 400);
      if (typeof sessionId !== 'string' || typeof token !== 'string' || sessionId.length > 100 || token.length > 100) return json({ error: 'Referencia inválida.' }, 400);
      const row = await env.DB.prepare('SELECT * FROM stripe_orders WHERE session_id = ? AND access_token = ?').bind(sessionId, token).first();
      if (!row) return json({ error: 'Pedido no encontrado.' }, 404);
      if (Date.parse(row.created_at) + 7 * 86400000 < Date.now()) return json({ error: 'El enlace expiró. Contacta al asesor con tu folio.' }, 410);
      if (row.payment_status !== 'paid') {
        // A customer returning before the webhook can still be verified directly with Stripe.
        await confirmPayment(await client(env).checkout.sessions.retrieve(sessionId), env);
      }
      const updated = await env.DB.prepare('SELECT * FROM stripe_orders WHERE id = ?').bind(row.id).first();
      return json({ status: updated.payment_status, folio: row.id, currency: row.currency, paymentType: row.payment_type, amountPaid: updated.payment_status === 'paid' ? row.amount_due / 100 : 0, balanceDue: (row.total_amount - (updated.payment_status === 'paid' ? row.amount_due : 0)) / 100 });
    }
    if (url.pathname.startsWith('/api/admin/stripe-orders/') && request.method === 'POST') {
      const folio = decodeURIComponent(url.pathname.split('/').pop() || '');
      const body: any = await request.json();
      const allowed = ['Pendiente', 'En Fabricación', 'Probada en Banco', 'Embarcada', 'Entregada'];
      if (!allowed.includes(body.status)) return json({ error: 'Estado inválido.' }, 400);
      const row = await env.DB.prepare('SELECT * FROM stripe_orders WHERE id = ?').bind(folio).first();
      if (!row || row.payment_status !== 'paid') return json({ error: 'Pedido no encontrado.' }, 404);
      const order = JSON.parse(row.order_json);
      order.manufacturingStatus = body.status;
      await env.DB.prepare('UPDATE stripe_orders SET order_json = ? WHERE id = ?').bind(JSON.stringify(order), folio).run();
      await auditLog(env, 'order.manufacturing-status', folio);
      return json({ success: true });
    }
    // Authentication is checked by the Worker's admin middleware before reaching this route.
    if (url.pathname === '/api/admin/stripe-orders' && request.method === 'GET') {
      const { results } = await env.DB.prepare("SELECT * FROM stripe_orders WHERE payment_status = 'paid' ORDER BY created_at DESC LIMIT 200").all();
      return json({ orders: results.map((r: any) => ({ ...JSON.parse(r.order_json), amountPaid: r.amount_due / 100, balanceDue: (r.total_amount - r.amount_due) / 100, stripeSessionId: r.session_id })) });
    }
    return json({ error: 'Ruta no disponible.' }, 405);
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') return json({ error: error instanceof Error ? error.message : 'Solicitud inválida.' }, error.status);
    if (error instanceof InputError) return json({ error: error.message }, 400);
    console.error('Stripe request failed:', error instanceof Error ? error.name : 'UnknownError');
    return json({ success: false, error: 'No se pudo completar la operación de pago. Intenta nuevamente o contacta al asesor.' }, 502);
  }
}
