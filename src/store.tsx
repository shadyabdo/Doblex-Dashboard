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
  resetAllData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportData: () => void;
  importData: (jsonString: string) => Promise<void>;
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
  const lastUploadedDbRef = useRef(db); // نخزن الـ db اللي ات رفع آخر مرة
  const resettingRef = useRef(false); // flag يقول إننا في وضع المسح

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
    lastUploadedDbRef.current = data; // نخزن الـ db اللي ات رفع
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
          // لو في وضع المسح، نتجاهل أي تغييرات
          if (resettingRef.current) return;
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
            
            const normalizedData = normalizeDb(mergedDb);
            
            // نعمل flag يقول إن التغيير جاي من Firestore
            fromFirestoreRef.current = true;
            // نخزن البيانات normalized عشان المقارنة تشتغل صح
            lastUploadedDbRef.current = normalizedData;
            setDb(normalizedData);
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
    
    // نقارن الـ db الحالي بالـ db اللي ات رفع آخر مرة
    // لو كانوا نفس الشيء، مش نرفع البيانات تاني
    const lastUploaded = lastUploadedDbRef.current;
    if (
      JSON.stringify(db.fields) === JSON.stringify(lastUploaded.fields) &&
      JSON.stringify(db.projects) === JSON.stringify(lastUploaded.projects) &&
      JSON.stringify(db.articles) === JSON.stringify(lastUploaded.articles)
    ) {
      return; // البيانات متشابهة، مش نرفعها تاني
    }
    
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
    resetAllData: async () => {
      const ref = dbRef();
      if (!ref) {
        toast("لا يمكن إعادة التعيين - Firestore غير متصل", "error");
        return;
      }

      try {
        // تشغيل flag المسح
        resettingRef.current = true;
        
        // إيقاف الـ listener مؤقتًا
        unsubRef.current?.();
        unsubRef.current = null;
        
        // مسح كل البيانات من Firestore
        const emptyDb: Db = { fields: [], projects: [], articles: [] };
        writingRef.current = true;
        await setDoc(ref, { ...emptyDb, updatedAt: Date.now() });
        writingRef.current = false;
        
        // مسح الـ state المحلي
        setDb(emptyDb);
        lastUploadedDbRef.current = emptyDb;
        
        // استنى شوية عشان الـ listener ما يسمعش التغييرات القديمة
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // إعادة تشغيل الـ listener
        const cfg = getEffectiveConfig();
        if (cfg && !isAutoConnectDisabled()) {
          activate(cfg);
        }
        
        // إيقاف flag المسح بعد ما الـ listener الجديد يشتغل
        await new Promise(resolve => setTimeout(resolve, 1000));
        resettingRef.current = false;
        
        toast("تم مسح كل البيانات بنجاح", "success");
      } catch (e) {
        resettingRef.current = false;
        toast("فشل في مسح البيانات: " + fbMessage(e), "error");
      }
    },
    clearAllData: async () => {
      try {
        // تشغيل flag المسح
        resettingRef.current = true;
        
        // إيقاف الـ listener مؤقتًا
        unsubRef.current?.();
        unsubRef.current = null;
        
        // مسح localStorage
        localStorage.clear();
        
        // مسح Firestore لو متصل
        const ref = dbRef();
        if (ref && syncRef.current.mode === "cloud") {
          const emptyDb: Db = { fields: [], projects: [], articles: [] };
          writingRef.current = true;
          await setDoc(ref, { ...emptyDb, updatedAt: Date.now() });
          writingRef.current = false;
        }
        
        // مسح الـ state المحلي
        const emptyDb: Db = { fields: [], projects: [], articles: [] };
        setDb(emptyDb);
        lastUploadedDbRef.current = emptyDb;
        
        // استنى شوية
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // إعادة تشغيل الـ listener لو كان متصل
        const cfg = getEffectiveConfig();
        if (cfg && !isAutoConnectDisabled() && syncRef.current.mode === "cloud") {
          activate(cfg);
        }
        
        // إيقاف flag المسح
        await new Promise(resolve => setTimeout(resolve, 1000));
        resettingRef.current = false;
        
        toast("تم مسح كل البيانات من localStorage و Firestore", "success");
      } catch (e) {
        resettingRef.current = false;
        toast("فشل في مسح البيانات: " + fbMessage(e), "error");
      }
    },
    exportData: () => {
      try {
        const dataToExport = {
          version: "1.0",
          exportDate: new Date().toISOString(),
          fields: db.fields,
          projects: db.projects,
          articles: db.articles,
        };
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `dublex-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast("تم تصدير البيانات بنجاح", "success");
      } catch (e) {
        toast("فشل في تصدير البيانات", "error");
      }
    },
    importData: async (jsonString: string) => {
      try {
        const imported = JSON.parse(jsonString);
        
        // التحقق من صحة البيانات
        if (!imported.fields || !imported.projects || !imported.articles) {
          throw new Error("ملف غير صالح");
        }
        
        // تشغيل flag المسح
        resettingRef.current = true;
        
        // إيقاف الـ listener مؤقتًا
        unsubRef.current?.();
        unsubRef.current = null;
        
        // إعداد البيانات الجديدة
        const newDb: Db = {
          fields: imported.fields,
          projects: imported.projects,
          articles: imported.articles,
        };
        
        // تحديث الـ state المحلي
        setDb(newDb);
        lastUploadedDbRef.current = newDb;
        
        // رفع البيانات لـ Firestore لو متصل
        const ref = dbRef();
        if (ref && syncRef.current.mode === "cloud") {
          writingRef.current = true;
          await setDoc(ref, { ...newDb, updatedAt: Date.now() });
          writingRef.current = false;
        }
        
        // استنى شوية
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // إعادة تشغيل الـ listener لو كان متصل
        const cfg = getEffectiveConfig();
        if (cfg && !isAutoConnectDisabled() && syncRef.current.mode === "cloud") {
          activate(cfg);
        }
        
        // إيقاف flag المسح
        await new Promise(resolve => setTimeout(resolve, 1000));
        resettingRef.current = false;
        
        toast("تم استيراد البيانات بنجاح", "success");
      } catch (e) {
        resettingRef.current = false;
        toast("فشل في استيراد البيانات: " + (e instanceof Error ? e.message : "ملف غير صالح"), "error");
      }
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
