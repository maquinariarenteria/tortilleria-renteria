import React from 'react';
import { ScrollReveal } from './ScrollReveal';

export const ProductionProcess: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Amasado de Harina',
      desc: 'Desarrollo de elasticidad en tazón de acero inoxidable con motor 110V.',
      image: '/images/04_amasadora_25kg.jpg'
    },
    {
      num: '02',
      title: 'Corte de Testales',
      desc: 'División rápida en 36 tantos o tolva continua para peso homogéneo.',
      image: '/images/03_cortadora_manual_36.jpg'
    },
    {
      num: '03',
      title: 'Boleado Automático',
      desc: 'Mecanismo rotativo en charola de acero inoxidable para esferas tersas.',
      image: '/images/05_boleadora_automatica.jpg'
    },
    {
      num: '04',
      title: 'Prensado Caliente',
      desc: 'Prensa con platos térmicos y regulación milimétrica de 10 a 28 cm.',
      image: '/images/01_prensa_comal.jpg'
    },
    {
      num: '05',
      title: 'Tortilla Precocida',
      desc: 'Lista para empaque o terminar de cocer en comal contiguo.',
      image: '/images/06_prensa_automatica.jpg'
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal direction="down">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wider">
              PROCESO DE PRODUCCIÓN DE TORTILLA DE HARINA
            </h2>
            <span className="text-xs text-slate-500 font-mono mt-1 block uppercase">
              Flujo de trabajo optimizado con maquinaria Renteria
            </span>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((step, index) => (
            <ScrollReveal
              key={step.num}
              direction={index % 2 === 0 ? 'left' : 'right'}
              delay={index * 100}
              className="h-full"
            >
              <div className="flat-card rounded-xl p-4 flex flex-col justify-between h-full group hover:border-[#2563eb]">
                <div>
                  <div className="w-full h-32 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-2 mb-3 overflow-hidden shadow-2xs">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <span className="font-mono font-black text-xl text-[#2563eb] block">
                    {step.num}
                  </span>

                  <h3 className="font-bold text-sm uppercase text-slate-900 mt-1">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
};
