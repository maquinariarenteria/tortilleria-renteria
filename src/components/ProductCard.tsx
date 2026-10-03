import React, { useState } from 'react';
import { MachineProduct, ProductVariant } from '../types';
import { formatCurrency, getProductPrice } from '../utils/formatters';
import { Plus, Check } from 'lucide-react';

interface ProductCardProps {
  machine: MachineProduct;
  currency: 'USD' | 'MXN';
  onSelect: (machine: MachineProduct) => void;
  onAddToCart: (machine: MachineProduct, variant?: ProductVariant) => void;
  isInCart: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  machine,
  currency,
  onSelect,
  onAddToCart,
  isInCart,
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    return machine.variants && machine.variants.length > 0 ? machine.variants[0].id : '';
  });
  const [addedJustNow, setAddedJustNow] = useState(false);

  const selectedVariant = machine.variants?.find((v) => v.id === selectedVariantId) || machine.variants?.[0];
  const price = getProductPrice(machine, selectedVariant, currency);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(machine, selectedVariant);
    setAddedJustNow(true);
    setTimeout(() => setAddedJustNow(false), 1500);
  };

  return (
    <div className="flat-card rounded-xl p-3.5 flex flex-col justify-between group hover:border-[#2563eb]">
      <div>
        <div
          onClick={() => onSelect(machine)}
          className="w-full h-36 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2 cursor-pointer hover:border-[#2563eb] transition-all relative overflow-hidden group/img"
        >
          {machine.imageUrl ? (
            <img
              src={machine.imageUrl}
              alt={machine.name}
              loading="lazy"
              className="w-full h-full object-contain object-center transition-transform duration-300 group-hover/img:scale-105"
            />
          ) : (
            <span className="font-mono text-xs text-slate-400">
              [{machine.sku}]
            </span>
          )}

          {machine.badge && (
            <span className="absolute top-1.5 left-1.5 text-[8px] font-extrabold bg-[#2563eb] text-white px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
              {machine.badge}
            </span>
          )}
        </div>

        <div className="mt-3 text-center">
          <h4
            onClick={() => onSelect(machine)}
            className="text-xs font-bold text-slate-900 uppercase cursor-pointer hover:text-[#2563eb] transition-colors line-clamp-1"
            title={machine.name}
          >
            {machine.name}
          </h4>

          {/* Quick variant selector if machine has variants */}
          {machine.variants && machine.variants.length > 0 && (
            <div className="mt-1.5">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-[10px] font-bold py-1 px-1.5 rounded-md border border-slate-300 bg-slate-50 focus:border-[#2563eb] text-slate-800 cursor-pointer"
              >
                {machine.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name.replace('Medida ', '').replace('Capacidad ', '')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-1.5 text-sm font-mono font-black text-[#2563eb]">
            {formatCurrency(price, currency)}
          </div>

          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Sobre pedido • + Envío a acordar
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <button
          onClick={handleAdd}
          className={`w-full py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer ${
            addedJustNow || isInCart
              ? 'bg-emerald-600 text-white'
              : 'btn-flat-primary'
          }`}
        >
          {addedJustNow ? (
            <>
              <Check size={13} />
              ¡AGREGADO!
            </>
          ) : isInCart ? (
            <>
              <Check size={13} />
              EN CARRITO (+)
            </>
          ) : (
            <>
              <Plus size={13} />
              AGREGAR AL CARRITO
            </>
          )}
        </button>

        <button
          onClick={() => onSelect(machine)}
          className="w-full py-1 text-[10px] font-bold uppercase text-slate-500 hover:text-[#2563eb] transition-colors text-center cursor-pointer"
        >
          Ver Detalles
        </button>
      </div>
    </div>
  );
};
