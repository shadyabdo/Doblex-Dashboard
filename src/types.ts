export type ViewName =
  | "overview"
  | "fields"
  | "field-detail"
  | "projects"
  | "project-form"
  | "articles"
  | "article-form";

export interface View {
  name: ViewName;
  projectId?: string;
  articleId?: string;
  fieldId?: string;
}

export interface Field {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  soft: string;
  /** مجال يحتوي محتوى فيديو — تظهر فيه خانة رابط الفيديو بالمشاريع */
  isVideo?: boolean;
  /** عدد مشاهدات صفحة المجال — يقرأه ويزوده الموقع الرئيسي من Firestore */
  views?: number;
  createdAt: number;
}

export interface ProjectImage {
  id: string;
  src: string;
}

export interface Goal {
  id: string;
  text: string;
  done: boolean;
}

export interface Achievement {
  id: string;
  metric: string;
  text: string;
}

export type ProjectStatus = "planning" | "active" | "done";

export interface Project {
  id: string;
  fieldId: string;
  fieldLabel: string;
  title: string;
  subtitle: string;
  client: string;
  year: string;
  status: ProjectStatus;
  cover: string;
  images: ProjectImage[];
  description: string;
  details: string;
  goals: Goal[];
  achievements: Achievement[];
  /** رابط فيديو مضمّن (iframe embed) — يظهر كمشغّل في تفاصيل المشروع */
  videoUrl?: string;
  createdAt: number;
}

export interface Article {
  id: string;
  title: string;
  /** الكلمات المفتاحية كما كتبها المستخدم (للعرض والبحث داخل الداشبورد) */
  keywords: string[];
  /** وسوم بصيغة slug نظيفة وجاهزة للروابط — يقرأها الموقع الرئيسي من Firestore */
  tags: string[];
  fieldLabel: string;
  excerpt: string;
  body: string;
  cover: string;
  published: boolean;
  /** تاريخ النشر الفعلي (null للمقالات المسودة) — يقرأه الموقع الرئيسي */
  publishedAt: number | null;
  /** عدد مشاهدات صفحة المدونة — يقرأه ويزوده الموقع الرئيسي من Firestore */
  views?: number;
  readMins: number;
  createdAt: number;
}

/** هل يبدو اسم المجال متعلقًا بالفيديو؟ (لاكتشاف تلقائي عند الإضافة) */
export function looksLikeVideoName(name: string): boolean {
  return /فيديو|مونتاج|إعلان|إعلانات|اعلان|دعايا|دعايه|موشن|video|film|editing/i.test(name);
}

/** هل المجال يحتوي فيديو؟ (العلم الصريح أو الاستدلال من الاسم) */
export function isVideoField(f: Field | undefined | null): boolean {
  if (!f) return false;
  return !!f.isVideo || looksLikeVideoName(f.name);
}

/**
 * يحوّل أي رابط فيديو إلى صيغة embed صالحة للـ iframe.
 * يوتيوب (watch / youtu.be / shorts / live) ← embed، فيميو ← player،
 * جوجل درايف ← preview، وأي منصة أخرى تمر كما هي.
 */
export function normalizeEmbedUrl(input: string): string | null {
  const s = (input ?? "").trim();
  if (!s || !/^https?:\/\//i.test(s)) return null;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
      const shorts = u.pathname.match(/^\/(shorts|live|embed)\/([\w-]+)/);
      if (shorts) return `https://www.youtube.com/embed/${shorts[2]}`;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "drive.google.com" && u.pathname.includes("/view")) {
      return s.replace("/view", "/preview");
    }
    return s; /* باقي المنصات: الرابط يُمرَّر كما هو */
  } catch {
    return null;
  }
}

/** تحوّل الكلمات المفتاحية إلى وسوم آمنة للروابط: "تحسين محركات البحث" ← "تحسين-محركات-البحث" */
export function toTags(keywords: string[]): string[] {
  const out: string[] = [];
  for (const k of keywords ?? []) {
    const slug = k
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}_-]/gu, "")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "");
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

export interface Db {
  fields: Field[];
  projects: Project[];
  articles: Article[];
  updatedAt?: number;
}

export interface ToastMsg {
  id: string;
  msg: string;
  kind: "success" | "error" | "info";
}

export const LOGO_URL =
  "https://www.image2url.com/r2/default/images/1788264047480-46d203e2-c238-469a-9424-3af4429ac94c.png";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "قيد التخطيط",
  active: "جاري التنفيذ",
  done: "مكتمل",
};

export const STATUS_STYLE: Record<ProjectStatus, { bg: string; fg: string; dot: string }> = {
  planning: { bg: "var(--color-sea-soft)", fg: "var(--color-sea)", dot: "var(--color-sea)" },
  active: { bg: "var(--color-gold-soft)", fg: "var(--color-gold-deep)", dot: "var(--color-gold)" },
  done: { bg: "var(--color-brand-soft)", fg: "var(--color-brand-deep)", dot: "var(--color-brand)" },
};

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(ts);
}

/** تنسيق أعداد المشاهدة: 999 ← 999، 1200 ← 1.2K، 1500000 ← 1.5M */
export function formatViews(n: number): string {
  const v = n ?? 0;
  if (v < 1000) return String(v);
  if (v < 1_000_000) {
    const k = v / 1000;
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}K`;
  }
  const m = v / 1_000_000;
  return `${m >= 10 ? Math.round(m) : Math.round(m * 10) / 10}M`;
}

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);
}
