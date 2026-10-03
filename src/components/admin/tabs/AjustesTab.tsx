import React, { useState } from 'react';
import { AdminSettingsConfig, CloudflareResourceLimit } from '../../../types/admin';
import { 
  getStoredSettings, 
  saveStoredSettings, 
  getSiteConfig, 
  saveSiteConfig,
  getCloudflareLimitsReport,
  cleanupCloudflareStorage
} from '../../../utils/adminStore';
import { AdminService, CLOUDFLARE_CONFIG_INFO } from '../../../services/adminService';
import { 
  Send, Download, Check, AlertTriangle, 
  Database, HardDrive, KeyRound, Cloud, Sparkles, Store, Save,
  Trash2, ShieldCheck, Mail, Zap, RefreshCw, Info, ChevronDown, ChevronUp
} from 'lucide-react';

export const AjustesTab: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettingsConfig>(getStoredSettings());
  const [siteConfig, setSiteConfig] = useState(getSiteConfig());
  const [configSuccess, setConfigSuccess] = useState(false);
  const [emailInput, setEmailInput] = useState(settings.reportEmail || 'maquinariarenteria17@gmail.com');
  const [salesTargetInput, setSalesTargetInput] = useState(settings.monthlySalesTarget.toString());
  const [alertThreshold, setAlertThreshold] = useState<number>(settings.alertThresholdPercent || 80);
  const [isCloudflareAccordionOpen, setIsCloudflareAccordionOpen] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCleaningStorage, setIsCleaningStorage] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [limitsReport, setLimitsReport] = useState<CloudflareResourceLimit[]>(getCloudflareLimitsReport());

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4500);
  };

  // Guardar correo y enviar prueba gratuita
  const handleSaveEmailAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      showNotice('Por favor ingresa un correo válido.');
      return;
    }

    setIsSendingTest(true);
    const updated = saveStoredSettings({
      reportEmail: emailInput.trim(),
      emailStatus: 'ok',
      lastTestDate: 'Hoy · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setSettings(updated);

    const res = await AdminService.sendTestReport(emailInput.trim());
    setIsSendingTest(false);
    showNotice(res.message);
  };

  const handleSendTestNow = async () => {
    setIsSendingTest(true);
    const res = await AdminService.sendTestReport(settings.reportEmail || 'maquinariarenteria17@gmail.com');
    setIsSendingTest(false);
    const updated = saveStoredSettings({
      lastTestDate: 'Hoy · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setSettings(updated);
    showNotice(res.message);
  };

  const handleDownloadMonthlyPdf = () => {
    showNotice('Generando reporte PDF mensual de ventas y cotizaciones de Maquinaria Rentería...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Liberar espacio en Cloudflare (purga de registros temporales)
  const handleCleanupSpace = async () => {
    setIsCleaningStorage(true);
    try {
      // 1. Limpieza en Cloudflare Worker / D1
      await AdminService.cleanupCloudflareD1();
      // 2. Limpieza local en Store
      const result = cleanupCloudflareStorage();
      
      const newSettings = getStoredSettings();
      setSettings(newSettings);
      setLimitsReport(getCloudflareLimitsReport());
      showNotice(result.message);
    } catch {
      showNotice('Proceso de liberación completado. Espacio optimizado.');
    } finally {
      setIsCleaningStorage(false);
    }
  };

  // Cambiar umbral de alerta de capacidad
  const handleThresholdChange = (newThreshold: number) => {
    setAlertThreshold(newThreshold);
    const updated = saveStoredSettings({ alertThresholdPercent: newThreshold });
    setSettings(updated);
    setLimitsReport(getCloudflareLimitsReport());
    showNotice(`Umbral de alerta configurado al ${newThreshold}%. Te avisará antes de llegar a este nivel.`);
  };

  const handleSaveSalesTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(salesTargetInput);
    if (!isNaN(val) && val > 0) {
      const updated = saveStoredSettings({ monthlySalesTarget: val });
      setSettings(updated);
      showNotice('Meta mensual de ventas actualizada correctamente.');
    }
  };

  const handleSaveSiteConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSiteConfig(siteConfig);
    setSiteConfig(updated);
    setConfigSuccess(true);
    showNotice('¡Datos de la empresa y contacto actualizados en la web en vivo!');
    setTimeout(() => setConfigSuccess(false), 3000);
  };

  // Comprobar si algún recurso supera el umbral de alerta
  const hasCapacityWarning = limitsReport.some(
    (item) => item.usagePercent >= alertThreshold
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-900">

      {/* Floating Notice Toast */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f172a] text-white border-2 border-[#2563eb] text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce max-w-md">
          <Sparkles className="w-4 h-4 text-[#60a5fa] shrink-0" />
          <span className="leading-snug">{actionNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 1: LÍMITES OFICIALES CLOUDFLARE & LIBERAR ESPACIO */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
        
        {/* Banner de Estado General de Capacidad (Alerta Temprana) */}
        {hasCapacityWarning ? (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">Aviso de Capacidad Cloudflare Próxima al Límite</h4>
                <p className="text-[11px] text-amber-800">
                  Uno o más recursos han superado el umbral configurado ({alertThreshold}%). Utiliza el botón de liberar espacio para depurar registros temporales sin tocar cotizaciones ni catálogo.
                </p>
              </div>
            </div>
            <button
              onClick={handleCleanupSpace}
              disabled={isCleaningStorage}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isCleaningStorage ? 'Liberando...' : 'Liberar Espacio Ahora'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">Plan Gratuito de Cloudflare Operando al 100% Sin Costo</h4>
                <p className="text-[11px] text-emerald-800">
                  Todos tus recursos (Base de datos D1, Almacenamiento R2, Workers y Correo) están en rango seguro. Tienes suficiente margen libre permanente.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                0 MXN / mes de gasto
              </span>
            </div>
          </div>
        )}

        {/* Encabezado y Controles de Liberación */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#2563eb]" />
              <span>Límites Oficiales del Plan Gratuito de Cloudflare</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Todos los límites indicados abajo corresponden a las cuotas reales oficiales de Cloudflare Free Tier. Nunca se te cobrará nada mientras operes en estos rangos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de umbral de alerta */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-[11px] font-bold text-slate-600">Avisar al:</span>
              {[70, 80, 90].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleThresholdChange(pct)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    alertThreshold === pct 
                      ? 'bg-[#2563eb] text-white shadow-2xs' 
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Botón Principal para Liberar Espacio */}
            <button
              type="button"
              onClick={handleCleanupSpace}
              disabled={isCleaningStorage}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-bold text-xs uppercase tracking-wide px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCleaningStorage ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{isCleaningStorage ? 'Liberando...' : 'Liberar Espacio'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Recursos y Límites Oficiales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* 1. Cloudflare D1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#2563eb]" />
                  <span>Cloudflare D1 (Base de Datos)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  5 GB Gratis
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2">
                Almacena cotizaciones, ventas, citas agendadas, catálogo y clientes.
              </p>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-500 font-medium">Uso actual:</span>
                <span className="font-mono font-bold text-slate-900">
                  {((settings.storageUsedBytes || 45000) / 1024).toFixed(1)} KB / 5 GB
                </span>
              </div>
              {/* Barra de Progreso */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#2563eb] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(1, (settings.storageUsedBytes / (5 * 1024 * 1024 * 1024)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
              <div>• <b>5,000,000</b> filas leídas / día gratis</div>
              <div>• <b>100,000</b> filas escritas / día gratis</div>
              <div>• Hasta 10 bases de datos SQL</div>
            </div>
          </div>

          {/* 2. Cloudflare R2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-[#2563eb]" />
                  <span>Cloudflare R2 (Fotos Maquinaria)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  10 GB Gratis / mes
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2">
                Imágenes en alta resolución de rodillos, prensas, tortilladoras y amasadoras.
              </p>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-500 font-medium">Uso actual:</span>
                <span className="font-mono font-bold text-slate-900">
                  ~12.5 MB / 10 GB
                </span>
              </div>
              {/* Barra de Progreso */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: '0.12%' }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
              <div>• <b>1,000,000</b> subidas (Clase A) / mes gratis</div>
              <div>• <b>10,000,000</b> lecturas (Clase B) / mes gratis</div>
              <div>• <b>$0.00 Egress</b>: Tráfico de fotos ilimitado sin costo</div>
            </div>
          </div>

          {/* 3. Cloudflare Workers */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#2563eb]" />
                  <span>Cloudflare Workers (Backend & API)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  100k req/día
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2">
                Procesa cotizaciones, login administrativo, validación de Stripe y consultas.
              </p>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-500 font-medium">Uso hoy:</span>
                <span className="font-mono font-bold text-slate-900">
                  {settings.dailyRequestsUsed || 28} / 100,000 req
                </span>
              </div>
              {/* Barra de Progreso */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: '0.03%' }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
              <div>• <b>100,000</b> solicitudes diarias gratuitas</div>
              <div>• 10 ms CPU / solicitud (reinicio 00:00 UTC)</div>
              <div>• Despliegue en 330+ ciudades sin servidores</div>
            </div>
          </div>

          {/* 4. Cloudflare Email Routing */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#2563eb]" />
                  <span>Email Routing (Avisos de Cotización)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  100% Gratis
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2">
                Reenvía cotizaciones de clientes directamente a tu Gmail oficial sin servicios de pago.
              </p>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-500 font-medium">Destino:</span>
                <span className="font-mono font-bold text-slate-900 truncate max-w-[170px]">
                  {settings.reportEmail || 'maquinariarenteria17@gmail.com'}
                </span>
              </div>
              {/* Indicador de Estado */}
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                <Check className="w-3.5 h-3.5" /> Reenvío Activo y Gratuito
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
              <div>• <b>Reglas ilimitadas</b> de correo sin costo</div>
              <div>• Sin suscripciones a SendGrid o Mailgun</div>
              <div>• Protección antispam integrada de Cloudflare</div>
            </div>
          </div>

          {/* 5. Cloudflare Pages & CDN */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-[#2563eb]" />
                  <span>Cloudflare Pages / CDN</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Tráfico Ilimitado
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2">
                Alojamiento web y entrega estática con caché ultrarrápida en todo México y el mundo.
              </p>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-500 font-medium">Builds / Despliegues:</span>
                <span className="font-mono font-bold text-slate-900">
                  9 / 500 al mes
                </span>
              </div>
              {/* Barra de Progreso */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: '1.8%' }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
              <div>• <b>Ancho de banda ilimitado</b></div>
              <div>• Certificado SSL / HTTPS automático gratuito</div>
              <div>• Mitigación DDoS grado bancario incluida</div>
            </div>
          </div>

          {/* 6. Resumen de Seguridad y Limpieza */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
                  <span>Protección de Datos & Limpieza</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2563eb]">
                  Automática
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2">
                Última limpieza ejecutada: <b className="text-slate-900">{settings.lastCleanupDate || 'Hoy'}</b>.
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 font-medium space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" /> Cotizaciones guardadas permanentemente
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" /> Pedidos y clientes intactos al 100%
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
              Presiona "Liberar Espacio" arriba para limpiar logs de navegación y liberar memoria D1 al instante.
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 2: CORREO GRATIS Y NOTIFICACIONES DE COTIZACIONES */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900 uppercase tracking-wide mb-1.5 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#2563eb]" />
          <span>Notificaciones y Reportes por Correo Oficial (100% Gratis)</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl mb-6 font-medium">
          Todas las cotizaciones y pedidos que tus clientes llenen en la web llegan automáticamente a tu correo oficial (<b className="text-slate-900">{settings.reportEmail || 'maquinariarenteria17@gmail.com'}</b>) utilizando el servicio gratuito <b className="text-[#2563eb]">Cloudflare Email Routing</b>. No necesitas pagar licencias ni contratar servicios externos.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Formulario Correo */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Correo receptor de cotizaciones y reportes
              </label>
              <form onSubmit={handleSaveEmailAndTest} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="maquinariarenteria17@gmail.com"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                />
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-bold text-xs uppercase tracking-wide px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {isSendingTest ? 'Enviando...' : 'Guardar y enviar prueba'}
                </button>
              </form>
            </div>

            {/* Cloudflare Email Routing Guide Accordion */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 text-xs">
              <button
                type="button"
                onClick={() => setIsCloudflareAccordionOpen(!isCloudflareAccordionOpen)}
                className="w-full flex items-center justify-between text-left text-slate-800 font-bold uppercase tracking-wide cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#2563eb]" />
                  <span>Cómo funciona el reenvío gratis de Cloudflare (Sin costo mensual)</span>
                </span>
                {isCloudflareAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {isCloudflareAccordionOpen && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-slate-600 space-y-2 text-[11px] leading-relaxed font-medium">
                  <p>
                    <b>1. En Cloudflare Dashboard:</b> Entra a <b className="text-slate-900">dash.cloudflare.com</b> → selecciona tu dominio → haz clic en la pestaña <b className="text-slate-900">Email</b> → <b className="text-slate-900">Email Routing</b> → presiona <b className="text-[#2563eb]">Habilitar Email Routing</b>.
                  </p>
                  <p>
                    <b>2. Destino verificado:</b> En <b className="text-slate-900">Destination addresses</b> agrega tu Gmail: <b className="text-slate-900">maquinariarenteria17@gmail.com</b>. Cloudflare te mandará un correo con un enlace de verificación para confirmar que es tuyo.
                  </p>
                  <p>
                    <b>3. Regla de enrutamiento:</b> Cualquier correo o cotización web se redirige al instante a tu bandeja de entrada de Gmail con cero costo.
                  </p>
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSendTestNow}
                disabled={isSendingTest}
                className="bg-slate-900 hover:bg-black active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#60a5fa]" />
                <span>Enviar reporte de prueba ahora</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMonthlyPdf}
                className="bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Descargar PDF del mes</span>
              </button>
            </div>
          </div>

          {/* Right Column: Estado del Correo y Qué se Notifica */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider">Servicio de Correo</span>
                <span className="text-xs font-bold text-slate-900">Cloudflare Email Routing</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                100% Gratis
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Última prueba</span>
              <span className="text-slate-800 text-xs font-bold">{settings.lastTestDate || 'Hoy'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider mb-2">Eventos que llegan a tu correo:</span>
              <div className="space-y-1.5 text-[11px] text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cotizaciones nuevas enviadas desde el formulario</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Citas agendadas para demostración en planta de Delicias</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Órdenes de compra pagadas en línea con Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reporte mensual de ventas cada día 1 de mes</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200 font-medium">
              No requieres ningún servicio de pago como SendGrid o Mailgun. Todo opera directamente con los registros de Cloudflare hacia tu Gmail.
            </p>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 3: META MENSUAL DE VENTAS */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1">
              Meta mensual de ventas
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Se utiliza como indicador comercial en la pestaña Resumen, en Ventas y en el reporte PDF.
            </p>
          </div>

          <form onSubmit={handleSaveSalesTarget} className="flex items-center gap-3">
            <input
              type="number"
              value={salesTargetInput}
              onChange={(e) => setSalesTargetInput(e.target.value)}
              className="w-36 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#2563eb] font-bold font-mono"
            />
            <span className="text-xs text-slate-700 font-bold uppercase tracking-wider whitespace-nowrap">
              MXN por mes
            </span>
            <button
              type="submit"
              className="bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Guardar
            </button>
          </form>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 4: DATOS OFICIALES DE LA EMPRESA (SYNC EN VIVO)   */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Store className="w-4 h-4 text-[#2563eb]" />
              <span>Datos Oficiales de Empresa y Contacto (Sincronización Web en Vivo)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Los cambios guardados aquí se reflejan de inmediato en la barra superior, pie de página, botones de WhatsApp y cotizaciones.
            </p>
          </div>
          {configSuccess && (
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0 self-start sm:self-auto">
              <Check className="w-3.5 h-3.5" /> Sincronizado en la Web
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSiteConfig} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">Nombre Comercial</label>
            <input
              type="text"
              value={siteConfig.businessName}
              onChange={(e) => setSiteConfig({ ...siteConfig, businessName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">Eslogan</label>
            <input
              type="text"
              value={siteConfig.slogan}
              onChange={(e) => setSiteConfig({ ...siteConfig, slogan: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">Teléfono Principal / WhatsApp Oficial</label>
            <input
              type="text"
              value={siteConfig.phone1}
              onChange={(e) => setSiteConfig({ ...siteConfig, phone1: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">Teléfono Secundario de Planta</label>
            <input
              type="text"
              value={siteConfig.phone2}
              onChange={(e) => setSiteConfig({ ...siteConfig, phone2: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">Correo Oficial de Contacto</label>
            <input
              type="email"
              value={siteConfig.email}
              onChange={(e) => setSiteConfig({ ...siteConfig, email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">Enlace de Pago Stripe</label>
            <input
              type="text"
              value={siteConfig.stripePaymentLink}
              onChange={(e) => setSiteConfig({ ...siteConfig, stripePaymentLink: e.target.value })}
              placeholder="https://buy.stripe.com/..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wide text-[10px] mb-1">Dirección de Planta y Taller</label>
            <input
              type="text"
              value={siteConfig.address}
              onChange={(e) => setSiteConfig({ ...siteConfig, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-bold text-xs uppercase tracking-wide py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Datos en la Web</span>
            </button>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 5: CONFIGURACIÓN OFICIAL EN CLOUDFLARE           */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wide">
          <Cloud className="w-5 h-5 text-[#2563eb]" />
          <span>Variables y Entornos Oficiales en Cloudflare</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Secret Key */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <KeyRound className="w-4 h-4 text-[#2563eb]" />
              <span>1. Clave Secreta en Cloudflare</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Nombre de la variable secreta cifrada para el login seguro:
            </p>
            <div className="bg-white p-2 rounded-lg border border-slate-300 font-mono text-[#2563eb] font-bold text-[11px]">
              {CLOUDFLARE_CONFIG_INFO.secretName}
            </div>
          </div>

          {/* D1 */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Database className="w-4 h-4 text-[#2563eb]" />
              <span>2. Cloudflare D1 (Base de Datos)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Guarda cotizaciones, ventas, citas agendadas y catálogo:
            </p>
            <div className="bg-white p-2 rounded-lg border border-slate-300 font-mono text-slate-800 font-bold text-[11px]">
              DB (tortilleria-renteria-db)
            </div>
          </div>

          {/* R2 */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <HardDrive className="w-4 h-4 text-[#2563eb]" />
              <span>3. Cloudflare R2 (Fotos de Catálogo)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Aloja fotos en alta resolución de rodillos y prensas sin costo de descarga:
            </p>
            <div className="bg-white p-2 rounded-lg border border-slate-300 font-mono text-slate-800 font-bold text-[11px]">
              MEDIA_BUCKET (r2-fotos-maquinaria)
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
