import { useModalFocus } from '../hooks/useModalFocus';
import React, { useState, useEffect } from 'react';
import { MachineProduct, ProductVariant } from '../types';
import { formatCurrency, formatNumber, getProductPrice, getProductDiameter } from '../utils/formatters';
import { X, Check, Plus, MessageCircle, Calendar, ShieldCheck, Ruler, Layers } from 'lucide-react';
import { recordHotspotClick } from '../utils/adminStore';

interface ProductDetailModalProps {
  machine: MachineProduct | null;
  currency: 'USD' | 'MXN';
  onClose: () => void;
  onAddToCart: (machine: MachineProduct, variant?: ProductVariant) => void;
  isInCart: boolean;
  onScheduleDemo?: (machineName: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  machine,
  currency,
  onClose,
  onAddToCart,
  isInCart,
  onScheduleDemo,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [addedJustNow, setAddedJustNow] = useState(false);

  // Initialize or reset selected variant when machine changes
  useEffect(() => {
    if (machine?.variants && machine.variants.length > 0) {
      setSelectedVariant(machine.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setAddedJustNow(false);
  }, [machine]);

  const modalRef = useModalFocus(!!machine, onClose);
  if (!machine) return null;

  const currentPrice = getProductPrice(machine, selectedVariant, currency);
  const currentDiameter = getProductDiameter(machine, selectedVariant);

  const handleAddToCartClick = () => {
    onAddToCart(machine, selectedVariant || undefined);
    setAddedJustNow(true);
    setTimeout(() => setAddedJustNow(false), 2000);
  };

  const handleWhatsAppQuote = () => {
    recordHotspotClick('Cotizar por WhatsApp');

    const variantLabel = selectedVariant ? ` [Variante: ${selectedVariant.name}]` : '';

    let text = `Hola Maquinaria Renteria, me interesa cotizar:\n\n` +
      `*${machine.name}* (SKU: ${machine.sku})\n`;
    
    if (selectedVariant) {
      text += `• Variante Seleccionada: *${selectedVariant.name}*\n`;
      if (selectedVariant.diameterRange) {
        text += `• Rango de Diámetro: ${selectedVariant.diameterRange}\n`;
      }
      if (selectedVariant.capacityText) {
        text += `• Capacidad de Harina: ${selectedVariant.capacityText}\n`;
      }
    } else {
      text += `• Capacidad: ${formatNumber(machine.capacityPerHour)} tortillas/hr\n`;
      text += `• Diámetro: ${machine.diameterRange}\n`;
    }

    text += `• Inversión: ${formatCurrency(currentPrice, currency)}\n` +
      `• Costo de envío: A acordar con el vendedor según mi ciudad.\n\n` +
      `¿Tienen disponibilidad y tiempos de entrega para mi ciudad?`;

    window.open(`https://wa.me/526391141084?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-label={machine.name} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs font-sans">
      
      {/* Floating Modal Window with Scale-Up Animation */}
      <div 
        className="relative w-full max-w-xl max-h-[92vh] bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-y-auto animate-scaleUp flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-[#2563eb] uppercase tracking-wider block">
              {machine.sku}
            </span>
            <h2 className="text-lg sm:text-2xl font-black uppercase text-slate-900 line-clamp-1">
              {machine.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-5">
          
          {/* Studio Catalog Photo */}
          <div className="w-full h-56 sm:h-64 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
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
              <span className="absolute top-3 left-3 text-[10px] font-extrabold bg-[#2563eb] text-white px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider">
                {machine.badge}
              </span>
            )}
          </div>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {machine.shortDescription}
          </p>

          {/* ======================================================== */}
          {/* VARIANTS SELECTOR (FOR MIXERS AND THERMAL PRESSES)       */}
          {/* ======================================================== */}
          {machine.variants && machine.variants.length > 0 && (
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Layers size={14} className="text-[#2563eb]" />
                  {machine.category === 'prensas' 
                    ? 'Selecciona Medida de Prensa / Placas Térmicas:' 
                    : 'Selecciona Capacidad de Amasado:'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  (Elige una opción)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {machine.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const priceDiffText = variant.extraPriceMXN > 0
                    ? `+${formatCurrency(currency === 'MXN' ? variant.extraPriceMXN : variant.extraPriceUSD, currency)}`
                    : variant.fixedPriceMXN !== undefined
                    ? formatCurrency((currency === 'MXN' ? variant.fixedPriceMXN : variant.fixedPriceUSD) ?? 0, currency)
                    : 'Precio Base';

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white border-[#2563eb] ring-2 ring-[#2563eb]/20 shadow-sm'
                          : 'bg-white/80 border-slate-300 hover:border-slate-400 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-black uppercase leading-tight ${isSelected ? 'text-[#2563eb]' : 'text-slate-900'}`}>
                            {variant.name.replace('Medida ', '').replace('Capacidad ', '')}
                          </span>
                          {isSelected && <Check size={14} className="text-[#2563eb] shrink-0" />}
                        </div>

                        {variant.diameterRange && (
                          <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                            Diámetro: {variant.diameterRange}
                          </span>
                        )}
                        {variant.capacityText && (
                          <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                            {variant.capacityText.split('(')[0]}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-[#2563eb]' : 'text-slate-600'}`}>
                          {priceDiffText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedVariant?.description && (
                <p className="text-[11px] text-slate-600 italic pt-1">
                  ℹ️ {selectedVariant.description}
                </p>
              )}
            </div>
          )}

          {/* Key Specs in BIG, Summarized Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
            
            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase block">
                {machine.category === 'amasadoras-boleadoras' && selectedVariant?.name ? 'CAPACIDAD' : 'PRODUCCIÓN'}
              </span>
              <span className="text-xl sm:text-3xl font-black text-[#2563eb] block mt-0.5">
                {selectedVariant?.capacityText 
                  ? selectedVariant.name.replace('Capacidad ', '') 
                  : formatNumber(machine.capacityPerHour)}
              </span>
              <span className="text-[11px] font-semibold text-slate-600">
                {selectedVariant?.capacityText ? 'harina en polvo' : 'tortillas / hora'}
              </span>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase block">
                DIÁMETRO
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-0.5">
                {currentDiameter}
              </span>
              <span className="text-[11px] font-semibold text-slate-600">rango graduable</span>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase block">
                ENERGÍA
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 block mt-1">
                {machine.energyType}
              </span>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase block">
                FABRICACIÓN
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-700 block mt-1">
                Sobre Pedido
              </span>
            </div>

          </div>

          {/* Price Bar in Big Bold Font & Terms */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase block">
                  Precio de Inversión:
                </span>
                {selectedVariant && (
                  <span className="text-[10px] text-blue-700 font-bold uppercase">
                    Variante: {selectedVariant.name}
                  </span>
                )}
              </div>
              <span className="text-2xl sm:text-3xl font-mono font-black text-[#2563eb]">
                {formatCurrency(currentPrice, currency)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium text-right pt-1 border-t border-blue-100">
              * Costo de envío a acordar con el vendedor • +16% IVA si requiere factura CFDI
            </div>
          </div>

        </div>

        {/* Footer Big Action Buttons */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2.5 shrink-0">
          <button
            onClick={handleAddToCartClick}
            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-xs ${
              addedJustNow || isInCart 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300'
            }`}
          >
            {addedJustNow || isInCart ? <Check size={16} /> : <Plus size={16} />}
            {addedJustNow ? '¡Agregado al Carrito!' : isInCart ? 'En el Carrito (+)' : 'Agregar al Carrito'}
          </button>

          <button
            onClick={handleWhatsAppQuote}
            className="flex-1 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md active:scale-95 cursor-pointer"
          >
            <MessageCircle size={16} />
            Cotizar por WhatsApp
          </button>

          {onScheduleDemo && (
            <button
              onClick={() => {
                onClose();
                onScheduleDemo(machine.name);
              }}
              className="py-3 px-4 rounded-xl bg-blue-50 text-[#2563eb] hover:bg-blue-100 border border-blue-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Agendar demostración en planta Delicias"
            >
              <Calendar size={15} />
              <span className="hidden sm:inline">Probar en Planta</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
