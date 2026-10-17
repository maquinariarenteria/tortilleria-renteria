import React, { useEffect, useState } from 'react';
import { storeRequest } from '../../../services/storeApi';
export const SaludWebTab: React.FC = () => {
  const [health,setHealth]=useState<any>(null);const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const [emailMessage,setEmailMessage]=useState(''); const [sendingTest,setSendingTest]=useState(false);
  const refresh=async()=>{setLoading(true);try{setHealth(await storeRequest('/api/admin/health'));setError('');}catch(e){setError(e instanceof Error?e.message:'No se pudo consultar el servicio.');}finally{setLoading(false);}};
  useEffect(()=>{void refresh();},[]);
  const testEmail=async()=>{setSendingTest(true);setEmailMessage('');try{const data=await storeRequest('/api/admin/order-notifications/test',{method:'POST',body:'{}'});setEmailMessage(data.message);}catch(e){setEmailMessage(e instanceof Error?e.message:'No se pudo comprobar el correo.');}finally{setSendingTest(false);}};
  return <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-5 text-slate-900">
    <h2 className="text-xl font-bold">Estado de los servicios</h2>
    <button onClick={refresh} disabled={loading} className="bg-blue-600 text-white rounded-lg px-4 py-2">{loading?'Comprobando…':'Comprobar ahora'}</button>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {health&&<dl className="grid sm:grid-cols-2 gap-4">
      {[['Worker','Responde'],['Base de datos',health.database?'Consulta correcta':'Sin verificar'],['Tiempo de consulta D1',`${health.databaseLatencyMs} ms`],['Almacenamiento de fotos',health.mediaProvider === 'supabase' ? 'Supabase configurado' : health.r2Configured ? 'Cloudflare R2 configurado' : 'Archivos actuales en Cloudflare; nuevas subidas pendientes'],['Stripe',health.stripeConfigured?`Claves configuradas (${health.stripeMode === 'live' ? 'cobros reales' : 'modo de prueba'})`:'Pendiente de configurar'],['Comprobado',new Date(health.checkedAt).toLocaleString('es-MX')]].map(([label,value])=><div key={label} className="bg-white border rounded-xl p-4"><dt className="text-slate-500">{label}</dt><dd className="font-bold">{value}</dd></div>)}
    </dl>}
    {health?.orderEmail&&<section className="bg-white border rounded-xl p-5 space-y-3">
      <h3 className="font-bold">Avisos de compra por correo</h3>
      <p>{health.orderEmail.provider}: {health.orderEmail.configured?'Conexión configurada':'Pendiente de configurar'}.</p>
      <p className="text-sm">Aceptados por el proveedor: {health.orderEmail.sent} · Pendientes: {health.orderEmail.pending} · Requieren revisión: {health.orderEmail.blocked}.</p>
      {health.orderEmail.activationPending>0&&<p className="text-amber-800">Avisos esperando verificación del correo: {health.orderEmail.activationPending}. Se conservan en la tienda hasta que confirmes «Verify email address» en el mensaje de Cloudflare.</p>}
      {health.orderEmail.blocked>0&&<p role="alert" className="text-amber-800">Hay avisos que requieren revisar el envío. Los pagos y pedidos siguen registrados en Ventas.</p>}
      <button onClick={testEmail} disabled={sendingTest||!health.orderEmail.configured} className="bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">{sendingTest?'Enviando prueba…':'Enviar correo de prueba'}</button>
      {emailMessage&&<p role="status" className="text-sm">{emailMessage}</p>}
      <p className="text-sm text-slate-600">La aceptación del proveedor no confirma llegada a la bandeja de entrada. Cloudflare requiere verificar el correo de Maquinaria Rentería una sola vez; confirma «Verify email address» y revisa spam.</p>
    </section>}
    <p className="text-sm text-slate-600">Esta comprobación mide una respuesta del servidor. La disponibilidad histórica, el uso de caché y Core Web Vitals requieren monitoreo de usuarios reales.</p>
    <a className="text-blue-600 underline" href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer">Consultar métricas de Cloudflare</a>
  </div>;
};
