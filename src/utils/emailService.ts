import { 
  addStoredQuote, 
  addStoredSale, 
  addStoredAppointment 
} from './adminStore';
import { CustomerQuote, AdminSaleOrder, Appointment } from '../types/admin';
import { formatCurrency } from './formatters';

interface SendOrderEmailParams {
  order: AdminSaleOrder;
  currency?: 'USD' | 'MXN';
}

interface SendContactEmailParams {
  name: string;
  phone: string;
  email?: string;
  message: string;
  machineName?: string;
  city?: string;
}

interface SendAppointmentEmailParams {
  appointment: Appointment;
}

/**
 * 1. Automatically records and dispatches order/sale notifications to maquinariarenteria17@gmail.com
 * and registers the sale in the admin dashboard (VentasTab).
 */
export async function sendOrderNotificationEmail({
  order,
  currency = 'MXN',
}: SendOrderEmailParams): Promise<{ success: boolean; method: string }> {
  // Always register in Admin Store
  addStoredSale(order);

  const subject = `Nuevo Pedido #${order.folio} - ${order.clientName || 'Cliente'}`;
  let textContent = `========================================\n`;
  textContent += `NUEVO PEDIDO RECIBIDO - MAQUINARIA RENTERIA\n`;
  textContent += `========================================\n\n`;
  textContent += `Folio Oficial: #${order.folio}\n`;
  textContent += `Fecha: ${new Date(order.createdAt).toLocaleString('es-MX')}\n\n`;
  textContent += `DATOS DEL CLIENTE:\n`;
  textContent += `• Nombre: ${order.clientName}\n`;
  textContent += `• WhatsApp/Teléfono: ${order.clientPhone}\n`;
  textContent += `• Correo Electrónico: ${order.clientEmail || 'No especificado'}\n`;
  textContent += `• Dirección de Entrega: ${order.shippingAddress || ''}, ${order.shippingCity || ''}, ${order.shippingState || ''}\n`;
  textContent += `• C.P.: ${order.shippingZip || 'N/A'}\n\n`;

  if (order.requiresInvoice) {
    textContent += `DATOS DE FACTURACIÓN (CFDI 16% IVA):\n`;
    textContent += `• RFC: ${order.rfc || 'General'}\n`;
    textContent += `• Razón Social: ${order.businessName || order.clientName}\n\n`;
  }

  textContent += `DETALLE DE MAQUINARIA:\n`;
  order.items.forEach((item, idx) => {
    textContent += `${idx + 1}. ${item.name} (${item.sku}) x${item.quantity} = ${formatCurrency(item.unitPrice * item.quantity, currency)}\n`;
  });

  textContent += `\nRESUMEN FINANCIERO:\n`;
  textContent += `• Subtotal: ${formatCurrency(order.subtotal, currency)}\n`;
  textContent += `• IVA (16%): ${order.requiresInvoice ? formatCurrency(order.iva, currency) : '$0.00 (Sin factura)'}\n`;
  textContent += `• Costo de Envío: ${order.shippingCost > 0 ? formatCurrency(order.shippingCost, currency) : 'A acordar con el vendedor'}\n`;
  textContent += `• TOTAL: ${formatCurrency(order.total, currency)}\n\n`;
  textContent += `Método de Pago: ${order.paymentMethod}\n`;
  textContent += `Estado de Fabricación: ${order.manufacturingStatus}\n`;

  // Attempt automated background delivery
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        access_key: '64d2629a-fb08-410a-8d07-a0f128bc2ec0',
        to: 'maquinariarenteria17@gmail.com',
        subject: subject,
        from_name: 'Ventas Web Maquinaria Rentería',
        message: textContent,
        client_email: order.clientEmail,
        order_folio: order.folio,
        total: `${order.total} MXN`,
      }),
    });

    if (response.ok) {
      return { success: true, method: 'api' };
    }
  } catch (error) {
    console.warn('API email delivery background attempt:', error);
  }

  return { success: true, method: 'local' };
}

