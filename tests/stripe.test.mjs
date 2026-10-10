import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
import Stripe from 'stripe';
const dir = new URL('../node_modules/.cache/renteria-tests/', import.meta.url);
await mkdir(dir, { recursive: true });
await build({ entryPoints: ['src/worker/index.ts'], outfile: new URL('worker.mjs', dir).pathname, bundle: true, platform: 'node', format: 'esm', packages: 'external' });
const { default: worker } = await import(new URL('worker.mjs', dir));
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
  globalThis.fetch = async (url, init) => {
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
  try { await callback({ calls, sessions }); } finally { globalThis.fetch = original; }
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
