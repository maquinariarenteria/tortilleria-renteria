import React, { useState } from 'react';
import { ABExperiment } from '../../../types/admin';
import { getStoredABTests, saveStoredABTests } from '../../../utils/adminStore';
import { GitBranch, CheckCircle2, TrendingUp, Sparkles, Play, Pause } from 'lucide-react';

export const PruebaABTab: React.FC = () => {
  const [experiments, setExperiments] = useState<ABExperiment[]>(getStoredABTests());

  const handleToggleStatus = (id: string) => {
    const updated = experiments.map(exp => {
      if (exp.id === id) {
        return {
          ...exp,
          status: exp.status === 'running' ? 'paused' : 'running'
        };
      }
      return exp;
    });
    saveStoredABTests(updated as any);
    setExperiments(updated as any);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-slate-800 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Pruebas A/B y Optimización de Conversión</span>
            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {experiments.filter(e => e.status === 'running').length} Activas
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Experimenta con títulos, botones de WhatsApp y simuladores 3D para maximizar las cotizaciones de tortilladoras.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-600" />
                  <span>{exp.title}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {exp.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  exp.status === 'running' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {exp.status === 'running' ? 'En ejecución' : 'Pausado'}
                </span>
                <button
                  onClick={() => handleToggleStatus(exp.id)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition"
                  title={exp.status === 'running' ? 'Pausar experimento' : 'Reanudar experimento'}
                >
                  {exp.status === 'running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              </div>
            </div>

            {/* Split Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Variant A */}
              <div className={`p-4 rounded-xl border transition-all ${
                exp.winningVariant === 'A' ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">{exp.variantA.name}</span>
                  {exp.winningVariant === 'A' && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Variante Ganadora
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">{exp.variantA.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white border border-slate-200/80 p-2.5 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Visitantes</span>
                    <b className="text-slate-800">{exp.variantA.visitors}</b>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-2.5 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Cotizaciones</span>
                    <b className="text-emerald-600">{exp.variantA.conversions}</b>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-2.5 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Conversión</span>
                    <b className="text-blue-600">{exp.variantA.conversionRate}%</b>
                  </div>
                </div>
              </div>

              {/* Variant B */}
              <div className={`p-4 rounded-xl border transition-all ${
                exp.winningVariant === 'B' ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">{exp.variantB.name}</span>
                  {exp.winningVariant === 'B' && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Variante Ganadora (+35% más)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">{exp.variantB.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white border border-slate-200/80 p-2.5 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Visitantes</span>
                    <b className="text-slate-800">{exp.variantB.visitors}</b>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-2.5 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Cotizaciones</span>
                    <b className="text-emerald-600">{exp.variantB.conversions}</b>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-2.5 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-medium">Conversión</span>
                    <b className="text-blue-600">{exp.variantB.conversionRate}%</b>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
