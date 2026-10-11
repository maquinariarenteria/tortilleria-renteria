import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
import Stripe from 'stripe';
const dir = new URL('../node_modules/.cache/renteria-tests/', import.meta.url);
await mkdir(dir, { recursive: true });
await build({ entryPoints: ['src/worker/index.ts'], outfile: new URL('worker.mjs', dir).pathname, bundle: true, platform: 'node', format: 'esm', packages: 'external' });
const { default: worker } = await import(new URL('worker.mjs', dir));
await build({ entryPoints: ['src/worker/orderEmail.ts'], outfile: new URL('order-email.mjs', dir).pathname, bundle: true, platform: 'node', format: 'esm', packages: 'external' });
const { sendPendingOrderEmail, processPendingOrderEmails, createOrderEmail } = await import(new URL('order-email.mjs', dir));
after(() => rm(dir, { recursive: true, force: true }));

import { Database } from './database.mjs';
const customer = { name: 'Cliente Prueba', phone: '6391234567', email: 'test@example.com', address: 'Calle 1', city: 'Delicias' };
// Read the actual catalog so tests include real variant formulas, not arbitrary browser prices.
await build({ entryPoints: ['src/data/machines.ts'], outfile: new URL('catalog.mjs', dir).pathname, bundle: true, platform: 'node', format: 'esm' });
const { MACHINES_DATA } = await import(new URL('catalog.mjs', dir));
const product = MACHINES_DATA[0];
function payload(options = {}) { return { requestId: crypto.randomUUID(), currency: 'MXN', paymentType: 'full', requiresInvoice: false, expectedTotal: product.priceMXN * 100, customer, items: [{ machineId: product.id, quantity: 1 }], ...options }; }
function setup() {
  const DB = new Database();
  const env = { DB, STRIPE_SECRET_KEY: 'test_fixture_only', STRIPE_WEBHOOK_SECRET: 'test_signing_fixture_only', ADMIN_PASSWORD: 'test-admin-password', SITE_URL: 'https://shop.example.com', ASSETS: { fetch: async () => new Response('asset') } };
  return { env, DB };
}
function request(path, body, headers = {}) { return new Request('https://shop.example.com' + path, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: 'https://shop.example.com', 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) }); }
async function withStripe(callback) {
  const original = globalThis.fetch;
  const sessions = new Map();
  const calls = [];
  const emailCalls = [];
  let emailResponse = async () => Response.json({ success: 'true' });
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://formsubmit.co/ajax/')) {
      const email = { url: String(url), body: JSON.parse(init.body) };
      emailCalls.push(email); return emailResponse(email);
    }
    assert.ok(String(url).startsWith('https://api.stripe.com/'));
    if (init?.method === 'POST') {
      const params = new URLSearchParams(init.body);
      calls.push(params);
      const id = `cs_test_${calls.length}`;
      const session = { id, livemode: false, status: 'open', url: 'https://checkout.stripe.com/c/pay/' + id, amount_total: Number(params.get('line_items[0][price_data][unit_amount]')), currency: params.get('line_items[0][price_data][currency]'), client_reference_id: params.get('client_reference_id'), payment_status: 'unpaid' };
      sessions.set(id, session);
      return new Response(JSON.stringify(session), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(sessions.get(String(url).split('/').pop())), { headers: { 'Content-Type': 'application/json' } });
  };
  try { await callback({ calls, sessions, emailCalls, setEmailResponse: response => { emailResponse = response; } }); } finally { globalThis.fetch = original; }
}
async function eventRequest(type, session, secret = 'test_signing_fixture_only') {
  const payload = JSON.stringify({ id: 'evt_test', object: 'event', type, data: { object: session } });
  const signature = await Stripe.webhooks.generateTestHeaderStringAsync({ payload, secret }, Stripe.createSubtleCryptoProvider());
  return new Request('https://shop.example.com/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': signature }, body: payload });
}

