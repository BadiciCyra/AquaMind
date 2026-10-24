import React from 'react';
import { 
  Bluetooth, 
  Droplet, 
  TrendingUp, 
  Award, 
  Clock, 
  Plus, 
  RefreshCw, 
  Bell, 
  Sparkles, 
  Sliders, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Cloud,
  LogIn
} from 'lucide-react';
import { ConnectionStatus, BluetoothDeviceInfo, UserProfile, AquaSettings, SipRecord, DayIntakeRecord } from '../types';
import { WaterWaveGauge } from '../components/WaterWaveGauge';
import { I2CLcdDisplay } from '../components/I2CLcdDisplay';
import { BarChart3 } from 'lucide-react';
import { AquaMindLogo } from '../components/AquaMindLogo';
import { User } from '../services/firebase';

interface DashboardScreenProps {
  connectionStatus: ConnectionStatus;
  connectedDevice: BluetoothDeviceInfo | null;
  onOpenBluetoothModal: () => void;
  suMiktari: number; // Current bottle ml
  bottleCapacity: number;
  bugunToplamIcilen: number;
  dailyGoal: number;
  gecenSure: number; // Elapsed seconds since last drink
  userProfile: UserProfile;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
  onTakeSip: (amount: number) => void;
  onRefillBottle: () => void;
  onNavigateToReminders: () => void;
  onNavigateToProfile: () => void;
  onNavigateToHardware: () => void;
  onNavigateToStats: () => void;
  weeklyDays: DayIntakeRecord[];
  sipHistory: SipRecord[];
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  connectionStatus,
  connectedDevice,
  onOpenBluetoothModal,
  suMiktari,
  bottleCapacity,
  bugunToplamIcilen,
  dailyGoal,
  gecenSure,
  userProfile,
  currentUser,
  onOpenAuthModal,
  onTakeSip,
  onRefillBottle,
  onNavigateToReminders,
  onNavigateToProfile,
  onNavigateToHardware,
  onNavigateToStats,
  weeklyDays,
  sipHistory,
}) => {
  const dailyPercent = Math.min(100, Math.round((bugunToplamIcilen / dailyGoal) * 100));
  const remainingGoalMl = Math.max(0, dailyGoal - bugunToplamIcilen);

  const formatTimeAgo = (seconds: number) => {
    if (seconds < 60) return `${seconds} saniye önce`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} dk önce`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} sa ${mins % 60} dk önce`;
  };

  const isOverdue = gecenSure >= 3600;

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-md md:max-w-xl mx-auto w-full px-4 py-2 text-slate-800" id="dashboard-screen">
      
      {/* 1. ÜST KISIM: Bluetooth Bağlantı Durumu & ListPicker (Cihaza Bağlan) */}
      <header 
        className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-sm border border-sky-100 flex items-center justify-between"
        id="dashboard-header-bar"
      >
        <div className="flex items-center gap-2.5">
          <AquaMindLogo size="sm" variant="icon-only" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight leading-none">
                <span className="text-[#0c3b6d]">Aqua</span>
                <span className="text-[#00b4d8]">Mind</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                Akıllı Şişe
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-slate-500 truncate max-w-[110px] sm:max-w-none">
                {userProfile.name ? `Merhaba, ${userProfile.name}` : 'Su Takip Ekranı'}
              </p>
              <button
                id="btn-switch-person-dashboard"
                type="button"
                onClick={onNavigateToProfile}
                title="Kullanıcı veya Kişi Değiştir"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-1.5 py-0.5 rounded-md border border-sky-200 cursor-pointer transition-colors"
              >
                <Users className="w-2.5 h-2.5" />
                <span>Kişi Değiştir</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cloud Account Button */}
          {onOpenAuthModal && (
            <button
              id="btn-dashboard-auth"
              type="button"
              onClick={onOpenAuthModal}
              title={currentUser ? `Bağlı Hesap: ${currentUser.email}` : 'Oturum Aç veya Hesap Oluştur'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                currentUser
                  ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-sky-300 shadow-xs'
              }`}
            >
              {currentUser ? (
                currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User"
                    className="w-4 h-4 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-sky-600" />
                )
              ) : (
                <LogIn className="w-3.5 h-3.5 text-sky-600" />
              )}
              <span className="hidden sm:inline truncate max-w-[90px]">
                {currentUser ? (currentUser.displayName || currentUser.email?.split('@')[0]) : 'Giriş / Kayıt'}
              </span>
              {currentUser && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          )}

          {/* ListPicker1 / Cihaza Bağlan Butonu */}
          <button
            id="btn-list-picker"
            type="button"
            onClick={onOpenBluetoothModal}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              connectionStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                : connectionStatus === 'connecting'
                ? 'bg-amber-50 text-amber-700 border border-amber-300 animate-pulse'
                : 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white hover:from-sky-500 hover:to-cyan-400 shadow-sky-500/20'
            }`}
          >
            <Bluetooth className={`w-3.5 h-3.5 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            <span className="whitespace-nowrap">
              {connectionStatus === 'connected'
                ? 'Bağlandı'
                : connectionStatus === 'connecting'
                ? 'Aranıyor...'
                : 'Cihaza Bağlan'}
            </span>
          </button>
        </div>
      </header>

      {/* BLUETOOTH STATUS NOTIFICATION STRIP */}
      <div 
        className="flex items-center justify-between px-3.5 py-2.5 bg-white/80 backdrop-blur-xs rounded-2xl border border-sky-100 text-xs text-slate-600 shadow-xs"
        id="device-status-strip"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            connectionStatus === 'connected' ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse' : 'bg-amber-400'
          }`} />
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-slate-800 truncate">
              {connectionStatus === 'connected' 
                ? (connectedDevice?.name || 'AquaMind_Sise')
                : 'Bluetooth: Prototipinizi açıp bağlayın'}
            </span>
            {connectionStatus === 'connected' && connectedDevice && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase shrink-0 border border-emerald-200">
                {connectedDevice.type === 'ble' ? 'Gerçek BLE' : connectedDevice.type === 'web_serial' ? 'Gerçek COM/USB' : 'Simüle'}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenBluetoothModal}
          className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline shrink-0 cursor-pointer ml-2"
        >
          {connectionStatus === 'connected' ? 'Yönet' : 'Prototip Bağla ➜'}
        </button>
      </div>

      {/* 2. ORTA KISIM: Şişedeki Anlık Su Miktarını Gösteren Devasa Sıvı Dalga Göstergesi */}
      <section 
        className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-lg shadow-sky-900/5 border border-sky-100 flex flex-col items-center justify-center relative overflow-hidden"
        id="main-gauge-container"
      >
        <div className="w-full flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>ŞİŞE SEVİYESİ</span>
          </div>
          <span className="font-mono font-semibold text-slate-500">
            {suMiktari} / {bottleCapacity} ml
          </span>
        </div>

        {/* Big Wave Gauge */}
        <WaterWaveGauge
          currentMl={suMiktari}
          capacityMl={bottleCapacity}
          onQuickSip={() => onTakeSip(50)}
        />

        {/* Quick Sip & Refill Action Pills */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-100">
          <button
            id="btn-quick-sip-50"
            type="button"
            onClick={() => onTakeSip(50)}
            className="py-2 px-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold text-sky-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <Droplet className="w-3.5 h-3.5 text-sky-500" />
            <span>-50 ml Yudum</span>
          </button>
          
          <button
            id="btn-quick-sip-150"
            type="button"
            onClick={() => onTakeSip(150)}
            className="py-2 px-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold text-sky-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <Droplet className="w-3.5 h-3.5 text-sky-500" />
            <span>-150 ml Bardak</span>
          </button>

          <button
            id="btn-refill-bottle"
            type="button"
            onClick={onRefillBottle}
            className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Şişeyi Doldur</span>
          </button>
        </div>
      </section>

      {/* 4-PIN I2C LCD CANLI EKRAN ÖNİZLEMESİ */}
      <I2CLcdDisplay
        currentBottleMl={suMiktari}
        todayDrankMl={bugunToplamIcilen}
        dailyGoalMl={dailyGoal}
        isConnected={connectionStatus === 'connected'}
      />

      {/* 3. ALT KISIM: Bugün Hedeflenen Su ile Şimdiye Kadar İçilen Toplam Su Karşılaştırmalı Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Kart 1: Bugün İçilen Toplam Su vs Hedef */}
        <div 
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-sky-100 flex flex-col justify-between"
          id="daily-progress-card"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Bugün İçilen Su
              </span>
            </div>
            <span className="text-xs font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              %{dailyPercent}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {bugunToplamIcilen}
              </span>
              <span className="text-sm font-bold text-slate-400">
                / {dailyGoal} ml
              </span>
            </div>

            {/* İlerleme Çubuğu */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-200/60">
              <div 
                className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${dailyPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>Hedefe Kalan: <strong className="text-slate-800">{remainingGoalMl} ml</strong></span>
              <button 
                type="button"
                onClick={onNavigateToProfile}
                className="text-sky-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Hedef: {dailyGoal}ml</span>
                <Sliders className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Kart 2: 1 Saatlik Hatırlatıcı ve Son Su İçme Durumu */}
        <div 
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-sky-100 flex flex-col justify-between"
          id="reminder-summary-card"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isOverdue ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                1 Saat Hatırlatıcısı
              </span>
            </div>

            <button
              type="button"
              onClick={onNavigateToReminders}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Panel</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-semibold text-slate-500">Son Yudum:</span>
              <span className={`text-base font-extrabold ${isOverdue ? 'text-amber-600' : 'text-slate-900'}`}>
                {formatTimeAgo(gecenSure)}
              </span>
            </div>

            <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
              <span>Zaman Sayacı:</span>
              <span className="font-mono font-bold text-slate-800">
                {Math.floor(gecenSure / 60)} dk {gecenSure % 60} sn / 60 dk
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverdue ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, (gecenSure / 3600) * 100)}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500">
                {isOverdue ? '⚠️ Uyarı Gönderildi!' : `Sonraki uyarı: ~${Math.ceil((3600 - gecenSure) / 60)} dk`}
              </span>
              <button
                type="button"
                onClick={onNavigateToReminders}
                className="font-bold text-sky-600 hover:underline cursor-pointer"
              >
                Bildirim Ayarları &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HAFTALIK GRAFİK & HEDEF ÖZETİ ÖNİZLEME KARTI */}
      <div 
        onClick={onNavigateToStats}
        className="bg-white/95 backdrop-blur-md hover:bg-white transition-all rounded-2xl p-4 shadow-sm border border-sky-100 cursor-pointer group"
        id="weekly-preview-card"
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>Haftalık Su & Hedef Grafikleri</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-sky-100 text-sky-800">
                  Yeni
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                7 günlük hidrasyon trendi ve başarı analizi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">
            <span>Raporu Aç</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Mini 7-Day Sparkline Bars */}
        <div className="pt-2 border-t border-slate-100 flex items-end justify-between gap-1.5">
          {weeklyDays.map((day) => {
            const isMet = day.intakeMl >= day.goalMl;
            const barHeight = Math.min(100, Math.max(15, Math.round((day.intakeMl / (dailyGoal || 2450)) * 100)));
            return (
              <div key={day.id} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono font-semibold text-slate-400">
                  {day.dayShort}
                </span>
                <div className="w-full bg-slate-100 h-10 rounded-md overflow-hidden flex flex-col justify-end p-0.5">
                  <div 
                    className={`w-full rounded-xs transition-all ${
                      isMet ? 'bg-emerald-500' : day.isToday ? 'bg-cyan-500 animate-pulse' : 'bg-sky-400'
                    }`}
                    style={{ height: `${barHeight}%` }}
                    title={`${day.dayFull}: ${day.intakeMl} ml (%${day.completionRate})`}
                  />
                </div>
                <span className={`text-[9px] font-bold ${isMet ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {isMet ? '✓' : `%${day.completionRate}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DENEYAP KART KÖPRÜ BİLGİ ŞERİDİ */}
      <div 
        onClick={onNavigateToHardware}
        className="bg-sky-50/70 hover:bg-sky-100/80 transition-colors border border-sky-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer"
        id="deneyap-bridge-banner"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-mono font-bold text-xs">
            1A
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Geliştirici & Donanım Ekranı (DENEYAP 1A)
            </span>
            <span className="text-[11px] text-slate-500">
              Seri monitör, mesafe formülü ve Arduino C++ kodunu görüntüleyin
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-sky-600" />
      </div>

    </div>
  );
};
