import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { I, type IconName } from "../icons";
import { CountUp, EmptyState, Overline, Reveal, Ticks } from "../components/ui";
import {
  STATUS_LABEL,
  STATUS_STYLE,
  formatDate,
  formatViews,
  isVideoField,
  type View,
} from "../types";

export default function FieldDetail({ id, go }: { id: string; go: (v: View) => void }) {
  const { db, incrementFieldView } = useStore();
  const field = db.fields.find((f) => f.id === id);
  const counted = useRef(false);
  const [justCounted, setJustCounted] = useState(false);

  /* تُحتسب مشاهدة واحدة عند فتح الصفحة، وتُزامَن لحظيًا مع Firestore */
  useEffect(() => {
    if (counted.current || !field) return;
    counted.current = true;
    incrementFieldView(id);
    setJustCounted(true);
    const t = window.setTimeout(() => setJustCounted(false), 1600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!field) {
    return (
      <EmptyState
        icon="layers"
        title="المجال غير موجود"
        desc="ربما تم حذفه. ارجع لقائمة المجالات."
      >
        <button
          onClick={() => go({ name: "fields" })}
          className="btn-press flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-display text-sm font-bold text-card hover:bg-brand-deep"
        >
          <I n="arrow" className="h-4 w-4" />
          العودة للمجالات
        </button>
      </EmptyState>
    );
  }

  const projects = db.projects.filter((p) => p.fieldId === id);
  const views = field.views ?? 0;
  const doneGoals = projects.reduce(
    (s, p) => s + p.goals.filter((g) => g.done).length,
    0
  );
  const totalGoals = projects.reduce((s, p) => s + p.goals.length, 0);
  const achCount = projects.reduce((s, p) => s + p.achievements.length, 0);

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 px-2 sm:px-0">
      {/* شريط الرجوع */}
      <div className="rise flex items-center justify-between gap-2">
        <button
          onClick={() => go({ name: "fields" })}
          className="btn-press flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-ink-200 bg-card px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[13px] font-bold text-ink-600 hover:border-brand hover:text-brand"
        >
          <I n="arrow" className="h-3.5 w-3.5 sm:h-4 sm:w-4 -scale-x-100" />
          <span className="hidden sm:inline">كل المجالات</span>
          <span className="sm:hidden">رجوع</span>
        </button>
        <span className="hidden sm:block font-mono text-[11px] font-semibold text-ink-300">
          أُضيف {formatDate(field.createdAt)}
        </span>
      </div>

      {/* ترويسة الصفحة — عداد المشاهدات هو البطل */}
      <Reveal>
        <div
          className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-ink-950 px-3 sm:px-6 lg:px-10 py-4 sm:py-8 lg:py-9"
          style={{
            backgroundImage: `radial-gradient(680px 320px at 12% -40%, ${field.color}55, transparent 65%), radial-gradient(520px 300px at 95% 130%, #E19B1026, transparent 60%)`,
          }}
        >
          <img
            src="https://www.image2url.com/r2/default/images/1788264047480-46d203e2-c238-469a-9424-3af4429ac94c.png"
            alt=""
            className="pointer-events-none absolute -bottom-14 -start-8 h-24 w-24 sm:h-40 sm:w-40 lg:h-52 lg:w-52 opacity-[0.07] grayscale"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(252,253,251,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(252,253,251,0.13) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-7">
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-1.5 sm:gap-2 font-mono text-[9px] sm:text-[11px] font-semibold tracking-[0.22em]" style={{ color: field.color }}>
                <span className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2" style={{ background: field.color }} />
                <span className="hidden sm:inline">FIELD PAGE / صفحة المجال</span>
                <span className="sm:hidden">صفحة المجال</span>
              </p>
              <div className="mt-1.5 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3.5">
                <span
                  className="flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl"
                  style={{ background: field.soft, color: field.color }}
                >
                  <I n={field.icon as IconName} className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                </span>
                <h2 className="font-display text-lg sm:text-2xl lg:text-3xl font-extrabold leading-snug text-card flex-1 min-w-0">
                  <span className="line-mask break-words">{field.name}</span>
                </h2>
                {isVideoField(field) && (
                  <span className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-coral-soft px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold text-coral">
                    <I n="play" className="h-2 w-2 sm:h-3 sm:w-3" />
                    فيديو
                  </span>
                )}
              </div>
              <p className="mt-1.5 sm:mt-3 text-[11px] sm:text-sm leading-5 sm:leading-7 text-ink-200">{field.desc || "بدون وصف"}</p>
            </div>

            {/* عداد المشاهدات */}
            <div className="shrink-0 w-full lg:w-auto">
              <div
                className={`relative rounded-lg sm:rounded-xl lg:rounded-2xl border bg-ink-900/70 px-3 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-6 text-center backdrop-blur-sm transition-transform duration-300 ${
                  justCounted ? "scale-[1.04]" : ""
                }`}
                style={{ borderColor: `${field.color}66` }}
              >
                <Ticks className="text-ink-700" />
                <p className="flex items-center justify-center gap-1 sm:gap-2 font-mono text-[8px] sm:text-[10px] font-semibold tracking-[0.25em] text-ink-300">
                  <span style={{ color: field.color }}>
                    <I n="eye" className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                  </span>
                  <span className="hidden sm:inline">PAGE VIEWS / مشاهدات الصفحة</span>
                  <span className="sm:hidden">المشاهدات</span>
                </p>
                <p className="mt-1 sm:mt-2 font-mono text-2xl sm:text-4xl lg:text-5xl font-bold leading-none tracking-tight text-card">
                  <CountUp value={views} />
                </p>
                <p className="mt-1 sm:mt-2.5 text-[9px] sm:text-[11px] font-semibold text-ink-400">
                  {justCounted ? (
                    <span className="flex items-center justify-center gap-0.5 sm:gap-1.5 text-gold">
                      <span className="pulse-dot h-1 w-1 sm:h-2 sm:w-2 rounded-full bg-gold text-gold" />
                      <span className="hidden sm:inline">+1 مشاهدة الآن — تمت المزامنة</span>
                      <span className="sm:hidden">+1 مشاهدة</span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline">تُزامَن لحظيًا مع Firestore</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* مؤشرات سريعة */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 xl:grid-cols-4">
        {[
          { label: "مشروع", en: "PROJECTS", value: projects.length, tint: "text-brand-deep", icon: "briefcase" as IconName, bg: "bg-brand-soft text-brand" },
          { label: "مشاهدة", en: "VIEWS", value: views, tint: "text-gold-deep", icon: "eye" as IconName, bg: "bg-gold-soft text-gold-deep" },
          { label: "هدف محقق", en: "GOALS DONE", value: doneGoals, tint: "text-sea", icon: "target" as IconName, bg: "bg-sea-soft text-sea" },
          { label: "إنجاز", en: "RESULTS", value: achCount, tint: "text-coral", icon: "trophy" as IconName, bg: "bg-coral-soft text-coral" },
        ].map((s, i) => (
          <Reveal key={s.en} delay={i * 70}>
            <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-line bg-card p-2 sm:p-3 lg:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(11,36,28,0.25)]">
              <Ticks className="text-ink-200" />
              <div className="flex items-start justify-between">
                <span className={`flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-md sm:rounded-lg lg:rounded-xl ${s.bg}`}>
                  <I n={s.icon} className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                </span>
                <span className="hidden sm:block font-mono text-[8px] sm:text-[9px] font-semibold tracking-[0.25em] text-ink-300">{s.en}</span>
              </div>
              <p className={`mt-1.5 sm:mt-2.5 lg:mt-4 font-mono text-xl sm:text-2xl lg:text-4xl font-bold tracking-tight ${s.tint}`}>
                <CountUp value={s.value} />
              </p>
              <p className="mt-0.5 sm:mt-1 font-display text-[10px] sm:text-[11px] lg:text-[13px] font-bold text-ink-600">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* مشاريع المجال */}
      <div className="rise flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Overline>مشاريع المجال</Overline>
          <h3 className="mt-2 font-display text-base sm:text-lg lg:text-xl font-extrabold text-ink-900">
            {projects.length ? `أحدث شغلنا في ${field.name}` : "لا مشاريع بعد"}
          </h3>
        </div>
        <button
          onClick={() => go({ name: "project-form" })}
          className="btn-press flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl bg-gold px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 font-display text-xs sm:text-sm font-extrabold text-ink-950 hover:brightness-105"
        >
          <I n="plus" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">مشروع جديد</span>
          <span className="sm:hidden">جديد</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title="لم تُضف مشاريع لهذا المجال بعد"
          desc="ابدأ بتوثيق أول مشروع في هذا المجال."
        >
          <button
            onClick={() => go({ name: "project-form" })}
            className="btn-press flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-brand px-4 sm:px-6 py-2 sm:py-3 font-display text-xs sm:text-sm font-bold text-card hover:bg-brand-deep"
          >
            <I n="plus" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            إضافة أول مشروع
          </button>
        </EmptyState>
      ) : (
        <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => {
            const st = STATUS_STYLE[p.status];
            const done = p.goals.filter((g) => g.done).length;
            const pct = p.goals.length ? Math.round((done / p.goals.length) * 100) : 0;
            return (
              <Reveal key={p.id} delay={(i % 3) * 90}>
                <button
                  onClick={() => go({ name: "project-detail", projectId: p.id })}
                  className="group block w-full overflow-hidden rounded-lg sm:rounded-xl border border-line bg-card text-start transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-22px_rgba(11,36,28,0.35)]"
                >
                  <div className="relative h-32 sm:h-36 lg:h-40 overflow-hidden">
                    {p.cover ? (
                      <img src={p.cover} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-800 via-ink-700 to-brand">
                        <I n="briefcase" className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 text-card/50" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-10 sm:h-12 lg:h-14 bg-gradient-to-t from-ink-950/55 to-transparent" />
                    <span
                      className="absolute top-2 start-2 sm:top-3 sm:start-3 flex items-center gap-1 sm:gap-1.5 rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold"
                      style={{ background: st.bg, color: st.fg }}
                    >
                      <span className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${p.status === "active" ? "pulse-dot" : ""}`} style={{ background: st.dot }} />
                      {STATUS_LABEL[p.status]}
                    </span>
                    {p.videoUrl && (
                      <span className="absolute top-2 end-2 sm:top-3 sm:end-3 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-ink-950/70 text-card backdrop-blur-sm">
                        <I n="play" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 lg:p-5">
                    <h4 className="truncate font-display text-sm sm:text-base lg:text-lg font-extrabold text-ink-900 transition-colors group-hover:text-brand">
                      {p.title}
                    </h4>
                    <p className="mt-0.5 truncate text-[11px] sm:text-[12px] text-ink-400">{p.subtitle || p.client}</p>
                    <div className="mt-2.5 sm:mt-3 lg:mt-4">
                      <div className="mb-1 sm:mb-1.5 flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
                        <span className="text-ink-400">تقدّم الأهداف</span>
                        <span className="font-mono" style={{ color: field.color }}>
                          {done}/{p.goals.length}
                        </span>
                      </div>
                      <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-ink-50">
                        <div
                          className="grow-x h-full rounded-full"
                          style={{ width: `${pct}%`, background: field.color, animationDelay: `${i * 80}ms` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* ملاحظة المزامنة */}
      <Reveal delay={120}>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-dashed border-ink-200 bg-card px-3 sm:px-5 py-3 sm:py-4">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-brand-soft text-brand">
            <I n="cloud" className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </span>
          <p className="flex-1 text-[11px] sm:text-[12px] font-semibold leading-5 sm:leading-6 text-ink-500">
            عداد المشاهدات محفوظ في حقل <code dir="ltr" className="rounded bg-ink-50 px-1 sm:px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-brand-deep">views</code> داخل
            المجال — يقرأه الموقع الرئيسي ليعرضه ويزيده مع كل زيارة حقيقية لصفحة المجال.
          </p>
          <span className="font-mono text-[10px] sm:text-[11px] font-bold text-ink-400 whitespace-nowrap">{formatViews(views)} مشاهدة</span>
        </div>
      </Reveal>
    </div>
  );
}
