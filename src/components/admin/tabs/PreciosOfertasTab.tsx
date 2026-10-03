import React, { useState } from 'react';
import { PriceOfferItem } from '../../../types/admin';
import { getStoredPriceOffers, saveStoredPriceOffers, getStoredMachines, saveStoredMachines } from '../../../utils/adminStore';
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

    // Sync prices directly into public machine catalog
    const currentMachines = getStoredMachines();
    const updatedMachines = currentMachines.map((m) => {
      const match = offers.find((o) => o.machineId === m.id);
      if (match) {
        return {
          ...m,
          priceMXN: match.regularPriceMXN,
          priceUSD: match.regularPriceUSD,
        };
      }
      return m;
    });
    saveStoredMachines(updatedMachines);

    showToast('¡Precios actualizados en la web y catálogo en vivo!');
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
            <span>Precios y Ofertas Promocionales</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {offers.filter(o => o.isOfferActive).length} Ofertas Activas
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Modifica rápidamente los precios en pesos mexicanos y dólares, y activa descuentos especiales por temporada.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Cambios de Precios</span>
        </button>
      </div>

      {/* Table of Pricing */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Modelo de Máquina</th>
                <th className="py-3.5 px-4 font-semibold">Precio Lista (MXN)</th>
                <th className="py-3.5 px-4 font-semibold">Precio Lista (USD)</th>
                <th className="py-3.5 px-4 font-semibold">¿Oferta Activa?</th>
                <th className="py-3.5 px-4 font-semibold">Etiqueta Promocional</th>
                <th className="py-3.5 px-4 font-semibold">% Anticipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offers.map((offer) => (
                <tr key={offer.machineId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[220px]">
                    {offer.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        value={offer.regularPriceMXN}
                        onChange={(e) => handlePriceChange(offer.machineId, 'regularPriceMXN', Number(e.target.value))}
                        className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        value={offer.regularPriceUSD}
                        onChange={(e) => handlePriceChange(offer.machineId, 'regularPriceUSD', Number(e.target.value))}
                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offer.isOfferActive}
                        onChange={(e) => handlePriceChange(offer.machineId, 'isOfferActive', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-[11px] font-semibold ${offer.isOfferActive ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200' : 'text-slate-400'}`}>
                        {offer.isOfferActive ? 'En Oferta' : 'Precio Normal'}
                      </span>
                    </label>
                  </td>
                  <td className="py-3.5 px-4">
                    <input
                      type="text"
                      value={offer.offerTag || ''}
                      onChange={(e) => handlePriceChange(offer.machineId, 'offerTag', e.target.value)}
                      placeholder="Ej. Flete Gratis Nacional"
                      className="w-48 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-blue-700 font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={offer.minDepositPercentage}
                      onChange={(e) => handlePriceChange(offer.machineId, 'minDepositPercentage', Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={30}>30% Anticipo</option>
                      <option value={50}>50% Anticipo (Estándar)</option>
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
