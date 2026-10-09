import { useEffect, useState } from 'react';
import { getStoredHotspots } from '../../../utils/adminStore';
export function MapaClicsTab() {
  const [hotspots, setHotspots] = useState(getStoredHotspots);
  useEffect(() => { const update = () => setHotspots(getStoredHotspots()); window.addEventListener('mr_clicks_updated', update); return () => window.removeEventListener('mr_clicks_updated', update); }, []);
  return <div className="p-4 md:p-8 space-y-4 max-w-5xl mx-auto">
    <h2 className="text-xl font-bold">Clics de este navegador</h2>
    <p>Estos contadores pertenecen únicamente a este navegador. Las estadísticas globales de visitantes, dispositivos, ubicación y recorridos todavía no están configuradas.</p>
    <table className="w-full bg-white border text-sm"><thead><tr><th className="text-left p-3">Elemento</th><th className="text-left p-3">Clics locales</th></tr></thead><tbody>{hotspots.map(item => <tr key={item.id} className="border-t"><td className="p-3">{item.elementName}</td><td className="p-3">{item.clicksCount}</td></tr>)}</tbody></table>
  </div>;
}
