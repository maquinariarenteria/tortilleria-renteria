import React, { useState, useEffect } from 'react';
import { AdminTab } from '../../types/admin';
import { isAdminAuthenticated, setAdminAuthenticated, getStoredQuotes } from '../../utils/adminStore';
import { AdminHeader } from './AdminHeader';
import { AdminNavbar } from './AdminNavbar';
import { AdminAuthModal } from './AdminAuthModal';

// 13 Tabs
import { ResumenTab } from './tabs/ResumenTab';
import { CotizacionesTab } from './tabs/CotizacionesTab';
import { CitasTab } from './tabs/CitasTab';
import { VentasTab } from './tabs/VentasTab';
import { CuponesTab } from './tabs/CuponesTab';
import { OportunidadesTab } from './tabs/OportunidadesTab';
import { PruebaABTab } from './tabs/PruebaABTab';
import { MapaClicsTab } from './tabs/MapaClicsTab';
import { CatalogoTab } from './tabs/CatalogoTab';
import { PreciosOfertasTab } from './tabs/PreciosOfertasTab';
import { SaludWebTab } from './tabs/SaludWebTab';
import { SeguridadTab } from './tabs/SeguridadTab';
import { AjustesTab } from './tabs/AjustesTab';

interface AdminPanelProps {
  onExit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isAdminAuthenticated());
  const [activeTab, setActiveTab] = useState<AdminTab>('ajustes'); // default to 'ajustes' as in user's screenshot
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pendingQuotesCount, setPendingQuotesCount] = useState<number>(() => {
    const quotes = getStoredQuotes();
    return quotes.filter(q => q.status === 'Nueva').length || 1;
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(isAdminAuthenticated());
    };

    const handleQuotesUpdate = () => {
      const quotes = getStoredQuotes();
      setPendingQuotesCount(quotes.filter(q => q.status === 'Nueva').length);
    };

    window.addEventListener('mr_auth_changed', handleAuthChange);
    window.addEventListener('mr_quotes_updated', handleQuotesUpdate);

    return () => {
      window.removeEventListener('mr_auth_changed', handleAuthChange);
      window.removeEventListener('mr_quotes_updated', handleQuotesUpdate);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.dispatchEvent(new Event('mr_config_updated'));
      window.dispatchEvent(new Event('mr_machines_updated'));
      window.dispatchEvent(new Event('mr_quotes_updated'));
      window.dispatchEvent(new Event('mr_sales_updated'));
      window.dispatchEvent(new Event('mr_settings_updated'));
    }, 600);
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
    onExit();
  };

  // If not authenticated, display secure Cloudflare modal
  if (!isAuthenticated) {
    return (
      <AdminAuthModal
        onSuccess={() => setIsAuthenticated(true)}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Header with Status Pill and Action Controls */}
      <AdminHeader
        onRefresh={handleRefresh}
        onExit={handleLogout}
        isRefreshing={isRefreshing}
      />

      {/* 2. Top Navigation with all 13 Tabs */}
      <AdminNavbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        pendingQuotesCount={pendingQuotesCount}
      />

      {/* 3. Main Body: Active Tab Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'resumen' && <ResumenTab onNavigateTab={(t) => setActiveTab(t)} />}
        {activeTab === 'cotizaciones' && <CotizacionesTab />}
        {activeTab === 'citas' && <CitasTab />}
        {activeTab === 'ventas' && <VentasTab />}
        {activeTab === 'cupones' && <CuponesTab />}
        {activeTab === 'oportunidades' && <OportunidadesTab />}
        {activeTab === 'pruebas_ab' && <PruebaABTab />}
        {activeTab === 'mapa_clics' && <MapaClicsTab />}
        {activeTab === 'catalogo' && <CatalogoTab />}
        {activeTab === 'precios_ofertas' && <PreciosOfertasTab />}
        {activeTab === 'salud_web' && <SaludWebTab />}
        {activeTab === 'seguridad' && <SeguridadTab />}
        {activeTab === 'ajustes' && <AjustesTab />}
      </main>

    </div>
  );
};

export default AdminPanel;
