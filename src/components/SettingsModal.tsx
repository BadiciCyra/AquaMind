import React, { useState } from 'react';
import { X, Settings2, Bell, Volume2, Target, Check, RefreshCw } from 'lucide-react';
import { AquaSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AquaSettings;
  onSave: (newSettings: AquaSettings) => void;
  onResetToday: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetToday,
}) => {
  const [formData, setFormData] = useState<AquaSettings>(settings);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const requestNotificationPerm = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          setFormData({ ...formData, enableBrowserNotification: true });
        }
      } catch {
        // Ignore error
      }
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      id="settings-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="settings-modal-card"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Settings2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              AquaMind Ayarları
            </h2>
          </div>
          <button
            id="btn-close-settings"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Daily Goal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-sky-600" />
              <span>Günlük Su Hedefi (ml)</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[1500, 2000, 2500, 3000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFormData({ ...formData, dailyGoal: val })}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    formData.dailyGoal === val
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  {val} ml
                </button>
              ))}
            </div>
            <input
              id="input-daily-goal"
              type="number"
              step="50"
              min="500"
              max="6000"
              value={formData.dailyGoal}
              onChange={(e) => setFormData({ ...formData, dailyGoal: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Bottle Capacity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Şişe Kapasitesi (ml)
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[500, 750, 1000, 1200].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFormData({ ...formData, bottleCapacity: val })}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    formData.bottleCapacity === val
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  {val} ml
                </button>
              ))}
            </div>
            <input
              id="input-bottle-capacity"
              type="number"
              step="50"
              min="200"
              max="3000"
              value={formData.bottleCapacity}
              onChange={(e) => setFormData({ ...formData, bottleCapacity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Reminder Interval */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-sky-600" />
              <span>Hatırlatma Aralığı (Hareketsizlik Kontrolü)</span>
            </label>
            <select
              id="select-reminder-interval"
              value={formData.reminderIntervalSec}
              onChange={(e) => setFormData({ ...formData, reminderIntervalSec: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="30">30 Saniye (Hızlı Test Modu)</option>
              <option value="1800">30 Dakika</option>
              <option value="3600">1 Saat (3600 sn - Varsayılan)</option>
              <option value="5400">1.5 Saat</option>
              <option value="7200">2 Saat</option>
            </select>
          </div>

          {/* Sound & Notifications */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-sky-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Su Damlası ve Zil Sesleri</span>
                  <span className="text-[11px] text-slate-500">Yudum ve hatırlatmalarda akustik geri bildirim</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enableSound}
                onChange={(e) => setFormData({ ...formData, enableSound: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded-sm focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-sky-600" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Masaüstü Bildirimleri</span>
                  <span className="text-[11px] text-slate-500">
                    {notificationPermission === 'granted' ? 'İzin verildi' : 'Tarayıcı izni gereklidir'}
                  </span>
                </div>
              </div>
              {notificationPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={requestNotificationPerm}
                  className="px-2.5 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-lg hover:bg-sky-200"
                >
                  İzin Ver
                </button>
              ) : (
                <input
                  type="checkbox"
                  checked={formData.enableBrowserNotification}
                  onChange={(e) => setFormData({ ...formData, enableBrowserNotification: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded-sm focus:ring-sky-500"
                />
              )}
            </label>
          </div>

          {/* Reset Today's Drank */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Bugünkü sayacı sıfırla:</span>
            <button
              id="btn-reset-today-counter"
              type="button"
              onClick={() => {
                onResetToday();
                onClose();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Günü Sıfırla</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
          >
            İptal
          </button>
          <button
            id="btn-save-settings"
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Ayarları Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
