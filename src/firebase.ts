import { initializeApp, type FirebaseApp } from "firebase/app";
import { doc, getDoc, getFirestore, type Firestore } from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const CFG_KEY = "dublex-fb-cfg";
const OFF_KEY = "dublex-fb-off";

/** إعدادات مشروع Dublex الرسمية — الاتصال التلقائي */
export const DEFAULT_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyB6zdS1RbyPqbKjmArSyEtk2vyO3ErZ6og",
  authDomain: "dublex-26.firebaseapp.com",
  projectId: "dublex-26",
  storageBucket: "dublex-26.firebasestorage.app",
  messagingSenderId: "252085069789",
  appId: "1:252085069789:web:38c7bdef155ad74838f834",
};

export function isAutoConnectDisabled(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAutoConnectDisabled(v: boolean) {
  try {
    if (v) localStorage.setItem(OFF_KEY, "1");
    else localStorage.removeItem(OFF_KEY);
  } catch {
    /* تجاهل */
  }
}

/** الإعداد الفعّال: المحفوظ إن وُجد، وإلا إعدادات المشروع الرسمية */
export function getEffectiveConfig(): FirebaseConfig {
  return loadStoredConfig() ?? DEFAULT_CONFIG;
}

/** مسار مستند الداشبورد داخل Firestore */
export const DOC_PATH: [string, string] = ["dashboards", "dublex-main"];

export function isValidConfig(c: unknown): c is FirebaseConfig {
  const o = c as Partial<FirebaseConfig>;
  return (
    !!o &&
    typeof o.apiKey === "string" && o.apiKey.length > 0 &&
    typeof o.projectId === "string" && o.projectId.length > 0 &&
    typeof o.authDomain === "string" && o.authDomain.length > 0
  );
}

export function loadStoredConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredConfig(cfg: FirebaseConfig) {
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  } catch {
    /* تجاهل */
  }
}

export function clearStoredConfig() {
  try {
    localStorage.removeItem(CFG_KEY);
  } catch {
    /* تجاهل */
  }
}

let app: FirebaseApp | null = null;
let fs: Firestore | null = null;

export function initFirebase(
  cfg: FirebaseConfig
): { ok: true } | { ok: false; error: string } {
  try {
    app = initializeApp(cfg, `dublex-${Date.now()}`);
    fs = getFirestore(app);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "تعذّر تهيئة فايربيز",
    };
  }
}

export function dbRef() {
  return fs ? doc(fs, DOC_PATH[0], DOC_PATH[1]) : null;
}

export async function testConnection(
  cfg: FirebaseConfig
): Promise<{ ok: true } | { ok: false; error: string }> {
  const init = initFirebase(cfg);
  if (!init.ok) return init;
  const ref = dbRef();
  if (!ref) return { ok: false, error: "تعذّر إنشاء مرجع المستند" };
  try {
    await Promise.race([
      getDoc(ref),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 9000)),
    ]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: fbMessage(e) };
  }
}

export function fbMessage(e: unknown): string {
  const code = String((e as { code?: string })?.code ?? "");
  if (code.includes("permission-denied"))
    return "قواعد الأمان في Firestore رفضت الوصول — فعّل وضع الاختبار أو اسمح بالقراءة والكتابة.";
  if (code.includes("unavailable"))
    return "تعذّر الاتصال بخدمة فايربيز — تحقق من الإنترنت.";
  if (e instanceof Error && e.message === "timeout")
    return "انتهت مهلة الاتصال — تأكد من صحة الإعدادات ومعرف المشروع.";
  if (code.includes("not-found"))
    return "لم يتم العثور على قاعدة Firestore — أنشئها أولًا من وحدة تحكم فايربيز.";
  return e instanceof Error ? e.message : "حدث خطأ غير متوقع.";
}
