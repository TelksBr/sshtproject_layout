import React, { useState, useEffect, memo } from 'react';
import { getIconSrc, subscribeIconCache } from '../utils/iconCache';

interface ConfigIconProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export const ConfigIcon = memo(function ConfigIcon({
  src,
  alt = '',
  className = 'w-6 h-6 rounded-lg object-cover',
}: ConfigIconProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(() => getIconSrc(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setCurrentSrc(getIconSrc(src));
  }, [src]);

  useEffect(() => {
    if (!src) return;

    // Se inscreve para atualizar o src quando o Base64 terminar de baixar em background
    const unsubscribe = subscribeIconCache(() => {
      const updated = getIconSrc(src);
      if (updated && updated !== currentSrc) {
        setCurrentSrc(updated);
        setHasError(false);
      }
    });

    return unsubscribe;
  }, [src, currentSrc]);

  if (!currentSrc || hasError) {
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
});

export default ConfigIcon;
