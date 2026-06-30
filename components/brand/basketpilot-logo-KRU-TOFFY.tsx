export const BASKETPILOT_NAME = 'BasketPilot AI';
export const BASKETPILOT_TAGLINE = 'AI ผู้ช่วยปั้นคลิปรีวิว ให้พร้อมปักตะกร้าอย่างปลอดภัย';

type LogoProps = {
  className?: string;
  showText?: boolean;
  showTagline?: boolean;
  inverted?: boolean;
};

export function BasketPilotMark({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="basketpilot-ring" x1="14" y1="20" x2="82" y2="78" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8A1F" />
          <stop offset="0.48" stopColor="#FF4D6D" />
          <stop offset="1" stopColor="#5B2EFF" />
        </linearGradient>
        <linearGradient id="basketpilot-basket" x1="25" y1="37" x2="72" y2="65" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B4A" />
          <stop offset="1" stopColor="#302B7A" />
        </linearGradient>
        <filter id="basketpilot-shadow" x="-8" y="-8" width="112" height="116" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#302B7A" floodOpacity="0.16" />
        </filter>
      </defs>

      <g filter="url(#basketpilot-shadow)">
        <path
          d="M48 12C65.7 12 80 26.3 80 44C80 57.9 71.1 69.7 58.7 74.1"
          stroke="url(#basketpilot-ring)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M37.4 74.2C24.9 69.9 16 58 16 44C16 26.3 30.3 12 48 12"
          stroke="url(#basketpilot-ring)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path d="M48 4L52.4 17.7H43.6L48 4Z" fill="#FF8A1F" />
        <path d="M88 44L74.4 48.4V39.6L88 44Z" fill="#5B2EFF" />
        <path d="M8 44L21.6 39.6V48.4L8 44Z" fill="#FF8A1F" />

        <path
          d="M30 38H70L64.8 66H34.8L30 38Z"
          fill="white"
          stroke="url(#basketpilot-basket)"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path
          d="M34 38L40 28H62L68 38"
          stroke="url(#basketpilot-basket)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M45 46L59 54L45 62V46Z" fill="#FF6B4A" />
        <circle cx="37" cy="76" r="5" fill="#302B7A" />
        <circle cx="63" cy="76" r="5" fill="#302B7A" />
        <path d="M74 32C80 30 83 27 84 21C85 27 88 30 94 32C88 34 85 37 84 43C83 37 80 34 74 32Z" fill="#FFC857" />
      </g>
    </svg>
  );
}

export function BasketPilotLogo({
  className = '',
  showText = true,
  showTagline = false,
  inverted = false,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="BasketPilot AI">
      <BasketPilotMark className="h-12 w-12 shrink-0" />
      {showText ? (
        <div className="min-w-0">
          <div className="flex items-center gap-2 leading-none">
            <span className={`text-xl font-black tracking-tight ${inverted ? 'text-white' : 'text-navy'}`}>
              Basket<span className="bg-gradient-to-r from-orange via-rose to-purple bg-clip-text text-transparent">Pilot</span>
            </span>
            <span className="rounded-xl bg-gradient-to-r from-purple to-rose px-2 py-1 text-xs font-black text-white shadow-sm">
              AI
            </span>
          </div>
          {showTagline ? (
            <p className={`mt-1 text-xs font-medium ${inverted ? 'text-white/70' : 'text-slate-500'}`}>
              {BASKETPILOT_TAGLINE}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
