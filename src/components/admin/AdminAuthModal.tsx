import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Key, ArrowLeft, Cloud, Terminal, CheckCircle2 } from 'lucide-react';
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
      setErrorMessage('Por favor ingresa la clave de acceso.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e]/90 backdrop-blur-md p-4 text-white">
      <div className="relative w-full max-w-md bg-[#10131d] border border-[#23283c] rounded-2xl shadow-2xl p-6 sm:p-8">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(147,51,234,0.25)]">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Panel de Administración
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Maquinaria Renteria • Acceso Protegido por Cloudflare
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                Clave Secreta de Acceso
              </span>
              <button
                type="button"
                onClick={() => setShowSecretHelp(!showSecretHelp)}
                className="text-[11px] text-purple-400 hover:text-purple-300 underline font-normal cursor-pointer"
              >
                ¿Dónde se asigna?
              </button>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave de Cloudflare..."
                className="w-full bg-[#171b29] border border-[#2c324a] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e6] hover:to-[#7c4def] active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
          <div className="mt-4 p-3.5 bg-[#141824] border border-[#2b3149] rounded-xl text-xs text-slate-300 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-purple-300 font-semibold">
              <Cloud className="w-4 h-4" />
              <span>Configuración de la Clave en Cloudflare</span>
            </div>
            <p className="text-[11px] text-slate-400">
              El nombre del secreto que debes asignar en Cloudflare es exactamente:
            </p>
            <div className="bg-[#0b0d14] px-3 py-1.5 rounded-lg border border-[#22283e] font-mono text-purple-300 text-xs flex items-center justify-between">
              <span>{CLOUDFLARE_CONFIG_INFO.secretName}</span>
              <span className="text-[10px] text-slate-500">Variable Secreta</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              En tu terminal puedes ejecutar: <br />
              <code className="text-purple-300 bg-[#0b0d14] px-1 py-0.5 rounded">npx wrangler secret put {CLOUDFLARE_CONFIG_INFO.secretName}</code>
            </p>
            <p className="text-[11px] text-slate-400">
              O en <b className="text-slate-300">Cloudflare Dashboard</b> → Tu Worker → <b className="text-slate-300">Settings</b> → <b className="text-slate-300">Variables and Secrets</b>.
            </p>
            <div className="pt-1 text-[11px] text-emerald-400 flex items-center gap-1.5 border-t border-[#22283e]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Clave provisional de desarrollo: <b>renteria2026</b></span>
            </div>
          </div>
        )}

        {/* Exit Button */}
        <div className="mt-6 pt-4 border-t border-[#1c2132] flex justify-center">
          <button
            onClick={onExit}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la tienda pública</span>
          </button>
        </div>

      </div>
    </div>
  );
};
