import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useStore } from "../store";
import { I, type IconName } from "../icons";
import { Overline, Thumb, Ticks } from "../components/ui";
import { IMAGE_HOST_URL, ImageHelpButton } from "../imageHelp";
import {
  isVideoField,
  normalizeEmbedUrl,
  type Achievement,
  type Goal,
  type ProjectImage,
  type ProjectLink,
  type ProjectStatus,
  type View,
} from "../types";

const gid = () => Math.random().toString(36).slice(2, 10);

const STATUS_OPTIONS: { key: ProjectStatus; label: string }[] = [
  { key: "planning", label: "قيد التخطيط" },
  { key: "active", label: "جاري التنفيذ" },
  { key: "done", label: "مكتمل" },
];

function Step({
  num,
  title,
  desc,
  children,
}: {
  num: string;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <section className="relative rounded-xl border border-line bg-card p-4 sm:p-5 lg:p-7 shadow-sm">
      <Ticks className="text-ink-200" />
      <div className="mb-4 sm:mb-5 flex items-center gap-3 sm:gap-4">
        <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-ink-950 font-mono text-sm sm:text-[15px] font-bold text-gold">
          {num}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base sm:text-lg font-extrabold text-ink-900">{title}</h3>
          <p className="text-[11px] sm:text-[12px] text-ink-400">{desc}</p>
        </div>
        <span className="hidden h-px flex-1 bg-gradient-to-l from-line to-transparent sm:block" />
      </div>
      {children}
    </section>
  );
}

