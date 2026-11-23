interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  return (
    <div className="md:sticky md:top-14 z-20 bg-[#121212]/95 md:backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Categorias do cardápio"
          className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar"
        >
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
                  isActive
                    ? 'bg-[#FF6B00] text-[#121212]'
                    : 'bg-[#1E1E1E] text-zinc-300 hover:bg-[#27272A] hover:text-white border border-white/[0.06]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
