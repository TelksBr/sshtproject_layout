import { memo } from 'react';

interface AnimatedLogoProps {
  logo: string;
  alt?: string;
}

export const AnimatedLogo = memo(function AnimatedLogo({ logo, alt = "SSH T PROJECT" }: AnimatedLogoProps) {
  return (
    <div className="flex justify-center">
      <img
        className="w-28 h-28 lg:w-32 lg:h-32 xl:w-40 xl:h-40 2xl:w-48 2xl:h-48 3xl:w-56 3xl:h-56 object-contain rounded-full"
        id="app-logo"
        src={logo}
        alt={alt}
        style={{
          filter:
            'drop-shadow(0 4px 16px rgba(80,0,120,0.18)) drop-shadow(0 1px 4px rgba(0,0,0,0.12))',
        }}
      />
    </div>
  );
});