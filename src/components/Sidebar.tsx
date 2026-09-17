import { I, type IconName } from "../icons";
import { useStore } from "../store";
import { LOGO_URL, formatTime, type View, type ViewName } from "../types";

export default function Sidebar({
  view,
  go,
  open,
  onClose,
  onCloud,
  collapsed,
  onToggleCollapse,
}: {
  view: View;
  go: (v: View) => void;
  open: boolean;
  onClose: () => void;
  onCloud: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { db, sync } = useStore();

  const items: { key: ViewName; label: string; en: string; icon: IconName; count?: number }[] = [
    { key: "overview", label: "نظرة عامة", en: "OVERVIEW", icon: "grid" },
    { key: "fields", label: "المجالات", en: "FIELDS", icon: "layers", count: db.fields.length },
    { key: "projects", label: "المشاريع", en: "PROJECTS", icon: "briefcase", count: db.projects.length },
    { key: "articles", label: "المقالات", en: "ARTICLES", icon: "doc", count: db.articles.length },
  ];

  const isActive = (key: ViewName) =>
    view.name === key ||
    (key === "projects" && view.name === "project-form") ||
    (key === "articles" && view.name === "article-form");

  const syncMeta = {
    connecting: { dot: "bg-gold text-gold pulse-dot", label: "جارِ الاتصال…", sub: "نجهّز قناة المزامنة" },
    cloud: {
      dot: "bg-brand text-brand pulse-dot",
      label: "متزامن مع فايربيز",
      sub: sync.lastSync ? `آخر مزامنة ${formatTime(sync.lastSync)}` : "القناة مفتوحة",
    },
    error: { dot: "bg-coral text-coral", label: "خطأ بالاتصال", sub: sync.error ?? "راجع الإعدادات" },
  }[sync.mode];

  return (
    <>
      {/* Overlay - يظهر فقط على الموبايل والتابلت */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-label="إغلاق القائمة"
        />
      )}
      
      {/* السايدبار - على اليمين في كل الشاشات */}
      <aside
        className={`
          fixed top-0 end-0 z-50 flex flex-col bg-ink-950 text-ink-200 h-screen
          transition-all duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
          lg:sticky lg:translate-x-0
          ${collapsed ? "w-[72px] lg:w-[72px]" : "w-[280px] lg:w-[276px]"}
        `}
        style={{
          backgroundImage:
            "radial-gradient(440px 240px at 50% -70px, rgba(225,155,16,0.16), transparent 70%), radial-gradient(420px 340px at 115% 105%, rgba(14,110,85,0.35), transparent 72%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "auto, auto, 100% 30px",
        }}
      >
        {/* الهوية */}
        <div className={`flex items-center gap-3.5 pb-6 pt-6 ${collapsed ? "justify-center px-2" : "px-5"}`}>
          <div className="relative flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card p-1 shadow-lg shadow-ink-950/50" style={{ width: 52, height: 52 }}>
            <img src={LOGO_URL} alt="شعار دوبلكس" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl font-extrabold leading-none tracking-tight text-card">دوبلكس</p>
              <p className="mt-1.5 font-mono text-[10px] font-semibold tracking-[0.3em] text-gold">DUBLEX · OPS</p>
            </div>
          )}
          <button className="btn-press text-ink-400 hover:text-card md:hidden" onClick={onClose} aria-label="إغلاق">
            <I n="x" className="h-5 w-5" />
          </button>
        </div>

        {/* الأقسام */}
        <nav className={`flex-1 overflow-y-auto ${collapsed ? "md:px-2 lg:px-2" : "px-4"}`}>
          {!collapsed && (
            <p className="mb-3 px-2 font-mono text-[10px] font-semibold tracking-[0.25em] text-ink-500">
              الأقسام / SECTIONS
            </p>
          )}
          <ul className="space-y-1.5">
            {items.map((it, idx) => {
              const active = isActive(it.key);
              return (
                <li key={it.key}>
                  <button
                    onClick={() => {
                      go({ name: it.key });
                      // على الموبايل والتابلت، اقفل السايدبار بعد الضغط
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                    title={collapsed ? it.label : undefined}
                    className={`btn-press group relative flex w-full items-center gap-3 rounded-xl transition-all duration-200 ${
                      collapsed ? "md:justify-center lg:justify-center md:px-2 lg:px-2 py-3" : "px-3.5 py-3"
                    } ${
                      active
                        ? "bg-ink-800/90 text-card shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-ink-300 hover:bg-ink-800/50 hover:text-card"
                    }`}
                  >
                    {active && <span className="absolute inset-y-2.5 start-0 w-[3px] rounded-full bg-gold" />}
                    {!collapsed && (
                      <span className={`font-mono text-[11px] font-bold ${active ? "text-gold" : "text-ink-600"}`}>
                        0{idx + 1}
                      </span>
                    )}
                    <span className={active ? "text-gold" : "text-ink-400 transition-colors group-hover:text-gold"}>
                      <I n={it.icon} className="h-5 w-5" />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="font-display text-sm font-bold">{it.label}</span>
                        {typeof it.count === "number" && (
                          <span
                            className={`ms-auto rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold transition-colors ${
                              active ? "bg-gold text-ink-950" : "bg-ink-800 text-ink-400"
                            }`}
                          >
                            {it.count}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* إجراءات سريعة */}
          <div className={collapsed ? "hidden lg:block" : ""}>
            {!collapsed && (
              <>
                <p className="mb-3 mt-8 px-2 font-mono text-[10px] font-semibold tracking-[0.25em] text-ink-500">
                  إجراءات / ACTIONS
                </p>
                <button
                  onClick={() => {
                    go({ name: "project-form" });
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="btn-press flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 font-display text-sm font-extrabold text-ink-950 shadow-lg shadow-gold/15 hover:brightness-110"
                >
                  <I n="plus" className="h-4 w-4" />
                  إضافة مشروع جديد
                </button>
                <button
                  onClick={() => {
                    go({ name: "article-form" });
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="btn-press mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-700 px-4 py-2.5 text-sm font-semibold text-ink-200 transition-colors hover:border-gold/60 hover:text-gold"
                >
                  <I n="pen" className="h-4 w-4" />
                  مقال جديد
                </button>
              </>
            )}
          </div>
          {collapsed && (
            <div className="mt-6 hidden space-y-2 lg:block">
              <button
                onClick={() => go({ name: "project-form" })}
                title="إضافة مشروع جديد"
                className="btn-press flex w-full items-center justify-center rounded-xl bg-gold p-3 text-ink-950 shadow-lg shadow-gold/15 hover:brightness-110"
              >
                <I n="plus" className="h-5 w-5" />
              </button>
              <button
                onClick={() => go({ name: "article-form" })}
                title="مقال جديد"
                className="btn-press flex w-full items-center justify-center rounded-xl border border-ink-700 p-3 text-ink-200 transition-colors hover:border-gold/60 hover:text-gold"
              >
                <I n="pen" className="h-5 w-5" />
              </button>
            </div>
          )}
        </nav>

        {/* زر الطي - يظهر فقط على الشاشات الكبيرة */}
        <div className={`hidden px-4 pb-2 lg:block ${collapsed ? "lg:px-2" : ""}`}>
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "إظهار السايدبار" : "طي السايدبار"}
            className="btn-press flex w-full items-center justify-center gap-2 rounded-xl border border-ink-700/90 bg-ink-800/50 p-2.5 text-ink-400 transition-colors hover:border-brand/60 hover:text-brand"
          >
            <I n={collapsed ? "arrow" : "arrow"} className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span className="text-xs font-semibold">طي القائمة</span>}
          </button>
        </div>

        {/* حالة المزامنة */}
        <div className={`pb-4 ${collapsed ? "px-2" : "px-4"}`}>
          <button
            onClick={onCloud}
            title={collapsed ? syncMeta.label : undefined}
            className={`btn-press group w-full rounded-xl border border-ink-700/90 bg-ink-800/50 text-start transition-colors hover:border-brand/60 ${
              collapsed ? "p-3" : "p-4"
            }`}
          >
            {collapsed ? (
              <div className="flex items-center justify-center">
                <span className={`h-3 w-3 rounded-full ${syncMeta.dot}`} />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.25em] text-ink-500">
                    SYNC / المزامنة
                  </span>
                  <span className="text-ink-400 transition-colors group-hover:text-gold">
                    <I n="cloud" className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${syncMeta.dot}`} />
                  <span className="font-display text-[13px] font-bold text-card">{syncMeta.label}</span>
                </div>
                <p className="mt-1 truncate text-[11px] text-ink-400" title={syncMeta.sub}>
                  {syncMeta.sub}
                </p>
              </>
            )}
          </button>
          {!collapsed && (
            <p className="mt-3.5 text-center font-mono text-[10px] font-medium tracking-[0.2em] text-ink-600">
              DUBLEX DASHBOARD · V2.0
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
