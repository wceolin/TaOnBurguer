import { SafeImage } from './SafeImage';

interface HeroSectionProps {
  isStoreOpen: boolean;
  heroImageUrl: string;
}

export function HeroSection({ isStoreOpen, heroImageUrl }: HeroSectionProps) {
  return (
    <section
      id="top"
      className="border-b border-white/[0.06] bg-[#161618]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 sm:py-8">
        {/* Burger hero image right below header */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:max-h-[380px] w-full rounded-2xl overflow-hidden bg-[#1E1E1E] border border-white/[0.08]">
          <SafeImage
            src={heroImageUrl}
            alt="Hambúrguer artesanal duplo smash com queijo cheddar derretido e bacon crocante"
            className="w-full h-full object-cover"
            fallbackLabel="Tá On Burger"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Status dot + delivery time + tagline */}
        <div className="mt-4 sm:mt-5 space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-medium text-center">
            <span className="inline-flex items-center gap-2 text-left">
              <span
                aria-hidden="true"
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isStoreOpen
                    ? 'bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.75)]'
                    : 'bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.75)]'
                }`}
              />
              <span className={isStoreOpen ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                {isStoreOpen ? 'Aberto Agora' : 'Fechado'}
              </span>
            </span>
            <span className="text-zinc-300 text-right">Entregas 30-45 min</span>
          </div>

          <h1 className="font-display font-bold text-[30px] leading-tight text-left text-white tracking-tight text-balance">
            Artesanal de verdade, suculento e feito na hora
          </h1>
        </div>
      </div>
    </section>
  );
}
