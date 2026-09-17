import { useEffect, useMemo, useRef, useState } from "react";
import { StoreProvider, useStore } from "./store";
import Sidebar from "./components/Sidebar";
import LoginScreen from "./components/LoginScreen";
import { Marquee, Modal, ScrambleText, SyncBadge, Toasts, Ticks } from "./components/ui";
import Overview from "./views/Overview";
import Fields from "./views/Fields";
import FieldDetail from "./views/FieldDetail";
import Projects from "./views/Projects";
import ProjectForm from "./views/ProjectForm";
import ProjectDetail from "./views/ProjectDetail";
import Articles from "./views/Articles";
import ArticleForm from "./views/ArticleForm";
import ArticleDetail from "./views/ArticleDetail";
import CloudSettings from "./views/CloudSettings";
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
  "project-detail": { t: "تفاصيل المشروع", en: "PROJECT DETAILS", s: "عرض تفاصيل المشروع الكاملة" },
  articles: { t: "المقالات", en: "ARTICLES", s: "محتوى الفريق المعرفي وكلماته المفتاحية" },
  "article-form": { t: "مقال جديد", en: "NEW ARTICLE", s: "اكتب وانشر مع الكلمات المفتاحية" },
  "article-detail": { t: "قراءة المقال", en: "READ ARTICLE", s: "عرض المقال الكامل" },
  "cloud-settings": { t: "إعدادات فايربيز", en: "FIREBASE SETTINGS", s: "إعدادات المزامنة مع فايربيز" },
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
      "year": "2026",
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

function Shell() {
  const [view, setView] = useState<View>({ name: "overview" });
  const [menu, setMenu] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false); // مش مستخدم دلوقتي - نخليه للـ compatibility
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("dublex-sidebar-collapsed") === "true";
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("dublex-logged-in") === "true";
  });
  const { db, sync } = useStore();

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("dublex-sidebar-collapsed", String(newState));
  };

  const handleLogin = () => {
    sessionStorage.setItem("dublex-logged-in", "true");
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

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
      <Sidebar 
        view={view} 
        go={go} 
        open={menu} 
        onClose={() => setMenu(false)} 
        onCloud={() => setCloudOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

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
            <button
              className="btn-press hidden rounded-lg border border-ink-200 bg-card p-1.5 sm:p-2 text-ink-600 hover:border-brand hover:text-brand lg:flex"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "إظهار السايدبار" : "طي السايدبار"}
              title={sidebarCollapsed ? "إظهار السايدبار" : "طي السايدبار"}
            >
              <I n={sidebarCollapsed ? "arrow" : "menu"} className="h-4 w-4 sm:h-5 sm:w-5" />
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
              <SyncBadge onClick={() => go({ name: "cloud-settings" })} />
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
            {view.name === "project-detail" && view.projectId && (
              <ProjectDetail id={view.projectId} go={go} />
            )}
            {view.name === "articles" && <Articles go={go} />}
            {view.name === "article-form" && <ArticleForm id={view.articleId} go={go} />}
            {view.name === "article-detail" && view.articleId && (
              <ArticleDetail id={view.articleId} go={go} />
            )}
            {view.name === "cloud-settings" && <CloudSettings go={go} />}
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
              © 2026 DUBLEX
            </span>
          </div>
        </footer>
      </div>

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
