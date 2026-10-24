import React from 'react';
import { 
  BarChart3, 
  Award, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  RotateCcw, 
  ArrowLeft,
  CheckCircle2,
  Droplet,
  Flame,
  Share2
} from 'lucide-react';
import { DayIntakeRecord, UserProfile } from '../types';
import { WeeklyCharts } from '../components/WeeklyCharts';

interface StatsScreenProps {
  weeklyDays: DayIntakeRecord[];
  dailyGoal: number;
  userProfile: UserProfile;
  onUpdateDayIntake: (dayId: string, deltaMl: number) => void;
  onResetWeeklyData: () => void;
  onNavigateToDashboard: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  weeklyDays,
  dailyGoal,
  userProfile,
  onUpdateDayIntake,
  onResetWeeklyData,
  onNavigateToDashboard,
}) => {
  const completedCount = weeklyDays.filter((d) => d.intakeMl >= d.goalMl).length;

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-md md:max-w-xl mx-auto w-full px-4 py-2 text-slate-800" id="stats-screen">
      
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-sky-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Haftalık Su Grafikleri
            </h2>
            <p className="text-xs text-slate-500">
              {userProfile.name ? `${userProfile.name} • ` : ''}7 Günlük Hedef & Tüketim Raporu
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetWeeklyData}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Verileri Varsayılana Sıfırla"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </header>

      {/* Main Weekly Charts Module */}
      <WeeklyCharts
        days={weeklyDays}
        dailyGoal={dailyGoal}
        onUpdateDayIntake={onUpdateDayIntake}
      />

      {/* ROZETLER & HİDRASYON BAŞARILARI (Hedef Tamamlama Gamification) */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-sky-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Kazanılan Başarı Rozetleri
            </h3>
          </div>
          <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
            {completedCount >= 5 ? '3/3 Açıldı' : completedCount >= 2 ? '2/3 Açıldı' : '1/3 Açıldı'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Badge 1: İlk Yudum Ustası */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-sky-50 to-white border border-sky-100 flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <Droplet className="w-4 h-4 fill-white" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 block">Aktif İçici</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Sensör ile bağlı</span>
          </div>

          {/* Badge 2: 5 Gün Hedef */}
          <div className={`p-3 rounded-xl border flex flex-col items-center transition-all ${
            completedCount >= 5 
              ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-200' 
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 shadow-xs ${
              completedCount >= 5 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
            }`}>
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 block">Su Şampiyonu</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">
              {completedCount >= 5 ? 'Kazanıldı! 🎉' : `${completedCount}/5 Gün`}
            </span>
          </div>

          {/* Badge 3: 1 Saat Uyarısına Uyan */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-amber-50 to-white border border-amber-200 flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 block">Böbrek Dostu</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Düzenli Hidrasyon</span>
          </div>
        </div>
      </div>

    </div>
  );
};
