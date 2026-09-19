import React, { useState, useMemo, useRef } from 'react';
import { MachineProduct } from '../types';
import { ProductCard } from './ProductCard';
import { formatCurrency } from '../utils/formatters';
import { Plus, Check, ChevronLeft, ChevronRight, Grid, Layers, SlidersHorizontal, ArrowRight } from 'lucide-react';
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
  const [selectedEnergy, setSelectedEnergy] = useState<string>('all');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'sections' | 'collage'>('sections');

  // Filtered machines based on user criteria
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      if (selectedEnergy !== 'all' && !m.energyType.toLowerCase().includes(selectedEnergy.toLowerCase())) return false;
      if (minCapacity > 0 && m.capacityPerHour < minCapacity) return false;
      return true;
    });
  }, [machines, selectedEnergy, minCapacity]);

  // Group 1: Prensas Térmicas y Formadoras
  const prensasGroup = useMemo(() => {
    return filteredMachines.filter((m) => m.category === 'prensas');
  }, [filteredMachines]);

  // Group 2: Amasadoras, Cortadoras y Boleadoras
  const amasadorasGroup = useMemo(() => {
    return filteredMachines.filter((m) => m.category === 'amasadoras-boleadoras');
  }, [filteredMachines]);

  // First 5 for collage mode
  const collageMachines = filteredMachines.slice(0, 5);

  return (
    <section id="catalog-section" className="py-8 pb-16 overflow-hidden">
      
      {/* Dark Separator Bar matching wireframe: CATALOG */}
      <div className="bg-[#0f172a] py-3 text-center my-4">
        <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-widest">
          CATÁLOGO DE MAQUINARIA
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* 3 Crucial Business Terms requested by user */}
        <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-around gap-2.5 text-xs font-bold text-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-base">🚚</span>
            <span>Envíos a toda la República Mexicana</span>
          </div>
          <div className="hidden md:block text-slate-300">•</div>
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-base">📦</span>
            <span>Maquinaria sobre pedido</span>
          </div>
          <div className="hidden md:block text-slate-300">•</div>
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-base">🏷️</span>
            <span>Precios más gastos de envío</span>
          </div>
        </div>

        {/* Filters and View Mode Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1 font-black uppercase text-slate-700">
              <SlidersHorizontal size={14} className="text-[#2563eb]" />
              <span className="hidden xs:inline">Filtros:</span>
            </div>

            {/* Energy filter */}
            <select
              value={selectedEnergy}
              onChange={(e) => setSelectedEnergy(e.target.value)}
              className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#2563eb]"
            >
              <option value="all">Todas las energías</option>
              <option value="gas lp">Gas LP</option>
              <option value="gas natural">Gas Natural</option>
              <option value="eléctrica">Eléctrica</option>
            </select>

            {/* Capacity filter */}
            <select
              value={minCapacity}
              onChange={(e) => setMinCapacity(Number(e.target.value))}
              className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#2563eb]"
            >
              <option value="0">Toda capacidad</option>
              <option value="1000">+1,000 tort/h</option>
              <option value="2000">+2,000 tort/h</option>
              <option value="3000">+3,000 tort/h</option>
            </select>

            {(selectedEnergy !== 'all' || minCapacity > 0) && (
              <button
                onClick={() => { setSelectedEnergy('all'); setMinCapacity(0); }}
                className="text-[11px] font-bold text-[#2563eb] hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Switch between horizontal sections view and collage view */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setViewMode('sections')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase transition ${
                viewMode === 'sections'
                  ? 'bg-white text-[#2563eb] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={13} />
              <span>Por Secciones (Desplazables)</span>
            </button>

            <button
              onClick={() => setViewMode('collage')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase transition ${
                viewMode === 'collage'
                  ? 'bg-white text-[#2563eb] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid size={13} />
              <span>Collage (5 Fotos)</span>
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: PRODUCT GROUPS BY SECTIONS SCROLLABLE LEFT TO RIGHT (REQUESTED) */}
        {/* ========================================================================= */}
        {viewMode === 'sections' && (
          <div className="space-y-10">

            {/* SECCIÓN 1: PRENSAS TÉRMICAS Y FORMADORAS */}
            {prensasGroup.length > 0 && (
              <ProductSectionRow
                title="Prensas Térmicas y Formadoras"
                subtitle="Equipos de calor y formado para tortilla precocida y cocida"
                icon="🔥"
                machines={prensasGroup}
                currency={currency}
                onSelectMachine={onSelectMachine}
                onAddToCart={onAddToCart}
                cartMachineIds={cartMachineIds}
              />
            )}

            {/* SECCIÓN 2: AMASADORAS, CORTADORAS Y BOLEADORAS */}
            {amasadorasGroup.length > 0 && (
              <ProductSectionRow
                title="Amasadoras, Cortadoras y Boleadoras"
                subtitle="Preparación de masa homogénea, corte de tantos y boleado de testales"
                icon="⚡"
                machines={amasadorasGroup}
                currency={currency}
                onSelectMachine={onSelectMachine}
                onAddToCart={onAddToCart}
                cartMachineIds={cartMachineIds}
              />
            )}

            {prensasGroup.length === 0 && amasadorasGroup.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                <p className="text-sm font-bold text-slate-600">
                  No se encontraron máquinas con los filtros seleccionados.
                </p>
                <button
                  onClick={() => { setSelectedEnergy('all'); setMinCapacity(0); }}
                  className="mt-3 btn-flat-primary px-4 py-2 rounded text-xs font-bold uppercase"
                >
                  Restablecer Filtros
                </button>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ASYMMETRICAL 5-PHOTO COLLAGE (PREVIOUS REQUEST PRESERVED)          */}
        {/* ========================================================================= */}
        {viewMode === 'collage' && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Collage Asimétrico de 5 Modelos Principales
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {collageMachines[0] && (
                <div className="md:col-span-2">
                  <CollageItem
                    machine={collageMachines[0]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[0].id)}
                    size="large"
                  />
                </div>
              )}

              {collageMachines[1] && (
                <div className="md:col-span-1">
                  <CollageItem
                    machine={collageMachines[1]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[1].id)}
                    size="tall"
                  />
                </div>
              )}

              {collageMachines[2] && (
                <div className="md:col-span-1">
                  <CollageItem
                    machine={collageMachines[2]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[2].id)}
                    size="medium"
                  />
                </div>
              )}

              {collageMachines[3] && (
                <div className="md:col-span-1">
                  <CollageItem
                    machine={collageMachines[3]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[3].id)}
                    size="medium"
                  />
                </div>
              )}

              {collageMachines[4] && (
                <div className="md:col-span-1">
                  <CollageItem
                    machine={collageMachines[4]}
                    currency={currency}
                    onSelect={onSelectMachine}
                    onAddToCart={onAddToCart}
                    isInCart={cartMachineIds.includes(collageMachines[4].id)}
                    size="medium"
                  />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

/* ========================================================================= */
/* SUB-COMPONENT: HORIZONTALLY SCROLLABLE PRODUCT SECTION ROW                */
/* ========================================================================= */
function ProductSectionRow({
  title,
  subtitle,
  icon,
  machines,
  currency,
  onSelectMachine,
  onAddToCart,
  cartMachineIds,
}: {
  title: string;
  subtitle: string;
  icon: string;
  machines: MachineProduct[];
  currency: 'USD' | 'MXN';
  onSelectMachine: (m: MachineProduct) => void;
  onAddToCart: (m: MachineProduct) => void;
  cartMachineIds: string[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
      
      {/* Section Header with Left / Right Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wide">
              {title}
            </h3>
            <span className="text-[10px] font-extrabold bg-blue-50 text-[#2563eb] px-2 py-0.5 rounded border border-blue-200 uppercase">
              {machines.length} Modelos
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Scroll Controls & Visual Hint */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 uppercase">
            Desliza <ArrowRight size={12} />
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb] text-slate-700 transition active:scale-95 shadow-xs"
              title="Desplazar hacia la izquierda"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb] text-slate-700 transition active:scale-95 shadow-xs"
              title="Desplazar hacia la derecha"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Track */}
      <div
        ref={rowRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory horizontal-scroller no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {machines.map((machine) => {
          const isInCart = cartMachineIds.includes(machine.id);
          const price = currency === 'MXN' ? machine.priceMXN : machine.priceUSD;

          return (
            <div
              key={machine.id}
              className="w-[270px] sm:w-[310px] md:w-[320px] shrink-0 snap-start flat-card rounded-xl p-4 flex flex-col justify-between group hover:border-[#2563eb]"
            >
              <div>
                {/* Catalog Image */}
                <div
                  onClick={() => onSelectMachine(machine)}
                  className="w-full h-44 sm:h-48 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-3 cursor-pointer hover:border-[#2563eb] transition-all relative overflow-hidden group/img"
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
                    <span className="absolute top-2 left-2 text-[8px] sm:text-[9px] font-extrabold bg-[#2563eb] text-white px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                      {machine.badge}
                    </span>
                  )}

                  <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-slate-900/85 backdrop-blur-xs px-2 py-0.5 rounded text-white font-mono">
                    {machine.capacityPerHour.toLocaleString()} tort/h
                  </span>
                </div>

                {/* Machine Details */}
                <div className="mt-3 text-left">
                  <h4
                    onClick={() => onSelectMachine(machine)}
                    className="text-xs sm:text-sm font-bold text-slate-900 uppercase cursor-pointer hover:text-[#2563eb] transition-colors line-clamp-1"
                    title={machine.name}
                  >
                    {machine.name}
                  </h4>

                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="text-base sm:text-lg font-mono font-black text-[#2563eb]">
                      {formatCurrency(price, currency)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                      {machine.energyType}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>Sobre pedido</span>
                    <span>+ Gastos de envío</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onAddToCart(machine)}
                  className="flex-1 btn-flat-primary py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs"
                >
                  {isInCart ? <Check size={13} /> : <Plus size={13} />}
                  {isInCart ? 'En Carrito' : 'Agregar'}
                </button>

                <button
                  onClick={() => onSelectMachine(machine)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold uppercase transition"
                >
                  Detalles
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

/* ========================================================================= */
/* SUB-COMPONENT: COLLAGE ITEM FOR COLLAGE MODE                              */
/* ========================================================================= */
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
    size === 'large' ? 'h-60 sm:h-72' : size === 'tall' ? 'h-52 sm:h-72' : 'h-40 sm:h-44';

  return (
    <div className="flat-card rounded-xl p-4 flex flex-col justify-between h-full group hover:border-[#2563eb]">
      <div>
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
