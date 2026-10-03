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
    <nav className="bg-[#1e293b] border-b border-slate-700 px-4 md:px-8 overflow-x-auto scrollbar-none select-none">
      <div className="flex items-center space-x-1 sm:space-x-2 py-1.5 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-3.5 py-2 text-xs md:text-sm font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 rounded-lg ${
                isActive
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span>{tab.label}</span>

              {/* Notification Badge */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white text-[#2563eb]' : 'bg-[#2563eb] text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
