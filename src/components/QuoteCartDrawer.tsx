import { useModalFocus } from '../hooks/useModalFocus';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CartItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { sendOrderNotificationEmail } from '../utils/emailService';
import { getSiteConfig, recordHotspotClick, recordABConversion, recordABVisitor } from '../utils/adminStore';
import { AdminSaleOrder } from '../types/admin';
import { 
  X, Trash2, Plus, Minus, MessageCircle, ShoppingBag, 
  CreditCard, Truck, AlertTriangle, ArrowRight, ShieldCheck, Lock
} from 'lucide-react';

interface QuoteCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: 'USD' | 'MXN';
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
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
  const paymentAttempt = useRef({ fingerprint: '', id: '' });
  const config = getSiteConfig();

  // Customer Details Form
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
  const [invalidField, setInvalidField] = useState<string>('');
  const [, setOrderConfirmedWhatsApp] = useState<AdminSaleOrder | null>(null);

  // Stripe Online Payment Modal inside drawer
  const [showStripeModal, setShowStripeModal] = useState(false);
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) { paymentAttempt.current = { fingerprint: '', id: '' }; return; }
    if (isOpen) {
      recordABVisitor();
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
      const unitPrice = currency === 'MXN' ? item.unitPriceMXN : item.unitPriceUSD;
      return acc + unitPrice * item.quantity;
    }, 0);
  }, [items, currency]);

  // 16% IVA calculation (only if customer requires invoice)
  const ivaAmount = requiresFactura ? Math.round(subtotal * 0.16) : 0;
  const grandTotal = subtotal + ivaAmount;

  const modalRef = useModalFocus(isOpen, onClose);
  const paymentModalRef = useModalFocus(isOpen && showStripeModal, () => setShowStripeModal(false));
  if (!isOpen) return null;

  const focusAndAlert = (fieldId: string, fieldName: string, message: string) => {
    setErrorMessage(message);
    setInvalidField(fieldName);
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  // 1. Validation for WhatsApp (Requires Name + 10-digit Phone; other fields enhance message if provided)
  const validateForWhatsApp = (): boolean => {
    if (!clientName.trim()) {
      focusAndAlert('cart-input-name', 'name', 'Por favor ingresa tu Nombre Completo para enviar tu pedido a WhatsApp.');
      return false;
    }
    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      focusAndAlert('cart-input-phone', 'phone', 'Por favor ingresa un Teléfono o WhatsApp de 10 dígitos (ej. 639 123 4567).');
      return false;
    }
    if (requiresFactura && !clientRFC.trim()) {
      focusAndAlert('cart-input-rfc', 'rfc', 'Por favor ingresa tu RFC para la factura fiscal CFDI.');
      return false;
    }
    setErrorMessage('');
    setInvalidField('');
    return true;
  };

  // 2. Validation for Stripe Card Payment (Requires Name, Phone, Email, Address)
  const validateForStripe = (): boolean => {
    if (!clientName.trim()) {
      focusAndAlert('cart-input-name', 'name', 'Para pagar con tarjeta y emitir tu comprobante, ingresa tu Nombre Completo.');
      return false;
    }
    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      focusAndAlert('cart-input-phone', 'phone', 'Por favor ingresa un Teléfono o WhatsApp de 10 dígitos para coordinar tu entrega.');
      return false;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      focusAndAlert('cart-input-email', 'email', 'Por favor ingresa un Correo Electrónico válido para enviarte el comprobante de pago con tarjeta.');
      return false;
    }
    if (!clientAddress.trim() || !clientCity.trim()) {
      focusAndAlert('cart-input-address', 'address', 'Por favor ingresa tu Dirección y Ciudad para coordinar el envío de la maquinaria.');
      return false;
    }
    if (requiresFactura && !clientRFC.trim()) {
      focusAndAlert('cart-input-rfc', 'rfc', 'Por favor ingresa tu RFC para la factura fiscal CFDI.');
      return false;
    }
    setErrorMessage('');
    setInvalidField('');
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
      clientEmail: clientEmail.trim() || 'Por coordinar',
      shippingAddress: clientAddress.trim() || 'A coordinar con vendedor',
      shippingCity: clientCity.trim() || 'Por coordinar',
      shippingState: 'Por coordinar',
      shippingZip: clientCP.trim() || 'N/A',
      requiresInvoice: requiresFactura,
      rfc: requiresFactura ? clientRFC.trim().toUpperCase() : undefined,
      businessName: requiresFactura ? (clientRazonSocial.trim() || clientName.trim()) : undefined,
      items: items.map((i) => {
        const unitPrice = currency === 'MXN' ? i.unitPriceMXN : i.unitPriceUSD;
        const variantSuffix = i.selectedVariant ? ` (${i.selectedVariant.name})` : '';
        return {
          id: i.machine.id,
          name: `${i.machine.name}${variantSuffix}`,
          sku: i.machine.sku,
          quantity: i.quantity,
          unitPrice,
          total: unitPrice * i.quantity,
        };
      }),
      subtotal,
      iva: ivaAmount,
      shippingCost: 0, // Envio es a acordar con el vendedor
      total: grandTotal,
      paymentMethod,
      manufacturingStatus: 'Pendiente',
    };
  };

  // 1. FINALIZAR COMPRA POR WHATSAPP (Llega ya con todo al WhatsApp)
  const handleBuyWhatsApp = async () => {
    if (items.length === 0) return;
    if (!validateForWhatsApp()) return;

    setIsProcessing(true);
    recordHotspotClick('Finalizar Pedido WhatsApp');
    recordABConversion('A');

    const saleOrder = buildSaleRecord('Transferencia SPEI');

    // Register in Admin store and send email notification
    try { await sendOrderNotificationEmail({ order: saleOrder, currency }); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la solicitud.'); setIsProcessing(false); return; }

    // Build structured WhatsApp message with customer & equipment details
    let msg = `*NUEVO PEDIDO - MAQUINARIA RENTERIA*\n`;
    msg += `Folio de Orden: #${saleOrder.folio}\n\n`;
    msg += `*DATOS DEL CLIENTE:*\n`;
    msg += `• Nombre: ${clientName.trim()}\n`;
    msg += `• Teléfono: ${clientPhone.trim()}\n`;
    if (clientEmail.trim()) msg += `• Correo: ${clientEmail.trim()}\n`;
    msg += `• Destino de Entrega: ${clientAddress.trim() || 'A coordinar en chat'}, ${clientCity.trim() || 'A coordinar'}\n`;
    if (clientCP.trim()) msg += `• C.P.: ${clientCP.trim()}\n`;
    if (requiresFactura) {
      msg += `• Facturación: Requiere CFDI (RFC: ${clientRFC.trim().toUpperCase()})\n`;
      if (clientRazonSocial.trim()) msg += `• Razón Social: ${clientRazonSocial.trim()}\n`;
    } else {
      msg += `• Facturación: Nota de Venta\n`;
    }
    if (clientNotes.trim()) msg += `• Notas: ${clientNotes.trim()}\n`;

    msg += `\n*MAQUINARIA SELECCIONADA:*\n`;
    items.forEach((item, idx) => {
      const unitPrice = currency === 'MXN' ? item.unitPriceMXN : item.unitPriceUSD;
      const variantSuffix = item.selectedVariant ? ` [${item.selectedVariant.name}]` : '';
      msg += `${idx + 1}. *${item.machine.name}${variantSuffix}* (${item.machine.sku})\n`;
      msg += `   • Cantidad: ${item.quantity} | Unitario: ${formatCurrency(unitPrice, currency)}\n`;
      msg += `   • Subtotal: ${formatCurrency(unitPrice * item.quantity, currency)}\n`;
    });

    msg += `\n*RESUMEN FINANCIERO:*\n`;
    msg += `• Subtotal Maquinaria: ${formatCurrency(subtotal, currency)}\n`;
    if (requiresFactura) {
      msg += `• IVA (16% Factura): +${formatCurrency(ivaAmount, currency)}\n`;
    }
    msg += `• Costo de Envío: *A acordar con el vendedor (No incluido en web)*\n`;
    msg += `*TOTAL MAQUINARIA: ${formatCurrency(grandTotal, currency)}*\n\n`;
    msg += `Hola Maquinaria Rentería, deseo finalizar esta compra y acordar con el asesor los detalles de flete y fecha de entrega.`;

    setIsProcessing(false);
    setOrderConfirmedWhatsApp(saleOrder);

    const waPhone = config.phone1.replace(/\D/g, '') || '526391141084';
    window.open(`https://wa.me/52${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 2. PAGAR EN LÍNEA CON STRIPE
  const handleInitiateStripePayment = () => {
    if (items.length === 0) return;
    if (!validateForStripe()) return;
    recordHotspotClick('Pagar con Tarjeta (Stripe)');
    setShowStripeModal(true);
  };

  const handleConfirmStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const body = {
        currency, paymentType: 'full', requiresInvoice: requiresFactura,
        expectedTotal: Math.round(grandTotal * 100),
        customer: { name: clientName, phone: clientPhone, email: clientEmail,
          address: clientAddress, city: clientCity, zip: clientCP, rfc: clientRFC, businessName: clientRazonSocial },
        items: items.map(item => ({ machineId: item.machine.id, variantId: item.selectedVariant?.id, quantity: item.quantity })),
      };
      const fingerprint = JSON.stringify(body);
      if (paymentAttempt.current.fingerprint !== fingerprint) paymentAttempt.current = { fingerprint, id: crypto.randomUUID() };
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, requestId: paymentAttempt.current.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'No se pudo abrir el pago seguro.');
      const checkoutUrl = new URL(data.checkoutUrl);
      if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.stripe.com') throw new Error('Enlace de pago inválido.');
      sessionStorage.setItem('mr_stripe_cart', JSON.stringify(items));
      window.location.assign(checkoutUrl.href);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo conectar con Stripe.');
      setIsProcessing(false);
    }
  };

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Carrito de compra" className="fixed inset-0 z-50 overflow-hidden font-sans">
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
                Tu Carrito de Compra ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-800 transition cursor-pointer"
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
                    const unitPrice = currency === 'MXN' ? item.unitPriceMXN : item.unitPriceUSD;
                    return (
                      <div
                        key={item.id}
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
                            {item.selectedVariant && (
                              <span className="text-[10px] font-bold text-[#2563eb] bg-blue-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                {item.selectedVariant.name}
                              </span>
                            )}
                            <span className="font-mono font-bold text-[#2563eb] text-xs block mt-0.5">
                              {formatCurrency(unitPrice, currency)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-white rounded-lg border border-slate-300">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="p-1 text-slate-500 hover:text-black cursor-pointer active:scale-95"
                              aria-label="Restar uno"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-mono text-xs font-bold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="p-1 text-slate-500 hover:text-black cursor-pointer active:scale-95"
                              aria-label="Sumar uno"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer active:scale-95"
                            title="Eliminar"
                            aria-label="Eliminar del carrito"
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
                    Datos del Cliente para Envío y Contacto:
                  </span>

                  <div>
                    <label htmlFor="cart-input-name" className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      Nombre Completo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="cart-input-name"
                      type="text"
                      required
                      placeholder="Ej. Roberto Morales"
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        if (invalidField === 'name') setErrorMessage('');
                      }}
                      className={`w-full p-2.5 text-xs border rounded-lg focus:outline-none transition ${
                        invalidField === 'name' 
                          ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20' 
                          : 'border-slate-300 focus:border-[#2563eb]'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="cart-input-phone" className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                        WhatsApp / Teléfono (10 dígitos) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="cart-input-phone"
                        type="tel"
                        required
                        placeholder="Ej. 639 123 4567"
                        value={clientPhone}
                        onChange={(e) => {
                          setClientPhone(e.target.value);
                          if (invalidField === 'phone') setErrorMessage('');
                        }}
                        className={`w-full p-2.5 text-xs border rounded-lg focus:outline-none transition ${
                          invalidField === 'phone' 
                            ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20' 
                            : 'border-slate-300 focus:border-[#2563eb]'
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="cart-input-email" className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                        Correo Electrónico (para comprobante)
                      </label>
                      <input
                        id="cart-input-email"
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={clientEmail}
                        onChange={(e) => {
                          setClientEmail(e.target.value);
                          if (invalidField === 'email') setErrorMessage('');
                        }}
                        className={`w-full p-2.5 text-xs border rounded-lg focus:outline-none transition ${
                          invalidField === 'email' 
                            ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20' 
                            : 'border-slate-300 focus:border-[#2563eb]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="cart-input-address" className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                        Dirección de Entrega (Calle y número)
                      </label>
                      <input
                        id="cart-input-address"
                        type="text"
                        placeholder="Calle, número, colonia"
                        value={clientAddress}
                        onChange={(e) => {
                          setClientAddress(e.target.value);
                          if (invalidField === 'address') setErrorMessage('');
                        }}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="cart-input-city" className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                        Ciudad / Estado
                      </label>
                      <input
                        id="cart-input-city"
                        type="text"
                        placeholder="Ej. Monterrey, NL"
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="quotecartdrawer-4" className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Código Postal</label>
                      <input id="quotecartdrawer-4"
                        type="text"
                        maxLength={5}
                        placeholder="C.P. (5 dígitos)"
                        value={clientCP}
                        onChange={(e) => setClientCP(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:border-[#2563eb] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="quotecartdrawer-5" className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Notas especiales</label>
                      <input id="quotecartdrawer-5"
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
                          id="cart-input-rfc"
                          type="text"
                          placeholder="RFC para factura *"
                          value={clientRFC}
                          onChange={(e) => {
                            setClientRFC(e.target.value.toUpperCase());
                            if (invalidField === 'rfc') setErrorMessage('');
                          }}
                          className={`w-full p-2 text-xs font-mono uppercase border rounded-lg focus:outline-none bg-white ${
                            invalidField === 'rfc' ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300'
                          }`}
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

                </div>
              </>
            )}
          </div>

          {/* Footer: Price summary & 2 Big Action Buttons */}
          {items.length > 0 && (
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
                    <span>Envío y flete:</span>
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

              {/* HIGH VISIBILITY ERROR BANNER IN THE FOOTER (GUARANTEES BUTTON CLICKS SHOW WHY IF INCOMPLETE) */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border-2 border-rose-400 text-rose-800 rounded-xl text-xs font-bold flex items-start gap-2 shadow-sm animate-shake">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="block font-black uppercase text-rose-900 text-[10px]">Dato Requerido:</span>
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    onClick={() => {
                      setErrorMessage('');
                      setInvalidField('');
                    }}
                    className="text-rose-400 hover:text-rose-700 text-xs cursor-pointer p-0.5"
                    aria-label="Cerrar alerta"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 2 Clear Action Buttons */}
              <div className="space-y-2">
                {/* 1. Finalizar en WhatsApp (Llega ya con todo al WhatsApp) */}
                <button
                  type="button"
                  onClick={handleBuyWhatsApp}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle size={18} />
                  <span>Finalizar Compra por WhatsApp</span>
                </button>

                {/* 2. Pagar en Línea con Tarjeta (Stripe) */}
                <button
                  type="button"
                  onClick={handleInitiateStripePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard size={17} />
                  <span>Pagar con Tarjeta (Crédito / Débito)</span>
                </button>
              </div>

              {/* Payment methods and trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-500 pt-1">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <CreditCard size={11} className="text-[#2563eb]" />
                  <span>Tarjetas Visa, Mastercard, AMEX</span>
                </span>
                <span>•</span>
                <span className="font-bold text-slate-700">Transferencia SPEI</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <ShieldCheck size={11} />
                  <span>Garantía 1 Año</span>
                </span>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* STRIPE PAYMENT MODAL */}
      {showStripeModal && (
        <div ref={paymentModalRef} role="dialog" aria-modal="true" aria-label="Confirmar pago con tarjeta" className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-slate-900 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#2563eb]" />
                <h3 className="font-black text-sm uppercase text-slate-900">
                  Pago Seguro con Tarjeta (Stripe)
                </h3>
              </div>
              <button 
                onClick={() => setShowStripeModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                aria-label="Cerrar modal de pago"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-500 font-medium">Monto a pagar:</span>
                <b className="font-mono text-lg text-[#2563eb]">{formatCurrency(grandTotal, currency)}</b>
              </div>
              <p className="text-[11px] text-slate-600">
                Cliente: <b>{clientName}</b> · Entrega: <b>{clientCity || 'A acordar'}</b>
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold pt-1 border-t border-slate-200">
                <Lock size={11} />
                <span>Aceptamos Tarjetas de Crédito y Débito (Visa, Mastercard, AMEX)</span>
              </div>
            </div>

            <form onSubmit={handleConfirmStripePayment} className="space-y-3 text-xs">
              <p className="font-bold">Pago completo del 100% · {formatCurrency(grandTotal, currency)}</p>
              <p className="text-slate-600">Ingresarás los datos de tu tarjeta en la página segura de Stripe. El flete se acuerda por separado.</p>
              {errorMessage && <p role="alert" className="text-red-700">{errorMessage}</p>}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Abriendo Stripe...</span>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Continuar a Stripe</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                  <span>Pago procesado por Stripe</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
