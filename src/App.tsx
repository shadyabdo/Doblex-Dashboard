import { useEffect, useMemo, useRef, useState } from "react";
import { StoreProvider, useStore } from "./store";
import Sidebar from "./components/Sidebar";
import { Marquee, Modal, ScrambleText, SyncBadge, Toasts, Ticks } from "./components/ui";
import Overview from "./views/Overview";
import Fields from "./views/Fields";
import FieldDetail from "./views/FieldDetail";
import Projects from "./views/Projects";
import ProjectForm from "./views/ProjectForm";
import Articles from "./views/Articles";
import ArticleForm from "./views/ArticleForm";
import { I } from "./icons";
import {
  DEFAULT_CONFIG,
  DOC_PATH,
  getEffectiveConfig,
  isAutoConnectDisabled,
  isValidConfig,
  loadStoredConfig,
  runDiagnostics,
  testConnection,
  type DiagStep,
  type FirebaseConfig,
} from "./firebase";

const CONSOLE_LINKS: { label: string; url: string }[] = [
  {
    label: "قواعد الأمان",
    url: "https://console.firebase.google.com/project/dublex-26/firestore/rules",
  },
  {
    label: "قاعدة Firestore",
    url: "https://console.firebase.google.com/project/dublex-26/firestore",
  },
  {
    label: "الدخول المجهول",
    url: "https://console.firebase.google.com/project/dublex-26/authentication/providers",
  },
];
import { LOGO_URL, formatTime, type View, type ViewName } from "./types";
import { IMAGE_HOST_URL } from "./imageHelp";

const SECTIONS: Record<ViewName, { t: string; en: string; s: string }> = {
  overview: { t: "نظرة عامة", en: "OVERVIEW", s: "كل ما يخص فريق دوبلكس في لوحة واحدة" },
  fields: { t: "المجالات", en: "FIELDS", s: "خطوط عمل الفريق — أضف وعدّل واحذف" },
  "field-detail": { t: "صفحة المجال", en: "FIELD PAGE", s: "مشاريع المجال وعداد مشاهداته" },
  projects: { t: "المشاريع", en: "PROJECTS", s: "أرشيف شغل الفريق بالأهداف والإنجازات" },
  "project-form": { t: "إضافة مشروع", en: "NEW PROJECT", s: "اختر المجال ثم أدخل بيانات المشروع" },
  articles: { t: "المقالات", en: "ARTICLES", s: "محتوى الفريق المعرفي وكلماته المفتاحية" },
  "article-form": { t: "مقال جديد", en: "NEW ARTICLE", s: "اكتب وانشر مع الكلمات المفتاحية" },
};

