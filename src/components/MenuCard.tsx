import { Plus } from 'lucide-react';
import type { MenuItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface MenuCardProps {
  item: MenuItem;
  priority?: boolean;
  onSelect: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

export function MenuCard({
  item,
  priority = false,
  onSelect,
  onQuickAdd,
}: MenuCardProps) {
  return (
    <article
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes de ${item.Nome}`}
      className="group bg-[#1E1E1E] hover:bg-[#242427] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl overflow-hidden flex flex-row md:flex-col justify-between transition-all duration-150 md:hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
    >
      {/* Desktop top image (4:3) */}
      <div className="hidden md:block relative aspect-[4/3] w-full bg-[#171719] overflow-hidden">
        <SafeImage
          src={item.Imagem_URL}
          alt={item.Nome}
          fallbackLabel={item.Nome}
          optimizeWidth={500}
          priority={priority}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      {/* Text & action content */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-0">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-zinc-400">{item.Categoria}</p>
          <h3 className="font-display font-semibold text-base sm:text-lg text-white leading-snug line-clamp-1">
            {item.Nome}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-2">
            {item.Descricao}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <span className="font-mono font-semibold text-base sm:text-lg text-[#F59E0B] tabular-nums whitespace-nowrap">
            {formatCurrency(item.Preco)}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(item);
            }}
            className="min-h-[40px] sm:min-h-[42px] px-3.5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] active:scale-[0.98] text-[#121212] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Mobile right-side square/4:3 thumbnail */}
      <div className="md:hidden w-28 sm:w-32 shrink-0 p-3 pl-0 flex items-center">
        <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#171719] border border-white/[0.06]">
          <SafeImage
            src={item.Imagem_URL}
            alt={item.Nome}
            fallbackLabel={item.Nome}
            optimizeWidth={500}
            priority={priority}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </article>
  );
}
