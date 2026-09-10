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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selected = selectedId ? db.projects.find((p) => p.id === selectedId) : undefined;
  const fieldOf = (p: Project) => db.fields.find((f) => f.id === p.fieldId);

  return (
    <div className="space-y-6">
      {/* شريط الأدوات */}
      <div className="rise space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <I n="search" className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
            <input
              className="inp !ps-10"
              placeholder="ابحث في المشاريع…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="inp !w-auto cursor-pointer"
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
            className={`btn-press flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[12px] font-bold transition-all ${
              videoOnly
                ? "border-coral bg-coral text-card shadow-md"
                : "border-ink-200 bg-card text-ink-500 hover:border-coral/60 hover:text-coral"
            }`}
          >
            <I n="play" className="h-3.5 w-3.5" />
            فيه فيديو
            {videoOnly && <I n="check" className="h-3.5 w-3.5" />}
          </button>
          <span className="font-mono text-[12px] font-bold text-ink-400">
            {filtered.length} / {db.projects.length}
          </span>
          <button
            onClick={() => go({ name: "project-form" })}
            className="btn-press ms-auto flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-display text-sm font-extrabold text-ink-950 hover:brightness-105"
          >
            <I n="plus" className="h-4 w-4" />
            مشروع جديد
          </button>
        </div>

        {/* فلترة المجالات */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFieldFilter("all")}
            className={`btn-press rounded-full border px-4 py-1.5 text-[12px] font-bold transition-colors ${
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
              className={`btn-press flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-bold transition-all ${
                fieldFilter === f.id ? "shadow-sm" : "hover:-translate-y-0.5"
              }`}
              style={
                fieldFilter === f.id
                  ? { background: f.color, borderColor: f.color, color: "#FCFDFB" }
                  : { background: f.soft, borderColor: "transparent", color: f.color }
              }
            >
              <I n={f.icon as IconName} className="h-3.5 w-3.5" />
              {f.name}
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => {
            const f = fieldOf(p);
            const done = p.goals.filter((g) => g.done).length;
            const pct = p.goals.length ? Math.round((done / p.goals.length) * 100) : 0;
            return (
              <Reveal key={p.id} delay={(i % 3) * 90}>
                <button
                  onClick={() => setSelectedId(p.id)}
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
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-lg font-extrabold text-ink-900 transition-colors group-hover:text-brand">
                          {p.title}
                        </h3>
                        <p className="mt-0.5 truncate text-[12px] text-ink-400">
                          {p.subtitle || p.client}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-ink-50 px-2 py-1 font-mono text-[11px] font-bold text-ink-500">
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

      {/* نافذة التفاصيل */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)} wide>
        {selected && (
          <div>
            <div className="relative h-52 overflow-hidden sm:h-64">
              <Cover p={selected} className="h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
              <button
                onClick={() => setSelectedId(null)}
                className="btn-press absolute top-4 end-4 flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950/60 text-card backdrop-blur-sm hover:bg-coral"
                aria-label="إغلاق"
              >
                <I n="x" className="h-4.5 w-4.5" />
              </button>
              <div className="absolute bottom-4 inset-x-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusPill s={selected.status} />
                    <span className="rounded-full bg-card/15 px-2.5 py-1 text-[10px] font-bold text-card backdrop-blur-sm">
                      {selected.fieldLabel}
                    </span>
                  </div>
                  <h2 className="mt-2.5 font-display text-2xl font-extrabold text-card sm:text-3xl">
                    {selected.title}
                  </h2>
                  {selected.subtitle && <p className="mt-1 text-[13px] font-medium text-ink-200">{selected.subtitle}</p>}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {/* بيانات سريعة */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { l: "العميل", v: selected.client || "—" },
                  { l: "السنة", v: selected.year || "—" },
                  { l: "المجال", v: selected.fieldLabel },
                  { l: "أُضيف في", v: formatDate(selected.createdAt) },
                ].map((m) => (
                  <div key={m.l} className="rounded-xl border border-dashed border-line bg-card px-3.5 py-3">
                    <p className="font-mono text-[10px] font-semibold tracking-widest text-ink-300">{m.l}</p>
                    <p className="mt-1 truncate font-display text-[13px] font-bold text-ink-800" title={m.v}>{m.v}</p>
                  </div>
                ))}
              </div>

              {/* فيديو المشروع */}
              {selected.videoUrl && (
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                      <I n="play" className="h-4 w-4 text-coral" />
                      فيديو المشروع
                    </h4>
                    <a
                      href={selected.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-press flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-bold text-ink-500 transition-colors hover:border-coral hover:text-coral"
                    >
                      <I n="link" className="h-3.5 w-3.5" />
                      فتح في المنصة ↗
                    </a>
                  </div>
                  <div className="pop relative mt-3 aspect-video overflow-hidden rounded-xl border border-line bg-ink-950 shadow-[0_20px_44px_-20px_rgba(11,36,28,0.45)]">
                    <iframe
                      src={selected.videoUrl}
                      title={`فيديو ${selected.title}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                </div>
              )}

              {/* الوصف والتفاصيل */}
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                    <I n="doc" className="h-4 w-4 text-brand" />
                    وصف المشروع
                  </h4>
                  <p className="mt-2.5 text-sm leading-8 text-ink-600">
                    {selected.description || "لم يُكتب وصف بعد."}
                  </p>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                    <I n="sliders" className="h-4 w-4 text-sea" />
                    تفاصيل التنفيذ
                  </h4>
                  <p className="mt-2.5 text-sm leading-8 text-ink-600">
                    {selected.details || "لا توجد تفاصيل إضافية."}
                  </p>
                </div>
              </div>

              {/* الأهداف */}
              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                    <I n="target" className="h-4 w-4 text-brand" />
                    الأهداف
                  </h4>
                  <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-mono text-[11px] font-bold text-brand-deep">
                    {selected.goals.filter((g) => g.done).length}/{selected.goals.length} محقق
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-ink-400">اضغط على أي هدف لتبديل حالته — يُحفظ فورًا.</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selected.goals.map((g) => (
                    <li key={g.id}>
                      <button
                        onClick={() => toggleGoal(selected.id, g.id)}
                        className={`btn-press flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-start transition-all duration-200 ${
                          g.done
                            ? "border-brand/40 bg-brand-soft/45"
                            : "border-line bg-card hover:border-ink-300"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                            g.done ? "border-brand bg-brand text-card" : "border-ink-200 text-transparent"
                          }`}
                        >
                          <I n="check" className="h-3 w-3" />
                        </span>
                        <span className={`text-[13px] font-semibold ${g.done ? "text-brand-deep" : "text-ink-600"}`}>
                          {g.text}
                        </span>
                      </button>
                    </li>
                  ))}
                  {selected.goals.length === 0 && (
                    <li className="text-[13px] text-ink-400">لا توجد أهداف مسجلة.</li>
                  )}
                </ul>
              </div>

              {/* الإنجازات */}
              <div className="mt-7">
                <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                  <I n="trophy" className="h-4 w-4 text-gold-deep" />
                  الإنجازات المحققة
                </h4>
                <ul className="mt-3 space-y-2">
                  {selected.achievements.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 rounded-xl border border-gold/25 bg-gold-soft/35 px-4 py-3">
                      <span className="shrink-0 rounded-lg bg-card px-2.5 py-1 font-mono text-sm font-bold text-gold-deep shadow-sm">
                        {a.metric}
                      </span>
                      <span className="text-[13px] font-semibold text-ink-700">{a.text}</span>
                    </li>
                  ))}
                  {selected.achievements.length === 0 && (
                    <li className="text-[13px] text-ink-400">لم تُوثّق إنجازات بعد — أضفها من تعديل المشروع.</li>
                  )}
                </ul>
              </div>

              {/* الروابط والملحقات */}
              {selected.links && selected.links.length > 0 && (
                <div className="mt-7">
                  <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                    <I n="link" className="h-4 w-4 text-gold-deep" />
                    الروابط والملحقات ({selected.links.length})
                  </h4>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {selected.links.map((l) => {
                      const iconMap: Record<ProjectLink["type"], IconName> = {
                        demo: "demo",
                        github: "github",
                        figma: "figma",
                        other: "link",
                      };
                      const colorMap: Record<ProjectLink["type"], { bg: string; fg: string }> = {
                        demo: { bg: "bg-brand-soft", fg: "text-brand" },
                        github: { bg: "bg-ink-50", fg: "text-ink-700" },
                        figma: { bg: "bg-coral-soft", fg: "text-coral" },
                        other: { bg: "bg-gold-soft", fg: "text-gold-deep" },
                      };
                      const c = colorMap[l.type];
                      return (
                        <a
                          key={l.id}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-press group flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-start transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.fg}`}>
                            <I n={iconMap[l.type]} className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-[13px] font-bold text-ink-800 transition-colors group-hover:text-brand">
                              {l.label}
                            </p>
                            <p dir="ltr" className="truncate text-[11px] text-ink-400">{l.url}</p>
                          </div>
                          <I n="arrow" className="h-4 w-4 shrink-0 text-ink-300 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-brand" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* المعرض */}
              {selected.images.length > 0 && (
                <div className="mt-7">
                  <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-900">
                    <I n="image" className="h-4 w-4 text-sea" />
                    معرض الصور ({selected.images.length})
                  </h4>
                  <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {selected.images.map((im) => (
                      <a
                        key={im.id}
                        href={im.src}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-xl border border-line"
                      >
                        <img src={im.src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* الإجراءات */}
              <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-5">
                <button
                  onClick={() => go({ name: "project-form", projectId: selected.id })}
                  className="btn-press flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 font-display text-[13px] font-bold text-card hover:bg-ink-700"
                >
                  <I n="edit" className="h-4 w-4" />
                  تعديل المشروع
                </button>
                <button
                  onClick={() => setDelTarget(selected)}
                  className="btn-press flex items-center gap-2 rounded-xl border border-coral/40 px-5 py-2.5 text-[13px] font-bold text-coral hover:bg-coral-soft"
                >
                  <I n="trash" className="h-4 w-4" />
                  حذف
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="btn-press ms-auto rounded-xl border border-ink-200 px-5 py-2.5 text-[13px] font-semibold text-ink-500 hover:bg-ink-50"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Confirm
        open={!!delTarget}
        title={`حذف مشروع «${delTarget?.title ?? ""}»؟`}
        desc="سيُحذف المشروع بكل صوره وأهدافه وإنجازاته. هذا الإجراء لا يمكن التراجع عنه."
        onCancel={() => setDelTarget(null)}
        onConfirm={() => {
          if (delTarget) {
            deleteProject(delTarget.id);
            setSelectedId(null);
            toast("تم حذف المشروع", "info");
          }
          setDelTarget(null);
        }}
      />
    </div>
  );
}
