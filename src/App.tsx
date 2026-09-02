import { useMemo, useState } from "react";
import { StoreProvider, useStore } from "./store";
import Sidebar from "./components/Sidebar";
import { Marquee, Modal, ScrambleText, SyncBadge, Toasts, Ticks } from "./components/ui";
import Overview from "./views/Overview";
import Fields from "./views/Fields";
import Projects from "./views/Projects";
import ProjectForm from "./views/ProjectForm";
import Articles from "./views/Articles";
import ArticleForm from "./views/ArticleForm";
import { I } from "./icons";
import {
  DOC_PATH,
  isValidConfig,
  loadStoredConfig,
  testConnection,
  type FirebaseConfig,
} from "./firebase";
import { LOGO_URL, formatTime, type View, type ViewName } from "./types";

const SECTIONS: Record<ViewName, { t: string; en: string; s: string }> = {
  overview: { t: "نظرة عامة", en: "OVERVIEW", s: "كل ما يخص فريق دوبلكس في لوحة واحدة" },
  fields: { t: "المجالات", en: "FIELDS", s: "خطوط عمل الفريق — أضف وعدّل واحذف" },
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
      "createdAt": 1735689600000
    }
  ],

  "articles": [
    {
      "id": "ar-1",
      "title": "عنوان المقال",
      "keywords": ["SEO", "تسويق رقمي"],   // الكلمات المفتاحية
      "fieldLabel": "التسويق الرقمي",       // اختياري
      "excerpt": "ملخص يظهر في البطاقة…",
      "body": "محتوى المقال كاملًا، سطر فارغ = فقرة جديدة",
      "published": true,             // false = مسودة
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
function CloudModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { sync, connectFirebase, disconnectFirebase, toast } = useStore();
  const [raw, setRaw] = useState(() => {
    const c = loadStoredConfig();
    return c ? JSON.stringify(c, null, 2) : "";
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<CloudTab>("steps");

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
          الصق إعدادات تطبيق الويب من وحدة تحكم فايربيز، وستُحفظ بيانات الداشبورد (المجالات،
          المشاريع، المقالات) في Firestore ليتشاركها كل أعضاء الفريق لحظيًا.
        </p>

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

        <label className="lbl mt-5" htmlFor="fb-cfg">
          إعدادات Firebase (JSON)
        </label>
        <textarea
          id="fb-cfg"
          dir="ltr"
          className="inp min-h-[130px] !font-mono !text-[12px] !leading-6"
          placeholder={`{
  "apiKey": "AIzaSy...",
  "authDomain": "my-app.firebaseapp.com",
  "projectId": "my-app",
  "storageBucket": "my-app.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123"
}`}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />

        {err && (
          <p className="pop mt-3 flex items-start gap-2 rounded-xl border border-coral/30 bg-coral-soft/50 px-4 py-3 text-[12px] font-bold leading-6 text-coral">
            <I n="x" className="mt-0.5 h-4 w-4 shrink-0" />
            {err}
          </p>
        )}

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
                    h: "أنشئ مشروع فايربيز",
                    p: "افتح وحدة التحكم وأنشئ مشروعًا جديدًا باسم الفريق (مثلًا dublex-team).",
                    code: "https://console.firebase.google.com",
                  },
                  {
                    h: "أضف تطبيق ويب وانسخ الإعدادات",
                    p: "من إعدادات المشروع (أيقونة الترس ← Project settings) اضغط على أيقونة الويب </> وسجّل التطبيق، ثم انسخ كائن firebaseConfig والصقه في الصندوق بالأعلى.",
                  },
                  {
                    h: "أنشئ قاعدة Firestore",
                    p: "من القائمة الجانبية: Build ← Firestore Database ← Create database، واختر «Start in test mode» للتجربة. لن تحتاج إنشاء أي جدول أو عمود يدويًا.",
                  },
                  {
                    h: "فعّل المزامنة من هنا",
                    p: "اضغط «اختبار وتفعيل المزامنة». عند أول اتصال ستنشئ الداشبورد المستند تلقائيًا وترفع إليه بياناتك المحلية — ولن تكتب شيئًا يدويًا في القاعدة.",
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
                  <b className="font-display text-ink-800">fields</b> — مصفوفة المجالات (الاسم، الأيقونة، اللونان).
                </li>
                <li className="rounded-xl border border-dashed border-line bg-card px-3.5 py-2.5">
                  <b className="font-display text-ink-800">projects</b> — مصفوفة المشاريع: الغلاف، الصور، الأهداف، الإنجازات.
                </li>
                <li className="rounded-xl border border-dashed border-line bg-card px-3.5 py-2.5">
                  <b className="font-display text-ink-800">articles</b> — مصفوفة المقالات مع keywords وحالة النشر.
                </li>
                <li className="rounded-xl border border-dashed border-line bg-card px-3.5 py-2.5">
                  <b className="font-display text-ink-800">updatedAt</b> — طابع زمن يحدّثه النظام تلقائيًا لحل تعارضات المزامنة.
                </li>
              </ul>
              <div className="rounded-xl border border-coral/25 bg-coral-soft/35 px-4 py-3.5">
                <p className="flex items-start gap-2 text-[12px] font-bold leading-6 text-ink-700">
                  <I n="image" className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                  حد المستند الواحد في Firestore هو 1MB — لذلك يُفضَّل استخدام روابط صور
                  مستضافة (URLs) بدل الصور المرفوعة من الجهاز، خاصة للغطاء والمعرض.
                </p>
              </div>
            </div>
          )}

          {tab === "rules" && (
            <div className="pop mt-4 space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-[13px] font-extrabold text-ink-800">
                    وضع الاختبار — للتجربة (القاعدة تسمح للجميع)
                  </p>
                  <CopyBtn text={RULES_SAMPLE} />
                </div>
                <div className="mt-2">
                  <CodeBlock code={RULES_SAMPLE} />
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-[13px] font-extrabold text-ink-800">
                    للإنتاج — يشترط مستخدمًا مسجّل الدخول (Authentication)
                  </p>
                  <CopyBtn text={RULES_LOCKED} />
                </div>
                <div className="mt-2">
                  <CodeBlock code={RULES_LOCKED} />
                </div>
              </div>
              <p className="text-[12px] leading-6 text-ink-500">
                الصق القواعد في: Firestore Database ← Rules ← Publish. وضع الاختبار يفتح
                القاعدة 30 يومًا فقط — بدّلها بالقواعد المقفولة قبل الإطلاق الرسمي.
              </p>
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
  const { db } = useStore();

  const go = (v: View) => {
    setView(v);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const meta =
    view.name === "project-form" && view.projectId
      ? { t: "تعديل المشروع", en: "EDIT PROJECT", s: "حدّث بيانات المشروع واحفظ التغييرات" }
      : view.name === "article-form" && view.articleId
        ? { t: "تعديل المقال", en: "EDIT ARTICLE", s: "حدّث محتوى المقال وكلماته المفتاحية" }
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
          <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <button
              className="btn-press rounded-lg border border-ink-200 bg-card p-2 text-ink-600 lg:hidden"
              onClick={() => setMenu(true)}
              aria-label="فتح القائمة"
            >
              <I n="menu" className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold tracking-[0.28em] text-ink-400">
                DUBLEX / {meta.en}
              </p>
              <h1 className="overflow-hidden font-display text-lg font-extrabold leading-7 text-ink-900 sm:text-xl">
                <ScrambleText key={view.name + (view.projectId ?? "") + (view.articleId ?? "")} text={meta.t} />
              </h1>
            </div>
            <div className="ms-auto flex items-center gap-2.5">
              <span className="hidden items-center gap-1.5 font-mono text-[11px] font-bold text-ink-400 md:flex">
                <I n="calendar" className="h-4 w-4 text-brand" />
                {today}
              </span>
              <SyncBadge onClick={() => setCloudOpen(true)} />
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-line bg-card lg:hidden">
                <img src={LOGO_URL} alt="دوبلكس" className="h-8 w-8 object-contain" />
              </div>
            </div>
          </div>
          {/* الشريط المتحرك */}
          <Marquee items={tickerItems} />
        </header>

        {/* المحتوى */}
        <main className="flex-1">
          <div
            key={view.name + (view.projectId ?? "") + (view.articleId ?? "")}
            className="rise mx-auto w-full max-w-[1280px] px-4 py-7 sm:px-6 lg:px-8"
          >
            {view.name === "overview" && <Overview go={go} onCloud={() => setCloudOpen(true)} />}
            {view.name === "fields" && <Fields />}
            {view.name === "projects" && <Projects go={go} />}
            {view.name === "project-form" && <ProjectForm id={view.projectId} go={go} />}
            {view.name === "articles" && <Articles go={go} />}
            {view.name === "article-form" && <ArticleForm id={view.articleId} go={go} />}
          </div>
        </main>

        <footer className="border-t border-line bg-card/60">
          <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <span className="relative flex items-center gap-2.5 text-[12px] font-semibold text-ink-500">
              <Ticks className="text-ink-200" />
              <img src={LOGO_URL} alt="" className="h-6 w-6 rounded-md object-contain" />
              دوبلكس — فريق تكنولوجي يبني ويسوّق ويصمّم
            </span>
            <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-300">
              © 2025 DUBLEX TEAM
            </span>
          </div>
        </footer>
      </div>

      <CloudModal open={cloudOpen} onClose={() => setCloudOpen(false)} />
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
