import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  Smartphone, 
  ExternalLink, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  signInWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  sendPasswordReset,
  auth, 
  User 
} from '../services/firebase';
import { toTurkishTitleCase } from '../utils/text';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: (user: User) => void;
  onSignOut: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onSignOut,
  initialMode = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setAuthErrorCode(null);
    setSuccessMsg(null);
    setShowPassword(false);
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIframeBlocked(false);
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      setSuccessMsg(`Hoş geldiniz, ${user.displayName || user.email}! Hesabınız bağlandı.`);
      setTimeout(() => {
        onSuccess(user);
        onClose();
      }, 900);
    } catch (err: unknown) {
      console.warn('[Auth] Google sign in notice:', err);
      if (err && typeof err === 'object' && 'code' in err) {
        const code = String((err as { code: unknown }).code);
        if (code === 'auth/popup-closed-by-user') {
          setErrorMsg('Oturum açma penceresi kapatıldı.');
        } else if (code === 'auth/popup-blocked') {
          setIframeBlocked(true);
          setErrorMsg('Tarayıcı açılır pencereyi engelledi. Lütfen aşağıdaki e-posta formunu kullanın veya uygulamayı yeni sekmede açın.');
        } else {
          const detail = err instanceof Error ? err.message : code;
          setErrorMsg('Google ile oturum açılamadı: ' + detail);
        }
      } else {
        setErrorMsg('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Lütfen e-posta adresinizi ve şifrenizi giriniz.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'login') {
        const user = await loginWithEmail(email.trim(), password);
        setSuccessMsg(`Giriş başarılı! Verileriniz yükleniyor...`);
        setTimeout(() => {
          onSuccess(user);
          onClose();
        }, 900);
      } else {
        try {
          const user = await registerWithEmail(email.trim(), password, name.trim());
          setSuccessMsg(`Hesabınız başarıyla oluşturuldu! Hoş geldiniz.`);
          setTimeout(() => {
            onSuccess(user);
            onClose();
          }, 900);
        } catch (regErr: unknown) {
          if (regErr && typeof regErr === 'object' && 'code' in regErr && (regErr as { code: unknown }).code === 'auth/email-already-in-use') {
            // User already has an account with this email. Try auto-logging in with the password provided.
            try {
              const existingUser = await loginWithEmail(email.trim(), password);
              setSuccessMsg(`"${email.trim()}" adresiyle kayıtlı hesabınıza başarıyla giriş yapıldı! Verileriniz yükleniyor...`);
              setTimeout(() => {
                onSuccess(existingUser);
                onClose();
              }, 900);
              return;
            } catch {
              // Password was different, smoothly switch them to login mode without error logging
              setActiveTab('login');
              setAuthErrorCode('auth/email-already-in-use');
              setErrorMsg(
                `"${email.trim()}" adresiyle zaten bir hesap bulunuyor. Oturum Aç sekmesine geçildi. Lütfen mevcut şifrenizi giriniz veya şifrenizi sıfırlayınız.`
              );
              return;
            }
          }
          // Re-throw other errors to be handled below
          throw regErr;
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = String((err as { code: unknown }).code);
        setAuthErrorCode(code);
        if (code === 'auth/operation-not-allowed') {
          setErrorMsg(
            'Bu Firebase projesinde şifreli e-posta kayıt/giriş yöntemi henüz aktif edilmemiş. Ancak Google (Gmail) girişi tamamen aktiftir! Lütfen aşağıdaki "Google (Gmail) ile Bağlan" butonunu kullanarak doğrudan Gmail hesabınızla giriş yapınız.'
          );
        } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          setErrorMsg('Hatalı e-posta veya şifre. Hesabınız yoksa "Hesap Oluştur" sekmesinden yeni hesap açabilir veya Google ile bağlanabilirsiniz.');
        } else if (code === 'auth/email-already-in-use') {
          setActiveTab('login');
          setErrorMsg(
            `"${email.trim()}" e-posta adresiyle zaten kayıtlı bir hesap var! Oturum Aç sekmesine geçildi. Lütfen şifrenizi girin veya Google ile bağlanın.`
          );
        } else if (code === 'auth/invalid-email') {
          setErrorMsg('Geçersiz bir e-posta formatı girdiniz.');
        } else {
          const detail = err instanceof Error ? err.message : code;
          setErrorMsg('İşlem tamamlanamadı: ' + detail);
        }
      } else {
        setErrorMsg('Lütfen girdiğiniz bilgileri kontrol ediniz.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Lütfen şifre sıfırlama bağlantısı gönderebilmemiz için e-posta adresinizi giriniz.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await sendPasswordReset(email.trim());
      setSuccessMsg(`Şifre sıfırlama bağlantısı "${email.trim()}" adresine gönderildi. Lütfen gelen kutunuzu (Spam klasörü dahil) kontrol ediniz.`);
    } catch {
      setErrorMsg('Şifre sıfırlama e-postası gönderilemedi. Lütfen e-posta adresinizi kontrol ediniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="auth-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        id="auth-modal-card"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-cyan-50/40 to-blue-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight tracking-tight">
                {currentUser ? 'Hesabım & Bulut Eşitleme' : 'AquaMind Hesabı'}
              </h2>
              <p className="text-xs text-slate-500">
                {currentUser ? 'Tüm cihazlarınızla anlık senkronizasyon' : 'Başka telefondan veya cihazdan verilerinize erişin'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* If already logged in: Profile info & sign out */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 flex items-center gap-3.5">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Kullanıcı'} 
                    className="w-12 h-12 rounded-full border-2 border-emerald-400 object-cover shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-xs">
                    {(currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {currentUser.displayName || 'AquaMind Kullanıcısı'}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-xs text-slate-500 truncate font-mono">
                    {currentUser.email}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Bulut Veri Senkronizasyonu Aktif</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-sky-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <span>Başka Bir Telefonda Açtığınızda:</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Farklı bir telefondan veya bilgisayardan girdiğinizde <strong>"{currentUser.email}"</strong> ile Oturum Aç diyerek içtiğiniz su miktarına, profilinize ve geçmişinize kaldığınız yerden devam edebilirsiniz.
                </p>
              </div>

              <button
                id="btn-sign-out"
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Oturumu Kapat</span>
              </button>
            </div>
          ) : (
            <>
              {/* Tab Selector: Oturum Aç vs Hesap Oluştur */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  id="tab-btn-login"
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    resetForm();
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Oturum Aç</span>
                </button>
                <button
                  id="tab-btn-register"
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    resetForm();
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'register'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Hesap Oluştur</span>
                </button>
              </div>

              {/* Informational Subtitle */}
              <div className="text-xs text-slate-500 text-center leading-relaxed">
                {activeTab === 'login' 
                  ? 'Kendi Gmail veya e-postanızla giriş yapın; başka telefonda olsanız bile verileriniz otomatik geri yüklensin.'
                  : 'Yeni bir hesap oluşturarak su tüketimi, hedefler ve profilinizi buluta güvenle kaydedin.'}
              </div>

              {/* Status feedback alerts */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="leading-relaxed">{errorMsg}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {authErrorCode === 'auth/email-already-in-use' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('login');
                              setErrorMsg(null);
                              setAuthErrorCode(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>"Oturum Aç" Sekmesine Geç</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleGoogleAuth}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                          >
                            <span>Google ile Giriş Yap</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                          >
                            <span>Şifremi Sıfırla</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGoogleAuth}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Google (Gmail) ile Devam Et</span>
                        </button>
                      )}
                      {iframeBlocked && (
                        <a
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:underline bg-white px-2.5 py-1.5 rounded-xl border border-sky-200"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Yeni Sekmede Aç</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* 1. GOOGLE SIGN IN BUTTON (Primary choice for Gmail) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                    ⭐ Önerilen • Gmail ile Tek Tıkla Bağlan
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Şifresiz & Hızlı</span>
                </div>
                <button
                  id="btn-google-sign-in"
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl border-2 border-sky-200 hover:border-sky-400 bg-white hover:bg-sky-50/50 text-slate-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                >
                  {/* Google Vector Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="text-slate-900">
                    {activeTab === 'login' ? 'Google (Gmail) ile Oturum Aç' : 'Google (Gmail) ile Hesap Oluştur'}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">veya e-posta ile</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* 2. EMAIL & PASSWORD FORM */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {activeTab === 'register' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Adınız Soyadınız
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-input-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(toTurkishTitleCase(e.target.value))}
                        autoCapitalize="words"
                        placeholder="Örn: Ahmet Yılmaz"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all capitalize"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    E-posta (Gmail vb.)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-input-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="adiniz@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Şifre (En az 6 karakter)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-input-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    />
                    <button
                      id="btn-toggle-password-visibility"
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {activeTab === 'login' && (
                    <div className="flex justify-end pt-1">
                      <button
                        id="btn-forgot-password"
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        Şifrenizi mi unuttunuz?
                      </button>
                    </div>
                  )}
                </div>

                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-60 mt-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-pulse">İşleniyor...</span>
                  ) : activeTab === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Oturum Aç & Verileri Yükle</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Hesap Oluştur & Başla</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Güvenli Bulut Veritabanı</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
