import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { optimizeImageUrl } from '../utils/formatters';

interface PWAInstallBannerProps {
  logoUrl?: string | null;
}

export function PWAInstallBanner({ logoUrl }: PWAInstallBannerProps) {
  const { isInstallable, isInstalled, isIOS, isDismissed, install, dismiss } =
    usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || isDismissed) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  const iconSrc = logoUrl ? optimizeImageUrl(logoUrl, 128) : '/logo-192.png';

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    if (isIOS) {
      setShowIOSGuide((prev) => !prev);
    }
  };

  return (
    <section
      aria-label="Instalar aplicativo"
      className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-5"
    >
      <div className="rounded-2xl bg-[#1E1E1E] border border-white/[0.08] p-3.5 sm:px-5 sm:py-3.5 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={iconSrc}
              alt="Logo Tá On! Burger"
              referrerPolicy="no-referrer"
              className="h-10 w-10 object-contain rounded-lg bg-black shrink-0 border border-white/[0.08]"
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-display font-bold text-white truncate">
                Instalar App Tá On! Burger
              </p>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                Peça mais rápido direto da tela inicial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="h-9 px-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7D1F] text-[#121212] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Instalar</span>
            </button>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar aviso de instalação"
              className="w-9 h-9 rounded-xl bg-[#121212] hover:bg-zinc-800 border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSGuide && isIOS && !isInstallable && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2.5 text-xs text-zinc-300">
            <Share className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span>
              Toque em <strong className="text-white">Compartilhar</strong> e depois em{' '}
              <strong className="text-white">&lsquo;Adicionar à Tela de Início&rsquo;</strong>.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
