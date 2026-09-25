import { MachineProduct } from '../types';
import { MACHINES_DATA } from '../data/machines';

export interface SiteConfig {
  businessName: string;
  slogan: string;
  experienceYears: string;
  phone1: string;
  phone2: string;
  email: string;
  address: string;
  facebookUrl: string;
  tiktokUrl: string;
  stripePaymentLink: string;
  shippingNotice: string;
}

export interface AdminOrder {
  folio: string;
  createdAt: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientCP: string;
  requiresFactura: boolean;
  clientRFC?: string;
  clientRazonSocial?: string;
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }[];
  subtotal: number;
  iva: number;
  shippingCost: number;
  total: number;
  paymentMethod: 'card_stripe' | 'spei_transfer';
  status: 'Pendiente' | 'Confirmado' | 'En Fabricación' | 'Enviado' | 'Entregado';
}

export interface ContactInquiry {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  message: string;
  status: 'Nuevo' | 'Atendido';
}

export interface SiteAnalytics {
  totalVisits: number;
  uniqueVisits: number;
  pageViews: number;
  lastVisit: string;
  visitsHistory: { date: string; count: number }[];
}

const DEFAULT_CONFIG: SiteConfig = {
  businessName: 'Maquinaria Renteria',
  slogan: 'El motor de tu tortillería',
  experienceYears: '+15 Años de Experiencia',
  phone1: '639 114 1084',
  phone2: '639 111 9008',
  email: 'maquinariarenteria17@gmail.com',
  address: 'Delicias, Chihuahua, México',
  facebookUrl: 'https://www.facebook.com/share/19Zrjb7iP2/?mibextid=wwXIfr',
  tiktokUrl: 'https://www.tiktok.com/@maquinaria.renteria?_r=1&_t=ZS-99a303xcAsv',
  stripePaymentLink: 'https://buy.stripe.com/maquinariarenteria',
  shippingNotice: 'Envíos a toda la República Mexicana • Maquinaria sobre pedido • Precios más envío e IVA',
};

const STORAGE_KEYS = {
  CONFIG: 'mr_site_config_v1',
  MACHINES: 'mr_machines_catalog_v1',
  ORDERS: 'mr_orders_v1',
  INQUIRIES: 'mr_inquiries_v1',
  ANALYTICS: 'mr_analytics_v1',
  AUTH: 'mr_admin_auth_v1',
};

// Site Config
export function getSiteConfig(): SiteConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Error loading site config:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveSiteConfig(config: Partial<SiteConfig>): SiteConfig {
  const current = getSiteConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
  window.dispatchEvent(new Event('mr_config_updated'));
  return updated;
}

// Machines Catalog
export function getStoredMachines(): MachineProduct[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MACHINES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stored machines:', e);
  }
  return MACHINES_DATA;
}

export function saveStoredMachines(machines: MachineProduct[]): void {
  localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
  window.dispatchEvent(new Event('mr_machines_updated'));
}

export function updateStoredMachine(machineId: string, updates: Partial<MachineProduct>): MachineProduct[] {
  const machines = getStoredMachines();
  const updated = machines.map((m) => (m.id === machineId ? { ...m, ...updates } : m));
  saveStoredMachines(updated);
  return updated;
}

export function addStoredMachine(newMachine: MachineProduct): MachineProduct[] {
  const machines = getStoredMachines();
  const updated = [newMachine, ...machines];
  saveStoredMachines(updated);
  return updated;
}

export function deleteStoredMachine(machineId: string): MachineProduct[] {
  const machines = getStoredMachines();
  const updated = machines.filter((m) => m.id !== machineId);
  saveStoredMachines(updated);
  return updated;
}

// Orders Management
export function getStoredOrders(): AdminOrder[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading orders:', e);
  }
  return [];
}

export function saveStoredOrder(order: AdminOrder): void {
  const orders = getStoredOrders();
  const updated = [order, ...orders.filter((o) => o.folio !== order.folio)];
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
  window.dispatchEvent(new Event('mr_orders_updated'));
}

export function updateStoredOrderStatus(folio: string, status: AdminOrder['status']): AdminOrder[] {
  const orders = getStoredOrders();
  const updated = orders.map((o) => (o.folio === folio ? { ...o, status } : o));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
  window.dispatchEvent(new Event('mr_orders_updated'));
  return updated;
}

export function deleteStoredOrder(folio: string): AdminOrder[] {
  const orders = getStoredOrders();
  const updated = orders.filter((o) => o.folio !== folio);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
  window.dispatchEvent(new Event('mr_orders_updated'));
  return updated;
}

// Contact Inquiries
export function getStoredInquiries(): ContactInquiry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading inquiries:', e);
  }
  return [];
}

export function saveStoredInquiry(inquiry: Omit<ContactInquiry, 'id' | 'createdAt' | 'status'>): ContactInquiry {
  const current = getStoredInquiries();
  const newInquiry: ContactInquiry = {
    ...inquiry,
    id: `inq_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'Nuevo',
  };
  const updated = [newInquiry, ...current];
  localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(updated));
  window.dispatchEvent(new Event('mr_inquiries_updated'));
  return newInquiry;
}

export function updateStoredInquiryStatus(id: string, status: ContactInquiry['status']): ContactInquiry[] {
  const current = getStoredInquiries();
  const updated = current.map((i) => (i.id === id ? { ...i, status } : i));
  localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(updated));
  return updated;
}

// Analytics (Visitas)
export function getSiteAnalytics(): SiteAnalytics {
  const today = new Date().toISOString().split('T')[0];
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading analytics:', e);
  }
  return {
    totalVisits: 148,
    uniqueVisits: 112,
    pageViews: 420,
    lastVisit: new Date().toISOString(),
    visitsHistory: [
      { date: '2026-09-20', count: 18 },
      { date: '2026-09-21', count: 24 },
      { date: '2026-09-22', count: 31 },
      { date: '2026-09-23', count: 28 },
      { date: '2026-09-24', count: 35 },
      { date: today, count: 12 },
    ],
  };
}

export function recordSiteVisit(): void {
  const analytics = getSiteAnalytics();
  const today = new Date().toISOString().split('T')[0];

  const hasVisitedSession = sessionStorage.getItem('mr_session_visited');
  if (!hasVisitedSession) {
    sessionStorage.setItem('mr_session_visited', 'true');
    analytics.uniqueVisits += 1;
  }

  analytics.totalVisits += 1;
  analytics.pageViews += 1;
  analytics.lastVisit = new Date().toISOString();

  const historyIndex = analytics.visitsHistory.findIndex((h) => h.date === today);
  if (historyIndex >= 0) {
    analytics.visitsHistory[historyIndex].count += 1;
  } else {
    analytics.visitsHistory.push({ date: today, count: 1 });
    if (analytics.visitsHistory.length > 14) {
      analytics.visitsHistory.shift();
    }
  }

  localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
}

// Admin Auth Session
export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
}

export function setAdminAuthenticated(authenticated: boolean): void {
  if (authenticated) {
    sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
  }
}

// Reset everything to defaults
export function resetAdminDataToDefaults(): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
  localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(MACHINES_DATA));
  window.dispatchEvent(new Event('mr_config_updated'));
  window.dispatchEvent(new Event('mr_machines_updated'));
}
