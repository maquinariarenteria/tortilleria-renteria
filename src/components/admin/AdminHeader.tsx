import React, { useState } from 'react';
import { RefreshCw, Palette, ChevronDown, X, ExternalLink, Database, Shield, CheckCircle2 } from 'lucide-react';

interface AdminHeaderProps {
  onRefresh: () => void;
  onExit: () => void;
  isRefreshing?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onRefresh, onExit, isRefreshing }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'midnight'>('midnight');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleToggleTheme = () => {
    setThemeMode(prev => prev === 'midnight' ? 'dark' : 'midnight');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
  };

  const handleViewLiveSite = () => {
    window.location.hash = '';
    window.location.reload();
  };

  return (
    <header className="bg-[#0f111a] border-b border-[#1e2235] px-4 md:px-8 py-3 sticky top-0 z-40 flex items-center justify-between text-white select-none">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-base md:text-lg text-white">ORION</span>
            <span className="text-xs bg-[#24293e] text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
              MAQUINARIA RENTERIA
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
            PANEL DE ADMINISTRACIÓN
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3 text-xs">
        {/* Status Pill: • - en línea */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#171b26] text-slate-300 border border-[#2b3147] px-2.5 py-1.5 rounded-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-medium tracking-tight">— en línea</span>
        </div>

        {/* Actualizar Button */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 bg-[#171b26] hover:bg-[#202637] active:scale-95 text-slate-200 border border-[#2b3147] px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer"
          title="Recargar datos de Cloudflare / almacenamiento local"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-300 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
          <span className="hidden xs:inline">Actualizar</span>
        </button>

        {/* Tema Button */}
        <button
          onClick={handleToggleTheme}
          className="flex items-center gap-1.5 bg-[#171b26] hover:bg-[#202637] active:scale-95 text-slate-200 border border-[#2b3147] px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer"
          title="Cambiar tono de tema"
        >
          <Palette className="w-3.5 h-3.5 text-slate-300" />
          <span>Tema</span>
        </button>

        {/* Opciones Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-1 bg-[#171b26] hover:bg-[#202637] active:scale-95 text-slate-200 border border-[#2b3147] px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer"
          >
            <span>Opciones</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showOptions && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-[#161a29] border border-[#2b3147] rounded-lg shadow-2xl py-1 z-50 text-slate-200"
              onMouseLeave={() => setShowOptions(false)}
            >
              <button
                onClick={() => {
                  setShowOptions(false);
                  handleViewLiveSite();
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#20263a] flex items-center justify-between text-xs transition-colors"
              >
                <span>Ver tienda en vivo</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setShowOptions(false);
                  alert('Cloudflare D1: tortilleria-renteria-db (Información estructurada)\nCloudflare R2: tortilleria-renteria-media (Archivos e Imágenes)');
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#20263a] flex items-center justify-between text-xs transition-colors"
              >
                <span>Entornos de Cloudflare</span>
                <Database className="w-3.5 h-3.5 text-purple-400" />
              </button>
              <div className="border-t border-[#22283d] my-1"></div>
              <button
                onClick={() => {
                  setShowOptions(false);
                  onExit();
                }}
                className="w-full text-left px-4 py-2 hover:bg-rose-950/40 text-rose-300 flex items-center justify-between text-xs transition-colors"
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
          className="flex items-center gap-1.5 bg-[#171b26] hover:bg-rose-900/30 hover:border-rose-700/50 hover:text-rose-200 active:scale-95 text-slate-200 border border-[#2b3147] px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer"
          title="Salir del Panel y regresar a la tienda"
        >
          <X className="w-3.5 h-3.5 text-slate-300" />
          <span>Salir</span>
        </button>
      </div>

      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 bg-purple-900 text-white border border-purple-500/50 px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-purple-300" />
          <span>Tema actualizado correctamente</span>
        </div>
      )}
    </header>
  );
};
