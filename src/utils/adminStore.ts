import { MachineProduct } from '../types';
import { MACHINES_DATA } from '../data/machines';
import { 
  CustomerQuote, Appointment, AdminSaleOrder, Coupon, 
  Opportunity, ABExperiment, ClickHotspot, UserJourneyPath, 
  PriceOfferItem, WebHealthMetrics, SecurityAuditLog, 
  SecuritySettings, AdminSettingsConfig, DashboardMetrics 
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
  address: 'Delicias, Chihuahua, México',
  facebookUrl: 'https://www.facebook.com/share/19Zrjb7iP2/?mibextid=wwXIfr',
  tiktokUrl: 'https://www.tiktok.com/@maquinaria.renteria?_r=1&_t=ZS-99a303xcAsv',
  stripePaymentLink: 'https://buy.stripe.com/maquinariarenteria',
  shippingNotice: 'Envíos a toda la República Mexicana • Maquinaria sobre pedido • Precios más envío e IVA',
};

const STORAGE_KEYS = {
  CONFIG: 'mr_site_config_v1',
  MACHINES: 'mr_machines_catalog_v1',
  AUTH: 'mr_admin_cloudflare_auth_v2',
  AUTH_TOKEN: 'mr_admin_cloudflare_token_v2',
  QUOTES: 'mr_quotes_v2',
  APPOINTMENTS: 'mr_appointments_v1',
  SALES: 'mr_sales_v2',
  COUPONS: 'mr_coupons_v1',
  OPPORTUNITIES: 'mr_opportunities_v1',
  AB_TESTS: 'mr_ab_tests_v1',
  CLICKS: 'mr_click_map_v1',
  OFFERS: 'mr_price_offers_v1',
  HEALTH: 'mr_web_health_v1',
  SECURITY: 'mr_security_v1',
  SETTINGS: 'mr_settings_exact_v1',
  ANALYTICS: 'mr_real_analytics_v1',
};

// Purge any leftover session or cache from the old administrator
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('mr_admin_auth_v1');
    localStorage.removeItem('mr_admin_token_v1');
    localStorage.removeItem('mr_orders_v1');
    localStorage.removeItem('mr_inquiries_v1');
  }
} catch {}

// Initial Mock / Realistic Data
export const INITIAL_QUOTES: CustomerQuote[] = [
  {
    id: 'cot_101',
    folio: 'COT-2026-089',
    createdAt: '2026-10-02T14:32:00Z',
    customerName: 'Roberto Garza Morales',
    phone: '811 492 8841',
    email: 'roberto.garza@tortillasnorte.com',
    stateOrCity: 'Monterrey, Nuevo León',
    businessType: 'Tortillería de harina',
    items: [
      {
        machineId: 'rodillo-doble-pro',
        name: 'Rodillo Doble Grado Industrial Acero Inox',
        quantity: 1,
        price: 88500,
        capacity: '1,200 tortillas/hora',
        energyType: 'Gas LP y Bifásica',
      }
    ],
    estimatedTotal: 88500,
    status: 'Nueva',
    priority: 'Alta',
    notes: 'Requiere entrega urgente para apertura de nueva sucursal en San Nicolás.',
    lastContactAt: '2026-10-02T14:32:00Z',
  },
  {
    id: 'cot_102',
    folio: 'COT-2026-088',
    createdAt: '2026-09-30T10:15:00Z',
    customerName: 'María Elena Beltrán',
    phone: '667 219 4430',
    email: 'maria.beltran@burritosdelreal.mx',
    stateOrCity: 'Culiacán, Sinaloa',
    businessType: 'Fábrica de burritos',
    items: [
      {
        machineId: 'prensa-automatica-30',
        name: 'Prensa Automática Continua 30cm',
        quantity: 2,
        price: 125000,
        capacity: '1,800 tortillas/hora',
        energyType: 'Gas LP / Trifásica',
      }
    ],
    estimatedTotal: 250000,
    status: 'En Negociación',
    priority: 'Alta',
    notes: 'Interesada en facilidades de 50% anticipo y 50% contra entrega.',
    lastContactAt: '2026-10-01T16:00:00Z',
  },
  {
    id: 'cot_103',
    folio: 'COT-2026-087',
    createdAt: '2026-09-28T18:20:00Z',
    customerName: 'Javier Quintanilla',
    phone: '614 302 9911',
    email: 'javier.quintanilla@hotmail.com',
    stateOrCity: 'Chihuahua, Chih.',
    businessType: 'Taquería',
    items: [
      {
        machineId: 'batidora-harina-50kg',
        name: 'Batidora de Harina Espiral 50kg Inox',
        quantity: 1,
        price: 46000,
        capacity: '50 kg masa',
        energyType: 'Bifásica 220V',
      }
    ],
    estimatedTotal: 46000,
    status: 'Contactada',
    priority: 'Media',
    notes: 'Se le mandó ficha técnica por WhatsApp y cotización formal por correo.',
    lastContactAt: '2026-09-29T11:30:00Z',
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt_201',
    customerName: 'Roberto Garza Morales',
    phone: '811 492 8841',
    email: 'roberto.garza@tortillasnorte.com',
    type: 'Videollamada en Vivo',
    machineOfInterest: 'Rodillo Doble Grado Industrial',
    scheduledDate: '2026-10-04',
    scheduledTime: '11:00',
    status: 'Confirmada',
    notes: 'Demostración de grosor y textura de tortilla en vivo.',
    reminderSent: true,
  },
  {
    id: 'apt_202',
    customerName: 'Lic. Fernando Ortiz',
    phone: '639 123 7744',
    email: 'fortiz@superdelicias.com',
    type: 'Demostración en Taller (Delicias, Chih.)',
    machineOfInterest: 'Línea Completa Automatizada',
    scheduledDate: '2026-10-06',
    scheduledTime: '16:00',
    status: 'Confirmada',
    notes: 'Viene con su maestro tortillero a probar harina de su marca.',
    reminderSent: false,
  }
];

