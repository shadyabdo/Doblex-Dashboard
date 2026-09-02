import { useState, type FormEvent } from "react";
import { useStore } from "../store";
import { I } from "../icons";
import { ChipInput, Overline, Switch, Ticks } from "../components/ui";
import type { View } from "../types";

export default function ArticleForm({ id, go }: { id?: string; go: (v: View) => void }) {
  const { db, addArticle, updateArticle, toast } = useStore();
  const editing = id ? db.articles.find((a) => a.id === id) : undefined;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [keywords, setKeywords] = useState<string[]>(editing?.keywords ?? []);
  const [fieldLabel, setFieldLabel] = useState(editing?.fieldLabel ?? "");
  const [excerpt, setExcerpt] = useState(editing?.excerpt ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [published, setPublished] = useState(editing?.published ?? true);
  const [saving, setSaving] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast("اكتب عنوان المقال أولًا", "error");
      return;
    }
    if (keywords.length === 0) {
      toast("أضف كلمة مفتاحية واحدة على الأقل", "error");
      return;
    }
    if (!body.trim()) {
      toast("اكتب محتوى المقال", "error");
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      keywords,
      fieldLabel,
      excerpt: excerpt.trim(),
      body: body.trim(),
      published,
    };
    window.setTimeout(() => {
      if (editing) {
        updateArticle(editing.id, payload);
        toast("تم حفظ تعديلات المقال");
      } else {
        addArticle(payload);
        toast(published ? "تم نشر المقال بنجاح" : "تم حفظ المقال كمسودة");
      }
      go({ name: "articles" });
    }, 350);
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="rise">
        <Overline>{editing ? "04 / تعديل مقال" : "04 / مقال جديد"}</Overline>
        <h2 className="mt-2 overflow-hidden font-display text-2xl font-extrabold text-ink-900 sm:text-[32px] sm:leading-tight">
          <span className="line-mask">{editing ? "تعديل المقال" : "شارك معرفة الفريق مع العالم"}</span>
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          عنوان قوي، كلمات مفتاحية دقيقة، ومحتوى يفيد القارئ — هذا كل ما تحتاجه.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* المحتوى */}
        <div className="space-y-5 xl:col-span-2">
          <section className="relative rounded-xl border border-line bg-card p-5 shadow-sm sm:p-7">
            <Ticks className="text-ink-200" />
            <div className="space-y-5">
              <div>
                <label className="lbl" htmlFor="a-title">عنوان المقال *</label>
                <input
                  id="a-title"
                  className="inp font-display !text-base !font-extrabold"
                  placeholder="مثال: معدل التحويل — كيف تضاعفه في 30 يومًا؟"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="lbl" htmlFor="a-excerpt">
                  الملخص <span className="font-normal text-ink-400">(يظهر في بطاقة المقال)</span>
                </label>
                <textarea id="a-excerpt" className="inp" rows={2} placeholder="سطران يشدّان القارئ لإكمال القراءة…" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
              </div>
              <div>
                <label className="lbl" htmlFor="a-body">محتوى المقال *</label>
                <textarea id="a-body" className="inp" rows={12} placeholder="اكتب المقال كاملًا هنا… اترك سطرًا فارغًا بين الفقرات." value={body} onChange={(e) => setBody(e.target.value)} />
                <p className="mt-1.5 font-mono text-[11px] font-semibold text-ink-400">
                  {body.trim() ? `${body.trim().split(/\s+/).length} كلمة تقريبًا` : "ابدأ الكتابة…"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* الجانب */}
        <div className="space-y-5">
          <section className="relative rounded-xl border border-line bg-card p-5 shadow-sm">
            <Ticks className="text-ink-200" />
            <div className="space-y-5">
              <div>
                <span className="lbl">الكلمات المفتاحية *</span>
                <ChipInput value={keywords} onChange={setKeywords} placeholder="اكتب كلمة ثم Enter" />
                <p className="mt-1.5 text-[11px] leading-5 text-ink-400">تُستخدم لفلترة المقالات وتحسين ظهورها في البحث.</p>
              </div>
              <div>
                <label className="lbl" htmlFor="a-field">المجال المرتبط</label>
                <select id="a-field" className="inp cursor-pointer" value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)}>
                  <option value="">عام — بلا مجال محدد</option>
                  {db.fields.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-ink-50/70 px-4 py-3.5">
                <span>
                  <span className="block font-display text-[13px] font-extrabold text-ink-800">نشر فور الحفظ</span>
                  <span className="mt-0.5 block text-[11px] text-ink-400">
                    {published ? "سيظهر في الموقع مباشرة" : "سيبقى كمسودة لك فقط"}
                  </span>
                </span>
                <Switch on={published} onChange={setPublished} label="نشر المقال" />
              </div>
            </div>
          </section>

          <section className="relative rounded-xl border border-gold/30 bg-gold-soft/40 p-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink-800">
              <I n="bulb" className="h-4 w-4 text-gold-deep" />
              قبل أن تنشر
            </h3>
            <ul className="mt-3 space-y-2.5 text-[12px] leading-6 text-ink-600">
              <li className="flex gap-2">
                <I n="check" className="mt-1 h-3.5 w-3.5 shrink-0 text-brand" />
                ضع الكلمة المفتاحية الرئيسية في العنوان وأول فقرة.
              </li>
              <li className="flex gap-2">
                <I n="check" className="mt-1 h-3.5 w-3.5 shrink-0 text-brand" />
                اجعل الملخص وعدًا واضحًا بما سيجنيه القارئ.
              </li>
              <li className="flex gap-2">
                <I n="check" className="mt-1 h-3.5 w-3.5 shrink-0 text-brand" />
                اربط المقال بمشروع حقيقي من مشاريع الفريق — المصداقية تبيع.
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* شريط الحفظ */}
      <div className="rise sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-ink-700 bg-ink-950/95 p-4 shadow-2xl backdrop-blur-sm">
        <p className="hidden font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-400 sm:block">
          EDITOR / المحرر
        </p>
        <div className="ms-auto flex flex-1 flex-wrap justify-end gap-3 sm:flex-none">
          <button
            type="button"
            onClick={() => go({ name: "articles" })}
            className="btn-press rounded-xl border border-ink-600 px-6 py-3 text-sm font-semibold text-ink-200 hover:border-ink-400 hover:text-card"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-press flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-gold px-7 py-3 font-display text-sm font-extrabold text-ink-950 hover:brightness-110 disabled:opacity-60"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
            ) : (
              <I n="check" className="h-5 w-5" />
            )}
            {editing ? "حفظ التعديلات" : published ? "نشر المقال" : "حفظ كمسودة"}
          </button>
        </div>
      </div>
    </form>
  );
}
