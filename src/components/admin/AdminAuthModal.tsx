import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Key, ArrowLeft, Cloud, CheckCircle2 } from 'lucide-react';
import { AdminService, CLOUDFLARE_CONFIG_INFO } from '../../services/adminService';

interface AdminAuthModalProps {
  onSuccess: () => void;
  onExit: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ onSuccess, onExit }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSecretHelp, setShowSecretHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Por favor ingresa tu clave de acceso.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await AdminService.login(password);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Clave de acceso incorrecta.');
      }
    } catch (err: any) {
      setErrorMessage('Error al verificar la clave: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 font-sans">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-900">
        
        {/* Header with Official Logo */}
        <div className="flex justify-center mb-4">
          <div className="bg-[#070e22] rounded-2xl border border-slate-800 px-5 py-2.5 flex items-center justify-center shadow-md">
            <img
              src="/images/logo_gold_transparent.png"
              alt="Maquinaria Renteria"
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
            MAQUINARIA <span className="text-[#2563eb]">RENTERIA</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            PANEL DE ADMINISTRACIÓN • ACCESO SEGURO
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#2563eb]" />
                Clave Secreta de Cloudflare
              </span>
              <button
                type="button"
                onClick={() => setShowSecretHelp(!showSecretHelp)}
                className="text-[11px] text-[#2563eb] hover:text-[#1d4ed8] underline font-semibold cursor-pointer lowercase"
              >
                ¿dónde se asigna?
              </button>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave de acceso..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Verificando con Cloudflare...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Ingresar al Administrador</span>
              </>
            )}
          </button>
        </form>

        {/* Cloudflare Secret Help Box */}
        {showSecretHelp && (
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-[#2563eb] font-bold">
              <Cloud className="w-4 h-4" />
              <span>Configuración de la Clave en Cloudflare</span>
            </div>
            <p className="text-[11px] text-slate-600">
              El nombre del secreto que debes asignar en Cloudflare es:
            </p>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-[#2563eb] font-bold text-xs flex items-center justify-between">
              <span>{CLOUDFLARE_CONFIG_INFO.secretName}</span>
              <span className="text-[10px] text-slate-400 font-sans">Variable Secreta</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              En tu terminal puedes ejecutar: <br />
              <code className="text-[#2563eb] bg-blue-50 px-1 py-0.5 rounded font-mono">npx wrangler secret put {CLOUDFLARE_CONFIG_INFO.secretName}</code>
            </p>
            <div className="pt-1 text-[11px] text-emerald-700 flex items-center gap-1.5 border-t border-slate-200 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clave provisional de desarrollo: <b>renteria2026</b></span>
            </div>
          </div>
        )}

        {/* Exit Button */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
          <button
            onClick={onExit}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la tienda pública</span>
          </button>
        </div>

      </div>
    </div>
  );
};
