import React from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Lock } from 'lucide-react';
import { getSiteConfig } from '../utils/adminStore';

export const Footer: React.FC = () => {
  const config = getSiteConfig();
  return (
    <footer className="bg-[#0f172a] text-white pt-12 pb-8 border-t-4 border-[#2563eb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Slogan */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-700">
                <img
                  src="/images/logo.png"
                  alt="Maquinaria Renteria Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg uppercase tracking-wider leading-none">
                  MAQUINARIA <span className="text-[#2563eb]">RENTERIA</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  El motor de tu tortillería
                </span>
              </div>
            </div>

            <p className="text-sm font-bold text-blue-400 italic">
              "{config.slogan}"
            </p>

            <p className="text-xs text-slate-300 leading-relaxed">
              Fabricación y venta de maquinaria para tortilla de harina. Más de 15 años de experiencia diseñando equipos industriales de alta resistencia y durabilidad.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <ShieldCheck size={16} />
              <span>Más de 15 Años de Experiencia Comprobada</span>
            </div>
          </div>

          {/* Col 2: Business Contact & Hours */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#2563eb]">
              Atención Telefónica & Pedidos
            </h4>

            <div className="space-y-2.5 text-slate-300">
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-[#2563eb] shrink-0" />
                <a href={`tel:+52${config.phone1.replace(/\D/g, '')}`} className="font-bold text-white hover:text-blue-400 transition">{config.phone1}</a>
              </p>

              <p className="flex items-center gap-2">
                <Phone size={14} className="text-[#2563eb] shrink-0" />
                <a href={`tel:+52${config.phone2.replace(/\D/g, '')}`} className="font-bold text-white hover:text-blue-400 transition">{config.phone2}</a>
              </p>

              <p className="flex items-center gap-2">
                <Mail size={14} className="text-[#2563eb] shrink-0" />
                <a href={`mailto:${config.email}`} className="hover:text-white transition">{config.email}</a>
              </p>

              <p className="flex items-start gap-2">
                <MapPin size={14} className="text-[#2563eb] shrink-0 mt-0.5" />
                <span>{config.address}</span>
              </p>

              <p className="flex items-start gap-2">
                <Clock size={14} className="text-[#2563eb] shrink-0 mt-0.5" />
                <span className="text-slate-400">Lun - Sáb: 8:00 AM - 7:00 PM</span>
              </p>
            </div>
          </div>

          {/* Col 3: Políticas de Envío y Pedido */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#2563eb]">
              Condiciones Comerciales
            </h4>

            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">🚚</span>
                <span><strong>Envíos:</strong> Realizamos envíos seguros a toda la República Mexicana.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">📦</span>
                <span><strong>Producción:</strong> Toda la maquinaria se fabrica sobre pedido.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">🏷️</span>
                <span><strong>Precios:</strong> Todos los precios mostrados son más gastos de envío.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">🛡️</span>
                <span>Garantía y asesoría técnica directa en cada equipo entregado.</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Social Media Buttons */}
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#2563eb]">
              Nuestras Redes Oficiales
            </h4>

            <p className="text-slate-400 text-xs">
              Síguenos para ver videos de nuestras máquinas trabajando en vivo:
            </p>

            {/* Only Facebook and TikTok as requested */}
            <div className="flex flex-wrap gap-3">
              
              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/19Zrjb7iP2/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-[#1877F2] text-white transition-all duration-200 hover:scale-105 shadow-sm font-bold text-xs"
                title="Facebook Maquinaria Renteria"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@maquinaria.renteria?_r=1&_t=ZS-99a303xcAsv"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-black text-white transition-all duration-200 hover:scale-105 shadow-sm border border-slate-700 font-bold text-xs"
                title="TikTok Maquinaria Renteria"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                <span>TikTok</span>
              </a>

              {/* Direct WhatsApp Contact Button */}
              <a
                href="https://wa.me/526391141084"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-[#25D366] text-white transition-all duration-200 hover:scale-105 shadow-sm font-bold text-xs"
                title="WhatsApp Maquinaria Renteria"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.776.979-.951 1.18-.175.2-.35.225-.651.075-.3-.15-1.267-.467-2.414-1.489-.893-.796-1.496-1.78-1.671-2.08-.175-.301-.019-.464.132-.613.136-.134.301-.35.451-.526.151-.175.2-.301.301-.501.1-.2.05-.375-.025-.526-.075-.15-.675-1.628-.925-2.228-.243-.585-.49-.506-.675-.515-.175-.008-.375-.01-.576-.01s-.526.075-.802.375c-.275.3-1.052 1.028-1.052 2.508 0 1.479 1.077 2.908 1.228 3.109.15.2 2.119 3.235 5.132 4.538.717.31 1.277.495 1.713.633.72.229 1.376.196 1.895.119.578-.087 1.78-.727 2.031-1.429.25-.701.25-1.303.175-1.428-.075-.126-.275-.201-.576-.351zM12.04 2c-5.523 0-10 4.477-10 10 0 1.768.461 3.428 1.264 4.872l-1.344 4.908 5.039-1.322c1.401.764 3.003 1.202 4.704 1.202 5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.277c-1.536 0-2.98-.415-4.228-1.137l-.303-.176-3.14.824.838-3.061-.194-.31c-.792-1.267-1.21-2.735-1.21-4.267 0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8.127-8 8.127z"/>
                </svg>
                <span>WhatsApp</span>
              </a>

            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              Canales oficiales directos de Maquinaria Renteria.
            </div>
          </div>

        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>
            © {new Date().getFullYear()} MAQUINARIA RENTERIA INDUSTRIAL. Todos los derechos reservados.
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Hecho en México</span>
            <span>•</span>
            <span>Acero AISI 304 Certificado</span>
            <span>•</span>
            <a 
              href="#admin" 
              className="text-slate-400 hover:text-white transition flex items-center gap-1 underline underline-offset-4 decoration-slate-600 hover:decoration-white"
              title="Panel de Administración"
            >
              <Lock size={11} className="text-[#2563eb]" />
              <span>Acceso Admin</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
