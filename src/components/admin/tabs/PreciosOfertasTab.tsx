import React, { useState } from 'react';
import { PriceOfferItem } from '../../../types/admin';
import { getStoredPriceOffers, saveStoredPriceOffers } from '../../../utils/adminStore';
import { DollarSign, Tag, Save, CheckCircle2, Percent, Truck } from 'lucide-react';

export const PreciosOfertasTab: React.FC = () => {
  const [offers, setOffers] = useState<PriceOfferItem[]>(getStoredPriceOffers());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePriceChange = (machineId: string, field: keyof PriceOfferItem, val: any) => {
    const updated = offers.map(o => o.machineId === machineId ? { ...o, [field]: val } : o);
    setOffers(updated);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredPriceOffers(offers);
    showToast('¡Lista de precios y ofertas guardada correctamente!');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1c2237] border border-purple-500/50 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Precios y Ofertas Promocionales</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              {offers.filter(o => o.isOfferActive).length} Ofertas Activas
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Modifica rápidamente los precios en pesos mexicanos y dólares, y activa descuentos especiales por temporada.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="bg-[#6366f1] hover:bg-[#5255e3] active:scale-95 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios de Precios</span>
        </button>
      </div>

      {/* Table of Pricing */}
      <div className="bg-[#121520] border border-[#202538] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#171b29] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#23293f]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Modelo de Máquina</th>
                <th className="py-3.5 px-4 font-semibold">Precio Lista (MXN)</th>
                <th className="py-3.5 px-4 font-semibold">Precio Lista (USD)</th>
                <th className="py-3.5 px-4 font-semibold">¿Oferta Activa?</th>
                <th className="py-3.5 px-4 font-semibold">Etiqueta Promocional</th>
                <th className="py-3.5 px-4 font-semibold">% Anticipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2336]">
              {offers.map((offer) => (
                <tr key={offer.machineId} className="hover:bg-[#161a28]/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-white max-w-[220px]">
                    {offer.name}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">$</span>
                      <input
                        type="number"
                        value={offer.regularPriceMXN}
                        onChange={(e) => handlePriceChange(offer.machineId, 'regularPriceMXN', Number(e.target.value))}
                        className="w-28 bg-[#181c2b] border border-[#2a3047] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">$</span>
                      <input
                        type="number"
                        value={offer.regularPriceUSD}
                        onChange={(e) => handlePriceChange(offer.machineId, 'regularPriceUSD', Number(e.target.value))}
                        className="w-24 bg-[#181c2b] border border-[#2a3047] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offer.isOfferActive}
                        onChange={(e) => handlePriceChange(offer.machineId, 'isOfferActive', e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className={`text-[11px] font-semibold ${offer.isOfferActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {offer.isOfferActive ? 'En Oferta' : 'Precio Normal'}
                      </span>
                    </label>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={offer.offerTag || ''}
                      onChange={(e) => handlePriceChange(offer.machineId, 'offerTag', e.target.value)}
                      placeholder="Ej. 5% Pago Contado"
                      className="w-44 bg-[#181c2b] border border-[#2a3047] rounded px-2 py-1 text-xs text-purple-300 focus:outline-none focus:border-purple-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={offer.minDepositPercentage}
                      onChange={(e) => handlePriceChange(offer.machineId, 'minDepositPercentage', Number(e.target.value))}
                      className="bg-[#181c2b] border border-[#2a3047] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value={30}>30% Anticipo</option>
                      <option value={50}>50% Anticipo</option>
                      <option value={100}>100% Contado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
