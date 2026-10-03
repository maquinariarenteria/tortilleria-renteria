import React, { useState } from 'react';
import { 
  AdminSettingsConfig 
} from '../../../types/admin';
import { 
  getStoredSettings, 
  saveStoredSettings 
} from '../../../utils/adminStore';
import { AdminService, CLOUDFLARE_CONFIG_INFO } from '../../../services/adminService';
import { 
  Send, Download, Check, X, ChevronDown, ChevronUp, 
  Database, HardDrive, Shield, KeyRound, Cloud, Sparkles 
} from 'lucide-react';

export const AjustesTab: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettingsConfig>(getStoredSettings());
  const [emailInput, setEmailInput] = useState(settings.reportEmail);
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
    showNotice('Generando reporte PDF del mes con métricas de ventas y cotizaciones...');
    // Trigger download of a clean printable window or mock pdf
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleToggleTelegram = (key: 'notifyNewQuotes' | 'notifyAbandonedCarts' | 'notifyAppointments') => {
    const updated = saveStoredSettings({ [key]: !settings[key] });
    setSettings(updated);
    showNotice('Preferencia de Telegram actualizada.');
  };

  const handleSaveSalesTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(salesTargetInput);
    if (!isNaN(val) && val > 0) {
      const updated = saveStoredSettings({ monthlySalesTarget: val });
      setSettings(updated);
      showNotice('Meta mensual de ventas guardada correctamente.');
    }
  };

  const formattedUsedKB = (settings.storageUsedBytes / 1024).toFixed(0);

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">

      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#1c2237] border border-purple-500/50 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Top Card: Reporte mensual y limpieza de datos (EXACT TO SCREENSHOT) */}
      <div className="bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl">
        <h2 className="text-base md:text-lg font-bold text-white mb-1.5">
          Reporte mensual y limpieza de datos
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl mb-6">
          El día 1 de cada mes a las 7:00 te llega el reporte detallado del mes anterior en PDF a tu correo y a Telegram (con archivos de Excel). En Telegram también puedes escribir <code className="text-purple-300 bg-[#181d2e] px-1 py-0.5 rounded">/reporte</code> cuando quieras. Después se borran esos datos para no ocupar espacio.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Inputs, cloudflare guide & action buttons) */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Correo para los reportes
              </label>
              <form onSubmit={handleSaveEmailAndTest} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="flex-1 bg-[#181c2b] border border-[#2a3047] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="bg-[#6366f1] hover:bg-[#5255e3] active:scale-95 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {isSendingTest ? 'Enviando...' : 'Guardar y enviar prueba'}
                </button>
              </form>
            </div>

            {/* Cloudflare Accordion */}
            <div className="border border-[#22283e] bg-[#161a29]/60 rounded-lg p-3.5 text-xs">
              <button
                type="button"
                onClick={() => setIsCloudflareAccordionOpen(!isCloudflareAccordionOpen)}
                className="w-full flex items-center justify-between text-left text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                <span>▼ Activar el correo en Cloudflare (gratis, una sola vez)</span>
                {isCloudflareAccordionOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {isCloudflareAccordionOpen && (
                <div className="mt-3 pt-3 border-t border-[#23293f] text-slate-400 space-y-2 text-[11px] leading-relaxed">
                  <p>
                    1. Entra a <b className="text-slate-200">dash.cloudflare.com</b> → elige tu dominio <b className="text-purple-300">orion-creative-studio.com</b> o <b className="text-purple-300">maquinariarenteria.com</b> → <b className="text-slate-200">Email</b> → <b className="text-slate-200">Email Routing</b> → <b className="text-purple-300">Comenzar / Habilitar</b> y acepta los registros que agrega.
                  </p>
                  <p>
                    2. En <b className="text-slate-200">Direcciones de destino</b> (Destination addresses) agrega el mismo correo de arriba y abre el correo de verificación → <b className="text-emerald-400">Verify email address</b>.
                  </p>
                  <p>
                    3. Vuelve aquí y presiona <b className="text-slate-200">Guardar y enviar prueba</b>.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSendTestNow}
                disabled={isSendingTest}
                className="bg-[#1c2030] hover:bg-[#252b40] active:scale-95 text-slate-200 border border-[#2e344d] px-4 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-slate-300" />
                <span>Enviar reporte de prueba ahora</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMonthlyPdf}
                className="bg-[#1c2030] hover:bg-[#252b40] active:scale-95 text-slate-200 border border-[#2e344d] px-4 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span>Descargar PDF del mes</span>
              </button>

              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 ml-1">
                <span>Telegram conectado</span>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </span>
            </div>
          </div>

          {/* Right Column (Metrics and Status Box) */}
          <div className="lg:col-span-5 bg-[#0f111a] border border-[#22273c] rounded-xl p-5 space-y-4 text-xs">
            
            {/* Espacio usado */}
            <div className="flex items-start justify-between border-b border-[#1c2032] pb-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Espacio usado</span>
                <span className="text-[11px] text-slate-500">{settings.visitRecordsCount} registros de visitas · límite gratis 5 GB</span>
              </div>
              <span className="text-sm font-bold text-white tracking-wide">
                {formattedUsedKB} KB
              </span>
            </div>

            {/* Última prueba */}
            <div className="flex items-center justify-between border-b border-[#1c2032] pb-3">
              <span className="text-slate-400 text-[11px]">Última prueba</span>
              <span className="text-slate-200 text-xs font-medium">{settings.lastTestDate}</span>
            </div>

            {/* Correo */}
            <div className="flex items-center justify-between border-b border-[#1c2032] pb-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Correo</span>
                <span className="text-[11px] text-slate-500">
                  {settings.reportEmail || 'Escribe el correo para reportes en Ajustes.'}
                </span>
              </div>
              {settings.reportEmail ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-4 h-4 text-rose-500 shrink-0" />
              )}
            </div>

            {/* Telegram */}
            <div className="flex items-center justify-between border-b border-[#1c2032] pb-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Telegram</span>
                <span className="text-[11px] text-slate-500">Enviado correctamente</span>
              </div>
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Última limpieza */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-slate-400 text-[11px]">Última limpieza</span>
              <span className="text-slate-300 text-xs font-medium">{settings.nextCleanupDate}</span>
            </div>

            {/* Disclaimer text */}
            <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-[#1c2032]">
              Se conservan: cotizaciones abiertas (nuevas, contactadas o en negociación), cupones disponibles, imágenes del catálogo, precios y configuración. Si ningún canal recibe el reporte, se reintenta cada hora hasta el día 5.
            </p>
          </div>

        </div>
      </div>

      {/* Row 2: Avisos por Telegram (gratis) & Meta mensual de ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Card: Avisos por Telegram (gratis) */}
        <div className="lg:col-span-7 bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1">
            Avisos por Telegram (gratis)
          </h3>
          <p className="text-xs text-emerald-400 font-medium mb-5 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Conectado con Djdbd · bot {settings.telegramBotUsername}</span>
          </p>

          <div className="space-y-4">
            
            {/* Toggle 1: Cotizaciones y pedidos nuevos */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-200">Cotizaciones y pedidos nuevos</span>
              <button
                type="button"
                onClick={() => handleToggleTelegram('notifyNewQuotes')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.notifyNewQuotes ? 'bg-[#7c3aed]' : 'bg-[#2b3149]'
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
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-200">Carritos abandonados (30 min después)</span>
              <button
                type="button"
                onClick={() => handleToggleTelegram('notifyAbandonedCarts')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.notifyAbandonedCarts ? 'bg-[#7c3aed]' : 'bg-[#2b3149]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.notifyAbandonedCarts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Citas: nuevas, recordatorio 1 h antes */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-200">Citas: nuevas, recordatorio 1 h antes y agenda del día (8:00)</span>
              <button
                type="button"
                onClick={() => handleToggleTelegram('notifyAppointments')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.notifyAppointments ? 'bg-[#7c3aed]' : 'bg-[#2b3149]'
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

        {/* Card: Meta mensual de ventas */}
        <div className="lg:col-span-5 bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Meta mensual de ventas
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Se usa en Resumen, Ventas y en el resumen semanal
            </p>

            <form onSubmit={handleSaveSalesTarget} className="flex items-center gap-3">
              <input
                type="number"
                value={salesTargetInput}
                onChange={(e) => setSalesTargetInput(e.target.value)}
                className="w-32 bg-[#181c2b] border border-[#2a3047] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
              />
              <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
                USD por mes
              </span>
              <button
                type="submit"
                className="bg-[#6366f1] hover:bg-[#5255e3] active:scale-95 text-white font-medium text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Guardar
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1e2337] text-[11px] text-slate-500 flex items-center justify-between">
            <span>Objetivo actual: <b>${parseFloat(salesTargetInput || '0').toLocaleString()} USD</b></span>
            <span className="text-emerald-400">Activo en Resumen</span>
          </div>
        </div>

      </div>

      {/* Cloudflare Storage & Secret Architecture Guide Card */}
      <div className="bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
          <Cloud className="w-5 h-5 text-purple-400" />
          <span>Configuración de Almacenamiento y Secretos en Cloudflare</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Box 1: Secreto de Acceso */}
          <div className="bg-[#0e111a] border border-[#23283c] p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <KeyRound className="w-4 h-4" />
              <span>1. Clave Secreta en Cloudflare</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Nombre de la variable secreta para el login:
            </p>
            <div className="bg-[#161a29] p-2 rounded border border-[#2a3049] font-mono text-purple-300 text-[11px]">
              {CLOUDFLARE_CONFIG_INFO.secretName}
            </div>
            <p className="text-[11px] text-slate-500">
              Comando: <br />
              <code className="text-slate-300">npx wrangler secret put ADMIN_PASSWORD</code>
            </p>
          </div>

          {/* Box 2: Cloudflare D1 (Datos) */}
          <div className="bg-[#0e111a] border border-[#23283c] p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Database className="w-4 h-4" />
              <span>2. Cloudflare D1 (Información)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <b>Dónde conviene almacenar datos:</b> Cotizaciones, citas, ventas, cupones, oportunidades y ajustes.
            </p>
            <div className="bg-[#161a29] p-2 rounded border border-[#2a3049] font-mono text-cyan-300 text-[11px]">
              Binding: DB (SQL Database)
            </div>
            <p className="text-[11px] text-slate-500">
              Comando: <br />
              <code className="text-slate-300">npx wrangler d1 create tortilleria-renteria-db</code>
            </p>
          </div>

          {/* Box 3: Cloudflare R2 (Imágenes) */}
          <div className="bg-[#0e111a] border border-[#23283c] p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <HardDrive className="w-4 h-4" />
              <span>3. Cloudflare R2 (Imágenes)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <b>Dónde conviene almacenar imágenes:</b> Fotos de máquinas pesadas en alta resolución y PDFs (Cero costo de egress).
            </p>
            <div className="bg-[#161a29] p-2 rounded border border-[#2a3049] font-mono text-amber-300 text-[11px]">
              Binding: MEDIA_BUCKET (R2)
            </div>
            <p className="text-[11px] text-slate-500">
              Comando: <br />
              <code className="text-slate-300">npx wrangler r2 bucket create tortilleria-renteria-media</code>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
