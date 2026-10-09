import { useState } from 'react';
import { getSiteConfig, saveSiteConfig, SiteConfig } from '../../../utils/adminStore';
import { storeRequest } from '../../../services/storeApi';

const fields: [keyof SiteConfig, string][] = [
  ['businessName', 'Nombre del negocio'], ['slogan', 'Eslogan'], ['experienceYears', 'Experiencia'],
  ['phone1', 'Teléfono principal'], ['phone2', 'Teléfono secundario'], ['email', 'Correo de contacto'],
  ['address', 'Dirección del taller'], ['facebookUrl', 'Facebook'], ['tiktokUrl', 'TikTok'],
  ['shippingNotice', 'Información de envío'],
];
export function AjustesTab() {
  const [config, setConfig] = useState(getSiteConfig);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMessage('');
    try { await saveSiteConfig(config); setMessage('Ajustes guardados en el servidor y publicados en la tienda.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudieron guardar los ajustes.'); }
    finally { setBusy(false); }
  };
  const cleanup = async () => {
    setBusy(true); setMessage('');
    try { const result = await storeRequest('/api/admin/cleanup', { method: 'POST', body: '{}' }); setMessage(`${result.message} Registros temporales eliminados: ${result.deletedRows}.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo completar la limpieza.'); }
    finally { setBusy(false); }
  };
  return <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
    <h1 className="text-2xl font-bold">Ajustes de la tienda</h1>
    <p className="text-slate-600">Estos cambios se guardan en la base de datos y se comparten con todos los visitantes.</p>
    {message && <p role="status" className="p-4 bg-blue-50 rounded-lg">{message}</p>}
    <form onSubmit={save} className="grid md:grid-cols-2 gap-4 bg-white border rounded-xl p-5">
      {fields.map(([key, label]) => <div key={key}>
        <label htmlFor={`setting-${key}`} className="block font-semibold mb-1">{label}</label>
        <input id={`setting-${key}`} value={config[key]} maxLength={1000} type={key === 'email' ? 'email' : 'text'} onChange={e => setConfig({ ...config, [key]: e.target.value })} className="w-full border rounded-lg p-3" />
      </div>)}
      <button disabled={busy} className="bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50">{busy ? 'Procesando…' : 'Guardar ajustes'}</button>
    </form>
    <section className="bg-white border rounded-xl p-5 space-y-3">
      <h2 className="text-lg font-bold">Cloudflare y consumo</h2>
      <p>Consulta las mediciones, cuotas vigentes y facturación directamente en tu cuenta. El navegador no puede medir el espacio utilizado en D1, las solicitudes globales ni la capacidad libre de Cloudflare.</p>
      <a className="text-blue-700 underline" href="https://dash.cloudflare.com/6d3ba7965209c1f48cb1e97291d3e6f8/workers-and-pages" target="_blank" rel="noopener noreferrer">Abrir Cloudflare</a>
      <p>La limpieza elimina únicamente sesiones y contadores de seguridad vencidos. Conserva pedidos, citas, cotizaciones y registros de auditoría.</p>
      <button type="button" disabled={busy} onClick={cleanup} className="border rounded-lg p-3 disabled:opacity-50">Limpiar sesiones vencidas</button>
    </section>
    <section className="bg-white border rounded-xl p-5 space-y-3">
      <h2 className="text-lg font-bold">Servicios pendientes de configurar</h2>
      <p>Las solicitudes se registran en el administrador. El envío automático de correos y reportes todavía no está configurado. La carga de nuevas imágenes requiere conectar un bucket R2.</p>
      <p>Las claves de Stripe y la contraseña del administrador se gestionan como secretos del Worker en Cloudflare.</p>
    </section>
  </div>;
}
