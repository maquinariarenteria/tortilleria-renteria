import React from 'react';
import { MachineProduct } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { X, Check, Plus, MessageCircle } from 'lucide-react';

interface ProductDetailModalProps {
  machine: MachineProduct | null;
  currency: 'USD' | 'MXN';
  onClose: () => void;
  onAddToCart: (machine: MachineProduct) => void;
  isInCart: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  machine,
  currency,
  onClose,
  onAddToCart,
  isInCart,
}) => {
  if (!machine) return null;

  const price = currency === 'MXN' ? machine.priceMXN : machine.priceUSD;

  const handleWhatsAppQuote = () => {
    const text = encodeURIComponent(
      `Hola Maquinaria Renteria, me interesa cotizar:\n\n` +
      `*${machine.name}* (SKU: ${machine.sku})\n` +
      `• Capacidad: ${formatNumber(machine.capacityPerHour)} tortillas/hr\n` +
      `• Inversión: ${formatCurrency(price, currency)}\n\n` +
      `¿Tienen entrega disponible para mi ciudad?`
    );
    window.open(`https://wa.me/526391141084?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      
      {/* Floating Modal Window with Scale-Up Animation */}
      <div 
        className="relative w-full max-w-xl max-h-[90vh] bg-white text-slate-900 rounded-xl border border-slate-200 shadow-2xl overflow-y-auto animate-scaleUp flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-xs font-bold text-[#2563eb] uppercase tracking-wider block">
              {machine.sku}
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-900">
              {machine.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Summarized, Big, High-Legibility Typography */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Studio Catalog Photo */}
          <div className="w-full h-64 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
            {machine.imageUrl ? (
              <img
                src={machine.imageUrl}
                alt={machine.name}
                className="w-full h-full object-contain object-center"
              />
            ) : (
              <span className="font-mono text-sm text-slate-400">[{machine.sku}]</span>
            )}

            {machine.badge && (
              <span className="absolute top-3 left-3 text-[10px] font-extrabold bg-[#2563eb] text-white px-2.5 py-1 rounded shadow-xs uppercase tracking-wider">
                {machine.badge}
              </span>
            )}
          </div>

          {/* Short Description */}
          <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
            {machine.shortDescription}
          </p>

          {/* Key Specs in BIG, Summarized Cards */}
          <div className="grid grid-cols-2 gap-4 text-center">
            
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase block">
                CAPACIDAD
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#2563eb] block mt-0.5">
                {formatNumber(machine.capacityPerHour)}
              </span>
              <span className="text-xs font-semibold text-slate-600">tortillas / hora</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase block">
                DIÁMETRO
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-0.5">
                {machine.diameterRange.split(' ')[0]} - {machine.diameterRange.split(' ')[3] || '28cm'}
              </span>
              <span className="text-xs font-semibold text-slate-600">rango ajustable</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase block">
                ENERGÍA
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-900 block mt-1">
                {machine.energyType}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase block">
                FABRICACIÓN
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-700 block mt-1">
                Sobre Pedido
              </span>
            </div>

          </div>

          {/* Price Bar in Big Bold Font & Terms */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 uppercase">
                Precio de Lista:
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-[#2563eb]">
                {formatCurrency(price, currency)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium text-right">
              * Más gastos de envío • +16% IVA si requiere factura • Envíos a toda la República
            </div>
          </div>

        </div>

        {/* Footer Big Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onAddToCart(machine)}
            className={`flex-1 py-3.5 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              isInCart 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300'
            }`}
          >
            {isInCart ? <Check size={18} /> : <Plus size={18} />}
            {isInCart ? 'Agregado al Carrito' : 'Agregar al Carrito'}
          </button>

          <button
            onClick={handleWhatsAppQuote}
            className="flex-1 py-3.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md"
          >
            <MessageCircle size={18} />
            Cotizar por WhatsApp
          </button>
        </div>

      </div>
    </div>
  );
};
