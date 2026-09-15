import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onSnapshot, setDoc } from "firebase/firestore";
import { toTags, type Article, type Db, type Field, type Project, type ToastMsg } from "./types";
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

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const readMins = (body: string) =>
  Math.max(1, Math.round(body.trim().split(/\s+/).length / 180));

/** يكمل الحقول الجديدة (tags / publishedAt) للبيانات القديمة المحفوظة قبل التحديث */
function normalizeDb(d: Db): Db {
  return {
    fields: (d.fields ?? []).map((f) => ({ ...f, views: f.views ?? 0 })),
    projects: d.projects ?? [],
    articles: (d.articles ?? []).map((a) => ({
      ...a,
      tags:
        Array.isArray(a.tags) && a.tags.length > 0
          ? a.tags
          : toTags(a.keywords ?? []),
      publishedAt: a.published
        ? (a.publishedAt ?? a.createdAt ?? null)
        : (a.publishedAt ?? null),
      views: a.views ?? 0,
    })),
  };
}

export type SyncMode = "connecting" | "cloud" | "error";
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
  addArticle: (
    a: Omit<Article, "id" | "createdAt" | "readMins" | "tags" | "publishedAt">
  ) => void;
  updateArticle: (id: string, patch: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  incrementFieldView: (id: string) => void;
  incrementArticleView: (id: string) => void;
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // البيانات تبدأ فاضية وتتزامن مع Firestore
  const [db, setDb] = useState<Db>({
    fields: [],
    projects: [],
    articles: [],
  });

  const [sync, setSync] = useState<SyncState>(() =>
    isAutoConnectDisabled()
      ? { mode: "error", error: "الاتصال معطّل — فعّله من إعدادات فايربيز" }
      : { mode: "connecting", projectId: getEffectiveConfig().projectId }
  );

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const timers = useRef<Record<string, number>>({});
  const dbLatestRef = useRef(db);
  const syncRef = useRef(sync);
  const writingRef = useRef(false);
  const remoteTsRef = useRef(0);
  const unsubRef = useRef<(() => void) | null>(null);
  const localChangeRef = useRef(false);
  const fromFirestoreRef = useRef(false); // flag يقول إن التغيير جاي من Firestore

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
  const pushToCloud = (data: Db): Promise<void> => {
    const ref = dbRef();
    if (!ref) return Promise.resolve();
    const ts = Date.now();
    writingRef.current = true;
    remoteTsRef.current = ts;
    return setDoc(ref, { ...data, updatedAt: ts })
      .then(() => {
        writingRef.current = false;
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

    void (async () => {
      await Promise.race([
        ensureSignedIn(),
        new Promise((r) => setTimeout(r, 8000)),
      ]);

      unsubRef.current = onSnapshot(
        ref,
        (snap) => {
          if (localChangeRef.current) return;
          if (snap.exists()) {
            const data = snap.data() as Db;
            const ts = data.updatedAt ?? 0;
            if (writingRef.current) return;
            if (ts <= remoteTsRef.current) return;
            
            remoteTsRef.current = ts;
            
            const mergedDb = {
              fields: Array.isArray(data.fields) ? data.fields : [],
              projects: Array.isArray(data.projects) ? data.projects : [],
              articles: Array.isArray(data.articles) ? data.articles : [],
            };
            
            // نعمل flag يقول إن التغيير جاي من Firestore
            fromFirestoreRef.current = true;
            setDb(normalizeDb(mergedDb));
            // نرجع الـ flag بعد ما React يخلص الـ render
            Promise.resolve().then(() => {
              fromFirestoreRef.current = false;
            });
          }
          setSync((s) =>
            s.mode === "error"
              ? s
              : { mode: "cloud", projectId: cfg.projectId, lastSync: Date.now() }
          );
        },
        (e) => {
          setSync({ mode: "error", projectId: cfg.projectId, error: fbMessage(e) });
        }
      );
    })();
  };

  /* رفع البيانات للسحابة عند أي تغيير */
  useLayoutEffect(() => {
    dbLatestRef.current = db;
    if (syncRef.current.mode !== "cloud") return;
    
    // لو التغيير جاي من Firestore، مش نرفعه تاني
    if (fromFirestoreRef.current) return;
    
    localChangeRef.current = true;
    pushToCloud(db).finally(() => {
      localChangeRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  /* عند الفتح: الاتصال التلقائي بمشروع دوبلكس */
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
      setSync({ mode: "error", error: "الاتصال معطّل — فعّله من إعدادات فايربيز" });
      toast("تم تعطيل الاتصال بفايربيز", "info");
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
          {
            ...a,
            tags: toTags(a.keywords),
            publishedAt: a.published ? Date.now() : null,
            id: uid(),
            readMins: readMins(a.body),
            createdAt: Date.now(),
          },
          ...d.articles,
        ],
      })),
    updateArticle: (id, patch) =>
      setDb((d) => ({
        ...d,
        articles: d.articles.map((a) => {
          if (a.id !== id) return a;
          const next: Article = { ...a, ...patch };
          if (patch.body !== undefined) next.readMins = readMins(next.body);
          if (patch.keywords !== undefined) next.tags = toTags(next.keywords);
          if (patch.published !== undefined) {
            next.publishedAt = patch.published
              ? (a.publishedAt ?? Date.now())
              : (a.publishedAt ?? null);
          }
          return next;
        }),
      })),
    deleteArticle: (id) =>
      setDb((d) => ({ ...d, articles: d.articles.filter((a) => a.id !== id) })),
    incrementFieldView: (id) =>
      setDb((d) => ({
        ...d,
        fields: d.fields.map((f) =>
          f.id === id ? { ...f, views: (f.views ?? 0) + 1 } : f
        ),
      })),
    incrementArticleView: (id) =>
      setDb((d) => ({
        ...d,
        articles: d.articles.map((a) =>
          a.id === id ? { ...a, views: (a.views ?? 0) + 1 } : a
        ),
      })),
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
