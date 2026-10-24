import React, { useState } from 'react';

interface AquaMindLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'icon-only';
}

export const AquaMindLogo: React.FC<AquaMindLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full',
}) => {
  const [imageError, setImageError] = useState(false);

  // Dimension mapping
  const dimensions = {
    sm: { circle: 'w-8 h-8', img: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { circle: 'w-12 h-12', img: 'w-12 h-12', text: 'text-lg', sub: 'text-[10px]' },
    lg: { circle: 'w-24 h-24 sm:w-28 sm:h-28', img: 'w-24 h-24 sm:w-28 sm:h-28', text: 'text-2xl sm:text-3xl', sub: 'text-xs tracking-wider' },
    xl: { circle: 'w-36 h-36 sm:w-44 sm:h-44', img: 'w-36 h-36 sm:w-44 sm:h-44', text: 'text-3xl sm:text-4xl', sub: 'text-xs sm:text-sm tracking-widest' },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`} id="aquamind-brand-logo">
      {/* Circle Icon / Image */}
      <div className={`relative ${dimensions.circle} rounded-full flex items-center justify-center p-0.5 shadow-md bg-white border border-sky-100 overflow-hidden`}>
        {!imageError ? (
          <img
            src="/logo.png"
            alt="AquaMind Logo"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-contain rounded-full"
          />
        ) : (
          /* High Fidelity Vector SVG matching user's uploaded logo */
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00b4d8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>

            {/* Circular Border with subtle gap */}
            <circle cx="100" cy="95" r="82" stroke="url(#circleGrad)" strokeWidth="9" fill="#ffffff" />

            {/* Bluetooth Symbol (Top Right) */}
            <g transform="translate(136, 36) scale(0.65)" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 12,2 L 12,38 M 12,2 L 24,12 L 2,24 L 24,28 L 12,38" />
            </g>

            {/* Water Drop */}
            <path
              d="M 100,28 C 100,28 132,68 132,95 C 132,113 118,127 100,127 C 82,127 68,113 68,95 C 68,68 100,28 100,28 Z"
              fill="url(#dropGrad)"
            />

            {/* Pulse / ECG Line inside Water Drop */}
            <path
              d="M 74,96 L 86,96 L 91,107 L 97,80 L 103,112 L 108,93 L 112,98 L 126,98"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Stylized Cupping Hand */}
            <path
              d="M 46,128 C 58,120 74,124 90,132 C 106,140 128,136 142,122 C 145,119 149,122 146,126 C 130,146 102,154 84,146 C 68,138 52,142 40,150 C 35,145 38,133 46,128 Z"
              fill="#0f3d68"
            />
            {/* Hand thumb / finger accent */}
            <path
              d="M 112,128 C 122,124 134,125 144,118 C 146,116 148,118 146,121 C 137,128 126,132 114,133 Z"
              fill="#0f3d68"
            />
          </svg>
        )}
      </div>

      {/* Typography: AquaMind & SU İÇMEYİ UNUTMA */}
      {variant === 'full' && (
        <div className="mt-3 space-y-1">
          <div className={`${dimensions.text} font-black tracking-tight leading-none`}>
            <span className="text-[#0c3b6d]">Aqua</span>
            <span className="text-[#00b4d8]">Mind</span>
          </div>

          {showSubtitle && (
            <div className="flex items-center justify-center gap-2 pt-1 text-slate-700">
              <span className="w-5 h-[1.5px] bg-[#0c3b6d]/60 rounded-full" />
              <span className={`${dimensions.sub} font-bold text-[#0c3b6d] uppercase tracking-widest`}>
                SU İÇMEYİ UNUTMA
              </span>
              <span className="w-5 h-[1.5px] bg-[#0c3b6d]/60 rounded-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
