import React from 'react';
import { getStoredHotspots } from '../../../utils/adminStore';
import { INITIAL_USER_JOURNEYS } from '../../../utils/adminStore';
import { MousePointer, ArrowRight, Smartphone, Monitor, MapPin, Zap } from 'lucide-react';

export const MapaClicsTab: React.FC = () => {
  const hotspots = getStoredHotspots();
  const journeys = INITIAL_USER_JOURNEYS;

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Mapa de Clics y Recorridos de Usuarios</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
              Heatmap Activo
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analiza dónde hacen clic los clientes y las rutas más efectivas que generan ventas y cotizaciones.
          </p>
        </div>
      </div>

      {/* Row 1: Hotspots & Device/Geo Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hotspots Card */}
        <div className="lg:col-span-8 bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-purple-400" />
            <span>Elementos Más Clicados en la Web</span>
          </h3>

          <div className="space-y-4 pt-1">
            {hotspots.map((spot) => (
              <div key={spot.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{spot.elementName}</span>
                    <span className="text-[10px] bg-[#1a1f33] text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                      {spot.section}
                    </span>
                  </div>
                  <div className="text-right">
                    <b className="text-emerald-400">{spot.clicksCount} clics</b>
                    <span className="text-slate-400 text-[11px] ml-1.5">({spot.percentage}%)</span>
                  </div>
                </div>

                <div className="w-full bg-[#181c2b] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${spot.percentage * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices & Locations */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Device Split */}
          <div className="bg-[#121520] border border-[#202538] rounded-xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white">Dispositivos de los Clientes</h3>
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="bg-[#171b29] border border-[#262c43] p-3 rounded-xl space-y-1">
                <Smartphone className="w-5 h-5 text-purple-400 mx-auto" />
                <span className="text-slate-400 text-[11px] block">Móviles</span>
                <b className="text-white text-base">74%</b>
              </div>
              <div className="bg-[#171b29] border border-[#262c43] p-3 rounded-xl space-y-1">
                <Monitor className="w-5 h-5 text-cyan-400 mx-auto" />
                <span className="text-slate-400 text-[11px] block">Escritorio</span>
                <b className="text-white text-base">26%</b>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic text-center">
              Recomendación: El botón de WhatsApp móvil es el canal de cierre #1.
            </p>
          </div>

          {/* Top States */}
          <div className="bg-[#121520] border border-[#202538] rounded-xl p-5 shadow-xl space-y-2.5 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Estados con Más Visitas</span>
            </h3>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-[#1c2132]">
                <span>1. Chihuahua (Delicias, Juárez, Chih.)</span>
                <b className="text-emerald-400">38%</b>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1c2132]">
                <span>2. Nuevo León (Monterrey)</span>
                <b className="text-emerald-400">22%</b>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1c2132]">
                <span>3. Sinaloa (Culiacán, Mazatlán)</span>
                <b className="text-emerald-400">18%</b>
              </div>
              <div className="flex justify-between py-1">
                <span>4. CDMX y Edo. Méx.</span>
                <b className="text-emerald-400">12%</b>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Row 2: User Journeys (Recorridos) */}
      <div className="bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Rutas de Navegación Más Frecuentes (User Journeys)</span>
        </h3>

        <div className="space-y-3">
          {journeys.map((j) => (
            <div
              key={j.id}
              className="bg-[#161a29] border border-[#242b42] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {j.path.split(' -> ').map((step, idx, arr) => (
                  <React.Fragment key={idx}>
                    <span className={`px-2.5 py-1 rounded-md font-semibold ${
                      idx === arr.length - 1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#1e2336] text-slate-200'
                    }`}>
                      {step}
                    </span>
                    {idx < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#22283e]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Sesiones</span>
                  <b className="text-white">{j.sessionsCount} ({j.percentage}%)</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Conversión</span>
                  <b className="text-purple-300">{j.conversionRate}%</b>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
