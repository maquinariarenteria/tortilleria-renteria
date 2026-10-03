import { CartItem, MachineProduct, ProductVariant } from '../types';

export const formatCurrency = (amount: number, currency: 'USD' | 'MXN' = 'USD'): string => {
  return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-MX').format(num);
};

export const getProductPrice = (
  machine: MachineProduct,
  variant?: ProductVariant | null,
  currency: 'USD' | 'MXN' = 'MXN'
): number => {
  if (variant) {
    if (currency === 'MXN') {
      if (variant.fixedPriceMXN !== undefined) return variant.fixedPriceMXN;
      return machine.priceMXN + (variant.extraPriceMXN || 0);
    } else {
      if (variant.fixedPriceUSD !== undefined) return variant.fixedPriceUSD;
      return machine.priceUSD + (variant.extraPriceUSD || 0);
    }
  }
  return currency === 'MXN' ? machine.priceMXN : machine.priceUSD;
};

export const getProductDiameter = (
  machine: MachineProduct,
  variant?: ProductVariant | null
): string => {
  if (variant && variant.diameterRange) {
    return variant.diameterRange;
  }
  return machine.diameterRange;
};

export const generateWhatsAppQuoteLink = (
  items: CartItem[], 
  currency: 'USD' | 'MXN',
  clientName: string = '',
  clientPhone: string = '',
  clientCity: string = ''
): string => {
  const phoneNumber = "526391141084"; // Número oficial Maquinaria Rentería
  let message = `Hola Maquinaria Rentería, me interesa cotizar maquinaria para tortillas de harina:\n\n`;
  
  if (clientName) {
    message += `👤 *Cliente:* ${clientName}\n`;
    if (clientCity) message += `📍 *Ciudad/Estado:* ${clientCity}\n`;
    if (clientPhone) message += `📞 *Teléfono:* ${clientPhone}\n`;
    message += `──────────────────\n`;
  }

  items.forEach((item, index) => {
    const unitPrice = currency === 'MXN' ? item.unitPriceMXN : item.unitPriceUSD;
    const variantLabel = item.selectedVariant ? ` [${item.selectedVariant.name}]` : '';
    message += `${index + 1}. *${item.machine.name}${variantLabel}* (Cant: ${item.quantity})\n`;
    message += `   • Capacidad: ${formatNumber(item.machine.capacityPerHour)} tortillas/hr\n`;
    message += `   • Diámetro/Medida: ${getProductDiameter(item.machine, item.selectedVariant)}\n`;
    message += `   • Energía: ${item.selectedEnergy || item.machine.energyType}\n`;
    message += `   • Subtotal: ${formatCurrency(unitPrice * item.quantity, currency)}\n\n`;
  });

  const total = items.reduce((acc, item) => {
    const unitPrice = currency === 'MXN' ? item.unitPriceMXN : item.unitPriceUSD;
    return acc + (unitPrice * item.quantity);
  }, 0);

  message += `──────────────────\n`;
  message += `💰 *Presupuesto Estimado:* ${formatCurrency(total, currency)}\n\n`;
  message += `• Costo de envío: A acordar con el vendedor según mi ciudad de entrega.\n\n`;
  message += `¿Podrían asesorarme con tiempos de entrega y disponibilidad? Gracias.`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};

