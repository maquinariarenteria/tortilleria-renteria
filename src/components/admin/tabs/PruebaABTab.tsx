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
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Pruebas A/B y Optimización de Conversión</span>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
              {experiments.filter(e => e.status === 'running').length} Activas
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Experimenta con títulos, botones de WhatsApp y simuladores 3D para maximizar las cotizaciones.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1d2235] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <span>{exp.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {exp.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  exp.status === 'running' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'
                }`}>
                  {exp.status === 'running' ? 'Ejecutando' : 'Pausado'}
                </span>
                <button
                  onClick={() => handleToggleStatus(exp.id)}
                  className="p-1.5 rounded-lg bg-[#181c2b] hover:bg-[#22283e] text-slate-300 cursor-pointer"
                  title={exp.status === 'running' ? 'Pausar' : 'Reanudar'}
                >
                  {exp.status === 'running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Split Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Variant A */}
              <div className={`p-4 rounded-xl border transition-all ${
                exp.winningVariant === 'A' ? 'bg-[#18231c] border-emerald-500/50' : 'bg-[#151928] border-[#252c42]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white">{exp.variantA.name}</span>
                  {exp.winningVariant === 'A' && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30">
                      <Sparkles className="w-3 h-3" /> Variante Ganadora
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3">{exp.variantA.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#10131e] p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Visitantes</span>
                    <b className="text-white">{exp.variantA.visitors}</b>
                  </div>
                  <div className="bg-[#10131e] p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Cotizaciones</span>
                    <b className="text-emerald-400">{exp.variantA.conversions}</b>
                  </div>
                  <div className="bg-[#10131e] p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Conversión</span>
                    <b className="text-purple-300">{exp.variantA.conversionRate}%</b>
                  </div>
                </div>
              </div>

              {/* Variant B */}
              <div className={`p-4 rounded-xl border transition-all ${
                exp.winningVariant === 'B' ? 'bg-[#18231c] border-emerald-500/50' : 'bg-[#151928] border-[#252c42]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white">{exp.variantB.name}</span>
                  {exp.winningVariant === 'B' && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30">
                      <Sparkles className="w-3 h-3" /> Variante Ganadora (+35% más)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3">{exp.variantB.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#10131e] p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Visitantes</span>
                    <b className="text-white">{exp.variantB.visitors}</b>
                  </div>
                  <div className="bg-[#10131e] p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Cotizaciones</span>
                    <b className="text-emerald-400">{exp.variantB.conversions}</b>
                  </div>
                  <div className="bg-[#10131e] p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Conversión</span>
                    <b className="text-purple-300">{exp.variantB.conversionRate}%</b>
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
