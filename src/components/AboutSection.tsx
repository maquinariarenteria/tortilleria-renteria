import React from 'react';
import { ShieldCheck, Factory, Check } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about-section" className="py-12 border-t border-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#f26522] uppercase tracking-wider mb-1">
            <Factory size={14} />
            INGENIERÍA INDUSTRIAL
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-gray-900 uppercase tracking-wider">
            ESPECIALISTAS EN TORTILLA DE HARINA DE TRIGO
          </h2>
          <p className="mt-1 text-xs text-gray-600 font-mono">
            Equipos diseñados para el desarrollo óptimo de elasticidad, textura y sellado térmico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-5 rounded border border-gray-300 space-y-3">
            <h3 className="font-display font-bold text-sm uppercase text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-[#f26522]" size={18} />
              Acero Inoxidable AISI 304
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Estructura completa y partes en contacto con masa en acero inoxidable grado alimenticio. Cumple con normativas sanitarias y asegura máxima higiene en planta.
            </p>
          </div>

          <div className="bg-white p-5 rounded border border-gray-300 space-y-3">
            <h3 className="font-display font-bold text-sm uppercase text-gray-900 flex items-center gap-2">
              <Check className="text-[#f26522]" size={18} />
              Eficiencia de Combustión
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Quemadores infrarrojos con recubrimiento cerámico para reducir hasta un 35% el consumo de gas LP o Natural frente a comales tradicionales.
            </p>
          </div>

          <div className="bg-white p-5 rounded border border-gray-300 space-y-3">
            <h3 className="font-display font-bold text-sm uppercase text-gray-900 flex items-center gap-2">
              <Check className="text-[#f26522]" size={18} />
              Garantía y Refacciones
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Garantía por escrito de 3 años en chasis y 1 año en componentes eléctricos. Disponibilidad permanente de bandas, teflón y refacciones de fábrica.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
