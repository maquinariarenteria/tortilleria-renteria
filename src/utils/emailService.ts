import { CustomerQuote, AdminSaleOrder, Appointment } from '../types/admin';
import { storeRequest } from '../services/storeApi';

// Requests are saved durably in the administrator. Email delivery is not configured.
export async function sendContactInquiryEmail({ name, phone, email = '', message, machineName, city = 'Por confirmar' }: { name: string; phone: string; email?: string; message: string; machineName?: string; city?: string }): Promise<{ success: boolean; method: string; quote: CustomerQuote }> {
  const requestId = crypto.randomUUID();
  const record = { customerName: name.trim(), phone: phone.trim(), email: email.trim(), stateOrCity: city,
    businessType: 'Otro', items: machineName ? [{ machineId: '', name: machineName, quantity: 1, price: 0 }] : [], estimatedTotal: 0, status: 'Nueva', priority: 'Alta', notes: message };
  const data = await storeRequest('/api/notify/quote', { method: 'POST', body: JSON.stringify({ requestId, record }) });
  return { success: true, method: 'admin', quote: data.record };
}
export async function sendAppointmentNotificationEmail({ appointment }: { appointment: Appointment }): Promise<{ success: boolean; method: string; appointment: Appointment }> {
  const data = await storeRequest('/api/notify/appointment', { method: 'POST', body: JSON.stringify({ requestId: appointment.id, record: appointment }) });
  return { success: true, method: 'admin', appointment: data.record };
}
export async function sendOrderNotificationEmail({ order }: { order: AdminSaleOrder; currency?: 'USD' | 'MXN' }): Promise<{ success: boolean; method: string; quote: CustomerQuote }> {
  // A WhatsApp enquiry is a lead, not a paid sale.
  return sendContactInquiryEmail({ name: order.clientName, phone: order.clientPhone,
    email: order.clientEmail === 'Por coordinar' ? '' : order.clientEmail,
    city: order.shippingCity,
    machineName: order.items.map(i => `${i.name} x${i.quantity}`).join(', '),
    message: `Solicitud de compra por WhatsApp. Pago sin confirmar. Folio de consulta: ${order.folio}. Flete y entrega por coordinar.` });
}
