import { useState, useEffect } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import type { MenuItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface ProductModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, notes: string) => void;
}

export function ProductModal({ item, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setNotes('');
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  if (!item) return null;

  const subtotal = item.Preco * quantity;

  const handleConfirm = () => {
    onAddToCart(item, quantity, notes.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] bg-[#1E1E1E] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden w-10 h-1.5 bg-zinc-700 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Close button over image */}
        <div className="relative aspect-[4/3] w-full bg-[#161618] shrink-0">
          <SafeImage
            src={item.Imagem_URL}
            alt={item.Nome}
            fallbackLabel={item.Nome}
            optimizeWidth={800}
            priority
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-[#121212]/80 hover:bg-[#121212] text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[#F59E0B]">{item.Categoria}</span>
              <span className="font-mono font-semibold text-base text-white tabular-nums">
                {formatCurrency(item.Preco)}
              </span>
            </div>
            <h2
              id="product-modal-title"
              className="font-display font-bold text-xl sm:text-2xl text-white"
            >
              {item.Nome}
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">{item.Descricao}</p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="product-notes"
              className="block text-sm font-medium text-zinc-200"
            >
              Observações
            </label>
            <textarea
              id="product-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, ponto da carne bem passado, maionese à parte..."
              className="w-full rounded-xl bg-[#121212] border border-white/[0.1] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] resize-none"
            />
          </div>
        </div>

        {/* Sticky bottom actions */}
        <div className="p-4 sm:p-5 bg-[#18181A] border-t border-white/[0.08] flex items-center gap-3 shrink-0">
          <div className="flex items-center bg-[#121212] border border-white/[0.08] rounded-xl">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1}
              className="w-11 h-12 flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-mono font-semibold text-sm text-white tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Aumentar quantidade"
              className="w-11 h-12 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-12 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] active:scale-[0.99] text-[#121212] font-bold text-sm sm:text-base flex items-center justify-between transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>Adicionar</span>
            <span className="font-mono tabular-nums">{formatCurrency(subtotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
