import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { I } from "../icons";

const CORRECT_PASSWORD = "Dublex-26";
const MAX_ATTEMPTS = 3;
const LOCK_DURATION = 5 * 60 * 1000; // 5 دقائق بالميلي ثانية

const STORAGE_KEYS = {
  attempts: "dublex-login-attempts",
  lockUntil: "dublex-login-lock-until",
};

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // تحميل البيانات من localStorage
  useEffect(() => {
    const savedAttempts = localStorage.getItem(STORAGE_KEYS.attempts);
    const savedLockUntil = localStorage.getItem(STORAGE_KEYS.lockUntil);

    if (savedAttempts) setAttempts(parseInt(savedAttempts));
    if (savedLockUntil) {
      const lockTime = parseInt(savedLockUntil);
      if (Date.now() < lockTime) {
        setLockUntil(lockTime);
      } else {
        localStorage.removeItem(STORAGE_KEYS.attempts);
        localStorage.removeItem(STORAGE_KEYS.lockUntil);
      }
    }
  }, []);

  // عداد الوقت المتبقي
  useEffect(() => {
    if (!lockUntil) return;

    const timer = setInterval(() => {
      const remaining = lockUntil - Date.now();
      if (remaining <= 0) {
        clearInterval(timer);
        setLockUntil(null);
        setAttempts(0);
        localStorage.removeItem(STORAGE_KEYS.attempts);
        localStorage.removeItem(STORAGE_KEYS.lockUntil);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockUntil]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [lockUntil]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockUntil) {
      await Swal.fire({
        icon: "error",
        title: "الحساب مقفل",
        text: `يرجى الانتظار ${formatTime(timeLeft)} قبل المحاولة مرة أخرى`,
        confirmButtonColor: "#0E6E55",
        confirmButtonText: "حسناً",
      });
      return;
    }

    if (password === CORRECT_PASSWORD) {
      await Swal.fire({
        icon: "success",
        title: "مرحباً بك!",
        html: `
          <div style="text-align: center; padding: 1rem 0;">
            <p style="font-size: 16px; color: #0B241C; margin-bottom: 0.5rem;">
              تم تسجيل الدخول بنجاح
            </p>
            <p style="font-size: 14px; color: #46705F;">
              مرحباً بك في لوحة تحكم دوبلكس
            </p>
          </div>
        `,
        confirmButtonColor: "#0E6E55",
        confirmButtonText: "دخول",
      });

      localStorage.removeItem(STORAGE_KEYS.attempts);
      localStorage.removeItem(STORAGE_KEYS.lockUntil);
      onLogin();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem(STORAGE_KEYS.attempts, newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + LOCK_DURATION;
        setLockUntil(lockTime);
        localStorage.setItem(STORAGE_KEYS.lockUntil, lockTime.toString());

        await Swal.fire({
          icon: "error",
          title: "تم قفل الحساب",
          html: `
            <div style="text-align: center; padding: 1rem 0;">
              <p style="font-size: 14px; color: #0B241C; margin-bottom: 1rem;">
                تم إدخال كلمة السر بشكل خاطئ ${MAX_ATTEMPTS} مرات
              </p>
              <p style="font-size: 16px; font-weight: bold; color: #DE5537;">
                سيتم فتح الحساب بعد 5 دقائق
              </p>
            </div>
          `,
          confirmButtonColor: "#DE5537",
          confirmButtonText: "حسناً",
        });
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        await Swal.fire({
          icon: "error",
          title: "كلمة السر خاطئة",
          html: `
            <div style="text-align: center; padding: 0.5rem 0;">
              <p style="font-size: 14px; color: #0B241C;">
                كلمة السر التي أدخلتها غير صحيحة
              </p>
              <p style="font-size: 13px; color: #46705F; margin-top: 0.5rem;">
                المحاولات المتبقية: <strong>${remaining}</strong>
              </p>
            </div>
          `,
          confirmButtonColor: "#0E6E55",
          confirmButtonText: "حسناً",
        });
      }

      setPassword("");
      inputRef.current?.focus();
    }
  };

  const isLocked = lockUntil !== null && timeLeft > 0;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* خلفية متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950" />
      
      {/* شبكة زخرفية */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(225,155,16,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225,155,16,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* دوائر زخرفية */}
      <div className="absolute top-20 -right-20 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* بطاقة تسجيل الدخول */}
        <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-line/50 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-ink-900 to-ink-800 px-8 py-10 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(225,155,16,0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 50%, rgba(14,110,85,0.3) 0%, transparent 50%)
                  `,
                }}
              />
            </div>
            
            <div className="relative">
              {/* أيقونة القفل */}
              <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-brand to-brand-deep shadow-xl shadow-brand/30">
                <I n="lock" className="h-10 w-10 text-card" />
              </div>
              
              <h1 className="font-display text-3xl font-extrabold text-card mb-2">
                دوبلكس
              </h1>
              <p className="text-sm text-ink-300 font-medium">
                لوحة تحكم الفريق التكنولوجي
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="lbl flex items-center gap-2 mb-3" htmlFor="password">
                  <I n="lock" className="h-4 w-4 text-brand" />
                  كلمة السر
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLocked}
                    placeholder="أدخل كلمة السر"
                    className="inp !pr-12 text-center text-lg tracking-wider font-mono"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-2 text-ink-400 hover:text-brand transition-colors"
                  >
                    <I n={showPassword ? "eye" : "eye"} className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {isLocked && (
                <div className="rounded-2xl border-2 border-coral/40 bg-gradient-to-br from-coral-soft/50 to-coral-soft/30 p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-coral/20">
                    <I n="alert" className="h-6 w-6 text-coral" />
                  </div>
                  <p className="text-sm font-bold text-coral mb-2">
                    الحساب مقفل مؤقتاً
                  </p>
                  <p className="font-mono text-3xl font-extrabold text-coral mb-2">
                    {formatTime(timeLeft)}
                  </p>
                  <p className="text-xs text-ink-500">
                    يرجى الانتظار قبل المحاولة مرة أخرى
                  </p>
                </div>
              )}

              {!isLocked && attempts > 0 && (
                <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold-soft/50 to-gold-soft/30 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <I n="alert" className="h-4 w-4 text-gold-deep" />
                    <p className="text-sm font-bold text-gold-deep">
                      تحذير أمني
                    </p>
                  </div>
                  <p className="text-xs text-ink-600">
                    المحاولات المتبقية: <strong className="text-gold-deep">{MAX_ATTEMPTS - attempts}</strong>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLocked || !password.trim()}
                className="btn-press w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand to-brand-deep px-6 py-4 font-display text-base font-extrabold text-card shadow-lg shadow-brand/30 transition-all hover:shadow-xl hover:shadow-brand/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <I n="check" className="h-5 w-5" />
                دخول
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-line/50 text-center">
              <p className="text-xs text-ink-400 font-medium">
                © 2025 Dublex Team. جميع الحقوق محفوظة.
              </p>
            </div>
          </div>
        </div>

        {/* نص أسفل البطاقة */}
        <p className="text-center mt-6 text-xs text-ink-400/60">
          نظام آمن ومحمي بكلمة سر
        </p>
      </div>
    </div>
  );
}
