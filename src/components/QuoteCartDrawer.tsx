import React, { useState, useMemo } from 'react';
import { CartItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { estimateShippingByCP, ShippingQuote } from '../utils/shippingCalculator';
import { 
  X, Trash2, Plus, Minus, MessageCircle, Printer, ShoppingBag, 
  CreditCard, Send, CheckCircle2, FileText, Truck, MapPin, Mail, 
  HelpCircle, ExternalLink, ShieldCheck, DollarSign
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
  // Customer info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCP, setClientCP] = useState('');
  
  // Factura & IVA
  const [requiresFactura, setRequiresFactura] = useState(false);
  const [clientRFC, setClientRFC] = useState('');
  const [clientRazonSocial, setClientRazonSocial] = useState('');

  // Shipping manual override
  const [isManualShipping, setIsManualShipping] = useState(false);
  const [manualShippingCost, setManualShippingCost] = useState<number>(0);

  // Payment method & Stripe link
  const [paymentMethod, setPaymentMethod] = useState<'card_stripe' | 'spei_transfer'>('card_stripe');
  const [customStripeLink, setCustomStripeLink] = useState('https://buy.stripe.com/maquinariarenteria');
  const [isEditingStripeLink, setIsEditingStripeLink] = useState(false);

  // State for order confirmation modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
      return acc + price * item.quantity;
    }, 0);
  }, [items, currency]);

  // Shipping calculation
  const autoShippingQuote: ShippingQuote | null = useMemo(() => {
    return estimateShippingByCP(clientCP, items);
  }, [clientCP, items]);

  const effectiveShippingCost = useMemo(() => {
    if (isManualShipping) {
      return manualShippingCost;
    }
    if (autoShippingQuote && autoShippingQuote.isValid) {
      return autoShippingQuote.estimatedCostMXN;
    }
    return 0;
  }, [isManualShipping, manualShippingCost, autoShippingQuote]);

  // 16% IVA calculation (only if requiresFactura is true)
  const ivaAmount = useMemo(() => {
    if (!requiresFactura) return 0;
    return Math.round(subtotal * 0.16);
  }, [subtotal, requiresFactura]);

  // Total
  const grandTotal = subtotal + ivaAmount + effectiveShippingCost;

  // Generate order folio
  const orderFolio = useMemo(() => {
    return `MR-${Date.now().toString().slice(-6)}`;
  }, []);

  if (!isOpen) return null;

  // Send WhatsApp order breakdown
  const handleWhatsAppSend = () => {
    let msg = `*CONFIRMACIÓN DE PEDIDO - MAQUINARIA RENTERIA*\n`;
    msg += `Folio: #${orderFolio}\n`;
    msg += `Fecha: ${new Date().toLocaleDateString('es-MX')}\n\n`;

    msg += `*DATOS DEL CLIENTE:*\n`;
    msg += `• Nombre: ${clientName || 'Por definir'}\n`;
    msg += `• WhatsApp: ${clientPhone || 'No especificado'}\n`;
    if (clientEmail) msg += `• Correo: ${clientEmail}\n`;
    if (clientCP) msg += `• Código Postal: ${clientCP} (${autoShippingQuote?.state || 'México'})\n`;
    if (clientAddress) msg += `• Dirección de Entrega: ${clientAddress}\n\n`;

    msg += `*MAQUINARIA SOLICITADA:*\n`;
    items.forEach((item, idx) => {
      const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
      msg += `${idx + 1}. *${item.machine.name}* (SKU: ${item.machine.sku})\n`;
      msg += `   Cantidad: ${item.quantity} | Unitario: ${formatCurrency(price, currency)} | Subtotal: ${formatCurrency(price * item.quantity, currency)}\n`;
    });

    msg += `\n*RESUMEN FINANCIERO:*\n`;
    msg += `• Subtotal Maquinaria: ${formatCurrency(subtotal, currency)}\n`;
    if (requiresFactura) {
      msg += `• IVA (16% Facturación CFDI): ${formatCurrency(ivaAmount, currency)} (RFC: ${clientRFC || 'General'})\n`;
    } else {
      msg += `• Factura Fiscal (IVA 16%): No solicitada ($0.00)\n`;
    }

    if (effectiveShippingCost > 0) {
      msg += `• Envío Flete Consolidado (CP ${clientCP || 'N/A'}): ${formatCurrency(effectiveShippingCost, currency)} (${autoShippingQuote?.carrier || 'Castores/Tres Guerras'})\n`;
    } else {
      msg += `• Envío: Por acordar o recolección en Delicias, Chih.\n`;
    }

    msg += `\n*TOTAL A PAGAR: ${formatCurrency(grandTotal, currency)}*\n\n`;

    if (paymentMethod === 'card_stripe') {
      msg += `*MÉTODO DE PAGO:* Pago con Tarjeta / Stripe\n`;
      msg += `Enlace de pago: ${customStripeLink}\n`;
    } else {
      msg += `*MÉTODO DE PAGO:* Transferencia SPEI / Depósito Bancario\n`;
    }

    msg += `\n_Toda la maquinaria es sobre pedido. Envíos a toda la República Mexicana._`;

    window.open(`https://wa.me/526391141084?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Send Order Receipt via Email
  const handleEmailSend = () => {
    const subject = encodeURIComponent(`Nuevo Pedido Oficial #${orderFolio} - Maquinaria Renteria`);
    let body = `PEDIDO OFICIAL MAQUINARIA RENTERIA\n`;
    body += `Folio: #${orderFolio}\n\n`;
    body += `DATOS DEL CLIENTE:\n`;
    body += `Nombre: ${clientName || 'Cliente'}\n`;
    body += `Teléfono: ${clientPhone || 'No especificado'}\n`;
    body += `Correo: ${clientEmail || 'No especificado'}\n`;
    body += `CP / Ciudad: ${clientCP} - ${autoShippingQuote?.city || ''}, ${autoShippingQuote?.state || ''}\n`;
    body += `Dirección: ${clientAddress || 'Por confirmar'}\n\n`;
    
    if (requiresFactura) {
      body += `FACTURACIÓN SOLICITADA:\n`;
      body += `RFC: ${clientRFC || 'Pendiente'}\n`;
      body += `Razón Social: ${clientRazonSocial || 'Pendiente'}\n\n`;
    }

    body += `PRODUCTOS:\n`;
    items.forEach((item, idx) => {
      const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
      body += `${idx + 1}. ${item.machine.name} (SKU: ${item.machine.sku}) x${item.quantity} = ${formatCurrency(price * item.quantity, currency)}\n`;
    });

    body += `\nDESGLOSE:\n`;
    body += `Subtotal: ${formatCurrency(subtotal, currency)}\n`;
    body += `IVA 16%: ${requiresFactura ? formatCurrency(ivaAmount, currency) : '$0.00 (Sin factura)'}\n`;
    body += `Envío estimado: ${formatCurrency(effectiveShippingCost, currency)}\n`;
    body += `TOTAL: ${formatCurrency(grandTotal, currency)}\n\n`;

    body += `MÉTODO DE PAGO: ${paymentMethod === 'card_stripe' ? 'Tarjeta (Stripe)' : 'Transferencia SPEI'}\n`;
    if (paymentMethod === 'card_stripe') {
      body += `Link de pago: ${customStripeLink}\n`;
    }

    const mailtoUrl = `mailto:maquinariarenteria17@gmail.com?cc=${encodeURIComponent(clientEmail)}&subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setOrderSentSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-white text-slate-900 shadow-2xl flex flex-col justify-between animate-slideLeft">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-black text-sm">
                MR
              </div>
              <div>
                <h2 className="font-black text-base sm:text-lg uppercase tracking-wide text-slate-900">
                  Carrito & Cotizador
                </h2>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  {items.length} {items.length === 1 ? 'Máquina' : 'Máquinas'} en pedido
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
              aria-label="Cerrar Carrito"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {items.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <ShoppingBag size={48} className="mx-auto text-slate-300" />
                <p className="text-base font-bold uppercase text-slate-600">Tu carrito está vacío</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Agrega maquinaria desde el catálogo para calcular flete, factura y realizar tu pedido.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Itemized list */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs uppercase font-bold text-slate-500 pb-1 border-b border-slate-100">
                    <span>Máquinas Seleccionadas:</span>
                    <button 
                      onClick={onClearCart} 
                      className="text-red-500 hover:text-red-700 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      Vaciar todo
                    </button>
                  </div>

                  {items.map((item) => {
                    const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
                    return (
                      <div
                        key={item.machine.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-3">
                            {item.machine.imageUrl && (
                              <img
                                src={item.machine.imageUrl}
                                alt={item.machine.name}
                                className="w-14 h-14 object-contain bg-white rounded-lg border border-slate-200 p-1 shrink-0"
                              />
                            )}
                            <div>
                              <h4 className="font-bold text-slate-900 uppercase text-xs sm:text-sm leading-snug">
                                {item.machine.name}
                              </h4>
                              <span className="text-[10px] font-bold text-[#2563eb] block">
                                {item.machine.sku} • {item.machine.energyType}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Peso aprox: {item.machine.weightKg || 85} kg
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.machine.id)}
                            className="text-slate-400 hover:text-red-500 p-1 shrink-0"
                            title="Eliminar del carrito"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-300">
                            <button
                              onClick={() => onUpdateQuantity(item.machine.id, -1)}
                              className="text-slate-500 hover:text-black font-bold text-xs p-0.5"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="font-mono text-xs font-black w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.machine.id, 1)}
                              className="text-slate-500 hover:text-black font-bold text-xs p-0.5"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
                              {formatCurrency(price * item.quantity, currency)}
                            </span>
                            <span className="text-[9px] text-slate-400 block">+ envío e IVA</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Mexican Postal Code (CP) Freight Shipping Estimator */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-blue-900">
                      <Truck size={16} className="text-[#2563eb]" />
                      <span>Cotizador de Envío por Código Postal:</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Envíos a todo México
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MapPin size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="Ingresa tu C.P. (5 dígitos)"
                        value={clientCP}
                        onChange={(e) => setClientCP(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-mono font-bold bg-white border border-blue-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsManualShipping(!isManualShipping)}
                      className="px-2.5 py-1.5 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-[10px] font-bold uppercase transition"
                    >
                      {isManualShipping ? 'Cálculo Auto' : 'Ajustar Tarifa'}
                    </button>
                  </div>

                  {/* Automatic shipping quote response */}
                  {autoShippingQuote && autoShippingQuote.isValid && !isManualShipping && (
                    <div className="bg-white p-2.5 rounded-lg border border-blue-200 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">
                          📍 {autoShippingQuote.state} ({autoShippingQuote.city})
                        </span>
                        <span className="font-mono font-black text-[#2563eb]">
                          {formatCurrency(autoShippingQuote.estimatedCostMXN, currency)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        {autoShippingQuote.breakdownNote}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Paquetería: {autoShippingQuote.carrier}</span>
                        <span className="font-semibold text-emerald-700">⏱ {autoShippingQuote.deliveryTime}</span>
                      </div>
                    </div>
                  )}

                  {/* Manual shipping cost adjustment */}
                  {isManualShipping && (
                    <div className="bg-white p-2.5 rounded-lg border border-blue-300 text-xs space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                        <span>Costo de Envío Manual Acordado:</span>
                        <span className="font-mono text-[#2563eb] font-bold">
                          {formatCurrency(manualShippingCost, currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">$ MXN:</span>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={manualShippingCost}
                          onChange={(e) => setManualShippingCost(Math.max(0, Number(e.target.value)))}
                          className="flex-1 p-1.5 text-xs font-mono font-bold border border-slate-300 rounded focus:border-[#2563eb] focus:outline-none"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Ingresa $0 si el cliente recoge directamente en taller (Delicias, Chihuahua).
                      </span>
                    </div>
                  )}

                  {!autoShippingQuote && clientCP.length === 5 && !isManualShipping && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      Código Postal no identificado. Puedes activar "Ajustar Tarifa" para fijar el costo de envío convenido.
                    </p>
                  )}
                </div>

                {/* 3. Factura Fiscal (16% IVA) Toggle */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={requiresFactura}
                      onChange={(e) => setRequiresFactura(e.target.checked)}
                      className="w-4 h-4 text-[#2563eb] rounded border-slate-300 focus:ring-[#2563eb] accent-[#2563eb]"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-black uppercase text-slate-900 block">
                        ¿Requiere Factura Fiscal (CFDI)?
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Se agrega el 16% de IVA sobre la maquinaria (+{formatCurrency(subtotal * 0.16, currency)})
                      </span>
                    </div>
                  </label>

                  {requiresFactura && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fadeIn">
                      <input
                        type="text"
                        placeholder="RFC (12 o 13 caracteres)"
                        value={clientRFC}
                        onChange={(e) => setClientRFC(e.target.value.toUpperCase())}
                        className="p-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded focus:border-[#2563eb] focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Razón Social o Nombre Fiscal"
                        value={clientRazonSocial}
                        onChange={(e) => setClientRazonSocial(e.target.value)}
                        className="p-2 text-xs bg-white border border-slate-300 rounded focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Customer Information Form */}
                <div className="space-y-2.5">
                  <span className="text-xs font-black uppercase text-slate-700 block">
                    Datos de Contacto y Entrega:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp (10 dígitos) *"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Correo Electrónico (para envío de comprobante) *"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dirección completa de entrega (Calle, Colonia, Ciudad)"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                  />
                </div>

                {/* 5. Payment Method Selection (Stripe / Link de Pago / Transferencia) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <CreditCard size={15} className="text-[#2563eb]" />
                    Opciones de Pago Disponibles:
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card_stripe')}
                      className={`p-2.5 rounded-lg border text-left font-bold transition flex flex-col justify-between ${
                        paymentMethod === 'card_stripe'
                          ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-1 ring-[#2563eb]'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Tarjeta (Stripe)</span>
                        <CreditCard size={14} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal mt-1">
                        Link de Pago Seguro
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('spei_transfer')}
                      className={`p-2.5 rounded-lg border text-left font-bold transition flex flex-col justify-between ${
                        paymentMethod === 'spei_transfer'
                          ? 'bg-blue-50 border-[#2563eb] text-[#2563eb] ring-1 ring-[#2563eb]'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Transferencia SPEI</span>
                        <DollarSign size={14} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal mt-1">
                        Depósito en cuenta
                      </span>
                    </button>
                  </div>

                  {/* Stripe / Payment Link configuration */}
                  {paymentMethod === 'card_stripe' && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          Enlace de Pago con Tarjeta:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingStripeLink(!isEditingStripeLink)}
                          className="text-[10px] font-bold text-[#2563eb] hover:underline"
                        >
                          {isEditingStripeLink ? 'Listo' : 'Personalizar Link'}
                        </button>
                      </div>

                      {isEditingStripeLink ? (
                        <input
                          type="text"
                          value={customStripeLink}
                          onChange={(e) => setCustomStripeLink(e.target.value)}
                          placeholder="https://buy.stripe.com/tu-link"
                          className="w-full p-2 text-xs border border-slate-300 rounded font-mono"
                        />
                      ) : (
                        <p className="text-[11px] font-mono text-slate-500 truncate bg-slate-50 p-1.5 rounded border border-slate-100">
                          {customStripeLink}
                        </p>
                      )}

                      <a
                        href={customStripeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase transition"
                      >
                        <CreditCard size={13} />
                        <span>Abrir Pasarela de Pago Stripe</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {paymentMethod === 'spei_transfer' && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                      <p className="font-bold text-slate-800">Datos para Transferencia SPEI:</p>
                      <p className="text-slate-600">Banco: <strong>BBVA Bancomer / Santander</strong></p>
                      <p className="text-slate-600">Beneficiario: <strong>Maquinaria Renteria</strong></p>
                      <p className="text-slate-500 text-[10px]">
                        Al confirmar tu pedido, te compartiremos la CLABE interbancaria por WhatsApp y correo electrónico.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer: Detailed Financial Breakdown & Action Buttons */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3.5">
              
              {/* Financial summary breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 border-b border-slate-200 pb-3">
                <div className="flex justify-between">
                  <span>Subtotal Maquinaria:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(subtotal, currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>IVA 16% (Facturación):</span>
                  <span className="font-mono font-bold">
                    {requiresFactura ? (
                      <span className="text-slate-900">+{formatCurrency(ivaAmount, currency)}</span>
                    ) : (
                      <span className="text-slate-400 font-normal">No aplica ($0.00)</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Envío Flete Consolidado:</span>
                  <span className="font-mono font-bold">
                    {effectiveShippingCost > 0 ? (
                      <span className="text-[#2563eb]">+{formatCurrency(effectiveShippingCost, currency)}</span>
                    ) : (
                      <span className="text-slate-400 font-normal">Ingresa tu C.P.</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm sm:text-base">
                  <span className="font-black uppercase text-slate-900">Total Final:</span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-[#2563eb]">
                    {formatCurrency(grandTotal, currency)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* 1. WhatsApp Button */}
                <button
                  onClick={handleWhatsAppSend}
                  className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-98"
                >
                  <MessageCircle size={18} />
                  <span>Confirmar Pedido por WhatsApp</span>
                </button>

                {/* 2. Email Receipt Button */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleEmailSend}
                    className="py-2.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold uppercase border border-slate-300 flex items-center justify-center gap-1.5 transition active:scale-98 shadow-xs"
                    title="Enviar comprobante al correo oficial y del cliente"
                  >
                    <Mail size={14} className="text-[#2563eb]" />
                    <span>Enviar a Correo</span>
                  </button>

                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="py-2.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold uppercase border border-slate-300 flex items-center justify-center gap-1.5 transition active:scale-98 shadow-xs"
                    title="Ver o imprimir comprobante en PDF"
                  >
                    <Printer size={14} className="text-slate-600" />
                    <span>Ver Comprobante</span>
                  </button>
                </div>
              </div>

              {orderSentSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-200 text-xs font-medium text-center flex items-center justify-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Comprobante preparado para envío a tu correo.</span>
                </div>
              )}

              <div className="text-[10px] text-slate-400 text-center leading-tight">
                🔒 Maquinaria sobre pedido • Envíos a toda la República • Asistencia telefónica: 639 114 1084
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL ORDER RECEIPT / COMPROBANTE MODAL (PRINTABLE / PDF READY)         */}
      {/* ========================================================================= */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-lg uppercase text-slate-900">Comprobante de Pedido</h3>
                <span className="text-xs font-mono font-bold text-[#2563eb]">Folio: #{orderFolio}</span>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="text-xs space-y-3 print:m-0">
              <div className="flex justify-between text-slate-600 pb-2 border-b">
                <div>
                  <strong className="block text-slate-900 uppercase">MAQUINARIA RENTERIA</strong>
                  <span>Delicias, Chihuahua, México</span><br />
                  <span>Tel: 639 114 1084 / 639 111 9008</span><br />
                  <span>maquinariarenteria17@gmail.com</span>
                </div>
                <div className="text-right">
                  <span className="block font-bold">Fecha: {new Date().toLocaleDateString('es-MX')}</span>
                  <span>Estatus: <strong>Sobre Pedido</strong></span>
                </div>
              </div>

              <div>
                <strong className="block text-slate-900 uppercase mb-1">Cliente:</strong>
                <p>Nombre: {clientName || 'Cliente General'}</p>
                <p>Tel: {clientPhone || 'No registrado'}</p>
                <p>Correo: {clientEmail || 'No registrado'}</p>
                <p>Destino: {clientAddress || 'Por confirmar'} (CP: {clientCP || 'N/A'})</p>
                {requiresFactura && (
                  <p className="text-blue-700 font-semibold mt-1">
                    Requiere Factura - RFC: {clientRFC || 'Pendiente'} ({clientRazonSocial || 'Razón Social'})
                  </p>
                )}
              </div>

              <div className="border-t pt-2">
                <strong className="block text-slate-900 uppercase mb-1">Detalle de Máquinas:</strong>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400">
                      <th className="py-1">Cant</th>
                      <th className="py-1">Descripción</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
                      return (
                        <tr key={item.machine.id} className="border-b border-slate-100">
                          <td className="py-1.5 font-bold font-mono">{item.quantity}x</td>
                          <td className="py-1.5">
                            {item.machine.name}
                            <span className="block text-[10px] text-slate-400 font-mono">{item.machine.sku}</span>
                          </td>
                          <td className="py-1.5 text-right font-mono font-bold">
                            {formatCurrency(price * item.quantity, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg space-y-1 font-mono text-right">
                <div>Subtotal: <strong>{formatCurrency(subtotal, currency)}</strong></div>
                {requiresFactura ? (
                  <div>IVA (16% Factura): <strong>{formatCurrency(ivaAmount, currency)}</strong></div>
                ) : (
                  <div className="text-slate-400">IVA (16%): No aplica sin factura</div>
                )}
                <div>Envío Flete: <strong>{formatCurrency(effectiveShippingCost, currency)}</strong></div>
                <div className="text-base text-[#2563eb] font-black pt-1 border-t">
                  TOTAL: {formatCurrency(grandTotal, currency)}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center italic">
                Este comprobante formaliza la cotización y solicitud sobre pedido de Maquinaria Renteria.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => window.print()}
                className="flex-1 btn-flat-primary py-2.5 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <Printer size={15} />
                Imprimir o Guardar PDF
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
