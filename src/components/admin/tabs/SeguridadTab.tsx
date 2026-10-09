import React,{useEffect,useState} from 'react';
import {storeRequest} from '../../../services/storeApi';
export const SeguridadTab:React.FC=()=>{
 const [logs,setLogs]=useState<any[]>([]);const [error,setError]=useState('');
 useEffect(()=>{void storeRequest('/api/admin/audit-log').then(d=>setLogs(d.logs)).catch(e=>setError(e.message));},[]);
 return <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-5 text-slate-900">
  <h2 className="text-xl font-bold">Seguridad y registro de cambios</h2>
  <div className="bg-white border rounded-xl p-5 space-y-2 text-sm">
   <p>La sesión se comprueba en el servidor y se guarda en una cookie protegida.</p>
   <p>Caduca tras 30 minutos sin actividad y tiene una duración máxima de 8 horas. Cerrar sesión revoca el acceso.</p>
   <p>Acceso, solicitudes de contacto y creación de pagos: máximo 10 intentos por IP cada 10 minutos.</p>
   <p>La administración tiene una cuenta compartida. Las cuentas individuales y la autenticación de dos factores están pendientes.</p>
  </div>
  <p className="text-sm">Las reglas de bloqueo de IP, WAF y modo bajo ataque se administran en Cloudflare.</p>
  <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Abrir Cloudflare</a>
  {error&&<p role="alert" className="text-red-700">{error}</p>}
  <h3 className="font-bold">Cambios registrados por el servidor</h3>
  {logs.length===0?<p className="text-slate-500">Todavía no hay registros disponibles.</p>:<div className="overflow-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">Fecha</th><th className="text-left">Acción</th><th className="text-left">Referencia</th></tr></thead><tbody>{logs.map(l=><tr key={l.id} className="border-t"><td className="py-2">{new Date(l.timestamp).toLocaleString('es-MX')}</td><td>{l.action}</td><td className="break-all">{l.details}</td></tr>)}</tbody></table></div>}
 </div>;
};
