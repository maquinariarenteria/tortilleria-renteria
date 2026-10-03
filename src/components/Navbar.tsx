import React from 'react';
import { ShoppingCart, Globe, Calendar } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  currency: 'USD' | 'MXN';
  onToggleCurrency: () => void;
  onOpenAppointment?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  currency,
  onToggleCurrency,
  onOpenAppointment,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#070e22] text-white shadow-xl border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        
        {/* Brand: MAQUINARIA RENTERIA Official Gold Logo */}
        <a href="#" className="flex items-center gap-3 group shrink-0" title="Maquinaria Rentería - Inicio">
          <img
            src="/images/logo_gold_transparent.png"
            alt="Maquinaria Rentería"
            className="h-11 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_2px_12px_rgba(234,179,8,0.25)]"
          />
        </a>

        {/* Minimal Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-300">
          <a href="#" className="text-amber-400 hover:text-amber-300 transition-colors">
            Inicio
          </a>
          <a href="#catalog-section" className="hover:text-white transition-colors">
            Catálogo
          </a>
          {onOpenAppointment && (
            <button
              onClick={onOpenAppointment}
              className="hover:text-amber-400 transition-colors uppercase cursor-pointer"
            >
              Agendar Cita
            </button>
          )}
          <a href="#contact-section" className="hover:text-white transition-colors">
            Contacto
          </a>
        </nav>

        {/* Actions: Currency, Appointment & Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenAppointment && (
            <button
              onClick={onOpenAppointment}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Calendar size={14} className="text-slate-950" />
              <span>Agendar Cita</span>
            </button>
          )}

          <button
            onClick={onToggleCurrency}
            className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition cursor-pointer shadow-2xs"
            title="Cambiar divisa"
          >
            <Globe size={13} className="text-amber-400" />
            <span className="font-mono">{currency === 'USD' ? 'USD' : 'MXN'}</span>
          </button>

          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase transition active:scale-95 shadow-md shadow-blue-500/30 cursor-pointer"
            title="Ver carrito de compras"
          >
            <ShoppingCart size={15} className="text-white" />
            <span className="hidden xs:inline tracking-wider">Carrito</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full animate-bounce shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
