import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Calculator } from 'lucide-react';

interface RoiCalculatorProps {
  currency: 'USD' | 'MXN';
}

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({ currency }) => {
  const [tortillasPerDay, setTortillasPerDay] = useState<number>(5000);
  const [packSize, setPackSize] = useState<number>(10);
  const [pricePerPack, setPricePerPack] = useState<number>(currency === 'MXN' ? 24 : 1.35);
  const [costPerPackRaw, setCostPerPackRaw] = useState<number>(currency === 'MXN' ? 8.5 : 0.48);

  const packsPerDay = Math.floor(tortillasPerDay / packSize);
  const grossDailyIncome = packsPerDay * pricePerPack;
  const dailyCost = packsPerDay * costPerPackRaw;
  const dailyNetProfit = grossDailyIncome - dailyCost;
  const monthlyNetProfit = dailyNetProfit * 26;
  const yearlyNetProfit = monthlyNetProfit * 12;

  const avgMachinePrice = currency === 'MXN' ? 176400 : 9800;
  const monthsToPayoff = Math.max(0.5, (avgMachinePrice / (monthlyNetProfit || 1))).toFixed(1);

  return (
    <section id="roi-calculator" className="py-12 border-t border-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#f26522] uppercase tracking-wider mb-1">
            <Calculator size={14} />
            HERRAMIENTA DE PLANIFICACIÓN FINANCIERA
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-gray-900 uppercase tracking-wider">
            CALCULADORA DE RENTABILIDAD & RETORNO (ROI)
          </h2>
          <p className="mt-1 text-xs text-gray-600 font-mono">
            Estima el volumen diario y conoce en cuántos meses se amortiza tu maquinaria.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Sliders (Left 6 cols) */}
          <div className="lg:col-span-6 bg-white p-6 rounded border border-gray-300 space-y-5">
            
            {/* Tortillas per day */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="font-bold text-gray-700 uppercase">Producción Diaria:</span>
                <span className="font-bold text-[#f26522]">{formatNumber(tortillasPerDay)} tortillas/día</span>
              </div>
              <input
                type="range"
                min="1000"
                max="30000"
                step="500"
                value={tortillasPerDay}
                onChange={(e) => setTortillasPerDay(Number(e.target.value))}
                className="w-full accent-[#f26522]"
              />
            </div>

            {/* Pack Size */}
            <div>
              <span className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1.5">
                Presentación por Paquete:
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                {[10, 12, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPackSize(count)}
                    className={`py-1.5 rounded border font-bold transition ${
                      packSize === count
                        ? 'bg-[#f26522] text-white border-[#f26522]'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {count} piezas
                  </button>
                ))}
              </div>
            </div>

            {/* Price per pack */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="font-bold text-gray-700 uppercase">Precio de Venta al Público:</span>
                <span className="font-bold text-gray-900">{formatCurrency(pricePerPack, currency)}</span>
              </div>
              <input
                type="range"
                min={currency === 'MXN' ? 12 : 0.8}
                max={currency === 'MXN' ? 50 : 3.0}
                step={currency === 'MXN' ? 1 : 0.05}
                value={pricePerPack}
                onChange={(e) => setPricePerPack(Number(e.target.value))}
                className="w-full accent-[#f26522]"
              />
            </div>

            {/* Raw cost per pack */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="font-bold text-gray-700 uppercase">Costo Insumos (Harina + Gas + Bolsa):</span>
                <span className="font-bold text-gray-900">{formatCurrency(costPerPackRaw, currency)}</span>
              </div>
              <input
                type="range"
                min={currency === 'MXN' ? 4 : 0.25}
                max={currency === 'MXN' ? 22 : 1.5}
                step={currency === 'MXN' ? 0.5 : 0.02}
                value={costPerPackRaw}
                onChange={(e) => setCostPerPackRaw(Number(e.target.value))}
                className="w-full accent-[#f26522]"
              />
            </div>

          </div>

          {/* Results Summary (Right 6 cols) */}
          <div className="lg:col-span-6 bg-white p-6 rounded border border-gray-300 space-y-4">
            
            <div className="text-xs font-mono font-bold text-gray-500 uppercase pb-2 border-b border-gray-200">
              RESULTADOS DE OPERACIÓN (26 DÍAS / MES)
            </div>

            <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center">
              <span className="text-[11px] font-mono text-gray-600 uppercase block mb-1">
                Utilidad Neta Mensual Estimada:
              </span>
              <div className="text-3xl font-mono font-black text-[#f26522]">
                {formatCurrency(monthlyNetProfit, currency)}
              </div>
              <span className="text-[10px] font-mono text-gray-500 mt-1 block">
                {formatNumber(packsPerDay)} paquetes/día ({formatNumber(tortillasPerDay)} pzs)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-500 block text-[10px]">UTILIDAD DIARIA</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                  {formatCurrency(dailyNetProfit, currency)}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-500 block text-[10px]">UTILIDAD ANUAL</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                  {formatCurrency(yearlyNetProfit, currency)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded text-xs">
              <span className="font-mono font-bold text-[#f26522] uppercase block">
                Tiempo Estimado de Retorno (Payback):
              </span>
              <p className="text-gray-700 mt-1">
                La inversión de un equipo promedio ({formatCurrency(avgMachinePrice, currency)}) se recupera en aproximadamente <strong className="text-black font-bold">{monthsToPayoff} meses</strong>.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
