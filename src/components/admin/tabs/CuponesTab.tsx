import React, { useState } from 'react';
import { Coupon } from '../../../types/admin';
import { getStoredCoupons, saveStoredCoupons } from '../../../utils/adminStore';
import { Tag, Plus, CheckCircle2, XCircle, Trash2, X } from 'lucide-react';

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
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Cupones y Descuentos</span>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
              {coupons.filter(c => c.isActive).length} Activos
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crea códigos de descuento para promociones en ferias, exposiciones o clientes recurrentes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#6366f1] hover:bg-[#5255e3] active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
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
            className="bg-[#121520] border border-[#202538] hover:border-purple-500/30 p-5 rounded-xl shadow-lg transition-all space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-base font-extrabold text-white bg-[#1a1f33] px-3 py-1 rounded-lg border border-purple-500/30 tracking-wider">
                  {coupon.code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  coupon.isActive ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'
                }`}>
                  {coupon.isActive ? 'Activo' : 'Pausado'}
                </span>
              </div>

              <div className="text-xl font-black text-purple-300 mt-2">
                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue.toLocaleString()} MXN OFF`}
              </div>

              <div className="text-xs text-slate-400 space-y-1 mt-3">
                <p>Compra mínima: <b className="text-slate-200">${coupon.minPurchaseAmount.toLocaleString()} MXN</b></p>
                <p>Usos: <b className="text-white">{coupon.usedCount}</b> de {coupon.maxUses} permitidos</p>
                <p>Vigencia: <span className="text-slate-300">{coupon.expiresAt}</span></p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1c2032] flex items-center justify-between text-xs">
              <button
                onClick={() => handleToggleActive(coupon.id)}
                className="text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                {coupon.isActive ? 'Pausar Cupón' : 'Activar Cupón'}
              </button>
              <button
                onClick={() => handleDelete(coupon.id)}
                className="text-slate-500 hover:text-rose-400 cursor-pointer p-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121520] border border-[#242b42] rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#202538] pb-3">
              <h3 className="text-sm font-bold text-white">Nuevo Código Promocional</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Código del Cupón</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EJ. RENTERIA2026"
                  className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo Descuento</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Valor</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mínimo Compra (MXN)</label>
                  <input
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(Number(e.target.value))}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Usos Máximos</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fecha de Expiración</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#181c2b] hover:bg-[#20263a] text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5255e3] text-white font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
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
