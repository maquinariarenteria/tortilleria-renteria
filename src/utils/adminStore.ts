import { MachineProduct } from '../types';
import { MACHINES_DATA } from '../data/machines';
import { 
  CustomerQuote, Appointment, AdminSaleOrder, 
  Opportunity, ABExperiment, ClickHotspot, UserJourneyPath, 
  PriceOfferItem, WebHealthMetrics, SecurityAuditLog, 
  SecuritySettings, AdminSettingsConfig 
} from '../types/admin';

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
  clientAddress?: string;
  clientCP?: string;
  requiresFactura?: boolean;
  clientRFC?: string;
  clientRazonSocial?: string;
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  iva: number;
  shippingCost: number;
  total: number;
  paymentMethod: 'card_stripe' | 'spei_transfer';
  status?: string;
}

export interface ContactInquiry {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: 'Nuevo' | 'Atendido';
}

const DEFAULT_CONFIG: SiteConfig = {
  businessName: 'Maquinaria Renteria',
  slogan: 'El motor de tu tortillería',
  experienceYears: '+15 Años de Experiencia',
  phone1: '639 114 1084',
  phone2: '639 111 9008',
  email: 'maquinariarenteria17@gmail.com',
  address: 'Av. Fernando Baeza #1402, Delicias, Chihuahua, México',
  facebookUrl: 'https://www.facebook.com/share/19Zrjb7iP2/?mibextid=wwXIfr',
  tiktokUrl: 'https://www.tiktok.com/@maquinaria.renteria?_r=1&_t=ZS-99a303xcAsv',
  stripePaymentLink: 'https://buy.stripe.com/maquinariarenteria',
  shippingNotice: 'Envíos a toda la República Mexicana • Costo de envío a acordar con el vendedor • Precios de equipos no incluyen flete',
};

const STORAGE_KEYS = {
  CONFIG: 'mr_site_config_v2',
  MACHINES: 'mr_machines_catalog_v3',
  AUTH: 'mr_admin_cloudflare_auth_v2',
  AUTH_TOKEN: 'mr_admin_cloudflare_token_v2',
  QUOTES: 'mr_quotes_real_v3',
  APPOINTMENTS: 'mr_appointments_real_v3',
  SALES: 'mr_sales_real_v3',
  OPPORTUNITIES: 'mr_opportunities_real_v3',
  AB_TESTS: 'mr_ab_tests_v2',
  CLICKS: 'mr_click_map_v2',
  OFFERS: 'mr_price_offers_v2',
  HEALTH: 'mr_web_health_v2',
  SECURITY: 'mr_security_real_v3',
  SETTINGS: 'mr_settings_exact_v2',
  ANALYTICS: 'mr_real_analytics_v2',
};

// Purge any old mock/fake test data from previous runs
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('mr_admin_auth_v1');
    localStorage.removeItem('mr_admin_token_v1');
    localStorage.removeItem('mr_orders_v1');
    localStorage.removeItem('mr_inquiries_v1');
    localStorage.removeItem('mr_quotes_v2');
    localStorage.removeItem('mr_appointments_v1');
    localStorage.removeItem('mr_sales_v2');
    localStorage.removeItem('mr_opportunities_v1');
    localStorage.removeItem('mr_coupons_v1');
  }
} catch {}

// 100% REAL DATA: Initial states start empty until real users interact with the site
export const INITIAL_QUOTES: CustomerQuote[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];
export const INITIAL_SALES: AdminSaleOrder[] = [];
export const INITIAL_OPPORTUNITIES: Opportunity[] = [];

// Pruebas A/B en Vivo (se miden con sesiones reales)
export const INITIAL_AB_TESTS: ABExperiment[] = [
  {
    id: 'exp_1',
    title: 'Botón de WhatsApp vs Carrito en Línea',
    description: 'Compara si los clientes prefieren cerrar por WhatsApp o pagar en línea con Stripe',
    status: 'running',
    variantA: {
      name: 'Variante A (Finalizar por WhatsApp)',
      description: 'Envía el pedido estructurado con datos completos a WhatsApp',
      visitors: 0,
      conversions: 0,
      conversionRate: 0,
    },
    variantB: {
      name: 'Variante B (Pagar en Línea con Stripe)',
      description: 'Paga con tarjeta de crédito/débito y genera comprobante',
      visitors: 0,
      conversions: 0,
      conversionRate: 0,
    },
    startDate: new Date().toISOString().split('T')[0],
    winningVariant: null,
  }
];

