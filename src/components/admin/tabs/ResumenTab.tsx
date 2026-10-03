import React from 'react';
import { 
  DollarSign, MessageSquare, Calendar, Users, 
  ArrowUpRight, Clock, Wrench, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { 
  getStoredQuotes, 
  getStoredSales, 
  getStoredAppointments, 
  getStoredSettings 
} from '../../../utils/adminStore';
import { AdminTab } from '../../../types/admin';

interface ResumenTabProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const ResumenTab: React.FC<ResumenTabProps> = ({ onNavigateTab }) => {
  const quotes = getStoredQuotes();
  const sales = getStoredSales();
  const appointments = getStoredAppointments();
  const settings = getStoredSettings();

  const totalSalesAmount = sales.reduce((acc, s) => acc + s.total, 0);
  const target = settings.monthlySalesTarget || 250000;
  const progressPercent = Math.min(100, Math.round((totalSalesAmount / target) * 100));

  const pendingQuotes = quotes.filter(q => q.status === 'Nueva' || q.status === 'En Negociación');
  const upcomingAppointments = appointments.filter(a => a.status === 'Confirmada');

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex items-center justify-center shrink-0">
            <img
              src="/images/logo_transparent.png"
              alt="Maquinaria Renteria"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide">
                MAQUINARIA <span className="text-[#2563eb]">RENTERIA</span>
              </h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                PLANTA EN VIVO
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Panel comercial y de control de fabricación • Delicias, Chihuahua
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('cotizaciones')}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Ver Cotizaciones</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('catalogo')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Catálogo
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Ventas vs Meta */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ventas Facturadas</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2563eb]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mb-2 font-mono">
            ${totalSalesAmount.toLocaleString()} <span className="text-xs font-bold text-slate-400">MXN</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
              <span>Meta mensual: ${target.toLocaleString()} MXN</span>
              <span className="text-[#2563eb] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#2563eb] h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Cotizaciones Activas */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cotizaciones Abiertas</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2563eb]">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mb-1 font-mono">
            {pendingQuotes.length} <span className="text-xs font-semibold text-slate-500">pendientes</span>
          </div>
          <p className="text-[11px] text-amber-700 font-bold">
            1 cotización nueva sin responder hoy
          </p>
        </div>

        {/* KPI 3: Citas en Taller */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Demostraciones en Taller</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2563eb]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mb-1 font-mono">
            {upcomingAppointments.length} <span className="text-xs font-semibold text-slate-500">agendadas</span>
          </div>
          <p className="text-[11px] text-[#2563eb] font-bold">
            Próxima demo: Delicias, Chihuahua
          </p>
        </div>

        {/* KPI 4: Tráfico Real */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Visitas Registradas</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2563eb]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight mb-1 font-mono">
            {settings.visitRecordsCount} <span className="text-xs font-semibold text-slate-500">visitas</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">
            Tasa de conversión a cotización: <b className="text-slate-900">8.6%</b>
          </p>
        </div>

      </div>

      {/* Row 2: Recent Activity & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Quotes Feed */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#2563eb]" />
              <span>Últimas Solicitudes de Cotización</span>
            </h3>
            <button
              onClick={() => onNavigateTab('cotizaciones')}
              className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {quotes.slice(0, 3).map((q) => (
              <div 
                key={q.id}
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {q.folio}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{q.customerName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      q.status === 'Nueva' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      q.status === 'En Negociación' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {q.status}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">· {q.stateOrCity}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-medium">
                    {q.items.map(i => i.name).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    ${q.estimatedTotal.toLocaleString()} MXN
                  </span>
                  <a
                    href={`https://wa.me/52${q.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(q.customerName)},%20te%20contacto%20de%20Maquinaria%20Renteria%20sobre%20tu%20cotizaci%C3%B3n.`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & System Status */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-2">
              Accesos Rápidos
            </h3>

            <button
              onClick={() => onNavigateTab('catalogo')}
              className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-[#2563eb]" />
                <span className="text-slate-800 font-bold">Subir foto de máquina a Cloudflare R2</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('citas')}
              className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#2563eb]" />
                <span className="text-slate-800 font-bold">Agendar demo en taller Delicias</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('ajustes')}
              className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#2563eb]" />
                <span className="text-slate-800 font-bold">Configuración de Reporte Mensual PDF</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Cloudflare Status Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-xs space-y-2.5">
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">
              Infraestructura Cloudflare
            </span>
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-medium">Cloudflare D1 (Datos)</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Conectado
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-medium">Cloudflare R2 (Fotos)</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Conectado
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-medium">Clave Secreta (ADMIN_PASSWORD)</span>
              <span className="text-[#2563eb] font-mono text-[11px] font-bold">Protegida</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
