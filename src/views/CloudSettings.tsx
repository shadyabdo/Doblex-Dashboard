import { useState, useRef, useEffect } from "react";
import { useStore } from "../store";
import { I } from "../icons";
import { Overline, Reveal, Ticks } from "../components/ui";
import {
  DEFAULT_CONFIG,
  DOC_PATH,
  getEffectiveConfig,
  isAutoConnectDisabled,
  isValidConfig,
  loadStoredConfig,
  runDiagnostics,
  testConnection,
  type DiagStep,
  type FirebaseConfig,
} from "../firebase";
import type { View } from "../types";

const CONSOLE_LINKS = [
  {
    label: "قواعد الأمان",
    url: "https://console.firebase.google.com/project/dublex-26/firestore/rules",
  },
  {
    label: "قاعدة Firestore",
    url: "https://console.firebase.google.com/project/dublex-26/firestore",
  },
  {
    label: "الدخول المجهول",
    url: "https://console.firebase.google.com/project/dublex-26/authentication/providers",
  },
];

const RULES_SAMPLE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dashboards/{dashboardId} {
      allow read, write: if true;
    }
  }
}`;

const RULES_LOCKED = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dashboards/{dashboardId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

export default function CloudSettings({ go }: { go: (v: View) => void }) {
  const { sync, connectFirebase, disconnectFirebase, resetAllData, clearAllData, exportData, importData, toast } = useStore();
  const [raw, setRaw] = useState(() => {
    const c = loadStoredConfig();
    return JSON.stringify(c ?? DEFAULT_CONFIG, null, 2);
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagSteps, setDiagSteps] = useState<DiagStep[] | null>(null);

  const activate = async () => {
    setErr("");
    let cfg: unknown;
    try {
      cfg = JSON.parse(raw);
    } catch {
      setErr("الصيغة ليست JSON صحيحة.");
      return;
    }
    if (!isValidConfig(cfg)) {
      setErr("تأكد من وجود apiKey و authDomain و projectId في الإعدادات.");
      return;
    }
    setBusy(true);
    const t = await testConnection(cfg as FirebaseConfig);
    setBusy(false);
    if (!t.ok) {
      setErr(t.error);
      return;
    }
    connectFirebase(cfg as FirebaseConfig);
    toast("تم الاتصال بفايربيز بنجاح");
  };

  const diagnose = async () => {
    setErr("");
    let cfg: unknown;
    try {
      cfg = JSON.parse(raw);
    } catch {
      setErr("الصيغة ليست JSON صحيحة.");
      return;
    }
    if (!isValidConfig(cfg)) {
      setErr("تأكد من وجود apiKey و authDomain و projectId في الإعدادات.");
      return;
    }
    setDiagnosing(true);
    setDiagSteps(null);
    const steps = await runDiagnostics(cfg as FirebaseConfig);
    setDiagSteps(steps);
    setDiagnosing(false);
    const failed = steps.filter((s) => !s.ok);
    if (failed.length === 0) toast("كل خطوات الاتصال سليمة ✔");
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("تم النسخ إلى الحافظة");
    } catch {
      toast("تعذّر النسخ تلقائيًا", "error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-ink-950 p-6 sm:p-8">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 50%, #0E6E5540 0%, transparent 50%),
                  radial-gradient(circle at 80% 50%, #E19B1040 0%, transparent 50%)
                `,
              }}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => go({ name: "overview" })}
              className="btn-press mb-4 flex items-center gap-2 rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-300 hover:border-ink-500 hover:text-card"
            >
              <I n="arrow" className="h-4 w-4 rotate-180" />
              العودة للنظرة العامة
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-card">
                <I n="cloud" className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-3xl font-extrabold text-card">
                  إعدادات فايربيز
                </h1>
                <p className="text-ink-300">إعدادات المزامنة مع قاعدة البيانات</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-ink-900/70 px-4 py-3">
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
              <span className="text-sm font-bold text-ink-100">
                {sync.mode === "cloud"
                  ? `متصل — مشروع ${sync.projectId ?? ""}${sync.lastSync ? ` · آخر مزامنة ${new Date(sync.lastSync).toLocaleTimeString("ar-EG")}` : ""}`
                  : sync.mode === "connecting"
                    ? "جارِ الاتصال…"
                    : sync.mode === "error"
                      ? `خطأ: ${sync.error ?? "راجع الإعدادات"}`
                      : "غير متصل"}
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Console Links */}
      <Reveal delay={100}>
        <div className="rounded-xl border border-line bg-card p-6">
          <Overline>روابط مباشرة للكونسول</Overline>
          <div className="mt-4 flex flex-wrap gap-2">
            {CONSOLE_LINKS.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="btn-press flex items-center gap-1.5 rounded-full border border-ink-200 bg-card px-4 py-2 text-sm font-bold text-ink-600 transition-colors hover:border-brand hover:text-brand"
              >
                <I n="link" className="h-4 w-4" />
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Warning */}
      <Reveal delay={150}>
        <div className="overflow-hidden rounded-xl border-2 border-coral/40 shadow-sm">
          <div
            className="h-2.5 w-full"
            style={{
              background:
                "repeating-linear-gradient(-45deg, var(--color-coral) 0 14px, var(--color-gold) 14px 28px)",
            }}
          />
          <div className="flex items-start gap-3 bg-coral-soft/50 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral text-card">
              <I n="alert" className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-display text-sm font-extrabold text-coral">
                تحذير: العبث بأكواد ربط فايربيز يتلف الداشبورد
              </p>
              <p className="mt-1 text-xs font-semibold text-ink-600">
                هذه الأكواد هي شريان الاتصال بين الداشبورد وقاعدة البيانات. أي تعديل أو نسخ أو مشاركة لها قد يقطع المزامنة نهائيًا.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Firebase Config */}
      <Reveal delay={200}>
        <div className="rounded-xl border border-line bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Overline>أكواد ربط Firebase</Overline>
            <span className="flex items-center gap-1.5 rounded-full bg-coral-soft px-3 py-1 text-xs font-extrabold text-coral">
              <I n="lock" className="h-3.5 w-3.5" />
              محمية
            </span>
          </div>

          <div
            className="relative overflow-hidden rounded-xl border-2 border-coral"
            onCopy={(e) => {
              e.preventDefault();
              toast("⛔ نسخ ممنوع — أكواد ربط فايربيز محمية", "error");
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              toast("⛔ قائمة النسخ معطلة هنا — الأكواد محمية", "error");
            }}
          >
            <textarea
              dir="ltr"
              readOnly
              spellCheck={false}
              className="w-full min-h-[150px] rounded-none border-0 bg-ink-50 p-4 font-mono text-xs leading-6 text-ink-700 pointer-events-none select-none blur-[2px]"
              value={raw}
            />
            <div
              className="absolute inset-0 z-10 flex cursor-not-allowed flex-col items-center justify-center gap-2 text-center"
              style={{
                background:
                  "repeating-linear-gradient(45deg, rgba(222,85,55,0.09) 0 16px, rgba(222,85,55,0.18) 16px 32px), rgba(222,85,55,0.08)",
              }}
              onClick={() => toast("⛔ ممنوع النسخ — هذه الأكواد محمية بقفل", "error")}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-coral p-4 text-card shadow-lg">
                <I n="lock" className="h-8 w-8" />
              </span>
              <p className="font-display text-lg font-extrabold text-coral">
                ممنوع النسخ
              </p>
              <p className="max-w-xs text-xs font-bold text-ink-700">
                أكواد ربط فايربيز مقفولة ومحمية
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Error */}
      {err && (
        <Reveal delay={250}>
          <div className="rounded-xl border border-coral/30 bg-coral-soft/50 p-4">
            <div className="flex items-start gap-2">
              <I n="x" className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
              <p className="text-sm font-bold text-coral">{err}</p>
            </div>
          </div>
        </Reveal>
      )}

      {/* Diagnostics */}
      <Reveal delay={300}>
        <div className="rounded-xl border border-line bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <Overline>تشخيص الاتصال</Overline>
              <p className="mt-2 text-xs text-ink-400">
                الفحص يفحص 4 خطوات ويحدد بالضبط أين تتعطل.
              </p>
            </div>
            <button
              onClick={() => void diagnose()}
              disabled={diagnosing}
              className="btn-press flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-card hover:bg-ink-700 disabled:opacity-60"
            >
              {diagnosing ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-card/40 border-t-card" />
                  جارِ الفحص…
                </>
              ) : (
                <>
                  <I n="target" className="h-4 w-4" />
                  تشخيص الاتصال
                </>
              )}
            </button>
          </div>

          {diagSteps && (
            <ol className="mt-4 space-y-2 border-t border-dashed border-line pt-4">
              {diagSteps.map((s, i) => (
                <li key={s.step} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      s.ok ? "bg-brand text-card" : "bg-coral text-card"
                    }`}
                  >
                    <I n={s.ok ? "check" : "x"} className="h-3 w-3" />
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${s.ok ? "text-ink-700" : "text-coral"}`}>
                      {i + 1}. {s.step}
                    </p>
                    {s.note && <p className="mt-0.5 text-xs text-ink-500">{s.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Reveal>

      {/* Actions */}
      <Reveal delay={350}>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void activate()}
            disabled={busy}
            className="btn-press flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-display font-bold text-card hover:bg-brand-deep disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-card/40 border-t-card" />
                جارِ اختبار الاتصال…
              </>
            ) : (
              <>
                <I n="sync" className="h-5 w-5" />
                اختبار وتفعيل المزامنة
              </>
            )}
          </button>

          {(sync.mode === "cloud" || sync.mode === "connecting") && (
            <button
              onClick={() => {
                disconnectFirebase();
                go({ name: "overview" });
              }}
              className="btn-press flex items-center gap-2 rounded-xl border border-ink-200 px-6 py-3 font-display font-bold text-ink-500 hover:bg-ink-50"
            >
              تعطيل الاتصال
            </button>
          )}
        </div>
      </Reveal>

      {/* Import/Export Data */}
      <Reveal delay={400}>
        <div className="rounded-xl border border-line bg-card p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <I n="cloud" className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-display text-sm font-extrabold text-ink-800">
                استيراد وتصدير البيانات
              </p>
              <p className="mt-1 text-xs font-semibold text-ink-600">
                صدّر بياناتك كملف JSON أو استورد بيانات من ملف. البيانات هتتزامن مع Firestore تلقائيًا.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportData}
              className="btn-press flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-display text-sm font-bold text-card hover:bg-brand-deep"
            >
              <I n="upload" className="h-4 w-4" />
              تصدير البيانات
            </button>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  await importData(text);
                };
                input.click();
              }}
              className="btn-press flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-display text-sm font-bold text-ink-950 hover:brightness-105"
            >
              <I n="cloud" className="h-4 w-4" />
              استيراد البيانات
            </button>
          </div>
        </div>
      </Reveal>

      {/* Danger Zone */}
      {(sync.mode === "cloud" || sync.mode === "connecting") && (
        <Reveal delay={450}>
          <div className="rounded-xl border-2 border-coral/30 bg-coral-soft/20 p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral text-card">
                <I n="alert" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-display text-sm font-extrabold text-coral">
                  منطقة الخطر: مسح كل البيانات
                </p>
                <p className="mt-1 text-xs font-semibold text-ink-600">
                  هذا الزر سيمسح كل المحتوى (المجالات، المشاريع، المقالات) من Firestore نهائيًا.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const confirmed = window.confirm(
                  "⚠️ تحذير: هل أنت متأكد من مسح كل البيانات؟\n\nسيتم حذف:\n- كل المجالات\n- كل المشاريع\n- كل المقالات\n\nلا يمكن التراجع عن هذه العملية!"
                );
                if (confirmed) {
                  const doubleConfirmed = window.confirm(
                    "⚠️ تأكيد نهائي: هل أنت متأكد تمامًا؟\n\nسيتم مسح كل البيانات من Firestore نهائيًا!"
                  );
                  if (doubleConfirmed) {
                    await resetAllData();
                  }
                }
              }}
              className="btn-press flex items-center gap-2 rounded-xl bg-coral px-5 py-2.5 font-display text-sm font-extrabold text-card hover:brightness-110"
            >
              <I n="trash" className="h-4 w-4" />
              مسح كل البيانات نهائيًا
            </button>
          </div>
        </Reveal>
      )}
    </div>
  );
}
