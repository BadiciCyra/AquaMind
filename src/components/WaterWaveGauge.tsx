import React, { useEffect, useState } from 'react';
import { Droplet, Sparkles } from 'lucide-react';

interface WaterWaveGaugeProps {
  currentMl: number;
  capacityMl: number;
  onQuickSip?: () => void;
}

export const WaterWaveGauge: React.FC<WaterWaveGaugeProps> = ({
  currentMl,
  capacityMl,
  onQuickSip,
}) => {
  const [waveOffset, setWaveOffset] = useState(0);

  // Clamp percentage between 0% and 100%
  const percentage = Math.min(100, Math.max(0, Math.round((currentMl / Math.max(capacityMl, 1)) * 100)));

  // Continuous gentle wave animation
  useEffect(() => {
    let animFrame: number;
    let offset = 0;
    const animate = () => {
      offset = (offset + 0.03) % (Math.PI * 2);
      setWaveOffset(offset);
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Calculate SVG wave paths
  // SVG box is 200 x 200
  const boxHeight = 200;
  const boxWidth = 200;
  const targetY = boxHeight - (percentage / 100) * boxHeight;

  // Generate sine wave coordinates
  const waveAmplitude = percentage > 0 && percentage < 100 ? 5 : 0;
  
  const generateWavePath = (phaseShift: number, ampMultiplier: number) => {
    const points: string[] = [];
    points.push(`M 0 ${boxHeight}`);
    points.push(`L 0 ${targetY}`);
    
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * boxWidth;
      const wave = Math.sin(waveOffset + phaseShift + (i / steps) * Math.PI * 2) * waveAmplitude * ampMultiplier;
      const y = targetY + wave;
      points.push(`L ${x} ${y}`);
    }

    points.push(`L ${boxWidth} ${boxHeight}`);
    points.push('Z');
    return points.join(' ');
  };

  const frontWavePath = generateWavePath(0, 1);
  const backWavePath = generateWavePath(Math.PI * 0.6, 0.75);

  return (
    <div className="flex flex-col items-center justify-center relative w-full select-none" id="water-gauge-container">
      {/* Outer Glow Halo */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/20 via-sky-400/15 to-blue-500/20 blur-xl transition-all duration-700"
          style={{ transform: `scale(${0.9 + (percentage / 100) * 0.15})` }}
        />

        {/* Circular Dial Track */}
        <div className="relative w-full h-full rounded-full p-2.5 bg-gradient-to-b from-white/90 to-sky-50/80 shadow-xl shadow-sky-900/10 border border-sky-200/70 backdrop-blur-md">
          {/* Inner Circular Viewport */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-sky-50 to-blue-50/60 shadow-inner flex items-center justify-center">
            
            {/* SVG Wave Engine */}
            <svg 
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 200 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="waterFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="1" />
                </linearGradient>

                <linearGradient id="waterBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.65" />
                </linearGradient>

                {/* Surface Shine Gradient */}
                <linearGradient id="surfaceShine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Back Wave */}
              <path d={backWavePath} fill="url(#waterBackGrad)" />

              {/* Front Wave */}
              <path d={frontWavePath} fill="url(#waterFrontGrad)" />

              {/* Water Surface Glow Line */}
              {percentage > 0 && percentage < 100 && (
                <line 
                  x1="0" 
                  y1={targetY} 
                  x2="200" 
                  y2={targetY} 
                  stroke="url(#surfaceShine)" 
                  strokeWidth="2.5" 
                />
              )}
            </svg>

            {/* Floating Animated Bubbles */}
            {percentage > 15 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-2 h-2 rounded-full bg-white/40 animate-ping left-1/4 bottom-8 duration-1000" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-white/50 left-1/2 bottom-12 animate-pulse" />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-white/30 right-1/4 bottom-6 animate-bounce" />
              </div>
            )}

            {/* Dial Glass Reflection */}
            <div className="absolute inset-0 pointer-events-none rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/40" />

            {/* Central Typography Data Overlay */}
            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 shadow-xs border border-sky-100 mb-1">
                <Droplet className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
                <span className="text-[11px] font-semibold tracking-wide text-sky-900 uppercase">
                  Şişe Seviyesi
                </span>
              </div>

              <div className="flex items-baseline justify-center">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 drop-shadow-xs">
                  {currentMl}
                </span>
                <span className="ml-1 text-lg sm:text-xl font-bold text-sky-700">
                  ml
                </span>
              </div>

              {/* Percentage & Capacity indicator */}
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white/80 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/60">
                <span className="font-bold text-sky-600">%{percentage}</span>
                <span className="text-slate-300">•</span>
                <span>Kapasite: {capacityMl} ml</span>
              </div>
            </div>
          </div>
        </div>

        {/* Circular Progress Ring (Outer Edge Track) */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="47"
            className="text-sky-100/70 stroke-current"
            strokeWidth="3.5"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="47"
            className="text-sky-500 stroke-current transition-all duration-700 ease-out"
            strokeWidth="3.5"
            strokeDasharray={2 * Math.PI * 47}
            strokeDashoffset={2 * Math.PI * 47 * (1 - percentage / 100)}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
      </div>

      {/* Direct Interactive Sip Trigger under the Gauge */}
      {onQuickSip && (
        <button
          id="btn-quick-sip"
          type="button"
          onClick={onQuickSip}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-sky-800 bg-sky-100/90 hover:bg-sky-200/90 active:scale-95 transition-all shadow-xs border border-sky-200 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Şişeden Bir Yudum Al (-50 ml)</span>
        </button>
      )}
    </div>
  );
};
