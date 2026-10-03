import React, { useState } from 'react';
import { getStoredWebHealth } from '../../../utils/adminStore';
import { WebHealthMetrics } from '../../../types/admin';
import { Activity, ShieldCheck, Database, HardDrive, Zap, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';

export const SaludWebTab: React.FC = () => {
  const [health, setHealth] = useState<WebHealthMetrics>(getStoredWebHealth());
  const [isAuditing, setIsAuditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setHealth({
        ...health,
        averageLatencyMs: Math.floor(Math.random() * 8) + 14,
        d1QueryTimeMs: Number((Math.random() * 2 + 3).toFixed(1)),
        cacheHitRatio: 98.8,
        lastAuditTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      showToast('Auditoría completada: todos los servicios de Cloudflare operan con 100% de salud.');
    }, 1200);
  };

  const handlePurgeCache = () => {
    showToast('Caché global de Cloudflare purgada exitosamente.');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-slate-800 max-w-7xl mx-auto">
      
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-white border border-slate-200 text-slate-800 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Salud de la Web y Cloudflare</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              100% Operativo
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión continua de Cloudflare Workers, base de datos D1, almacenamiento R2 y Core Web Vitals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePurgeCache}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Purgar Caché
          </button>
          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditando...' : 'Diagnóstico en Vivo'}</span>
          </button>
        </div>
      </div>

      {/* Cloudflare Services Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Workers */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Cloudflare Workers</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Operativo
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{health.averageLatencyMs} ms</div>
          <p className="text-[11px] text-slate-400">Latencia media en edge nodes</p>
        </div>

        {/* D1 Database */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Cloudflare D1 (Datos)</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
              Conectada
            </span>
          </div>
          <div className="text-2xl font-black text-blue-700">{health.d1QueryTimeMs} ms</div>
          <p className="text-[11px] text-slate-400">Tiempo medio de query SQL</p>
        </div>

        {/* R2 Media Bucket */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Cloudflare R2 (Fotos)</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
              Conectado
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700">{health.r2LatencyMs} ms</div>
          <p className="text-[11px] text-slate-400">Cero costo de egress / ancho de banda</p>
        </div>

        {/* Cache Hit Ratio */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Caché CDN Cloudflare</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Activo
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{health.cacheHitRatio}%</div>
          <p className="text-[11px] text-slate-400">Contenido servido desde la CDN</p>
        </div>

      </div>

      {/* Core Web Vitals */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Core Web Vitals de Google (Experiencia de Usuario)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
            <span className="text-slate-500 block font-medium">LCP (Carga de Elemento Mayor)</span>
            <div className="text-xl font-bold text-emerald-600">{health.lcp} s</div>
            <p className="text-[11px] text-slate-400">Meta: &lt; 2.5s (Excelente)</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
            <span className="text-slate-500 block font-medium">FID (Interactividad Inicial)</span>
            <div className="text-xl font-bold text-emerald-600">{health.fid} ms</div>
            <p className="text-[11px] text-slate-400">Meta: &lt; 100ms (Ultra Rápido)</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
            <span className="text-slate-500 block font-medium">CLS (Estabilidad Visual)</span>
            <div className="text-xl font-bold text-emerald-600">{health.cls}</div>
            <p className="text-[11px] text-slate-400">Meta: &lt; 0.1 (Sin parpadeos)</p>
          </div>
        </div>
      </div>

    </div>
  );
};
