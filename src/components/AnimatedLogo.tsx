import { memo } from 'react';

interface AnimatedLogoProps {
  logo: string;
  alt?: string;
}

const logoStyles = `
  @keyframes logoSimple {
    0% {
      transform: scale(0.97) rotate(-6deg);
      filter: drop-shadow(0 2px 8px rgba(120,0,180,0.13));
    }
    50% {
      transform: scale(1.06) rotate(7deg);
      filter: drop-shadow(0 0 24px #a78bfa88) brightness(1.13);
    }
    100% {
      transform: scale(0.97) rotate(-6deg);
      filter: drop-shadow(0 2px 8px rgba(120,0,180,0.13));
    }
  }
  .animate-logo {
    animation: logoSimple 3.2s cubic-bezier(0.45,0,0.2,1) infinite;
    will-change: opacity, transform, filter, box-shadow;
    border-radius: 50%;
    background: transparent;
    box-shadow:
      0 0 8px 2px rgba(255, 255, 255, 0.10),
      0 0 20px 5px rgba(180, 0, 220, 0.13),
      0 4px 16px 0 rgba(0, 0, 0, 0.13);
    transition: filter 0.3s, box-shadow 0.3s, transform 0.3s;
  }
  .animate-logo:hover {
    filter: drop-shadow(0 0 0 rgba(255,255,255,0.5)) drop-shadow(0 0 16px #fff8) brightness(1.18) blur(0.5px);
    opacity: 1;
    transform: scale(1.12) rotate(8deg);
    box-shadow: 0 0 32px 12px rgba(180,0,220,0.13);
    transition: filter 0.3s, transform 0.3s, opacity 0.3s, box-shadow 0.3s;
  }
  @media (prefers-reduced-motion: reduce) {
    .animate-logo {
      animation: none;
    }
  }
`;

export const AnimatedLogo = memo(function AnimatedLogo({ logo, alt = "SSH T PROJECT" }: AnimatedLogoProps) {
  return (
    <>
      <style>{logoStyles}</style>
      <div className="relative rounded-full overflow-visible group">
        <img
          className="w-28 h-28 md:w-40 md:h-40 lg:w-28 lg:h-28 object-contain animate-logo rounded-full group-hover:animate-logoPulse"
          id="app-logo"
          src={logo}
          alt={alt}
          style={{
            filter:
              'drop-shadow(0 4px 16px rgba(80,0,120,0.18)) drop-shadow(0 1px 4px rgba(0,0,0,0.12))',
          }}
        />
        {/* Fade shadow overlays */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full animate-shadowPulse"
          style={{
            boxShadow:
              '0 0 16px 6px rgba(80,0,120,0.12), 0 0 0 2px rgba(255,255,255,0.06) inset',
            borderRadius: '50%',
          }}
        />
        {/* Extra animated glow ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-full">
          <span className="animate-glowRing block w-full h-full rounded-full border-2 border-violet-400/30" />
        </div>
        {/* Pulse ring */}
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="pulse-ring" />
        </span>
      </div>
    </>
  );
});