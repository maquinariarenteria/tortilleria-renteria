import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, Truck, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { sendContactInquiryEmail } from '../utils/emailService';
import { getSiteConfig, recordHotspotClick } from '../utils/adminStore';
import { CustomerQuote } from '../types/admin';

export const ContactSection: React.FC = () => {
  const [config, setConfig] = useState(getSiteConfig());
  const [submittedQuote, setSubmittedQuote] = useState<CustomerQuote | null>(null);

  useEffect(() => {
    const handleConfigUpdate = () => {
      setConfig(getSiteConfig());
    };
    window.addEventListener('mr_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('mr_config_updated', handleConfigUpdate);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setIsSubmitting(true);
    recordHotspotClick('Formulario de Contacto');

    const result = await sendContactInquiryEmail({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      message: formData.message,
    });

    setIsSubmitting(false);
    setSubmittedQuote(result.quote);
  };

  return (
    <section id="contact-section" className="py-12 border-t border-slate-200 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal direction="down">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wider">
              INFORMACIÓN DE PLANTA & CONTACTO
            </h2>
            <span className="text-xs text-slate-500 font-mono mt-1 block uppercase">
              Maquinaria Renteria • Fabricación directa y distribución nacional
            </span>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          
          {/* Left: Expanded Information (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            <ScrollReveal direction="left" delay={100}>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 text-xs">
                
                <div className="border-b border-slate-200 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2563eb] uppercase tracking-wider block">
                      FABRICACIÓN & VENTAS DIRECTAS
                    </span>
                    <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      +15 Años de Experiencia
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase mt-0.5">
                    MAQUINARIA RENTERIA
                  </h3>
                  <p className="text-blue-600 font-bold italic text-xs mt-0.5">
                    "El motor de tu tortillería"
                  </p>
                  <p className="text-slate-600 mt-1">
                    Fabricación y venta de maquinaria para tortilla de harina. Especialistas en prensas térmicas, amasadoras, cortadoras de 36 tantos y boleadoras automáticas.
                  </p>
                </div>

                {/* Direct Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800">
                  <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200">
                    <Phone size={16} className="text-[#2563eb] shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Teléfono 1:</span>
                      <a href={`tel:+52${config.phone1.replace(/\D/g, '')}`} className="font-bold hover:text-[#2563eb]">{config.phone1}</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200">
                    <Phone size={16} className="text-[#2563eb] shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Teléfono 2:</span>
                      <a href={`tel:+52${config.phone2.replace(/\D/g, '')}`} className="font-bold hover:text-[#2563eb]">{config.phone2}</a>
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200">
                    <Mail size={16} className="text-[#2563eb] shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Correo Oficial:</span>
                      <a href={`mailto:${config.email}`} className="font-bold hover:text-[#2563eb]">{config.email}</a>
                    </div>
                  </div>
                </div>

                {/* Location, Hours, Shipping Info */}
                <div className="space-y-2.5 pt-1 text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-[#2563eb] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Ubicación de Planta: </span>
                      <span>Av. Fernando Baeza #1402, Delicias, Chihuahua, México.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Truck size={16} className="text-[#2563eb] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Envíos y Fletes: </span>
                      <span className="font-medium text-slate-800">Envíos seguros a toda la República. El flete se acuerda con el vendedor.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock size={16} className="text-[#2563eb] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Producción y Pedidos: </span>
                      <span>Maquinaria fabricada sobre pedido. Calidad industrial probada en banco.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CreditCard size={16} className="text-[#2563eb] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Formas de Pago: </span>
                      <span>Pagos con tarjeta de crédito y débito (Visa, Mastercard, American Express vía Stripe), transferencia bancaria nacional SPEI y facturación fiscal CFDI (+16% IVA).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-[#2563eb] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Experiencia y Respaldo: </span>
                      <span>Más de 15 años dedicados a la fabricación artesanal e industrial de maquinaria tortillera.</span>
                    </div>
                  </div>
                </div>

                {/* Direct WhatsApp Action */}
                <a
                  href="https://wa.me/526391141084?text=Hola%20Maquinaria%20Renteria,%20solicito%20informacion%20y%20cotizacion."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-4 shadow-sm transition cursor-pointer"
                >
                  <MessageCircle size={16} />
                  Atención Directa por WhatsApp (639 114 1084)
                </a>

              </div>
            </ScrollReveal>

          </div>

          {/* Right: Minimal Form (5 cols) */}
          <div className="lg:col-span-5">
            <ScrollReveal direction="right" delay={150}>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                  COTIZACIÓN RÁPIDA
                </span>
                <h4 className="text-sm font-black uppercase text-slate-900 mb-3">
                  Solicita tu cotización
                </h4>

                {submittedQuote ? (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                      <CheckCircle2 size={24} />
                    </div>
                    <span className="font-black text-slate-900 block text-sm uppercase">¡Cotización Registrada!</span>
                    <span className="font-mono text-xs font-bold text-[#2563eb] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 inline-block">
                      Folio: #{submittedQuote.folio}
                    </span>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Hemos recibido tu solicitud y la registramos en nuestro sistema comercial. Un asesor se comunicará contigo hoy mismo.
                    </p>
                    <a
                      href={`https://wa.me/526391141084?text=Hola%20Maquinaria%20Renteria,%20acabo%20de%20enviar%20mi%20cotizaci%C3%B3n%20%23${submittedQuote.folio}%20a%20nombre%20de%20${encodeURIComponent(formData.name)}.`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition mt-2 cursor-pointer"
                    >
                      <MessageCircle size={15} />
                      Continuar por WhatsApp
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Tu nombre completo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">WhatsApp / Teléfono *</label>
                        <input
                          type="tel"
                          required
                          placeholder="10 dígitos"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Correo Electrónico</label>
                        <input
                          type="email"
                          placeholder="tu@correo.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Ciudad y Estado de Entrega</label>
                      <input
                        type="text"
                        placeholder="Ej. Hermosillo, Sonora"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Equipo o Capacidad Requerida *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Ej. Prensa de 1,200 tortillas/hora o comal rotativo..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-flat-primary py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Send size={14} />
                      <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}</span>
                    </button>
                  </form>
                )}
              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
};