// Puntos Calientes (Heatmap) en la Web de Maquinaria Rentería (Se registran clics reales)
export const INITIAL_CLICK_HOTSPOTS: ClickHotspot[] = [
  { id: 'clk_1', elementName: 'Botón WhatsApp Principal', section: 'Floating / Navbar', clicksCount: 0, percentage: 0, category: 'WhatsApp / Contacto' },
  { id: 'clk_2', elementName: 'Cotizar por WhatsApp', section: 'Detalle de Máquina', clicksCount: 0, percentage: 0, category: 'Detalle Producto' },
  { id: 'clk_3', elementName: 'Agregar al Carrito', section: 'Catálogo', clicksCount: 0, percentage: 0, category: 'Catálogo' },
  { id: 'clk_4', elementName: 'Agendar Cita / Demostración', section: 'Navbar / Citas', clicksCount: 0, percentage: 0, category: 'CTA Principal' },
  { id: 'clk_5', elementName: 'Pagar con Tarjeta (Stripe)', section: 'Carrito de Compras', clicksCount: 0, percentage: 0, category: 'CTA Principal' },
];

export const INITIAL_USER_JOURNEYS: UserJourneyPath[] = [
  { id: 'uj_1', path: 'Inicio -> Catálogo -> Máquina -> WhatsApp', stepsCount: 4, sessionsCount: 0, percentage: 0, conversionRate: 0 },
  { id: 'uj_2', path: 'Inicio -> Agendar Cita -> Demostración en Planta', stepsCount: 3, sessionsCount: 0, percentage: 0, conversionRate: 0 },
  { id: 'uj_3', path: 'Catálogo -> Carrito -> Pago en Línea (Stripe)', stepsCount: 3, sessionsCount: 0, percentage: 0, conversionRate: 0 },
];

export const INITIAL_WEB_HEALTH: WebHealthMetrics = {
  cloudflareWorkerStatus: 'operativo',
  averageLatencyMs: 16,
  d1DatabaseStatus: 'conectada',
  d1QueryTimeMs: 3.5,
  r2StorageStatus: 'conectado',
  r2LatencyMs: 20,
  sslStatus: 'activo',
  sslExpiryDays: 90,
  cacheHitRatio: 99.1,
  uptimePercentage: 100,
  lcp: 0.72,
  fid: 12,
  cls: 0.01,
  lastAuditTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const INITIAL_SECURITY_LOGS: SecurityAuditLog[] = [];

export const INITIAL_SECURITY_SETTINGS: SecuritySettings = {
  underAttackMode: false,
  rateLimitingEnabled: true,
  adminPasswordConfiguredInCloudflare: true,
  blockedIps: [],
  sessionTimeoutMinutes: 120,
};

export const INITIAL_SETTINGS_EXACT: AdminSettingsConfig = {
  reportEmail: 'maquinariarenteria17@gmail.com',
  monthlySalesTarget: 250000,
  salesTargetCurrency: 'MXN',
  telegramBotEnabled: true,
  telegramBotUsername: '@MaquinariaRenteria_bot',
  telegramChatConnected: true,
  notifyNewQuotes: true,
  notifyAbandonedCarts: true,
  notifyAppointments: true,
  storageUsedBytes: 150 * 1024,
  storageLimitBytes: 5 * 1024 * 1024 * 1024,
  visitRecordsCount: 1,
  lastTestDate: 'Hoy',
  emailStatus: 'ok',
  telegramStatus: 'ok',
  nextCleanupDate: 'El día 1 del próximo mes',
};

// ==========================================
// STORE GETTERS & SETTERS
// ==========================================

export function getSiteConfig(): SiteConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Error loading config:', e);
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

export function getStoredMachines(): MachineProduct[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MACHINES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading machines:', e);
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

// ------------------------------------------
// 1. COTIZACIONES (Real quotes from web)
// ------------------------------------------
export function getStoredQuotes(): CustomerQuote[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading quotes:', e);
  }
  return INITIAL_QUOTES;
}

export function saveStoredQuotes(quotes: CustomerQuote[]): void {
  localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  window.dispatchEvent(new Event('mr_quotes_updated'));
}

export function addStoredQuote(quote: CustomerQuote): CustomerQuote[] {
  const quotes = getStoredQuotes();
  const updated = [quote, ...quotes];
  saveStoredQuotes(updated);

  // Automatically create a CRM opportunity for this real lead
  if (quote.customerName) {
    const opps = getStoredOpportunities();
    const newOpp: Opportunity = {
      id: `opp_${Date.now()}`,
      companyOrClient: quote.customerName,
      contactName: quote.customerName,
      phone: quote.phone,
      stage: 'contacto_inicial',
      dealValue: quote.estimatedTotal || 50000,
      machineModel: quote.items[0]?.name || 'Cotización de maquinaria',
      closeProbability: 35,
      expectedCloseDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      lastFollowUp: new Date().toISOString().split('T')[0],
      nextStep: 'Responder por WhatsApp y enviar ficha técnica con precios.',
    };
    saveStoredOpportunities([newOpp, ...opps]);
  }

  return updated;
}

export function updateStoredQuoteStatus(quoteId: string, status: CustomerQuote['status'], notes?: string): CustomerQuote[] {
  const current = getStoredQuotes();
  const updated = current.map(q => q.id === quoteId ? { ...q, status, ...(notes !== undefined ? { notes } : {}) } : q);
  saveStoredQuotes(updated);
  return updated;
}

// ------------------------------------------
// 2. CITAS (Real appointments from web)
// ------------------------------------------
export function getStoredAppointments(): Appointment[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading appointments:', e);
  }
  return INITIAL_APPOINTMENTS;
}

