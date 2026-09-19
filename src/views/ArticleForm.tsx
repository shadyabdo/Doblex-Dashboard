import { useState, type FormEvent } from "react";
import { useStore } from "../store";
import { I } from "../icons";
import { ChipInput, Overline, Switch, Thumb, Ticks } from "../components/ui";
import { ImageHelpButton } from "../imageHelp";
import { formatDate, toTags, type Comparison, type FAQ, type View } from "../types";

export default function ArticleForm({ id, go }: { id?: string; go: (v: View) => void }) {
  const { db, addArticle, updateArticle, toast } = useStore();
  const editing = id ? db.articles.find((a) => a.id === id) : undefined;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [keywords, setKeywords] = useState<string[]>(editing?.keywords ?? []);
  const [fieldLabel, setFieldLabel] = useState(editing?.fieldLabel ?? "");
  const [excerpt, setExcerpt] = useState(editing?.excerpt ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [cover, setCover] = useState(editing?.cover ?? "");
  const [coverUrl, setCoverUrl] = useState("");
  const [published, setPublished] = useState(editing?.published ?? true);
  const [saving, setSaving] = useState(false);

  // FAQ states
  const [faqs, setFaqs] = useState<FAQ[]>(editing?.faqs ?? []);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  // Comparison states
  const [comparisons, setComparisons] = useState<Comparison[]>(editing?.comparisons ?? []);
  const [compTitle, setCompTitle] = useState("");
  const [compItem1, setCompItem1] = useState("");
  const [compItem2, setCompItem2] = useState("");
  const [compDifferences, setCompDifferences] = useState<string[]>([]);
  const [compDiffInput, setCompDiffInput] = useState("");
  const setCoverLink = () => {
    const v = coverUrl.trim();
    if (!v) {
      toast("الصق رابط الصورة أولًا — من Image2URL", "error");
      return;
    }
    if (!/^https?:\/\/.+/i.test(v)) {
      toast("الرابط غير صالح — يجب أن يبدأ بـ https:// (انسخ الـ Direct Link من Image2URL)", "error");
      return;
    }
    setCover(v);
    setCoverUrl("");
    toast("تم تعيين صورة المقال كرابط مباشر");
  };

  // FAQ functions
  const addFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast("اكتب السؤال والإجابة", "error");
      return;
    }
    setFaqs([...faqs, { id: Math.random().toString(36).slice(2), question: faqQuestion.trim(), answer: faqAnswer.trim() }]);
    setFaqQuestion("");
    setFaqAnswer("");
    toast("تمت إضافة السؤال");
  };

  const removeFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  // Comparison functions
  const addComparison = () => {
    if (!compTitle.trim() || !compItem1.trim() || !compItem2.trim()) {
      toast("املأ العنوان والعنصرين", "error");
      return;
    }
    setComparisons([
      ...comparisons,
      { id: Math.random().toString(36).slice(2), title: compTitle.trim(), item1: compItem1.trim(), item2: compItem2.trim(), differences: compDifferences },
    ]);
    setCompTitle("");
    setCompItem1("");
    setCompItem2("");
    setCompDifferences([]);
    toast("تمت إضافة المقارنة");
  };

  const removeComparison = (id: string) => {
    setComparisons(comparisons.filter((c) => c.id !== id));
  };

  const addDifference = () => {
    if (!compDiffInput.trim()) return;
    setCompDifferences([...compDifferences, compDiffInput.trim()]);
    setCompDiffInput("");
  };

  const removeDifference = (index: number) => {
    setCompDifferences(compDifferences.filter((_, i) => i !== index));
  };

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
      cover,
      published,
      faqs,
      comparisons,
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
    <form onSubmit={save} className="space-y-4 sm:space-y-5">
      <div className="rise">
        <Overline>{editing ? "04 / تعديل مقال" : "04 / مقال جديد"}</Overline>
        <h2 className="mt-2 overflow-hidden font-display text-xl sm:text-2xl lg:text-[32px] font-extrabold text-ink-900 sm:leading-tight">
          <span className="line-mask">{editing ? "تعديل المقال" : "شارك معرفة الفريق مع العالم"}</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-ink-500">
          عنوان قوي، كلمات مفتاحية دقيقة، ومحتوى يفيد القارئ — هذا كل ما تحتاجه.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-3">
        {/* المحتوى */}
        <div className="space-y-4 sm:space-y-5 xl:col-span-2">
          <section className="relative rounded-xl border border-line bg-card p-4 sm:p-5 lg:p-7 shadow-sm">
            <Ticks className="text-ink-200" />
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="lbl" htmlFor="a-title">عنوان المقال *</label>
                <input
                  id="a-title"
                  className="inp font-display !text-sm sm:!text-base !font-extrabold"
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

          {/* الأسئلة الشائعة */}
          <section className="relative rounded-xl border border-line bg-card p-4 sm:p-5 lg:p-7 shadow-sm">
            <Ticks className="text-ink-200" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <I n="bulb" className="h-5 w-5 text-gold-deep" />
                <h3 className="font-display text-base sm:text-lg font-extrabold text-ink-900">الأسئلة الشائعة</h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-500">أضف أسئلة شائعة مع إجاباتها — ستظهر كأكورديون في المقال</p>
              
              <div className="space-y-3">
                <div>
                  <label className="lbl">السؤال</label>
                  <input
                    className="inp !text-xs sm:!text-sm"
                    placeholder="ما هو معدل التحويل؟"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                  />
                </div>
                <div>
                  <label className="lbl">الإجابة</label>
                  <textarea
                    className="inp !text-xs sm:!text-sm"
                    rows={3}
                    placeholder="معدل التحويل هو نسبة الزوار الذين يقومون بإجراء مرغوب..."
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={addFaq}
                  className="btn-press flex items-center gap-2 rounded-lg sm:rounded-xl bg-brand px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-card hover:bg-brand-deep"
                >
                  <I n="plus" className="h-4 w-4" />
                  إضافة سؤال
                </button>
              </div>

              {faqs.length > 0 && (
                <div className="space-y-2">
                  {faqs.map((faq, index) => (
                    <div key={faq.id} className="pop flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-line bg-ink-50/50 p-3 sm:p-4">
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand font-mono text-xs sm:text-sm font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xs sm:text-sm font-bold text-ink-800">{faq.question}</p>
                        <p className="mt-1 text-[11px] sm:text-xs text-ink-500 line-clamp-2">{faq.answer}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFaq(faq.id)}
                        className="btn-press shrink-0 rounded-lg p-1.5 sm:p-2 text-ink-400 hover:bg-coral-soft hover:text-coral"
                      >
                        <I n="trash" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* المقارنات */}
          <section className="relative rounded-xl border border-line bg-card p-4 sm:p-5 lg:p-7 shadow-sm">
            <Ticks className="text-ink-200" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <I n="sliders" className="h-5 w-5 text-sea" />
                <h3 className="font-display text-base sm:text-lg font-extrabold text-ink-900">المقارنات</h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-500">أضف مقارنات بين عنصرين مع الفروقات — ستظهر كجداول في المقال</p>
              
              <div className="space-y-3">
                <div>
                  <label className="lbl">عنوان المقارنة</label>
                  <input
                    className="inp !text-xs sm:!text-sm"
                    placeholder="React vs Vue"
                    value={compTitle}
                    onChange={(e) => setCompTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="lbl">العنصر الأول</label>
                    <input
                      className="inp !text-xs sm:!text-sm"
                      placeholder="React"
                      value={compItem1}
                      onChange={(e) => setCompItem1(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="lbl">العنصر الثاني</label>
                    <input
                      className="inp !text-xs sm:!text-sm"
                      placeholder="Vue"
                      value={compItem2}
                      onChange={(e) => setCompItem2(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="lbl">الفروقات</label>
                  <div className="flex gap-2">
                    <input
                      className="inp !text-xs sm:!text-sm flex-1"
                      placeholder="منحنى التعلم"
                      value={compDiffInput}
                      onChange={(e) => setCompDiffInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addDifference();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addDifference}
                      className="btn-press shrink-0 rounded-lg sm:rounded-xl bg-sea px-3 sm:px-4 py-2 text-card hover:bg-sea/90"
                    >
                      <I n="plus" className="h-4 w-4" />
                    </button>
                  </div>
                  {compDifferences.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                      {compDifferences.map((diff, index) => (
                        <span
                          key={index}
                          className="pop flex items-center gap-1 sm:gap-1.5 rounded-full bg-sea-soft px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-sea"
                        >
                          {diff}
                          <button
                            type="button"
                            onClick={() => removeDifference(index)}
                            className="btn-press hover:text-coral"
                          >
                            <I n="x" className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addComparison}
                  className="btn-press flex items-center gap-2 rounded-lg sm:rounded-xl bg-sea px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-card hover:bg-sea/90"
                >
                  <I n="plus" className="h-4 w-4" />
                  إضافة مقارنة
                </button>
              </div>

              {comparisons.length > 0 && (
                <div className="space-y-2">
                  {comparisons.map((comp, index) => (
                    <div key={comp.id} className="pop rounded-lg sm:rounded-xl border border-line bg-ink-50/50 p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-sea-soft text-sea font-mono text-xs sm:text-sm font-bold">
                              {index + 1}
                            </span>
                            <p className="font-display text-xs sm:text-sm font-bold text-ink-800">{comp.title}</p>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                            <span className="rounded-md bg-brand-soft px-2 py-0.5 font-bold text-brand-deep">{comp.item1}</span>
                            <span className="text-ink-400">vs</span>
                            <span className="rounded-md bg-gold-soft px-2 py-0.5 font-bold text-gold-deep">{comp.item2}</span>
                          </div>
                          {comp.differences.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {comp.differences.slice(0, 3).map((diff, i) => (
                                <span key={i} className="rounded-full bg-ink-100 px-2 py-0.5 text-[9px] sm:text-[10px] text-ink-600">
                                  {diff}
                                </span>
                              ))}
                              {comp.differences.length > 3 && (
                                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[9px] sm:text-[10px] text-ink-600">
                                  +{comp.differences.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeComparison(comp.id)}
                          className="btn-press shrink-0 rounded-lg p-1.5 sm:p-2 text-ink-400 hover:bg-coral-soft hover:text-coral"
                        >
                          <I n="trash" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* الجانب */}
        <div className="space-y-4 sm:space-y-5">
          <section className="relative rounded-xl border border-line bg-card p-4 sm:p-5 shadow-sm">
            <Ticks className="text-ink-200" />
            <div className="space-y-4 sm:space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="lbl !mb-0">صورة المقال</span>
                  <ImageHelpButton />
                </div>
                {cover ? (
                  <>
                    <Thumb src={cover} onRemove={() => setCover("")} className="mt-3 h-36" />
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-400">
                      <I n="link" className="h-3 w-3 text-brand" />
                      مخزّنة كرابط مباشر — جاهزة للمزامنة مع فايربيز
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mt-3 flex gap-2">
                      <div className="relative flex-1">
                        <I n="link" className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                        <input
                          dir="ltr"
                          className="inp !ps-10 !text-left"
                          placeholder="https://www.image2url.com/r2/…"
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={setCoverLink}
                        className="btn-press rounded-xl bg-ink-900 px-4 text-xs font-bold text-card hover:bg-ink-700"
                      >
                        تعيين
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-5 text-ink-400">
                      ارفع الصورة على Image2URL ثم الصق الـ Direct Link هنا.
                    </p>
                  </>
                )}
              </div>
              <div>
                <span className="lbl">الكلمات المفتاحية *</span>
                <ChipInput value={keywords} onChange={setKeywords} placeholder="اكتب كلمة ثم Enter" />
                <p className="mt-1.5 text-[11px] leading-5 text-ink-400">
                  تُستخدم لفلترة المقالات داخل الداشبورد — وتُحوَّل تلقائيًا لوسوم جاهزة
                  للموقع الرئيسي.
                </p>
                {toTags(keywords).length > 0 && (
                  <div className="pop mt-2.5 rounded-xl border border-sea/25 bg-sea-soft/45 px-3.5 py-3">
                    <p className="flex items-center gap-1.5 font-mono text-[9px] font-semibold tracking-[0.2em] text-sea">
                      <I n="tag" className="h-3 w-3" />
                      TAGS / ستُزامن في حقل tags
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
                      {toTags(keywords).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-card px-2.5 py-1 font-mono text-[11px] font-bold text-sea shadow-sm"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
              <div className="rounded-xl border border-dashed border-line bg-card px-4 py-3">
                <p className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-display text-[12px] font-bold text-ink-700">
                    <I n="calendar" className="h-3.5 w-3.5 text-brand" />
                    تاريخ النشر
                  </span>
                  <span className="font-mono text-[12px] font-extrabold text-brand-deep">
                    {editing?.publishedAt
                      ? formatDate(editing.publishedAt)
                      : published
                        ? "يُسجَّل لحظة الحفظ"
                        : "—"}
                  </span>
                </p>
                <p className="mt-1.5 text-[10px] leading-5 text-ink-400">
                  يُحفظ في حقل <code dir="ltr" className="font-mono font-bold text-ink-500">publishedAt</code> ويقرأه
                  الموقع الرئيسي ليعرضه مع كل مقال.
                </p>
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
      <div className="rise sticky bottom-3 sm:bottom-4 z-10 flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-ink-700 bg-ink-950/95 p-3 sm:p-4 shadow-2xl backdrop-blur-sm">
        <p className="hidden font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-400 sm:block">
          EDITOR / المحرر
        </p>
        <div className="ms-auto flex flex-1 flex-wrap justify-end gap-2 sm:gap-3 sm:flex-none">
          <button
            type="button"
            onClick={() => go({ name: "articles" })}
            className="btn-press rounded-lg sm:rounded-xl border border-ink-600 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-ink-200 hover:border-ink-400 hover:text-card"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-press flex min-w-[160px] sm:min-w-[180px] items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gold px-5 sm:px-7 py-2.5 sm:py-3 font-display text-xs sm:text-sm font-extrabold text-ink-950 hover:brightness-110 disabled:opacity-60"
          >
            {saving ? (
              <span className="h-3.5 sm:h-4 w-3.5 sm:w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
            ) : (
              <I n="check" className="h-4 sm:h-5 w-4 sm:w-5" />
            )}
            <span className="hidden sm:inline">{editing ? "حفظ التعديلات" : published ? "نشر المقال" : "حفظ كمسودة"}</span>
            <span className="sm:hidden">{editing ? "حفظ" : published ? "نشر" : "مسودة"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
