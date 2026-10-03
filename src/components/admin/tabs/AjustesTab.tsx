import React, { useState } from 'react';
import { AdminSettingsConfig } from '../../../types/admin';
import { getStoredSettings, saveStoredSettings } from '../../../utils/adminStore';
import { AdminService, CLOUDFLARE_CONFIG_INFO } from '../../../services/adminService';
import { 
  Send, Download, Check, X, ChevronDown, ChevronUp, 
  Database, HardDrive, KeyRound, Cloud, Sparkles 
} from 'lucide-react';

export const AjustesTab: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettingsConfig>(getStoredSettings());
  const [emailInput, setEmailInput] = useState(settings.reportEmail || 'maquinariarenteria17@gmail.com');
  const [salesTargetInput, setSalesTargetInput] = useState(settings.monthlySalesTarget.toString());
  const [isCloudflareAccordionOpen, setIsCloudflareAccordionOpen] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

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

  const handleToggleTelegram = (key: 'notifyNewQuotes' | 'notifyAbandonedCarts' | 'notifyAppointments') => {
    const updated = saveStoredSettings({ [key]: !settings[key] });
    setSettings(updated);
    showNotice('Preferencia de alertas actualizada.');
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

  const formattedUsedKB = (settings.storageUsedBytes / 1024).toFixed(0);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">

      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f172a] text-white border-2 border-[#2563eb] text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#60a5fa]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Top Card: Reporte mensual y limpieza de datos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <h2 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-wide mb-1.5">
          Reporte mensual y limpieza de datos
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl mb-6 font-medium">
          El día 1 de cada mes a las 7:00 te llega el reporte detallado del mes anterior en PDF a tu correo oficial (<b className="text-slate-900">maquinariarenteria17@gmail.com</b>) y a Telegram (con archivos de Excel). En Telegram también puedes escribir <code className="text-[#2563eb] bg-blue-50 font-mono px-1 py-0.5 rounded font-bold">/reporte</code> cuando quieras. Después se depuran registros temporales para optimizar espacio en Cloudflare D1.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Correo para los reportes
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

            {/* Cloudflare Email Routing Guide */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 text-xs">
              <button
                type="button"
                onClick={() => setIsCloudflareAccordionOpen(!isCloudflareAccordionOpen)}
                className="w-full flex items-center justify-between text-left text-slate-800 font-bold uppercase tracking-wide cursor-pointer"
              >
                <span>▼ Activar el correo en Cloudflare (gratis, una sola vez)</span>
                {isCloudflareAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {isCloudflareAccordionOpen && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-slate-600 space-y-2 text-[11px] leading-relaxed font-medium">
                  <p>
                    1. Entra a <b className="text-slate-900">dash.cloudflare.com</b> → elige tu dominio <b className="text-[#2563eb]">maquinariarenteria.com</b> (o tu dominio asignado) → <b className="text-slate-900">Email</b> → <b className="text-slate-900">Email Routing</b> → <b className="text-[#2563eb]">Comenzar / Habilitar</b> y acepta los registros DNS que agrega.
                  </p>
                  <p>
                    2. En <b className="text-slate-900">Direcciones de destino</b> (Destination addresses) agrega <b className="text-slate-900">maquinariarenteria17@gmail.com</b> y abre el correo de verificación de Cloudflare → <b className="text-emerald-700">Verify email address</b>.
                  </p>
                  <p>
                    3. Vuelve aquí y presiona <b className="text-slate-900">Guardar y enviar prueba</b>.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Action Buttons */}
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

              <span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5 ml-1">
                <span>Telegram conectado</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </span>
            </div>
          </div>

          {/* Right Column: Status & Storage */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
            
            {/* Espacio usado */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider">Espacio usado en Cloudflare D1</span>
                <span className="text-[11px] text-slate-500">{settings.visitRecordsCount} registros de visitas • límite gratuito 5 GB</span>
              </div>
              <span className="text-base font-black text-slate-900 font-mono">
                {formattedUsedKB} KB
              </span>
            </div>

            {/* Última prueba */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Última prueba</span>
              <span className="text-slate-800 text-xs font-bold">{settings.lastTestDate}</span>
            </div>

            {/* Correo */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider">Correo</span>
                <span className="text-[11px] text-slate-700 font-medium">
                  {settings.reportEmail || 'maquinariarenteria17@gmail.com'}
                </span>
              </div>
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>

            {/* Telegram */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-slate-500 block text-[11px] font-bold uppercase tracking-wider">Telegram</span>
                <span className="text-[11px] text-slate-700 font-medium">Canal oficial activo (@MaquinariaRenteria_bot)</span>
              </div>
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>

            {/* Última limpieza */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Última limpieza</span>
              <span className="text-slate-700 text-xs font-bold">{settings.nextCleanupDate}</span>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200 font-medium">
              Se conservan permanentemente: cotizaciones abiertas, pedidos en fabricación, catálogo de maquinaria, fotos en R2 y configuración.
            </p>
          </div>

        </div>
      </div>

      {/* Row 2: Avisos por Telegram & Meta mensual de ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Telegram Alerts Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1">
            Avisos por Telegram (Gratis)
          </h3>
          <p className="text-xs text-emerald-700 font-bold mb-5 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Conectado con bot oficial {settings.telegramBotUsername}</span>
          </p>

          <div className="space-y-4">
            
            {/* Toggle 1: Cotizaciones y pedidos */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-700 font-semibold">Cotizaciones y pedidos nuevos de tortilladoras</span>
              <button
                type="button"
                onClick={() => handleToggleTelegram('notifyNewQuotes')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.notifyNewQuotes ? 'bg-[#2563eb]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.notifyNewQuotes ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Carritos abandonados */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-700 font-semibold">Carritos abandonados en catálogo (30 min después)</span>
              <button
                type="button"
                onClick={() => handleToggleTelegram('notifyAbandonedCarts')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.notifyAbandonedCarts ? 'bg-[#2563eb]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.notifyAbandonedCarts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Citas en taller */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-700 font-semibold">Citas: demostraciones en taller Delicias, recordatorio 1 h antes y agenda (8:00 AM)</span>
              <button
                type="button"
                onClick={() => handleToggleTelegram('notifyAppointments')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.notifyAppointments ? 'bg-[#2563eb]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.notifyAppointments ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </div>
        </div>

        {/* Sales Target Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1">
              Meta mensual de ventas
            </h3>
            <p className="text-xs text-slate-500 mb-5 font-medium">
              Se utiliza como indicador comercial en Resumen, Ventas y reporte PDF.
            </p>

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

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between font-medium">
            <span>Objetivo fijado: <b className="text-slate-900">${parseFloat(salesTargetInput || '0').toLocaleString()} MXN</b></span>
            <span className="text-emerald-700 font-bold">Activo en Resumen</span>
          </div>
        </div>

      </div>

      {/* Cloudflare Storage & Secret Info Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wide">
          <Cloud className="w-5 h-5 text-[#2563eb]" />
          <span>Configuración Oficial en Cloudflare</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Secret */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <KeyRound className="w-4 h-4 text-[#2563eb]" />
              <span>1. Clave Secreta</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Nombre de la variable secreta en Cloudflare:
            </p>
            <div className="bg-white p-2 rounded-lg border border-slate-300 font-mono text-[#2563eb] font-bold text-[11px]">
              {CLOUDFLARE_CONFIG_INFO.secretName}
            </div>
          </div>

          {/* D1 */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Database className="w-4 h-4 text-[#2563eb]" />
              <span>2. Cloudflare D1 (Datos)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Guarda cotizaciones, ventas, citas y configuración:
            </p>
            <div className="bg-white p-2 rounded-lg border border-slate-300 font-mono text-slate-800 font-bold text-[11px]">
              DB (tortilleria-renteria-db)
            </div>
          </div>

          {/* R2 */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <HardDrive className="w-4 h-4 text-[#2563eb]" />
              <span>3. Cloudflare R2 (Fotos)</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Aloja fotos en alta resolución de rodillos y prensas:
            </p>
            <div className="bg-white p-2 rounded-lg border border-slate-300 font-mono text-slate-800 font-bold text-[11px]">
              MEDIA_BUCKET (R2)
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
