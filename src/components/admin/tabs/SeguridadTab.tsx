import React, { useState } from 'react';
import { getStoredSecurityLogs, INITIAL_SECURITY_SETTINGS } from '../../../utils/adminStore';
import { SecurityAuditLog, SecuritySettings } from '../../../types/admin';
import { CLOUDFLARE_CONFIG_INFO } from '../../../services/adminService';
import { Shield, Lock, AlertTriangle, KeyRound, CheckCircle2, UserCheck, Terminal, Ban } from 'lucide-react';

export const SeguridadTab: React.FC = () => {
  const [logs, setLogs] = useState<SecurityAuditLog[]>(getStoredSecurityLogs());
  const [settings, setSettings] = useState<SecuritySettings>(INITIAL_SECURITY_SETTINGS);
  const [blockedIpInput, setBlockedIpInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleUnderAttack = () => {
    setSettings(prev => ({ ...prev, underAttackMode: !prev.underAttackMode }));
    showToast(!settings.underAttackMode ? 'Modo Bajo Ataque activado en Cloudflare.' : 'Modo Bajo Ataque desactivado.');
  };

  const handleToggleRateLimiting = () => {
    setSettings(prev => ({ ...prev, rateLimitingEnabled: !prev.rateLimitingEnabled }));
    showToast('Configuración de Rate Limiting actualizada.');
  };

  const handleAddBlockedIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedIpInput.trim()) return;
    setSettings(prev => ({
      ...prev,
      blockedIps: [blockedIpInput.trim(), ...prev.blockedIps]
    }));
    setBlockedIpInput('');
    showToast('IP bloqueada correctamente.');
  };

  const handleRemoveBlockedIp = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      blockedIps: prev.blockedIps.filter(item => item !== ip)
    }));
    showToast('IP removida de la lista de bloqueo.');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1c2237] border border-purple-500/50 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Seguridad y Control de Acceso</span>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
              Cloudflare Protected
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervisa los intentos de ingreso al panel #admin, gestiona el secreto de Cloudflare y bloquea IPs sospechosas.
          </p>
        </div>
      </div>

      {/* Row 1: Cloudflare Secret Key & Shields */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Secret Key Card */}
        <div className="lg:col-span-6 bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
            <KeyRound className="w-5 h-5 text-purple-400" />
            <span>Clave Secreta en Cloudflare ({CLOUDFLARE_CONFIG_INFO.secretName})</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            La clave para ingresar a <code className="text-purple-300">#admin</code> está protegida mediante las <b>Variables Secretas de Cloudflare Workers</b>.
          </p>

          <div className="bg-[#171b29] border border-[#272e45] p-3.5 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Nombre exacto de la variable:</span>
              <code className="text-purple-300 font-mono font-bold bg-[#0d0f17] px-2 py-0.5 rounded border border-[#252c42]">
                {CLOUDFLARE_CONFIG_INFO.secretName}
              </code>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Estado en Cloudflare:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vinculado a /api/admin/login
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1">
            <p>Para cambiar la clave en cualquier momento:</p>
            <code className="block bg-[#0e111a] text-purple-300 p-2 rounded border border-[#23293e] font-mono text-[11px]">
              npx wrangler secret put {CLOUDFLARE_CONFIG_INFO.secretName}
            </code>
          </div>
        </div>

        {/* Protection Toggles */}
        <div className="lg:col-span-6 bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm mb-4">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>Escudos de Protección Activos</span>
            </div>

            <div className="space-y-4">
              
              {/* Toggle 1: Under Attack Mode */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs text-white font-semibold block">Modo Bajo Ataque (Cloudflare DDoS)</span>
                  <span className="text-[11px] text-slate-400">Desafía automáticamente a navegadores sospechosos antes de cargar la web.</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleUnderAttack}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ml-3 ${
                    settings.underAttackMode ? 'bg-[#7c3aed]' : 'bg-[#2b3149]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.underAttackMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Rate Limiting */}
              <div className="flex items-center justify-between py-1 border-t border-[#1d2235] pt-3">
                <div>
                  <span className="text-xs text-white font-semibold block">Límite de Tasa (Rate Limiting en #admin)</span>
                  <span className="text-[11px] text-slate-400">Bloquea temporalmente IPs con más de 5 intentos fallidos consecutivos.</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRateLimiting}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ml-3 ${
                    settings.rateLimitingEnabled ? 'bg-[#7c3aed]' : 'bg-[#2b3149]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.rateLimitingEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          <div className="pt-3 border-t border-[#1c2032] flex justify-between items-center text-[11px] text-slate-400">
            <span>Sesión activa en este navegador</span>
            <button
              onClick={() => {
                localStorage.removeItem('mr_admin_auth_v1');
                window.location.hash = '';
                window.location.reload();
              }}
              className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
            >
              Cerrar sesión en todos lados
            </button>
          </div>
        </div>

      </div>

      {/* Row 2: Blocked IPs & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Blocked IPs */}
        <div className="lg:col-span-5 bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-400" />
            <span>IPs Bloqueadas ({settings.blockedIps.length})</span>
          </h3>

          <form onSubmit={handleAddBlockedIp} className="flex gap-2">
            <input
              type="text"
              value={blockedIpInput}
              onChange={(e) => setBlockedIpInput(e.target.value)}
              placeholder="Ej. 192.168.1.1"
              className="flex-1 bg-[#171b29] border border-[#272e45] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
            />
            <button
              type="submit"
              className="bg-rose-900/50 hover:bg-rose-900 text-rose-200 border border-rose-700/50 text-xs px-3 py-1.5 rounded-lg transition-colors font-semibold cursor-pointer"
            >
              Bloquear
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {settings.blockedIps.map((ip) => (
              <div
                key={ip}
                className="bg-[#171b29] border border-[#272e45] p-2 rounded-lg flex items-center justify-between text-xs font-mono text-slate-300"
              >
                <span>{ip}</span>
                <button
                  onClick={() => handleRemoveBlockedIp(ip)}
                  className="text-slate-500 hover:text-white text-[11px] cursor-pointer"
                >
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log */}
        <div className="lg:col-span-7 bg-[#121520] border border-[#202538] rounded-xl p-5 md:p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-400" />
            <span>Registro de Auditoría de Accesos</span>
          </h3>

          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-[#171b29] border border-[#252c42] p-3 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{log.action}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                      log.status === 'Permitido' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {log.ipAddress} · {log.location}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
