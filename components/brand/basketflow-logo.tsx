export const BASKETFLOW_NAME = 'BasketFlow AI';
export const BASKETFLOW_TAGLINE = 'จัดการงานปักตะกร้าแบบครบขั้นตอน';
export const BASKETFLOW_DESCRIPTION = 'เปลี่ยนลิงก์สินค้าเป็นสคริปต์ คลิป ลิงก์ Affiliate และผลลัพธ์ในระบบเดียว';

type LogoProps = {
  className?: string;
  idPrefix?: string;
  showText?: boolean;
  showTagline?: boolean;
  inverted?: boolean;
};

export function BasketFlowMark({ className = 'h-12 w-12', idPrefix = 'basketflow' }: { className?: string; idPrefix?: string }) {
  const flowId = `${idPrefix}-flow`;
  const accentId = `${idPrefix}-accent`;
  const shadowId = `${idPrefix}-shadow`;

  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={flowId} x1="12" y1="20" x2="84" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06B6D4" />
          <stop offset="0.32" stopColor="#2563EB" />
          <stop offset="0.62" stopColor="#8B5CF6" />
          <stop offset="0.82" stopColor="#EC4899" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={accentId} x1="18" y1="68" x2="82" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="0.55" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <filter id={shadowId} x="-8" y="-8" width="112" height="112" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#2563EB" floodOpacity="0.18" />
        </filter>
      </defs>
      <g filter={`url(#${shadowId})`}>
        <path d="M18 29C30 14 48 18 48 34C48 50 66 50 77 37" stroke={`url(#${flowId})`} strokeWidth="9" strokeLinecap="round" />
        <path d="M18 67C30 82 48 78 48 62C48 46 66 46 78 59" stroke={`url(#${accentId})`} strokeWidth="9" strokeLinecap="round" />
        <circle cx="18" cy="29" r="10" fill="#10B981" />
        <path d="M14 29h8M16 25l-4 4 4 4M20 25l4 4-4 4" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="48" cy="48" r="14" fill="white" stroke={`url(#${flowId})`} strokeWidth="5" />
        <path d="M44 39.5 57 48l-13 8.5v-17Z" fill="#8B5CF6" />
        <circle cx="78" cy="59" r="10" fill="#F59E0B" />
        <path d="M73 63V57M78 63V53M83 63V49" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M80 31h8v-8" stroke="#EC4899" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m87 24-10 10" stroke="#EC4899" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function BasketFlowLogo({
  className = '',
  idPrefix = 'basketflow',
  showText = true,
  showTagline = false,
  inverted = false,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label={BASKETFLOW_NAME}>
      <BasketFlowMark className="h-12 w-12 shrink-0" idPrefix={idPrefix} />
      {showText ? (
        <div className="min-w-0">
          <div className="flex items-center gap-2 leading-none">
            <span className={`text-xl font-black tracking-tight ${inverted ? 'text-white' : 'text-navy'}`}>
              Basket<span className="bg-gradient-to-r from-cyan via-blue to-purple bg-clip-text text-transparent">Flow</span>
            </span>
            <span className="rounded-xl bg-gradient-to-r from-purple via-pink to-orange px-2 py-1 text-xs font-black text-white shadow-sm">
              AI
            </span>
          </div>
          {showTagline ? (
            <p className={`mt-1 text-xs font-medium ${inverted ? 'text-white/75' : 'text-slate-500'}`}>
              {BASKETFLOW_TAGLINE}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
