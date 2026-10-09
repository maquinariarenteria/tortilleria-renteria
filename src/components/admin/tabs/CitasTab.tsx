import React, { useState, useEffect } from 'react';
import { Appointment } from '../../../types/admin';
import { getStoredAppointments, saveStoredAppointments, deleteStoredAppointment, getSiteConfig } from '../../../utils/adminStore';
import { Calendar, Clock, MapPin, Video, Phone, CheckCircle2, Plus, X, User, Trash2 } from 'lucide-react';

export const CitasTab: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(getStoredAppointments());
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setAppointments(getStoredAppointments());
    };
    window.addEventListener('mr_appointments_updated', handleUpdate);
    return () => window.removeEventListener('mr_appointments_updated', handleUpdate);
  }, []);

  // New Appointment Form
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<Appointment['type']>('Demostración en Taller (Delicias, Chih.)');
  const [machineOfInterest, setMachineOfInterest] = useState('Rodillo Doble Grado Industrial Acero Inox');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  const handleCreateAppointment = async (e: React.FormEvent) => {
    try {
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
    await saveStoredAppointments(updated);
    setAppointments(updated);
    setShowNewModal(false);

    // Reset
    setCustomerName('');
    setPhone('');
    setEmail('');
    setNotes('');
    } catch (error) { window.alert(error instanceof Error ? error.message : "No se pudo guardar en el servidor."); }
  };

  const handleToggleStatus = async (id: string, newStatus: Appointment['status']) => {
    try {
    const updated = appointments.map(a => a.id === id ? { ...a, status: newStatus } : a);
    await saveStoredAppointments(updated);
    setAppointments(updated);
    } catch (error) { window.alert(error instanceof Error ? error.message : "No se pudo guardar en el servidor."); }
  };

  const handleDeleteAppointment = async (id: string, name: string) => {
    try {
    if (window.confirm(`¿Deseas archivar la cita de "${name}"? Se ocultará del panel y se conservará en D1 para recuperación.`)) {
      const updated = await deleteStoredAppointment(id);
      setAppointments(updated);
    }
    } catch (error) { window.alert(error instanceof Error ? error.message : "No se pudo guardar en el servidor."); }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span>Agenda de Citas y Demostraciones</span>
            <span className="text-xs bg-blue-50 text-[#2563eb] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {appointments.filter(a => a.status === 'Pendiente' || a.status === 'Confirmada').length} Activas
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Programa pruebas en taller físico ({getSiteConfig().address}) o videollamadas técnicas.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      {/* Grid of Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Aún no hay citas agendadas</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cuando un cliente agende una cita o demostración desde la web mediante el botón "Agendar Cita", aparecerá aquí en tiempo real para acordar detalles directamente con él.
            </p>
          </div>
        ) : (
          appointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl shadow-sm space-y-3.5 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  apt.status === 'Confirmada' ? 'bg-blue-50 text-[#2563eb] border-blue-200' :
                  apt.status === 'Realizada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {apt.status}
                </span>
                <span className="text-xs text-slate-500 font-mono font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {apt.scheduledTime} hrs
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#2563eb]" />
                  <span>{apt.customerName}</span>
                </h3>
                <p className="text-xs text-[#2563eb] font-bold mt-0.5">
                  {apt.type}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 font-medium">
                <div className="text-slate-700">
                  <span className="text-slate-500">Máquina a probar: </span>
                  <b className="text-slate-900">{apt.machineOfInterest}</b>
                </div>
                <div className="text-slate-600 text-[11px] flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span className="font-mono">{apt.phone}</span>
                </div>
              </div>

              {apt.notes && (
                <p className="text-[11px] text-slate-600 italic">
                  "{apt.notes}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono font-semibold">
                {apt.scheduledDate}
              </span>
              <div className="flex items-center gap-1.5">
                <select aria-label={`Estado de la cita de ${apt.customerName}`} value={apt.status}
                  onChange={e => void handleToggleStatus(apt.id, e.target.value as Appointment['status'])}
                  className="text-[11px] bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
                  <option>Pendiente</option><option>Confirmada</option><option>Realizada</option><option>Cancelada</option>
                </select>
                <a
                  href={`https://wa.me/52${apt.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(apt.customerName)},%20te%20recordamos%20tu%20cita%20de%20demostraci%C3%B3n%20el%20d%C3%ADa%20${apt.scheduledDate}%20a%20las%20${apt.scheduledTime}%20en%20Maquinaria%20Renteria.`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                >
                  WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => handleDeleteAppointment(apt.id, apt.customerName)}
                  title="Archivar cita (recuperable)"
                  className="p-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* New Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Agendar Nueva Demostración</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Ing. Ramiro Salas"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">WhatsApp / Teléfono</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="639 000 0000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Correo (Opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Tipo de Cita</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="Demostración en Taller (Delicias, Chih.)">Demostración en Taller (Delicias, Chih.)</option>
                  <option value="Videollamada en Vivo">Videollamada en Vivo</option>
                  <option value="Asesoría Técnica Telefónica">Asesoría Técnica Telefónica</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Máquina a Probar</label>
                <input
                  type="text"
                  value={machineOfInterest}
                  onChange={(e) => setMachineOfInterest(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Notas del Tortillero / Masa</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Traerá masa propia para prueba de cocción..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-[#2563eb] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 cursor-pointer"
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
