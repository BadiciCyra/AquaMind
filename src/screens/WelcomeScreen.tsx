import React from 'react';
import { ArrowRight, ShieldCheck, Waves, Bell, Sparkles, ChevronRight, Bluetooth, Droplet, Cloud, LogIn, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { AquaMindLogo } from '../components/AquaMindLogo';
import { CornerDateBadge } from '../components/CornerDateBadge';
import { User } from '../services/firebase';

interface WelcomeScreenProps {
  onStart: () => void;
  onQuickDashboard: () => void;
  userName?: string;
  hasProfile: boolean;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  onQuickDashboard,
  userName,
  hasProfile,
  currentUser,
  onOpenAuthModal,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between py-6 px-4 max-w-md mx-auto w-full text-slate-800" id="welcome-screen">
      {/* Top Tag */}
      <div className="w-full flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-sky-900 bg-sky-100/80 px-2.5 py-1 rounded-full border border-sky-200">
            Akıllı Su Şişesi
          </span>
        </div>
        <CornerDateBadge />
      </div>

      {/* Hero Visual Card with User's Official AquaMind Logo */}
      <div className="my-auto flex flex-col items-center text-center py-4">
        {/* Official Brand Logo */}
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-sky-400/20 rounded-full blur-2xl scale-110 animate-pulse" />
          <AquaMindLogo size="xl" showSubtitle={false} className="relative z-10" />
        </div>

        {/* Title and Tagline */}
        <div className="space-y-1.5 max-w-xs sm:max-w-sm mt-2">
          <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
            <span className="text-[#0c3b6d]">Aqua</span>
            <span className="text-[#00b4d8]">Mind</span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-0.5 text-slate-700">
            <span className="w-6 h-[1.5px] bg-[#0c3b6d]/60 rounded-full" />
            <span className="text-xs font-black text-[#0c3b6d] uppercase tracking-widest">
              SU İÇMEYİ UNUTMA
            </span>
            <span className="w-6 h-[1.5px] bg-[#0c3b6d]/60 rounded-full" />
          </div>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-2">
            Hassas sıvı seviye takibi, günlük su hedefleri ve düzenli hatırlatıcılarla sağlıklı hidrasyon alışkanlığı kazanın.
          </p>
        </div>

        {/* User-Friendly Feature Pills (Clean, no raw sensor IDs) */}
        <div className="grid grid-cols-3 gap-2 mt-5 w-full max-w-xs text-left">
          <div className="bg-white/80 backdrop-blur-xs border border-sky-100 p-2.5 rounded-xl text-center shadow-xs">
            <Bluetooth className="w-4 h-4 text-sky-600 mx-auto mb-1" />
            <span className="block text-[11px] font-bold text-slate-800">Bluetooth</span>
            <span className="block text-[9px] text-slate-500">Hızlı Bağlantı</span>
          </div>
          <div className="bg-white/80 backdrop-blur-xs border border-sky-100 p-2.5 rounded-xl text-center shadow-xs">
            <Droplet className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
            <span className="block text-[11px] font-bold text-slate-800">Otomatik Seviye</span>
            <span className="block text-[9px] text-slate-500">Akıllı Takip</span>
          </div>
          <div className="bg-white/80 backdrop-blur-xs border border-sky-100 p-2.5 rounded-xl text-center shadow-xs">
            <Bell className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <span className="block text-[11px] font-bold text-slate-800">1 Saat Uyarısı</span>
            <span className="block text-[9px] text-slate-500">Düzenli Hatırlatma</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="w-full space-y-2.5 pb-2">
        {/* Cloud Account Sync Strip */}
        {onOpenAuthModal && (
          <button
            id="btn-welcome-auth"
            type="button"
            onClick={onOpenAuthModal}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-white/90 hover:bg-sky-50/90 border border-sky-200/80 shadow-xs flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="text-left truncate">
                <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                  <span>{currentUser ? (currentUser.displayName || currentUser.email) : 'Başka Telefondan mı Giriyorsunuz?'}</span>
                  {currentUser && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentUser ? 'Hesabınız bağlı • Bulut senkronize' : 'Oturum açın veya hesap oluşturun'}
                </div>
              </div>
            </div>

            <span className="text-xs font-bold text-sky-700 bg-sky-50 group-hover:bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200 shrink-0">
              {currentUser ? 'Hesabım' : 'Oturum Aç ➜'}
            </span>
          </button>
        )}

        {/* Primary Start Button */}
        <button
          id="btn-welcome-start"
          type="button"
          onClick={onStart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 group active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>{hasProfile ? 'Profil & Hedefimi Düzenle' : 'Hadi Başlayalım!'}</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Secondary Direct Jump */}
        <button
          id="btn-welcome-skip"
          type="button"
          onClick={onQuickDashboard}
          className="w-full py-2 px-4 text-xs font-bold text-slate-600 hover:text-sky-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{hasProfile ? `Hoş geldin, ${userName || 'Kullanıcı'} • Doğrudan Dashboard'a Git` : 'Doğrudan Dashboard Ekranına Geç'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
