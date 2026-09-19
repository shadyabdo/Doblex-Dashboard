import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useStore } from "../store";
import { I, type IconName } from "../icons";

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* علامات + في أركان البطاقة — لمسة المخطط الهندسي */
export function Ticks({ className = "text-ink-300" }: { className?: string }) {
  const base = "pointer-events-none absolute font-mono text-[13px] leading-none select-none";
  return (
    <>
      <span className={`${base} top-1 start-1.5 ${className}`}>+</span>
      <span className={`${base} top-1 end-1.5 ${className}`}>+</span>
      <span className={`${base} bottom-1 start-1.5 ${className}`}>+</span>
      <span className={`${base} bottom-1 end-1.5 ${className}`}>+</span>
    </>
  );
}

/* سطر تمهيدي فوق العناوين */
export function Overline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.18em] text-ink-500 ${className}`}
    >
      <span className="inline-block h-2 w-2 bg-gold" />
      {children}
    </p>
  );
}

/* ظهور تدريجي عند التمرير */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(18px)",
        transition: prefersReducedMotion()
          ? "none"
          : `opacity 0.6s cubic-bezier(0.22,0.9,0.32,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,0.9,0.32,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* رقم متصاعد */
export function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setN(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 900;
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return (
    <span ref={ref} className={className}>
      {n}
    </span>
  );
}

/* حلقة تقدّم */
export function ProgressRing({
  pct,
  size = 132,
  stroke = 11,
  color = "var(--color-gold)",
  sub,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [off, setOff] = useState(c);
  useEffect(() => {
    const t = window.setTimeout(() => setOff(c - (Math.min(100, Math.max(0, pct)) / 100) * c), 200);
    return () => window.clearTimeout(t);
  }, [pct, c]);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-100)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: prefersReducedMotion() ? "none" : "stroke-dashoffset 1.1s cubic-bezier(0.22,0.9,0.32,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="font-mono text-2xl font-bold text-ink-900">{Math.round(pct)}%</span>
        {sub && <p className="mt-0.5 text-[10px] font-semibold text-ink-400">{sub}</p>}
      </div>
    </div>
  );
}

/* نافذة منبثقة */
export function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]" onClick={onClose} aria-label="إغلاق" />
      <div
        className={`pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-ink-100 bg-paper shadow-2xl sm:rounded-2xl ${
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

/* تأكيد إجراء خطر */
export function Confirm({
  open,
  title,
  desc,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  desc: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="p-6">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral-soft text-coral">
            <I n="trash" className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-extrabold text-ink-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-7 text-ink-500">{desc}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="btn-press rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-50"
          >
            تراجع
          </button>
          <button
            onClick={onConfirm}
            className="btn-press rounded-xl bg-coral px-5 py-2.5 font-display text-sm font-bold text-card hover:brightness-110"
          >
            نعم، احذف
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* حالة فارغة */
export function EmptyState({
  icon,
  title,
  desc,
  children,
}: {
  icon: IconName;
  title: string;
  desc: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative rounded-2xl border border-dashed border-ink-200 bg-card/60 px-6 py-16 text-center">
      <Ticks />
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
        <I n={icon} className="h-8 w-8" />
      </span>
      <h3 className="mt-5 font-display text-lg font-extrabold text-ink-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-ink-400">{desc}</p>
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </div>
  );
}

/* إشعارات */
export function Toasts() {
  const { toasts, dismissToast } = useStore();
  const iconOf: Record<string, IconName> = { success: "check", error: "x", info: "cloud" };
  const colorOf: Record<string, string> = {
    success: "bg-brand",
    error: "bg-coral",
    info: "bg-sea",
  };
  return (
    <div className="pointer-events-none fixed bottom-5 start-5 z-[90] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-in pointer-events-auto flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-card shadow-2xl"
        >
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colorOf[t.kind]} text-card`}>
            <I n={iconOf[t.kind]} className="h-4 w-4" />
          </span>
          <p className="flex-1 text-[13px] font-semibold leading-6">{t.msg}</p>
          <button onClick={() => dismissToast(t.id)} className="btn-press text-ink-400 hover:text-card" aria-label="إغلاق الإشعار">
            <I n="x" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* تحويل ملف صورة إلى DataURL مع تصغير الأبعاد حفاظًا على مساحة التخزين */


