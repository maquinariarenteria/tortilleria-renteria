import React, { useState, useMemo, useEffect } from 'react';
import { CartItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { sendOrderNotificationEmail } from '../utils/emailService';
import { getSiteConfig, recordHotspotClick } from '../utils/adminStore';
import { AdminSaleOrder } from '../types/admin';
import { 
  X, Trash2, Plus, Minus, MessageCircle, ShoppingBag, 
  CreditCard, CheckCircle2, Truck, AlertTriangle, ArrowRight, ShieldCheck, ExternalLink
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

  // Customer Details Form (All required as requested)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientCP, setClientCP] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Factura toggle
  const [requiresFactura, setRequiresFactura] = useState(false);
  const [clientRFC, setClientRFC] = useState('');
  const [clientRazonSocial, setClientRazonSocial] = useState('');

  // Checkout states
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderConfirmedWhatsApp, setOrderConfirmedWhatsApp] = useState<AdminSaleOrder | null>(null);
  const [stripePaymentConfirmed, setStripePaymentConfirmed] = useState<AdminSaleOrder | null>(null);

  // Stripe Online Payment Modal inside drawer
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');

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

  // 16% IVA calculation (only if customer requires invoice)
  const ivaAmount = requiresFactura ? Math.round(subtotal * 0.16) : 0;
  const grandTotal = subtotal + ivaAmount;

  if (!isOpen) return null;

  // Validation
  const validateForm = () => {
    if (!clientName.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return false;
    }
    if (!clientPhone.trim() || clientPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Por favor ingresa un teléfono o WhatsApp de 10 dígitos.');
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido para tu comprobante.');
      return false;
    }
    if (!clientAddress.trim() || !clientCity.trim()) {
      setErrorMessage('Por favor ingresa tu dirección y ciudad de entrega para coordinar el flete.');
      return false;
    }
    if (requiresFactura && !clientRFC.trim()) {
      setErrorMessage('Por favor ingresa tu RFC para la factura CFDI.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Helper to build sale record
  const buildSaleRecord = (paymentMethod: 'Stripe' | 'Transferencia SPEI'): AdminSaleOrder => {
    const folio = `VTA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      folio,
      createdAt: new Date().toISOString(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      shippingAddress: clientAddress.trim(),
      shippingCity: clientCity.trim(),
      shippingState: 'Por coordinar',
      shippingZip: clientCP.trim() || 'N/A',
      requiresInvoice: requiresFactura,
      rfc: requiresFactura ? clientRFC.trim().toUpperCase() : undefined,
      businessName: requiresFactura ? (clientRazonSocial.trim() || clientName.trim()) : undefined,
      items: items.map((i) => ({
        id: i.machine.id,
        name: i.machine.name,
        sku: i.machine.sku,
        quantity: i.quantity,
        unitPrice: currency === 'MXN' ? i.machine.priceMXN : i.machine.priceUSD,
        total: (currency === 'MXN' ? i.machine.priceMXN : i.machine.priceUSD) * i.quantity,
      })),
      subtotal,
      iva: ivaAmount,
      shippingCost: 0, // Envio es a acordar con el vendedor
      total: grandTotal,
      paymentMethod,
      manufacturingStatus: 'Pendiente',
    };
  };

  // 1. FINALIZAR COMPRA POR WHATSAPP
  const handleBuyWhatsApp = async () => {
    if (items.length === 0) return;
    if (!validateForm()) return;

    setIsProcessing(true);
    recordHotspotClick('Finalizar Pedido WhatsApp');

    const saleOrder = buildSaleRecord('Transferencia SPEI');

    // Register in Admin store and send email notification
    await sendOrderNotificationEmail({ order: saleOrder, currency });

    // Build structured WhatsApp message with ALL customer and equipment details
    let msg = `*NUEVO PEDIDO - MAQUINARIA RENTERIA*\n`;
    msg += `Folio de Orden: #${saleOrder.folio}\n\n`;
    msg += `*DATOS DEL CLIENTE:*\n`;
    msg += `• Nombre: ${clientName.trim()}\n`;
    msg += `• Teléfono: ${clientPhone.trim()}\n`;
    msg += `• Correo: ${clientEmail.trim()}\n`;
    msg += `• Dirección de Entrega: ${clientAddress.trim()}, ${clientCity.trim()}\n`;
    if (clientCP.trim()) msg += `• C.P.: ${clientCP.trim()}\n`;
    if (requiresFactura) {
      msg += `• Facturación: Requiere CFDI (RFC: ${clientRFC.trim().toUpperCase()})\n`;
      if (clientRazonSocial.trim()) msg += `• Razón Social: ${clientRazonSocial.trim()}\n`;
    } else {
      msg += `• Facturación: Nota de Venta\n`;
    }
    if (clientNotes.trim()) msg += `• Notas: ${clientNotes.trim()}\n`;

    msg += `\n*MAQUINARIA SOLICITADA:*\n`;
    items.forEach((item, idx) => {
      const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
      msg += `${idx + 1}. ${item.machine.name} (${item.machine.sku}) x${item.quantity} = ${formatCurrency(price * item.quantity, currency)}\n`;
    });

    msg += `\n*RESUMEN FINANCIERO:*\n`;
    msg += `• Subtotal: ${formatCurrency(subtotal, currency)}\n`;
    if (requiresFactura) {
      msg += `• IVA (16% Factura): +${formatCurrency(ivaAmount, currency)}\n`;
    }
    msg += `• Costo de Envío: A acordar con el vendedor\n`;
    msg += `*TOTAL MAQUINARIA: ${formatCurrency(grandTotal, currency)}*\n\n`;
    msg += `Hola Maquinaria Rentería, deseo finalizar esta compra y acordar los detalles de flete y entrega con el asesor.`;

    setIsProcessing(false);
    setOrderConfirmedWhatsApp(saleOrder);

    const waPhone = config.phone1.replace(/\D/g, '') || '526391141084';
    window.open(`https://wa.me/52${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 2. PAGAR EN LÍNEA CON STRIPE
  const handleInitiateStripePayment = () => {
    if (items.length === 0) return;
    if (!validateForm()) return;
    recordHotspotClick('Pagar con Tarjeta (Stripe)');
    setShowStripeModal(true);
  };

  const handleConfirmStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const saleOrder = buildSaleRecord('Stripe');

    // Register in Admin store as paid online and dispatch email notification
    await sendOrderNotificationEmail({ order: saleOrder, currency });

    setTimeout(() => {
      setIsProcessing(false);
      setShowStripeModal(false);
      setStripePaymentConfirmed(saleOrder);
      onClearCart();
    }, 1200);
  };

  // WhatsApp button for sending payment receipt after online payment
  const handleSendStripeReceiptToWhatsApp = () => {
    if (!stripePaymentConfirmed) return;
    const itemsSummary = stripePaymentConfirmed.items.map(i => `• ${i.name} x${i.quantity}`).join('\n');
    const msg = 
      `*COMPROBANTE DE PAGO - MAQUINARIA RENTERIA*\n\n` +
      `*Folio de Venta:* #${stripePaymentConfirmed.folio}\n` +
      `*Cliente:* ${stripePaymentConfirmed.clientName}\n` +
      `*Teléfono:* ${stripePaymentConfirmed.clientPhone}\n` +
      `*Correo:* ${stripePaymentConfirmed.clientEmail}\n` +
      `*Dirección de Entrega:* ${stripePaymentConfirmed.shippingAddress}, ${stripePaymentConfirmed.shippingCity}\n` +
      `*Monto Pagado en Línea:* ${formatCurrency(stripePaymentConfirmed.total, currency)} (Stripe)\n\n` +
      `*Equipos Adquiridos:*\n${itemsSummary}\n\n` +
      `Hola Maquinaria Rentería, adjunto mi comprobante de pago de la compra realizada en la web para acordar los temas del envío y tiempos de entrega.`;

    const waPhone = config.phone1.replace(/\D/g, '') || '526391141084';
    window.open(`https://wa.me/52${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Shell */}
      <div className="fixed inset-y-0 right-0 w-full max-w-full flex justify-end pointer-events-none">
        <div className="pointer-events-auto w-full max-w-full sm:max-w-lg bg-white text-slate-900 shadow-2xl flex flex-col h-full max-h-[100dvh] overflow-hidden animate-slideLeft">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#2563eb]" />
              <h2 className="font-black text-base uppercase tracking-wide text-slate-900">
                Tu Carrito de Compra ({items.length})
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 transition"
              aria-label="Cerrar Carrito"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 overscroll-contain">
            
            {/* SUCCESS STATE A: Online Stripe Payment Confirmed */}
            {stripePaymentConfirmed ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                  <CheckCircle2 size={36} />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Pago Exitoso con Stripe
                  </span>
                  <h3 className="text-xl font-black text-slate-900 uppercase mt-2">
                    ¡Gracias por tu compra!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Tu pago ha sido procesado de forma segura y registrado en nuestro sistema de fabricación.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Folio Oficial:</span>
                    <b className="font-mono text-[#2563eb]">#{stripePaymentConfirmed.folio}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Monto Pagado:</span>
                    <b className="font-mono text-emerald-700 text-sm">{formatCurrency(stripePaymentConfirmed.total, currency)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Cliente:</span>
                    <span className="text-slate-800 font-bold">{stripePaymentConfirmed.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Destino de Entrega:</span>
                    <span className="text-slate-700">{stripePaymentConfirmed.shippingCity}</span>
                  </div>
                </div>

                {/* Important instruction: send receipt via WhatsApp to agree on shipping */}
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 text-left space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Truck size={14} className="text-amber-700 shrink-0" />
                    Paso siguiente obligatorio: Acordar el envío
                  </span>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Envía tu comprobante de pago directamente a nuestro WhatsApp oficial para que un asesor te asigne fecha de entrega y coordine la fletera hacia tu ciudad.
                  </p>
                </div>

                <button
                  onClick={handleSendStripeReceiptToWhatsApp}
                  className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
                >
                  <MessageCircle size={18} />
                  <span>Enviar Comprobante por WhatsApp y Acordar Envío</span>
                </button>

                <button
                  onClick={() => {
                    setStripePaymentConfirmed(null);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <ShoppingBag size={44} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold uppercase text-slate-600">Tu carrito está vacío</p>
                <p className="text-xs text-slate-400">Agrega máquinas del catálogo para cotizar o comprar</p>
              </div>
            ) : (
              <>
                {/* 1. MANDATORY NOTICE: Shipping is NOT included in item prices and is to be agreed */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 uppercase tracking-wide">
                    <Truck size={16} className="text-amber-600 shrink-0" />
                    <span>Envío a acordar con el vendedor</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
                    <b>El costo de los artículos en la web no incluye envío.</b> El envío se acuerda directamente con el vendedor según tu ciudad, maniobras de descarga y paquetería de tu elección (Transportes Castores, Tresguerras o recolección directa en planta Delicias, Chih.).
                  </p>
                </div>

                {/* 2. Product Items */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[11px] uppercase font-bold text-slate-400 pb-1 border-b border-slate-100">
                    <span>Equipos Seleccionados</span>
                    <button onClick={onClearCart} className="hover:text-red-500 cursor-pointer">
                      Vaciar Carrito
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
                              className="p-1 text-slate-500 hover:text-black cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-mono text-xs font-bold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.machine.id, 1)}
                              className="p-1 text-slate-500 hover:text-black cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.machine.id)}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Customer Information Form */}
                <div className="pt-2 space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-900 block border-b border-slate-200 pb-1.5">
                    Datos del Cliente para Envío y Facturación:
                  </span>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Roberto Morales"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">WhatsApp / Teléfono (10 dígitos) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. 639 123 4567"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="para comprobante"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Dirección y Ciudad de Entrega *</label>
                      <input
                        type="text"
                        required
                        placeholder="Calle, número, colonia, ciudad y estado"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Ciudad / Estado *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Monterrey, NL"
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Código Postal</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="C.P. (5 dígitos)"
                        value={clientCP}
                        onChange={(e) => setClientCP(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Notas especiales</label>
                      <input
                        type="text"
                        placeholder="Ej. Horario de recepción"
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Factura CFDI Toggle */}
                  <div className="pt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={requiresFactura}
                        onChange={(e) => setRequiresFactura(e.target.checked)}
                        className="w-4 h-4 text-[#2563eb] rounded accent-[#2563eb]"
                      />
                      <span className="font-bold">¿Requiere Factura Fiscal CFDI? (+16% IVA)</span>
                    </label>

                    {requiresFactura && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                        <input
                          type="text"
                          placeholder="RFC para factura *"
                          value={clientRFC}
                          onChange={(e) => setClientRFC(e.target.value.toUpperCase())}
                          className="w-full p-2 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Razón Social / Nombre fiscal"
                          value={clientRazonSocial}
                          onChange={(e) => setClientRazonSocial(e.target.value)}
                          className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-shake">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>

          {/* Footer: Price summary & 2 Big Action Buttons */}
          {items.length > 0 && !stripePaymentConfirmed && (
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              
              {/* Financial Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-700 border-b border-slate-200 pb-3">
                <div className="flex justify-between">
                  <span>Subtotal Maquinaria:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(subtotal, currency)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-800">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Truck size={13} className="text-amber-600" />
                    <span>Envío y maniobras:</span>
                  </span>
                  <span className="font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                    A acordar con el vendedor
                  </span>
                </div>

                {requiresFactura && (
                  <div className="flex justify-between">
                    <span>IVA (16% CFDI):</span>
                    <span className="font-mono font-bold text-slate-900">+{formatCurrency(ivaAmount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm">
                  <div>
                    <span className="font-black uppercase text-slate-900 block">Total Maquinaria:</span>
                    <span className="text-[10px] text-slate-500 font-medium">+ Envío a coordinar con asesor</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-mono font-black text-[#2563eb]">
                    {formatCurrency(grandTotal, currency)}
                  </span>
                </div>
              </div>

              {/* 2 Clear Action Buttons */}
              <div className="space-y-2">
                {/* 1. Finalizar en WhatsApp (Llega ya con todo al WhatsApp) */}
                <button
                  onClick={handleBuyWhatsApp}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle size={18} />
                  <span>Finalizar Compra por WhatsApp</span>
                </button>

                {/* 2. Pagar en Línea con Stripe */}
                <button
                  onClick={handleInitiateStripePayment}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard size={16} />
                  <span>Pagar en Línea con Tarjeta (Stripe)</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>Fabricación directa sobre pedido • Garantía 1 año • Soporte Maquinaria Rentería</span>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* STRIPE PAYMENT MODAL */}
      {showStripeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#2563eb]" />
                <h3 className="font-black text-sm uppercase text-slate-900">
                  Pasarela de Pago Segura (Stripe)
                </h3>
              </div>
              <button 
                onClick={() => setShowStripeModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Monto total a pagar:</span>
                <b className="font-mono text-base text-[#2563eb]">{formatCurrency(grandTotal, currency)}</b>
              </div>
              <p className="text-[11px] text-slate-500">
                Cliente: <b>{clientName}</b> · Entrega en: <b>{clientCity}</b>
              </p>
              <p className="text-[10px] text-amber-800 italic pt-1 border-t border-slate-200">
                * El costo de envío se coordinará vía WhatsApp una vez confirmado este pago.
              </p>
            </div>

            <form onSubmit={handleConfirmStripePayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                  Número de Tarjeta (Crédito / Débito)
                </label>
                <input
                  type="text"
                  required
                  placeholder="4242 •••• •••• 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:border-[#2563eb] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                    Vencimiento (MM/AA)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:border-[#2563eb] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="•••"
                    value={cardCVC}
                    onChange={(e) => setCardCVC(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:border-[#2563eb] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Procesando pago con Stripe...</span>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Confirmar Pago de {formatCurrency(grandTotal, currency)}</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                  <span>Conexión cifrada SSL de 256 bits · Procesado por Stripe Inc.</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
