import React from 'react';
import { Droplet, X, AlertTriangle, Sparkles } from 'lucide-react';

interface NotificationAlertProps {
  title?: string;
  message: string | null;
  onDismiss: () => void;
  onTakeSip?: () => void;
}

export const NotificationAlert: React.FC<NotificationAlertProps> = ({
  title = '💧 Su Vakti!',
  message,
  onDismiss,
  onTakeSip,
}) => {
  if (!message) return null;

  return (
    <div 
      className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
      id="notifier1-alert-card"
    >
      <div className="bg-gradient-to-r from-sky-950 via-blue-900 to-sky-900 text-white p-4 rounded-2xl shadow-2xl border border-sky-400/50 backdrop-blur-md flex flex-col gap-3">
        {/* Header line */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/30 border border-sky-400/60 flex items-center justify-center shrink-0 shadow-xs">
              <Droplet className="w-5 h-5 text-cyan-300 fill-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-cyan-300 tracking-wide">
                  {title}
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-snug mt-0.5">
                {message}
              </p>
            </div>
          </div>

          <button
            id="btn-dismiss-alert"
            type="button"
            onClick={onDismiss}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
          <button
            id="btn-alert-dismiss-text"
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium text-sky-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            Sonra Hatırlat
          </button>
          
          {onTakeSip && (
            <button
              id="btn-alert-sip-action"
              type="button"
              onClick={() => {
                onTakeSip();
                onDismiss();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-900 font-bold text-xs rounded-lg shadow-sm hover:from-cyan-300 hover:to-sky-300 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
              <span>Hemen Yudumla (-50ml)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