/**
 * 2. Automatically records and dispatches contact and quote inquiries to maquinariarenteria17@gmail.com
 * and registers the quote in the admin dashboard (CotizacionesTab).
 */
export async function sendContactInquiryEmail({
  name,
  phone,
  email = '',
  message,
  machineName,
  city = 'Por confirmar',
}: SendContactEmailParams): Promise<{ success: boolean; method: string; quote: CustomerQuote }> {
  const folio = `COT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const quote: CustomerQuote = {
    id: `cot_${Date.now()}`,
    folio,
    createdAt: new Date().toISOString(),
    customerName: name.trim() || 'Cliente Web',
    phone: phone.trim(),
    email: email.trim(),
    stateOrCity: city,
    businessType: 'Otro',
    items: machineName ? [{
      machineId: `m_${Date.now()}`,
      name: machineName,
      quantity: 1,
      price: 0,
    }] : [],
    estimatedTotal: 0,
    status: 'Nueva',
    priority: 'Alta',
    notes: message,
    lastContactAt: new Date().toISOString(),
  };

  // Register in Admin Cotizaciones
  addStoredQuote(quote);

  const subject = `Nueva Cotización #${folio} de ${name}`;
  const textContent = `NUEVA SOLICITUD DE COTIZACIÓN - MAQUINARIA RENTERIA\n\n` +
    `Folio: #${folio}\n` +
    `Nombre: ${name}\n` +
    `Teléfono / WhatsApp: ${phone}\n` +
    `Correo: ${email || 'No proporcionado'}\n` +
    `Ciudad / Estado: ${city}\n` +
    `Fecha: ${new Date().toLocaleString('es-MX')}\n\n` +
    `Equipo o Solicitud:\n${message}\n`;

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        access_key: '64d2629a-fb08-410a-8d07-a0f128bc2ec0',
        to: 'maquinariarenteria17@gmail.com',
        subject: subject,
        from_name: 'Cotizaciones Web Maquinaria Rentería',
        message: textContent,
        client_name: name,
        client_phone: phone,
      }),
    });

    if (response.ok) {
      return { success: true, method: 'api', quote };
    }
  } catch (error) {
    console.warn('API email delivery background attempt:', error);
  }

  return { success: true, method: 'local', quote };
}

/**
 * 3. Automatically records and dispatches appointment requests to maquinariarenteria17@gmail.com
 * and registers the appointment in the admin dashboard (CitasTab).
 */
export async function sendAppointmentNotificationEmail({
  appointment,
}: SendAppointmentEmailParams): Promise<{ success: boolean; method: string }> {
  // Register in Admin Citas
  addStoredAppointment(appointment);

  const subject = `Nueva Cita Agendada: ${appointment.customerName} - ${appointment.scheduledDate} ${appointment.scheduledTime}`;
  const textContent = `NUEVA CITA / DEMOSTRACIÓN AGENDADA - MAQUINARIA RENTERIA\n\n` +
    `Cliente: ${appointment.customerName}\n` +
    `Teléfono: ${appointment.phone}\n` +
    `Correo: ${appointment.email || 'No especificado'}\n` +
    `Tipo de Cita: ${appointment.type}\n` +
    `Máquina de Interés: ${appointment.machineOfInterest}\n` +
    `Fecha Programada: ${appointment.scheduledDate}\n` +
    `Hora: ${appointment.scheduledTime} hrs\n\n` +
    `Notas / Requerimientos:\n${appointment.notes || 'Ninguna nota adicional'}\n`;

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        access_key: '64d2629a-fb08-410a-8d07-a0f128bc2ec0',
        to: 'maquinariarenteria17@gmail.com',
        subject: subject,
        from_name: 'Citas Web Maquinaria Rentería',
        message: textContent,
        client_name: appointment.customerName,
        client_phone: appointment.phone,
      }),
    });

    if (response.ok) {
      return { success: true, method: 'api' };
    }
  } catch (error) {
    console.warn('API email delivery background attempt:', error);
  }

  return { success: true, method: 'local' };
}
