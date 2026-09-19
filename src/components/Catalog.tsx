import React, { useState, useMemo } from 'react';
import { MachineProduct } from '../types';
import { ProductCard } from './ProductCard';
import { formatCurrency } from '../utils/formatters';
import { Plus, Check, ChevronDown, ChevronUp, Layers, Grid } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface CatalogProps {
  machines: MachineProduct[];
  currency: 'USD' | 'MXN';
  onSelectMachine: (machine: MachineProduct) => void;
  onAddToCart: (machine: MachineProduct) => void;
  cartMachineIds: string[];
}

export const Catalog: React.FC<CatalogProps> = ({
  machines,
  currency,
  onSelectMachine,
  onAddToCart,
  cartMachineIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEnergy, setSelectedEnergy] = useState<string>('all');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'capacity-desc'>('popular');
  const [showAll, setShowAll] = useState<boolean>(false);

  const categories = [
    { id: 'all', name: 'Todas las Máquinas (8)' },
    { id: 'prensas', name: 'Prensas Térmicas y Planas' },
    { id: 'amasadoras-boleadoras', name: 'Amasadoras, Cortadoras y Boleadoras' },
  ];

  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      if (selectedEnergy !== 'all' && !m.energyType.toLowerCase().includes(selectedEnergy.toLowerCase())) return false;
      if (minCapacity > 0 && m.capacityPerHour < minCapacity) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') {
        const pA = currency === 'MXN' ? a.priceMXN : a.priceUSD;
        const pB = currency === 'MXN' ? b.priceMXN : b.priceUSD;
        return pA - pB;
      }
      if (sortBy === 'price-desc') {
        const pA = currency === 'MXN' ? a.priceMXN : a.priceUSD;
        const pB = currency === 'MXN' ? b.priceMXN : b.priceUSD;
        return pB - pA;
      }
      if (sortBy === 'capacity-desc') return b.capacityPerHour - a.capacityPerHour;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [machines, selectedCategory, selectedEnergy, minCapacity, sortBy, currency]);

  // First 5 for the Asymmetrical Collage
  const collageMachines = filteredMachines.slice(0, 5);
  // Remaining machines
  const remainingMachines = filteredMachines.slice(5);

  return (
    <section id="catalog-section" className="pb-14">
      
      {/* Dark Separator Bar matching wireframe: CATALOG */}
      <div className="bg-[#0f172a] py-3.5 text-center my-4">
        <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-widest">
          CATALOG
        </h2>
      </div>

      {/* Wireframe Secondary Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="font-extrabold text-xs tracking-wider uppercase text-slate-900">
            MAQUINARIA <span className="text-[#2563eb]">RENTERIA</span>
          </div>

          <div className="flex items-center gap-5 text-xs uppercase text-slate-600 font-bold">
            <span className="text-[#2563eb] border-b-2 border-[#2563eb] pb-0.5">Catálogo</span>
            <a href="#contact-section" className="hover:text-slate-900 transition">Contacto</a>
          </div>

          <a
            href="#contact-section"
            className="btn-flat-primary px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider"
          >
            CONTACTO
          </a>
        </div>
      </div>

      {/* 3 Crucial Business Terms requested by user */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 flex flex-wrap items-center justify-around gap-3 text-xs font-bold text-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-base">🚚</span>
            <span>Realizamos envíos a toda la República Mexicana</span>
          </div>
          <div className="hidden md:block text-slate-300">•</div>
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-base">📦</span>
            <span>Toda la maquinaria es sobre pedido</span>
          </div>
          <div className="hidden md:block text-slate-300">•</div>
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-base">🏷️</span>
            <span>Precios más gastos de envío</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: FILTERS & CATEGORIES */}
          <div className="lg:col-span-1 space-y-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
              <div className="font-black text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                FILTERS
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Energía:
                </label>
                <select
                  value={selectedEnergy}
                  onChange={(e) => setSelectedEnergy(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="all">Todas</option>
                  <option value="gas lp">Gas LP</option>
                  <option value="gas natural">Gas Natural</option>
                  <option value="eléctrica">Eléctrica</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Capacidad:</span>
                  <span className="font-bold text-[#2563eb]">{minCapacity === 0 ? 'Todas' : `+${minCapacity}/h`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4000"
                  step="500"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(Number(e.target.value))}
                  className="w-full accent-[#2563eb]"
                />
              </div>

              <button
                onClick={() => { setSelectedCategory('all'); setSelectedEnergy('all'); setMinCapacity(0); }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-[11px] font-bold uppercase transition border border-slate-200"
              >
                Limpiar Filtros
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="font-black text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">
                CATEGORIES
              </div>

              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer hover:text-[#2563eb] py-0.5"
                  >
                    <input
                      type="radio"
                      name="category-radio"
                      checked={selectedCategory === cat.id}
                      onChange={() => setSelectedCategory(cat.id)}
                      className="accent-[#2563eb]"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: ASYMMETRICAL 5-PHOTO COLLAGE + OPTION TO SEE MORE */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#2563eb]" />
                <span className="font-bold text-xs uppercase text-slate-900">
                  {showAll ? `CATÁLOGO COMPLETO (${filteredMachines.length})` : 'COLLAGE DESTACADO (5 MODELOS)'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as unknown as typeof sortBy)}
                  className="p-1 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="popular">Destacados</option>
                  <option value="capacity-desc">Mayor Capacidad</option>
                  <option value="price-asc">Menor Precio</option>
                  <option value="price-desc">Mayor Precio</option>
                </select>
              </div>
            </div>

            {/* 1. Asymmetrical Collage Grid (5 items) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Item 1: Large Featured Card (Spans 2 cols on tablet/desktop) */}
              {collageMachines[0] && (
                <ScrollReveal direction="left" className="md:col-span-2">
                  <CollageItem
                    machine={collageMachines[0]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[0].id)}
                    size="large"
                  />
                </ScrollReveal>
              )}

              {/* Item 2: Vertical / Tall card */}
              {collageMachines[1] && (
                <ScrollReveal direction="right" className="md:col-span-1">
                  <CollageItem
                    machine={collageMachines[1]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[1].id)}
                    size="tall"
                  />
                </ScrollReveal>
              )}

              {/* Item 3: Square / Medium card */}
              {collageMachines[2] && (
                <ScrollReveal direction="left" className="md:col-span-1">
                  <CollageItem
                    machine={collageMachines[2]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[2].id)}
                    size="medium"
                  />
                </ScrollReveal>
              )}

              {/* Item 4: Square / Medium card */}
              {collageMachines[3] && (
                <ScrollReveal direction="up" className="md:col-span-1">
                  <CollageItem
                    machine={collageMachines[3]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[3].id)}
                    size="medium"
                  />
                </ScrollReveal>
              )}

              {/* Item 5: Wide card */}
              {collageMachines[4] && (
                <ScrollReveal direction="right" className="md:col-span-1">
                  <CollageItem
                    machine={collageMachines[4]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[4].id)}
                    size="medium"
                  />
                </ScrollReveal>
              )}

            </div>

            {/* Visible Option Button to See More Photos / Models */}
            <div className="text-center pt-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border-2 border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb] hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                <Grid size={16} />
                <span>
                  {showAll
                    ? 'Ocultar y Ver Solo Collage (5 Fotos)'
                    : `Ver Más Fotos y Modelos (+${remainingMachines.length} Máquinas Disponibles)`}
                </span>
                {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* 2. Expanded Gallery (Revealed smoothly when user clicks "Ver más fotos") */}
            {showAll && (
              <div className="pt-4 border-t border-slate-200 animate-fadeIn space-y-4">
                <div className="text-xs font-bold text-slate-500 uppercase">
                  Otros modelos de línea disponibles:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {remainingMachines.map((machine) => (
                    <ProductCard
                      key={machine.id}
                      machine={machine}
                      currency={currency}
                      onSelect={onSelectMachine}
                      onAddToCart={onAddToCart}
                      isInCart={cartMachineIds.includes(machine.id)}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};

// Sub-component: Asymmetrical Collage Item
function CollageItem({
  machine,
  currency,
  onSelect,
  onAddToCart,
  isInCart,
  size = 'medium',
}: {
  machine: MachineProduct;
  currency: 'USD' | 'MXN';
  onSelect: (m: MachineProduct) => void;
  onAddToCart: (m: MachineProduct) => void;
  isInCart: boolean;
  size?: 'large' | 'tall' | 'medium';
}) {
  const price = currency === 'MXN' ? machine.priceMXN : machine.priceUSD;

  const photoHeight =
    size === 'large' ? 'h-64 sm:h-72' : size === 'tall' ? 'h-52 sm:h-72' : 'h-40 sm:h-44';

  return (
    <div className="flat-card rounded-xl p-4 flex flex-col justify-between h-full group hover:border-[#2563eb]">
      <div>
        {/* Studio Catalog Photo on Pure White Background */}
        <div
          onClick={() => onSelect(machine)}
          className={`w-full ${photoHeight} bg-white rounded-lg border border-slate-200 flex items-center justify-center p-3 cursor-pointer hover:border-[#2563eb] transition-all relative overflow-hidden group/img`}
        >
          {machine.imageUrl ? (
            <img
              src={machine.imageUrl}
              alt={machine.name}
              loading="lazy"
              className="w-full h-full object-contain object-center transition-transform duration-300 group-hover/img:scale-105"
            />
          ) : (
            <span className="text-xs font-mono text-slate-400">
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

        {/* Machine Info */}
        <div className="mt-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3
              onClick={() => onSelect(machine)}
              className="text-xs sm:text-sm font-bold text-slate-900 uppercase cursor-pointer hover:text-[#2563eb] transition-colors line-clamp-1"
              title={machine.name}
            >
              {machine.name}
            </h3>
            <span className="text-sm sm:text-base font-mono font-black text-[#2563eb] shrink-0">
              {formatCurrency(price, currency)}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="text-slate-600">Sobre pedido</span>
            <span className="text-slate-400">+ Gastos de envío</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onAddToCart(machine)}
          className="flex-1 btn-flat-primary py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs"
        >
          {isInCart ? <Check size={13} /> : <Plus size={13} />}
          {isInCart ? 'En Carrito' : 'Agregar'}
        </button>

        <button
          onClick={() => onSelect(machine)}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold uppercase transition"
        >
          Detalles
        </button>
      </div>
    </div>
  );
}