export default function ProjectForm({ id, go }: { id?: string; go: (v: View) => void }) {
  const { db, addProject, updateProject, toast } = useStore();
  const editing = id ? db.projects.find((p) => p.id === id) : undefined;

  const [fieldId, setFieldId] = useState(editing?.fieldId ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [subtitle, setSubtitle] = useState(editing?.subtitle ?? "");
  const [client, setClient] = useState(editing?.client ?? "");
  const [year, setYear] = useState(editing?.year ?? "2026");
  const [status, setStatus] = useState<ProjectStatus>(editing?.status ?? "active");
  const [cover, setCover] = useState(editing?.cover ?? "");
  const [coverUrl, setCoverUrl] = useState("");
  const [images, setImages] = useState<ProjectImage[]>(editing?.images ?? []);
  const [videoUrl, setVideoUrl] = useState(editing?.videoUrl ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [details, setDetails] = useState(editing?.details ?? "");
  const [goals, setGoals] = useState<Goal[]>(editing?.goals ?? []);
  const [achievements, setAchievements] = useState<Achievement[]>(editing?.achievements ?? []);
  const [goalText, setGoalText] = useState("");
  const [achMetric, setAchMetric] = useState("");
  const [achText, setAchText] = useState("");
  const [links, setLinks] = useState<ProjectLink[]>(editing?.links ?? []);
  const [linkType, setLinkType] = useState<ProjectLink["type"]>("demo");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [galleryUrl, setGalleryUrl] = useState("");

  const validUrl = (s: string) => /^https?:\/\/.+/i.test(s);

  /* المجال المحدد وهل يحتوي فيديوهات → يظهر قسم رابط الفيديو */
  const selectedField = db.fields.find((f) => f.id === fieldId);
  const videoDomain = isVideoField(selectedField);
  const embedPreview = videoUrl.trim() ? normalizeEmbedUrl(videoUrl) : null;
  const videoInvalid = videoUrl.trim().length > 0 && embedPreview === null;

  const setCoverLink = () => {
    const v = coverUrl.trim();
    if (!v) {
      toast("الصق رابط الصورة أولًا — من Image2URL", "error");
      return;
    }
    if (!validUrl(v)) {
      toast("الرابط غير صالح — يجب أن يبدأ بـ https:// (انسخ الـ Direct Link من Image2URL)", "error");
      return;
    }
    setCover(v);
    setCoverUrl("");
    toast("تم تعيين صورة الغلاف كرابط مباشر");
  };

  const addGalleryLink = () => {
    const v = galleryUrl.trim();
    if (!v) {
      toast("الصق رابط الصورة أولًا — من Image2URL", "error");
      return;
    }
    if (!validUrl(v)) {
      toast("الرابط غير صالح — يجب أن يبدأ بـ https:// (انسخ الـ Direct Link من Image2URL)", "error");
      return;
    }
    setImages((prev) => [...prev, { id: gid(), src: v }]);
    setGalleryUrl("");
    toast("تمت إضافة الصورة للمعرض كرابط مباشر");
  };

  const addGoal = () => {
    const t = goalText.trim();
    if (!t) return;
    setGoals((g) => [...g, { id: gid(), text: t, done: false }]);
    setGoalText("");
  };

  const goalKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addGoal();
    }
  };

  const addAchievement = () => {
    const t = achText.trim();
    if (!t) return;
    setAchievements((a) => [...a, { id: gid(), metric: achMetric.trim() || "✓", text: t }]);
    setAchMetric("");
    setAchText("");
  };

  const achKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAchievement();
    }
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!fieldId) {
      toast("اختر مجال المشروع أولًا — الخطوة 01", "error");
      return;
    }
    if (!title.trim()) {
      toast("اكتب اسم المشروع — الخطوة 02", "error");
      return;
    }
    setSaving(true);
    const f = db.fields.find((x) => x.id === fieldId);
    const payload = {
      fieldId,
      fieldLabel: f?.name ?? "غير مصنف",
      title: title.trim(),
      subtitle: subtitle.trim(),
      client: client.trim(),
      year,
      status,
      cover,
      images,
      /* يُحفظ رابط الـ embed الموحّد — يقرأه الموقع ويعرضه في iframe */
      videoUrl: videoDomain && embedPreview ? embedPreview : "",
      description: description.trim(),
      details: details.trim(),
      goals,
      achievements,
      links,
    };
    window.setTimeout(() => {
      if (editing) {
        updateProject(editing.id, payload);
        toast("تم حفظ تعديلات المشروع");
      } else {
        addProject(payload);
        toast(`تمت إضافة مشروع «${payload.title}»`);
      }
      go({ name: "projects" });
    }, 350);
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="rise">
        <Overline>{editing ? "03 / تعديل مشروع" : "03 / مشروع جديد"}</Overline>
        <h2 className="mt-2 overflow-hidden font-display text-xl sm:text-2xl lg:text-[32px] font-extrabold text-ink-900 sm:leading-tight">
          <span className="line-mask">
            {editing ? `تعديل «${editing.title}»` : "وثّق مشروعًا جديدًا للفريق"}
          </span>
        </h2>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-6 sm:leading-7 text-ink-500">
          {videoDomain
            ? "ست خطوات: المجال ← البيانات ← الصور ← الفيديو ← التفاصيل ← الأهداف والإنجازات. كل ما تحفظه"
            : "خمس خطوات: المجال ← البيانات ← الصور ← التفاصيل ← الأهداف والإنجازات. كل ما تحفظه"}
          يظهر فورًا في لوحة الفريق{db.fields.length > 0 ? "" : " بعد إضافة المجالات"}.
        </p>
      </div>

      {/* 01 المجال */}
      <Step num="01" title="اختر المجال" desc="أي خط من خطوط عمل الفريق يتبعه هذا المشروع؟">
        {db.fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-5 py-9 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-card text-ink-400 shadow-sm">
              <I n="layers" className="h-6 w-6" />
            </span>
            <p className="mt-3 font-display text-sm font-extrabold text-ink-700">لا توجد مجالات بعد — أضف مجالًا أولًا</p>
            <p className="mt-1 text-xs text-ink-400">مثل: تطوير الويب، التسويق الرقمي، تصميم الجرافيك…</p>
            <button
              type="button"
              onClick={() => go({ name: "fields" })}
              className="btn-press mx-auto mt-4 flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-card hover:bg-brand-deep"
            >
              <I n="layers" className="h-4 w-4" />
              الذهاب إلى المجالات
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {db.fields.map((f) => {
              const sel = fieldId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFieldId(f.id)}
                  className={`btn-press relative rounded-xl border-2 p-4 text-start transition-all duration-200 ${
                    sel ? "border-brand bg-brand-soft/40 shadow-sm" : "border-line bg-card hover:-translate-y-0.5 hover:border-ink-300"
                  }`}
                >
                  <span
                    className={`absolute top-3 end-3 flex h-5 w-5 items-center justify-center rounded-full transition-all ${
                      sel ? "bg-brand text-card scale-100" : "border-2 border-ink-200 text-transparent scale-90"
                    }`}
                  >
                    <I n="check" className="h-3 w-3" />
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: f.soft, color: f.color }}>
                    <I n={f.icon as IconName} className="h-5 w-5" />
                  </span>
                  <span className="mt-3 flex items-center gap-1.5 font-display text-sm font-extrabold text-ink-900">
                    {f.name}
                    {isVideoField(f) && (
                      <span className="flex items-center gap-0.5 rounded-full bg-coral-soft px-1.5 py-0.5 text-[9px] font-bold text-coral">
                        <I n="play" className="h-2.5 w-2.5" />
                        فيديو
                      </span>
                    )}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[11px] leading-5 text-ink-400">{f.desc}</span>
                </button>
              );
            })}
          </div>
        )}
      </Step>

      {/* 02 البيانات */}
      <Step num="02" title="البيانات الأساسية" desc="اسم المشروع وعميله وحالته الحالية">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="lbl" htmlFor="p-title">اسم المشروع *</label>
            <input id="p-title" className="inp font-display !font-bold !text-sm sm:!text-base" placeholder="مثال: منصة نوفا ستور" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor="p-sub">وصف في سطر واحد</label>
            <input id="p-sub" className="inp" placeholder="مثال: متجر إلكتروني متكامل" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor="p-client">العميل</label>
            <input id="p-client" className="inp" placeholder="اسم العميل أو الجهة" value={client} onChange={(e) => setClient(e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor="p-year">السنة</label>
            <input id="p-year" className="inp font-mono" inputMode="numeric" placeholder="2026" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div>
            <span className="lbl">حالة المشروع</span>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key)}
                  className={`btn-press rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 ${
                    status === s.key
                      ? "border-ink-900 bg-ink-900 text-card shadow-md"
                      : "border-ink-200 bg-card text-ink-500 hover:border-ink-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Step>

      {/* 03 الصور */}
      <Step num="03" title="الغلاف ومعرض الصور" desc="أضف الصور كروابط مباشرة من Image2URL">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-gold/50 bg-gold-soft/35 px-4 py-3">
          <p className="flex items-center gap-2 text-[12px] font-bold leading-6 text-ink-600">
            <I n="link" className="h-4 w-4 shrink-0 text-gold-deep" />
            الصور تُضاف بروابط مباشرة فقط — ارفعها على Image2URL والصق الـ Direct Link هنا.
          </p>
          <div className="flex items-center gap-2">
            <a
              href={IMAGE_HOST_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-press rounded-lg bg-ink-900 px-3 py-1.5 text-[11px] font-bold text-card hover:bg-ink-700"
            >
              فتح Image2URL ↗
            </a>
            <ImageHelpButton />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <span className="lbl">رابط صورة الغلاف</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <I n="link" className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  dir="ltr"
                  className="inp !ps-10 !text-left"
                  placeholder="https://www.image2url.com/r2/default/images/…"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={setCoverLink}
                className="btn-press rounded-xl bg-ink-900 px-5 text-xs font-bold text-card hover:bg-ink-700"
              >
                تعيين
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-ink-400">
              انسخ الـ Direct Link من Image2URL بعد الرفع ثم الصقه هنا.
            </p>
          </div>
          <div>
            <span className="lbl">معاينة الغلاف</span>
            {cover ? (
              <Thumb src={cover} onRemove={() => setCover("")} className="h-44" />
            ) : (
              <div className="flex h-44 items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/40 text-ink-300">
                <span className="flex flex-col items-center gap-2 text-xs font-semibold">
                  <I n="image" className="h-7 w-7" />
                  لم تُضف صورة غلاف بعد
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <span className="lbl">معرض صور المشروع ({images.length})</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <I n="link" className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                dir="ltr"
                className="inp !ps-10 !text-left"
                placeholder="https://www.image2url.com/r2/default/images/…"
                value={galleryUrl}
                onChange={(e) => setGalleryUrl(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={addGalleryLink}
              className="btn-press flex items-center gap-1.5 rounded-xl bg-brand px-5 text-xs font-bold text-card hover:bg-brand-deep"
            >
              <I n="plus" className="h-3.5 w-3.5" />
              إضافة للمعرض
            </button>
          </div>
          {images.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {images.map((im) => (
                <Thumb key={im.id} src={im.src} onRemove={() => setImages((prev) => prev.filter((x) => x.id !== im.id))} />
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-5 text-center text-[12px] font-semibold text-ink-400">
              أضف أول صورة للصق رابطها — كل صورة تظهر هنا مع زر لنسخ رابطها.
            </p>
          )}
        </div>
      </Step>

      {/* قسم الفيديو — يظهر فقط للمجالات الفيديوية */}
      {videoDomain && (
        <Step num="04" title="فيديو المشروع" desc="الصق رابط الفيديو وسيُضمَّن كمشغّل داخل المشروع">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label className="lbl" htmlFor="p-video">رابط الفيديو (iframe)</label>
              <div className="relative">
                <I n="play" className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  id="p-video"
                  dir="ltr"
                  className="inp !ps-10 !text-left !font-mono !text-[12px]"
                  placeholder="https://www.youtube.com/watch?v=…  أو رابط embed من أي منصة"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-6 text-ink-400">
                <I n="bulb" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep" />
                يوتيوب (watch أو youtu.be أو shorts) وفيميو وجوجل درايف تتحول تلقائيًا لرابط
                embed — وأي منصة أخرى الصق رابط الـ embed الخاص بها مباشرة.
              </p>
              {videoInvalid && (
                <p className="pop mt-2 flex items-center gap-1.5 rounded-lg border border-coral/35 bg-coral-soft/50 px-3 py-2 text-[11px] font-bold text-coral">
                  <I n="x" className="h-3.5 w-3.5 shrink-0" />
                  الرابط غير صالح — يجب أن يبدأ بـ https://
                </p>
              )}
              {embedPreview && !videoInvalid && (
                <p className="pop mt-2 flex items-center gap-1.5 text-[11px] font-bold text-brand-deep">
                  <I n="check" className="h-3.5 w-3.5 shrink-0" />
                  تم التعرف على الرابط — المعاينة الحية بجوار
                </p>
              )}
            </div>
            <div>
              <span className="lbl">معاينة حية</span>
              {embedPreview ? (
                <div className="pop relative aspect-video overflow-hidden rounded-xl border border-line bg-ink-950 shadow-[0_16px_36px_-18px_rgba(11,36,28,0.4)]">
                  <iframe
                    key={embedPreview}
                    src={embedPreview}
                    title="معاينة فيديو المشروع"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/40 text-ink-300">
                  <I n="film" className="h-8 w-8" />
                  <span className="text-[12px] font-bold">الصق رابطًا صالحًا ليظهر الفيديو هنا فورًا</span>
                </div>
              )}
            </div>
          </div>
        </Step>
      )}

      {/* التفاصيل */}
      <Step num={videoDomain ? "05" : "04"} title="الوصف والتفاصيل" desc="ماذا فعلنا؟ وكيف نفّذنا؟">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="lbl" htmlFor="p-desc">وصف المشروع</label>
            <textarea id="p-desc" className="inp" rows={5} placeholder="ملخص شامل للمشروع ودوره…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor="p-details">تفاصيل التنفيذ</label>
            <textarea id="p-details" className="inp" rows={5} placeholder="التقنيات، المنهجية، التحديات وكيف حُلّت…" value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
        </div>
      </Step>

      {/* الأهداف والإنجازات */}
      <Step num={videoDomain ? "06" : "05"} title="الأهداف والإنجازات" desc="ما خططنا له، وما تحقق فعلًا بالأرقام">
        <div className="grid gap-7 lg:grid-cols-2">
          <div>
            <span className="lbl">الأهداف ({goals.length})</span>
            <div className="flex gap-2">
              <input className="inp" placeholder="اكتب هدفًا واضغط Enter" value={goalText} onChange={(e) => setGoalText(e.target.value)} onKeyDown={goalKey} />
              <button type="button" onClick={addGoal} aria-label="إضافة هدف" className="btn-press shrink-0 rounded-xl bg-brand px-4 text-card hover:bg-brand-deep">
                <I n="plus" className="h-4 w-4" />
              </button>
            </div>
            {goals.length > 0 && (
              <ul className="mt-3 space-y-2">
                {goals.map((g) => (
                  <li key={g.id} className="pop flex items-center gap-2.5 rounded-lg border border-line bg-card px-3 py-2">
                    <I n="target" className="h-4 w-4 shrink-0 text-brand" />
                    <span className="flex-1 text-sm font-semibold text-ink-700">{g.text}</span>
                    <button type="button" onClick={() => setGoals((prev) => prev.filter((x) => x.id !== g.id))} aria-label="حذف الهدف" className="btn-press text-ink-300 hover:text-coral">
                      <I n="trash" className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <span className="lbl">الإنجازات المحققة ({achievements.length})</span>
            <div className="flex gap-2">
              <input className="inp !w-24 shrink-0 text-center font-mono font-bold" placeholder="+38%" value={achMetric} onChange={(e) => setAchMetric(e.target.value)} aria-label="الرقم المميز للإنجاز" />
              <input className="inp" placeholder="وصف الإنجاز ثم Enter" value={achText} onChange={(e) => setAchText(e.target.value)} onKeyDown={achKey} />
              <button type="button" onClick={addAchievement} aria-label="إضافة إنجاز" className="btn-press shrink-0 rounded-xl bg-gold px-4 text-ink-950 hover:brightness-105">
                <I n="plus" className="h-4 w-4" />
              </button>
            </div>
            {achievements.length > 0 && (
              <ul className="mt-3 space-y-2">
                {achievements.map((a) => (
                  <li key={a.id} className="pop flex items-center gap-2.5 rounded-lg border border-gold/30 bg-gold-soft/35 px-3 py-2">
                    <I n="trophy" className="h-4 w-4 shrink-0 text-gold-deep" />
                    <span className="w-14 shrink-0 font-mono text-sm font-bold text-ink-900">{a.metric}</span>
                    <span className="flex-1 truncate text-sm text-ink-600">{a.text}</span>
                    <button type="button" onClick={() => setAchievements((prev) => prev.filter((x) => x.id !== a.id))} aria-label="حذف الإنجاز" className="btn-press text-ink-300 hover:text-coral">
                      <I n="trash" className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Step>

      {/* الروابط والملحقات */}
      <Step num={videoDomain ? "07" : "06"} title="الروابط والملحقات" desc="ديمو، كود، تصميم، وأي روابط متعلقة بالمشروع">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[180px_1fr_1fr_auto]">
            <select
              className="inp"
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as ProjectLink["type"])}
              aria-label="نوع الرابط"
            >
              <option value="demo">🌐 ديمو / Demo</option>
              <option value="github">💻 كود / GitHub</option>
              <option value="figma">🎨 تصميم / Figma</option>
              <option value="other">🔗 رابط آخر</option>
            </select>
            <input
              className="inp"
              placeholder="الاسم (مثال: الموقع الرسمي)"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
            />
            <input
              dir="ltr"
              className="inp !text-left"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (!linkUrl.trim()) {
                  toast("الصق رابط الرابط أولًا", "error");
                  return;
                }
                if (!validUrl(linkUrl)) {
                  toast("الرابط غير صالح — يجب أن يبدأ بـ https://", "error");
                  return;
                }
                setLinks([
                  ...links,
                  {
                    id: gid(),
                    type: linkType,
                    label: linkLabel.trim() || linkType,
                    url: linkUrl.trim(),
                  },
                ]);
                setLinkLabel("");
                setLinkUrl("");
                toast("تمت إضافة الرابط");
              }}
              className="btn-press flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-bold text-card hover:bg-brand-deep"
            >
              <I n="plus" className="h-4 w-4" />
              إضافة
            </button>
          </div>

          {links.length > 0 ? (
            <ul className="space-y-2">
              {links.map((l) => {
                const iconMap: Record<ProjectLink["type"], IconName> = {
                  demo: "demo",
                  github: "github",
                  figma: "figma",
                  other: "link",
                };
                const colorMap: Record<ProjectLink["type"], string> = {
                  demo: "bg-brand-soft text-brand",
                  github: "bg-ink-50 text-ink-700",
                  figma: "bg-coral-soft text-coral",
                  other: "bg-gold-soft text-gold-deep",
                };
                return (
                  <li
                    key={l.id}
                    className="pop flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 transition-all duration-200 hover:border-brand/40 hover:shadow-sm"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorMap[l.type]}`}>
                      <I n={iconMap[l.type]} className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[13px] font-bold text-ink-800">{l.label}</p>
                      <p dir="ltr" className="truncate text-[11px] text-ink-400">{l.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLinks(links.filter((x) => x.id !== l.id))}
                      aria-label="حذف الرابط"
                      className="btn-press rounded-lg p-2 text-ink-300 transition-colors hover:bg-coral-soft hover:text-coral"
                    >
                      <I n="trash" className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-5 text-center text-[12px] font-semibold text-ink-400">
              لم تُضف روابط بعد — أضف رابط الديمو أو الكود أو التصميم
            </p>
          )}
        </div>
      </Step>

      {/* شريط الحفظ */}
      <div className="rise sticky bottom-3 sm:bottom-4 z-10 flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-ink-700 bg-ink-950/95 p-3 sm:p-4 shadow-2xl backdrop-blur-sm">
        <p className="hidden font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-400 sm:block">
          READY / جاهز للحفظ
        </p>
        <div className="ms-auto flex flex-1 flex-wrap justify-end gap-2 sm:gap-3 sm:flex-none">
          <button
            type="button"
            onClick={() => go({ name: "projects" })}
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
            <span className="hidden sm:inline">{editing ? "حفظ التعديلات" : "إضافة المشروع"}</span>
            <span className="sm:hidden">{editing ? "حفظ" : "إضافة"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
