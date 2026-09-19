import React, { useRef } from 'react';
import { MachineProduct } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface FeaturedMachinesProps {
  machines: MachineProduct[];
  currency: 'USD' | 'MXN';
  onSelectMachine: (machine: MachineProduct) => void;
  onAddToCart: (machine: MachineProduct) => void;
  cartMachineIds: string[];
}

export const FeaturedMachines: React.FC<FeaturedMachinesProps> = ({
  machines,
  currency,
  onSelectMachine,
  onAddToCart,
  cartMachineIds,
}) => {
  const featured = machines.filter(m => m.featured).slice(0, 3);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 sm:py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-wider uppercase">
                MÁQUINAS DESTACADAS
              </h2>
              <span className="text-xs text-slate-500 font-mono mt-1 block uppercase">
                Modelos de mayor demanda para harina de trigo
              </span>
            </div>

            {/* Mobile / Tablet scroll buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[11px] font-bold text-slate-400 md:hidden uppercase">
                Desliza ➔
              </span>
              <div className="flex gap-1.5 md:hidden">
                <button
                  onClick={() => scroll('left')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#2563eb] active:scale-95 transition"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#2563eb] active:scale-95 transition"
                  aria-label="Siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Horizontal scroll on mobile screens, 3-column grid on desktop */}
        <div
          ref={scrollContainerRef}
          className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 horizontal-scroller no-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
        >
          {featured.map((machine, idx) => {
            const isInCart = cartMachineIds.includes(machine.id);
            const price = currency === 'MXN' ? machine.priceMXN : machine.priceUSD;

            return (
              <div
                key={machine.id}
                className="w-[82vw] max-w-[310px] shrink-0 snap-start md:w-auto md:max-w-none h-full"
              >
                <ScrollReveal
                  direction={idx === 0 ? 'left' : idx === 1 ? 'up' : 'right'}
                  delay={idx * 100}
                  className="h-full"
                >
                  <div className="flat-card rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full group hover:border-[#2563eb]">
                    <div>
                      <div 
                        onClick={() => onSelectMachine(machine)}
                        className="w-full h-44 sm:h-52 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-3 cursor-pointer hover:border-[#2563eb] transition-all relative overflow-hidden group/img"
                      >
                        {machine.imageUrl ? (
                          <img
                            src={machine.imageUrl}
                            alt={machine.name}
                            loading="lazy"
                            className="w-full h-full object-contain object-center transition-transform duration-300 group-hover/img:scale-105"
                          />
                        ) : (
                          <span className="font-mono text-xs text-slate-400">
                            [{machine.sku}]
                          </span>
                        )}

                        {machine.badge && (
                          <span className="absolute top-2 left-2 text-[9px] font-extrabold bg-[#2563eb] text-white px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                            {machine.badge}
                          </span>
                        )}

                        <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-white font-mono">
                          {machine.capacityPerHour.toLocaleString()} tort/h
                        </span>
                      </div>

                      <div className="mt-4 text-center">
                        <h3 
                          onClick={() => onSelectMachine(machine)}
                          className="text-xs sm:text-base font-bold text-slate-900 uppercase cursor-pointer hover:text-[#2563eb] transition-colors line-clamp-1"
                          title={machine.name}
                        >
                          {machine.name}
                        </h3>
                        
                        <div className="mt-1 text-base sm:text-lg font-mono font-black text-[#2563eb]">
                          {formatCurrency(price, currency)}
                        </div>

                        <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
                          Fabricación sobre pedido • Más gastos de envío
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => onSelectMachine(machine)}
                        className="w-full btn-flat-primary py-2 sm:py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-xs"
                      >
                        VER DETALLES
                      </button>

                      <button
                        onClick={() => onAddToCart(machine)}
                        className={`w-full py-2 rounded-lg text-xs font-semibold uppercase transition flex items-center justify-center gap-1.5 border ${
                          isInCart
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isInCart ? <Check size={14} /> : <Plus size={14} />}
                        {isInCart ? 'En Carrito' : 'Agregar al Carrito'}
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
