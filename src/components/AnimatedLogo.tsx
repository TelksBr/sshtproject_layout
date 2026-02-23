import { memo } from 'react';

interface AnimatedLogoProps {
  logo: string;
  alt?: string;
}

export const AnimatedLogo = memo(function AnimatedLogo({ logo, alt = "SSH T PROJECT" }: AnimatedLogoProps) {
  return (
    <div className="flex justify-center">
      <img
        className="w-28 h-28 lg:w-32 lg:h-32 object-contain rounded-full"
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