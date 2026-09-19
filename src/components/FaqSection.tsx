import React, { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: '¿REALIZAN ENVÍOS A TODA LA REPÚBLICA MEXICANA?',
      a: 'Sí, realizamos envíos asegurados a toda la República Mexicana. La entrega se realiza mediante empresas de transporte de carga y fletes consolidados a tu ciudad.',
    },
    {
      q: '¿LA MAQUINARIA ES DE ENTREGA INMEDIATA O SOBRE PEDIDO?',
      a: 'Toda nuestra maquinaria se fabrica sobre pedido, asegurando que recibas un equipo 100% nuevo, calibrado y probado antes de salir del taller.',
    },
    {
      q: '¿LOS PRECIOS INCLUYEN GASTOS DE ENVÍO?',
      a: 'Los precios mostrados en el catálogo son más gastos de envío. El costo del flete se calcula con base en tu código postal y la paquetería de carga disponible.',
    },
    {
      q: '¿QUÉ TRAYECTORIA Y RESPALDO TIENE MAQUINARIA RENTERIA?',
      a: 'Contamos con más de 15 años de experiencia en la fabricación y venta de maquinaria especializada en tortilla de harina en Delicias, Chihuahua, atendiendo a clientes en todo México.',
    },
    {
      q: '¿CÓMO PUEDO COTIZAR O AGENDAR UN PEDIDO?',
      a: 'Puedes comunicarte directamente por teléfono o WhatsApp a los números 639 114 1084 y 639 111 9008, o por correo a maquinariarenteria17@gmail.com.',
    },
  ];

  return (
    <section className="py-12 bg-white border-t border-slate-200 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal direction="down">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wider">
              PREGUNTAS FRECUENTES
            </h2>
            <span className="text-xs text-slate-500 font-mono mt-1 block uppercase">
              Respuestas rápidas sobre pedidos y entregas
            </span>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <ScrollReveal
                key={idx}
                direction={idx % 2 === 0 ? 'left' : 'right'}
                delay={idx * 80}
              >
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 transition-colors">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm uppercase text-slate-900 hover:text-[#2563eb] transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-[#2563eb] shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed font-sans border-t border-slate-200/60 pt-2 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
};
