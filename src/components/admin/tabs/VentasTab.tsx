import React, { useState } from 'react';
import { AdminSaleOrder } from '../../../types/admin';
import { getStoredSales, updateSaleStatus } from '../../../utils/adminStore';
import { FileText, Truck, CheckCircle2, Clock } from 'lucide-react';

export const VentasTab: React.FC = () => {
  const [sales, setSales] = useState<AdminSaleOrder[]>(getStoredSales());

  const handleStatusChange = (folio: string, status: AdminSaleOrder['manufacturingStatus']) => {
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
              {sales.length} Pedidos
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Seguimiento de ciclo de fabricación en planta (Delicias, Chih.), facturación con CFDI y guías de transporte.
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {sales.map((order) => (
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
                <span className="text-xs text-slate-500 font-medium">· {order.shippingCity}, {order.shippingState}</span>
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
                    <span className="text-slate-900 font-mono font-bold">${item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Shipping & Payment */}
              <div className="space-y-1 text-slate-600 font-medium">
                <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Pago y Facturación:</span>
                <p>Método: <b className="text-slate-900">{order.paymentMethod}</b></p>
                <p>Factura: {order.requiresInvoice ? <b className="text-emerald-700">CFDI Solicitado ({order.rfc})</b> : 'Nota de Venta'}</p>
                <p>Flete: <span className="text-slate-900 font-mono font-bold">${order.shippingCost.toLocaleString()} MXN</span></p>
                {order.trackingNumber && (
                  <p className="text-[#2563eb] font-mono text-[11px] font-bold">Guía Castores/TresGuerras: {order.trackingNumber}</p>
                )}
              </div>

              {/* Total & Actions */}
              <div className="flex flex-col justify-between items-start md:items-end space-y-2">
                <div className="text-left md:text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Total Facturado</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    ${order.total.toLocaleString()} MXN
                  </span>
                  <span className="text-[10px] text-slate-500 block font-medium">IVA y seguro de flete incluidos</span>
                </div>

                <button
                  onClick={() => alert(`Generando nota de venta / cotización formal en PDF para ${order.folio}...`)}
                  className="bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[#60a5fa]" />
                  <span>Nota de Venta PDF</span>
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
