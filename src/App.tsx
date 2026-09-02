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

/* نافذة إعدادات فايربيز */
function CloudModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { sync, connectFirebase, disconnectFirebase, toast } = useStore();
  const [raw, setRaw] = useState(() => {
    const c = loadStoredConfig();
    return c ? JSON.stringify(c, null, 2) : "";
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showSteps, setShowSteps] = useState(false);

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

  return (
    <Modal open={open} onClose={onClose}>
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
          الصق إعدادات تطبيق الويب من وحدة تحكم فايربيز، وسنحفظ بيانات الداشبورد (المجالات،
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
          className="inp min-h-[150px] !font-mono !text-[12px] !leading-6"
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

        <div className="mt-5 flex flex-wrap gap-3">
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

        <button
          onClick={() => setShowSteps(!showSteps)}
          className="btn-press mt-5 flex items-center gap-2 text-[12px] font-bold text-brand hover:text-brand-deep"
        >
          <I n="bulb" className="h-4 w-4" />
          {showSteps ? "إخفاء خطوات التجهيز" : "كيف أجهّز فايربيز أول مرة؟"}
        </button>
        {showSteps && (
          <ol className="pop mt-3 space-y-2.5 rounded-xl border border-dashed border-line bg-card px-5 py-4 text-[12px] leading-6 text-ink-600">
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-gold-deep">1.</span>
              افتح console.firebase.google.com وأنشئ مشروعًا جديدًا.
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-gold-deep">2.</span>
              من إعدادات المشروع أضف «تطبيق ويب» وانسخ كائن الإعدادات firebaseConfig.
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-gold-deep">3.</span>
              أنشئ قاعدة Firestore (للتجربة ابدأ بوضع الاختبار Test mode).
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono font-bold text-gold-deep">4.</span>
              الصق الإعدادات هنا واضغط «اختبار وتفعيل».
            </li>
            <li className="flex gap-2.5 border-t border-dashed border-line pt-2.5">
              <span className="font-mono font-bold text-brand">▸</span>
              <span dir="ltr" className="font-mono text-[11px]">
                {DOC_PATH[0]}/{DOC_PATH[1]}
              </span>
              — مسار حفظ بيانات الداشبورد داخل القاعدة.
            </li>
          </ol>
        )}
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
