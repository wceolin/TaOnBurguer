import { useState, useRef, useEffect } from 'react';
import { Clock, Flame, Search, ShoppingBag, X } from 'lucide-react';
import { formatCurrency, optimizeImageUrl } from '../utils/formatters';

interface HeaderProps {
  logoUrl?: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenMyOrders: () => void;
}

export function Header({
  logoUrl,
  searchQuery,
  onSearchChange,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenMyOrders,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const handleCloseSearch = () => {
    onSearchChange('');
    setIsSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {isSearchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search
                className="w-4 h-4 text-[#FF6B00] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCloseSearch();
                }}
                placeholder="Buscar burger, combo, bebida..."
                aria-label="Buscar no cardápio"
                className="w-full h-10 pl-10 pr-10 rounded-xl bg-[#1E1E1E] border border-[#FF6B00]/60 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpar texto da busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleCloseSearch}
              aria-label="Fechar busca"
              className="h-10 px-3 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            {/* Brand wordmark */}
            <a
              href="#top"
              className="flex items-center gap-2 text-base sm:text-lg font-display font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] rounded-lg"
            >
              {logoUrl && !logoError ? (
                <img
                  src={optimizeImageUrl(logoUrl, 200)}
                  alt="Logo Tá On! Burger"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  fetchPriority="high"
                  onError={() => setLogoError(true)}
                  className="h-10 w-10 object-contain rounded-lg shrink-0"
                />
              ) : (
                <span className="h-10 w-10 rounded-lg bg-[#FF6B00] flex items-center justify-center text-[#121212] shrink-0">
                  <Flame className="w-5 h-5 fill-current" />
                </span>
              )}
              <span>Tá On! Burger</span>
            </a>

            {/* Right actions: My Orders + Search icon + desktop bag */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenMyOrders}
                className="h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-white/[0.08] text-xs sm:text-sm font-medium text-zinc-200 hover:text-white flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF6B00] shrink-0" />
                <span>Meus Pedidos</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Abrir busca"
                title="Buscar no cardápio"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-white/[0.08] text-zinc-200 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenCart}
                className="hidden sm:flex h-11 px-4 rounded-xl bg-[#1E1E1E] hover:bg-[#27272A] border border-white/[0.08] text-sm font-semibold text-white items-center gap-2.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                <ShoppingBag className="w-4 h-4 text-[#FF6B00]" />
                <span>Sacola</span>
                {cartCount > 0 && (
                  <span className="text-xs font-mono tabular-nums text-[#F59E0B] pl-1 border-l border-white/10">
                    {cartCount} · {formatCurrency(cartTotal)}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
