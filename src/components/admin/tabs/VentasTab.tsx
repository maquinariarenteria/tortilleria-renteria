import React from 'react';
import { AdminSaleOrder } from '../../../types/admin';
import { updateSaleStatus, getAdminToken } from '../../../utils/adminStore';
import { useAdminSales } from '../../../hooks/useAdminSales';
import { formatCurrency } from '../../../utils/formatters';
import { FileText, Truck, CheckCircle2, Clock } from 'lucide-react';

export const VentasTab: React.FC = () => {
  const { orders, setSales, remoteSales, setRemoteSales, remoteError, setRemoteError, loading } = useAdminSales();

  const handleStatusChange = async (folio: string, status: AdminSaleOrder['manufacturingStatus']) => {
    if (remoteSales.some(order => order.folio === folio)) {
      try {
        const response = await fetch(`/api/admin/stripe-orders/${encodeURIComponent(folio)}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken() || ''}` },
          body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('No se pudo guardar el estado de fabricación.');
        setRemoteSales(current => current.map(order => order.folio === folio ? { ...order, manufacturingStatus: status } : order));
        setRemoteError('');
      } catch (error) { setRemoteError(error instanceof Error ? error.message : 'No se pudo guardar.'); }
      return;
    }
    const updated = updateSaleStatus(folio, status);
    setSales(updated);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span>Órdenes y Ventas de Maquinaria</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {orders.length} Pedidos
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Seguimiento de fabricación y pago. El CFDI y la guía de transporte se coordinan con el vendedor.
          </p>
        </div>
      </div>

      {remoteError && <p role="alert" className="text-sm text-amber-700">{remoteError}</p>}
      {/* Orders List */}
      <div className="space-y-4">
        {loading && orders.length === 0 ? <p className="text-sm text-slate-500">Consultando pagos de Stripe…</p> : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Sin ventas registradas aún</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Los pagos confirmados por Stripe aparecerán aquí. Las solicitudes de WhatsApp se consultan en Cotizaciones.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.folio}
              className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl shadow-sm transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-blue-50 text-[#2563eb] px-2.5 py-1 rounded border border-blue-200">
                    {order.folio}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{order.clientName}</span>
                  <span className="text-xs text-slate-500 font-medium">· {order.shippingCity || 'México'}, {order.shippingState || ''}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Fabricación:</span>
                  <select
                    value={order.manufacturingStatus}
                    onChange={(e) => handleStatusChange(order.folio, e.target.value as any)}
                    className="bg-slate-50 border border-slate-300 text-xs text-slate-900 font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#2563eb] cursor-pointer"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Fabricación">En Fabricación</option>
                    <option value="Probada en Banco">Probada en Banco</option>
                    <option value="Embarcada">Embarcada</option>
                    <option value="Entregada">Entregada</option>
                  </select>
                </div>
              </div>

              {/* Content Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                {/* Items */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Equipos Adquiridos:</span>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between font-medium">
                      <span className="text-slate-800">{item.name} x{item.quantity}</span>
                      <span className="text-slate-900 font-mono font-bold">{formatCurrency(item.total, order.currency || 'MXN')}</span>
                    </div>
                  ))}
                </div>

                {/* Shipping & Payment */}
                <div className="space-y-1 text-slate-600 font-medium">
                  <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Pago y Facturación:</span>
                  <p>Método: <b className="text-slate-900">{order.paymentMethod}</b></p>
                  {order.stripeSessionId && <>
                    <p className="text-emerald-700 font-bold">Pago completo confirmado</p>
                    <p>Pagado: {formatCurrency(order.amountPaid || 0, order.currency || 'MXN')}</p>
                    <p>Saldo: {formatCurrency(order.balanceDue || 0, order.currency || 'MXN')}</p>
                  </>}
                  <p>Factura: {order.requiresInvoice ? <b className="text-emerald-700">CFDI Solicitado ({order.rfc})</b> : 'Nota de Venta'}</p>
                  <p>Flete: <span className="text-slate-900 font-medium">{order.shippingCost > 0 ? `$${order.shippingCost.toLocaleString()} MXN` : 'A acordar con el vendedor'}</span></p>
                  {order.trackingNumber && (
                    <p className="text-[#2563eb] font-mono text-[11px] font-bold">Guía Castores/TresGuerras: {order.trackingNumber}</p>
                  )}
                </div>

                {/* Total & Actions */}
                <div className="flex flex-col justify-between items-start md:items-end space-y-2">
                  <div className="text-left md:text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Total del pedido</span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {formatCurrency(order.total, order.currency || 'MXN')} {order.currency || 'MXN'}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-medium">Flete a coordinar con fletera</span>
                  </div>

                  <button
                    disabled
                    title="La emisión de notas PDF y CFDI todavía no está configurada."
                    className="bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#60a5fa]" />
                    <span>Nota PDF pendiente de configurar</span>
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
