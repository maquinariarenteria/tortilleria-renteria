import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { Star } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const reviews = [
    {
      name: 'Tortillería y Taquería El Norteño',
      city: 'Chihuahua, Chih.',
      model: 'Prensa Manual con Comal',
      quote: 'Excelente equipo. La prensa combinada con el comal nos resolvió todo el espacio y la tortilla sale suavecita y doradita.',
    },
    {
      name: 'Tortillería San Francisco',
      city: 'Cd. Juárez, Chih.',
      model: 'Boleadora Automática',
      quote: 'Nos quitó el dolor de cabeza de bolear a mano todo el día. El gusano continuo saca las bolas de masa redonditas y tersas.',
    },
    {
      name: 'Tortillas Caseras Doña María',
      city: 'Torreón, Coah.',
      model: 'Amasadora 25kg & Cortadora 36',
      quote: 'Tienen más de 15 años haciendo máquinas y se nota en el fierro y la calidad. Llegó por flete en perfectas condiciones.',
    },
  ];

  return (
    <section className="py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal direction="down">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wider">
              CLIENTES EN PRODUCCIÓN
            </h2>
            <span className="text-xs text-slate-500 font-mono mt-1 block uppercase">
              Plantas y negocios que confían en Maquinaria Renteria
            </span>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <ScrollReveal
              key={rev.name}
              direction={idx % 2 === 0 ? 'left' : 'right'}
              delay={idx * 150}
              className="h-full"
            >
              <div className="flat-card rounded-xl p-5 flex flex-col justify-between h-full group hover:border-[#2563eb]">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed mb-4">
                    "{rev.quote}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="font-bold text-xs uppercase text-slate-900 block">
                    {rev.name}
                  </span>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-0.5">
                    <span>{rev.city}</span>
                    <span className="text-[#2563eb] font-bold">{rev.model}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
