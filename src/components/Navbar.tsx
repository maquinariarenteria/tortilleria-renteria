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
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[#2563eb] rounded flex items-center justify-center font-black text-white text-sm transition-transform group-hover:scale-105">
            MR
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-wider text-slate-900 uppercase">
            MAQUINARIA <span className="text-[#2563eb]">RENTERIA</span>
          </span>
        </a>

        {/* Minimal Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase text-slate-600">
          <a href="#" className="text-[#2563eb]">Inicio</a>
          <a href="#catalog-section" className="hover:text-slate-900 transition">Catálogo</a>
          <a href="#contact-section" className="hover:text-slate-900 transition">Contacto</a>
        </nav>

        {/* Actions: Currency & Cart */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleCurrency}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition"
          >
            <Globe size={13} className="text-[#2563eb]" />
            <span>{currency === 'USD' ? '$ USD' : '$ MXN'}</span>
          </button>

          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-[#0f172a] hover:bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase transition active:scale-95 shadow-sm"
          >
            <ShoppingCart size={15} className="text-[#2563eb]" />
            <span>Carrito</span>
            {cartCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#2563eb] text-white text-[10px] font-black rounded-full animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