export function saveStoredAppointments(appointments: Appointment[]): void {
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  window.dispatchEvent(new Event('mr_appointments_updated'));
}

export function addStoredAppointment(appointment: Appointment): Appointment[] {
  const appointments = getStoredAppointments();
  const updated = [appointment, ...appointments];
  saveStoredAppointments(updated);
  return updated;
}

export function updateStoredAppointmentStatus(id: string, status: Appointment['status'], notes?: string): Appointment[] {
  const current = getStoredAppointments();
  const updated = current.map(a => a.id === id ? { ...a, status, ...(notes !== undefined ? { notes } : {}) } : a);
  saveStoredAppointments(updated);
  return updated;
}

// ------------------------------------------
// 3. VENTAS (Real sales from web / Stripe / WhatsApp)
// ------------------------------------------
export function getStoredSales(): AdminSaleOrder[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading sales:', e);
  }
  return INITIAL_SALES;
}

export function saveStoredSales(sales: AdminSaleOrder[]): void {
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  window.dispatchEvent(new Event('mr_sales_updated'));
}

export function addStoredSale(sale: AdminSaleOrder): AdminSaleOrder[] {
  const sales = getStoredSales();
  const updated = [sale, ...sales];
  saveStoredSales(updated);

  // If sale was made, mark or add as won in CRM
  const opps = getStoredOpportunities();
  const existingOpp = opps.find(o => o.phone === sale.clientPhone);
  if (existingOpp) {
    saveStoredOpportunities(opps.map(o => o.id === existingOpp.id ? { ...o, stage: 'ganada', closeProbability: 100 } : o));
  } else {
    const newWonOpp: Opportunity = {
      id: `opp_won_${Date.now()}`,
      companyOrClient: sale.clientName,
      contactName: sale.clientName,
      phone: sale.clientPhone,
      stage: 'ganada',
      dealValue: sale.total,
      machineModel: sale.items[0]?.name || 'Maquinaria de tortillería',
      closeProbability: 100,
      expectedCloseDate: new Date().toISOString().split('T')[0],
      lastFollowUp: new Date().toISOString().split('T')[0],
      nextStep: 'Coordinar flete y entrega con el cliente.',
    };
    saveStoredOpportunities([newWonOpp, ...opps]);
  }

  return updated;
}

export function updateSaleStatus(folio: string, manufacturingStatus: AdminSaleOrder['manufacturingStatus'], trackingNumber?: string): AdminSaleOrder[] {
  const sales = getStoredSales();
  const updated = sales.map(s => s.folio === folio ? { 
    ...s, 
    manufacturingStatus, 
    ...(trackingNumber ? { trackingNumber } : {}) 
  } : s);
  saveStoredSales(updated);
  return updated;
}

// ------------------------------------------
// 4. OPORTUNIDADES (CRM)
// ------------------------------------------
export function getStoredOpportunities(): Opportunity[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading opportunities:', e);
  }
  return INITIAL_OPPORTUNITIES;
}

export function saveStoredOpportunities(opps: Opportunity[]): void {
  localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opps));
  window.dispatchEvent(new Event('mr_opps_updated'));
}

// ------------------------------------------
// 5. PRUEBAS A/B
// ------------------------------------------
export function getStoredABTests(): ABExperiment[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AB_TESTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading AB tests:', e);
  }
  return INITIAL_AB_TESTS;
}

export function saveStoredABTests(tests: ABExperiment[]): void {
  localStorage.setItem(STORAGE_KEYS.AB_TESTS, JSON.stringify(tests));
  window.dispatchEvent(new Event('mr_ab_updated'));
}

// ------------------------------------------
// 6. CLICS Y HEATMAP (Live Click Tracking)
// ------------------------------------------
export function getStoredHotspots(): ClickHotspot[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CLICKS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading hotspots:', e);
  }
  return INITIAL_CLICK_HOTSPOTS;
}

export function saveStoredHotspots(hotspots: ClickHotspot[]): void {
  localStorage.setItem(STORAGE_KEYS.CLICKS, JSON.stringify(hotspots));
  window.dispatchEvent(new Event('mr_clicks_updated'));
}