/* ====== محتوى دليل الربط ====== */
const RULES_SAMPLE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dashboards/{dashboardId} {
      allow read, write: if true;
    }
  }
}`;

const RULES_LOCKED = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dashboards/{dashboardId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

const STRUCTURE_SAMPLE = `{
  "fields": [
    {
      "id": "f-web",                // معرّف فريد للمجال
      "name": "تطوير الويب",        // الاسم الظاهر في الداشبورد
      "desc": "مواقع ومتاجر ومنصات ويب سريعة",
      "icon": "code",               // code | megaphone | palette | film | camera | globe | chart | spark | pen | briefcase
      "color": "#0E6E55",           // اللون الأساسي للمجال
      "soft": "#D9EAE2",            // نفس اللون بدرجة فاتحة للخلفيات
      "isVideo": true,              // اختياري — المجال يحتوي فيديوهات (تظهر خانة رابط الفيديو بمشاريعه)
      "views": 1240,                // ★ عداد مشاهدات صفحة المجال — يقرأه ويزيده الموقع
      "createdAt": 1735689600000    // تاريخ الإضافة (مللي ثانية)
    }
  ],

  "projects": [
    {
      "id": "p-nova",
      "fieldId": "f-web",           // ربط بالمجال (قيمة id من fields)
      "fieldLabel": "تطوير الويب",  // اسم المجال وقت الإضافة (أرشيف)
      "title": "منصة نوفا ستور",
      "subtitle": "متجر إلكتروني متكامل",
      "client": "نوفا فاشون",
      "year": "2025",
      "status": "done",             // planning | active | done
      "cover": "https://.../image.png",
      "images": [ { "id": "i1", "src": "https://.../photo.png" } ],
      "description": "وصف المشروع…",
      "details": "تفاصيل التنفيذ…",
      "goals": [
        { "id": "g1", "text": "زمن تحميل أقل من ثانية", "done": true }
      ],
      "achievements": [
        { "id": "a1", "metric": "+38%", "text": "زيادة في معدل التحويل" }
      ],
      "videoUrl": "https://www.youtube.com/embed/…",  // اختياري — رابط embed يُعرض في iframe (للمجالات الفيديوية)
      "links": [                              // اختياري — روابط الملحقات: ديمو، كود، تصميم، إلخ
        { "id": "l1", "type": "demo", "label": "الموقع الرسمي", "url": "https://example.com" },
        { "id": "l2", "type": "github", "label": "الكود المصدري", "url": "https://github.com/…" },
        { "id": "l3", "type": "figma", "label": "ملف التصميم", "url": "https://figma.com/…" }
      ],
      "createdAt": 1735689600000
    }
  ],

  "articles": [
    {
      "id": "ar-1",
      "title": "عنوان المقال",
      "keywords": ["SEO", "تحسين محركات البحث"],  // الكلمات المفتاحية كما كُتبت
      "tags": ["seo", "تحسين-محركات-البحث"],      // ★ وسوم جاهزة يقرأها الموقع (نفس الكلمات بصيغة slug)
      "fieldLabel": "التسويق الرقمي",       // اختياري
      "excerpt": "ملخص يظهر في البطاقة…",
      "body": "محتوى المقال كاملًا، سطر فارغ = فقرة جديدة",
      "cover": "https://iili.io/…jpg",  // صورة المقال — رابط مباشر
      "published": true,             // false = مسودة
      "publishedAt": 1735689600000,  // ★ تاريخ النشر الفعلي — يقرأه الموقع (null للمسودات)
      "views": 356,                  // ★ عداد مشاهدات صفحة المدونة — يقرأه ويزيده الموقع
      "readMins": 6,                 // يُحسب تلقائيًا من طول المحتوى
      "createdAt": 1735689600000
    }
  ],

  "updatedAt": 1735689600000   // يُحدَّث تلقائيًا مع كل مزامنة
}`;

function CopyBtn({ text, label = "نسخ" }: { text: string; label?: string }) {
  const { toast } = useStore();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast("تم النسخ إلى الحافظة");
    } catch {
      toast("تعذّر النسخ تلقائيًا — حدّد النص وانسخه يدويًا", "error");
    }
  };
  return (
    <button
      onClick={() => void copy()}
      className="btn-press flex items-center gap-1.5 rounded-lg border border-ink-200 bg-card px-2.5 py-1.5 font-mono text-[10px] font-bold text-ink-500 transition-colors hover:border-brand hover:text-brand"
    >
      <I n="copy" className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function CodeBlock({ code, dir = "ltr" }: { code: string; dir?: "ltr" | "rtl" }) {
  return (
    <pre
      dir={dir}
      className="max-h-[300px] overflow-auto rounded-xl border border-line bg-ink-950 p-4 font-mono text-[11px] leading-6 text-ink-100"
    >
      {code}
    </pre>
  );
}

type CloudTab = "steps" | "structure" | "rules";

/* نافذة إعدادات فايربيز */
function CloudModal({
  open,
  onClose,
  initialTab = "steps",
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: CloudTab;
}) {
  const { sync, connectFirebase, disconnectFirebase, resetAllData, toast } = useStore();
  const [raw, setRaw] = useState(() => {
    const c = loadStoredConfig();
    return JSON.stringify(c ?? DEFAULT_CONFIG, null, 2);
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<CloudTab>(initialTab);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagSteps, setDiagSteps] = useState<DiagStep[] | null>(null);
  const [locked, setLocked] = useState(true);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const holdRaf = useRef<number | null>(null);
  const lastBlockToast = useRef(0);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(
    () => () => {
      if (holdRaf.current) cancelAnimationFrame(holdRaf.current);
    },
    []
  );

  const warnBlocked = (msg = "نسخ ممنوع — أكواد ربط فايربيز محمية") => {
    const now = Date.now();
    if (now - lastBlockToast.current < 1200) return;
    lastBlockToast.current = now;
    toast(`⛔ ${msg}`, "error");
  };

  const startUnlockHold = () => {
    const started = performance.now();
    const tick = () => {
      const p = Math.min(100, ((performance.now() - started) / 1600) * 100);
      setUnlockProgress(p);
      if (p >= 100) {
        setLocked(false);
        setUnlockProgress(0);
        toast("تم إلغاء القفل — أي تعديل في الأكواد الآن مسؤوليتك الكاملة", "info");
        return;
      }
      holdRaf.current = requestAnimationFrame(tick);
    };
    holdRaf.current = requestAnimationFrame(tick);
  };

  const cancelUnlockHold = () => {
    if (holdRaf.current) cancelAnimationFrame(holdRaf.current);
    holdRaf.current = null;
    setUnlockProgress(0);
  };

  const diagnose = async () => {
    setErr("");
    let cfg: unknown;
    try {
      cfg = JSON.parse(raw);
    } catch {
      setErr("الصيغة ليست JSON صحيحة.");
      return;
    }
    if (!isValidConfig(cfg)) {
      setErr("تأكد من وجود apiKey و authDomain و projectId في الإعدادات.");
      return;
    }
    setDiagnosing(true);
    setDiagSteps(null);
    const steps = await runDiagnostics(cfg as FirebaseConfig);
    setDiagSteps(steps);
    setDiagnosing(false);
    const failed = steps.filter((s) => !s.ok);
    if (failed.length === 0) toast("كل خطوات الاتصال سليمة ✔");
  };

  const activate = async () => {
    setErr("");
    let cfg: unknown;
    try {
      cfg = JSON.parse(raw);
    } catch {
      setErr("الصيغة ليست JSON صحيحة — انسخ الإعدادات كما هي من وحدة تحكم فايربيز.");
      return;
    }
    if (!isValidConfig(cfg)) {
      setErr("تأكد من وجود apiKey و authDomain و projectId في الإعدادات.");
      return;
    }
    setBusy(true);
    const t = await testConnection(cfg as FirebaseConfig);
    setBusy(false);
    if (!t.ok) {
      setErr(t.error);
      return;
    }
    connectFirebase(cfg as FirebaseConfig);
    setLocked(true);
    toast("تم الاتصال بفايربيز — المزامنة فعّالة");
    onClose();
  };

  const tabs: { key: CloudTab; label: string; icon: "sync" | "sliders" | "target" }[] = [
    { key: "steps", label: "خطوات التجهيز", icon: "sync" },
    { key: "structure", label: "هيكل البيانات", icon: "sliders" },
    { key: "rules", label: "قواعد الأمان", icon: "target" },
  ];

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.25em] text-ink-400">
              <I n="cloud" className="h-4 w-4 text-brand" />
              FIREBASE / المزامنة السحابية
            </p>
            <h2 className="mt-2 font-display text-xl font-extrabold text-ink-900">المزامنة مع فايربيز</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-press flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 text-ink-500 hover:bg-coral-soft hover:text-coral"
            aria-label="إغلاق"
          >
            <I n="x" className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-7 text-ink-500">
          الداشبورد متصلة مسبقًا بمشروع
          <code dir="ltr" className="mx-1 rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand-deep">
            dublex-26
          </code>
          وستُحفظ بياناتك (المجالات، المشاريع، المقالات) في Firestore لتُشارك لحظيًا مع
          كل أعضاء الفريق. أكواد الربط مقفولة ومحمية ولا يفتحها إلا مطوّر الفريق.
        </p>

        {isAutoConnectDisabled() && (
          <div className="pop mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gold/40 bg-gold-soft/50 px-4 py-3">
            <span className="flex-1 text-[12px] font-bold leading-6 text-ink-700">
              الاتصال معطّل — فعّله للبدء في استخدام الداشبورد.
            </span>
            <button
              onClick={() => {
                connectFirebase(getEffectiveConfig());
                toast("جارِ إعادة الاتصال بفايربيز…", "info");
              }}
              className="btn-press flex items-center gap-2 rounded-xl bg-gold px-4 py-2 font-display text-[12px] font-extrabold text-ink-950 hover:brightness-105"
            >
              <I n="sync" className="h-4 w-4" />
              تفعيل الاتصال
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-50/70 px-4 py-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              sync.mode === "cloud"
                ? "bg-brand pulse-dot text-brand"
                : sync.mode === "connecting"
                  ? "bg-gold pulse-dot text-gold"
                  : sync.mode === "error"
                    ? "bg-coral"
                    : "bg-gold"
            }`}
          />
          <span className="text-[12px] font-bold text-ink-600">
            {sync.mode === "cloud"
              ? `متصل — مشروع ${sync.projectId ?? ""}${sync.lastSync ? ` · آخر مزامنة ${formatTime(sync.lastSync)}` : ""}`
              : sync.mode === "connecting"
                ? "جارِ الاتصال…"
                : sync.mode === "error"
                  ? `خطأ: ${sync.error ?? "راجع الإعدادات"}`
                  : "غير متصل — البيانات تُحفظ محليًا في متصفحك"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-ink-400">روابط مباشرة للكونسول:</span>
          {CONSOLE_LINKS.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="btn-press flex items-center gap-1.5 rounded-full border border-ink-200 bg-card px-3 py-1.5 text-[11px] font-bold text-ink-600 transition-colors hover:border-brand hover:text-brand"
            >
              <I n="link" className="h-3 w-3" />
              {l.label}
            </a>
          ))}
        </div>

        {/* تحذير عدم العبث بأكواد الربط */}
        <div className="mt-5 overflow-hidden rounded-xl border-2 border-coral/40 shadow-sm">
          <div
            className="h-2.5 w-full"
            style={{
              background:
                "repeating-linear-gradient(-45deg, var(--color-coral) 0 14px, var(--color-gold) 14px 28px)",
            }}
          />
          <div className="flex items-start gap-3 bg-coral-soft/50 px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral text-card">
              <I n="alert" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[13px] font-extrabold leading-6 text-coral">
                تحذير: العبث بأكواد ربط فايربيز يتلف الداشبورد
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-ink-600">
                هذه الأكواد هي شريان الاتصال بين الداشبورد وقاعدة بيانات الفريق. أي تعديل أو
                نسخ أو مشاركة لها قد يقطع المزامنة نهائيًا أو يعرّض البيانات للخطر. يُمنع
                النسخ منعًا باتًا — لا يفتح القفل إلا مطوّر الفريق.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="lbl !mb-0" htmlFor="fb-cfg">
            أكواد ربط Firebase <span className="font-normal text-ink-400">(محمية)</span>
          </label>
          {locked ? (
            <span className="flex items-center gap-1.5 rounded-full bg-coral-soft px-3 py-1 text-[11px] font-extrabold text-coral">
              <I n="lock" className="h-3.5 w-3.5" />
              مقفولة
            </span>
          ) : (
            <button
              onClick={() => {
                setLocked(true);
                toast("تمت إعادة قفل الأكواد", "info");
              }}
              className="btn-press flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-[11px] font-extrabold text-card hover:bg-brand-deep"
            >
              <I n="lock" className="h-3.5 w-3.5" />
              إعادة القفل
            </button>
          )}
        </div>

        <div
          className="relative mt-2 overflow-hidden rounded-xl border-2 transition-colors"
          style={{ borderColor: locked ? "var(--color-coral)" : "var(--color-brand)" }}
          onCopy={(e) => {
            if (locked) {
              e.preventDefault();
              warnBlocked();
            }
          }}
          onCut={(e) => {
            if (locked) {
              e.preventDefault();
              warnBlocked();
            }
          }}
          onContextMenu={(e) => {
            if (locked) {
              e.preventDefault();
              warnBlocked("قائمة النسخ معطلة هنا — الأكواد محمية");
            }
          }}
          onDragStart={(e) => {
            if (locked) {
              e.preventDefault();
              warnBlocked("سحب الأكواد ممنوع");
            }
          }}
        >
          <textarea
            id="fb-cfg"
            dir="ltr"
            readOnly={locked}
            spellCheck={false}
            className={`inp !rounded-none !border-0 min-h-[150px] !font-mono !text-[12px] !leading-6 focus:!shadow-none ${
              locked ? "pointer-events-none select-none blur-[4px]" : ""
            }`}
            value={raw}
            onChange={(e) => {
              if (!locked) setRaw(e.target.value);
            }}
          />

          {locked && (
            <div
              className="absolute inset-0 z-10 flex cursor-not-allowed flex-col items-center justify-center gap-2.5 text-center"
              style={{
                background:
                  "repeating-linear-gradient(45deg, rgba(222,85,55,0.09) 0 16px, rgba(222,85,55,0.18) 16px 32px), rgba(222,85,55,0.08)",
                backdropFilter: "blur(1px)",
              }}
              onClick={() => warnBlocked("ممنوع النسخ — هذه الأكواد محمية بقفل")}
            >
              <span className="pulse-dot flex h-13 w-13 items-center justify-center rounded-full bg-coral p-3.5 text-card shadow-lg shadow-coral/30">
                <I n="lock" className="h-6 w-6" />
              </span>
              <p className="font-display text-lg font-extrabold tracking-tight text-coral">
                ممنوع النسخ
              </p>
              <p className="max-w-[280px] text-[11px] font-bold leading-5 text-ink-700">
                أكواد ربط فايربيز مقفولة ومحمية — النسخ أو التعديل أو المشاركة ممنوع،
                والعبث بها يتلف الداشبورد.
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {locked ? (
            <button
              onPointerDown={startUnlockHold}
              onPointerUp={cancelUnlockHold}
              onPointerLeave={cancelUnlockHold}
              className="btn-press relative flex items-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-ink-300 px-4 py-2.5 text-[12px] font-extrabold text-ink-600 transition-colors hover:border-gold hover:text-gold-deep"
            >
              <span
                className="absolute inset-y-0 start-0 bg-gold/25 transition-none"
                style={{ width: `${unlockProgress}%` }}
              />
              <I n="unlock" className="relative h-4 w-4" />
              <span className="relative">
                {unlockProgress > 0
                  ? `استمر بالضغط… ${Math.round(unlockProgress)}%`
                  : "أنا مطوّر الفريق — اضغط مطوّلًا لفتح القفل"}
              </span>
            </button>
          ) : (
            <p className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold-soft/50 px-4 py-2.5 text-[11px] font-extrabold text-gold-deep">
              <I n="alert" className="h-4 w-4 shrink-0" />
              القفل مفتوح — عدّل بحذر، ثم اضغط «اختبار وتفعيل» ليعاد القفل تلقائيًا.
            </p>
          )}
        </div>

        {err && (
          <p className="pop mt-3 flex items-start gap-2 rounded-xl border border-coral/30 bg-coral-soft/50 px-4 py-3 text-[12px] font-bold leading-6 text-coral">
            <I n="x" className="mt-0.5 h-4 w-4 shrink-0" />
            {err}
          </p>
        )}

        {/* تشخيص الاتصال خطوة بخطوة */}
        <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-[13px] font-extrabold text-ink-800">مش المزامنة شغّالة؟</p>
              <p className="mt-0.5 text-[11px] text-ink-400">
                الفحص يفحص 4 خطوات ويحدد بالضبط أين تتعطل.
              </p>
            </div>
            <button
              onClick={() => void diagnose()}
              disabled={diagnosing}
              className="btn-press flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 font-display text-[12px] font-bold text-card hover:bg-ink-700 disabled:opacity-60"
            >
              {diagnosing ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-card/40 border-t-card" />
                  جارِ الفحص…
                </>
              ) : (
                <>
                  <I n="target" className="h-4 w-4" />
                  تشخيص الاتصال
                </>
              )}
            </button>
          </div>
          {diagSteps && (
            <ol className="pop mt-3.5 space-y-2 border-t border-dashed border-ink-200 pt-3.5">
              {diagSteps.map((s, i) => (
                <li key={s.step} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      s.ok ? "bg-brand text-card" : "bg-coral text-card"
                    }`}
                  >
                    <I n={s.ok ? "check" : "x"} className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <p className={`font-display text-[12px] font-bold ${s.ok ? "text-ink-700" : "text-coral"}`}>
                      {i + 1}. {s.step}
                    </p>
                    {s.note && <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{s.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {diagSteps && diagSteps.some((s) => !s.ok) && (
            <div className="pop mt-3 rounded-xl border border-gold/40 bg-gold-soft/50 px-4 py-3">
              <p className="text-[11px] font-bold leading-6 text-ink-700">
                نفّذ الإصلاح المذكور في الخطوة الحمراء من روابط الكونسول بالأعلى، ثم أعد
                «فحص الاتصال» — وعند نجاح كل الخطوات اضغط «اختبار وتفعيل المزامنة».
              </p>
            </div>
          )}
          {diagSteps && diagSteps.every((s) => s.ok) && sync.mode !== "cloud" && (
            <div className="pop mt-3 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand-soft/40 px-4 py-3">
              <p className="flex-1 text-[11px] font-bold leading-6 text-ink-700">
                كل الخطوات سليمة — اضغط الزر بالأسفل لتفعيل المزامنة الآن.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => void activate()}
            disabled={busy}
            className="btn-press flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-display text-sm font-extrabold text-card hover:bg-brand-deep disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-card/40 border-t-card" />
                جارِ اختبار الاتصال…
              </>
            ) : (
              <>
                <I n="sync" className="h-4 w-4" />
                اختبار وتفعيل المزامنة
              </>
            )}
          </button>
          {sync.mode === "cloud" || sync.mode === "connecting" ? (
            <button
              onClick={() => {
                disconnectFirebase();
                onClose();
              }}
              className="btn-press rounded-xl border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-500 hover:bg-ink-50"
            >
              العودة للتخزين المحلي
            </button>
          ) : null}
        </div>

        {/* زر مسح كل البيانات */}
        {(sync.mode === "cloud" || sync.mode === "connecting") && (
          <div className="mt-6 rounded-xl border-2 border-coral/30 bg-coral-soft/20 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral text-card">
                <I n="alert" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-display text-[13px] font-extrabold text-coral">
                  منطقة الخطر: مسح كل البيانات
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-ink-600">
                  هذا الزر سيمسح كل المحتوى (المجالات، المشاريع، المقالات) من Firestore نهائيًا.
                  لا يمكن التراجع عن هذه العملية.
                </p>
                <button
                  onClick={async () => {
                    const confirmed = window.confirm(
                      "⚠️ تحذير: هل أنت متأكد من مسح كل البيانات؟\n\nسيتم حذف:\n- كل المجالات\n- كل المشاريع\n- كل المقالات\n\nلا يمكن التراجع عن هذه العملية!"
                    );
                    if (confirmed) {
                      const doubleConfirmed = window.confirm(
                        "⚠️ تأكيد نهائي: هل أنت متأكد تمامًا؟\n\nسيتم مسح كل البيانات من Firestore نهائيًا!"
                      );
                      if (doubleConfirmed) {
                        await resetAllData();
                      }
                    }
                  }}
                  className="btn-press mt-3 flex items-center gap-2 rounded-xl bg-coral px-5 py-2.5 font-display text-[12px] font-extrabold text-card hover:brightness-110"
                >
                  <I n="trash" className="h-4 w-4" />
                  مسح كل البيانات نهائيًا
                </button>
              </div>
            </div>
          </div>
        )}

        {/* التبويبات */}
        <div className="mt-6 border-t border-dashed border-line pt-5">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`btn-press flex items-center gap-2 rounded-full border px-4 py-2 font-display text-[12px] font-bold transition-all duration-200 ${
                  tab === t.key
                    ? "border-ink-900 bg-ink-900 text-gold shadow-md"
                    : "border-ink-200 bg-card text-ink-500 hover:border-ink-400 hover:text-ink-800"
                }`}
              >
                <I n={t.icon} className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "steps" && (
            <div className="pop mt-4 space-y-4">
              <ol className="space-y-3.5">
                {[
                  {
                    h: "المشروع متصل بالفعل",
                    p: "إعدادات dublex-26 مدمجة في الكود والاتصال يتم تلقائيًا عند الفتح — لا تحتاج أي لصق. تأكد فقط أن الشارة في الهيدر خضراء «متزامن».",
                    code: "console.firebase.google.com",
                  },
                  {
                    h: "أنشئ قاعدة Firestore (إن لم تكن موجودة)",
                    p: "من القائمة الجانبية: Build ← Firestore Database ← Create database. وضع الإنتاج (Production) الذي فعّلته هو الصحيح — لا تنشئ أي Collection يدويًا، الداشبورد تبني كل شيء بنفسها.",
                  },
                  {
                    h: "فعّل الدخول المجهول",
                    p: "Authentication ← Sign-in method ← Anonymous ← Enable. الداشبورد تسجّل دخولًا مجهولًا تلقائيًا لتستطيع الكتابة في وضع الإنتاج.",
                  },
                  {
                    h: "انشر قواعد الأمان",
                    p: "Firestore Database ← تبويب Rules ← الصق النسخة الموصى بها من تبويب «قواعد الأمان» هنا ← Publish. بعدها كل ما تضيفه من الداشبورد يظهر لحظيًا في المستند:",
                    code: `${DOC_PATH[0]} / ${DOC_PATH[1]}`,
                  },
                ].map((s, i) => (
                  <li key={s.h} className="flex gap-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-soft font-mono text-sm font-bold text-gold-deep">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[13px] font-extrabold text-ink-800">{s.h}</p>
                      <p className="mt-1 text-[12px] leading-6 text-ink-500">{s.p}</p>
                      {s.code && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <code dir="ltr" className="rounded-lg bg-ink-50 px-2.5 py-1.5 font-mono text-[11px] font-bold text-brand-deep">
                            {s.code}
                          </code>
                          <CopyBtn text={s.code} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              <div className="rounded-xl border border-gold/30 bg-gold-soft/40 px-4 py-3.5">
                <p className="flex items-start gap-2 text-[12px] font-bold leading-6 text-ink-700">
                  <I n="bulb" className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                  Firestore قاعدة مستندات لا جداول — لا توجد «أعمدة» تُنشأ مسبقًا. الداشبورد
                  تحفظ كل شيء في مستند واحد بالهيكل الموجود في تبويب «هيكل البيانات».
                </p>
              </div>
            </div>
          )}

          {tab === "structure" && (
            <div className="pop mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] leading-6 text-ink-500">
                  هذا شكل المستند كاملًا كما يُحفظ في
                  <code dir="ltr" className="mx-1 rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand-deep">
                    {DOC_PATH[0]}/{DOC_PATH[1]}
                  </code>
                  — انسخه كمرجع إذا أردت إضافة بيانات يدويًا من وحدة التحكم.
                </p>
                <CopyBtn text={STRUCTURE_SAMPLE} label="نسخ الهيكل" />
              </div>
              <CodeBlock code={STRUCTURE_SAMPLE} />
              <ul className="grid gap-2 text-[12px] leading-6 text-ink-500 sm:grid-cols-2">
                <li className="rounded-xl border border-dashed border-line bg-card px-3.5 py-2.5">
                  <b className="font-display text-ink-800">fields</b> — مصفوفة المجالات (الاسم، الأيقونة، اللونان) مع{" "}
                  <b>views</b> عداد مشاهدات صفحة كل مجال.
                </li>
                <li className="rounded-xl border border-dashed border-line bg-card px-3.5 py-2.5">
                  <b className="font-display text-ink-800">projects</b> — مصفوفة المشاريع: الغلاف، الصور، الأهداف، الإنجازات، و<b>links</b> روابط الملحقات (ديمو، كود، تصميم).
                </li>
                <li className="rounded-xl border border-dashed border-line bg-card px-3.5 py-2.5">
                  <b className="font-display text-ink-800">articles</b> — مصفوفة المقالات: keywords للعرض، و<b>tags</b> وسوم جاهزة
                  يقرأها الموقع، و<b>publishedAt</b> تاريخ النشر، و<b>views</b> عداد مشاهدات صفحة المدونة، وصورة الغلاف وحالة النشر.
                </li>
                <li className="rounded-xl border border-dashed border-line bg-card px-3.5 py-2.5">
                  <b className="font-display text-ink-800">updatedAt</b> — طابع زمن يحدّثه النظام تلقائيًا لحل تعارضات المزامنة.
                </li>
              </ul>
              <div className="rounded-xl border border-coral/25 bg-coral-soft/35 px-4 py-3.5">
                <p className="flex items-start gap-2 text-[12px] font-bold leading-6 text-ink-700">
                  <I n="image" className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                  حد المستند الواحد في Firestore هو 1MB — لذلك كل الصور تُضاف كروابط مباشرة
                  من موقع <a href={IMAGE_HOST_URL} target="_blank" rel="noreferrer" className="font-bold text-brand hover:underline">Image2URL</a> ولا يُخزَّن أي ملف في القاعدة.
                </p>
              </div>
            </div>
          )}

          {tab === "rules" && (
            <div className="pop mt-4 space-y-4">
              <div className="rounded-xl border border-brand/30 bg-brand-soft/35 px-4 py-3">
                <p className="flex items-start gap-2 text-[12px] font-bold leading-6 text-ink-700">
                  <I n="target" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  قاعدتك تعمل في وضع الإنتاج (Production) — ممتاز! انشر إحدى النسختين
                  التاليتين من: Firestore Database ← تبويب Rules ← الصق ← Publish.
                </p>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-ink-800">
                    <span className="rounded-md bg-brand px-2 py-0.5 text-[10px] font-bold text-card">موصى به</span>
                    قواعد آمنة — تشترط مستخدمًا مسجّل الدخول
                  </p>
                  <CopyBtn text={RULES_LOCKED} label="نسخ القواعد" />
                </div>
                <div className="mt-2">
                  <CodeBlock code={RULES_LOCKED} />
                </div>
                <div className="mt-2.5 rounded-xl border border-dashed border-line bg-card px-4 py-3.5">
                  <p className="font-display text-[12px] font-extrabold text-ink-800">
                    خطوة واحدة قبلها — فعّل الدخول المجهول:
                  </p>
                  <p className="mt-1.5 text-[12px] leading-6 text-ink-500">
                    Authentication ← Sign-in method ← <b>Anonymous</b> ← Enable.
                    الداشبورد تسجّل دخولًا مجهولًا تلقائيًا عند الفتح، فتمر كتابتها عبر
                    هذه القواعد ويبقى كل من خارجها محجوبًا تمامًا.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-display text-[13px] font-extrabold text-ink-800">
                    <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-bold text-ink-950">سريع</span>
                    قواعد مفتوحة — لمسار الداشبورد فقط (بدون تفعيل Authentication)
                  </p>
                  <CopyBtn text={RULES_SAMPLE} label="نسخ القواعد" />
                </div>
                <div className="mt-2">
                  <CodeBlock code={RULES_SAMPLE} />
                </div>
                <p className="mt-2 text-[11px] leading-5 text-ink-400">
                  تعمل فورًا بدون أي إعداد إضافي، لكنها تسمح لأي شخص يعرف المسار بالتعديل —
                  مناسبة لمرحلة البناء فقط.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Shell() {
  const [view, setView] = useState<View>({ name: "overview" });
  const [menu, setMenu] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const { db, sync } = useStore();

  const go = (v: View) => {
    setView(v);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fieldDetailName =
    view.name === "field-detail" && view.fieldId
      ? db.fields.find((f) => f.id === view.fieldId)?.name
      : undefined;

  const meta =
    view.name === "project-form" && view.projectId
      ? { t: "تعديل المشروع", en: "EDIT PROJECT", s: "حدّث بيانات المشروع واحفظ التغييرات" }
      : view.name === "article-form" && view.articleId
        ? { t: "تعديل المقال", en: "EDIT ARTICLE", s: "حدّث محتوى المقال وكلماته المفتاحية" }
        : view.name === "field-detail" && fieldDetailName
          ? {
              t: fieldDetailName,
              en: "FIELD PAGE",
              s: "صفحة المجال ومشاريعه وعداد مشاهداته",
            }
          : SECTIONS[view.name];

  const today = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date());

  const tickerItems = useMemo(() => {
    const items: string[] = [];
    db.fields.forEach((f) => items.push(`${f.name} — ${db.projects.filter((p) => p.fieldId === f.id).length} مشاريع`));
    db.projects
      .flatMap((p) => p.achievements.map((a) => `${a.metric} ${a.text}`))
      .slice(0, 6)
      .forEach((s) => items.push(s));
    items.push("متاحون لمشاريع جديدة", "دوبلكس — نبني، نسوّق، نصمّم، ونمنتج");
    return items;
  }, [db]);

  return (
    <div className="flex min-h-screen">
      <Sidebar view={view} go={go} open={menu} onClose={() => setMenu(false)} onCloud={() => setCloudOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* الترويسة */}
        <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5">
            <button
              className="btn-press rounded-lg border border-ink-200 bg-card p-1.5 sm:p-2 text-ink-600 lg:hidden"
              onClick={() => setMenu(true)}
              aria-label="فتح القائمة"
            >
              <I n="menu" className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.28em] text-ink-400">
                DUBLEX / {meta.en}
              </p>
              <h1 className="overflow-hidden font-display text-sm sm:text-lg lg:text-xl font-extrabold leading-6 sm:leading-7 text-ink-900">
                <ScrambleText key={view.name + (view.projectId ?? "") + (view.articleId ?? "") + (view.fieldId ?? "")} text={meta.t} />
              </h1>
            </div>
            <div className="ms-auto flex items-center gap-1.5 sm:gap-2.5">
              <span className="hidden items-center gap-1.5 font-mono text-[11px] font-bold text-ink-400 md:flex">
                <I n="calendar" className="h-4 w-4 text-brand" />
                {today}
              </span>
              <SyncBadge onClick={() => setCloudOpen(true)} />
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center overflow-hidden rounded-lg sm:rounded-xl border border-line bg-card lg:hidden">
                <img src={LOGO_URL} alt="دوبلكس" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
              </div>
            </div>
          </div>
          {/* الشريط المتحرك */}
          <Marquee items={tickerItems} />
        </header>

        {/* المحتوى */}
        <main className="flex-1">
          <div
            key={view.name + (view.projectId ?? "") + (view.articleId ?? "") + (view.fieldId ?? "")}
            className="rise mx-auto w-full max-w-[1280px] px-3 sm:px-4 lg:px-8 py-5 sm:py-7"
          >
            {view.name === "overview" && <Overview go={go} onCloud={() => setCloudOpen(true)} />}
            {view.name === "fields" && <Fields go={go} />}
            {view.name === "field-detail" && view.fieldId && (
              <FieldDetail id={view.fieldId} go={go} />
            )}
            {view.name === "projects" && <Projects go={go} />}
            {view.name === "project-form" && <ProjectForm id={view.projectId} go={go} />}
            {view.name === "articles" && <Articles go={go} />}
            {view.name === "article-form" && <ArticleForm id={view.articleId} go={go} />}
          </div>
        </main>

        <footer className="border-t border-line bg-card/60">
          <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
            <span className="relative flex items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-[12px] font-semibold text-ink-500">
              <Ticks className="text-ink-200" />
              <img src={LOGO_URL} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-md object-contain" />
              <span className="hidden sm:inline">دوبلكس — فريق تكنولوجي يبني ويسوّق ويصمّم</span>
              <span className="sm:hidden">دوبلكس</span>
            </span>
            <span className="font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-ink-300">
              © 2025 DUBLEX
            </span>
          </div>
        </footer>
      </div>

      <CloudModal
        open={cloudOpen}
        onClose={() => setCloudOpen(false)}
        initialTab={sync.mode === "error" ? "rules" : "steps"}
      />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
