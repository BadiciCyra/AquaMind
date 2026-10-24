import React, { useState, useEffect } from 'react';
import { User, Weight, Ruler, Calendar, Droplet, ArrowRight, Check, Sparkles, Activity, AlertTriangle, RotateCcw, Users, UserPlus, Cloud, LogIn, Smartphone, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { User as FirebaseUser } from '../services/firebase';
import { toTurkishTitleCase } from '../utils/text';

interface ProfileScreenProps {
  initialProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onGoBack?: () => void;
  currentUser?: FirebaseUser | null;
  onOpenAuthModal?: () => void;
}

const PRESET_PERSONS = [
  { name: 'Ahmet Yılmaz', age: 24, height: 175, weight: 70, activityLevel: 'medium' as const },
  { name: 'Ayşe Demir', age: 22, height: 165, weight: 58, activityLevel: 'medium' as const },
  { name: 'Mehmet Kaya', age: 28, height: 182, weight: 82, activityLevel: 'high' as const },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  initialProfile,
  onSaveProfile,
  onGoBack,
  currentUser,
  onOpenAuthModal,
}) => {
  const [name, setName] = useState(initialProfile.name || 'Ahmet Yılmaz');
  const [age, setAge] = useState(initialProfile.age || 24);
  const [height, setHeight] = useState(initialProfile.height || 175);
  const [weight, setWeight] = useState(initialProfile.weight || 70);
  const [activityLevel, setActivityLevel] = useState<'low' | 'medium' | 'high'>(initialProfile.activityLevel || 'medium');
  
  // Custom adjusted goal
  const [customGoal, setCustomGoal] = useState<number>(initialProfile.customGoal || 2450);
  const [isCustomOverride, setIsCustomOverride] = useState(false);

  // Check if person name is different from currently active profile
  const isDifferentPerson = initialProfile.isProfileSet && (
    name.trim().toLowerCase() !== (initialProfile.name || '').trim().toLowerCase()
  );

  const applyPreset = (preset: typeof PRESET_PERSONS[0]) => {
    setName(preset.name);
    setAge(preset.age);
    setHeight(preset.height);
    setWeight(preset.weight);
    setActivityLevel(preset.activityLevel);
    setIsCustomOverride(false);
  };

  const startNewEmptyPerson = () => {
    setName('');
    setAge(25);
    setHeight(170);
    setWeight(65);
    setActivityLevel('medium');
    setIsCustomOverride(false);
  };

  // Automatic calculation formula: Kilo × 35 ml
  // Plus activity multiplier bonus: low: +0 ml, medium: +200 ml, high: +400 ml
  const baseCalculatedGoal = Math.round(weight * 35);
  const activityBonus = activityLevel === 'high' ? 400 : activityLevel === 'medium' ? 200 : 0;
  const recommendedGoal = baseCalculatedGoal + activityBonus;

  // Whenever weight or activity changes, update customGoal if user hasn't explicitly overridden it
  useEffect(() => {
    if (!isCustomOverride) {
      setCustomGoal(recommendedGoal);
    }
  }, [recommendedGoal, isCustomOverride]);

  // Calculate BMI (Boy Kilo İndeksi)
  const heightInMeters = height / 100;
  const bmi = heightInMeters > 0 ? (weight / (heightInMeters * heightInMeters)).toFixed(1) : '22.0';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: UserProfile = {
      name: name.trim() || 'Kullanıcı',
      age: Number(age) || 20,
      height: Number(height) || 170,
      weight: Number(weight) || 70,
      calculatedGoal: recommendedGoal,
      customGoal: Number(customGoal) || recommendedGoal,
      activityLevel,
      isProfileSet: true,
    };
    onSaveProfile(updatedProfile);
  };

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-4 py-4 text-slate-800" id="profile-screen">
      {/* Header */}
      <div className="mb-3 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-500/20 mb-2">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Profil & Kişi Seçimi
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Vücut ölçülerinize göre <strong>Kilo × 35 ml</strong> formülüyle günlük su ihtiyacınız hesaplanır.
        </p>
      </div>

      {/* Cloud Account Sync Card */}
      {onOpenAuthModal && (
        <div 
          className="mb-3 p-3.5 bg-gradient-to-r from-sky-50 via-cyan-50/60 to-white rounded-2xl border border-sky-200/80 shadow-xs flex items-center justify-between"
          id="profile-cloud-sync-card"
        >
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-sky-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="text-left truncate">
              <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                <span>{currentUser ? (currentUser.displayName || currentUser.email) : 'Bulut Hesabı (Gmail / E-posta)'}</span>
                {currentUser && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    Senkronize
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {currentUser 
                  ? `${currentUser.email} • Farklı telefonlardan da erişebilirsiniz` 
                  : 'Başka telefondan erişmek için oturum açın veya kaydolun'}
              </div>
            </div>
          </div>

          <button
            id="btn-profile-manage-auth"
            type="button"
            onClick={onOpenAuthModal}
            className="ml-2 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-700 font-bold text-xs border border-sky-200 hover:border-sky-300 transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            {currentUser ? 'Hesabım' : 'Giriş Yap'}
          </button>
        </div>
      )}

      {/* Quick Person Switch Bar */}
      <div className="mb-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-sky-100 shadow-xs" id="quick-person-switcher">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span>Kayıtlı Kişiler / Hızlı Geçiş</span>
          </span>
          <button
            type="button"
            onClick={startNewEmptyPerson}
            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
          >
            <UserPlus className="w-3 h-3" />
            <span>+ Yeni Kişi</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {PRESET_PERSONS.map((p) => {
            const isSelected = name.trim().toLowerCase() === p.name.toLowerCase();
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-sky-50 text-slate-700 border border-slate-200 hover:border-sky-300'
                }`}
              >
                <span>{p.name.split(' ')[0]}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-md ${
                  isSelected ? 'bg-sky-700 text-sky-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {p.weight} kg
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSave} className="space-y-4 flex-1 flex flex-col justify-between" id="profile-form">
        <div className="space-y-3.5 bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-sky-100 shadow-sm">
          
          {/* Person Change Warning Alert */}
          {isDifferentPerson && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-amber-950">⚠️ Kişi Değiştiriliyor!</strong>
                <span className="leading-relaxed">
                  <strong>"{initialProfile.name}"</strong> kullanıcısından <strong>"{name}"</strong> kullanıcısına geçilecek.
                  Kaydedildiğinde bugünün tüketilen su miktarı (0 ml), yudum geçmişi ve hatırlatıcı sayacı sıfırlanacaktır.
                </span>
              </div>
            </div>
          )}

          {/* Ad Soyad */}
          <div>
            <label htmlFor="input-profile-name" className="block text-xs font-bold text-slate-700 mb-1">
              Kişi Adı & Soyadı
            </label>
            <div className="relative">
              <input
                id="input-profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(toTurkishTitleCase(e.target.value))}
                autoCapitalize="words"
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all capitalize"
              />
            </div>
          </div>

          {/* Yaş & Boy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-profile-age" className="block text-xs font-bold text-slate-700 mb-1">
                Yaş
              </label>
              <div className="relative">
                <input
                  id="input-profile-age"
                  type="number"
                  min="10"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="input-profile-height" className="block text-xs font-bold text-slate-700 mb-1">
                Boy (cm)
              </label>
              <div className="relative">
                <input
                  id="input-profile-height"
                  type="number"
                  min="100"
                  max="230"
                  value={height}
                  onChange={(e) => setHeight(Math.max(50, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Kilo (kg) - Kritiktir çünkü Kilo * 35 ml formülü kullanılır */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="input-profile-weight" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Weight className="w-3.5 h-3.5 text-sky-600" />
                <span>Kilonuz (kg)</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                Formül: {weight} kg × 35 ml = {baseCalculatedGoal} ml
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="input-profile-weight"
                type="number"
                min="30"
                max="180"
                value={weight}
                onChange={(e) => {
                  const val = Math.max(30, Number(e.target.value));
                  setWeight(val);
                }}
                className="w-28 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
              {/* Range slider for quick weight adjustment */}
              <input
                type="range"
                min="40"
                max="130"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="flex-1 accent-sky-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Günlük Aktivite Seviyesi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Günlük Hareket & Spor Düzeyi
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActivityLevel('low')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activityLevel === 'low'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Masa Başı
              </button>
              <button
                type="button"
                onClick={() => setActivityLevel('medium')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activityLevel === 'medium'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Orta Aktif (+200ml)
              </button>
              <button
                type="button"
                onClick={() => setActivityLevel('high')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activityLevel === 'high'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Sporcu (+400ml)
              </button>
            </div>
          </div>

          {/* HESAPLANAN HEDEF VURGU KARTI */}
          <div className="bg-gradient-to-br from-sky-50 to-cyan-50/70 p-4 rounded-2xl border border-sky-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                  <Droplet className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-sky-800">
                    Önerilen Günlük Hedef
                  </span>
                  <p className="text-xs text-slate-500">
                    Kilonuz ({weight} kg) × 35 ml {activityBonus > 0 ? `+ ${activityBonus} ml aktivite` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-sky-900">{recommendedGoal}</span>
                <span className="text-xs font-bold text-sky-700 ml-1">ml</span>
              </div>
            </div>

            {/* Ince Ayar / Manuel Hedef Değiştirme */}
            <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 font-medium">Hedefimi İnce Ayarla:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomOverride(true);
                    setCustomGoal((prev) => Math.max(1000, prev - 100));
                  }}
                  className="w-7 h-7 rounded-lg bg-white border border-sky-300 text-sky-700 font-bold hover:bg-sky-100 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  step="50"
                  value={customGoal}
                  onChange={(e) => {
                    setIsCustomOverride(true);
                    setCustomGoal(Number(e.target.value));
                  }}
                  className="w-20 text-center py-1 font-bold text-slate-800 bg-white border border-sky-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomOverride(true);
                    setCustomGoal((prev) => prev + 100);
                  }}
                  className="w-7 h-7 rounded-lg bg-white border border-sky-300 text-sky-700 font-bold hover:bg-sky-100 cursor-pointer"
                >
                  +
                </button>
                {isCustomOverride && (
                  <button
                    type="button"
                    title="Otomatik formüle geri dön"
                    onClick={() => {
                      setIsCustomOverride(false);
                      setCustomGoal(recommendedGoal);
                    }}
                    className="p-1.5 text-slate-400 hover:text-sky-600 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Vücut Kitle İndeksi Özeti */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
            <span>Beden Kitle İndeksi (BKİ): <strong className="text-slate-800">{bmi}</strong></span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Optimal Hidrasyon
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            id="btn-save-profile"
            type="submit"
            className={`w-full py-3.5 px-5 rounded-2xl text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 group active:scale-[0.98] transition-all cursor-pointer ${
              isDifferentPerson
                ? 'bg-gradient-to-r from-amber-600 to-sky-600 hover:from-amber-500 hover:to-sky-500 shadow-amber-500/25'
                : 'bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 shadow-sky-500/20'
            }`}
          >
            {isDifferentPerson ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>"{name}" Olarak Değiştir & Verileri Sıfırla</span>
              </>
            ) : (
              <>
                <span>Hedefimi Kaydet & Dashboard'a Geç</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {onGoBack && (
            <button
              id="btn-profile-back"
              type="button"
              onClick={onGoBack}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Giriş Ekranına Dön
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
