import React from 'react';
import { MachineProduct } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Plus, Check } from 'lucide-react';

interface ProductCardProps {
  machine: MachineProduct;
  currency: 'USD' | 'MXN';
  onSelect: (machine: MachineProduct) => void;
  onAddToCart: (machine: MachineProduct) => void;
  isInCart: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  machine,
  currency,
  onSelect,
  onAddToCart,
  isInCart,
}) => {
  const price = currency === 'MXN' ? machine.priceMXN : machine.priceUSD;

  return (
    <div className="flat-card rounded-xl p-3.5 flex flex-col justify-between">
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

          <div className="mt-1 text-sm font-mono font-black text-[#2563eb]">
            {formatCurrency(price, currency)}
          </div>

          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Sobre pedido • + Envío
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <button
          onClick={() => onAddToCart(machine)}
          className="w-full btn-flat-primary py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs"
        >
          {isInCart ? (
            <>
              <Check size={13} />
              EN CARRITO
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
          className="w-full py-1 text-[10px] font-bold uppercase text-slate-500 hover:text-[#2563eb] transition-colors text-center"
        >
          Ver Detalles
        </button>
      </div>
    </div>
  );
};
