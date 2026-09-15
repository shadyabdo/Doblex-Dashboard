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
        // الوقت انتهى، نعمل reset
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

  // Focus على input عند التحميل
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
      // كلمة السر صحيحة
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
        showClass: {
          popup: "animate__animated animate__fadeInUp",
        },
      });

      // مسح المحاولات
      localStorage.removeItem(STORAGE_KEYS.attempts);
      localStorage.removeItem(STORAGE_KEYS.lockUntil);

      onLogin();
    } else {
      // كلمة السر خاطئة
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem(STORAGE_KEYS.attempts, newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        // قفل الحساب
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
        // محاولة خاطئة
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
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 mx-auto bg-card rounded-2xl shadow-lg flex items-center justify-center border border-line">
              <I n="lock" className="h-10 w-10 text-brand" />
            </div>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-900 mb-2">
            دوبلكس
          </h1>
          <p className="text-sm text-ink-500">لوحة تحكم الفريق</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl shadow-xl border border-line p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="lbl" htmlFor="password">
                كلمة السر
              </label>
              <input
                ref={inputRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocked}
                placeholder="أدخل كلمة السر"
                className="inp text-center text-lg tracking-wider"
                autoComplete="current-password"
              />
            </div>

            {isLocked && (
              <div className="rounded-xl border-2 border-coral/40 bg-coral-soft/30 p-4 text-center">
                <p className="text-sm font-bold text-coral mb-2">
                  الحساب مقفل مؤقتاً
                </p>
                <p className="font-mono text-2xl font-extrabold text-coral">
                  {formatTime(timeLeft)}
                </p>
                <p className="text-xs text-ink-500 mt-2">
                  يرجى الانتظار قبل المحاولة مرة أخرى
                </p>
              </div>
            )}

            {!isLocked && attempts > 0 && (
              <div className="rounded-xl border border-gold/40 bg-gold-soft/30 p-3 text-center">
                <p className="text-xs font-semibold text-gold-deep">
                  المحاولات المتبقية: {MAX_ATTEMPTS - attempts}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLocked || !password.trim()}
              className="btn-press w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-display text-sm font-extrabold text-card transition-colors hover:bg-brand-deep disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <I n="check" className="h-5 w-5" />
              دخول
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-line text-center">
            <p className="text-xs text-ink-400">
              © 2025 Dublex Team. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
