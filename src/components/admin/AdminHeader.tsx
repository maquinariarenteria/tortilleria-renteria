import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Database, X, CheckCircle2, ChevronDown } from 'lucide-react';

interface AdminHeaderProps {
  onRefresh: () => Promise<boolean>;
  onExit: () => void;
  isRefreshing?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onRefresh, onExit, isRefreshing }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleRefreshClick = async () => {
    setShowSuccessToast(false);
    if (!await onRefresh()) return;
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
  };

  const handleViewLiveSite = () => {
    window.location.hash = '';
    window.location.reload();
  };

  return (
    <header className="bg-[#0f172a] border-b-2 border-[#2563eb] px-4 md:px-8 py-3 sticky top-0 z-40 flex items-center justify-between text-white select-none shadow-md">
      
      {/* Brand Header: Logo and Official Name */}
      <div className="flex items-center gap-3">
        <img
          src="/images/logo_gold_transparent.png"
          alt="Maquinaria Renteria"
          className="h-9 w-auto object-contain"
        />

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider text-base md:text-lg text-white uppercase">
              MAQUINARIA <span className="text-[#2563eb]">RENTERIA</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] bg-[#2563eb]/20 text-[#60a5fa] font-bold px-2 py-0.5 rounded border border-[#2563eb]/40 uppercase tracking-widest">
              ADMIN
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold tracking-wide uppercase">
            PANEL DE ADMINISTRACIÓN • <span className="text-slate-300 font-normal">El motor de tu tortillería</span>
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3 text-xs">
        
        {/* Status Pill: En línea */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#1e293b] text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-bold tracking-tight text-slate-300">Sesión verificada</span>
        </div>

        {/* Actualizar Button */}
        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] active:scale-95 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
          title="Recargar datos de Cloudflare / almacenamiento local"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#60a5fa] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">Actualizar</span>
        </button>

        {/* Opciones Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-1 bg-[#1e293b] hover:bg-[#334155] active:scale-95 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
          >
            <span>Opciones</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showOptions && (
            <div 
              className="absolute right-0 mt-2 w-64 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-slate-200"
              onMouseLeave={() => setShowOptions(false)}
            >
              <div className="px-4 py-2 border-b border-slate-700 text-[11px] text-slate-400">
                Servicios Cloudflare conectados
              </div>

              <button
                onClick={() => {
                  setShowOptions(false);
                  handleViewLiveSite();
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#334155] flex items-center justify-between text-xs transition-colors"
              >
                <span>Ver catálogo en vivo</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setShowOptions(false);
                  alert('D1 conserva cotizaciones, citas y pagos verificados. Consulta la pestaña Salud Web para comprobar la conexión y la disponibilidad de R2.');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#334155] flex items-center justify-between text-xs transition-colors"
              >
                <span>Almacenamiento Cloudflare D1 / R2</span>
                <Database className="w-3.5 h-3.5 text-[#60a5fa]" />
              </button>

              <div className="border-t border-slate-700 my-1"></div>

              <button
                onClick={() => {
                  setShowOptions(false);
                  onExit();
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-rose-950/60 text-rose-300 flex items-center justify-between text-xs transition-colors"
              >
                <span>Cerrar sesión de admin</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Salir Button */}
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
          title="Regresar a la tienda pública"
        >
          <X className="w-3.5 h-3.5" />
          <span>Salir</span>
        </button>

      </div>

      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 bg-[#0f172a] text-white border-2 border-[#2563eb] px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Datos de Maquinaria Rentería actualizados</span>
        </div>
      )}

    </header>
  );
};