export const INITIAL_SALES: AdminSaleOrder[] = [
  {
    folio: 'VT-2026-042',
    createdAt: '2026-09-27T12:00:00Z',
    clientName: 'Alimentos La Espiga S.A. de C.V.',
    clientPhone: '656 410 2200',
    clientEmail: 'compras@laespiga.com',
    shippingAddress: 'Av. Tecnológico #4500, Parque Industrial',
    shippingCity: 'Ciudad Juárez',
    shippingState: 'Chihuahua',
    shippingZip: '32500',
    requiresInvoice: true,
    rfc: 'ALE180412KJ1',
    businessName: 'Alimentos La Espiga S.A. de C.V.',
    cfdiUsage: 'G03 - Gastos en general',
    items: [
      {
        id: 'rodillo-doble-pro',
        name: 'Rodillo Doble Grado Industrial Acero Inox',
        sku: 'MR-RD-2026',
        quantity: 1,
        unitPrice: 88500,
        total: 88500,
      }
    ],
    subtotal: 88500,
    iva: 14160,
    shippingCost: 3500,
    total: 106160,
    paymentMethod: 'Transferencia SPEI',
    manufacturingStatus: 'En Fabricación',
    estimatedDeliveryDate: '2026-10-12',
  },
  {
    folio: 'VT-2026-041',
    createdAt: '2026-09-18T16:45:00Z',
    clientName: 'Taquerías El Pastorcito',
    clientPhone: '55 3049 8812',
    clientEmail: 'gerencia@elpastorcito.mx',
    shippingAddress: 'Calzada de Tlalpan #1840',
    shippingCity: 'Benito Juárez',
    shippingState: 'Ciudad de México',
    shippingZip: '03500',
    requiresInvoice: false,
    items: [
      {
        id: 'horno-tres-pasos',
        name: 'Horno de 3 Pasos Térmico Ahorrador de Gas',
        sku: 'MR-H3-PRO',
        quantity: 1,
        unitPrice: 65000,
        total: 65000,
      }
    ],
    subtotal: 65000,
    iva: 0,
    shippingCost: 4200,
    total: 69200,
    paymentMethod: 'Stripe',
    manufacturingStatus: 'Entregada',
    trackingNumber: 'TMMX-99482103',
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'cup_1',
    code: 'RENTERIA10',
    discountType: 'percentage',
    discountValue: 10,
    minPurchaseAmount: 40000,
    maxUses: 20,
    usedCount: 7,
    startDate: '2026-09-01',
    expiresAt: '2026-10-31',
    isActive: true,
  },
  {
    id: 'cup_2',
    code: 'FLETEGRATIS',
    discountType: 'fixed',
    discountValue: 3500,
    minPurchaseAmount: 60000,
    maxUses: 15,
    usedCount: 5,
    startDate: '2026-09-15',
    expiresAt: '2026-11-15',
    isActive: true,
  },
  {
    id: 'cup_3',
    code: 'EXPO2026',
    discountType: 'percentage',
    discountValue: 15,
    minPurchaseAmount: 100000,
    maxUses: 10,
    usedCount: 10,
    startDate: '2026-08-01',
    expiresAt: '2026-09-30',
    isActive: false,
  }
];

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp_1',
    companyOrClient: 'Supermercados del Norte',
    contactName: 'Ing. Carlos Madrigal',
    phone: '614 201 5599',
    stage: 'aprobacion_anticipo',
    dealValue: 340000,
    machineModel: 'Línea Industrial Tortilla Harina 2,400 p/h',
    closeProbability: 90,
    expectedCloseDate: '2026-10-08',
    lastFollowUp: '2026-10-02',
    nextStep: 'Confirmar recepción de 50% de anticipo vía SPEI.',
  },
  {
    id: 'opp_2',
    companyOrClient: 'Taquerías Los Primos',
    contactName: 'Gonzalo Fuentes',
    phone: '871 180 3341',
    stage: 'en_negociacion',
    dealValue: 125000,
    machineModel: 'Prensa Automática Continua 30cm',
    closeProbability: 70,
    expectedCloseDate: '2026-10-15',
    lastFollowUp: '2026-10-01',
    nextStep: 'Agendar demo por videollamada de calibración.',
  },
  {
    id: 'opp_3',
    companyOrClient: 'Tortillas Tía Rosa Local',
    contactName: 'Rosa Isela Peña',
    phone: '639 472 9012',
    stage: 'ficha_enviada',
    dealValue: 88500,
    machineModel: 'Rodillo Doble Grado Industrial',
    closeProbability: 50,
    expectedCloseDate: '2026-10-20',
    lastFollowUp: '2026-09-29',
    nextStep: 'Llamar para resolver dudas sobre consumo de gas.',
  }
];

