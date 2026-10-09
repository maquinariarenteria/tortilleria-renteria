import React, { useState, useEffect } from 'react';
import { AdminTab } from '../../types/admin';
import { setAdminAuthenticated, getStoredQuotes, refreshAdminStore } from '../../utils/adminStore';
import { storeRequest } from '../../services/storeApi';
import { AdminHeader } from './AdminHeader';
import { AdminNavbar } from './AdminNavbar';
import { AdminAuthModal } from './AdminAuthModal';

// 13 Tabs
import { ResumenTab } from './tabs/ResumenTab';
import { CotizacionesTab } from './tabs/CotizacionesTab';
import { CitasTab } from './tabs/CitasTab';
import { VentasTab } from './tabs/VentasTab';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [syncError, setSyncError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('ajustes'); // default to 'ajustes' as in user's screenshot
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [pendingQuotesCount, setPendingQuotesCount] = useState<number>(() => {
    const quotes = getStoredQuotes();
    return quotes.filter(q => q.status === 'Nueva').length;
  });

  useEffect(() => {
    let active = true;
    const check = async () => {
      try { await storeRequest('/api/admin/verify'); await refreshAdminStore(); if (active) setIsAuthenticated(true); }
      catch { if (active) { setIsAuthenticated(false); } }
      finally { if (active) setCheckingSession(false); }
    };
    void check();

    const handleQuotesUpdate = () => {
      const quotes = getStoredQuotes();
      setPendingQuotesCount(quotes.filter(q => q.status === 'Nueva').length);
    };


    window.addEventListener('mr_quotes_updated', handleQuotesUpdate);

    return () => {
      active = false;

      window.removeEventListener('mr_quotes_updated', handleQuotesUpdate);
    };
  }, []);
  useEffect(() => {
    if (!isAuthenticated) return;
    const sync = () => { if (document.visibilityState === 'visible') void refreshAdminStore().then(() => setSyncError('')).catch(e => { setSyncError(e.message); if (e.status === 401) { setAdminAuthenticated(false); setIsAuthenticated(false); } }); };
    sync(); const timer = window.setInterval(sync, 30000);
    window.addEventListener('focus', sync);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', sync); };
  }, [isAuthenticated]);

  const handleRefresh = () => {
    void refreshAdminStore().catch(e => setSyncError(e.message));
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

  const handleLogout = async () => {
    try { await storeRequest('/api/admin/logout', { method: 'POST', body: '{}' }); setAdminAuthenticated(false); setIsAuthenticated(false); onExit(); }
    catch (error) { setSyncError(error instanceof Error ? error.message : 'No se pudo cerrar la sesión. Intenta nuevamente.'); }
  };

  // If not authenticated, display secure Cloudflare modal
  if (checkingSession) return <p role="status" className="p-8">Comprobando sesión…</p>;
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
        {syncError && <p role="alert" className="p-4 text-red-700">{syncError}</p>}
        {activeTab === 'resumen' && <ResumenTab onNavigateTab={(t) => setActiveTab(t)} />}
        {activeTab === 'cotizaciones' && <CotizacionesTab />}
        {activeTab === 'citas' && <CitasTab />}
        {activeTab === 'ventas' && <VentasTab />}
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
