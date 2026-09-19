import React, { useState } from 'react';
import { CartItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { X, Trash2, Plus, Minus, MessageCircle, Printer, ShoppingBag } from 'lucide-react';

interface QuoteCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: 'USD' | 'MXN';
  onUpdateQuantity: (machineId: string, delta: number) => void;
  onRemoveItem: (machineId: string) => void;
  onClearCart: () => void;
}

export const QuoteCartDrawer: React.FC<QuoteCartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');

  if (!isOpen) return null;

  const total = items.reduce((acc, item) => {
    const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
    return acc + price * item.quantity;
  }, 0);

  const handleWhatsAppSend = () => {
    let msg = `Hola Maquinaria Renteria, confirmo mi pedido:\n\n`;
    if (clientName) msg += `Cliente: ${clientName}\n`;
    if (clientPhone) msg += `Tel: ${clientPhone}\n`;
    if (clientCity) msg += `Ciudad: ${clientCity}\n\n`;

    items.forEach((item, idx) => {
      const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
      msg += `${idx + 1}. ${item.machine.name} x${item.quantity} (${formatCurrency(price * item.quantity, currency)})\n`;
    });

    msg += `\n*Nota: Maquinaria sobre pedido (+ gastos de envío a convenir).*`;
    msg += `\nTotal estimado: ${formatCurrency(total, currency)}`;
    window.open(`https://wa.me/526391141084?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrintQuote = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white text-slate-900 shadow-2xl flex flex-col justify-between animate-slideLeft">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={22} className="text-[#2563eb]" />
              <h2 className="font-black text-lg uppercase tracking-wide text-slate-900">
                Carrito ({items.length})
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body: Summarized & Bigger Font */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-base font-bold uppercase text-slate-600">Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-xs uppercase font-bold text-slate-400 pb-1 border-b border-slate-100">
                  <span>Productos:</span>
                  <button onClick={onClearCart} className="hover:text-red-500">
                    Vaciar todo
                  </button>
                </div>

                {items.map((item) => {
                  const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
                  return (
                    <div
                      key={item.machine.id}
                      className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          {item.machine.imageUrl && (
                            <img
                              src={item.machine.imageUrl}
                              alt={item.machine.name}
                              className="w-12 h-12 object-contain bg-white rounded border border-slate-200 p-1 shrink-0"
                            />
                          )}
                          <div>
                            <h4 className="font-black text-slate-900 uppercase text-xs sm:text-sm leading-snug">
                              {item.machine.name}
                            </h4>
                            <span className="text-[11px] font-semibold text-[#2563eb]">
                              {item.machine.sku}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.machine.id)}
                          className="text-slate-400 hover:text-red-500 p-1 shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-slate-300">
                          <button
                            onClick={() => onUpdateQuantity(item.machine.id, -1)}
                            className="text-slate-500 hover:text-black font-bold text-sm"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-mono text-sm font-bold w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.machine.id, 1)}
                            className="text-slate-500 hover:text-black font-bold text-sm"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <span className="font-mono font-black text-slate-900 text-base">
                          {formatCurrency(price * item.quantity, currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Minimal Form: Big Clear Inputs */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-500 block">
                    Datos del Pedido:
                  </span>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded focus:border-[#2563eb] focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp de contacto"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded focus:border-[#2563eb] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Ciudad para flete"
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-300 rounded focus:border-[#2563eb] focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer: Large Total & Big Action Buttons */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[10px] font-semibold text-slate-700 leading-tight">
                🚚 <strong>Envíos a toda la República</strong> • Maquinaria fabricada sobre pedido • Precios más gastos de envío.
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-sm uppercase text-slate-600 font-bold">Total:</span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-[#2563eb]">
                  {formatCurrency(total, currency)}
                </span>
              </div>

              <button
                onClick={handleWhatsAppSend}
                className="w-full py-3.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition"
              >
                <MessageCircle size={18} />
                Pedir por WhatsApp
              </button>

              <button
                onClick={handlePrintQuote}
                className="w-full bg-white hover:bg-slate-100 text-slate-700 py-2 rounded text-xs font-bold uppercase border border-slate-300 flex items-center justify-center gap-1.5 transition"
              >
                <Printer size={15} />
                Imprimir Pedido / PDF
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