export const INITIAL_AB_TESTS: ABExperiment[] = [
  {
    id: 'exp_1',
    title: 'Botón de Acción Principal en Ficha de Máquina',
    description: 'Compara "Cotizar por WhatsApp Directo" vs "Agregar al Carrito de Cotización"',
    status: 'running',
    variantA: {
      name: 'Variante A (WhatsApp Directo)',
      description: 'Abre chat oficial con mensaje predefinido de la máquina',
      visitors: 840,
      conversions: 79,
      conversionRate: 9.4,
    },
    variantB: {
      name: 'Variante B (Carrito de Cotización)',
      description: 'Permite seleccionar múltiples máquinas antes de cotizar',
      visitors: 820,
      conversions: 104,
      conversionRate: 12.7,
    },
    startDate: '2026-09-15',
    winningVariant: 'B',
  },
  {
    id: 'exp_2',
    title: 'Hero de Entrada: Simulador 3D vs Imagen Alta Calidad',
    description: 'Mide engagement de usuarios con visualizador interactivo 3D vs fotografía fija optimizada',
    status: 'running',
    variantA: {
      name: 'Variante A (3D Interactivo)',
      description: 'Permite girar y explorar el rodillo en 3D en el Hero',
      visitors: 610,
      conversions: 48,
      conversionRate: 7.8,
    },
    variantB: {
      name: 'Variante B (Fotografía Real R2)',
      description: 'Foto fija con zoom de rodillo cromado de grado alimenticio',
      visitors: 595,
      conversions: 55,
      conversionRate: 9.2,
    },
    startDate: '2026-09-20',
    winningVariant: null,
  }
];

export const INITIAL_CLICK_HOTSPOTS: ClickHotspot[] = [
  { id: 'clk_1', elementName: 'Botón "Cotizar Maquinaria" (Hero)', section: 'Hero', clicksCount: 428, percentage: 31.4, category: 'CTA Principal' },
  { id: 'clk_2', elementName: 'Botón Flotante WhatsApp Oficial', section: 'Global Floating', clicksCount: 382, percentage: 28.0, category: 'WhatsApp / Contacto' },
  { id: 'clk_3', elementName: 'Ver Ficha Técnica: Rodillo Doble Inox', section: 'Catálogo', clicksCount: 245, percentage: 18.0, category: 'Catálogo' },
  { id: 'clk_4', elementName: 'Calculadora de ROI y Producción', section: 'Herramientas', clicksCount: 164, percentage: 12.0, category: 'Calculadora' },
  { id: 'clk_5', elementName: 'Filtro: Máquinas para Tortillas de Harina', section: 'Catálogo', clicksCount: 144, percentage: 10.6, category: 'Catálogo' },
];

