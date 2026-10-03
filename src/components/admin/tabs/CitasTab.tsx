import React, { useState } from 'react';
import { Appointment } from '../../../types/admin';
import { getStoredAppointments, saveStoredAppointments } from '../../../utils/adminStore';
import { Calendar, Clock, MapPin, Video, Phone, CheckCircle2, Plus, X, User } from 'lucide-react';

export const CitasTab: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(getStoredAppointments());
  const [showNewModal, setShowNewModal] = useState(false);

  // New Appointment Form
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<Appointment['type']>('Demostración en Taller (Delicias, Chih.)');
  const [machineOfInterest, setMachineOfInterest] = useState('Rodillo Doble Grado Industrial');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !scheduledDate) return;

    const newApt: Appointment = {
      id: `apt_${Date.now()}`,
      customerName,
      phone,
      email,
      type,
      machineOfInterest,
      scheduledDate,
      scheduledTime,
      status: 'Confirmada',
      notes,
      reminderSent: false,
    };

    const updated = [newApt, ...appointments];
    saveStoredAppointments(updated);
    setAppointments(updated);
    setShowNewModal(false);

    // Reset
    setCustomerName('');
    setPhone('');
    setEmail('');
    setNotes('');
  };

  const handleToggleStatus = (id: string, newStatus: Appointment['status']) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status: newStatus } : a);
    saveStoredAppointments(updated);
    setAppointments(updated);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Agenda de Citas y Demostraciones</span>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
              {appointments.filter(a => a.status === 'Confirmada').length} Activas
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Programa pruebas en taller físico (Delicias, Chihuahua) o demostraciones virtuales por videollamada.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="bg-[#6366f1] hover:bg-[#5255e3] active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      {/* Grid of Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-[#121520] border border-[#202538] hover:border-cyan-500/30 p-5 rounded-xl shadow-lg space-y-3.5 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  apt.status === 'Confirmada' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' :
                  apt.status === 'Realizada' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                  'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  {apt.status}
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {apt.scheduledTime} hrs
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>{apt.customerName}</span>
                </h3>
                <p className="text-xs text-cyan-300 font-medium mt-0.5">
                  {apt.type}
                </p>
              </div>

              <div className="bg-[#161a28] p-2.5 rounded-lg border border-[#22283e] text-xs space-y-1">
                <div className="text-slate-300">
                  <span className="text-slate-400">Máquina a probar: </span>
                  <b>{apt.machineOfInterest}</b>
                </div>
                <div className="text-slate-400 text-[11px] flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{apt.phone}</span>
                </div>
              </div>

              {apt.notes && (
                <p className="text-[11px] text-slate-400 italic">
                  "{apt.notes}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-[#1c2032] flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {apt.scheduledDate}
              </span>
              <div className="flex items-center gap-1.5">
                {apt.status !== 'Realizada' && (
                  <button
                    onClick={() => handleToggleStatus(apt.id, 'Realizada')}
                    className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded cursor-pointer transition-colors"
                  >
                    Marcar Realizada
                  </button>
                )}
                <a
                  href={`https://wa.me/52${apt.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(apt.customerName)},%20te%20recordamos%20tu%20cita%20de%20demostraci%C3%B3n%20el%20d%C3%ADa%20${apt.scheduledDate}%20a%20las%20${apt.scheduledTime}%20en%20Maquinaria%20Renteria.`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded cursor-pointer transition-colors"
                >
                  Recordatorio
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121520] border border-[#242b42] rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#202538] pb-3">
              <h3 className="text-sm font-bold text-white">Agendar Nueva Cita</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Ing. Ramiro Salas"
                  className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="639 000 0000"
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Correo (Opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Cita</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Demostración en Taller (Delicias, Chih.)">Demostración en Taller (Delicias, Chih.)</option>
                  <option value="Videollamada en Vivo">Videollamada en Vivo</option>
                  <option value="Asesoría Técnica Telefónica">Asesoría Técnica Telefónica</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Máquina de Interés</label>
                <input
                  type="text"
                  value={machineOfInterest}
                  onChange={(e) => setMachineOfInterest(e.target.value)}
                  className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notas adicionales</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#181c2b] hover:bg-[#20263a] text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5255e3] text-white font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
