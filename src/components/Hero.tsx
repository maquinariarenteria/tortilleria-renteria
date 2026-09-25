import React from 'react';

interface HeroProps {
  onExploreCatalog: () => void;
  onContact: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCatalog, onContact }) => {
  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Minimal Hero Box with Featured Machine Showcase */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 text-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-300">
          
          <div className="flex-1 space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider">
              <span>★</span>
              <span>Más de 15 años de experiencia</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-slate-900 leading-tight">
              MAQUINARIA <span className="text-[#2563eb]">RENTERIA</span>
            </h1>

            <p className="text-base sm:text-xl font-bold text-[#2563eb] italic">
              "El motor de tu tortillería"
            </p>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
              Fabricación y venta de maquinaria para tortilla de harina. Equipos confiables, de alto rendimiento y fácil manejo para potenciar tu negocio.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                🚚 Envíos a toda la República
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                📦 Sobre pedido
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                🏷️ + Envío (+16% IVA con factura)
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onExploreCatalog}
                className="btn-flat-primary px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xs hover:scale-102 transition-transform"
              >
                Ver Catálogo (8 Modelos)
              </button>
              <button
                onClick={onContact}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold uppercase transition border border-slate-200"
              >
                Contacto & Cotizaciones
              </button>
            </div>
          </div>

          <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
            <img
              src="/images/01_prensa_comal.jpg"
              alt="Prensa Manual con Comal Maquinaria Renteria"
              className="w-full h-56 sm:h-64 object-contain object-center transition-transform duration-300 group-hover:scale-105"
            />
            <div className="mt-2 text-center">
              <span className="text-[11px] font-black uppercase text-slate-900 block">
                Prensa Manual con Comal
              </span>
              <span className="text-[10px] font-mono text-[#2563eb] font-bold">
                $16,000 MXN • Sobre Pedido
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
