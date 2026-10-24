import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface CornerDateBadgeProps {
  className?: string;
}

export const CornerDateBadge: React.FC<CornerDateBadgeProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Update date periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Format Turkish date: e.g. "12 Eylül 2026, Cumartesi"
  const day = currentDate.getDate();
  const monthFull = currentDate.toLocaleDateString('tr-TR', { month: 'long' });
  const year = currentDate.getFullYear();
  const weekday = currentDate.toLocaleDateString('tr-TR', { weekday: 'long' });
  const weekdayShort = currentDate.toLocaleDateString('tr-TR', { weekday: 'short' });
  const monthShort = currentDate.toLocaleDateString('tr-TR', { month: 'short' });

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md border border-sky-100 rounded-full shadow-xs text-slate-700 select-none ${className}`}
      id="corner-date-badge"
      title={`${day} ${monthFull} ${year} - ${weekday}`}
    >
      <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
        <Calendar className="w-3 h-3" />
      </div>
      
      {/* Desktop / Tablet Full format */}
      <span className="hidden sm:inline text-xs font-bold text-slate-700 tracking-tight">
        {day} {monthFull} {year}, <span className="text-sky-700 capitalize">{weekday}</span>
      </span>

      {/* Mobile Compact format */}
      <span className="sm:hidden text-[11px] font-bold text-slate-700 tracking-tight">
        {day} {monthShort} <span className="text-sky-700 capitalize">{weekdayShort}</span>
      </span>
    </div>
  );
};
