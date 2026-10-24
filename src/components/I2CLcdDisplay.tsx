import React from 'react';
import { Monitor, Cpu, Sparkles } from 'lucide-react';

interface I2CLcdDisplayProps {
  currentBottleMl: number;
  todayDrankMl: number;
  dailyGoalMl: number;
  isConnected: boolean;
}

export const I2CLcdDisplay: React.FC<I2CLcdDisplayProps> = ({
  currentBottleMl,
  todayDrankMl,
  dailyGoalMl,
  isConnected,
}) => {
  // Format line 1 (16 chars): "AquaMind   450ml"
  // Format line 2 (16 chars): "Bugun: 450/2450m"
  const line1Raw = `AquaMind  ${currentBottleMl.toString().padStart(4, ' ')}ml`;
  const line1 = line1Raw.padEnd(16, ' ').slice(0, 16);

  const percent = Math.min(99, Math.round((todayDrankMl / dailyGoalMl) * 100));
  const line2Raw = `Bugun:${todayDrankMl}ml %${percent}`;
  const line2 = line2Raw.padEnd(16, ' ').slice(0, 16);

  return (
    <div className="w-full bg-slate-900 rounded-2xl p-3 border border-slate-700 shadow-md text-slate-100" id="i2c-lcd-preview">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
            <Monitor className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-300">
            4-PIN I2C LCD (16x2 • 0x27)
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
          <span>SDA: GPIO21 • SCL: GPIO22</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        </div>
      </div>

      {/* Retro 16x2 Liquid Crystal Backlight Display */}
      <div className="relative rounded-lg p-2.5 bg-[#001428] border-2 border-[#003466] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] font-mono text-cyan-300 font-black tracking-widest text-xs sm:text-sm select-none">
        {/* Pixel grid scanline overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none rounded-md" />

        <div className="space-y-1 relative z-10 leading-none">
          <div className="flex justify-between items-center text-cyan-200 drop-shadow-[0_0_5px_rgba(34,211,238,0.7)]">
            <span>{line1}</span>
            <span className="text-[9px] text-cyan-500 font-normal">L1</span>
          </div>
          <div className="flex justify-between items-center text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.7)]">
            <span>{line2}</span>
            <span className="text-[9px] text-cyan-500 font-normal">L2</span>
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
        <span>Şişe üzerindeki anlık LCD Ekran</span>
        <span className="text-cyan-400 font-mono">{currentBottleMl} ml doluluk</span>
      </div>
    </div>
  );
};
