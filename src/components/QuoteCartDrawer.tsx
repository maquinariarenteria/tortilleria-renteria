import React, { useState, useMemo, useEffect } from 'react';
import { CartItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { estimateShippingByCP, ShippingQuote } from '../utils/shippingCalculator';
import { sendOrderNotificationEmail } from '../utils/emailService';
import { getSiteConfig } from '../utils/adminStore';
import { 
  X, Trash2, Plus, Minus, MessageCircle, ShoppingBag, 
  CreditCard, CheckCircle2, Truck, ExternalLink
} from 'lucide-react';

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
  const config = getSiteConfig();

  // Minimal form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCP, setClientCP] = useState('');
  
  // Factura toggle
  const [requiresFactura, setRequiresFactura] = useState(false);
  const [clientRFC, setClientRFC] = useState('');

  // Status state
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
      return acc + price * item.quantity;
    }, 0);
  }, [items, currency]);

  // Shipping calculation based on CP
  const autoShippingQuote: ShippingQuote | null = useMemo(() => {
    return estimateShippingByCP(clientCP, items);
  }, [clientCP, items]);

  const shippingCost = autoShippingQuote?.estimatedCostMXN || 0;

  // 16% IVA calculation
  const ivaAmount = requiresFactura ? Math.round(subtotal * 0.16) : 0;

  // Total
  const grandTotal = subtotal + ivaAmount + shippingCost;

  if (!isOpen) return null;

  // Helper to record and email order
  const processOrder = async (method: 'card_stripe' | 'spei_transfer') => {
    const folio = `MR-${Date.now().toString().slice(-6)}`;
    const orderData = {
      folio,
      createdAt: new Date().toISOString(),
      clientName: clientName.trim() || 'Cliente Web',
      clientPhone: clientPhone.trim() || 'No especificado',
      clientEmail: clientEmail.trim() || '',
      clientAddress: autoShippingQuote ? `${autoShippingQuote.city}, ${autoShippingQuote.state}` : 'México',
      clientCP: clientCP.trim() || 'Sin CP',
      requiresFactura,
      clientRFC: requiresFactura ? clientRFC : undefined,
      items: items.map((i) => ({
        id: i.machine.id,
        name: i.machine.name,
        sku: i.machine.sku,
        quantity: i.quantity,
        price: currency === 'MXN' ? i.machine.priceMXN : i.machine.priceUSD,
        imageUrl: i.machine.imageUrl,
      })),
      subtotal,
      iva: ivaAmount,
      shippingCost,
      total: grandTotal,
      paymentMethod: method,
      status: 'Pendiente' as const,
    };

    // Dispatch email automatically in background & record in admin
    await sendOrderNotificationEmail({ order: orderData, currency });
    return folio;
  };

  // 1. WhatsApp Checkout
  const handleBuyWhatsApp = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    const folio = await processOrder('spei_transfer');

    let msg = `*NUEVO PEDIDO - MAQUINARIA RENTERIA*\n`;
    msg += `Folio: #${folio}\n\n`;
    msg += `*CLIENTE:* ${clientName || 'Cliente'}\n`;
    msg += `*TEL:* ${clientPhone || 'No indicado'}\n`;
    if (clientEmail) msg += `*CORREO:* ${clientEmail}\n`;
    if (clientCP) msg += `*C.P.:* ${clientCP} (${autoShippingQuote?.state || 'México'})\n\n`;

    msg += `*MÁQUINAS:*\n`;
    items.forEach((item, idx) => {
      const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
      msg += `${idx + 1}. ${item.machine.name} x${item.quantity} = ${formatCurrency(price * item.quantity, currency)}\n`;
    });

    msg += `\nSubtotal: ${formatCurrency(subtotal, currency)}\n`;
    if (requiresFactura) {
      msg += `IVA (16% Factura): ${formatCurrency(ivaAmount, currency)} (RFC: ${clientRFC || 'General'})\n`;
    }
    if (shippingCost > 0) {
      msg += `Envío (Castores/Tres Guerras): ${formatCurrency(shippingCost, currency)}\n`;
    }
    msg += `*TOTAL: ${formatCurrency(grandTotal, currency)}*\n`;

    setIsProcessing(false);
    setOrderConfirmed(true);

    const waPhone = config.phone1.replace(/\D/g, '') || '526391141084';
    window.open(`https://wa.me/52${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 2. Stripe Card Checkout
  const handlePayStripe = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    await processOrder('card_stripe');

    setIsProcessing(false);
    setOrderConfirmed(true);

    // Open Stripe Payment link configured by user
    const link = config.stripePaymentLink || 'https://buy.stripe.com/maquinariarenteria';
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Shell (Clamped to viewport) */}
      <div className="fixed inset-y-0 right-0 w-full max-w-full flex justify-end pointer-events-none">
        <div className="pointer-events-auto w-full max-w-full sm:max-w-md bg-white text-slate-900 shadow-2xl flex flex-col h-full max-h-[100dvh] overflow-hidden animate-slideLeft">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#2563eb]" />
              <h2 className="font-black text-base uppercase tracking-wide text-slate-900">
                Tu Carrito ({items.length})
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              aria-label="Cerrar Carrito"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 overscroll-contain">
            {items.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <ShoppingBag size={44} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold uppercase text-slate-600">Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                {/* 1. Compact Product List */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[11px] uppercase font-bold text-slate-400 pb-1 border-b border-slate-100">
                    <span>Máquinas</span>
                    <button onClick={onClearCart} className="hover:text-red-500">
                      Vaciar
                    </button>
                  </div>

                  {items.map((item) => {
                    const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
                    return (
                      <div
                        key={item.machine.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.machine.imageUrl && (
                            <img
                              src={item.machine.imageUrl}
                              alt={item.machine.name}
                              className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200 p-1 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 uppercase text-xs truncate">
                              {item.machine.name}
                            </h4>
                            <span className="font-mono font-bold text-[#2563eb] text-xs block">
                              {formatCurrency(price, currency)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-white rounded-lg border border-slate-300">
                            <button
                              onClick={() => onUpdateQuantity(item.machine.id, -1)}
                              className="p-1 text-slate-500 hover:text-black"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-mono text-xs font-bold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.machine.id, 1)}
                              className="p-1 text-slate-500 hover:text-black"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.machine.id)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Direct Minimalist Contact Fields */}
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-black uppercase text-slate-700 block">
                    Tus Datos para el Pedido:
                  </span>

                  <input
                    type="text"
                    placeholder="Tu Nombre completo *"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="tel"
                      placeholder="WhatsApp (10 dígitos) *"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                    />

                    <input
                      type="text"
                      maxLength={5}
                      placeholder="C.P. de Entrega (5 dígitos) *"
                      value={clientCP}
                      onChange={(e) => setClientCP(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Correo Electrónico (para tu comprobante) *"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                  />

                  {/* Clean 1-Line Shipping Quote */}
                  {autoShippingQuote && autoShippingQuote.isValid && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Truck size={14} className="text-[#2563eb]" />
                        <span>Envío a {autoShippingQuote.state}:</span>
                      </span>
                      <span className="font-mono font-black text-[#2563eb]">
                        {formatCurrency(shippingCost, currency)}
                      </span>
                    </div>
                  )}

                  {/* Clean 1-Line Factura Toggle */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={requiresFactura}
                        onChange={(e) => setRequiresFactura(e.target.checked)}
                        className="w-4 h-4 text-[#2563eb] rounded accent-[#2563eb]"
                      />
                      <span className="font-bold">¿Requiere Factura? (+16% IVA)</span>
                    </label>

                    {requiresFactura && (
                      <input
                        type="text"
                        placeholder="RFC para factura"
                        value={clientRFC}
                        onChange={(e) => setClientRFC(e.target.value.toUpperCase())}
                        className="mt-2 w-full p-2 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer: Clean Total & 2 Big Action Buttons */}
          {items.length > 0 && (
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              
              {/* Clean Financial Lines */}
              <div className="space-y-1 text-xs text-slate-600 border-b border-slate-200 pb-2.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(subtotal, currency)}</span>
                </div>

                {shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span className="font-mono font-bold text-slate-900">+{formatCurrency(shippingCost, currency)}</span>
                  </div>
                )}

                {requiresFactura && (
                  <div className="flex justify-between">
                    <span>IVA (16%):</span>
                    <span className="font-mono font-bold text-slate-900">+{formatCurrency(ivaAmount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200 text-sm">
                  <span className="font-black uppercase text-slate-900">Total:</span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-[#2563eb]">
                    {formatCurrency(grandTotal, currency)}
                  </span>
                </div>
              </div>

              {/* 2 Clear, Big Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleBuyWhatsApp}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-98"
                >
                  <MessageCircle size={18} />
                  <span>Comprar por WhatsApp</span>
                </button>

                <button
                  onClick={handlePayStripe}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <CreditCard size={15} />
                  <span>Pagar con Tarjeta (Stripe)</span>
                  <ExternalLink size={12} />
                </button>
              </div>

              {orderConfirmed && (
                <div className="bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>¡Pedido registrado y enviado a tu correo!</span>
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-center">
                Maquinaria sobre pedido • Envíos a toda la República Mexicana
              </p>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
