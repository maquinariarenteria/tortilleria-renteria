import React from 'react';
import { 
  DollarSign, ShoppingCart, Users, Calendar, TrendingUp, 
  ArrowUpRight, Clock, MessageSquare, Wrench, ChevronRight, CheckCircle2 
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
  const target = settings.monthlySalesTarget || 1000;
  // Convert target to MXN equivalent or show in USD
  const progressPercent = Math.min(100, Math.round((totalSalesAmount / (target * 19.5)) * 100));

  const pendingQuotes = quotes.filter(q => q.status === 'Nueva' || q.status === 'En Negociación');
  const upcomingAppointments = appointments.filter(a => a.status === 'Confirmada');

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#171b2b] via-[#141824] to-[#1a1f33] border border-[#232a42] p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Panel General de Maquinaria Renteria</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full">
              En Vivo
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Resumen de rendimiento comercial, pedidos de tortilladoras y solicitudes de cotización.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('cotizaciones')}
            className="bg-[#6366f1] hover:bg-[#5255e3] active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Ver Cotizaciones</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('catalogo')}
            className="bg-[#1e2336] hover:bg-[#282f48] text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#2d3652] transition-all cursor-pointer"
          >
            Editar Catálogo
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Ventas vs Meta */}
        <div className="bg-[#121520] border border-[#202538] p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Ventas del Mes</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight mb-2">
            ${totalSalesAmount.toLocaleString()} <span className="text-xs font-normal text-slate-400">MXN</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Meta mensual: ${target.toLocaleString()} USD</span>
              <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#1b2030] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Cotizaciones Activas */}
        <div className="bg-[#121520] border border-[#202538] p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Cotizaciones Abiertas</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight mb-2">
            {pendingQuotes.length} <span className="text-xs font-normal text-slate-400">pendientes</span>
          </div>
          <p className="text-[11px] text-purple-300 font-medium">
            1 cotización nueva sin responder hoy
          </p>
        </div>

        {/* KPI 3: Citas en Taller / Virtuales */}
        <div className="bg-[#121520] border border-[#202538] p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Citas Programadas</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight mb-2">
            {upcomingAppointments.length} <span className="text-xs font-normal text-slate-400">confirmadas</span>
          </div>
          <p className="text-[11px] text-cyan-300 font-medium">
            Próxima cita en 24h (Delicias, Chih.)
          </p>
        </div>

        {/* KPI 4: Tráfico Real */}
        <div className="bg-[#121520] border border-[#202538] p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Visitas Registradas</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight mb-2">
            {settings.visitRecordsCount} <span className="text-xs font-normal text-slate-400">visitas</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Tasa de conversión a cotización: <b className="text-white">8.6%</b>
          </p>
        </div>

      </div>

      {/* Row 2: Recent Activity & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Quotes Feed */}
        <div className="lg:col-span-8 bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f253a] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>Últimas Solicitudes de Cotización</span>
            </h3>
            <button
              onClick={() => onNavigateTab('cotizaciones')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {quotes.slice(0, 3).map((q) => (
              <div 
                key={q.id}
                className="bg-[#161a29] border border-[#252c42] p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/30 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">{q.customerName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      q.status === 'Nueva' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      q.status === 'En Negociación' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {q.status}
                    </span>
                    <span className="text-[11px] text-slate-400">· {q.stateOrCity}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {q.items.map(i => i.name).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#22283e]">
                  <span className="text-xs font-bold text-emerald-400">
                    ${q.estimatedTotal.toLocaleString()} MXN
                  </span>
                  <a
                    href={`https://wa.me/52${q.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(q.customerName)},%20te%20contacto%20de%20Maquinaria%20Renteria%20sobre%20tu%20cotizaci%C3%B3n.`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-[#121520] border border-[#202538] rounded-xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white mb-2">
              Accesos Directos
            </h3>

            <button
              onClick={() => onNavigateTab('catalogo')}
              className="w-full text-left bg-[#171b29] hover:bg-[#21273b] border border-[#272e45] p-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span className="text-slate-200 font-medium">Subir foto de máquina a R2</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              onClick={() => onNavigateTab('citas')}
              className="w-full text-left bg-[#171b29] hover:bg-[#21273b] border border-[#272e45] p-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-200 font-medium">Agendar demostración en taller</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              onClick={() => onNavigateTab('ajustes')}
              className="w-full text-left bg-[#171b29] hover:bg-[#21273b] border border-[#272e45] p-3 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-200 font-medium">Configurar Reporte Mensual PDF</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          {/* Cloudflare Status Widget */}
          <div className="bg-[#121520] border border-[#202538] rounded-xl p-5 shadow-xl text-xs space-y-2.5">
            <span className="text-slate-400 font-medium block text-[11px]">Infraestructura Cloudflare</span>
            <div className="flex items-center justify-between text-slate-300">
              <span>Cloudflare D1 (Datos)</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Cloudflare R2 (Imágenes)</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Clave secreta (ADMIN_PASSWORD)</span>
              <span className="text-purple-400 font-mono text-[10px]">Protegida</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
