import { useMemo, useState } from "react";
import { useStore } from "../store";
import { I, type IconName } from "../icons";
import { Confirm, EmptyState, Modal, Overline, Reveal, Ticks } from "../components/ui";
import {
  LOGO_URL,
  STATUS_LABEL,
  STATUS_STYLE,
  formatDate,
  type Project,
  type ProjectLink,
  type ProjectStatus,
  type View,
} from "../types";

function Cover({ p, className, iconClass = "h-10 w-10" }: { p: Project; className: string; iconClass?: string }) {
  if (p.cover) {
    return <img src={p.cover} alt={p.title} className={`object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-ink-800 via-ink-700 to-brand ${className}`}>
      <img src={LOGO_URL} alt="" className="absolute h-20 w-20 opacity-15" />
      <I n="briefcase" className={`${iconClass} relative text-card/60`} />
    </div>
  );
}

function StatusPill({ s }: { s: ProjectStatus }) {
  const st = STATUS_STYLE[s];
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
      style={{ background: st.bg, color: st.fg }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s === "active" ? "pulse-dot" : ""}`} style={{ background: st.dot }} />
      {STATUS_LABEL[s]}
    </span>
  );
}

export default function Projects({ go }: { go: (v: View) => void }) {
  const { db, deleteProject, toggleGoal, toast } = useStore();
  const [q, setQ] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [videoOnly, setVideoOnly] = useState(false);
  const [delTarget, setDelTarget] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    return db.projects.filter((p) => {
      const matchQ =
        !q.trim() ||
        p.title.includes(q) ||
        p.subtitle.includes(q) ||
        p.client.includes(q) ||
        p.fieldLabel.includes(q);
      const matchV = !videoOnly || !!p.videoUrl;
      const matchF = fieldFilter === "all" || p.fieldId === fieldFilter;
      const matchS = statusFilter === "all" || p.status === statusFilter;
      return matchQ && matchF && matchS && matchV;
    });
  }, [db.projects, q, fieldFilter, statusFilter, videoOnly]);


  const fieldOf = (p: Project) => db.fields.find((f) => f.id === p.fieldId);

  return (
    <div className="space-y-6">
      {/* شريط الأدوات */}
      <div className="rise space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative min-w-[180px] sm:min-w-[220px] flex-1 sm:max-w-xs">
            <I n="search" className="absolute start-3 sm:start-3.5 top-1/2 h-3.5 sm:h-4 w-3.5 sm:w-4 -translate-y-1/2 text-ink-300" />
            <input
              className="inp !ps-9 sm:!ps-10 !text-sm"
              placeholder="ابحث في المشاريع…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="inp !w-auto cursor-pointer !text-xs sm:!text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | ProjectStatus)}
            aria-label="فلترة حسب الحالة"
          >
            <option value="all">كل الحالات</option>
            <option value="planning">قيد التخطيط</option>
            <option value="active">جاري التنفيذ</option>
            <option value="done">مكتمل</option>
          </select>
          <button
            onClick={() => setVideoOnly(!videoOnly)}
            aria-pressed={videoOnly}
            className={`btn-press flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-[12px] font-bold transition-all ${
              videoOnly
                ? "border-coral bg-coral text-card shadow-md"
                : "border-ink-200 bg-card text-ink-500 hover:border-coral/60 hover:text-coral"
            }`}
          >
            <I n="play" className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            <span className="hidden sm:inline">فيه فيديو</span>
            <span className="sm:hidden">فيديو</span>
            {videoOnly && <I n="check" className="h-3 sm:h-3.5 w-3 sm:w-3.5" />}
          </button>
          <span className="hidden sm:block font-mono text-[12px] font-bold text-ink-400">
            {filtered.length} / {db.projects.length}
          </span>
          <button
            onClick={() => go({ name: "project-form" })}
            className="btn-press ms-auto flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gold px-3 sm:px-5 py-2 sm:py-2.5 font-display text-xs sm:text-sm font-extrabold text-ink-950 hover:brightness-105"
          >
            <I n="plus" className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            <span className="hidden sm:inline">مشروع جديد</span>
            <span className="sm:hidden">جديد</span>
          </button>
        </div>

        {/* فلترة المجالات */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setFieldFilter("all")}
            className={`btn-press rounded-full border px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-bold transition-colors ${
              fieldFilter === "all"
                ? "border-ink-900 bg-ink-900 text-card"
                : "border-ink-200 bg-card text-ink-500 hover:border-ink-400"
            }`}
          >
            الكل
          </button>
          {db.fields.map((f) => (
            <button
              key={f.id}
              onClick={() => setFieldFilter(fieldFilter === f.id ? "all" : f.id)}
              className={`btn-press flex items-center gap-1 sm:gap-1.5 rounded-full border px-2.5 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-bold transition-all ${
                fieldFilter === f.id ? "shadow-sm" : "hover:-translate-y-0.5"
              }`}
              style={
                fieldFilter === f.id
                  ? { background: f.color, borderColor: f.color, color: "#FCFDFB" }
                  : { background: f.soft, borderColor: "transparent", color: f.color }
              }
            >
              <I n={f.icon as IconName} className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              <span className="hidden sm:inline">{f.name}</span>
              <span className="sm:hidden">{f.name.length > 12 ? f.name.slice(0, 10) + "…" : f.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* الشبكة */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title={db.projects.length === 0 ? "لا توجد مشاريع بعد" : "لا نتائج مطابقة"}
          desc={
            db.projects.length === 0
              ? "أضف أول مشروع للفريق: اختر المجال، ارفع الصور، ووثّق الأهداف والإنجازات."
              : "جرّب تغيير كلمة البحث أو الفلاتر."
          }
        >
          {db.projects.length === 0 && (
            <button
              onClick={() => go({ name: "project-form" })}
              className="btn-press flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-display text-sm font-bold text-card hover:bg-brand-deep"
            >
              <I n="plus" className="h-4 w-4" />
              إضافة أول مشروع
            </button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => {
            const f = fieldOf(p);
            const done = p.goals.filter((g) => g.done).length;
            const pct = p.goals.length ? Math.round((done / p.goals.length) * 100) : 0;
            return (
              <Reveal key={p.id} delay={(i % 3) * 90}>
                <button
                  onClick={() => go({ name: "project-detail", projectId: p.id })}
                  className="group relative w-full overflow-hidden rounded-xl border border-line bg-card text-start shadow-[0_1px_0_rgba(11,36,28,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_24px_50px_-22px_rgba(11,36,28,0.35)]"
                >
                  <div className="relative h-44 overflow-hidden">
                    <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]">
                      <Cover p={p} className="h-full w-full" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-950/55 to-transparent" />
                    <span className="absolute top-3 start-3">
                      <StatusPill s={p.status} />
                    </span>
                    <span className="absolute bottom-3 start-3 flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold text-card" style={{ background: "rgba(7,26,20,0.65)", backdropFilter: "blur(4px)" }}>
                      <span style={{ color: f?.color ?? "#E19B10" }}>
                        <I n={(f?.icon ?? "briefcase") as IconName} className="h-3.5 w-3.5" />
                      </span>
                      {p.fieldLabel}
                    </span>
                    {p.videoUrl && (
                      <span className="absolute bottom-3 end-3 flex items-center gap-1 rounded-md bg-coral px-2 py-1 text-[10px] font-bold text-card shadow-md transition-transform duration-300 group-hover:scale-110">
                        <I n="play" className="h-3 w-3" />
                        فيديو
                      </span>
                    )}
                    {p.links && p.links.length > 0 && (
                      <span className="absolute top-3 end-3 flex items-center gap-1 rounded-md bg-gold px-2 py-1 text-[10px] font-bold text-ink-950 shadow-md">
                        <I n="link" className="h-3 w-3" />
                        {p.links.length}
                      </span>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-base sm:text-lg font-extrabold text-ink-900 transition-colors group-hover:text-brand">
                          {p.title}
                        </h3>
                        <p className="mt-0.5 truncate text-[11px] sm:text-[12px] text-ink-400">
                          {p.subtitle || p.client}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-ink-50 px-2 py-1 font-mono text-[10px] sm:text-[11px] font-bold text-ink-500">
                        {p.year}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-ink-400">تقدّم الأهداف</span>
                        <span className="font-mono text-brand-deep">
                          {done}/{p.goals.length}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-50">
                        <div
                          className="grow-x h-full rounded-full"
                          style={{ width: `${pct}%`, background: f?.color ?? "var(--color-brand)", animationDelay: `${i * 80}ms` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 border-t border-dashed border-line pt-3.5 text-[11px] font-bold text-ink-400">
                      <span className="flex items-center gap-1.5">
                        <I n="trophy" className="h-3.5 w-3.5 text-gold-deep" />
                        {p.achievements.length} إنجاز
                      </span>
                      <span className="flex items-center gap-1.5">
                        <I n="image" className="h-3.5 w-3.5 text-sea" />
                        {p.images.length + (p.cover ? 1 : 0)} صور
                      </span>
                      <span className="ms-auto flex items-center gap-1 text-brand opacity-0 transition-all duration-300 group-hover:opacity-100">
                        التفاصيل
                        <I n="arrow" className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      )}

      <Confirm
        open={!!delTarget}
        title={`حذف مشروع «${delTarget?.title ?? ""}»؟`}
        desc="سيُحذف المشروع بكل صوره وأهدافه وإنجازاته. هذا الإجراء لا يمكن التراجع عنه."
        onCancel={() => setDelTarget(null)}
        onConfirm={() => {
          if (delTarget) {
            deleteProject(delTarget.id);
            toast("تم حذف المشروع", "info");
          }
          setDelTarget(null);
        }}
      />
    </div>
  );
}
