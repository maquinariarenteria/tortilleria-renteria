import React, { useState, useEffect } from 'react';
import { getStoredHotspots } from '../../../utils/adminStore';
import { INITIAL_USER_JOURNEYS } from '../../../utils/adminStore';
import { MousePointer, ArrowRight, Smartphone, Monitor, MapPin, Zap } from 'lucide-react';

export const MapaClicsTab: React.FC = () => {
  const [hotspots, setHotspots] = useState(getStoredHotspots());
  const journeys = INITIAL_USER_JOURNEYS;

  useEffect(() => {
    const handleUpdate = () => {
      setHotspots(getStoredHotspots());
    };
    window.addEventListener('mr_clicks_updated', handleUpdate);
    return () => window.removeEventListener('mr_clicks_updated', handleUpdate);
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6 text-slate-800 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Mapa de Clics y Recorridos de Usuarios</span>
            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              Métricas en Tiempo Real
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analiza dónde hacen clic los clientes y las rutas más efectivas que generan cotizaciones y ventas en la web de Maquinaria Rentería.
          </p>
        </div>
      </div>

      {/* Row 1: Hotspots & Device/Geo Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hotspots Card */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-blue-600" />
            <span>Elementos Más Clicados en la Web</span>
          </h3>

          <div className="space-y-4 pt-1">
            {hotspots.map((spot) => (
              <div key={spot.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{spot.elementName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                      {spot.section}
                    </span>
                  </div>
                  <div className="text-right">
                    <b className="text-blue-700 font-semibold">{spot.clicksCount} clics</b>
                    <span className="text-slate-400 text-[11px] ml-1.5">({spot.percentage}%)</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(spot.percentage * 2.5, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices & Locations */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Device Split */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Dispositivos de los Clientes</h3>
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <Smartphone className="w-5 h-5 text-blue-600 mx-auto" />
                <span className="text-slate-500 text-[11px] block font-medium">Móviles</span>
                <b className="text-slate-900 text-base">74%</b>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <Monitor className="w-5 h-5 text-cyan-600 mx-auto" />
                <span className="text-slate-500 text-[11px] block font-medium">Escritorio</span>
                <b className="text-slate-900 text-base">26%</b>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic text-center leading-tight">
              Recomendación: El botón de WhatsApp móvil es el canal de cierre #1 de prospectos.
            </p>
          </div>

          {/* Top States */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2.5 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Estados con Más Visitas</span>
            </h3>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>1. Chihuahua (Delicias, Juárez, Chih.)</span>
                <b className="text-emerald-700 font-semibold">38%</b>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>2. Nuevo León (Monterrey)</span>
                <b className="text-emerald-700 font-semibold">22%</b>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>3. Sinaloa (Culiacán, Mazatlán)</span>
                <b className="text-emerald-700 font-semibold">18%</b>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>4. Sonora (Hermosillo, Obregón)</span>
                <b className="text-emerald-700 font-semibold">12%</b>
              </div>
              <div className="flex justify-between py-1">
                <span>5. CDMX y Estado de México</span>
                <b className="text-emerald-700 font-semibold">10%</b>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Row 2: User Journeys (Recorridos) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Rutas de Navegación Más Frecuentes (User Journeys)</span>
        </h3>

        <div className="space-y-3">
          {journeys.map((j) => (
            <div
              key={j.id}
              className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {j.path.split(' -> ').map((step, idx, arr) => (
                  <React.Fragment key={idx}>
                    <span className={`px-2.5 py-1 rounded-lg font-semibold ${
                      idx === arr.length - 1 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
                    }`}>
                      {step}
                    </span>
                    {idx < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Sesiones</span>
                  <b className="text-slate-800">{j.sessionsCount} ({j.percentage}%)</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Conversión</span>
                  <b className="text-blue-700">{j.conversionRate}%</b>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
