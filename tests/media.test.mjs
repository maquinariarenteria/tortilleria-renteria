import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
import { Database } from './database.mjs';
const dir = new URL('../node_modules/.cache/media-tests/', import.meta.url);
await mkdir(dir, { recursive: true });
await build({ entryPoints: ['src/worker/index.ts'], outfile: new URL('worker.mjs',dir).pathname, bundle:true, platform:'node', format:'esm', packages:'external' });
await build({ entryPoints: ['src/data/machines.ts'], outfile: new URL('catalog.mjs',dir).pathname, bundle:true, platform:'node', format:'esm' });
const {default:worker} = await import(new URL('worker.mjs',dir));
const {MACHINES_DATA} = await import(new URL('catalog.mjs',dir));
after(()=>rm(dir,{recursive:true,force:true}));
const key = 'catalog/12345678-1234-4234-8234-123456789012.jpg';
const origin = 'https://shop.example.com';
function req(path, body, token, overrideOrigin=origin) {
  return new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:overrideOrigin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});
}
async function setup() {
  const env = {DB:new Database(),ADMIN_PASSWORD:'fixture-password',SITE_URL:origin,ASSETS:{fetch:async()=>new Response('static')},SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_fixture_only',SUPABASE_MEDIA_BUCKET:'renteria-fotos'};
  const r = await worker.fetch(req('/api/admin/login',{password:env.ADMIN_PASSWORD}),env);
  return {env,token:(await r.json()).token};
}
async function withSupabase(run) {
  const previous = globalThis.fetch; const calls=[];
  let handler=async()=>Response.json([]);
  globalThis.fetch=async(url,init={})=>{
    assert.equal(new URL(url).origin,'https://fixture.supabase.co');
    assert.equal(new Headers(init.headers).get('apikey'),'sb_secret_fixture_only');
    assert.equal(init.redirect,'manual');
    calls.push({url:String(url),...init}); return handler(url,init);
  };
  try {await run({calls,respond:fn=>handler=fn});} finally {globalThis.fetch=previous;}
}
function catalog(env) { return JSON.parse(env.DB.sqlite.prepare("SELECT data_json FROM app_records WHERE kind='catalog' AND id='main'").get()?.data_json || JSON.stringify(MACHINES_DATA)); }

test('Photo administration requires authentication and same-origin writes',async()=>{
  const {env,token}=await setup();
  for(const [path,body] of [['/api/admin/media/status',undefined],['/api/admin/media/sync',{}],['/api/admin/upload',{}]]) assert.equal((await worker.fetch(req(path,body),env)).status,401);
  assert.equal((await worker.fetch(req('/api/admin/media/sync',{},token,'https://evil.example'),env)).status,403);
});
test('Sync reads real photo records, preserves prices/specifications and records successful time',async()=>withSupabase(async({calls,respond})=>{
  const {env,token}=await setup();respond(async()=>Response.json([{machine_id:MACHINES_DATA[0].id,object_key:key}]));
  const r=await worker.fetch(req('/api/admin/media/sync',{},token),env); const result=await r.json();
  assert.equal(r.status,200); assert.equal(result.updatedCount,1); assert.equal(result.photoCount,1);
  assert.deepEqual(catalog(env),MACHINES_DATA.map((m,i)=>i===0?{...m,imageUrl:'/media/'+key}:m));
  assert.match(calls[0].url,/\/rest\/v1\/catalog_photos\?/);
  const status=await(await worker.fetch(req('/api/admin/media/status',undefined,token),env)).json();
  assert.equal(status.lastSync.syncedAt,result.syncedAt);assert.equal(status.provider,'supabase');
  const repeat=await(await worker.fetch(req('/api/admin/media/sync',{},token),env)).json();assert.equal(repeat.updatedCount,0);
}));
test('Empty metadata does not erase existing photos',async()=>withSupabase(async()=>{
  const {env,token}=await setup();const before=catalog(env);
  assert.equal((await worker.fetch(req('/api/admin/media/sync',{},token),env)).status,200);assert.deepEqual(catalog(env),before);
}));
test('Upstream redirects are rejected without forwarding the server key',async()=>withSupabase(async({respond,calls})=>{
  const {env,token}=await setup();respond(async()=>new Response(null,{status:302,headers:{Location:'https://untrusted.example'}}));
  const r=await worker.fetch(req('/api/admin/media/sync',{},token),env);
  assert.equal(r.status,503);assert.equal(calls.length,1);assert.deepEqual(catalog(env),MACHINES_DATA);
}));
test('Unavailable or invalid upstream cannot report success or alter catalog',async()=>withSupabase(async({respond})=>{
  for(const payload of [new Response('paused',{status:540}),Response.json([{machine_id:MACHINES_DATA[0].id,object_key:'../private.env'}]),Response.json([{machine_id:MACHINES_DATA[0].id,object_key:'https://evil.example/photo.jpg'}])]) {
    const {env,token}=await setup();respond(async()=>payload);const before=catalog(env);
    const r=await worker.fetch(req('/api/admin/media/sync',{},token),env);assert.equal(r.status,503);assert.equal((await r.json()).success,false);assert.deepEqual(catalog(env),before);
    assert.equal(env.DB.sqlite.prepare("SELECT count(*) AS n FROM app_records WHERE kind='media-sync'").get().n,0);
  }
}));
test('Concurrent catalog edits cannot be overwritten by photo sync',async()=>withSupabase(async({respond})=>{
  const {env,token}=await setup();const changed=MACHINES_DATA.map((m,i)=>i===0?{...m,priceMXN:m.priceMXN+100}:m);
  respond(async()=>{env.DB.sqlite.prepare("INSERT INTO app_records(kind,id,data_json,updated_at) VALUES('catalog','main',?,?)").run(JSON.stringify(changed),new Date().toISOString());return Response.json([{machine_id:MACHINES_DATA[0].id,object_key:key}]);});
  assert.equal((await worker.fetch(req('/api/admin/media/sync',{},token),env)).status,409);assert.deepEqual(catalog(env),changed);
}));
test('Image assignments are saved in Supabase; price-only changes do not require it',async()=>withSupabase(async({calls,respond})=>{
  const {env,token}=await setup();respond(async()=>new Response(null,{status:204}));
  const machines=MACHINES_DATA.map((m,i)=>i===0?{...m,imageUrl:'/media/'+key}:m);
  assert.equal((await worker.fetch(req('/api/admin/machines',{machines},token),env)).status,200);
  const rows=JSON.parse(calls[0].body);assert.deepEqual(rows.map(({updated_at,...r})=>r),[{machine_id:MACHINES_DATA[0].id,object_key:key}]);
  calls.length=0;machines[0].priceMXN+=100;
  assert.equal((await worker.fetch(req('/api/admin/machines',{machines},token),env)).status,200);assert.equal(calls.length,0);
  machines[0].imageUrl=MACHINES_DATA[0].imageUrl;
  assert.equal((await worker.fetch(req('/api/admin/machines',{machines},token),env)).status,200);assert.equal(JSON.parse(calls[0].body)[0].object_key,null);
}));
test('Image upload validates signatures and never exposes server key',async()=>withSupabase(async({calls,respond})=>{
  const {env,token}=await setup();respond(async()=>Response.json({Key:'stored'}));
  for(const valid of [false,true]) {
    const form=new FormData();form.append('file',new Blob([valid?new Uint8Array([255,216,255,0,0,0,0,0,0,0,0,0]):'<svg onload="alert(1)"></svg>'],{type:valid?'image/jpeg':'image/svg+xml'}),'photo.jpg');
    const r=await worker.fetch(new Request(origin+'/api/admin/upload',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token},body:form}),env);
    assert.equal(r.status,valid?200:415);const body=await r.text();assert.ok(!body.includes(env.SUPABASE_SECRET_KEY));
    if(valid){assert.match(JSON.parse(body).url,/^\/media\/catalog\/[a-f0-9-]{36}\.jpg$/);assert.equal(calls[0].method,'POST');}
  }
}));
test('Photo delivery stays on the website and rejects invalid routes and active content',async()=>withSupabase(async({calls,respond})=>{
  const {env}=await setup();respond(async()=>new Response('image-bytes',{headers:{'Content-Type':'image/jpeg',etag:'fixture-etag'}}));
  const r=await worker.fetch(req('/media/'+key),env);assert.equal(r.status,200);assert.equal(await r.text(),'image-bytes');assert.equal(r.headers.get('X-Content-Type-Options'),'nosniff');assert.ok(!JSON.stringify([...r.headers]).includes(env.SUPABASE_SECRET_KEY));
  assert.match(calls[0].url,/\/storage\/v1\/object\/authenticated\/renteria-fotos\/catalog\//);
  assert.equal((await worker.fetch(req('/media/catalog/bad.svg'),env)).status,404);
  respond(async()=>new Response('<script/>',{headers:{'Content-Type':'text/html'}}));assert.equal((await worker.fetch(req('/media/'+key),env)).status,404);
}));
test('Missing or unsafe configuration fails closed without outgoing requests',async()=>withSupabase(async({calls})=>{
  const {env,token}=await setup();env.SUPABASE_URL='https://evil.example';
  assert.equal((await worker.fetch(req('/api/admin/media/sync',{},token),env)).status,503);assert.equal(calls.length,0);
  delete env.SUPABASE_SECRET_KEY;
  assert.equal((await worker.fetch(req('/api/admin/media/sync',{},token),env)).status,503);
  assert.equal((await(await worker.fetch(req('/api/admin/media/status',undefined,token),env)).json()).provider,'static');
}));
