import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "../store";
import { I, type IconName } from "../icons";
import { CountUp, Overline, ProgressRing, Reveal, Ticks } from "../components/ui";
import { LOGO_URL, STATUS_STYLE, formatDate, type View } from "../types";

function Tile({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="relative h-full rounded-xl border border-line bg-card p-4 shadow-[0_1px_0_rgba(11,36,28,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(11,36,28,0.25)] sm:p-5 lg:p-6">
        <Ticks className="text-ink-200" />
        {children}
      </div>
    </Reveal>
  );
}

export default function Overview({ go, onCloud }: { go: (v: View) => void; onCloud: () => void }) {
  const { db, sync } = useStore();

  const totalGoals = db.projects.reduce((s, p) => s + p.goals.length, 0);
  const doneGoals = db.projects.reduce((s, p) => s + p.goals.filter((g) => g.done).length, 0);
  const goalsPct = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0;
  const totalAch = db.projects.reduce((s, p) => s + p.achievements.length, 0);
  const latestAch = useMemo(
    () =>
      db.projects
        .flatMap((p) => p.achievements.map((a) => ({ ...a, project: p.title })))
        .slice(-3)
        .reverse(),
    [db.projects]
  );

  /* نشاط آخر 6 أشهر */
  const activity = useMemo(() => {
    const key = (ts: number) => {
      const d = new Date(ts);
      return `${d.getFullYear()}-${d.getMonth()}`;
    };
    const months: { k: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        k: `${d.getFullYear()}-${d.getMonth()}`,
        label: new Intl.DateTimeFormat("ar-EG-u-nu-latn", { month: "short" }).format(d),
      });
    }
    return months.map((m) => ({
      name: m.label,
      مشاريع: db.projects.filter((p) => key(p.createdAt) === m.k).length,
      مقالات: db.articles.filter((a) => key(a.createdAt) === m.k).length,
    }));
  }, [db]);

  const fieldDist = useMemo(() => {
    const max = Math.max(1, ...db.fields.map((f) => db.projects.filter((p) => p.fieldId === f.id).length));
    return db.fields.map((f) => ({
      ...f,
      count: db.projects.filter((p) => p.fieldId === f.id).length,
      max,
    }));
  }, [db]);

  const recentProjects = [...db.projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const recentArticles = [...db.articles].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  const stats: { label: string; en: string; value: number; icon: IconName; tint: string; iconBg: string }[] = [
    { label: "مشروع", en: "PROJECTS", value: db.projects.length, icon: "briefcase", tint: "text-brand-deep", iconBg: "bg-brand-soft text-brand" },
    { label: "مجال نشط", en: "FIELDS", value: db.fields.length, icon: "layers", tint: "text-gold-deep", iconBg: "bg-gold-soft text-gold-deep" },
    { label: "مقال", en: "ARTICLES", value: db.articles.length, icon: "doc", tint: "text-sea", iconBg: "bg-sea-soft text-sea" },
    { label: "إنجاز موثّق", en: "RESULTS", value: totalAch, icon: "trophy", tint: "text-coral", iconBg: "bg-coral-soft text-coral" },
  ];

  const dbEmpty =
    db.fields.length === 0 && db.projects.length === 0 && db.articles.length === 0;

  /* لوحة البداية — تظهر عندما تكون الداشبورد فارغة تمامًا */
  if (dbEmpty) {
    const steps: {
      n: string;
      t: string;
      d: string;
      icon: "layers" | "briefcase" | "doc";
      v: View;
      cta: string;
    }[] = [
      {
        n: "01",
        t: "أضف أول مجال",
        d: "المجالات هي خطوط عمل الفريق: ويب، تسويق رقمي، جرافيك، مونتاج… كل مشروع بيتنسب لمجال.",
        icon: "layers",
        v: { name: "fields" },
        cta: "فتح المجالات",
      },
      {
        n: "02",
        t: "وثّق أول مشروع",
        d: "اختر المجال، أضف الصور بروابط Image2URL، وسجّل الأهداف والإنجازات بالأرقام.",
        icon: "briefcase",
        v: { name: "project-form" },
        cta: "إضافة مشروع",
      },
      {
        n: "03",
        t: "اكتب أول مقال",
        d: "شارك معرفة الفريق مع كلمات مفتاحية دقيقة وصورة غلاف — ينشر على موقعكم مباشرة.",
        icon: "doc",
        v: { name: "article-form" },
        cta: "كتابة مقال",
      },
    ];
    return (
      <div className="space-y-5">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl bg-ink-950 px-6 py-10 sm:px-10">
            <img
              src={LOGO_URL}
              alt=""
              className="pointer-events-none absolute -bottom-10 -start-6 h-56 w-56 opacity-10 grayscale"
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(252,253,251,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(252,253,251,0.14) 1px, transparent 1px)",
                backgroundSize: "34px 34px",
              }}
            />
            <div className="relative max-w-2xl">
              <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.22em] text-gold">
                <span className="inline-block h-2 w-2 bg-gold" />
                00 / بداية جديدة
              </p>
              <h2 className="mt-3 font-display text-2xl font-extrabold leading-snug text-card sm:text-[32px]">
                <span className="line-mask">لوحتك جاهزة… وفاضية</span>
                <span className="caret ms-1 inline-block h-[0.9em] w-[3px] translate-y-[0.12em] bg-gold" />
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-8 text-ink-200">
                مفيش محتوى تجريبي هنا — كل اللي هتشوفه هو شغل فريقك الحقيقي بس. أي حاجة
                تضيفها بتتسجل فورًا في Firestore وتتشارك مع الفريق لحظيًا.
              </p>
              <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-ink-700 bg-ink-900/70 px-4 py-2">
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
                <span className="font-display text-[12px] font-bold text-ink-100">
                  {sync.mode === "cloud"
                    ? `متزامن مع Firestore — مشروع ${sync.projectId ?? "dublex-26"}`
                    : sync.mode === "connecting"
                      ? "جارِ الاتصال بفايربيز…"
                      : sync.mode === "error"
                        ? "خطأ بالاتصال — راجع قواعد الأمان"
                        : "الاتصال معطّل — فعّله من إعدادات فايربيز"}
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              <button
                onClick={() => go(s.v)}
                className="group relative h-full w-full overflow-hidden rounded-xl border border-line bg-card p-6 text-start transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/50 hover:shadow-[0_24px_50px_-22px_rgba(11,36,28,0.35)]"
              >
                <Ticks className="text-ink-200 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute -top-3 -end-1 font-mono text-[72px] font-bold leading-none text-ink-50 transition-colors duration-300 group-hover:text-gold-soft">
                  {s.n}
                </span>
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand group-hover:text-card">
                  <I n={s.icon} className="h-5 w-5" />
                </span>
                <span className="relative mt-4 block font-display text-lg font-extrabold text-ink-900">
                  {s.t}
                </span>
                <span className="relative mt-2 block text-[13px] leading-7 text-ink-500">
                  {s.d}
                </span>
                <span className="relative mt-4 flex items-center gap-1.5 font-display text-[13px] font-bold text-brand transition-all duration-300 group-hover:gap-3">
                  {s.cta}
                  <I n="arrow" className="h-4 w-4" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* صف المؤشرات */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.en} delay={i * 70}>
            <div className="relative overflow-hidden rounded-xl border border-line bg-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(11,36,28,0.25)]">
              <Ticks className="text-ink-200" />
              <span
                className="pointer-events-none absolute -bottom-3 -start-2 font-mono text-[48px] sm:text-[64px] font-bold leading-none text-ink-50"
                aria-hidden="true"
              >
                0{i + 1}
              </span>
              <div className="relative flex items-start justify-between">
                <span className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl ${s.iconBg}`}>
                  <I n={s.icon} className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span className="font-mono text-[9px] font-semibold tracking-[0.25em] text-ink-300">{s.en}</span>
              </div>
              <p className={`relative mt-3 sm:mt-4 font-mono text-2xl sm:text-4xl font-bold tracking-tight ${s.tint}`}>
                <CountUp value={s.value} />
              </p>
              <p className="relative mt-1 font-display text-[12px] sm:text-[13px] font-bold text-ink-600">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* الشبكة الرئيسية */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        {/* نبض الفريق */}
        <Tile className="col-span-12 xl:col-span-7" delay={60}>
          <div className="flex flex-wrap items-end justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <Overline>01 / نبض الفريق</Overline>
              <h3 className="mt-2 font-display text-lg sm:text-xl font-extrabold text-ink-900">
                الإنتاج خلال 6 أشهر
              </h3>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-ink-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> مشاريع
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gold" /> مقالات
              </span>
            </div>
          </div>
          <div className="mt-4 h-[228px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 8, left: -18, right: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0E6E55" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#0E6E55" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gArt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E19B10" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E19B10" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E8E1" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6E9784", fontFamily: "Space Grotesk" }}
                  axisLine={false}
                  tickLine={false}
                  reversed
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#97B5A6", fontFamily: "Space Grotesk" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #E2E6DD",
                    background: "#FCFDFB",
                    fontFamily: "IBM Plex Sans Arabic",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="مقالات" stroke="#E19B10" strokeWidth={2.5} fill="url(#gArt)" />
                <Area type="monotone" dataKey="مشاريع" stroke="#0E6E55" strokeWidth={2.5} fill="url(#gProj)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Tile>

        {/* توزيع المجالات */}
        <Tile className="col-span-12 xl:col-span-5" delay={120}>
          <Overline>02 / توزيع المجالات</Overline>
          <h3 className="mt-2 font-display text-lg sm:text-xl font-extrabold text-ink-900">أين يشتغل الفريق؟</h3>
          <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
            {fieldDist.length === 0 && (
              <p className="text-sm text-ink-400">لا توجد مجالات بعد — أضفها من قسم المجالات.</p>
            )}
            {fieldDist.map((f) => (
              <div key={f.id}>
                <div className="mb-1.5 flex items-center justify-between">
<span className="flex items-center gap-2 font-display text-[13px] font-bold text-ink-700">
  <span style={{ color: f.color }}>
    <I n={f.icon as IconName} className="h-4 w-4" />
  </span>
  {f.name}
</span>                  <span className="font-mono text-[12px] font-bold text-ink-500">
                    {f.count} {f.count === 1 ? "مشروع" : "مشاريع"}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink-50">
                  <div
                    className="grow-x h-full rounded-full"
                    style={{
                      width: `${(f.count / f.max) * 100}%`,
                      background: f.color,
                      animationDelay: "200ms",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Tile>

        {/* الأهداف */}
        <Tile className="col-span-12 sm:col-span-6 xl:col-span-4" delay={80}>
          <Overline>03 / الأهداف</Overline>
          <h3 className="mt-2 font-display text-lg sm:text-xl font-extrabold text-ink-900">تقدّم الأهداف</h3>
          <div className="mt-4 sm:mt-5 flex items-center gap-4 sm:gap-5">
            <ProgressRing pct={goalsPct} sub="محقّق" size={100} />
            <div className="space-y-2">
              <p className="font-mono text-xl sm:text-2xl font-bold text-ink-900">
                {doneGoals}
                <span className="text-sm sm:text-base text-ink-300">/{totalGoals}</span>
              </p>
              <p className="text-[11px] sm:text-[12px] leading-5 sm:leading-6 text-ink-400">
                هدفًا محققًا من إجمالي أهداف
                <br />
                كل مشاريع الفريق
              </p>
            </div>
          </div>
        </Tile>

        {/* الإنجازات */}
        <Tile className="col-span-12 sm:col-span-6 xl:col-span-4" delay={140}>
          <Overline>04 / الإنجازات</Overline>
          <h3 className="mt-2 font-display text-lg sm:text-xl font-extrabold text-ink-900">نتائج نفخر بها</h3>
          <p className="mt-3 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-gold-deep">
            <CountUp value={totalAch} />
          </p>
          <p className="text-[11px] font-bold text-ink-400">إنجازًا موثّقًا بالأرقام</p>
          <ul className="mt-4 space-y-2.5 border-t border-dashed border-line pt-4">
            {latestAch.map((a) => (
              <li key={a.id} className="flex items-center gap-2.5">
                <span className="w-16 shrink-0 rounded-md bg-gold-soft px-1.5 py-0.5 text-center font-mono text-[11px] font-bold text-gold-deep">
                  {a.metric}
                </span>
                <span className="truncate text-[12px] font-semibold text-ink-600">{a.text}</span>
              </li>
            ))}
            {latestAch.length === 0 && <li className="text-[12px] text-ink-400">وثّق أول إنجاز من أي مشروع.</li>}
          </ul>
        </Tile>

        {/* المزامنة */}
        <Tile className="col-span-12 xl:col-span-4" delay={200}>
          <Overline>05 / السحابة</Overline>
          <h3 className="mt-2 font-display text-lg sm:text-xl font-extrabold text-ink-900">مزامنة البيانات</h3>
          <div className="mt-4 sm:mt-5 rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${
                  sync.mode === "cloud"
                    ? "bg-brand pulse-dot text-brand"
                    : sync.mode === "connecting"
                      ? "bg-gold pulse-dot text-gold"
                      : sync.mode === "error"
                        ? "bg-coral"
                        : "bg-gold"
                }`}
              />
              <span className="font-display text-xs sm:text-sm font-extrabold text-ink-800">
                {sync.mode === "cloud"
                  ? "متصل بفايربيز"
                  : sync.mode === "connecting"
                    ? "جارِ الاتصال…"
                    : sync.mode === "error"
                      ? "خطأ بالاتصال"
                      : "الاتصال معطّل"}
              </span>
            </div>
            <p className="mt-2 text-[11px] sm:text-[12px] leading-5 sm:leading-6 text-ink-400">
              {sync.mode === "cloud"
                ? `بيانات الفريق محفوظة في Firestore${sync.projectId ? ` — مشروع ${sync.projectId}` : ""}.`
                : sync.mode === "error"
                  ? sync.error
                  : "البيانات محفوظة في متصفحك. اربط فايربيز لمشاركتها مع فريقك لحظيًا."}
            </p>
            {sync.lastSync && sync.mode === "cloud" && (
              <p className="mt-1 font-mono text-[10px] sm:text-[11px] font-semibold text-brand">
                آخر مزامنة {formatDate(sync.lastSync)}
              </p>
            )}
          </div>
          <button
            onClick={onCloud}
            className="btn-press mt-3 sm:mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 font-display text-[12px] sm:text-[13px] font-bold text-card transition-colors hover:bg-ink-700"
          >
            <I n="cloud" className="h-4 w-4" />
            إعدادات فايربيز
          </button>
        </Tile>

        {/* أحدث المشاريع */}
        <Tile className="col-span-12 xl:col-span-7" delay={100}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Overline>06 / أحدث المشاريع</Overline>
              <h3 className="mt-2 font-display text-lg sm:text-xl font-extrabold text-ink-900">آخر ما اشتغلنا عليه</h3>
            </div>
            <button
              onClick={() => go({ name: "projects" })}
              className="btn-press flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-[12px] font-bold text-ink-600 transition-colors hover:border-brand hover:text-brand"
            >
              عرض الكل
              <I n="arrow" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3">
            {recentProjects.length === 0 && (
              <p className="col-span-full rounded-xl border border-dashed border-line bg-ink-50/50 px-4 py-6 text-center text-[13px] font-semibold text-ink-400">
                لا مشاريع بعد — أضف أول مشروع وسيظهر هنا فورًا.
              </p>
            )}
            {recentProjects.map((p) => {
              const done = p.goals.filter((g) => g.done).length;
              const pct = p.goals.length ? Math.round((done / p.goals.length) * 100) : 0;
              return (
                <button
                  key={p.id}
                  onClick={() => go({ name: "projects" })}
                  className="btn-press group overflow-hidden rounded-xl border border-line bg-paper text-start transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg"
                >
                  <div className="relative h-24 overflow-hidden">
                    {p.cover ? (
                      <img src={p.cover} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-800 to-brand">
                        <I n="briefcase" className="h-8 w-8 text-card/50" />
                      </div>
                    )}
                    <span
                      className="absolute top-2 start-2 rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm"
                      style={{ background: "rgba(7,26,20,0.72)", color: "#FCFDFB" }}
                    >
                      {p.fieldLabel}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <p className="truncate font-display text-[13px] font-extrabold text-ink-900 group-hover:text-brand">
                      {p.title}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-ink-400">{pct}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Tile>

        {/* أحدث المقالات */}
        <Tile className="col-span-12 xl:col-span-5" delay={160}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Overline>07 / من المدونة</Overline>
              <h3 className="mt-2 font-display text-lg sm:text-xl font-extrabold text-ink-900">أحدث المقالات</h3>
            </div>
            <button
              onClick={() => go({ name: "articles" })}
              className="btn-press flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-[12px] font-bold text-ink-600 transition-colors hover:border-brand hover:text-brand"
            >
              الكل
              <I n="arrow" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
          <ul className="mt-4 divide-y divide-dashed divide-line">
            {recentArticles.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => go({ name: "articles" })}
                  className="group flex w-full items-start gap-3 py-3.5 text-start"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-50 text-ink-400 transition-colors group-hover:bg-gold-soft group-hover:text-gold-deep">
                    {a.cover ? (
                      <img src={a.cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <I n="doc" className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[13px] font-bold text-ink-800 transition-colors group-hover:text-brand">
                      {a.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-[11px] text-ink-400">
                      {a.published && a.publishedAt ? `نُشر ${formatDate(a.publishedAt)}` : formatDate(a.createdAt)}
                      <span className="h-1 w-1 rounded-full bg-ink-300" />
                      {a.readMins} دقائق قراءة
                      {!a.published && (
                        <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">مسودة</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {recentArticles.length === 0 && (
              <li className="py-6 text-sm text-ink-400">لم تُنشر مقالات بعد.</li>
            )}
          </ul>
        </Tile>
      </div>

      {/* شريط الحالة */}
      <Reveal delay={120}>
        <div className="relative overflow-hidden rounded-xl bg-ink-950 px-4 sm:px-6 py-5 sm:py-7 lg:px-8">
          <img
            src={LOGO_URL}
            alt=""
            className="pointer-events-none absolute -top-6 start-6 h-24 w-24 sm:h-32 sm:w-32 opacity-10 grayscale"
          />
          <div className="relative flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.3em] text-gold">STATUS / الحالة</p>
              <h3 className="mt-2 font-display text-base sm:text-xl lg:text-2xl font-extrabold text-card">
                {db.projects.filter((p) => p.status === "active").length} مشاريع جارية الآن
                <span className="ms-2 sm:ms-3 inline-flex flex-wrap items-center gap-1.5 sm:gap-2 align-middle text-[10px] sm:text-[12px] font-bold text-ink-300">
                  {(["planning", "active", "done"] as const).map((s) => (
                    <span key={s} className="flex items-center gap-1 sm:gap-1.5">
                      <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full" style={{ background: STATUS_STYLE[s].dot }} />
                      {db.projects.filter((p) => p.status === s).length}
                    </span>
                  ))}
                </span>
              </h3>
            </div>
            <button
              onClick={() => go({ name: "project-form" })}
              className="btn-press flex items-center gap-2 rounded-xl bg-gold px-4 sm:px-6 py-2.5 sm:py-3 font-display text-xs sm:text-sm font-extrabold text-ink-950 shadow-lg shadow-gold/20 hover:brightness-110"
            >
              <I n="plus" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              مشروع جديد
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