test('Missing configuration cannot return a successful payment', async () => {
  const response = await worker.fetch(request('/api/stripe/create-checkout-session', payload()), { ASSETS: setup().env.ASSETS });
  assert.equal(response.status, 503);
});
test('Reject manipulated totals, invalid quantities, unknown variants and cross-origin checkout', async () => {
  const { env } = setup();
  for (const body of [payload({ expectedTotal: 100 }), payload({ paymentType: 'deposit' }), payload({ items: [{ machineId: product.id, quantity: -1 }] }), payload({ items: [{ machineId: product.id, quantity: 1, variantId: 'fake' }] }), payload({ currency: 'eur' })]) {
    assert.equal((await worker.fetch(request('/api/stripe/create-checkout-session', body), env)).status, 400);
  }
  assert.equal((await worker.fetch(request('/api/stripe/create-checkout-session', payload(), { Origin: 'https://evil.example' }), env)).status, 403);
});
test('Checkout uses server prices for 100% payment, MXN/USD, IVA and variants', async () => withStripe(async ({ calls }) => {
  for (const currency of ['MXN', 'USD']) for (const requiresInvoice of [false, true]) {
    const { env, DB } = setup();
    const variant = product.variants?.[1];
    const base = currency === 'MXN' ? product.priceMXN : product.priceUSD;
    const price = variant ? ((currency === 'MXN' ? variant.fixedPriceMXN : variant.fixedPriceUSD) ?? (base + (currency === 'MXN' ? variant.extraPriceMXN : variant.extraPriceUSD))) : base;
    const total = price * 100 + (requiresInvoice ? Math.round(price * .16) * 100 : 0);
    const response = await worker.fetch(request('/api/stripe/create-checkout-session', payload({ currency, paymentType: 'full', requiresInvoice, expectedTotal: total, customer: { ...customer, rfc: 'TEST123456ABC' }, items: [{ machineId: product.id, quantity: 1, variantId: variant?.id }], amount: 1 })), env);
    assert.equal(response.status, 200);
    const params = calls.at(-1);
    assert.equal(Number(params.get('line_items[0][price_data][unit_amount]')), total);
    assert.equal(params.get('line_items[0][price_data][currency]'), currency.toLowerCase());
    assert.equal(params.has('payment_method_types[0]'), false);
    assert.equal([...DB.rows.values()][0].payment_status, 'pending');
  }
}));
test('D1 price override rejects stale browser total', async () => {
  const { env, DB } = setup(); DB.sqlite.prepare("INSERT INTO app_records(kind,id,data_json,updated_at) VALUES('catalog','main',?,?)").run(JSON.stringify(MACHINES_DATA.map(m=>m.id===product.id?{...m,priceMXN:m.priceMXN+1000}:m)),new Date().toISOString());
  assert.equal((await worker.fetch(request('/api/stripe/create-checkout-session', payload()), env)).status, 400);
});
test('Receipt targets the validated customer email; invalid emails never create Checkout', async () => withStripe(async ({ calls }) => {
  const { env } = setup();
  for (const email of [undefined, '', 'cliente@', 'cliente@example.com\r\nBcc: otro@example.com']) {
    const response = await worker.fetch(request('/api/stripe/create-checkout-session', payload({ customer: { ...customer, email } })), env);
    assert.equal(response.status, 400);
  }
  assert.equal(calls.length, 0);
  const attempt = payload({ customer: { ...customer, email: '  cliente@example.com  ' } });
  const response = await worker.fetch(request('/api/stripe/create-checkout-session', attempt), env);
  assert.equal(response.status, 200);
  const params = calls[0];
  assert.equal(params.get('customer_email'), 'cliente@example.com');
  assert.equal(params.get('payment_intent_data[receipt_email]'), 'cliente@example.com');
  assert.equal(params.get('payment_intent_data[metadata][order_id]'), params.get('client_reference_id'));
  assert.ok(params.get('payment_intent_data[description]').includes(params.get('client_reference_id')));
  assert.equal(params.has('invoice_creation[enabled]'), false);
  const retry = await worker.fetch(request('/api/stripe/create-checkout-session', attempt), env);
  assert.equal(retry.status, 200);
  assert.equal(calls.length, 1);
}));
test('Webhook signature, delayed payments, duplicates, amount mismatch and status access', async () => withStripe(async ({ sessions }) => {
  const { env, DB } = setup();
  const checkout = await (await worker.fetch(request('/api/stripe/create-checkout-session', payload()), env)).json();
  const session = sessions.get(checkout.id);
  const row = [...DB.rows.values()][0];
  const statusPath = `/api/stripe/session?session_id=${session.id}&token=${row.access_token}`;
  assert.equal((await worker.fetch(request('/api/stripe/session?session_id=' + session.id + '&token=fake'), env)).status, 404);
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', session, 'wrong'), env)).status, 400);
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', session), env)).status, 200);
  assert.equal(DB.rows.get(row.id).payment_status, 'pending');
  assert.equal((await (await worker.fetch(request(statusPath), env)).json()).status, 'pending');
  session.payment_status = 'paid';
  const mismatch = { ...session, amount_total: 1 };
  assert.equal((await worker.fetch(await eventRequest('checkout.session.async_payment_succeeded', mismatch), env)).status, 502);
  assert.equal(DB.rows.get(row.id).payment_status, 'pending');
  assert.equal((await worker.fetch(await eventRequest('checkout.session.async_payment_succeeded', session), env)).status, 200);
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', session), env)).status, 200);
  assert.equal(DB.paidTransitions, 1);
  await worker.fetch(await eventRequest('checkout.session.expired', session), env);
  assert.equal(DB.rows.get(row.id).payment_status, 'paid');
  const result = await (await worker.fetch(request(statusPath), env)).json();
  assert.equal(result.status, 'paid');
  assert.equal(result.amountPaid, product.priceMXN);
  assert.equal(result.balanceDue, 0);
}));
test('Return page before webhook verifies Stripe directly', async () => withStripe(async ({ sessions }) => {
  const { env, DB } = setup();
  const checkout = await (await worker.fetch(request('/api/stripe/create-checkout-session', payload()), env)).json();
  sessions.get(checkout.id).payment_status = 'paid';
  const row = [...DB.rows.values()][0];
  const result = await (await worker.fetch(request(`/api/stripe/session?session_id=${checkout.id}&token=${row.access_token}`), env)).json();
  assert.equal(result.status, 'paid'); assert.equal(result.balanceDue, 0);
}));
test('Admin orders require a signed session; fake prefixes and wrong passwords fail', async () => {
  const { env } = setup();
  assert.equal((await worker.fetch(request('/api/admin/stripe-orders', undefined, { Authorization: 'Bearer cf_adm_fake' }), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/admin/login', { password: 'wrong' }), env)).status, 401);
  const login = await (await worker.fetch(request('/api/admin/login', { password: env.ADMIN_PASSWORD }), env)).json();
  const response = await worker.fetch(request('/api/admin/stripe-orders', undefined, { Authorization: 'Bearer ' + login.token }), env);
  assert.equal(response.status, 200); assert.deepEqual((await response.json()).orders, []);
});
test('The same configured password works in separate browsers without device registration', async () => {
  const { env, DB } = setup();
  env.ADMIN_PASSWORD = 'fixture-A>\"/symbols-123';
  const browserA = { 'User-Agent': 'Browser A', 'CF-Connecting-IP': '192.0.2.10' };
  const browserB = { 'User-Agent': 'Browser B', 'CF-Connecting-IP': '192.0.2.11' };
  const loginA = await worker.fetch(request('/api/admin/login', { password: env.ADMIN_PASSWORD }, browserA), env);
  const loginB = await worker.fetch(request('/api/admin/login', { password: env.ADMIN_PASSWORD }, browserB), env);
  assert.equal(loginA.status, 200);
  assert.equal(loginB.status, 200);
  const cookieA = loginA.headers.get('Set-Cookie').split(';')[0];
  const cookieB = loginB.headers.get('Set-Cookie').split(';')[0];
  assert.notEqual(cookieA, cookieB);
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM admin_sessions').get().n, 2);
  for (const [browser, cookie] of [[browserA, cookieA], [browserB, cookieB]]) {
    assert.equal((await worker.fetch(request('/api/admin/verify', undefined, { ...browser, Cookie: cookie }), env)).status, 200);
  }
  assert.equal((await worker.fetch(request('/api/admin/logout', {}, { ...browserA, Cookie: cookieA }), env)).status, 200);
  assert.equal((await worker.fetch(request('/api/admin/verify', undefined, { ...browserA, Cookie: cookieA }), env)).status, 401);
  assert.equal((await worker.fetch(request('/api/admin/verify', undefined, { ...browserB, Cookie: cookieB }), env)).status, 200);
  for (const password of [env.ADMIN_PASSWORD.replace('>', '<'), env.ADMIN_PASSWORD.toUpperCase()]) {
    assert.equal((await worker.fetch(request('/api/admin/login', { password }, browserB), env)).status, 401);
  }
});

function emailSetup() { const { env, DB } = setup(); env.ORDER_NOTIFICATION_ENABLED = 'true'; env.ORDER_NOTIFICATION_TO = 'owner@example.com'; return { env, DB }; }
async function checkout(env, sessions, change = {}) {
  const response = await worker.fetch(request('/api/stripe/create-checkout-session', payload(change)), env);
  assert.equal(response.status, 200); const data = await response.json(); return sessions.get(data.id);
}
const notice = DB => DB.sqlite.prepare('SELECT * FROM order_email_notifications').get();

test('Only a verified paid order sends complete data; duplicate webhooks send one notice', async () => withStripe(async ({ sessions, emailCalls }) => {
  const { env, DB } = emailSetup();
  const total = product.priceMXN * 100 + Math.round(product.priceMXN * .16) * 100;
  const session = await checkout(env, sessions, { requiresInvoice: true, expectedTotal: total, customer: { ...customer, name: '<img src=x onerror=alert(1)>', zip: '33000', rfc: 'XAXX010101000', businessName: 'Empresa ficticia' } });
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', session), env)).status, 200);
  assert.equal(emailCalls.length, 0); assert.equal(notice(DB), undefined);
  session.payment_status = 'paid'; session.payment_intent = 'pi_test_fixture';
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', session, 'wrong'), env)).status, 400);
  assert.equal(emailCalls.length, 0);
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', { ...session, amount_total: 1 }), env)).status, 502);
  assert.equal(emailCalls.length, 0);
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', session), env)).status, 200);
  assert.equal((await worker.fetch(await eventRequest('checkout.session.async_payment_succeeded', session), env)).status, 200);
  assert.equal(emailCalls.length, 1); assert.equal(notice(DB).status, 'sent'); assert.equal(DB.paidTransitions, 1);
  const email = emailCalls[0]; assert.equal(email.url, 'https://formsubmit.co/ajax/owner%40example.com');
  for (const value of [customer.email, customer.phone, customer.address, customer.city, '33000', 'XAXX010101000', 'Empresa ficticia', product.name, product.sku, session.id, session.payment_intent, 'Flete aparte', 'NO ES UN COBRO REAL']) assert.ok(email.body.message.includes(value), value);
  assert.ok(email.body._subject.startsWith('[PRUEBA]'));
  assert.equal(email.body.email, customer.email);
  assert.equal(email.body.Pagado, email.body.Total);
  const frozen = JSON.parse(notice(DB).payload_json); assert.ok(frozen.html.includes('&lt;img')); assert.ok(!frozen.html.includes('<img src=x'));
  assert.ok(!email.body.message.includes([...DB.rows.values()][0].access_token));
}));

test('A provider outage preserves the paid sale and flags uncertain delivery without duplicating it', async () => withStripe(async ({ sessions, emailCalls, setEmailResponse }) => {
  const { env, DB } = emailSetup(); const session = await checkout(env, sessions); session.payment_status = 'paid';
  setEmailResponse(async () => { throw Error('Fixture network timeout'); });
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', session), env)).status, 200);
  assert.equal([...DB.rows.values()][0].payment_status, 'paid'); assert.equal(notice(DB).status, 'blocked');
  assert.equal(notice(DB).last_error, 'email_delivery_uncertain');
  await processPendingOrderEmails(env); await worker.fetch(await eventRequest('checkout.session.completed', session), env);
  assert.equal(emailCalls.length, 1);
  const login = await (await worker.fetch(request('/api/admin/login', { password: env.ADMIN_PASSWORD }), env)).json();
  const orders = await (await worker.fetch(request('/api/admin/stripe-orders', undefined, { Authorization: 'Bearer ' + login.token }), env)).json();
  assert.equal(orders.orders.length, 1); assert.equal(orders.orders[0].amountPaid, product.priceMXN);
}));

test('Explicit provider rate rejection is retried with the original notice; success:false cannot look sent', async () => withStripe(async ({ sessions, emailCalls, setEmailResponse }) => {
  const { env, DB } = emailSetup(); const session = await checkout(env, sessions); session.payment_status = 'paid';
  setEmailResponse(async () => Response.json({ success: false }, { status: 429 }));
  await worker.fetch(await eventRequest('checkout.session.completed', session), env);
  assert.equal(notice(DB).status, 'pending'); await processPendingOrderEmails(env); assert.equal(emailCalls.length, 1);
  DB.sqlite.prepare('UPDATE order_email_notifications SET next_attempt_at=0').run();
  setEmailResponse(async () => Response.json({ success: 'true' })); await processPendingOrderEmails(env);
  assert.equal(emailCalls.length, 2); assert.deepEqual(emailCalls[0].body, emailCalls[1].body); assert.equal(notice(DB).status, 'sent');
  const other = await checkout(env, sessions); other.payment_status = 'paid';
  setEmailResponse(async () => Response.json({ success: false })); await worker.fetch(await eventRequest('checkout.session.completed', other), env);
  assert.equal(DB.sqlite.prepare("SELECT COUNT(*) AS n FROM order_email_notifications WHERE status='blocked'").get().n, 1);
}));

test('Concurrent payment confirmations and retries cannot send two notifications', async () => withStripe(async ({ sessions, emailCalls, setEmailResponse }) => {
  const { env, DB } = emailSetup(); const session = await checkout(env, sessions); session.payment_status = 'paid';
  let release; let reached; const reachedProvider = new Promise(r => { reached = r; });
  setEmailResponse(() => { reached(); return new Promise(r => { release = () => r(Response.json({ success: true })); }); });
  const first = worker.fetch(await eventRequest('checkout.session.completed', session), env);
  await reachedProvider;
  const second = await worker.fetch(await eventRequest('checkout.session.async_payment_succeeded', session), env);
  await sendPendingOrderEmail(env, session.client_reference_id); assert.equal(second.status, 200); assert.equal(emailCalls.length, 1);
  release(); assert.equal((await first).status, 200); assert.equal(notice(DB).status, 'sent'); assert.equal(DB.paidTransitions, 1);
}));

test('Durable queue retains original test mode and never backfills already-paid legacy orders', async () => withStripe(async ({ sessions, emailCalls }) => {
  const { env, DB } = setup(); const session = await checkout(env, sessions); session.payment_status = 'paid';
  await worker.fetch(await eventRequest('checkout.session.completed', session), env);
  assert.equal(notice(DB).status, 'pending'); assert.equal(notice(DB).is_test, 1); assert.equal(emailCalls.length, 0);
  env.ORDER_NOTIFICATION_ENABLED = 'true'; env.ORDER_NOTIFICATION_TO = 'owner@example.com'; env.STRIPE_SECRET_KEY = 'sk_live_fixture_only';
  await processPendingOrderEmails(env); assert.ok(emailCalls[0].body._subject.startsWith('[PRUEBA]'));
  const legacy = await checkout({ ...env, STRIPE_SECRET_KEY: 'test_fixture_only' }, sessions); legacy.payment_status = 'paid';
  DB.sqlite.prepare("UPDATE stripe_orders SET payment_status='paid',paid_at='2026-01-01T00:00:00Z' WHERE id=?").run(legacy.client_reference_id);
  await worker.fetch(await eventRequest('checkout.session.completed', legacy), { ...env, STRIPE_SECRET_KEY: 'test_fixture_only' });
  assert.equal(DB.sqlite.prepare('SELECT COUNT(*) AS n FROM order_email_notifications').get().n, 1);
}));

test('Payment and notification commit together; database failure is safely retried by Stripe', async () => withStripe(async ({ sessions, emailCalls }) => {
  const { env, DB } = emailSetup(); const session = await checkout(env, sessions); session.payment_status = 'paid';
  DB.sqlite.exec("CREATE TRIGGER fail_notice BEFORE INSERT ON order_email_notifications BEGIN SELECT RAISE(ABORT,'fixture failure'); END;");
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', session), env)).status, 502);
  assert.equal([...DB.rows.values()][0].payment_status, 'pending'); assert.equal(notice(DB), undefined); assert.equal(emailCalls.length, 0);
  DB.sqlite.exec('DROP TRIGGER fail_notice');
  assert.equal((await worker.fetch(await eventRequest('checkout.session.completed', session), env)).status, 200);
  assert.equal(notice(DB).status, 'sent'); assert.equal(emailCalls.length, 1);
}));

test('Email diagnostics require admin authentication and have a sending limit; abandoned delivery is reviewed', async () => withStripe(async ({ sessions, emailCalls }) => {
  const { env, DB } = emailSetup();
  assert.equal((await worker.fetch(request('/api/admin/order-notifications/test', {}), env)).status, 401); assert.equal(emailCalls.length, 0);
  const login = await (await worker.fetch(request('/api/admin/login', { password: env.ADMIN_PASSWORD }), env)).json();
  const headers = { Authorization: 'Bearer ' + login.token };
  for (let i = 0; i < 3; i++) assert.equal((await worker.fetch(request('/api/admin/order-notifications/test', {}, headers), env)).status, 200);
  assert.equal((await worker.fetch(request('/api/admin/order-notifications/test', {}, headers), env)).status, 429);
  assert.equal(emailCalls.length, 3); assert.equal(DB.rows.size, 0);
  const session = await checkout(env, sessions); session.payment_status = 'paid'; env.ORDER_NOTIFICATION_ENABLED = 'false';
  await worker.fetch(await eventRequest('checkout.session.completed', session), env);
  DB.sqlite.prepare("UPDATE order_email_notifications SET status='sending',locked_until=0").run();
  env.ORDER_NOTIFICATION_ENABLED = 'true'; await processPendingOrderEmails(env);
  assert.equal(notice(DB).status, 'blocked'); assert.equal(emailCalls.length, 3);
  const health = await (await worker.fetch(request('/api/admin/health', undefined, headers), env)).json(); assert.equal(health.orderEmail.blocked, 1);
}));
