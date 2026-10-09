// Audit uses an isolated SQLite database and a fake Stripe transport. No real payments or emails.
import { build } from 'esbuild';
import { DatabaseSync } from 'node:sqlite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import Stripe from 'stripe';
const out = process.env.AUDIT_OUTPUT || '/private/tmp/renteria-audit';
await mkdir(out, { recursive: true });
const cache = new URL('../node_modules/.cache/security-audit/', import.meta.url);
await mkdir(cache, { recursive: true });
for (const [name, entry] of Object.entries({worker:'src/worker/index.ts',auth:'src/worker/adminAuth.ts',catalog:'src/data/machines.ts',store:'src/utils/adminStore.ts',service:'src/services/adminService.ts',email:'src/utils/emailService.ts'})) {
  await build({ entryPoints: [entry], outfile: new URL(name+'.mjs',cache).pathname, bundle:true, platform:'node',format:'esm',packages:'external' });
}
const {default:worker}=await import(new URL('worker.mjs',cache));
const {createAdminToken}=await import(new URL('auth.mjs',cache));
const {MACHINES_DATA}=await import(new URL('catalog.mjs',cache));
const schema=(await readFile('migrations/0001_initial_schema.sql','utf8'))+(await readFile('migrations/0002_stripe_orders.sql','utf8'))+(await readFile('migrations/0003_security.sql','utf8'));
class DB {
  sqlite=new DatabaseSync(':memory:');
  fail=false;
  constructor(){this.sqlite.exec(schema)}
  prepare(sql){const db=this;let args=[];return {
    bind(...values){args=values;return this},
    async first(){if(db.fail)throw Error('fixture DB failure');return db.sqlite.prepare(sql).get(...args)||null},
    async all(){if(db.fail)throw Error('fixture DB failure');return {results:db.sqlite.prepare(sql).all(...args)}},
    async run(){if(db.fail)throw Error('fixture DB failure');const r=db.sqlite.prepare(sql).run(...args);return {success:true,meta:{changes:Number(r.changes)}}},
  }}
  count(table){return this.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n}
}
const idem=new Map();const sessions=new Map();let creations=0;let failStripe=false;
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(url,init)=>{
  if(String(url).startsWith('https://api.web3forms.com'))throw Error('Fixture: email offline');
  if(!String(url).startsWith('https://api.stripe.com/'))throw Error('Audit forbids external requests');
  if(failStripe)return new Response(JSON.stringify({error:{message:'fixture error',type:'invalid_request_error'}}),{status:400,headers:{'Content-Type':'application/json'}});
  if(init?.method==='POST'){
    const ik=new Headers(init.headers).get('Idempotency-Key'); if (ik && idem.has(ik)) return Response.json(idem.get(ik));
    const p=new URLSearchParams(init.body);const id='cs_test_audit_'+(++creations);
    const s={id,object:'checkout.session',livemode:false,url:'https://checkout.stripe.com/c/pay/'+id,amount_total:Number(p.get('line_items[0][price_data][unit_amount]')),currency:p.get('line_items[0][price_data][currency]'),client_reference_id:p.get('client_reference_id'),payment_status:'unpaid'};
    sessions.set(id,s); if (ik) idem.set(ik,s); return Response.json(s);
  }
  return Response.json(sessions.get(String(url).split('/').pop()));
};
const checks=[];
function record(id,section,name,ok,evidence,severity='Alta'){checks.push({id,section,name,result:ok?'PASA':'FALLA',severity:ok?null:severity,evidence})}
const setup=()=>({DB:new DB(),ADMIN_PASSWORD:'audit-fixture-password',STRIPE_SECRET_KEY:'audit_fixture_only',STRIPE_WEBHOOK_SECRET:'audit_fixture_signing_only',SITE_URL:'https://audit.example',ASSETS:{fetch:async()=>new Response('<html>fixture</html>',{headers:{'Content-Type':'text/html'}})}});
function req(path,{body,method=body===undefined?'GET':'POST',headers={}}={}){return new Request('https://audit.example'+path,{method,headers:{Origin:'https://audit.example','Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)})}
const customer={name:'Cliente Ficticio',phone:'6391234567',email:'audit@example.com',address:'Dirección ficticia',city:'Delicias'};
function payload(machine=MACHINES_DATA[0],change={}){return {requestId:crypto.randomUUID(),currency:'MXN',paymentType:'full',requiresInvoice:false,expectedTotal:Math.round(machine.priceMXN*100),customer,items:[{machineId:machine.id,quantity:1}],...change}}
async function login(env){return (await (await worker.fetch(req('/api/admin/login',{body:{password:env.ADMIN_PASSWORD}}),env)).json()).token}
async function event(env,type,session,options={}){
  const data=JSON.stringify({id:options.eventId||'evt_audit',object:'event',livemode:false,type,data:{object:session}});
  const signature=await Stripe.webhooks.generateTestHeaderStringAsync({payload:data,secret:options.secret||env.STRIPE_WEBHOOK_SECRET,timestamp:options.timestamp},Stripe.createSubtleCryptoProvider());
  return worker.fetch(new Request('https://audit.example/api/stripe/webhook',{method:'POST',body:data,headers:{'Stripe-Signature':signature}}),env);
}
let n=0;
for(const path of ['/api/admin/verify','/api/admin/stripe-orders','/api/admin/stripe-orders/other-order','/api/admin/machines','/api/admin/upload','/api/admin/cleanup','/api/admin/limits','/api/admin/send-test-report']){
  for(const method of ['GET','POST','PUT','DELETE']){
    const r=await worker.fetch(req(path,{method,body:['POST','PUT'].includes(method)?{}:undefined}),setup());
    record('AUTH-'+(++n),6,`${method} ${path} sin sesión`,r.status===401,{status:r.status});
  }
}
{
  const env=setup();const token=await login(env);
  const valid=await worker.fetch(req('/api/admin/verify',{headers:{Origin:'https://audit.example',Authorization:'Bearer '+token}}),env);
  record('SESSION-VALID',7,'Sesión firmada válida',valid.status===200,{status:valid.status});
  for(const [name,t] of [['prefix','cf_adm_fake'],['tampered',token.slice(0,-1)+(token.at(-1)==='0'?'1':'0')],['unsigned',token.split('.')[0]+'.'],['extra',token+'.extra']]){
    const r=await worker.fetch(req('/api/admin/verify',{headers:{Authorization:'Bearer '+t}}),env);
    record('SESSION-'+name,7,'Rechazo de token '+name,r.status===401,{status:r.status});
  }
  const expires=Date.now()-1;const p=btoa(JSON.stringify({expires,nonce:'test'}));const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ADMIN_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(p));const old=p+'.'+Buffer.from(sig).toString('hex');
  const r=await worker.fetch(req('/api/admin/verify',{headers:{Authorization:'Bearer '+old}}),env);
  record('SESSION-EXPIRED',7,'Rechazo de sesión vencida',r.status===401,{status:r.status});
  let statuses=[];for(let i=0;i<25;i++)statuses.push((await worker.fetch(req('/api/admin/login',{body:{password:'wrong'}}),env)).status);
  record('LOGIN-RATE',6,'Límite de intentos de contraseña (local)',statuses.includes(429),{attempts:25,statuses:[...new Set(statuses)]});
  const cross=await worker.fetch(req('/api/admin/login',{body:{password:env.ADMIN_PASSWORD},headers:{Origin:'https://evil.invalid'}}),env);
  record('LOGIN-ORIGIN',9,'Login rechaza origen externo',cross.status===403,{status:cross.status,allowOrigin:cross.headers.get('Access-Control-Allow-Origin')});
  record('ADMIN-CACHE',16,'Respuesta de autenticación impide caché',valid.headers.get('Cache-Control')?.includes('no-store'),{cacheControl:valid.headers.get('Cache-Control')});
  // There is no logout endpoint: test if submitting logout revokes an otherwise valid session.
  await worker.fetch(req('/api/admin/logout',{body:{},headers:{Origin:'https://audit.example',Authorization:'Bearer '+token}}),env);
  const reused=await worker.fetch(req('/api/admin/verify',{headers:{Origin:'https://audit.example',Authorization:'Bearer '+token}}),env);
  record('SESSION-LOGOUT',7,'Logout invalida sesión en servidor',reused.status===401,{statusAfterLogout:reused.status});
}
{
  const env=setup();const bodies=[{id:'quote_audit',folio:'COT-AUDIT',customerName:'Cliente ficticio',phone:'6391234567',email:'audit@example.com',estimatedTotal:1},{folio:'sale_audit',clientName:'Cliente ficticio',clientPhone:'6391234567',total:1}];
  for(const [i,type]of ['quote','sale'].entries()){
    const r=await worker.fetch(req('/api/notify/'+type,{body:bodies[i]}),env);const body=await r.json();const count=env.DB.count(type==='quote'?'quotes':'sales');
    record('NOTIFY-'+type,11,'Notificación '+type+' coincide con escritura duradera',!(body.success&&count===0),{status:r.status,success:body.success,rows:count},'Bloqueante');
  }
  const unknown=await worker.fetch(req('/api/notify/unlisted',{body:{}}),env);
  record('API-UNKNOWN',9,'Notificación de tipo desconocido rechazada',unknown.status===404||unknown.status===400,{status:unknown.status});
  const a=await worker.fetch(req('/api/notify/appointment',{body:{id:'fixture_a',customerName:'',phone:'x',scheduledDate:'invalid',scheduledTime:'99:99',status:'Confirmada'}}),env);
  record('APPOINTMENT-VALIDATION',9,'Validación servidor de nombre/teléfono/fecha/hora',a.status===400,{status:a.status,stored:env.DB.count('appointments')});
  const oversized=await worker.fetch(req('/api/notify/unlisted',{body:{text:'x'.repeat(25000)}}),env);
  record('NOTIFY-SIZE',17,'Límite de tamaño en notificaciones',oversized.status===413,{status:oversized.status});
  const token=await login(env);env.DB.fail=true;const failed=await worker.fetch(req('/api/admin/machines',{body:{machines:[{...MACHINES_DATA[0],name:'Ficticio'}],},headers:{Origin:'https://audit.example',Authorization:'Bearer '+token}}),env);
  record('CATALOG-DB-FAIL',11,'Catálogo informa error al fallar D1',failed.status>=500,{status:failed.status,body:await failed.json()},'Bloqueante');
  const f=new FormData();f.append('file',new Blob(['<svg onload="alert(1)"></svg>'],{type:'image/svg+xml'}),'x.svg');
  const upload=await worker.fetch(new Request('https://audit.example/api/admin/upload',{method:'POST',body:f,headers:{Origin:'https://audit.example',Authorization:'Bearer '+token}}),env);
  const uploadData=await upload.json();record('UPLOAD-MISSING-R2',12,'Carga no dice éxito sin R2',!uploadData.success,{status:upload.status,success:uploadData.success});
  env.DB.fail=false;let writes=0;env.MEDIA_BUCKET={put:async()=>{writes++}};
  const active=await worker.fetch(new Request('https://audit.example/api/admin/upload',{method:'POST',body:f,headers:{Origin:'https://audit.example',Authorization:'Bearer '+token}}),env);
  record('UPLOAD-ACTIVE-CONTENT',12,'Carga rechaza SVG activo (bucket de prueba)',active.status===400||active.status===415,{status:active.status,writes});
}
const quantities=[0,-1,1.5,21,'1',null];
for(const q of quantities){const env=setup();const r=await worker.fetch(req('/api/stripe/create-checkout-session',{body:payload(undefined,{items:[{machineId:MACHINES_DATA[0].id,quantity:q}]})}),env);record('QTY-'+String(q),13,'Cantidad inválida '+String(q),r.status===400,{status:r.status})}
for(const [name,change]of Object.entries({total:{expectedTotal:1},currency:{currency:'EUR'},paid:{paymentType:'deposit'},variant:{items:[{machineId:MACHINES_DATA[0].id,quantity:1,variantId:'not-real'}]},product:{items:[{machineId:'not-real',quantity:1}]},email:{customer:{...customer,email:'bad'}},phone:{customer:{...customer,phone:'1'}},rfc:{requiresInvoice:true,customer:{...customer,rfc:''}}})){
  const r=await worker.fetch(req('/api/stripe/create-checkout-session',{body:payload(undefined,change)}),setup());record('INPUT-'+name,13,'Pedido inválido '+name,r.status===400,{status:r.status});
}
for(const m of MACHINES_DATA)for(const v of [undefined,...(m.variants||[])])for(const currency of ['MXN','USD'])for(const requiresInvoice of [false,true]){
  const base=currency==='MXN'?m.priceMXN:m.priceUSD;const amount=v?((currency==='MXN'?v.fixedPriceMXN:v.fixedPriceUSD)??base+(currency==='MXN'?v.extraPriceMXN||0:v.extraPriceUSD||0)):base;
  const expectedTotal=Math.round(amount*100)+(requiresInvoice?Math.round(amount*.16)*100:0);
  const env=setup();const r=await worker.fetch(req('/api/stripe/create-checkout-session',{body:payload(m,{currency,requiresInvoice,expectedTotal,customer:{...customer,rfc:'XAXX010101000'},items:[{machineId:m.id,quantity:1,variantId:v?.id}],price:1,paid:true,role:'admin'})}),env);
  const data=await r.json();const s=sessions.get(data.id);
  record('PRICE-'+m.id+'-'+(v?.id||'base')+'-'+currency+'-'+requiresInvoice,13,'Precio servidor: '+m.id+' / '+(v?.id||'base')+' / '+currency+' / factura '+requiresInvoice,r.status===200&&s?.amount_total===expectedTotal,{status:r.status,expectedTotal,actual:s?.amount_total});
}
{
  const env=setup();const make=async()=> (await(await worker.fetch(req('/api/stripe/create-checkout-session',{body:payload()}),env)).json());
  const first=await make();const s=sessions.get(first.id);const row=env.DB.sqlite.prepare('SELECT * FROM stripe_orders WHERE session_id = ?').get(s.id);
  const origin=await worker.fetch(req('/api/stripe/create-checkout-session',{body:payload(),headers:{Origin:'https://evil.invalid'}}),env);record('CHECKOUT-ORIGIN',13,'Checkout rechaza origen externo',origin.status===403,{status:origin.status});
  const large=await worker.fetch(req('/api/stripe/create-checkout-session',{body:payload(undefined,{padding:'x'.repeat(21000)})}),env);record('CHECKOUT-SIZE',17,'Checkout rechaza pedido excesivo',large.status===413,{status:large.status});
  for(const [name,query]of [['missing',''],['other-token',`?session_id=${s.id}&token=wrong`],['other-order',`?session_id=cs_other&token=${row.access_token}`],['sql-injection',"?session_id=%27%20OR%201=1--&token=wrong"]]){
    const r=await worker.fetch(req('/api/stripe/session'+query),env);record('ORDER-ACCESS-'+name,8,'Estado privado rechaza '+name,r.status===400||r.status===404,{status:r.status});
  }
  const pending=await (await worker.fetch(req('/api/stripe/session?session_id='+s.id+'&token='+row.access_token),env)).json();record('PENDING-NOT-PAID',13,'Pendiente no confirma pago',pending.status==='pending'&&pending.amountPaid===0,{status:pending.status,amountPaid:pending.amountPaid});
  for(const [name,opt]of [['bad-signature',{secret:'wrong'}],['expired-signature',{timestamp:Math.floor(Date.now()/1000)-1000}]]){
    const r=await event(env,'checkout.session.completed',{...s,payment_status:'paid'},opt);record('WEBHOOK-'+name,14,'Webhook rechaza '+name,r.status===400,{status:r.status});
  }
  for(const [name,change]of [['amount',{amount_total:1}],['currency',{currency:'usd'}],['reference',{client_reference_id:'other'}]]){
    const r=await event(env,'checkout.session.completed',{...s,payment_status:'paid',...change});record('PAYMENT-MISMATCH-'+name,13,'Confirmación rechaza '+name,r.status>=500,{status:r.status});
  }
  const paid={...s,payment_status:'paid'};let statuses=await Promise.all(Array.from({length:10},()=>event(env,'checkout.session.completed',paid)));
  const current=env.DB.sqlite.prepare('SELECT * FROM stripe_orders WHERE id = ?').get(row.id);record('WEBHOOK-CONCURRENT',14,'10 entregas concurrentes conservan un pedido pagado',statuses.every(r=>r.status===200)&&env.DB.count('stripe_orders')===1&&current.payment_status==='paid',{statuses:statuses.map(r=>r.status),orders:env.DB.count('stripe_orders'),state:current.payment_status});
  for(const type of ['checkout.session.expired','checkout.session.async_payment_failed'])await event(env,type,s);
  record('WEBHOOK-ORDERING',14,'Evento fallido/expirado no revierte pagado',env.DB.sqlite.prepare('SELECT payment_status FROM stripe_orders').get().payment_status==='paid',{state:env.DB.sqlite.prepare('SELECT payment_status FROM stripe_orders').get().payment_status});
  env.DB.fail=true;const dbfail=await event(env,'checkout.session.completed',paid);record('WEBHOOK-DB-FAIL',14,'Fallo D1 devuelve error para reintento Stripe',dbfail.status>=500,{status:dbfail.status});env.DB.fail=false;
  const second=await make();const secondS=sessions.get(second.id);const secondRow=env.DB.sqlite.prepare('SELECT * FROM stripe_orders WHERE session_id = ?').get(second.id);secondS.payment_status='paid';
  const back=await (await worker.fetch(req('/api/stripe/session?session_id='+second.id+'&token='+secondRow.access_token),env)).json();record('RETURN-BEFORE-WEBHOOK',14,'Regreso antes de webhook consulta Stripe',back.status==='paid',{state:back.status});
  const before=creations;const attempt=payload();const retryEnv=setup();await worker.fetch(req('/api/stripe/create-checkout-session',{body:attempt}),retryEnv);await worker.fetch(req('/api/stripe/create-checkout-session',{body:attempt}),retryEnv);record('CHECKOUT-RETRY',15,'Mismo intento de cliente reutiliza sesión',creations-before===1,{sessionsCreated:creations-before,reason:'Cada solicitud crea folio e idempotencyKey nuevos'});
  failStripe=true;const error=await worker.fetch(req('/api/stripe/create-checkout-session',{body:payload()}),env);record('STRIPE-FAIL-CLOSED',13,'Error Stripe no simula éxito',error.status>=500,{status:error.status});failStripe=false;
  const token=await login(env);const admin=await worker.fetch(req('/api/admin/stripe-orders',{headers:{Origin:'https://audit.example',Authorization:'Bearer '+token}}),env);const adminData=await admin.json();record('ADMIN-PRIVATE-FIELDS',8,'Lista administrativa no devuelve tokens de cliente',!JSON.stringify(adminData).includes(row.access_token),{orders:adminData.orders.length});
  record('STRIPE-CACHE',16,'Datos privados Stripe con no-store',admin.headers.get('Cache-Control')==='no-store',{header:admin.headers.get('Cache-Control')});
  const invalid=await worker.fetch(req('/api/admin/stripe-orders/'+row.id,{body:{status:'fake',paid:true,total:1},headers:{Origin:'https://audit.example',Authorization:'Bearer '+token}}),env);record('ORDER-STATUS-ALLOWLIST',11,'Rechazo de estado de fabricación arbitrario',invalid.status===400,{status:invalid.status});
  const names=env.DB.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);record('MIGRATIONS',11,'Migraciones actuales recrean once tablas',names.filter(x=>x!=='sqlite_sequence').length===11,{tables:names});
  env.DB.sqlite.exec('CREATE TABLE fixture_unique(id INTEGER PRIMARY KEY);INSERT INTO fixture_unique VALUES(1)');let duplicateRejected=false;try{env.DB.sqlite.exec('INSERT INTO fixture_unique VALUES(1)')}catch{duplicateRejected=true}record('DB-UNIQUE',11,'SQLite conserva claves únicas',duplicateRejected,{duplicateRejected});
}

// Session, CSRF, public receipt ownership and concurrency regression tests.
{
 const env=setup(); const response=await worker.fetch(req('/api/admin/login',{body:{password:env.ADMIN_PASSWORD}}),env);
 const cookie=response.headers.get('Set-Cookie'); const {token}=await response.json();
 record('COOKIE-FLAGS',7,'Cookie Secure HttpOnly SameSite Strict y prefijo Host',cookie?.startsWith('__Host-') && ['Secure','HttpOnly','SameSite=Strict','Path=/'].every(x=>cookie.includes(x)),{flags:['Secure','HttpOnly','SameSite=Strict','Path=/']});
 const verified=await worker.fetch(req('/api/admin/verify',{headers:{Cookie:cookie.split(';')[0]}}),env);
 record('COOKIE-AUTH',7,'Acceso mediante cookie sin token JavaScript',verified.status===200,{status:verified.status});
 const csrf=await worker.fetch(req('/api/admin/site-config',{body:{businessName:'Ataque'},headers:{Cookie:cookie.split(';')[0],Origin:'https://evil.invalid'}}),env);
 record('CSRF-COOKIE',9,'Escritura con cookie válida y origen externo denegada',csrf.status===403,{status:csrf.status});
 env.DB.sqlite.prepare('UPDATE admin_sessions SET last_seen = ?').run(Date.now()-1800001);
 const idle=await worker.fetch(req('/api/admin/verify',{headers:{Authorization:'Bearer '+token}}),env);
 record('SESSION-IDLE',7,'Sesión inactiva más de 30 minutos rechazada',idle.status===401,{status:idle.status});
 const lead={customerName:'Ficticio A',phone:'6391234567',email:'a@example.com',items:[],estimatedTotal:0,status:'Nueva'};
 const id=crypto.randomUUID(); const first=await worker.fetch(req('/api/notify/quote',{body:{requestId:id,record:lead}}),env);
 const retry=await worker.fetch(req('/api/notify/quote',{body:{requestId:id,record:lead}}),env);
 const foreign=await worker.fetch(req('/api/notify/quote',{body:{requestId:id,record:{...lead,customerName:'Ficticio B'}}}),env);
 const foreignData=await foreign.json();
 record('PUBLIC-RETRY',11,'Solicitud idéntica se guarda una sola vez',first.status===200&&retry.status===200&&env.DB.count('app_records')===1,{statuses:[first.status,retry.status]});
 record('PUBLIC-ID-COLLISION',8,'Otra persona no recupera datos reutilizando referencia conocida',foreign.status===409&&!JSON.stringify(foreignData).includes('a@example.com'),{status:foreign.status});
 const many=setup(); const attempt=payload(); const before=creations;
 const results=await Promise.all(Array.from({length:8},()=>worker.fetch(req('/api/stripe/create-checkout-session',{body:attempt}),many).then(async r=>({status:r.status,...await r.json()}))));
 record('CHECKOUT-CONCURRENT',15,'Ocho peticiones del mismo carrito usan una sesión Stripe',results.every(r=>r.status===200)&&new Set(results.map(r=>r.id)).size===1&&creations-before===1,{requests:8,distinctSessions:new Set(results.map(r=>r.id)).size,orders:many.DB.count('stripe_orders')});
 const load=setup();const start=Date.now();const responses=await Promise.all(Array.from({length:100},(_,i)=>worker.fetch(req('/api/notify/quote',{body:{requestId:crypto.randomUUID(),record:lead},headers:{'CF-Connecting-IP':`198.51.100.${i+1}`}}),load)));
 record('CAPACITY-100-WRITES',19,'100 solicitudes concurrentes aisladas, IP distintas, quedan guardadas',responses.every(r=>r.status===200)&&load.DB.count('app_records')===100,{requests:100,saved:load.DB.count('app_records'),errors:responses.filter(r=>r.status!==200).length,elapsedMs:Date.now()-start,environment:'SQLite local, NO benchmark de Cloudflare'});
 const dump=load.DB.sqlite.prepare('SELECT * FROM app_records ORDER BY id').all();const restored=setup(); const insert=restored.DB.sqlite.prepare('INSERT INTO app_records(kind,id,data_json,updated_at,deleted_at,request_hash) VALUES (?,?,?,?,?,?)');for(const row of dump) insert.run(row.kind,row.id,row.data_json,row.updated_at,row.deleted_at,row.request_hash);
 record('RESTORE-LOCAL',24,'Respaldo y restauración de 100 registros en una base separada',JSON.stringify(dump)===JSON.stringify(restored.DB.sqlite.prepare('SELECT * FROM app_records ORDER BY id').all()),{restored:restored.DB.count('app_records'),environment:'Fixture local, no restauración D1 real'});
 const malformedEnv=setup(); const malformedToken=await login(malformedEnv);
 const malformed=await worker.fetch(req('/api/admin/machines',{body:{machines:[{id:'bad',name:'bad',sku:'bad',priceMXN:1,priceUSD:1}]},headers:{Authorization:'Bearer '+malformedToken}}),malformedEnv);
 record('CATALOG-MALFORMED',9,'Catálogo incompleto no puede romper la tienda',malformed.status===400,{status:malformed.status});
}

// Browser storage and service failure simulation, no transmission to email recipients.
class Storage{m=new Map();getItem(k){return this.m.get(k)||null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
globalThis.window={localStorage:new Storage(),dispatchEvent(){}};globalThis.localStorage=window.localStorage;globalThis.sessionStorage=new Storage();
const store=await import(new URL('store.mjs',cache));
const {AdminService}=await import(new URL('service.mjs',cache));
const email=await import(new URL('email.mjs',cache));
const browserEnv=setup();const browserToken=await login(browserEnv);
globalThis.fetch=async(path,options={})=>worker.fetch(new Request('https://audit.example'+path,{...options,headers:{Origin:'https://audit.example','Content-Type':'application/json',Authorization:'Bearer '+browserToken,...options.headers}}),browserEnv);
await store.saveStoredMachines(MACHINES_DATA.map((m,i)=>i===0?{...m,priceMXN:1}:m));const customerA=store.getStoredMachines()[0].priceMXN;
globalThis.localStorage=new Storage();window.localStorage=localStorage;await store.refreshPublicStore();const customerB=store.getStoredMachines()[0].priceMXN;
record('CATALOG-CROSS-BROWSER',18,'Edición de catálogo compartida entre navegadores',customerA===customerB,{browserA:customerA,browserB:customerB},'Bloqueante');
const lead={customerName:'Ficticio',phone:'6391234567',email:'audit@example.com',stateOrCity:'Ficticio',businessType:'Otro',items:[],estimatedTotal:0,status:'Nueva',priority:'Alta',notes:'Texto de prueba'};
const submitted=await worker.fetch(req('/api/notify/quote',{body:{requestId:crypto.randomUUID(),record:lead}}),browserEnv);
record('NOTIFY-VALID-DURABLE',11,'Cotización válida queda guardada en SQLite',submitted.status===200&&browserEnv.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM app_records WHERE kind='quotes'").get().n===1,{status:submitted.status});
await store.refreshAdminStore();const qa=store.getStoredQuotes().length;
globalThis.localStorage=new Storage();window.localStorage=localStorage;globalThis.sessionStorage=new Storage();await store.refreshAdminStore();const qb=store.getStoredQuotes().length;
record('QUOTES-CROSS-BROWSER',18,'Cotización visible desde otro navegador administrador',qa===qb&&qb===1,{browserA:qa,browserB:qb},'Bloqueante');
globalThis.fetch=async()=>{throw Error('Fixture network offline')};
let offlineRejected=false;try{await email.sendContactInquiryEmail({name:'Ficticio',phone:'6391234567',email:'audit@example.com',message:'Test no enviado'})}catch{offlineRejected=true}
record('EMAIL-FAILURE',18,'Formulario informa fallo de guardado sin conexión',offlineRejected,{rejected:offlineRejected},'Alta');
const report=await AdminService.sendTestReport('audit@example.com');record('REPORT-FALSE-SUCCESS',25,'Informe no inventa entrega de correo',!report.success,{success:report.success});
const cleanup=await AdminService.cleanupCloudflareD1();record('CLEANUP-FALSE-SUCCESS',24,'Limpieza no inventa éxito sin servidor',!cleanup.success,{success:cleanup.success,freedKB:cleanup.freedKB});
const healthSource=await readFile('src/components/admin/tabs/SaludWebTab.tsx','utf8');
record('HEALTH-REAL',25,'Salud consulta backend y no usa valores aleatorios',healthSource.includes('/api/admin/health')&&!healthSource.includes('Math.random'),{serverEndpoint:healthSource.includes('/api/admin/health')},'Alta');
const securitySource=await readFile('src/components/admin/tabs/SeguridadTab.tsx','utf8');
record('SECURITY-REAL',17,'Controles ficticios de seguridad retirados',!securitySource.includes('handleToggleRateLimiting')&&!securitySource.includes('IP bloqueada correctamente'),{serverLimitCoveredBy:'LOGIN-RATE'},'Alta');
globalThis.fetch=nativeFetch;
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await writeFile(out+'/checks-local.json',JSON.stringify({date:new Date().toISOString(),commit,environment:'SQLite in-memory + Stripe/email fixtures (no external effects)',checks,summary:{total:checks.length,pass:checks.filter(x=>x.result==='PASA').length,fail:checks.filter(x=>x.result==='FALLA').length}},null,2));
console.log(JSON.stringify({total:checks.length,pass:checks.filter(x=>x.result==='PASA').length,fail:checks.filter(x=>x.result==='FALLA').length,failures:checks.filter(x=>x.result==='FALLA').map(({id,name,evidence})=>({id,name,evidence}))},null,2));

if(checks.some(x=>x.result==='FALLA')) process.exitCode=1;
