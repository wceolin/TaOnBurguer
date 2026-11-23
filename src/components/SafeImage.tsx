import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SafeImage({ src, alt, className = '', fallbackLabel }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || !src.trim() || hasError) {
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
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
