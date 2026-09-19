import { CartItem } from '../types';

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

export const generateWhatsAppQuoteLink = (
  items: CartItem[], 
  currency: 'USD' | 'MXN',
  clientName: string = '',
  clientPhone: string = '',
  clientCity: string = ''
): string => {
  const phoneNumber = "526621234567"; // Número comercial
  let message = `Hola, vengo desde *TORTILLAMACHINE.COM* y me interesa cotizar maquinaria para tortillas de harina:\n\n`;
  
  if (clientName) {
    message += `👤 *Cliente:* ${clientName}\n`;
    if (clientCity) message += `📍 *Ciudad/Estado:* ${clientCity}\n`;
    if (clientPhone) message += `📞 *Teléfono:* ${clientPhone}\n`;
    message += `──────────────────\n`;
  }

  items.forEach((item, index) => {
    const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
    message += `${index + 1}. *${item.machine.name}* (Cant: ${item.quantity})\n`;
    message += `   • Capacidad: ${formatNumber(item.machine.capacityPerHour)} tortillas/hr\n`;
    message += `   • Energía: ${item.selectedEnergy || item.machine.energyType}\n`;
    message += `   • Subtotal estimado: ${formatCurrency(price * item.quantity, currency)}\n\n`;
  });

  const total = items.reduce((acc, item) => {
    const price = currency === 'MXN' ? item.machine.priceMXN : item.machine.priceUSD;
    return acc + (price * item.quantity);
  }, 0);

  message += `──────────────────\n`;
  message += `💰 *Presupuesto Estimado:* ${formatCurrency(total, currency)}\n\n`;
  message += `¿Podrían asesorarme con tiempos de entrega, esquemas de flete y pruebas de masa con harina? Gracias.`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};
