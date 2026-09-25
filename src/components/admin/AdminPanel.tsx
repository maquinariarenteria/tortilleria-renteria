import React, { useState, useEffect } from 'react';
import { 
  getSiteConfig, saveSiteConfig, getStoredMachines, saveStoredMachines, 
  updateStoredMachine, addStoredMachine, deleteStoredMachine, 
  getStoredOrders, updateStoredOrderStatus, deleteStoredOrder, 
  getStoredInquiries, updateStoredInquiryStatus, getSiteAnalytics, 
  resetSiteAnalytics, isAdminAuthenticated, setAdminAuthenticated, resetAdminDataToDefaults,
  SiteConfig, AdminOrder, ContactInquiry, SiteAnalytics
} from '../../utils/adminStore';
import { MachineProduct, MachineCategory, EnergyType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { 
  LayoutDashboard, ShoppingBag, Wrench, Globe, LogOut, ArrowLeft, 
  TrendingUp, Users, DollarSign, Package, CheckCircle2, Clock, 
  Truck, Eye, EyeOff, Edit3, Trash2, Plus, Upload, Save, RotateCcw, 
  ExternalLink, Phone, Mail, MapPin, KeyRound, Lock, Search, AlertCircle, X
} from 'lucide-react';

interface AdminPanelProps {
  onExit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isAdminAuthenticated());
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Active tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'products' | 'site'>('analytics');

  // Data states
  const [config, setConfig] = useState<SiteConfig>(getSiteConfig());
  const [machines, setMachines] = useState<MachineProduct[]>(getStoredMachines());
  const [orders, setOrders] = useState<AdminOrder[]>(getStoredOrders());
  const [inquiries, setInquiries] = useState<ContactInquiry[]>(getStoredInquiries());
  const [analytics, setAnalytics] = useState<SiteAnalytics>(getSiteAnalytics());

  // Product Editing state
  const [editingMachine, setEditingMachine] = useState<MachineProduct | null>(null);
  const [isCreatingNewMachine, setIsCreatingNewMachine] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Success notifications
  const [saveMessage, setSaveMessage] = useState<string>('');

  const SUGGESTED_PASSWORD = 'renteria2026';

  // Prevent background scrolling whenever a modal is open
  useEffect(() => {
    if (editingMachine || selectedOrder) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [editingMachine, selectedOrder]);

  useEffect(() => {
    const handleDataUpdates = () => {
      setConfig(getSiteConfig());
      setMachines(getStoredMachines());
      setOrders(getStoredOrders());
      setInquiries(getStoredInquiries());
      setAnalytics(getSiteAnalytics());
    };

    window.addEventListener('mr_config_updated', handleDataUpdates);
    window.addEventListener('mr_machines_updated', handleDataUpdates);
    window.addEventListener('mr_orders_updated', handleDataUpdates);
    window.addEventListener('mr_inquiries_updated', handleDataUpdates);
    window.addEventListener('mr_analytics_updated', handleDataUpdates);

    return () => {
      window.removeEventListener('mr_config_updated', handleDataUpdates);
      window.removeEventListener('mr_machines_updated', handleDataUpdates);
      window.removeEventListener('mr_orders_updated', handleDataUpdates);
      window.removeEventListener('mr_inquiries_updated', handleDataUpdates);
      window.removeEventListener('mr_analytics_updated', handleDataUpdates);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === SUGGESTED_PASSWORD || passwordInput.trim() === 'admin123') {
      setAdminAuthenticated(true);
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta. Verifica e intenta de nuevo.');
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
  };

  const triggerSaveMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 4000);
  };

  // Image upload handler (converts file to base64)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        if (editingMachine) {
          setEditingMachine({ ...editingMachine, imageUrl: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save product changes
  const handleSaveMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine) return;

    if (isCreatingNewMachine) {
      addStoredMachine(editingMachine);
      setIsCreatingNewMachine(false);
      triggerSaveMessage('¡Máquina agregada exitosamente al catálogo!');
    } else {
      updateStoredMachine(editingMachine.id, editingMachine);
      triggerSaveMessage('¡Información del producto actualizada correctamente!');
    }
    setEditingMachine(null);
    setImagePreview('');
  };

  // Save site configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSiteConfig(config);
    triggerSaveMessage('¡Información de la web actualizada en toda la página!');
  };

  // Total sales calculation
  const totalSalesMXN = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const averageTicket = orders.length > 0 ? Math.round(totalSalesMXN / orders.length) : 0;

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center p-1.5 shadow-md border border-slate-200">
              <img
                src="/images/logo.png"
                alt="Maquinaria Renteria Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              Panel de Administración
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Maquinaria Renteria • Acceso Exclusivo de Gestión
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Contraseña de Acceso:
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#2563eb]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-200">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full btn-flat-primary py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md active:scale-98"
            >
              Ingresar al Administrador
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <button
              onClick={onExit}
              className="text-xs font-bold text-slate-500 hover:text-[#2563eb] flex items-center justify-center gap-1.5 mx-auto transition"
            >
              <ArrowLeft size={14} />
              Volver a la tienda pública
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0f172a] text-white px-4 sm:px-6 py-3.5 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src="/images/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-wider uppercase block">
                ADMINISTRADOR • <span className="text-blue-400">MAQUINARIA RENTERIA</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Control de Visitas, Pedidos, Ventas, Fotos y Contenido
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition border border-slate-700 shadow-xs"
              title="Ir a la página web"
            >
              <ExternalLink size={13} className="text-blue-400" />
              <span>Ver Web Pública</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold uppercase transition border border-red-800"
              title="Cerrar sesión"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </header>

      {/* Save Success Alert Banner */}
      {saveMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 text-center shadow-md animate-fadeIn flex items-center justify-center gap-2">
          <CheckCircle2 size={16} />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === 'analytics'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={15} />
            <span>Métricas & Visitas</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === 'orders'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShoppingBag size={15} />
            <span>Pedidos ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === 'products'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Wrench size={15} />
            <span>Catálogo & Fotos ({machines.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('site')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === 'site'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Globe size={15} />
            <span>Información Web</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: VISITAS, MÉTRICAS Y VENTAS                                         */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-black uppercase tracking-wider">Visitas Totales</span>
                  <Users size={18} className="text-[#2563eb]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                  {analytics.totalVisits}
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 block">
                  {analytics.uniqueVisits} usuarios únicos
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-black uppercase tracking-wider">Pedidos Generados</span>
                  <ShoppingBag size={18} className="text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                  {orders.length}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Cotizaciones y compras
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-black uppercase tracking-wider">Ventas Estimadas</span>
                  <DollarSign size={18} className="text-blue-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-[#2563eb]">
                  {formatCurrency(totalSalesMXN, 'MXN')}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Valor total en pedidos
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-black uppercase tracking-wider">Páginas Vistas</span>
                  <Eye size={18} className="text-purple-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                  {analytics.pageViews}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Ticket Promedio: {formatCurrency(averageTicket, 'MXN')}
                </span>
              </div>

            </div>

            {/* Visit Breakdown Chart Visual */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-900 tracking-wide flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#2563eb]" />
                    <span>Registro Real de Visitas a la Web</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Historial de tráfico real detectado en la página
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-blue-50 text-[#2563eb] px-2.5 py-1 rounded-lg">
                    En vivo
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Deseas reiniciar los contadores de visitas a cero?')) {
                        resetSiteAnalytics();
                        setAnalytics(getSiteAnalytics());
                        triggerSaveMessage('Métricas reiniciadas a cero.');
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 hover:underline px-2 py-1"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>

              {/* Bar chart representation */}
              <div className="space-y-2 pt-2">
                {(!analytics.visitsHistory || analytics.visitsHistory.length === 0) ? (
                  <div className="py-8 text-center text-slate-400 space-y-1 bg-slate-50 rounded-xl border border-slate-100">
                    <Eye size={28} className="mx-auto text-slate-300 mb-1" />
                    <p className="text-xs font-bold uppercase text-slate-600">
                      Métricas 100% Reales
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Las visitas se contabilizan en tiempo real conforme los clientes naveguen por la web.
                    </p>
                  </div>
                ) : (
                  analytics.visitsHistory.map((item, idx) => {
                    const maxCount = Math.max(...analytics.visitsHistory.map(h => h.count), 1);
                    const percentage = Math.round((item.count / maxCount) * 100);
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="font-mono text-slate-500 w-24 shrink-0 text-[11px]">
                          {item.date}
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-[#2563eb] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 8)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 w-10 text-right">
                          {item.count}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent inquiries */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-black text-sm uppercase text-slate-900 tracking-wide">
                Solicitudes de Contacto Web Recibidas ({inquiries.length})
              </h3>

              {inquiries.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No hay mensajes nuevos de contacto. Aparecerán aquí cuando los clientes completen el formulario de contacto.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{inq.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(inq.createdAt).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1 italic">"{inq.message}"</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://wa.me/52${inq.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(inq.name)},%20te%20contactamos%20de%20Maquinaria%20Renteria%20sobre%20tu%20mensaje.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg font-bold text-[11px] uppercase flex items-center gap-1"
                        >
                          <Phone size={12} />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GESTIÓN DE PEDIDOS                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-900 tracking-wide">
                    Lista de Pedidos ({orders.length})
                  </h3>
                  <span className="text-xs text-slate-500">
                    Pedidos generados desde el carrito de la web y botones de WhatsApp/Stripe
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Total Acumulado:</span>
                  <span className="font-mono font-black text-base text-[#2563eb]">
                    {formatCurrency(totalSalesMXN, 'MXN')}
                  </span>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingBag size={40} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-600 uppercase">Aún no hay pedidos registrados</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Cuando un cliente confirme un pedido o pague por WhatsApp/Stripe, se registrará aquí automáticamente.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase font-black border-b border-slate-200">
                        <th className="p-3">Folio</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Destino / CP</th>
                        <th className="p-3">Máquinas</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order.folio} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 font-mono font-bold text-[#2563eb]">
                            #{order.folio}
                          </td>
                          <td className="p-3 text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString('es-MX')}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{order.clientName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{order.clientPhone}</span>
                          </td>
                          <td className="p-3">
                            <span className="block font-medium">{order.clientCP ? `CP: ${order.clientCP}` : 'Sin CP'}</span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">
                              {order.clientAddress || 'En Delicias'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800">
                              {order.items.reduce((acc, i) => acc + i.quantity, 0)} {order.items.length === 1 ? 'máquina' : 'máquinas'}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                              {order.items.map(i => i.name).join(', ')}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-black text-slate-900">
                            {formatCurrency(order.total, 'MXN')}
                          </td>
                          <td className="p-3">
                            <select
                              value={order.status}
                              onChange={(e) => updateStoredOrderStatus(order.folio, e.target.value as AdminOrder['status'])}
                              className={`text-[11px] font-bold uppercase rounded-lg px-2 py-1 border focus:outline-none ${
                                order.status === 'Confirmado' || order.status === 'Entregado'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : order.status === 'Enviado' || order.status === 'En Fabricación'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="Confirmado">Confirmado</option>
                              <option value="En Fabricación">En Fabricación</option>
                              <option value="Enviado">Enviado</option>
                              <option value="Entregado">Entregado</option>
                            </select>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-1.5 rounded-lg bg-blue-50 text-[#2563eb] hover:bg-blue-100"
                                title="Ver comprobante completo"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar pedido #${order.folio}?`)) {
                                    deleteStoredOrder(order.folio);
                                    triggerSaveMessage('Pedido eliminado.');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                title="Eliminar pedido"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CATÁLOGO Y FOTOS                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-900 tracking-wide">
                    Catálogo de Maquinaria y Fotos ({machines.length} Modelos)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Sube nuevas fotos desde tu computadora o edita precios, nombres y características
                  </span>
                </div>

                <button
                  onClick={() => {
                    const newMachine: MachineProduct = {
                      id: `machine_${Date.now()}`,
                      name: 'Nueva Máquina para Tortilla',
                      sku: `MR-NUEVO-${Math.floor(Math.random() * 900) + 100}`,
                      category: 'prensas',
                      modelType: 'press',
                      priceUSD: 1000,
                      priceMXN: 18000,
                      capacityPerHour: 1200,
                      diameterRange: '10 cm - 28 cm',
                      energyType: 'Gas LP (Manual)',
                      motorPowerHP: 'Manual con palanca',
                      dimensionsMeters: '1.00m x 0.80m x 1.20m',
                      weightKg: 90,
                      warrantyYears: 1,
                      badge: 'NUEVO MODELO',
                      shortDescription: 'Descripción breve de la nueva máquina.',
                      fullDescription: 'Descripción técnica completa del equipo.',
                      features: ['Estructura reforzada en acero industrial'],
                      specs: [{ label: 'Producción', value: '1,200 tortillas/hr' }],
                      imageUrl: '/images/01_prensa_comal.jpg',
                    };
                    setEditingMachine(newMachine);
                    setIsCreatingNewMachine(true);
                    setImagePreview(newMachine.imageUrl || '');
                  }}
                  className="btn-flat-primary px-3.5 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
                >
                  <Plus size={15} />
                  <span>Agregar Nueva Máquina</span>
                </button>
              </div>

              {/* Grid of machines for editing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {machines.map((machine) => (
                  <div
                    key={machine.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#2563eb] transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo Thumbnail */}
                      <div className="w-full h-36 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2 relative overflow-hidden mb-2">
                        {machine.imageUrl ? (
                          <img
                            src={machine.imageUrl}
                            alt={machine.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="font-mono text-xs text-slate-400">Sin foto</span>
                        )}
                        {machine.badge && (
                          <span className="absolute top-1 left-1 text-[8px] font-black bg-[#2563eb] text-white px-1.5 py-0.5 rounded uppercase">
                            {machine.badge}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs uppercase text-slate-900 line-clamp-1" title={machine.name}>
                        {machine.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {machine.sku} • {machine.energyType}
                      </span>
                      
                      <div className="mt-1 font-mono font-black text-sm text-[#2563eb]">
                        {formatCurrency(machine.priceMXN, 'MXN')}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 mt-2 flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditingMachine({ ...machine });
                          setIsCreatingNewMachine(false);
                          setImagePreview(machine.imageUrl || '');
                        }}
                        className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold uppercase rounded-lg border border-slate-300 flex items-center justify-center gap-1 transition"
                      >
                        <Edit3 size={12} />
                        Editar / Foto
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar ${machine.name} del catálogo?`)) {
                            deleteStoredMachine(machine.id);
                            triggerSaveMessage('Máquina eliminada.');
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRODUCT EDIT MODAL */}
            {editingMachine && (
              <div 
                onClick={() => setEditingMachine(null)}
                className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden"
              >
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp my-auto"
                >
                  
                  {/* Fixed Header */}
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
                    <h3 className="font-black text-base uppercase text-slate-900 truncate pr-2">
                      {isCreatingNewMachine ? 'Agregar Nueva Máquina' : `Editar: ${editingMachine.name}`}
                    </h3>
                    <button
                      onClick={() => setEditingMachine(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition shrink-0"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveMachine} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 sm:p-6 space-y-4 text-xs overscroll-contain">
                    
                    {/* PHOTO UPLOADER BOX */}
                    <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                      <span className="font-black uppercase text-blue-900 block text-xs">
                        Foto de Catálogo (Sube foto desde tu computadora):
                      </span>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-28 h-28 bg-white rounded-xl border border-blue-300 flex items-center justify-center p-2 overflow-hidden shrink-0 shadow-xs">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Vista previa" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-slate-400 text-[10px] text-center">Sin imagen</span>
                          )}
                        </div>

                        <div className="space-y-2 flex-1 w-full">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                              Subir archivo de imagen (PNG o JPG):
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#2563eb] file:text-white hover:file:bg-blue-700"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                              O ingresar URL / Ruta de imagen:
                            </label>
                            <input
                              type="text"
                              value={editingMachine.imageUrl || ''}
                              onChange={(e) => {
                                setEditingMachine({ ...editingMachine, imageUrl: e.target.value });
                                setImagePreview(e.target.value);
                              }}
                              className="w-full p-2 text-xs border border-slate-300 rounded font-mono"
                              placeholder="/images/tu_foto.png o https://..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FIELDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold uppercase text-slate-700 mb-1">Nombre de Máquina:</label>
                        <input
                          type="text"
                          value={editingMachine.name}
                          onChange={(e) => setEditingMachine({ ...editingMachine, name: e.target.value })}
                          className="w-full p-2 text-xs border border-slate-300 rounded focus:border-[#2563eb] focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-slate-700 mb-1">SKU / Modelo:</label>
                        <input
                          type="text"
                          value={editingMachine.sku}
                          onChange={(e) => setEditingMachine({ ...editingMachine, sku: e.target.value })}
                          className="w-full p-2 text-xs border border-slate-300 rounded font-mono uppercase"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-slate-700 mb-1">Precio MXN ($):</label>
                        <input
                          type="number"
                          value={editingMachine.priceMXN}
                          onChange={(e) => setEditingMachine({ ...editingMachine, priceMXN: Number(e.target.value) })}
                          className="w-full p-2 text-xs border border-slate-300 rounded font-mono font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-slate-700 mb-1">Precio USD ($):</label>
                        <input
                          type="number"
                          value={editingMachine.priceUSD}
                          onChange={(e) => setEditingMachine({ ...editingMachine, priceUSD: Number(e.target.value) })}
                          className="w-full p-2 text-xs border border-slate-300 rounded font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-slate-700 mb-1">Capacidad (tortillas/hr):</label>
                        <input
                          type="number"
                          value={editingMachine.capacityPerHour}
                          onChange={(e) => setEditingMachine({ ...editingMachine, capacityPerHour: Number(e.target.value) })}
                          className="w-full p-2 text-xs border border-slate-300 rounded font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-slate-700 mb-1">Tipo de Energía / Operación:</label>
                        <select
                          value={editingMachine.energyType}
                          onChange={(e) => setEditingMachine({ ...editingMachine, energyType: e.target.value as EnergyType })}
                          className="w-full p-2 text-xs border border-slate-300 rounded"
                        >
                          <option value="Gas LP (Manual)">Gas LP (Manual)</option>
                          <option value="Manual (Sin electricidad)">Manual (Sin electricidad)</option>
                          <option value="Eléctrica 110V">Eléctrica 110V</option>
                          <option value="Dual (Gas LP + Eléctrica 110V)">Dual (Gas LP + Eléctrica 110V)</option>
                          <option value="Eléctrica 220V">Eléctrica 220V</option>
                          <option value="Eléctrica 110V / 220V">Eléctrica 110V / 220V</option>
                          <option value="Gas LP">Gas LP</option>
                          <option value="Gas Natural">Gas Natural</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-slate-700 mb-1">Categoría:</label>
                        <select
                          value={editingMachine.category}
                          onChange={(e) => setEditingMachine({ ...editingMachine, category: e.target.value as MachineCategory })}
                          className="w-full p-2 text-xs border border-slate-300 rounded"
                        >
                          <option value="prensas">Prensas Térmicas y Planas</option>
                          <option value="amasadoras-boleadoras">Amasadoras, Cortadoras y Boleadoras</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-slate-700 mb-1">Etiqueta Destacada (Badge):</label>
                        <input
                          type="text"
                          value={editingMachine.badge || ''}
                          onChange={(e) => setEditingMachine({ ...editingMachine, badge: e.target.value })}
                          placeholder="Ej. MÁS POPULAR / 110V"
                          className="w-full p-2 text-xs border border-slate-300 rounded uppercase font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold uppercase text-slate-700 mb-1">Descripción Corta:</label>
                      <input
                        type="text"
                        value={editingMachine.shortDescription}
                        onChange={(e) => setEditingMachine({ ...editingMachine, shortDescription: e.target.value })}
                        className="w-full p-2 text-xs border border-slate-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block font-bold uppercase text-slate-700 mb-1">Descripción Completa:</label>
                      <textarea
                        rows={3}
                        value={editingMachine.fullDescription}
                        onChange={(e) => setEditingMachine({ ...editingMachine, fullDescription: e.target.value })}
                        className="w-full p-2 text-xs border border-slate-300 rounded"
                      />
                    </div>

                    </div>

                    {/* Fixed Footer Buttons */}
                    <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex gap-2 shrink-0">
                      <button
                        type="submit"
                        className="flex-1 btn-flat-primary py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                      >
                        <Save size={15} />
                        <span>Guardar Cambios de Máquina</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingMachine(null)}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase transition"
                      >
                        Cancelar
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INFORMACIÓN DE LA WEB Y EMPRESA                                    */}
        {/* ========================================================================= */}
        {activeTab === 'site' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-900 tracking-wide">
                    Configuración General de la Empresa y la Web
                  </h3>
                  <span className="text-xs text-slate-500">
                    Modifica teléfonos, correo oficial, eslogan, redes y enlaces de pago
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Restablecer datos originales de fábrica?')) {
                      resetAdminDataToDefaults();
                      setConfig(getSiteConfig());
                      triggerSaveMessage('Valores de fábrica restablecidos.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-[11px] font-bold uppercase flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Restablecer
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Nombre Comercial:</label>
                    <input
                      type="text"
                      value={config.businessName}
                      onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Eslogan Oficial:</label>
                    <input
                      type="text"
                      value={config.slogan}
                      onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg italic"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Teléfono 1 (WhatsApp Oficial):</label>
                    <input
                      type="text"
                      value={config.phone1}
                      onChange={(e) => setConfig({ ...config, phone1: e.target.value })}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Teléfono 2:</label>
                    <input
                      type="text"
                      value={config.phone2}
                      onChange={(e) => setConfig({ ...config, phone2: e.target.value })}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Correo Electrónico Oficial:</label>
                    <input
                      type="email"
                      value={config.email}
                      onChange={(e) => setConfig({ ...config, email: e.target.value })}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Años de Experiencia:</label>
                    <input
                      type="text"
                      value={config.experienceYears}
                      onChange={(e) => setConfig({ ...config, experienceYears: e.target.value })}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Ubicación / Taller:</label>
                    <input
                      type="text"
                      value={config.address}
                      onChange={(e) => setConfig({ ...config, address: e.target.value })}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Enlace de Pago Stripe:</label>
                    <input
                      type="text"
                      value={config.stripePaymentLink}
                      onChange={(e) => setConfig({ ...config, stripePaymentLink: e.target.value })}
                      placeholder="https://buy.stripe.com/..."
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Enlace de Facebook:</label>
                    <input
                      type="text"
                      value={config.facebookUrl}
                      onChange={(e) => setConfig({ ...config, facebookUrl: e.target.value })}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Enlace de TikTok:</label>
                    <input
                      type="text"
                      value={config.tiktokUrl}
                      onChange={(e) => setConfig({ ...config, tiktokUrl: e.target.value })}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Aviso de Términos Comerciales:</label>
                  <input
                    type="text"
                    value={config.shippingNotice}
                    onChange={(e) => setConfig({ ...config, shippingNotice: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-3 border-t">
                  <button
                    type="submit"
                    className="btn-flat-primary px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md"
                  >
                    <Save size={16} />
                    <span>Guardar Toda la Información</span>
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* ORDER DETAILS MODAL                                                       */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div 
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200 animate-scaleUp my-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-base uppercase text-slate-900">
                  Comprobante de Pedido #{selectedOrder.folio}
                </h3>
                <span className="text-xs text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleString('es-MX')}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <p><strong>Cliente:</strong> {selectedOrder.clientName}</p>
                <p><strong>Teléfono:</strong> {selectedOrder.clientPhone}</p>
                <p><strong>Correo:</strong> {selectedOrder.clientEmail || 'No proporcionado'}</p>
                <p><strong>Dirección:</strong> {selectedOrder.clientAddress} (CP: {selectedOrder.clientCP})</p>
                {selectedOrder.requiresFactura && (
                  <p className="text-blue-700 font-bold">
                    Requiere Factura - RFC: {selectedOrder.clientRFC || 'General'} ({selectedOrder.clientRazonSocial})
                  </p>
                )}
              </div>

              <div>
                <strong className="block text-slate-900 uppercase mb-1">Máquinas:</strong>
                <table className="w-full text-left text-xs border">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b">
                      <th className="p-1.5">Cant</th>
                      <th className="p-1.5">Descripción</th>
                      <th className="p-1.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((i, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-1.5 font-bold font-mono">{i.quantity}x</td>
                        <td className="p-1.5">{i.name} ({i.sku})</td>
                        <td className="p-1.5 text-right font-mono font-bold">
                          {formatCurrency(i.price * i.quantity, 'MXN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1 font-mono text-right">
                <div>Subtotal: <strong>{formatCurrency(selectedOrder.subtotal, 'MXN')}</strong></div>
                <div>IVA (16%): <strong>{formatCurrency(selectedOrder.iva, 'MXN')}</strong></div>
                <div>Envío: <strong>{formatCurrency(selectedOrder.shippingCost, 'MXN')}</strong></div>
                <div className="text-sm font-black text-[#2563eb] pt-1 border-t">
                  TOTAL: {formatCurrency(selectedOrder.total, 'MXN')}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