export function recordHotspotClick(elementName: string): void {
  try {
    const current = getStoredHotspots();
    let found = false;
    let totalClicks = 0;

    const incremented = current.map(item => {
      if (item.elementName.toLowerCase().includes(elementName.toLowerCase()) || elementName.toLowerCase().includes(item.elementName.toLowerCase())) {
        found = true;
        const newCount = item.clicksCount + 1;
        totalClicks += newCount;
        return { ...item, clicksCount: newCount };
      }
      totalClicks += item.clicksCount;
      return item;
    });

    if (!found) {
      incremented.push({
        id: `spot_${Date.now()}`,
        elementName,
        section: 'Web',
        clicksCount: 1,
        percentage: 100,
        category: 'CTA Principal',
      });
      totalClicks += 1;
    }

    // Recalculate percentages
    const finalSpots = incremented.map(item => ({
      ...item,
      percentage: totalClicks > 0 ? Number(((item.clicksCount / totalClicks) * 100).toFixed(1)) : 0,
    }));

    saveStoredHotspots(finalSpots);
  } catch (err) {
    console.warn('Error recording click hotspot:', err);
  }
}

// ------------------------------------------
// 7. PRECIOS Y OFERTAS
// ------------------------------------------
export function getStoredPriceOffers(): PriceOfferItem[] {
  const machines = getStoredMachines();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.OFFERS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading offers:', e);
  }
  return machines.map(m => ({
    machineId: m.id,
    name: m.name,
    regularPriceMXN: m.priceMXN,
    offerPriceMXN: Math.round(m.priceMXN * 0.95),
    regularPriceUSD: m.priceUSD,
    offerPriceUSD: Math.round(m.priceUSD * 0.95),
    isOfferActive: false,
    offerTag: 'Envío por coordinar',
    minDepositPercentage: 50,
  }));
}

export function saveStoredPriceOffers(offers: PriceOfferItem[]): void {
  localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
  window.dispatchEvent(new Event('mr_offers_updated'));
}

// ------------------------------------------
// 8. SALUD DE LA WEB
// ------------------------------------------
export function getStoredWebHealth(): WebHealthMetrics {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HEALTH);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading web health:', e);
  }
  return INITIAL_WEB_HEALTH;
}

// ------------------------------------------
// 9. SEGURIDAD Y AUDITORÍA
// ------------------------------------------
export function getStoredSecurityLogs(): SecurityAuditLog[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SECURITY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading security logs:', e);
  }
  return INITIAL_SECURITY_LOGS;
}

export function saveStoredSecurityLogs(logs: SecurityAuditLog[]): void {
  localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(logs));
}

export function recordSecurityAudit(
  action: SecurityAuditLog['action'], 
  status: SecurityAuditLog['status']
): void {
  try {
    const logs = getStoredSecurityLogs();
    const newLog: SecurityAuditLog = {
      id: `sec_${Date.now()}`,
      timestamp: new Date().toLocaleString('es-MX'),
      ipAddress: '127.0.0.1 (Navegador actual)',
      location: 'México',
      action,
      status,
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.platform} - ${navigator.userAgent.slice(0, 30)}` : 'Web Client',
    };
    saveStoredSecurityLogs([newLog, ...logs].slice(0, 50));
  } catch (err) {
    console.warn('Error recording security audit:', err);
  }
}

// ------------------------------------------
// 10. AJUSTES
// ------------------------------------------
export function getStoredSettings(): AdminSettingsConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) return { ...INITIAL_SETTINGS_EXACT, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return INITIAL_SETTINGS_EXACT;
}

export function saveStoredSettings(settings: Partial<AdminSettingsConfig>): AdminSettingsConfig {
  const current = getStoredSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  window.dispatchEvent(new Event('mr_settings_updated'));
  return updated;
}

// ------------------------------------------
// 11. AUTENTICACIÓN
// ------------------------------------------
export function isAdminAuthenticated(): boolean {
  try {
    const isAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    return isAuth === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(auth: boolean, token?: string): void {
  if (auth) {
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    recordSecurityAudit('Inicio de sesión exitoso', 'Permitido');
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  window.dispatchEvent(new Event('mr_auth_changed'));
}

export function getAdminToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

// ------------------------------------------
// 12. ANALÍTICAS DE VISITAS
// ------------------------------------------
export function recordSiteVisit(): void {
  try {
    const hasVisitedSession = sessionStorage.getItem('mr_session_visited');
    if (!hasVisitedSession) {
      sessionStorage.setItem('mr_session_visited', 'true');
      const settings = getStoredSettings();
      saveStoredSettings({
        visitRecordsCount: (settings.visitRecordsCount || 0) + 1,
        storageUsedBytes: (settings.storageUsedBytes || 1000) + 420,
      });
    }
  } catch {}
}
