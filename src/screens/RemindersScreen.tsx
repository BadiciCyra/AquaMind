import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Info,
  Droplet
} from 'lucide-react';
import { AquaSettings, NotificationRecord } from '../types';

interface RemindersScreenProps {
  settings: AquaSettings;
  onUpdateSettings: (newSettings: AquaSettings) => void;
  gecenSure: number; // Elapsed seconds
  onFastForwardTime: (seconds: number) => void;
  onResetTimer: () => void;
  onTriggerInstantAlert: () => void;
  notificationHistory: NotificationRecord[];
}

export const RemindersScreen: React.FC<RemindersScreenProps> = ({
  settings,
  onUpdateSettings,
  gecenSure,
  onFastForwardTime,
  onResetTimer,
  onTriggerInstantAlert,
  notificationHistory,
}) => {
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
        if (perm === 'granted') {
          onUpdateSettings({
            ...settings,
            enableBrowserNotification: true,
          });
        }
      } catch {
        // Ignore
      }
    }
  };

  const remainingSeconds = Math.max(0, settings.reminderIntervalSec - gecenSure);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecOnly = remainingSeconds % 60;
  const progressPercent = Math.min(100, Math.round((gecenSure / settings.reminderIntervalSec) * 100));

  const formatIntervalLabel = (sec: number) => {
    if (sec < 60) return `${sec} saniye (Hızlı Test)`;
    if (sec === 1800) return '30 dakika';
    if (sec === 3600) return '1 saat (3600 sn - Önerilen)';
    if (sec === 7200) return '2 saat (7200 sn)';
    return `${sec / 60} dakika`;
  };

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-md md:max-w-xl mx-auto w-full px-4 py-2 text-slate-800" id="reminders-screen">
      
      {/* Top Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-sky-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Akıllı Bildirim & Hatırlatıcı
            </h2>
            <p className="text-xs text-slate-500">
              Otomatik zaman takibi ve periyodik hidrasyon uyarıları
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold bg-sky-50 text-sky-700 px-2 py-1 rounded-lg border border-sky-200">
          Otomatik Takip
        </span>
      </div>

      {/* CANLI GERİ SAYIM SAYACI KARTI */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-md border border-sky-100 flex flex-col items-center text-center relative overflow-hidden" id="countdown-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100/50 rounded-full blur-2xl pointer-events-none" />
        
        <span className="text-xs uppercase tracking-widest font-extrabold text-sky-800 mb-1">
          Son Yudumdan Beri Geçen Süre
        </span>

        {/* Big Digit Countdown */}
        <div className="flex items-baseline gap-2 my-2 font-mono">
          <div className="bg-slate-900 text-cyan-400 font-black text-3xl sm:text-4xl px-3 py-1.5 rounded-xl shadow-inner border border-slate-700">
            {Math.floor(gecenSure / 60).toString().padStart(2, '0')}
          </div>
          <span className="text-2xl font-bold text-slate-400">:</span>
          <div className="bg-slate-900 text-cyan-400 font-black text-3xl sm:text-4xl px-3 py-1.5 rounded-xl shadow-inner border border-slate-700">
            {(gecenSure % 60).toString().padStart(2, '0')}
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase font-sans">
            (Dakika:Saniye)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden my-3 border border-slate-200/80 p-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              gecenSure >= settings.reminderIntervalSec ? 'bg-amber-500' : 'bg-gradient-to-r from-sky-500 to-cyan-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="w-full flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>Toplam Hedef Aralık: <strong>{formatIntervalLabel(settings.reminderIntervalSec)}</strong></span>
          <span>Kalan: <strong>{remainingMinutes} dk {remainingSecOnly} sn</strong></span>
        </div>

        {/* Hızlı Test Butonları */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-100">
          <button
            id="btn-trigger-instant"
            type="button"
            onClick={onTriggerInstantAlert}
            className="col-span-2 sm:col-span-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Şimdi Bildirim At</span>
          </button>

          <button
            id="btn-fast-forward-10m"
            type="button"
            onClick={() => onFastForwardTime(600)}
            className="py-2 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
          >
            <Play className="w-3 h-3 text-sky-600" />
            <span>+10 Dk İlerlet</span>
          </button>

          <button
            id="btn-reset-timer"
            type="button"
            onClick={onResetTimer}
            className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Sayacı Sıfırla</span>
          </button>
        </div>
      </section>

      {/* BİLDİRİM METNİ ŞABLONU & KURAL AÇIKLAMASI */}
      <div className="bg-sky-950 text-white rounded-2xl p-4 border border-sky-800 shadow-md">
        <div className="flex items-center gap-2 mb-2 text-cyan-300 font-bold text-xs uppercase tracking-wide">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span>Gönderilecek Otomatik Bildirim Şablonu</span>
        </div>

        <div className="bg-sky-900/60 p-3 rounded-xl border border-sky-700/60 font-sans space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-black text-cyan-300">
              Başlık: 💧 Su Vakti!
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 italic">
            "Hey! 1 saattir su içmedin. Böbreklerini kurutacaksın, hadi bir yudum al!"
          </p>
        </div>

        <p className="text-[11px] text-sky-300/80 mt-2">
          Kural: Kullanıcı 1 saat boyunca şişeden hiç su içmezse (şişe seviyesi azalmazsa) sistem otomatik olarak bu uyarıyı gönderir ve zamanlayıcıyı sıfırlar.
        </p>
      </div>

      {/* BİLDİRİM VE SES AYARLARI */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-sky-100 space-y-3.5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Hatırlatıcı Ayarları
        </h3>

        {/* Hatırlatma Sıklığı */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Hatırlatma Sıklığı (Zaman Aşımı Süresi)
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, reminderIntervalSec: 30 })}
              className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                settings.reminderIntervalSec === 30
                  ? 'bg-sky-500 text-white border-sky-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              30 Saniye (Test)
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, reminderIntervalSec: 1800 })}
              className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                settings.reminderIntervalSec === 1800
                  ? 'bg-sky-500 text-white border-sky-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              30 Dakika
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, reminderIntervalSec: 3600 })}
              className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                settings.reminderIntervalSec === 3600
                  ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              1 Saat (Standart)
            </button>
          </div>
        </div>

        {/* Ses Efekti Aç/Kapa */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {settings.enableSound ? (
              <Volume2 className="w-4 h-4 text-sky-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Sesli Uyarı Melodisi
              </span>
              <span className="text-[11px] text-slate-500">
                Uyarı geldiğinde su damlası melodisi çalar
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, enableSound: !settings.enableSound })}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              settings.enableSound ? 'bg-sky-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.enableSound ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Web Push Tarayıcı Bildirimi */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Tarayıcı / Sistem Bildirimi
            </span>
            <span className="text-[11px] text-slate-500">
              Uygulama arka plandayken bildirim gönder
            </span>
          </div>

          {browserPermission === 'granted' ? (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> İzin Verildi
            </span>
          ) : (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="text-xs font-bold px-3 py-1.5 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-lg border border-sky-300 transition-colors cursor-pointer"
            >
              İzin İste
            </button>
          )}
        </div>
      </div>

      {/* GEÇMİŞ BİLDİRİMLER LİSTESİ */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-sky-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Son Tetiklenen Bildirimler
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {notificationHistory.length} kayıt
          </span>
        </div>

        {notificationHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Henüz bir uyarı tetiklenmedi. Sayacı 1 saat ilerleterek veya "Şimdi Bildirim At" butonuna basarak deneyebilirsiniz.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {notificationHistory.map((item) => (
              <div 
                key={item.id}
                className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2">
                  <Droplet className="w-4 h-4 text-sky-600 fill-sky-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">{item.title}</span>
                    <p className="text-slate-600 text-[11px] leading-tight">{item.body}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
