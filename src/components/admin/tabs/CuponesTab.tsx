import React, { useState } from 'react';
import { Coupon } from '../../../types/admin';
import { getStoredCoupons, saveStoredCoupons } from '../../../utils/adminStore';
import { Tag, Plus, Trash2, X } from 'lucide-react';

export const CuponesTab: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(getStoredCoupons());
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minPurchase, setMinPurchase] = useState(50000);
  const [maxUses, setMaxUses] = useState(15);
  const [expiresAt, setExpiresAt] = useState('');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCup: Coupon = {
      id: `cup_${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minPurchaseAmount: Number(minPurchase),
      maxUses: Number(maxUses),
      usedCount: 0,
      startDate: new Date().toISOString().split('T')[0],
      expiresAt: expiresAt || '2026-12-31',
      isActive: true,
    };

    const updated = [newCup, ...coupons];
    saveStoredCoupons(updated);
    setCoupons(updated);
    setShowModal(false);
    setCode('');
  };

  const handleToggleActive = (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    saveStoredCoupons(updated);
    setCoupons(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Deseas eliminar este cupón?')) {
      const updated = coupons.filter(c => c.id !== id);
      saveStoredCoupons(updated);
      setCoupons(updated);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span>Cupones y Promociones Oficiales</span>
            <span className="text-xs bg-blue-50 text-[#2563eb] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {coupons.filter(c => c.isActive).length} Activos
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Crea códigos de descuento para ferias ganaderas, exposiciones de tortilla o clientes frecuentes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Cupón</span>
        </button>
      </div>

      {/* Grid of Coupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl shadow-sm transition-all space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-base font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 tracking-wider">
                  {coupon.code}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  coupon.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {coupon.isActive ? 'Activo' : 'Pausado'}
                </span>
              </div>

              <div className="text-xl font-black text-[#2563eb] mt-2 font-mono">
                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% DE DESCUENTO` : `$${coupon.discountValue.toLocaleString()} MXN BONIFICADOS`}
              </div>

              <div className="text-xs text-slate-600 space-y-1 mt-3 font-medium">
                <p>Compra mínima: <b className="text-slate-900">${coupon.minPurchaseAmount.toLocaleString()} MXN</b></p>
                <p>Usos registrados: <b className="text-slate-900">{coupon.usedCount}</b> de {coupon.maxUses} permitidos</p>
                <p>Vigencia: <span className="text-slate-800 font-semibold">{coupon.expiresAt}</span></p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => handleToggleActive(coupon.id)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider cursor-pointer"
              >
                {coupon.isActive ? 'Pausar Cupón' : 'Activar Cupón'}
              </button>
              <button
                onClick={() => handleDelete(coupon.id)}
                className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 transition-colors"
                title="Eliminar cupón"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Nuevo Cupón Promocional</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Código del Cupón</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EJ. RENTERIA2026"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Tipo Descuento</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Valor</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Mínimo Compra (MXN)</label>
                  <input
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Usos Máximos</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">Fecha de Expiración</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Guardar Cupón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
