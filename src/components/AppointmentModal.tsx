import React, { useState } from 'react';
import { Appointment } from '../types/admin';
import { sendAppointmentNotificationEmail } from '../utils/emailService';
import { recordHotspotClick, getStoredMachines } from '../utils/adminStore';
import { Calendar, Clock, MapPin, Video, Phone, CheckCircle2, X, Send, MessageCircle } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMachine?: string;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  preselectedMachine = '',
}) => {
  const machines = getStoredMachines();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState<Appointment['type']>('Demostración en Taller (Delicias, Chih.)');
  const [machineOfInterest, setMachineOfInterest] = useState(preselectedMachine || (machines[0]?.name || 'Prensas y Rodillos'));
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppointment, setSubmittedAppointment] = useState<Appointment | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !scheduledDate) return;

    setIsSubmitting(true);
    recordHotspotClick('Agendar Cita / Demostración');

    const newAppointment: Appointment = {
      id: `cita_${Date.now()}`,
      customerName: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      type,
      machineOfInterest: machineOfInterest.trim(),
      scheduledDate,
      scheduledTime,
      status: 'Confirmada',
      notes: `${city ? `Ciudad: ${city}. ` : ''}${notes.trim()}`,
      reminderSent: false,
    };

    // Dispatch email and register directly into Admin Citas Tab
    await sendAppointmentNotificationEmail({ appointment: newAppointment });

    setIsSubmitting(false);
    setSubmittedAppointment(newAppointment);
  };

  const handleOpenWhatsAppConfirmation = () => {
    if (!submittedAppointment) return;
    const msg = 
      `*CITA AGENDADA - MAQUINARIA RENTERIA*\n\n` +
      `Hola, acabo de agendar una cita directamente desde la web:\n` +
      `• *Cliente:* ${submittedAppointment.customerName}\n` +
      `• *Teléfono:* ${submittedAppointment.phone}\n` +
      `• *Modalidad:* ${submittedAppointment.type}\n` +
      `• *Fecha:* ${submittedAppointment.scheduledDate} a las ${submittedAppointment.scheduledTime} hrs\n` +
      `• *Equipo de Interés:* ${submittedAppointment.machineOfInterest}\n\n` +
      `Me gustaría confirmar la disponibilidad con el asesor comercial.`;

    window.open(`https://wa.me/526391141084?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-sans animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900 max-h-[92vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-slate-900 tracking-wide">
                Agendar Cita con un Asesor
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Acuerda fecha directamente con el vendedor
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {submittedAppointment ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900 uppercase">
                  ¡Cita Registrada Exitosamente!
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Tu cita para el <b>{submittedAppointment.scheduledDate}</b> a las <b>{submittedAppointment.scheduledTime} hrs</b> ha sido guardada y notificada a nuestro equipo comercial.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <b className="text-slate-900">{submittedAppointment.customerName}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Modalidad:</span>
                  <span className="text-[#2563eb] font-bold">{submittedAppointment.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipo:</span>
                  <span className="text-slate-800">{submittedAppointment.machineOfInterest}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleOpenWhatsAppConfirmation}
                  className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>Confirmar Cita por WhatsApp con el Asesor</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-slate-700 space-y-1">
                <p className="font-bold text-[#2563eb]">
                  Visita nuestra planta en Delicias, Chih. o solicita videollamada:
                </p>
                <p className="text-[11px] text-slate-600">
                  Prueba el funcionamiento de las máquinas con tu propia harina o masa, o resuelve dudas técnicas en vivo con un especialista.
                </p>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Tu Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto Morales"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 dígitos"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="tucorreo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Ciudad y Estado</label>
                  <input
                    type="text"
                    placeholder="Ej. Monterrey, N.L."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                  />
                </div>
              </div>

              {/* Meeting Type */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Modalidad de la Cita *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Demostración en Taller (Delicias, Chih.)', label: 'En Planta (Delicias)', icon: MapPin },
                    { id: 'Videollamada en Vivo', label: 'Videollamada', icon: Video },
                    { id: 'Asesoría Técnica Telefónica', label: 'Telefónica', icon: Phone },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = type === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setType(m.id as any)}
                        className={`p-2.5 rounded-lg border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={14} />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Machine Selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Máquina o Tema de Interés</label>
                <select
                  value={machineOfInterest}
                  onChange={(e) => setMachineOfInterest(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none bg-white font-medium"
                >
                  <option value="Planta General y Catálogo Completo">Ver Catálogo Completo en Planta</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.sku})
                    </option>
                  ))}
                  <option value="Asesoría para Iniciar Tortillería">Asesoría para Iniciar Nueva Tortillería</option>
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Fecha Deseada *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Horario Preferido</label>
                  <select
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none bg-white font-medium"
                  >
                    <option value="09:30">09:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">Notas o Preguntas para el Vendedor</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Llevaré harina para probar receta, o requiero cotización con flete a mi ciudad..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registrando cita...</span>
                  ) : (
                    <>
                      <Calendar size={15} />
                      <span>Agendar Cita con el Vendedor</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
