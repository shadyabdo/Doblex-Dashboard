import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { I } from "../icons";

const CORRECT_PASSWORD = "Dublex-26";
const MAX_ATTEMPTS = 3;
const LOCK_DURATION = 5 * 60 * 1000;

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
        text: "تم تسجيل الدخول بنجاح",
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
          text: "تم إدخال كلمة السر بشكل خاطئ 3 مرات. سيتم فتح الحساب بعد 5 دقائق",
          confirmButtonColor: "#DE5537",
          confirmButtonText: "حسناً",
        });
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        await Swal.fire({
          icon: "error",
          title: "كلمة السر خاطئة",
          text: `المحاولات المتبقية: ${remaining}`,
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
      <div className="w-full max-w-sm">
        {/* الشعار */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-brand">
            <I n="lock" className="h-8 w-8 text-card" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            دوبلكس
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            لوحة تحكم الفريق
          </p>
        </div>

        {/* بطاقة تسجيل الدخول */}
        <div className="bg-card rounded-2xl shadow-lg border border-line p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2" htmlFor="password">
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
                className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-card text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all disabled:opacity-50"
                autoComplete="current-password"
              />
            </div>

            {isLocked && (
              <div className="rounded-xl border-2 border-coral bg-coral-soft p-4 text-center">
                <p className="text-sm font-bold text-coral mb-1">
                  الحساب مقفل
                </p>
                <p className="font-mono text-2xl font-bold text-coral">
                  {formatTime(timeLeft)}
                </p>
              </div>
            )}

            {!isLocked && attempts > 0 && (
              <div className="rounded-xl border border-gold bg-gold-soft p-3 text-center">
                <p className="text-xs font-semibold text-gold-deep">
                  المحاولات المتبقية: {MAX_ATTEMPTS - attempts}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLocked || !password.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-display text-sm font-bold text-card transition-all hover:bg-brand-deep disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <I n="check" className="h-4 w-4" />
              دخول
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-line text-center">
            <p className="text-xs text-ink-400">
              © 2026 Dublex Team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
