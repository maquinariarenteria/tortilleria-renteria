import React, { useState } from 'react';
import { AdminSaleOrder } from '../../../types/admin';
import { getStoredSales, updateSaleStatus } from '../../../utils/adminStore';
import { ShoppingBag, Truck, CheckCircle2, Clock, Wrench, FileText, Download, Eye, ChevronRight } from 'lucide-react';

export const VentasTab: React.FC = () => {
  const [sales, setSales] = useState<AdminSaleOrder[]>(getStoredSales());
  const [selectedSale, setSelectedSale] = useState<AdminSaleOrder | null>(null);

  const handleStatusChange = (folio: string, status: AdminSaleOrder['manufacturingStatus']) => {
    const updated = updateSaleStatus(folio, status);
    setSales(updated);
    if (selectedSale && selectedSale.folio === folio) {
      setSelectedSale({ ...selectedSale, manufacturingStatus: status });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Órdenes y Ventas Cerradas</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              {sales.length} Pedidos
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seguimiento de ciclo de fabricación, facturación y envíos a toda la República Mexicana.
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {sales.map((order) => (
          <div
            key={order.folio}
            className="bg-[#121520] border border-[#202538] hover:border-emerald-500/30 p-5 rounded-xl shadow-lg transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c2132] pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-[#1a1f33] text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20">
                  {order.folio}
                </span>
                <span className="font-semibold text-sm text-white">{order.clientName}</span>
                <span className="text-xs text-slate-400">· {order.shippingCity}, {order.shippingState}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Estado de Maquinaria:</span>
                <select
                  value={order.manufacturingStatus}
                  onChange={(e) => handleStatusChange(order.folio, e.target.value as any)}
                  className="bg-[#181c2b] border border-[#2a3047] text-xs text-emerald-300 font-semibold px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                <span className="text-slate-400 block font-medium">Equipos Adquiridos:</span>
                {order.items.map((item, idx) => (
                  <div key={idx} className="bg-[#161a28] p-2 rounded-lg border border-[#20263b] flex justify-between">
                    <span className="text-slate-200">{item.name} x{item.quantity}</span>
                    <span className="text-white font-semibold">${item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Shipping & Payment */}
              <div className="space-y-1 text-slate-400">
                <span className="text-slate-300 block font-medium">Pago y Facturación:</span>
                <p>Método: <b className="text-white">{order.paymentMethod}</b></p>
                <p>Factura: {order.requiresInvoice ? <b className="text-emerald-400">Solicitada ({order.rfc})</b> : 'No requerida'}</p>
                <p>Flete: <span className="text-white">${order.shippingCost.toLocaleString()} MXN</span></p>
                {order.trackingNumber && (
                  <p className="text-cyan-300 font-mono text-[11px]">Guía: {order.trackingNumber}</p>
                )}
              </div>

              {/* Total & Actions */}
              <div className="flex flex-col justify-between items-start md:items-end space-y-2">
                <div className="text-left md:text-right">
                  <span className="text-slate-400 text-[11px] block">Total Facturado</span>
                  <span className="text-lg font-black text-emerald-400">
                    ${order.total.toLocaleString()} MXN
                  </span>
                  <span className="text-[10px] text-slate-500 block">IVA incluido</span>
                </div>

                <button
                  onClick={() => alert(`Generando nota de venta en PDF para ${order.folio}...`)}
                  className="bg-[#1c2030] hover:bg-[#252b40] text-slate-300 border border-[#2d344e] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
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
