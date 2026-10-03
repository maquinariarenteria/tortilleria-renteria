import React, { useState } from 'react';
import { Opportunity } from '../../../types/admin';
import { getStoredOpportunities, saveStoredOpportunities } from '../../../utils/adminStore';
import { TrendingUp, Plus, ArrowRight, DollarSign, CheckCircle2, Building, Phone } from 'lucide-react';

export const OportunidadesTab: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(getStoredOpportunities());

  const stages: { id: Opportunity['stage']; label: string; color: string }[] = [
    { id: 'contacto_inicial', label: '1. Contacto Inicial', color: 'border-slate-500 text-slate-300' },
    { id: 'ficha_enviada', label: '2. Ficha Enviada', color: 'border-blue-500 text-blue-300' },
    { id: 'en_negociacion', label: '3. En Negociación', color: 'border-amber-500 text-amber-300' },
    { id: 'aprobacion_anticipo', label: '4. Por Anticipo (50%)', color: 'border-purple-500 text-purple-300' },
    { id: 'ganada', label: '5. Venta Ganada', color: 'border-emerald-500 text-emerald-300' },
  ];

  const handleMoveStage = (id: string, newStage: Opportunity['stage']) => {
    const updated = opportunities.map(o => o.id === id ? { ...o, stage: newStage } : o);
    saveStoredOpportunities(updated);
    setOpportunities(updated);
  };

  const totalPipelineValue = opportunities
    .filter(o => o.stage !== 'perdida')
    .reduce((acc, o) => acc + o.dealValue, 0);

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Pipeline de Oportunidades (CRM)</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              ${totalPipelineValue.toLocaleString()} MXN en Cartera
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualiza el avance de clientes potenciales desde el primer contacto hasta el cierre de venta.
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const items = opportunities.filter(o => o.stage === stage.id);
          const stageTotal = items.reduce((acc, o) => acc + o.dealValue, 0);

          return (
            <div
              key={stage.id}
              className="bg-[#121520] border border-[#202538] rounded-xl p-3.5 flex flex-col justify-between min-w-[220px]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#1d2235] pb-2.5 mb-3">
                  <span className={`text-xs font-bold ${stage.color}`}>{stage.label}</span>
                  <span className="text-[11px] font-mono bg-[#181c2b] px-1.5 py-0.5 rounded text-slate-300">
                    {items.length}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-semibold mb-3">
                  Total: <b className="text-white">${stageTotal.toLocaleString()}</b>
                </div>

                <div className="space-y-2.5">
                  {items.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-[#171b29] border border-[#272e45] hover:border-purple-500/40 p-3 rounded-lg text-xs space-y-2 transition-all shadow"
                    >
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{opp.companyOrClient}</span>
                      </div>

                      <div className="text-slate-300 text-[11px]">
                        {opp.machineModel}
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pt-1 border-t border-[#22283e]">
                        <span>${opp.dealValue.toLocaleString()} MXN</span>
                        <span className="text-[10px] text-purple-300 font-normal">{opp.closeProbability}% prob.</span>
                      </div>

                      <p className="text-[10px] text-slate-400 italic leading-tight">
                        Sig. paso: {opp.nextStep}
                      </p>

                      {/* Advance Stage button */}
                      <div className="pt-2 flex justify-end">
                        {stage.id === 'contacto_inicial' && (
                          <button
                            onClick={() => handleMoveStage(opp.id, 'ficha_enviada')}
                            className="text-[10px] text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ficha enviada</span> <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {stage.id === 'ficha_enviada' && (
                          <button
                            onClick={() => handleMoveStage(opp.id, 'en_negociacion')}
                            className="text-[10px] text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <span>Negociar</span> <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {stage.id === 'en_negociacion' && (
                          <button
                            onClick={() => handleMoveStage(opp.id, 'aprobacion_anticipo')}
                            className="text-[10px] text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <span>Anticipo</span> <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {stage.id === 'aprobacion_anticipo' && (
                          <button
                            onClick={() => handleMoveStage(opp.id, 'ganada')}
                            className="text-[10px] text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <span>¡Venta Ganada!</span> <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                        {stage.id === 'ganada' && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Cerrada
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
