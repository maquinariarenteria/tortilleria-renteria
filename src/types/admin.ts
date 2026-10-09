import { MachineProduct } from '../types';

export type AdminTab = 
  | 'resumen'
  | 'cotizaciones'
  | 'citas'
  | 'ventas'
  | 'oportunidades'
  | 'pruebas_ab'
  | 'mapa_clics'
  | 'catalogo'
  | 'precios_ofertas'
  | 'salud_web'
  | 'seguridad'
  | 'ajustes';

// 1. Resumen
export interface DashboardMetrics {
  monthlySales: number;
  monthlySalesTarget: number;
  currency: 'USD' | 'MXN';
  activeQuotesCount: number;
  confirmedAppointmentsCount: number;
  totalVisits: number;
  uniqueVisits: number;
  conversionRate: number;
  averageTicket: number;
  weeklyTrend: { day: string; sales: number; quotes: number; visits: number }[];
}

// 2. Cotizaciones
export interface QuoteItem {
  machineId: string;
  name: string;
  quantity: number;
  price: number;
  capacity?: string;
  energyType?: string;
}

export interface CustomerQuote {
  id: string;
  folio: string;
  createdAt: string;
  customerName: string;
  phone: string;
  email: string;
  stateOrCity: string;
  businessType: 'Taquería' | 'Tortillería de harina' | 'Supermercado' | 'Fábrica de burritos' | 'Emprendimiento' | 'Otro';
  items: QuoteItem[];
  estimatedTotal: number;
  status: 'Nueva' | 'Contactada' | 'En Negociación' | 'Cerrada' | 'Descartada';
  priority: 'Alta' | 'Media' | 'Baja';
  notes: string;
  lastContactAt?: string;
}

// 3. Citas
export interface Appointment {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  type: 'Demostración en Taller (Delicias, Chih.)' | 'Videollamada en Vivo' | 'Asesoría Técnica Telefónica';
  machineOfInterest: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: 'Pendiente' | 'Confirmada' | 'Realizada' | 'Cancelada';
  notes: string;
  reminderSent: boolean;
}

// 4. Ventas
export interface AdminSaleOrder {
  folio: string;
  createdAt: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  requiresInvoice: boolean;
  rfc?: string;
  businessName?: string;
  cfdiUsage?: string;
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  iva: number;
  shippingCost: number;
  total: number;
  currency?: 'MXN' | 'USD';
  paymentType?: 'full';
  amountPaid?: number;
  balanceDue?: number;
  stripeSessionId?: string;
  paymentMethod: 'Stripe' | 'Transferencia SPEI' | 'Efectivo en Taller' | 'Financiamiento';
  manufacturingStatus: 'Pendiente' | 'En Fabricación' | 'Probada en Banco' | 'Embarcada' | 'Entregada';
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
}

// 6. Oportunidades CRM
export interface Opportunity {
  id: string;
  companyOrClient: string;
  contactName: string;
  phone: string;
  stage: 'contacto_inicial' | 'ficha_enviada' | 'en_negociacion' | 'aprobacion_anticipo' | 'ganada' | 'perdida';
  dealValue: number;
  machineModel: string;
  closeProbability: number; // 0 to 100
  expectedCloseDate: string;
  lastFollowUp: string;
  nextStep: string;
}

// 7. Prueba A/B
export interface ABExperiment {
  id: string;
  title: string;
  description: string;
  status: 'running' | 'paused' | 'completed';
  variantA: {
    name: string;
    description: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
  };
  variantB: {
    name: string;
    description: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
  };
  startDate: string;
  winningVariant?: 'A' | 'B' | null;
}

// 8. Mapa de Clics y Recorridos
export interface ClickHotspot {
  id: string;
  elementName: string;
  section: string;
  clicksCount: number;
  percentage: number;
  category: 'CTA Principal' | 'Catálogo' | 'WhatsApp / Contacto' | 'Calculadora' | 'Detalle Producto';
}

export interface UserJourneyPath {
  id: string;
  path: string;
  stepsCount: number;
  sessionsCount: number;
  percentage: number;
  conversionRate: number;
}

// 9. Precios y Ofertas
export interface PriceOfferItem {
  machineId: string;
  name: string;
  regularPriceMXN: number;
  offerPriceMXN?: number;
  regularPriceUSD: number;
  offerPriceUSD?: number;
  isOfferActive: boolean;
  offerTag?: string; // e.g. "Envío Gratis Norte", "5% Pago Contado"
  minDepositPercentage: number; // e.g. 50%
}

// 10. Salud de la Web
export interface WebHealthMetrics {
  cloudflareWorkerStatus: 'operativo' | 'degradado' | 'mantenimiento';
  averageLatencyMs: number;
  d1DatabaseStatus: 'conectada' | 'desconectada';
  d1QueryTimeMs: number;
  r2StorageStatus: 'conectado' | 'desconectado';
  r2LatencyMs: number;
  sslStatus: 'activo' | 'inactivo';
  sslExpiryDays: number;
  cacheHitRatio: number;
  uptimePercentage: number;
  lcp: number; // Largest Contentful Paint (s)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  lastAuditTime: string;
}

// 11. Seguridad
export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  action: 'Inicio de sesión exitoso' | 'Intento fallido de login' | 'Cambio de configuración' | 'Exportación de datos' | 'Subida de archivo';
  status: 'Permitido' | 'Bloqueado' | 'Sospechoso';
  deviceInfo: string;
}

export interface SecuritySettings {
  underAttackMode: boolean;
  rateLimitingEnabled: boolean;
  adminPasswordConfiguredInCloudflare: boolean;
  blockedIps: string[];
  sessionTimeoutMinutes: number;
}

// 12. Ajustes y Límites Oficiales de Cloudflare (Plan Gratuito)
export interface CloudflareResourceLimit {
  service: string;
  metricName: string;
  freeLimit: number | string;
  freeLimitFormatted: string;
  currentUsage: number;
  currentUsageFormatted: string;
  unit: string;
  usagePercent: number;
  status: 'safe' | 'warning' | 'critical';
  details: string;
}

export interface AdminSettingsConfig {
  reportEmail: string;
  monthlySalesTarget: number;
  salesTargetCurrency: 'USD' | 'MXN';
  emailService: string; // 'Cloudflare Email Routing (100% Gratis)'
  notifyNewQuotes: boolean;
  notifyAbandonedCarts: boolean;
  notifyAppointments: boolean;
  storageUsedBytes: number;
  storageLimitBytes: number; // 5 GB en D1 = 5 * 1024 * 1024 * 1024
  visitRecordsCount: number;
  lastTestDate: string;
  emailStatus: 'ok' | 'missing_config' | 'error';
  lastCleanupDate: string;
  alertThresholdPercent: number; // Por defecto 80%
  r2StorageUsedBytes: number;
  r2StorageLimitBytes: number; // 10 GB en R2 = 10 * 1024 * 1024 * 1024
  dailyRequestsUsed: number;
  dailyRequestsLimit: number; // 100,000 en Workers
}
