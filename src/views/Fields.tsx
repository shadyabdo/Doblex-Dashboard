import { useState, type FormEvent } from "react";
import { useStore } from "../store";
import { I, type IconName } from "../icons";
import { Confirm, EmptyState, Overline, Reveal, Ticks } from "../components/ui";
import { formatDate, type Field } from "../types";

const SWATCHES = [
  { color: "#0E6E55", soft: "#D9EAE2", name: "صنوبري" },
  { color: "#E19B10", soft: "#F8ECD0", name: "ذهبي" },
  { color: "#DE5537", soft: "#F8E1D9", name: "مرجاني" },
  { color: "#16708E", soft: "#DAEAF1", name: "بحري" },
  { color: "#7C8B3A", soft: "#E9EDD6", name: "زيتوني" },
  { color: "#54677F", soft: "#E2E8EF", name: "رمادي مزرق" },
];

const FIELD_ICONS: IconName[] = [
  "code", "megaphone", "palette", "film", "camera", "globe", "chart", "spark", "pen", "briefcase",
];

interface FormState {
  name: string;
  desc: string;
  icon: string;
  color: string;
  soft: string;
}

const emptyForm: FormState = {
  name: "",
  desc: "",
  icon: "code",
  color: SWATCHES[0].color,
  soft: SWATCHES[0].soft,
};

