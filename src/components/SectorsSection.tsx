import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ArrowRight } from 'lucide-react';

interface SectorsSectionProps {
  onSelectSector: () => void;
}

export const SectorsSection: React.FC<SectorsSectionProps> = ({ onSelectSector }) => {
  const sectors = [
    {
      title: 'Taquerías & Restaurantes',
      cap: 'Prensa Manual con Comal',
      desc: 'Tortillas recién prensadas y cocidas al instante para servicio a la carta.',
      image: '/images/01_prensa_comal.jpg'
    },
    {
      title: 'Tortillerías Comerciales',
      cap: 'Prensa Automática 23/min',
      desc: 'Alta rotación constante con menor esfuerzo físico del operador.',
      image: '/images/06_prensa_automatica.jpg'
    },
    {
      title: 'Boleado & Automatización',
      cap: 'Boleadora de Espiral',
      desc: 'Boleado continuo en acero inoxidable que ahorra horas de trabajo manual.',
      image: '/images/05_boleadora_automatica.jpg'
    },
    {
      title: 'Amasado y Preparación',
      cap: 'Amasadora 25kg & Cortadora 36',
      desc: 'Mezclado rápido de masa de harina y división de porciones en estrella.',
      image: '/images/04_amasadora_25kg.jpg'
    },
  ];

  return (
    <section className="py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal direction="up">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wider">
              SOLUCIONES POR TIPO DE NEGOCIO
            </h2>
            <span className="text-xs text-slate-500 font-mono mt-1 block uppercase">
              Equipos diseñados para tu escala de producción de tortilla de harina
            </span>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectors.map((sec, idx) => (
            <ScrollReveal
              key={sec.title}
              direction={idx % 2 === 0 ? 'left' : 'right'}
              delay={idx * 120}
              className="h-full"
            >
              <div className="flat-card rounded-xl p-5 flex flex-col justify-between h-full group hover:border-[#2563eb]">
                <div>
                  <div className="w-full h-36 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-2 mb-4 group-hover:scale-102 transition-transform overflow-hidden shadow-2xs">
                    <img
                      src={sec.image}
                      alt={sec.title}
                      className="w-full h-full object-contain object-center"
                    />
                  </div>

                  <span className="text-[11px] font-mono font-bold text-[#2563eb] block uppercase">
                    {sec.cap}
                  </span>

                  <h3 className="font-bold text-base uppercase text-slate-900 mt-1">
                    {sec.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {sec.desc}
                  </p>
                </div>

                <button
                  onClick={onSelectSector}
                  className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                >
                  Ver Equipos
                  <ArrowRight size={13} />
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
