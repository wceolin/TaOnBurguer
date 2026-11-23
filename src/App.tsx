import { useState, useEffect, useMemo, useCallback } from 'react';
import { Flame, Lock, SearchX } from 'lucide-react';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminPanel } from './components/AdminPanel';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { CategoryTabs } from './components/CategoryTabs';
import { FloatingCartBar } from './components/FloatingCartBar';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MenuCard } from './components/MenuCard';
import { MenuSkeleton } from './components/MenuSkeleton';
import { ProductModal } from './components/ProductModal';
import { ToastContainer } from './components/ToastContainer';
import {
  DEFAULT_CATEGORIES,
  HERO_IMAGE_STORAGE_KEY,
  HERO_IMAGE_URL,
  STORE_OPEN_STORAGE_KEY,
  TAONBURGER_CACHE_KEY,
} from './data/fallbackData';
import {
  fetchInitialData,
  readInitialDataCache,
  saveBannerConfig,
  writeInitialDataCache,
} from './services/api';
import type { CartItem, MenuItem, ToastMessage, ToastType } from './types';

function readInitialStoreOpen(): boolean {
  try {
    const saved = window.localStorage.getItem(STORE_OPEN_STORAGE_KEY);
    if (saved === null) return true;
    return saved === 'true';
  } catch {
    return true;
  }
}