export default function Fields() {
  const { db, addField, updateField, deleteField, toast } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [delTarget, setDelTarget] = useState<Field | null>(null);

  const projectCount = (id: string) => db.projects.filter((p) => p.fieldId === id).length;

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const startEdit = (f: Field) => {
    setForm({ name: f.name, desc: f.desc, icon: f.icon, color: f.color, soft: f.soft });
    setEditingId(f.id);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("اكتب اسم المجال أولًا", "error");
      return;
    }
    if (editingId) {
      updateField(editingId, { ...form, name: form.name.trim() });
      toast("تم تحديث المجال بنجاح");
    } else {
      addField({ ...form, name: form.name.trim() });
      toast(`تمت إضافة مجال «${form.name.trim()}»`);
    }
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <Overline>02 / إدارة المجالات</Overline>
          <p className="mt-2 text-sm leading-7 text-ink-500">
            المجالات هي خطوط عمل الفريق. أضف مجالًا جديدًا، واختر له أيقونة ولونًا يميّزه في
            كل أنحاء الداشبورد.
          </p>
        </div>
        <button
          onClick={() => (formOpen ? setFormOpen(false) : openNew())}
          className="btn-press flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-display text-sm font-bold text-card hover:bg-brand-deep"
        >
          <I n={formOpen ? "x" : "plus"} className="h-4 w-4" />
          {formOpen ? "إغلاق النموذج" : "إضافة مجال"}
        </button>
      </div>

      {formOpen && (
        <Reveal>
          <form onSubmit={submit} className="relative rounded-xl border border-line bg-card p-5 shadow-sm sm:p-7">
            <Ticks className="text-ink-200" />
            <div className="grid gap-7 lg:grid-cols-[1fr_280px]">
              <div className="space-y-5">
                <h3 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft font-mono text-[13px] font-bold text-brand">
                    {editingId ? "E" : "+"}
                  </span>
                  {editingId ? "تعديل المجال" : "مجال جديد"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="lbl" htmlFor="f-name">اسم المجال *</label>
                    <input
                      id="f-name"
                      className="inp"
                      placeholder="مثال: تطوير تطبيقات الموبايل"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="lbl" htmlFor="f-desc">وصف مختصر</label>
                    <input
                      id="f-desc"
                      className="inp"
                      placeholder="ماذا يقدّم الفريق هنا؟"
                      value={form.desc}
                      onChange={(e) => setForm({ ...form, desc: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <span className="lbl">الأيقونة</span>
                  <div className="flex flex-wrap gap-2">
                    {FIELD_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setForm({ ...form, icon: ic })}
                        aria-label={ic}
                        className={`btn-press rounded-lg border p-2.5 transition-all ${
                          form.icon === ic
                            ? "border-brand bg-brand-soft text-brand scale-105"
                            : "border-ink-100 text-ink-400 hover:border-ink-300 hover:text-ink-600"
                        }`}
                      >
                        <I n={ic} className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="lbl">اللون المميز</span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {SWATCHES.map((s) => (
                      <button
                        key={s.color}
                        type="button"
                        title={s.name}
                        aria-label={s.name}
                        onClick={() => setForm({ ...form, color: s.color, soft: s.soft })}
                        className={`btn-press flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                          form.color === s.color ? "ring-2 ring-ink-500 ring-offset-2 ring-offset-card" : ""
                        }`}
                        style={{ background: s.color }}
                      >
                        {form.color === s.color && <I n="check" className="h-4 w-4 text-card" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="submit"
                    className="btn-press flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 font-display text-sm font-extrabold text-ink-950 hover:brightness-105"
                  >
                    <I n="check" className="h-4 w-4" />
                    {editingId ? "حفظ التعديلات" : "إضافة المجال"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormOpen(false);
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                    className="btn-press rounded-xl border border-ink-200 px-6 py-2.5 text-sm font-semibold text-ink-500 hover:bg-ink-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>

              {/* معاينة حية */}
              <div className="hidden lg:block">
                <span className="lbl">معاينة حية</span>
                <div
                  className="rounded-xl border border-line bg-paper p-5 transition-all duration-300"
                  style={{ borderInlineStart: `4px solid ${form.color}` }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300"
                    style={{ background: form.soft, color: form.color }}
                  >
                    <I n={form.icon as IconName} className="h-6 w-6" />
                  </span>
                  <h4 className="mt-3 font-display text-base font-extrabold text-ink-900">
                    {form.name.trim() || "اسم المجال"}
                  </h4>
                  <p className="mt-1 text-[12px] leading-6 text-ink-400">
                    {form.desc.trim() || "الوصف سيظهر هنا…"}
                  </p>
                  <span
                    className="mt-4 inline-block rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{ background: form.soft, color: form.color }}
                  >
                    0 مشاريع
                  </span>
                </div>
              </div>
            </div>
          </form>
        </Reveal>
      )}

      {db.fields.length === 0 ? (
        <EmptyState
          icon="layers"
          title="لا توجد مجالات بعد"
          desc="ابدأ بإضافة المجالات التي يعمل فيها الفريق: تطوير الويب، التسويق الرقمي، التصميم…"
        >
          <button
            onClick={openNew}
            className="btn-press flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-display text-sm font-bold text-card hover:bg-brand-deep"
          >
            <I n="plus" className="h-4 w-4" />
            إضافة أول مجال
          </button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {db.fields.map((f, i) => (
            <Reveal key={f.id} delay={(i % 3) * 90}>
              <div
                className="group relative h-full rounded-xl border border-line bg-card p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_-20px_rgba(11,36,28,0.3)]"
                style={{ borderInlineStart: `4px solid ${f.color}` }}
              >
                <Ticks className="text-ink-200 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-start">
                  <span
                    className="flex h-13 w-13 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                    style={{ background: f.soft, color: f.color, width: 52, height: 52 }}
                  >
                    <I n={f.icon as IconName} className="h-6 w-6" />
                  </span>
                  <span className="ms-auto flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={() => startEdit(f)}
                      aria-label={`تعديل ${f.name}`}
                      className="btn-press rounded-lg p-2 text-ink-300 hover:bg-ink-50 hover:text-brand"
                    >
                      <I n="edit" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDelTarget(f)}
                      aria-label={`حذف ${f.name}`}
                      className="btn-press rounded-lg p-2 text-ink-300 hover:bg-coral-soft hover:text-coral"
                    >
                      <I n="trash" className="h-4 w-4" />
                    </button>
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-extrabold text-ink-900">{f.name}</h3>
                <p className="mt-1.5 min-h-[3.5rem] text-sm leading-6 text-ink-500">{f.desc || "بدون وصف"}</p>
                <div className="mt-4 flex items-center justify-between border-t border-dashed border-line pt-3.5">
                  <span className="rounded-full px-3 py-1 font-mono text-[11px] font-bold" style={{ background: f.soft, color: f.color }}>
                    {projectCount(f.id)} مشاريع
                  </span>
                  <span className="font-mono text-[10px] font-semibold text-ink-300">{formatDate(f.createdAt)}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <Confirm
        open={!!delTarget}
        title={`حذف مجال «${delTarget?.name ?? ""}»؟`}
        desc="سيُحذف المجال من القائمة. المشاريع المرتبطة به ستبقى محتفظة باسمه، لكن لن يمكن إسناد مشاريع جديدة إليه."
        onCancel={() => setDelTarget(null)}
        onConfirm={() => {
          if (delTarget) {
            deleteField(delTarget.id);
            toast("تم حذف المجال", "info");
          }
          setDelTarget(null);
        }}
      />
    </div>
  );
}