/* مصغّرة صورة مع نسخ الرابط المباشر وزر حذف */
export function Thumb({
  src,
  onRemove,
  className = "h-28",
}: {
  src: string;
  onRemove: () => void;
  className?: string;
}) {
  const { toast } = useStore();
  const remote = /^https?:\/\//i.test(src);
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-ink-100 bg-ink-50 ${className}`}>
      <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      {remote && (
        <span className="absolute top-1.5 start-1.5 flex items-center gap-1 rounded-md bg-ink-950/70 px-1.5 py-0.5 text-[9px] font-bold text-card backdrop-blur-sm">
          <I n="link" className="h-2.5 w-2.5" />
          رابط مباشر
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-ink-950/70 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {remote && (
          <button
            type="button"
            aria-label="نسخ رابط الصورة"
            onClick={() => {
              navigator.clipboard
                ?.writeText(src)
                .then(() => toast("تم نسخ رابط الصورة"))
                .catch(() => toast("تعذّر النسخ", "error"));
            }}
            className="btn-press flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 text-ink-700 backdrop-blur-sm transition-colors hover:bg-gold-soft hover:text-gold-deep"
          >
            <I n="copy" className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="حذف الصورة"
          className="btn-press flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 text-ink-700 backdrop-blur-sm transition-colors hover:bg-coral hover:text-card"
        >
          <I n="x" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* إدخال كلمات مفتاحية كشرائح */
export function ChipInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className="inp flex min-h-[44px] flex-wrap items-center gap-1.5 !py-2">
      {value.map((k) => (
        <span key={k} className="pop flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-[12px] font-bold text-gold-deep">
          {k}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== k))} aria-label={`حذف ${k}`} className="btn-press hover:text-coral">
            <I n="x" className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-ink-300"
        placeholder={value.length ? "" : placeholder ?? "اكتب ثم Enter"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => draft.trim() && add()}
      />
    </div>
  );
}

/* مفتاح تبديل */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label ?? "تبديل"}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-brand" : "bg-ink-200"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all duration-300 ${
          on ? "start-6" : "start-1"
        }`}
      />
    </button>
  );
}

/* شريط متحرك متكرر */
export function Marquee({ items }: { items: string[] }) {
  const row = items.length ? items : ["دوبلكس — نبني، نسوّق، نصمّم، ونمنتج"];
  const doubled = [...row, ...row];
  return (
    <div className="marquee border-y border-ink-800 bg-ink-950 py-2.5 text-ink-300" dir="ltr">
      <div className="marquee-track">
        {doubled.map((s, i) => (
          <span key={i} className="flex items-center whitespace-nowrap font-mono text-[11px] font-medium tracking-wide">
            <span className="mx-6 text-gold">◆</span>
            <span dir="rtl">{s}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* عنوان بتأثير فك الشيفرة */
const SCRAMBLE_CHARS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
export function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setOut(text);
      return;
    }
    let frame = 0;
    const total = Math.max(10, text.length * 2 + 6);
    const id = window.setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      if (reveal >= text.length) {
        setOut(text);
        window.clearInterval(id);
        return;
      }
      let s = text.slice(0, reveal);
      for (let i = reveal; i < text.length; i++) {
        const ch = text[i];
        s += ch === " " ? " " : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      setOut(s);
    }, 34);
    return () => window.clearInterval(id);
  }, [text]);
  return <span className={className}>{out}</span>;
}

/* شارة حالة المزامنة */
export function SyncBadge({ onClick }: { onClick?: () => void }) {
  const { sync } = useStore();
  const map = {
    connecting: { dot: "bg-gold text-gold pulse-dot", label: "جارِ الاتصال…" },
    cloud: { dot: "bg-brand text-brand pulse-dot", label: "متزامن مع فايربيز" },
    error: { dot: "bg-coral text-coral", label: "خطأ بالاتصال" },
  }[sync.mode];
  return (
    <button
      onClick={onClick}
      className="btn-press flex items-center gap-2 rounded-full border border-ink-100 bg-card px-3 py-1.5 text-[11px] font-bold text-ink-600 hover:border-brand/50 hover:text-brand"
      title="إعدادات المزامنة"
    >
      <span className={`h-2 w-2 rounded-full ${map.dot}`} />
      {map.label}
    </button>
  );
}

/* مكون الأكورديون */
export function Accordion({
  items,
  className = "",
}: {
  items: { id: string; title: string; content: string }[];
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="rounded-xl border border-line bg-card overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="btn-press flex w-full items-center justify-between gap-3 px-4 py-3 text-start hover:bg-ink-50"
            >
              <span className="font-display text-sm font-bold text-ink-800">{item.title}</span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                  isOpen ? "bg-brand text-card rotate-180" : "bg-ink-100 text-ink-500"
                }`}
              >
                <I n="arrow" className="h-4 w-4 rotate-90" />
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 text-sm leading-7 text-ink-600">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
