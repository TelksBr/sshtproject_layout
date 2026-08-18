import { memo } from 'react';

interface AnimatedLogoProps {
  logo: string;
  alt?: string;
}

export const AnimatedLogo = memo(function AnimatedLogo({ logo, alt = "SSH T PROJECT" }: AnimatedLogoProps) {
  return (
    <div className="flex justify-center landscape-hide-logo py-2">
      <img
        className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 object-contain"
        id="app-logo"
        src={logo}
        alt={alt}
      />
    </div>
  );
});
