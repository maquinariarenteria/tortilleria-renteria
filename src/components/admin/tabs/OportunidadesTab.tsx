import React, { useState } from 'react';
import { Opportunity } from '../../../types/admin';
import { getStoredOpportunities, saveStoredOpportunities } from '../../../utils/adminStore';
import { TrendingUp, ArrowRight, CheckCircle2, Building, DollarSign } from 'lucide-react';

export const OportunidadesTab: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(getStoredOpportunities());

  const stages: { id: Opportunity['stage']; label: string; headerColor: string; badgeColor: string }[] = [
    { id: 'contacto_inicial', label: '1. Contacto Inicial', headerColor: 'text-slate-700', badgeColor: 'bg-slate-100 text-slate-700' },
    { id: 'ficha_enviada', label: '2. Ficha Enviada', headerColor: 'text-blue-700', badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200' },
    { id: 'en_negociacion', label: '3. En Negociación', headerColor: 'text-amber-700', badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200' },
    { id: 'aprobacion_anticipo', label: '4. Por Anticipo (50%)', headerColor: 'text-indigo-700', badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
    { id: 'ganada', label: '5. Venta Ganada', headerColor: 'text-emerald-700', badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
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
    <div className="p-4 md:p-8 space-y-6 text-slate-800 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Pipeline de Oportunidades (CRM)</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              ${totalPipelineValue.toLocaleString()} MXN en Cartera
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualiza y da seguimiento al avance de clientes potenciales de Maquinaria Rentería desde el primer contacto hasta el cierre de venta.
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const items = opportunities.filter(o => o.stage === stage.id);
          const stageTotal = items.reduce((acc, o) => acc + o.dealValue, 0);

          return (
            <div
              key={stage.id}
              className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between min-w-[230px]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                  <span className={`text-xs font-bold ${stage.headerColor}`}>{stage.label}</span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${stage.badgeColor}`}>
                    {items.length}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-medium mb-3">
                  Total: <b className="text-slate-800">${stageTotal.toLocaleString()} MXN</b>
                </div>

                <div className="space-y-3">
                  {items.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white border border-slate-200 hover:border-blue-400 p-3.5 rounded-xl text-xs space-y-2.5 transition-all shadow-sm hover:shadow"
                    >
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{opp.companyOrClient}</span>
                      </div>

                      <div className="text-slate-600 text-[11px] font-medium">
                        {opp.machineModel}
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-emerald-600 pt-2 border-t border-slate-100">
                        <span>${opp.dealValue.toLocaleString()} MXN</span>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">{opp.closeProbability}% prob.</span>
                      </div>

                      <p className="text-[11px] text-slate-500 italic leading-snug">
                        Sig. paso: {opp.nextStep}
                      </p>

                      {/* Advance Stage button */}
                      <div className="pt-2 flex justify-end">
                        {stage.id === 'contacto_inicial' && (
                          <button
                            onClick={() => handleMoveStage(opp.id, 'ficha_enviada')}
                            className="text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer font-medium transition"
                          >
                            <span>Ficha enviada</span> <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {stage.id === 'ficha_enviada' && (
                          <button
                            onClick={() => handleMoveStage(opp.id, 'en_negociacion')}
                            className="text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer font-medium transition"
                          >
                            <span>Negociar</span> <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {stage.id === 'en_negociacion' && (
                          <button
                            onClick={() => handleMoveStage(opp.id, 'aprobacion_anticipo')}
                            className="text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer font-medium transition"
                          >
                            <span>Anticipo</span> <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {stage.id === 'aprobacion_anticipo' && (
                          <button
                            onClick={() => handleMoveStage(opp.id, 'ganada')}
                            className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer font-bold transition shadow-xs"
                          >
                            <span>¡Venta Ganada!</span> <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                        {stage.id === 'ganada' && (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