export default function App() {
  const [initialCache] = useState(() => readInitialDataCache());

  const [menuItems, setMenuItems] = useState<MenuItem[]>(
    () => initialCache?.cardapio ?? []
  );
  const [loadingMenu, setLoadingMenu] = useState<boolean>(() => !initialCache);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(readInitialStoreOpen);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(
    () => initialCache?.bannerUrl ?? null
  );
  const [loadingBanner, setLoadingBanner] = useState<boolean>(() => !initialCache);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleToggleStoreOpen = useCallback(
    (open: boolean) => {
      setIsStoreOpen(open);
      try {
        window.localStorage.setItem(STORE_OPEN_STORAGE_KEY, String(open));
      } catch {
        // Ignore storage errors
      }
      showToast(
        open ? 'Status alterado para Aberto Agora' : 'Status alterado para Fechado',
        open ? 'success' : 'info'
      );
    },
    [showToast]
  );

  const handleUpdateHeroImage = useCallback(
    async (newUrl: string) => {
      const cleaned = newUrl.trim() || HERO_IMAGE_URL;
      await saveBannerConfig(cleaned);
      setHeroImageUrl(cleaned);
      setLoadingBanner(false);
      try {
        window.localStorage.setItem(HERO_IMAGE_STORAGE_KEY, cleaned);
      } catch {
        // Ignore storage errors
      }
      showToast('Banner da campanha atualizado!', 'success');
    },
    [showToast]
  );

  const handleAdminMenuChanged = useCallback(
    (updated: MenuItem[]) => {
      setMenuItems(updated);
      writeInitialDataCache({
        cardapio: updated,
        bannerUrl: heroImageUrl || HERO_IMAGE_URL,
      });
    },
    [heroImageUrl]
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_OPEN_STORAGE_KEY && e.newValue !== null) {
        setIsStoreOpen(e.newValue === 'true');
      }
      if (e.key === HERO_IMAGE_STORAGE_KEY) {
        setHeroImageUrl(e.newValue && e.newValue.trim() ? e.newValue : HERO_IMAGE_URL);
      }
      if (e.key === TAONBURGER_CACHE_KEY) {
        const refreshed = readInitialDataCache();
        if (refreshed) {
          setMenuItems(refreshed.cardapio);
          setHeroImageUrl(refreshed.bannerUrl);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { cardapio, bannerUrl } = await fetchInitialData();
        if (mounted) {
          setMenuItems(cardapio);
          setHeroImageUrl(bannerUrl);
        }
      } finally {
        if (mounted) {
          setLoadingMenu(false);
          setLoadingBanner(false);
        }
      }
    };
    void load();

    const intervalId = window.setInterval(() => {
      if (!isAdminMode) {
        void load();
      }
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [isAdminMode]);

  // Only show items where Disponivel is true
  const availableItems = useMemo(
    () => menuItems.filter((item) => item.Disponivel),
    [menuItems]
  );

  // Merge default categories with any extra categories coming from Google Sheets (excluding Porções)
  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    availableItems.forEach((item) => {
      const cat = item.Categoria?.trim();
      if (cat && !cat.toLowerCase().includes('porç') && !cat.toLowerCase().includes('porc')) {
        set.add(cat);
      }
    });
    return Array.from(set);
  }, [availableItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return availableItems.filter((item) => {
      const matchesCategory =
        activeCategory === 'Todos' ||
        item.Categoria.toLowerCase() === activeCategory.toLowerCase();
      const matchesQuery =
        !q ||
        item.Nome.toLowerCase().includes(q) ||
        item.Descricao.toLowerCase().includes(q) ||
        item.Categoria.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [availableItems, activeCategory, searchQuery]);

  const handleAddToCart = useCallback(
    (menuItem: MenuItem, quantity = 1, notes = '') => {
      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.menuItem.ID === menuItem.ID && c.notes === notes
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }
        return [
          ...prev,
          {
            cartItemId: `${menuItem.ID}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            menuItem,
            quantity,
            notes,
          },
        ];
      });
      showToast(`${menuItem.Nome} adicionado à sacola`, 'success');
    },
    [showToast]
  );

  const handleUpdateCartQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.cartItemId === cartItemId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const handleRemoveCartItem = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.cartItemId !== cartItemId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.menuItem.Preco * item.quantity, 0),
    [cart]
  );

  if (isAdminMode) {
    return (
      <>
        <AdminPanel
          isStoreOpen={isStoreOpen}
          onToggleStoreOpen={handleToggleStoreOpen}
          heroImageUrl={heroImageUrl || HERO_IMAGE_URL}
          onUpdateHeroImage={handleUpdateHeroImage}
          onClose={() => setIsAdminMode(false)}
          onMenuChanged={handleAdminMenuChanged}
          onShowToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <HeroSection
        isStoreOpen={isStoreOpen}
        heroImageUrl={heroImageUrl}
        loadingBanner={loadingBanner}
      />

      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
              {activeCategory === 'Todos' ? 'Cardápio' : activeCategory}
            </h2>
            {!loadingMenu && (
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                {filteredItems.length}{' '}
                {filteredItems.length === 1 ? 'opção disponível' : 'opções disponíveis'}
              </p>
            )}
          </div>
        </div>

        {loadingMenu ? (
          <MenuSkeleton />
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl bg-[#1E1E1E] border border-white/[0.06] p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#121212] border border-white/[0.08] flex items-center justify-center text-zinc-400 mx-auto">
              <SearchX className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-display font-semibold text-lg text-white">
                Nenhum item encontrado
              </p>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                Não encontramos pratos para sua busca ou categoria atual.
              </p>
            </div>
            {(searchQuery || activeCategory !== 'Todos') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Todos');
                }}
                className="h-10 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] text-[#121212] font-semibold text-sm cursor-pointer"
              >
                Ver todo o cardápio
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredItems.map((item, index) => (
              <MenuCard
                key={item.ID}
                item={item}
                priority={index < 4}
                onSelect={setSelectedProduct}
                onQuickAdd={(selected) => handleAddToCart(selected, 1, '')}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer with discreet Admin Lock access */}
      <footer
        className={`border-t border-white/[0.06] bg-[#121212] ${
          cartCount > 0 ? 'pb-20' : 'pb-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF6B00]" />
            <span>Tá On Burger · Hamburgueria Artesanal</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Todos os direitos reservados</span>
            <button
              type="button"
              onClick={() => setIsAdminAuthOpen(true)}
              aria-label="Acessar Painel Administrativo"
              title="Painel Administrativo"
              className="w-9 h-9 rounded-lg hover:bg-[#1E1E1E] text-zinc-500 hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      <FloatingCartBar
        itemCount={cartCount}
        total={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <ProductModal
        item={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartCheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onShowToast={showToast}
      />

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => setIsAdminMode(true)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