export const INITIAL_USER_JOURNEYS: UserJourneyPath[] = [
  { id: 'uj_1', path: 'Hero -> Catálogo -> Rodillo Inox -> WhatsApp', stepsCount: 4, sessionsCount: 312, percentage: 41.5, conversionRate: 18.2 },
  { id: 'uj_2', path: 'Hero -> Calculadora ROI -> Formulario Contacto', stepsCount: 3, sessionsCount: 198, percentage: 26.4, conversionRate: 14.1 },
  { id: 'uj_3', path: 'Sectores Taquerías -> Prensa Automática -> Cotizador', stepsCount: 3, sessionsCount: 142, percentage: 18.9, conversionRate: 11.3 },
  { id: 'uj_4', path: 'Buscador Google -> Ficha de Producto -> Cierre', stepsCount: 3, sessionsCount: 99, percentage: 13.2, conversionRate: 21.0 },
];

export const INITIAL_WEB_HEALTH: WebHealthMetrics = {
  cloudflareWorkerStatus: 'operativo',
  averageLatencyMs: 18,
  d1DatabaseStatus: 'conectada',
  d1QueryTimeMs: 4.2,
  r2StorageStatus: 'conectado',
  r2LatencyMs: 24,
  sslStatus: 'activo',
  sslExpiryDays: 89,
  cacheHitRatio: 98.6,
  uptimePercentage: 99.98,
  lcp: 0.8,
  fid: 12,
  cls: 0.01,
  lastAuditTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const INITIAL_SECURITY_LOGS: SecurityAuditLog[] = [
  {
    id: 'sec_1',
    timestamp: '2026-10-03 02:08:14',
    ipAddress: '189.217.84.112',
    location: 'Chihuahua, México',
    action: 'Inicio de sesión exitoso',
    status: 'Permitido',
    deviceInfo: 'macOS Chrome 134',
  },
  {
    id: 'sec_2',
    timestamp: '2026-10-02 19:42:01',
    ipAddress: '45.134.21.90',
    location: 'Frankfurt, Alemania',
    action: 'Intento fallido de login',
    status: 'Bloqueado',
    deviceInfo: 'Automated curl bot',
  },
  {
    id: 'sec_3',
    timestamp: '2026-10-01 11:15:33',
    ipAddress: '189.217.84.112',
    location: 'Chihuahua, México',
    action: 'Cambio de configuración',
    status: 'Permitido',
    deviceInfo: 'macOS Chrome 134',
  }
];

export const INITIAL_SECURITY_SETTINGS: SecuritySettings = {
  underAttackMode: false,
  rateLimitingEnabled: true,
  adminPasswordConfiguredInCloudflare: true,
  blockedIps: ['45.134.21.90', '194.26.29.11'],
  sessionTimeoutMinutes: 120,
};

// Exact settings as in the user screenshot!
export const INITIAL_SETTINGS_EXACT: AdminSettingsConfig = {
  reportEmail: '',
  monthlySalesTarget: 1000,
  salesTargetCurrency: 'USD',
  telegramBotEnabled: true,
  telegramBotUsername: '@ORION_CreativeStudio_bot',
  telegramChatConnected: true,
  notifyNewQuotes: true,
  notifyAbandonedCarts: true,
  notifyAppointments: true,
  storageUsedBytes: 216 * 1024,
  storageLimitBytes: 5 * 1024 * 1024 * 1024,
  visitRecordsCount: 362,
  lastTestDate: '2 oct · 03:05',
  emailStatus: 'missing_config',
  telegramStatus: 'ok',
  nextCleanupDate: 'El día 1 del próximo mes',
};

// Store getters and setters with localStorage fallback & cloudflare sync
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

// 2. Cotizaciones
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

export function updateStoredQuoteStatus(quoteId: string, status: CustomerQuote['status'], notes?: string): CustomerQuote[] {
  const current = getStoredQuotes();
  const updated = current.map(q => q.id === quoteId ? { ...q, status, ...(notes !== undefined ? { notes } : {}) } : q);
  saveStoredQuotes(updated);
  return updated;
}

// Legacy Orders support
export function saveStoredOrder(order: any): void {
  const sales = getStoredSales();
  const newSale: AdminSaleOrder = {
    folio: order.folio,
    createdAt: order.createdAt || new Date().toISOString(),
    clientName: order.clientName,
    clientPhone: order.clientPhone,
    clientEmail: order.clientEmail || '',
    shippingAddress: order.clientAddress || '',
    shippingCity: '',
    shippingState: '',
    shippingZip: order.clientCP || '',
    requiresInvoice: !!order.requiresFactura,
    rfc: order.clientRFC,
    businessName: order.clientRazonSocial,
    items: (order.items || []).map((it: any) => ({
      id: it.id || 'item',
      name: it.name || 'Máquina',
      sku: it.sku || 'SKU',
      quantity: it.quantity || 1,
      unitPrice: it.price || 0,
      total: (it.price || 0) * (it.quantity || 1),
    })),
    subtotal: order.subtotal || 0,
    iva: order.iva || 0,
    shippingCost: order.shippingCost || 0,
    total: order.total || 0,
    paymentMethod: order.paymentMethod === 'card_stripe' ? 'Stripe' : 'Transferencia SPEI',
    manufacturingStatus: 'Pendiente',
  };
  saveStoredSales([newSale, ...sales]);
}

// Legacy Inquiries support
export function saveStoredInquiry(inquiry: { name: string; phone: string; message: string; email?: string }): void {
  const quotes = getStoredQuotes();
  const newQuote: CustomerQuote = {
    id: `cot_${Date.now()}`,
    folio: `COT-2026-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
    customerName: inquiry.name,
    phone: inquiry.phone,
    email: inquiry.email || '',
    stateOrCity: 'Por confirmar',
    businessType: 'Otro',
    items: [],
    estimatedTotal: 0,
    status: 'Nueva',
    priority: 'Media',
    notes: inquiry.message,
  };
  saveStoredQuotes([newQuote, ...quotes]);
}

// 3. Citas
export function getStoredAppointments(): Appointment[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading appointments:', e);
  }
  return INITIAL_APPOINTMENTS;
}

export function saveStoredAppointments(appointments: Appointment[]): void {
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  window.dispatchEvent(new Event('mr_appointments_updated'));
}

// 4. Ventas
export function getStoredSales(): AdminSaleOrder[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading sales:', e);
  }
  return INITIAL_SALES;
}

export function saveStoredSales(sales: AdminSaleOrder[]): void {
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  window.dispatchEvent(new Event('mr_sales_updated'));
}

export function updateSaleStatus(folio: string, manufacturingStatus: AdminSaleOrder['manufacturingStatus']): AdminSaleOrder[] {
  const sales = getStoredSales();
  const updated = sales.map(s => s.folio === folio ? { ...s, manufacturingStatus } : s);
  saveStoredSales(updated);
  return updated;
}

// 5. Cupones
export function getStoredCoupons(): Coupon[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.COUPONS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading coupons:', e);
  }
  return INITIAL_COUPONS;
}

export function saveStoredCoupons(coupons: Coupon[]): void {
  localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  window.dispatchEvent(new Event('mr_coupons_updated'));
}

// 6. Oportunidades
export function getStoredOpportunities(): Opportunity[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading opportunities:', e);
  }
  return INITIAL_OPPORTUNITIES;
}

export function saveStoredOpportunities(opps: Opportunity[]): void {
  localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opps));
  window.dispatchEvent(new Event('mr_opps_updated'));
}

// 7. Pruebas A/B
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

// 8. Clics
export function getStoredHotspots(): ClickHotspot[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CLICKS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading hotspots:', e);
  }
  return INITIAL_CLICK_HOTSPOTS;
}

// 9. Precios y Ofertas
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
    offerTag: '5% Descuento Pago de Contado',
    minDepositPercentage: 50,
  }));
}

export function saveStoredPriceOffers(offers: PriceOfferItem[]): void {
  localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
  window.dispatchEvent(new Event('mr_offers_updated'));
}

// 10. Salud de la Web
export function getStoredWebHealth(): WebHealthMetrics {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HEALTH);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading web health:', e);
  }
  return INITIAL_WEB_HEALTH;
}

// 11. Seguridad
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

// 12. Ajustes (Exacto a captura)
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

// Auth helpers
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
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  window.dispatchEvent(new Event('mr_auth_changed'));
}

export function getAdminToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

// Site visit analytics recorder
export function recordSiteVisit(): void {
  const hasVisitedSession = sessionStorage.getItem('mr_session_visited');
  if (!hasVisitedSession) {
    sessionStorage.setItem('mr_session_visited', 'true');
    const settings = getStoredSettings();
    saveStoredSettings({
      visitRecordsCount: settings.visitRecordsCount + 1,
      storageUsedBytes: settings.storageUsedBytes + 420,
    });
  }
}
