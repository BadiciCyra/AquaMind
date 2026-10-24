import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, AlertTriangle, RotateCcw, Droplets, Clock, Target, CheckCircle2, X } from 'lucide-react';

export interface PersonChangeDetails {
  previousName: string;
  newName: string;
  previousGoal: number;
  newGoal: number;
  resetIntake: boolean;
}

interface PersonChangedModalProps {
  isOpen: boolean;
  details: PersonChangeDetails | null;
  onClose: () => void;
}

export const PersonChangedModal: React.FC<PersonChangedModalProps> = ({
  isOpen,
  details,
  onClose,
}) => {
  if (!isOpen || !details) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        id="person-changed-modal-backdrop"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-sky-100 overflow-hidden relative"
          id="person-changed-modal"
        >
          {/* Header Accent Strip */}
          <div className="bg-gradient-to-r from-amber-500 via-sky-500 to-cyan-500 h-2 w-full" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 space-y-4">
            {/* Top Icon and Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    Sistem Uyarısı
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                  Kişi Değiştirildi!
                </h3>
              </div>
            </div>

            {/* Transition Badge (Previous -> New) */}
            <div className="bg-sky-50/80 border border-sky-200/70 p-3.5 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-600">Önceki Kişi</span>
                <span className="font-extrabold text-slate-800 line-through truncate max-w-[100px]">
                  {details.previousName || 'Kullanıcı'}
                </span>
              </div>

              <div className="px-2 py-1 bg-white rounded-lg shadow-xs font-bold text-sky-600 text-xs">
                ➜
              </div>

              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-bold text-sky-800">Aktif Kişi</span>
                <span className="font-extrabold text-sky-900 truncate max-w-[120px]">
                  {details.newName}
                </span>
              </div>
            </div>

            {/* Warning Message & Reset Details */}
            <div className="space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Yeni kullanıcıya geçildiği için şişe ve tüketim bilgileri otomatik olarak sıfırlandı:
              </p>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <Droplets className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">Bugün İçilen Su: 0 ml</span>
                    <span className="text-[11px] text-slate-500">Tüketim sayacı yeni kullanıcı için baştan başladı.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <Clock className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">Hatırlatıcı Süresi Sıfırlandı</span>
                    <span className="text-[11px] text-slate-500">1 saatlik susuzluk sayacı yeni kişi için yeniden başladı.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Yeni Günlük Hedef: {details.newGoal} ml
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {details.newName} için boy ve kilo parametrelerine göre güncellendi.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              id="btn-confirm-person-changed"
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Anladım, Yeni Kişiyle Başla</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
