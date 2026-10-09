import React, { useEffect, useState } from 'react';
import { storeRequest } from '../../../services/storeApi';
export const SaludWebTab: React.FC = () => {
  const [health,setHealth]=useState<any>(null);const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const refresh=async()=>{setLoading(true);try{setHealth(await storeRequest('/api/admin/health'));setError('');}catch(e){setError(e instanceof Error?e.message:'No se pudo consultar el servicio.');}finally{setLoading(false);}};
  useEffect(()=>{void refresh();},[]);
  return <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-5 text-slate-900">
    <h2 className="text-xl font-bold">Estado de los servicios</h2>
    <button onClick={refresh} disabled={loading} className="bg-blue-600 text-white rounded-lg px-4 py-2">{loading?'Comprobando…':'Comprobar ahora'}</button>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {health&&<dl className="grid sm:grid-cols-2 gap-4">
      {[['Worker','Responde'],['Base de datos',health.database?'Consulta correcta':'Sin verificar'],['Tiempo de consulta D1',`${health.databaseLatencyMs} ms`],['Imágenes R2',health.r2Configured?'Configurado':'Pendiente de configurar'],['Stripe',health.stripeConfigured?`Claves configuradas (${health.stripeMode === 'live' ? 'cobros reales' : 'modo de prueba'})`:'Pendiente de configurar'],['Comprobado',new Date(health.checkedAt).toLocaleString('es-MX')]].map(([label,value])=><div key={label} className="bg-white border rounded-xl p-4"><dt className="text-slate-500">{label}</dt><dd className="font-bold">{value}</dd></div>)}
    </dl>}
    <p className="text-sm text-slate-600">Esta comprobación mide una respuesta del servidor. La disponibilidad histórica, el uso de caché y Core Web Vitals requieren monitoreo de usuarios reales.</p>
    <a className="text-blue-600 underline" href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer">Consultar métricas de Cloudflare</a>
  </div>;
};
