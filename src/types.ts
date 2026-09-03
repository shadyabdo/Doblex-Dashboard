export type ViewName =
  | "overview"
  | "fields"
  | "projects"
  | "project-form"
  | "articles"
  | "article-form";

export interface View {
  name: ViewName;
  projectId?: string;
  articleId?: string;
}

export interface Field {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  soft: string;
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
  readMins: number;
  createdAt: number;
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

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);
}
