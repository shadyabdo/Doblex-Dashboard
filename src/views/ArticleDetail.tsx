import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { I } from "../icons";
import { Overline, Reveal, Ticks } from "../components/ui";
import { formatDate, type View } from "../types";

export default function ArticleDetail({ id, go }: { id: string; go: (v: View) => void }) {
  const { db, deleteArticle, incrementArticleView } = useStore();
  const article = db.articles.find((a) => a.id === id);
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current || !article) return;
    counted.current = true;
    incrementArticleView(id);
  }, [id, article, incrementArticleView]);

  if (!article) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <I n="alert" className="mx-auto h-16 w-16 text-coral" />
          <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900">
            المقال غير موجود
          </h2>
          <p className="mt-2 text-ink-500">ربما تم حذفه أو لم يعد موجودًا</p>
          <button
            onClick={() => go({ name: "articles" })}
            className="btn-press mt-6 rounded-xl bg-brand px-6 py-3 font-display font-bold text-card hover:bg-brand-deep"
          >
            العودة للمقالات
          </button>
        </div>
      </div>
    );
  }

  const field = db.fields.find((f) => f.name === article.fieldLabel);

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      {/* Header */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-ink-950 p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 50%, #E19B1040 0%, transparent 50%),
                  radial-gradient(circle at 80% 50%, #0E6E5540 0%, transparent 50%)
                `,
              }}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => go({ name: "articles" })}
              className="btn-press mb-3 sm:mb-4 flex items-center gap-2 rounded-lg border border-ink-700 px-3 py-1.5 text-xs sm:text-sm text-ink-300 hover:border-ink-500 hover:text-card"
            >
              <I n="arrow" className="h-4 w-4 rotate-180" />
              العودة للمقالات
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <span
                className={`rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold ${
                  article.published
                    ? "bg-brand-soft text-brand-deep"
                    : "bg-ink-100 text-ink-500"
                }`}
              >
                {article.published ? "منشور" : "مسودة"}
              </span>
              {field && (
                <span
                  className="rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold"
                  style={{ background: field.soft, color: field.color }}
                >
                  {field.name}
                </span>
              )}
              {article.publishedAt && (
                <span className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-gold-soft px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-gold-deep">
                  <I n="calendar" className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  نُشر {formatDate(article.publishedAt)}
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-card">
              {article.title}
            </h1>

            <div className="mt-3 sm:mt-4 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-ink-400">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <I n="clock" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {article.readMins} دقائق قراءة
              </span>
              <span className="flex items-center gap-1.5">
                <I n="eye" className="h-4 w-4" />
                {article.views || 0} مشاهدة
              </span>
              <span className="flex items-center gap-1.5">
                <I n="calendar" className="h-4 w-4" />
                أضيف {formatDate(article.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Cover Image */}
      {article.cover && (
        <Reveal delay={100}>
          <div className="overflow-hidden rounded-xl border border-line">
            <img
              src={article.cover}
              alt={article.title}
              className="w-full object-cover"
              style={{ maxHeight: "300px" }}
            />
          </div>
        </Reveal>
      )}

      {/* Excerpt */}
      {article.excerpt && (
        <Reveal delay={150}>
          <div className="rounded-xl border border-gold/30 bg-gold-soft/30 p-4 sm:p-5 lg:p-6">
            <Overline>الملخص</Overline>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-ink-700 leading-relaxed italic">
              {article.excerpt}
            </p>
          </div>
        </Reveal>
      )}

      {/* Content */}
      <Reveal delay={200}>
        <div className="rounded-xl border border-line bg-card p-4 sm:p-6 lg:p-8">
          <Overline>المحتوى</Overline>
          <div className="mt-4 sm:mt-6 prose prose-sm sm:prose-base lg:prose-lg max-w-none">
            {article.body.split("\n").map((paragraph, index) => (
              <p key={index} className="mb-3 sm:mb-4 text-sm sm:text-base text-ink-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Keywords */}
      {article.keywords.length > 0 && (
        <Reveal delay={250}>
          <div className="rounded-xl border border-line bg-card p-4 sm:p-5 lg:p-6">
            <Overline>الكلمات المفتاحية</Overline>
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
              {article.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-gold-soft px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-gold-deep"
                >
                  <I n="tag" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <Reveal delay={300}>
          <div className="rounded-xl border border-sea/30 bg-sea-soft/30 p-4 sm:p-5 lg:p-6">
            <Overline>الوسوم (Tags)</Overline>
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2" dir="ltr">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-card px-3 sm:px-4 py-1.5 sm:py-2 font-mono text-xs sm:text-sm font-bold text-sea shadow-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Actions */}
      <Reveal delay={350}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={() => go({ name: "article-form", articleId: article.id })}
            className="btn-press flex items-center justify-center gap-2 rounded-xl bg-brand px-4 sm:px-6 py-3 font-display text-sm font-bold text-card hover:bg-brand-deep sm:flex-1"
          >
            <I n="edit" className="h-4 w-4 sm:h-5 sm:w-5" />
            تعديل المقال
          </button>
          <button
            onClick={async () => {
              if (window.confirm("هل أنت متأكد من حذف هذا المقال؟")) {
                deleteArticle(article.id);
                go({ name: "articles" });
              }
            }}
            className="btn-press flex items-center justify-center gap-2 rounded-xl border-2 border-coral/40 bg-coral-soft/30 px-4 sm:px-6 py-3 font-display text-sm font-bold text-coral hover:bg-coral hover:text-card sm:flex-1"
          >
            <I n="trash" className="h-4 w-4 sm:h-5 sm:w-5" />
            حذف المقال
          </button>
        </div>
      </Reveal>
    </div>
  );
}
