import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface FloatingCartBarProps {
  itemCount: number;
  total: number;
  onOpenCart: () => void;
}

export function FloatingCartBar({ itemCount, total, onOpenCart }: FloatingCartBarProps) {
  if (itemCount === 0) return null;

  const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} itens`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#121212]/95 backdrop-blur-md border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
        <button
          type="button"
          onClick={onOpenCart}
          className="w-full h-12 px-3 sm:px-4 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] active:scale-[0.99] text-[#121212] font-bold text-xs sm:text-sm flex items-center justify-between gap-2 shadow-lg shadow-black/40 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <ShoppingBag className="w-4 h-4 shrink-0 hidden min-[400px]:block" />
            <span className="font-mono tabular-nums whitespace-nowrap">{itemLabel}</span>
            <span className="text-[#121212]/60" aria-hidden="true">
              ·
            </span>
            <span className="font-mono tabular-nums whitespace-nowrap">
              {formatCurrency(total)}
            </span>
          </div>

          <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
            <span>Ver Sacola / Finalizar Pedido</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
