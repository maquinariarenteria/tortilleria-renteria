import React from 'react';
import { ScrollReveal } from './ScrollReveal';

export const ValueProps: React.FC = () => {
  const pillars = [
    {
      title: 'MÁS DE 15 AÑOS DE EXPERIENCIA',
      sub: 'Fabricación especializada en harina',
      image: '/images/02_prensa_manual.jpg',
    },
    {
      title: 'CALIDAD & DURABILIDAD INDUSTRIAL',
      sub: 'Acero inoxidable y alto rendimiento',
      image: '/images/05_boleadora_automatica.jpg',
    },
    {
      title: 'ENVÍOS A TODA LA REPÚBLICA',
      sub: 'Fabricación sobre pedido asegurada',
      image: '/images/08_cortadora_automatica_tolva.jpg',
    },
  ];

  return (
    <section className="bg-[#0f172a] py-10 my-4 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((item, index) => (
            <ScrollReveal
              key={index}
              direction={index === 0 ? 'left' : index === 1 ? 'up' : 'right'}
              delay={index * 120}
              className="h-full"
            >
              <div className="flex flex-col items-center text-center group h-full">
                <div className="w-full h-40 bg-white rounded-lg border border-slate-700 flex items-center justify-center p-2.5 transition-all duration-300 group-hover:scale-102 overflow-hidden shadow-md">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-contain object-center"
                  />
                </div>

                <h3 className="mt-3 text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                  {item.title}
                </h3>
                <span className="text-xs text-blue-400 font-medium mt-0.5">
                  {item.sub}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Payment and Assurance Trust Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-base text-blue-400">💳</span>
            <span>Pagos con Tarjeta de Crédito y Débito (Visa, Mastercard, AMEX)</span>
          </div>
          <div className="hidden md:block text-slate-600">•</div>
          <div className="flex items-center gap-2">
            <span className="text-base text-emerald-400">🏦</span>
            <span>Transferencias Directas SPEI</span>
          </div>
          <div className="hidden md:block text-slate-600">•</div>
          <div className="flex items-center gap-2">
            <span className="text-base text-amber-400">📄</span>
            <span>Facturación Fiscal CFDI (+16% IVA)</span>
          </div>
        </div>

      </div>
    </section>
  );
};
