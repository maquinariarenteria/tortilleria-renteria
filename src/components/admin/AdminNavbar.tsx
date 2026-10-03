import React from 'react';
import { AdminTab } from '../../types/admin';

interface AdminNavbarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingQuotesCount?: number;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  activeTab,
  onTabChange,
  pendingQuotesCount = 1,
}) => {
  const tabs: { id: AdminTab; label: string; badge?: number }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'cotizaciones', label: 'Cotizaciones', badge: pendingQuotesCount },
    { id: 'citas', label: 'Citas' },
    { id: 'ventas', label: 'Ventas' },
    { id: 'cupones', label: 'Cupones' },
    { id: 'oportunidades', label: 'Oportunidades' },
    { id: 'pruebas_ab', label: 'Prueba A/B' },
    { id: 'mapa_clics', label: 'Mapa de clics y recorridos' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'precios_ofertas', label: 'Precios y ofertas' },
    { id: 'salud_web', label: 'Salud de la web' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'ajustes', label: 'Ajustes' },
  ];

  return (
    <nav className="bg-[#0b0d14] border-b border-[#1c2033] px-4 md:px-8 overflow-x-auto scrollbar-none select-none">
      <div className="flex items-center space-x-1 sm:space-x-2 py-1 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-3 py-2 text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151929]/50 rounded-md'
              }`}
            >
              <span>{tab.label}</span>

              {/* Notification Badge */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold bg-[#6366f1] text-white">
                  {tab.badge}
                </span>
              )}

              {/* Active Tab Underline Indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#818cf8] rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
