import { useMemo, useState } from "react";
import { useStore } from "../store";
import { I } from "../icons";
import { Confirm, EmptyState, Modal, Overline, Reveal, Ticks } from "../components/ui";
import { formatDate, formatViews, type Article, type View } from "../types";

export default function Articles({ go }: { go: (v: View) => void }) {
  const { db, deleteArticle, incrementArticleView, toast } = useStore();
  const [q, setQ] = useState("");
  const [kwFilter, setKwFilter] = useState<string | null>(null);
  const [readId, setReadId] = useState<string | null>(null);
  const [delTarget, setDelTarget] = useState<Article | null>(null);

  /* فتح المقال للقراءة يحتسب مشاهدة واحدة ويُزامنها مع Firestore */
  const openArticle = (id: string) => {
    incrementArticleView(id);
    setReadId(id);
  };

  const kwCloud = useMemo(() => {
    const m = new Map<string, number>();
    db.articles.forEach((a) => a.keywords.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [db.articles]);

  const filtered = useMemo(() => {
    return db.articles.filter((a) => {
      const matchQ =
        !q.trim() ||
        a.title.includes(q) ||
        a.excerpt.includes(q) ||
        a.keywords.some((k) => k.includes(q));
      const matchKw = !kwFilter || a.keywords.includes(kwFilter);
      return matchQ && matchKw;
    });
  }, [db.articles, q, kwFilter]);

  const reading = readId ? db.articles.find((a) => a.id === readId) : undefined;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rise flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative min-w-[180px] sm:min-w-[220px] flex-1 sm:max-w-xs">
          <I n="search" className="absolute start-3 sm:start-3.5 top-1/2 h-3.5 sm:h-4 w-3.5 sm:w-4 -translate-y-1/2 text-ink-300" />
          <input className="inp !ps-9 sm:!ps-10 !text-sm" placeholder="ابحث في العناوين والكلمات المفتاحية…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="hidden sm:block font-mono text-[12px] font-bold text-ink-400">
          {filtered.length} / {db.articles.length}
        </span>
        <button
          onClick={() => go({ name: "article-form" })}
          className="btn-press ms-auto flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gold px-3 sm:px-5 py-2 sm:py-2.5 font-display text-xs sm:text-sm font-extrabold text-ink-950 hover:brightness-105"
        >
          <I n="plus" className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          <span className="hidden sm:inline">مقال جديد</span>
          <span className="sm:hidden">جديد</span>
        </button>
      </div>

      {/* سحابة الكلمات المفتاحية */}
      {kwCloud.length > 0 && (
        <div className="rise relative rounded-xl border border-line bg-card px-3 sm:px-4 py-3 sm:py-3.5">
          <Ticks className="text-ink-200" />
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="me-1 flex items-center gap-1 sm:gap-1.5 font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-ink-400">
              <I n="tag" className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-gold-deep" />
              KEYWORDS /
            </span>
            {kwCloud.map(([k, c]) => (
              <button
                key={k}
                onClick={() => setKwFilter(kwFilter === k ? null : k)}
                className={`btn-press rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-[12px] font-bold transition-all duration-200 ${
                  kwFilter === k
                    ? "border-ink-900 bg-ink-900 text-gold shadow-md"
                    : "border-ink-200 bg-paper text-ink-500 hover:border-gold hover:text-gold-deep"
                }`}
              >
                {k}
                <span className={`ms-1 sm:ms-1.5 font-mono text-[9px] sm:text-[10px] ${kwFilter === k ? "text-card" : "text-ink-300"}`}>{c}</span>
              </button>
            ))}
            {kwFilter && (
              <button onClick={() => setKwFilter(null)} className="btn-press text-[10px] sm:text-[11px] font-bold text-coral hover:underline">
                مسح ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* القائمة */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="doc"
          title={db.articles.length === 0 ? "لا مقالات بعد" : "لا نتائج مطابقة"}
          desc={
            db.articles.length === 0
              ? "اكتب أول مقال للفريق مع كلماته المفتاحية ليظهر في موقعكم."
              : "جرّب كلمة أخرى أو امسح فلتر الكلمات المفتاحية."
          }
        >
          {db.articles.length === 0 && (
            <button
              onClick={() => go({ name: "article-form" })}
              className="btn-press flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-display text-sm font-bold text-card hover:bg-brand-deep"
            >
              <I n="pen" className="h-4 w-4" />
              كتابة أول مقال
            </button>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filtered.map((a, i) => (
            <Reveal key={a.id} delay={i * 70}>
              <article
                onClick={() => openArticle(a.id)}
                className="group relative cursor-pointer rounded-xl border border-line bg-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_20px_44px_-20px_rgba(11,36,28,0.28)] lg:p-6"
              >
                <Ticks className="text-ink-200 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex gap-3 sm:gap-4 lg:gap-6">
                  <span className="hidden select-none font-mono text-4xl font-bold leading-none text-ink-100 transition-colors duration-300 group-hover:text-gold-soft sm:block">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!a.published && (
                        <span className="rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">مسودة</span>
                      )}
                      <span
                        className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          a.published ? "bg-brand-soft text-brand-deep" : "bg-ink-50 text-ink-400"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${a.published ? "bg-brand" : "bg-ink-300"}`} />
                        {a.published ? "منشور" : "غير منشور"}
                      </span>
                      {a.fieldLabel && (
                        <span className="rounded-md bg-sea-soft px-2 py-0.5 text-[10px] font-bold text-sea">{a.fieldLabel}</span>
                      )}
                      {a.published && a.publishedAt && (
                        <span className="flex items-center gap-1 rounded-md bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-gold-deep">
                          <I n="calendar" className="h-3 w-3" />
                          نُشر {formatDate(a.publishedAt)}
                        </span>
                      )}
                      <span className="ms-auto font-mono text-[11px] font-semibold text-ink-300">
                        أضيف {formatDate(a.createdAt)}
                      </span>
                    </div>
                    <h3 className="mt-2 sm:mt-2.5 font-display text-base sm:text-lg lg:text-xl font-extrabold leading-7 sm:leading-8 text-ink-900 transition-colors group-hover:text-brand">
                      {a.title}
                    </h3>
                    <p className="mt-1 sm:mt-1.5 line-clamp-2 max-w-3xl text-xs sm:text-sm leading-6 sm:leading-7 text-ink-500">{a.excerpt}</p>
                    <div className="mt-2.5 sm:mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {a.keywords.map((k) => (
                        <span key={k} className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-gold-soft px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-gold-deep">
                          <I n="tag" className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {k}
                        </span>
                      ))}
                      <span className="ms-auto flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-bold text-ink-400">
                        <span className="flex items-center gap-1" title="مشاهدات صفحة المدونة">
                          <I n="eye" className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-brand" />
                          {formatViews(a.views ?? 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <I n="clock" className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                          {a.readMins} د
                        </span>
                        <span className="hidden sm:flex items-center gap-1 text-brand opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          قراءة
                          <I n="arrow" className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                        </span>
                      </span>
                    </div>
                  </div>
                  {a.cover && (
                    <div className="hidden shrink-0 self-center overflow-hidden rounded-xl border border-line sm:block">
                      <img
                        src={a.cover}
                        alt=""
                        className="h-20 sm:h-24 w-28 sm:w-32 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  )}
                </div>
                {/* أزرار سريعة */}
                <div className="absolute top-4 end-4 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => go({ name: "article-form", articleId: a.id })}
                    aria-label={`تعديل ${a.title}`}
                    className="btn-press rounded-lg bg-paper p-2 text-ink-400 shadow-sm hover:text-brand"
                  >
                    <I n="edit" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDelTarget(a)}
                    aria-label={`حذف ${a.title}`}
                    className="btn-press rounded-lg bg-paper p-2 text-ink-400 shadow-sm hover:text-coral"
                  >
                    <I n="trash" className="h-4 w-4" />
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}

      {/* نافذة القراءة */}
      <Modal open={!!reading} onClose={() => setReadId(null)} wide>
        {reading && (
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Overline>قراءة المقال</Overline>
                <h2 className="mt-2 font-display text-xl font-extrabold leading-9 text-ink-900 sm:text-2xl">
                  {reading.title}
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-3 text-[12px] font-bold text-ink-400">
                  {reading.published && reading.publishedAt ? (
                    <span className="flex items-center gap-1.5 rounded-md bg-gold-soft px-2.5 py-1 text-gold-deep">
                      <I n="calendar" className="h-3.5 w-3.5" />
                      تاريخ النشر: {formatDate(reading.publishedAt)}
                    </span>
                  ) : (
                    <span className="rounded-md bg-ink-100 px-2.5 py-1 text-ink-500">مسودة — لم تُنشر بعد</span>
                  )}
                  <span className="h-1 w-1 rounded-full bg-ink-300" />
                  <span>أضيفت {formatDate(reading.createdAt)}</span>
                  <span className="h-1 w-1 rounded-full bg-ink-300" />
                  <span>{reading.readMins} دقائق قراءة</span>
                  <span className="h-1 w-1 rounded-full bg-ink-300" />
                  <span className="flex items-center gap-1.5 rounded-md bg-brand-soft px-2.5 py-1 text-brand-deep">
                    <I n="eye" className="h-3.5 w-3.5" />
                    {formatViews(reading.views ?? 0)} مشاهدة
                  </span>
                  {reading.fieldLabel && (
                    <span className="rounded-md bg-sea-soft px-2 py-0.5 text-sea">{reading.fieldLabel}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setReadId(null)}
                className="btn-press flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink-200 text-ink-500 hover:bg-coral-soft hover:text-coral"
                aria-label="إغلاق"
              >
                <I n="x" className="h-4 w-4" />
              </button>
            </div>
            {reading.cover && (
              <img
                src={reading.cover}
                alt=""
                className="mt-6 max-h-72 w-full rounded-xl border border-line object-cover"
              />
            )}
            <div className="mt-6 space-y-4 border-t border-dashed border-line pt-6">
              {reading.body.split("\n").filter(Boolean).map((p, i) => (
                <p key={i} className="text-[15px] leading-9 text-ink-700">
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-2 rounded-xl bg-ink-50/70 px-4 py-3.5">
                <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-400">الكلمات المفتاحية /</span>
                {reading.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-bold text-gold-deep">{k}</span>
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl border border-sea/25 bg-sea-soft/45 px-4 py-3.5">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.2em] text-sea">
                  <I n="tag" className="h-3.5 w-3.5" />
                  TAGS / متزامنة في Firestore
                </span>
                <div className="flex flex-wrap gap-1.5" dir="ltr">
                  {(reading.tags?.length ? reading.tags : []).map((t) => (
                    <span key={t} className="rounded-full bg-card px-2.5 py-1 font-mono text-[11px] font-bold text-sea shadow-sm">
                      #{t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText((reading.tags ?? []).map((t) => `#${t}`).join(" "))
                      .then(() => toast("تم نسخ الوسوم"))
                      .catch(() => toast("تعذّر النسخ", "error"));
                  }}
                  className="btn-press ms-auto flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-[11px] font-bold text-sea shadow-sm hover:bg-sea hover:text-card"
                >
                  <I n="copy" className="h-3.5 w-3.5" />
                  نسخ الكل
                </button>
                <p className="w-full text-[10px] leading-5 text-ink-400">
                  يقرأها الموقع الرئيسي من حقل <code dir="ltr" className="font-mono font-bold">tags</code> داخل مستند
                  الداشبورد — جاهزة للروابط (slug) بدون فراغات.
                </p>
              </div>
              <button
                onClick={() => {
                  go({ name: "article-form", articleId: reading.id });
                }}
                className="btn-press mt-4 flex items-center gap-1.5 rounded-lg bg-ink-900 px-4 py-2 text-[12px] font-bold text-card hover:bg-ink-700"
              >
                <I n="edit" className="h-3.5 w-3.5" />
                تعديل المقال
              </button>
          </div>
        )}
      </Modal>

      <Confirm
        open={!!delTarget}
        title={`حذف مقال «${delTarget?.title ?? ""}»؟`}
        desc="سيُحذف المقال نهائيًا بكل كلماته المفتاحية."
        onCancel={() => setDelTarget(null)}
        onConfirm={() => {
          if (delTarget) {
            deleteArticle(delTarget.id);
            toast("تم حذف المقال", "info");
          }
          setDelTarget(null);
        }}
      />
    </div>
  );
}
