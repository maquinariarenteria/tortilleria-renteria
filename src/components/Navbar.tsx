import React from 'react';
import { ShoppingCart, Globe } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  currency: 'USD' | 'MXN';
  onToggleCurrency: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  currency,
  onToggleCurrency,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand: MAQUINARIA RENTERIA */}
        <a href="#" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/images/logo.png"
            alt="Maquinaria Renteria Logo"
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-xs sm:text-base md:text-lg tracking-wider text-slate-900 uppercase leading-tight">
              MAQUINARIA <span className="text-[#2563eb]">RENTERIA</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden xs:block">
              El motor de tu tortillería
            </span>
          </div>
        </a>

        {/* Minimal Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase text-slate-600">
          <a href="#" className="text-[#2563eb]">Inicio</a>
          <a href="#catalog-section" className="hover:text-slate-900 transition">Catálogo</a>
          <a href="#contact-section" className="hover:text-slate-900 transition">Contacto</a>
        </nav>

        {/* Actions: Currency & Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleCurrency}
            className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 sm:px-3 py-1.5 rounded transition"
          >
            <Globe size={12} className="text-[#2563eb]" />
            <span>{currency === 'USD' ? 'USD' : 'MXN'}</span>
          </button>

          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 bg-[#0f172a] hover:bg-black text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded text-[11px] sm:text-xs font-bold uppercase transition active:scale-95 shadow-sm"
          >
            <ShoppingCart size={14} className="text-[#2563eb]" />
            <span className="hidden xs:inline">Carrito</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#2563eb] text-white text-[10px] font-black rounded-full animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
