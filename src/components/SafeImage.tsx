import { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
import { optimizeImageUrl } from '../utils/formatters';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  optimizeWidth?: number;
  priority?: boolean;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  optimizeWidth,
  priority = false,
}: SafeImageProps) {
  const resolvedSrc = optimizeWidth
    ? optimizeImageUrl(src ?? undefined, optimizeWidth)
    : (src?.trim() ?? '');

  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [resolvedSrc]);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#232326] via-[#1B1B1E] to-[#141416] text-zinc-500 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Flame className="w-7 h-7 text-[#FF6B00]/60 mb-1.5" strokeWidth={1.75} />
        {fallbackLabel && (
          <span className="text-[11px] font-medium text-zinc-400 px-2 text-center line-clamp-1">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 shimmer-dark pointer-events-none"
        />
      )}
      <img
        ref={imgRef}
        src={resolvedSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...(priority ? { fetchPriority: 'high' as const } : {})}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
