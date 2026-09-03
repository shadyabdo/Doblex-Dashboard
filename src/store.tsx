import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onSnapshot, setDoc } from "firebase/firestore";
import type { Article, Db, Field, Project, ToastMsg } from "./types";
import { seedDb } from "./seed";
import {
  clearStoredConfig,
  dbRef,
  ensureSignedIn,
  fbMessage,
  getEffectiveConfig,
  initFirebase,
  isAutoConnectDisabled,
  saveStoredConfig,
  setAutoConnectDisabled,
  type FirebaseConfig,
} from "./firebase";

/* مفتاح تخزين جديد — بداية نظيفة بدون أي محتوى تجريبي */
const KEY = "dublex-db-v3";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const readMins = (body: string) =>
  Math.max(1, Math.round(body.trim().split(/\s+/).length / 180));

export type SyncMode = "local" | "connecting" | "cloud" | "error";
export interface SyncState {
  mode: SyncMode;
  lastSync?: number;
  error?: string;
  projectId?: string;
}

interface StoreApi {
  db: Db;
  toasts: ToastMsg[];
  sync: SyncState;
  toast: (msg: string, kind?: ToastMsg["kind"]) => void;
  dismissToast: (id: string) => void;
  connectFirebase: (cfg: FirebaseConfig) => void;
  disconnectFirebase: () => void;
  addField: (f: Omit<Field, "id" | "createdAt">) => void;
  updateField: (id: string, patch: Partial<Field>) => void;
  deleteField: (id: string) => void;
  addProject: (p: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleGoal: (projectId: string, goalId: string) => void;
  addArticle: (a: Omit<Article, "id" | "createdAt" | "readMins">) => void;
  updateArticle: (id: string, patch: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const firstRunRef = useRef<boolean>(
    typeof localStorage !== "undefined" && localStorage.getItem(KEY) === null
  );

  const [db, setDb] = useState<Db>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw) as Db;
        if (
          d &&
          Array.isArray(d.fields) &&
          Array.isArray(d.projects) &&
          Array.isArray(d.articles)
        )
          return d;
      }
    } catch {
      /* بيانات تالفة → بداية نظيفة */
    }
    return seedDb;
  });

  const [sync, setSync] = useState<SyncState>(() =>
    isAutoConnectDisabled()
      ? { mode: "local" }
      : { mode: "connecting", projectId: getEffectiveConfig().projectId }
  );

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const timers = useRef<Record<string, number>>({});
  const dbLatestRef = useRef(db);
  const syncRef = useRef(sync);
  const writingRef = useRef(false);
  const remoteTsRef = useRef(0);
  /* أثناء الترحيل نتجاهل بيانات السحابة حتى يكتمل الدفع الأول (مسح التجريبي) */
  const migrationPendingRef = useRef(firstRunRef.current);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  const dismissToast = (id: string) => {
    window.clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  const toast = (msg: string, kind: ToastMsg["kind"] = "success") => {
    const id = uid();
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    timers.current[id] = window.setTimeout(() => dismissToast(id), 3800);
  };

  /** رفع البيانات للسحابة */
  const pushToCloud = (data: Db) => {
    const ref = dbRef();
    if (!ref) return;
    const ts = Date.now();
    writingRef.current = true;
    remoteTsRef.current = ts;
    setDoc(ref, { ...data, updatedAt: ts })
      .then(() => {
        writingRef.current = false;
        migrationPendingRef.current = false;
        setSync((s) =>
          s.mode === "error" ? s : { mode: "cloud", projectId: s.projectId, lastSync: ts }
        );
      })
      .catch((e) => {
        writingRef.current = false;
        setSync({ mode: "error", error: fbMessage(e) });
      });
  };

  /** تفعيل الاتصال والاستماع للتغييرات */
  const activate = (cfg: FirebaseConfig) => {
    unsubRef.current?.();
    const res = initFirebase(cfg);
    if (!res.ok) {
      setSync({ mode: "error", error: res.error });
      return;
    }
    const ref = dbRef();
    if (!ref) {
      setSync({ mode: "error", error: "تعذّر إنشاء مرجع المستند" });
      return;
    }
    setSync({ mode: "connecting", projectId: cfg.projectId });

    /* الدخول المجهول أولًا — يدعم قواعد وضع الإنتاج */
    void ensureSignedIn();

    unsubRef.current = onSnapshot(
      ref,
      (snap) => {
        if (migrationPendingRef.current) return; /* انتظر اكتمال المسح الأول */
        if (snap.exists()) {
          const data = snap.data() as Db;
          const ts = data.updatedAt ?? 0;
          if (!writingRef.current && ts > remoteTsRef.current) {
            remoteTsRef.current = ts;
            setDb({
              fields: data.fields ?? [],
              projects: data.projects ?? [],
              articles: data.articles ?? [],
            });
          }
        } else {
          /* المستند لم يُنشأ بعد: نرفع بياناتنا المحلية */
          window.setTimeout(() => {
            if (!writingRef.current && !migrationPendingRef.current)
              pushToCloud(dbLatestRef.current);
          }, 1200);
        }
        setSync((s) =>
          s.mode === "error"
            ? s
            : { mode: "cloud", projectId: cfg.projectId, lastSync: Date.now() }
        );
      },
      (e) => setSync({ mode: "error", error: fbMessage(e) })
    );

    /* أول فتح بعد التحديث: دفع الحالة الفارغة لمسح أي محتوى تجريبي قديم من السحابة */
    if (migrationPendingRef.current) {
      window.setTimeout(() => pushToCloud(dbLatestRef.current), 1000);
    }
  };

  /* الحفظ المحلي + الرفع للسحابة عند أي تغيير */
  useEffect(() => {
    dbLatestRef.current = db;
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* المساحة ممتلئة */
    }
    if (syncRef.current.mode !== "cloud") return;
    const t = window.setTimeout(() => pushToCloud(db), 900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  /* عند الفتح: الاتصال التلقائي بمشروع دوبلكس ما لم يُعطَّل يدويًا */
  useEffect(() => {
    if (!isAutoConnectDisabled()) activate(getEffectiveConfig());
    return () => unsubRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api: StoreApi = {
    db,
    toasts,
    sync,
    toast,
    dismissToast,
    connectFirebase: (cfg) => {
      saveStoredConfig(cfg);
      setAutoConnectDisabled(false);
      remoteTsRef.current = 0;
      activate(cfg);
    },
    disconnectFirebase: () => {
      unsubRef.current?.();
      unsubRef.current = null;
      clearStoredConfig();
      setAutoConnectDisabled(true);
      setSync({ mode: "local" });
      toast("تم التبديل إلى التخزين المحلي", "info");
    },
    addField: (f) =>
      setDb((d) => ({
        ...d,
        fields: [{ ...f, id: uid(), createdAt: Date.now() }, ...d.fields],
      })),
    updateField: (id, patch) =>
      setDb((d) => ({
        ...d,
        fields: d.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      })),
    deleteField: (id) =>
      setDb((d) => ({ ...d, fields: d.fields.filter((f) => f.id !== id) })),
    addProject: (p) =>
      setDb((d) => ({
        ...d,
        projects: [{ ...p, id: uid(), createdAt: Date.now() }, ...d.projects],
      })),
    updateProject: (id, patch) =>
      setDb((d) => ({
        ...d,
        projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })),
    deleteProject: (id) =>
      setDb((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) })),
    toggleGoal: (projectId, goalId) =>
      setDb((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                goals: p.goals.map((g) =>
                  g.id === goalId ? { ...g, done: !g.done } : g
                ),
              }
            : p
        ),
      })),
    addArticle: (a) =>
      setDb((d) => ({
        ...d,
        articles: [
          { ...a, id: uid(), readMins: readMins(a.body), createdAt: Date.now() },
          ...d.articles,
        ],
      })),
    updateArticle: (id, patch) =>
      setDb((d) => ({
        ...d,
        articles: d.articles.map((a) => {
          if (a.id !== id) return a;
          const next = { ...a, ...patch };
          if (patch.body !== undefined) next.readMins = readMins(next.body);
          return next;
        }),
      })),
    deleteArticle: (id) =>
      setDb((d) => ({ ...d, articles: d.articles.filter((a) => a.id !== id) })),
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
