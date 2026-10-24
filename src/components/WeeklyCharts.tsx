import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  Cell,
  AreaChart,
  Area,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  Droplet, 
  Flame, 
  CheckCircle2, 
  Sparkles,
  BarChart3,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { DayIntakeRecord, WeeklySummary } from '../types';

interface WeeklyChartsProps {
  days: DayIntakeRecord[];
  dailyGoal: number;
  onUpdateDayIntake?: (dayId: string, deltaMl: number) => void;
}

export const WeeklyCharts: React.FC<WeeklyChartsProps> = ({
  days,
  dailyGoal,
  onUpdateDayIntake,
}) => {
  const [activeTab, setActiveTab] = useState<'bars' | 'trend' | 'hourly'>('bars');
  const [selectedDayId, setSelectedDayId] = useState<string>(() => {
    const today = days.find((d) => d.isToday);
    return today ? today.id : days[days.length - 1]?.id || 'paz';
  });

  // Calculate high-level weekly analytics
  const totalWeeklyIntake = days.reduce((acc, curr) => acc + curr.intakeMl, 0);
  const averageDailyIntake = Math.round(totalWeeklyIntake / (days.length || 7));
  const completedDays = days.filter((d) => d.intakeMl >= d.goalMl).length;
  const weeklyTargetTotal = days.reduce((acc, curr) => acc + curr.goalMl, 0);
  const overallCompletionRate = Math.round((totalWeeklyIntake / weeklyTargetTotal) * 100);

  // Best day
  const bestDay = [...days].sort((a, b) => b.intakeMl - a.intakeMl)[0];

  // Consecutive streak calculation
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].intakeMl >= days[i].goalMl) {
      streak++;
    } else {
      // If it's today and today hasn't finished, don't break streak if yesterday was completed
      if (days[i].isToday && i > 0 && days[i - 1].intakeMl >= days[i - 1].goalMl) {
        continue;
      }
      break;
    }
  }

  const selectedDay = days.find((d) => d.id === selectedDayId) || days[days.length - 1];

  // Hourly distribution mock model for context
  const hourlyData = [
    { time: '07:00 - 10:00', label: 'Sabah', amount: Math.round(averageDailyIntake * 0.22), percent: 22 },
    { time: '10:00 - 14:00', label: 'Öğle', amount: Math.round(averageDailyIntake * 0.35), percent: 35 },
    { time: '14:00 - 18:00', label: 'İkindi', amount: Math.round(averageDailyIntake * 0.28), percent: 28 },
    { time: '18:00 - 23:00', label: 'Akşam', amount: Math.round(averageDailyIntake * 0.15), percent: 15 },
  ];

  // Custom Recharts Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayIntakeRecord = payload[0].payload;
      const isMet = data.intakeMl >= data.goalMl;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-sky-400/40 text-xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10 font-bold">
            <span className="text-cyan-300">{data.dayFull} ({data.dateStr})</span>
            {data.isToday && (
              <span className="px-1.5 py-0.2 rounded-sm bg-sky-500 text-[10px] text-white">
                BUGÜN
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Tüketilen:</span>
              <strong className="text-white font-mono">{data.intakeMl} ml</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Hedef:</span>
              <span className="text-slate-300 font-mono">{data.goalMl} ml</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
              <span className="text-slate-300">Başarı Oranı:</span>
              <strong className={isMet ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                %{data.completionRate}
              </strong>
            </div>
          </div>
          {isMet && (
            <div className="mt-1.5 text-[10px] text-emerald-300 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Hedef Tamamlandı!
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col gap-4" id="weekly-charts-module">
      
      {/* 4 SUMMARY STAT CARDS (Bento Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Card 1: Haftalık Toplam */}
        <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-sky-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Haftalık Su</span>
            <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <Droplet className="w-3.5 h-3.5 fill-sky-600" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900 font-mono">
                {(totalWeeklyIntake / 1000).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400">Litre</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Toplam: {totalWeeklyIntake.toLocaleString('tr-TR')} ml
            </span>
          </div>
        </div>

        {/* Card 2: Hedef Tamamlama */}
        <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-sky-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Hedef Başarısı</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-700 font-mono">
                {completedDays} / 7
              </span>
              <span className="text-xs font-bold text-emerald-600">Gün</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Haftalık Başarı: %{overallCompletionRate}
            </span>
          </div>
        </div>

        {/* Card 3: Günlük Ortalama */}
        <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-sky-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Günlük Ort.</span>
            <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900 font-mono">
                {averageDailyIntake}
              </span>
              <span className="text-xs font-bold text-slate-400">ml/gün</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Hedef: {dailyGoal} ml
            </span>
          </div>
        </div>

        {/* Card 4: Seri (Streak) */}
        <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-sky-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Başarı Serisi</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-600 font-mono">
                {streak}
              </span>
              <span className="text-xs font-bold text-amber-700">Gün Üst Üste</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              En iyi gün: {bestDay?.dayShort} ({bestDay?.intakeMl} ml)
            </span>
          </div>
        </div>
      </div>

      {/* CHART CONTAINER & TABS */}
      <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-sky-100 shadow-sm" id="weekly-chart-box">
        {/* Tab Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Haftalık Hidrasyon & Hedef Grafikleri</span>
            </h3>
            <p className="text-xs text-slate-500">
              Günlük içilen su miktarları ve {dailyGoal} ml hedefe ulaşma durumu
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('bars')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'bars'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Miktar (ml)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trend')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'trend'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hedef Başarısı (%)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hourly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'hourly'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saat Dağılımı
            </button>
          </div>
        </div>

        {/* TAB 1: BAR CHART (Miktar ml vs Hedef Çizgisi) */}
        {activeTab === 'bars' && (
          <div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={days}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      setSelectedDayId(e.activePayload[0].payload.id);
                    }
                  }}
                >
                  <defs>
                    {/* Goal Met Gradient */}
                    <linearGradient id="barGoalMet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                    {/* In Progress Gradient */}
                    <linearGradient id="barNormal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.7} />
                    </linearGradient>
                    {/* Today Marker */}
                    <linearGradient id="barToday" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="dayShort" 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.max(3000, dataMax + 200)]}
                  />
                  <Tooltip content={<CustomBarTooltip />} />

                  {/* Günlük Hedef Çizgisi */}
                  <ReferenceLine 
                    y={dailyGoal} 
                    stroke="#f59e0b" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{
                      value: `Hedef: ${dailyGoal} ml`,
                      fill: '#d97706',
                      fontSize: 11,
                      fontWeight: 700,
                      position: 'top',
                    }} 
                  />

                  <Bar 
                    dataKey="intakeMl" 
                    radius={[8, 8, 2, 2]} 
                    animationDuration={1000}
                    cursor="pointer"
                  >
                    {days.map((entry) => {
                      const isTargetMet = entry.intakeMl >= entry.goalMl;
                      const isSelected = entry.id === selectedDayId;
                      return (
                        <Cell 
                          key={`cell-${entry.id}`}
                          fill={isTargetMet ? 'url(#barGoalMet)' : entry.isToday ? 'url(#barToday)' : 'url(#barNormal)'}
                          stroke={isSelected ? '#0284c7' : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & Hint */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="font-semibold text-slate-700">Hedefe Ulaşıldı (≥ 100%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-sky-500" />
                  <span className="font-semibold text-slate-700">İçilen Su</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-amber-500 border-t-2 border-dashed border-amber-500" />
                  <span className="font-semibold text-slate-700">Hedef Çizgisi</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 italic">
                * Detay için sütuna dokunun
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: TREND CHART (Hedef Tamamlama Oranı %) */}
        {activeTab === 'trend' && (
          <div>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={days}
                  margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      setSelectedDayId(e.activePayload[0].payload.id);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="areaTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="dayShort" 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.max(120, dataMax + 10)]}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(val: number) => [`%${val}`, 'Tamamlanma Oranı']}
                    labelFormatter={(label, item) => {
                      const payload = item && item[0] ? item[0].payload : null;
                      return payload ? `${payload.dayFull} (${payload.dateStr})` : label;
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      color: '#fff',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      fontSize: '12px',
                    }}
                  />
                  
                  {/* %100 Başarı Referans Çizgisi */}
                  <ReferenceLine 
                    y={100} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                    strokeWidth={2}
                    label={{
                      value: '%100 Hedef',
                      fill: '#059669',
                      fontSize: 11,
                      fontWeight: 700,
                      position: 'top',
                    }}
                  />

                  <Area 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#0284c7" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#areaTrend)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700">%100 Çizgisinin Üstü = Hedefe Ulaşılan Günler</span>
              </span>
              <span className="font-bold text-sky-700">
                Ortalama Tamamlama: %{overallCompletionRate}
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: HOURLY DISTRIBUTION (Günün Saatlerine Göre Tüketim Dağılımı) */}
        {activeTab === 'hourly' && (
          <div className="space-y-3 py-1">
            <p className="text-xs text-slate-600 mb-2">
              Kullanıcının gün içinde en aktif su içtiği saat dilimleri ve ortalama hidrasyon temposu:
            </p>

            <div className="space-y-2.5">
              {hourlyData.map((slot, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{slot.label} ({slot.time})</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-sm text-sky-700">{slot.amount} ml</span>
                      <span className="text-slate-400 font-normal">/ %{slot.percent}</span>
                    </div>
                  </div>

                  {/* Distribution Bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full"
                      style={{ width: `${slot.percent * 2.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2 mt-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                <strong>Akıllı Tavsiye:</strong> Tüketiminizin en yoğun olduğu saat <strong>10:00 - 14:00</strong> arası. 1 saatlik akıllı bildirimler sayesinde gün boyu dengeli hidrasyon sağlanıyor.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SEÇİLEN GÜN DETAYI VE HIZLI TEST KARTI */}
      {selectedDay && (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-sky-100 shadow-sm" id="selected-day-detail">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs font-mono">
                {selectedDay.dayShort}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  {selectedDay.dayFull} ({selectedDay.dateStr}) Detayları
                </h4>
                <p className="text-[11px] text-slate-500">
                  {selectedDay.isToday ? 'Bugün (Canlı Şişe Akışı ile Senkronize)' : 'Geçmiş Kayıt'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                selectedDay.intakeMl >= selectedDay.goalMl
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}>
                %{selectedDay.completionRate} Tamamlandı
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-bold block">İçilen Su</span>
              <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">
                {selectedDay.intakeMl} ml
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-bold block">Hedeflenen</span>
              <span className="text-sm font-black text-slate-700 font-mono mt-0.5 block">
                {selectedDay.goalMl} ml
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-bold block">Fark</span>
              <span className={`text-sm font-black font-mono mt-0.5 block ${
                selectedDay.intakeMl >= selectedDay.goalMl ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {selectedDay.intakeMl >= selectedDay.goalMl
                  ? `+${selectedDay.intakeMl - selectedDay.goalMl} ml`
                  : `-${selectedDay.goalMl - selectedDay.intakeMl} ml`}
              </span>
            </div>
          </div>

          {/* Quick Simulation controls for selected day */}
          {onUpdateDayIntake && (
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Bu Gün İçin Test Simülasyonu:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateDayIntake(selectedDay.id, -200)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer transition-colors"
                >
                  -200 ml
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateDayIntake(selectedDay.id, 200)}
                  className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 rounded-lg text-sky-800 font-bold cursor-pointer transition-colors"
                >
                  +200 ml
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateDayIntake(selectedDay.id, 500)}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-800 font-bold cursor-pointer transition-colors"
                >
                  +500 ml
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
