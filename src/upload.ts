import { useCallback, useState } from "react";
import { useStore } from "./store";

export type Provider = "imgbb" | "freeimage" | "catbox";

export interface UploadCfg {
  provider: Provider;
  imgbbKey: string;
}

export interface UploadResult {
  url: string;
  via: Provider | "local";
}

const U_KEY = "dublex-uploader-v1";
const FREEIMAGE_DEMO_KEY = "6d207e02198a847aa98d0a2a901485a5";

export const PROVIDER_LABEL: Record<Provider | "local", string> = {
  imgbb: "ImgBB",
  freeimage: "Freeimage",
  catbox: "Catbox",
  local: "تخزين محلي",
};

export function loadUploadCfg(): UploadCfg {
  try {
    const raw = localStorage.getItem(U_KEY);
    if (raw) {
      const c = JSON.parse(raw) as Partial<UploadCfg>;
      return {
        provider: c.provider === "imgbb" || c.provider === "catbox" ? c.provider : "freeimage",
        imgbbKey: typeof c.imgbbKey === "string" ? c.imgbbKey : "",
      };
    }
  } catch {
    /* تجاهل */
  }
  return { provider: "freeimage", imgbbKey: "" };
}

export function saveUploadCfg(cfg: UploadCfg) {
  try {
    localStorage.setItem(U_KEY, JSON.stringify(cfg));
  } catch {
    /* تجاهل */
  }
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("read-error"));
    r.readAsDataURL(file);
  });
}

function withTimeout<T>(p: Promise<T>, ms = 25000): Promise<T> {
  return new Promise((res, rej) => {
    const t = window.setTimeout(() => rej(new Error("timeout")), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        res(v);
      },
      (e) => {
        window.clearTimeout(t);
        rej(e);
      }
    );
  });
}

async function uploadImgbb(file: File, key: string): Promise<string> {
  const b64 = (await toBase64(file)).split(",")[1];
  const fd = new FormData();
  fd.append("image", b64);
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, {
    method: "POST",
    body: fd,
  });
  const j = (await r.json()) as { data?: { url?: string }; error?: { message?: string } };
  if (j?.data?.url) return j.data.url;
  throw new Error(j?.error?.message ?? "imgbb");
}

async function uploadFreeimage(file: File): Promise<string> {
  const b64 = (await toBase64(file)).split(",")[1];
  const fd = new FormData();
  fd.append("source", b64);
  fd.append("format", "json");
  const r = await fetch(`https://freeimage.host/api/1/upload?key=${FREEIMAGE_DEMO_KEY}`, {
    method: "POST",
    body: fd,
  });
  const j = (await r.json()) as { image?: { url?: string } };
  if (j?.image?.url) return j.image.url;
  throw new Error("freeimage");
}

async function uploadCatbox(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("reqtype", "fileupload");
  fd.append("fileToUpload", file, file.name);
  const r = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: fd });
  const text = (await r.text()).trim();
  if (r.ok && /^https?:\/\/.+/i.test(text)) return text;
  throw new Error("catbox");
}

/**
 * يرفع الصورة لأقرب مزوّد متاح ويعيد رابطًا مباشرًا.
 * الترتيب: المزوّد المفضل ← بدائل ← تخزين محلي كحل أخير.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) throw new Error("الملف ليس صورة");
  if (file.size > 10 * 1024 * 1024) throw new Error("حجم الصورة يتجاوز 10MB");

  const cfg = loadUploadCfg();
  const prefer: Provider =
    cfg.provider === "imgbb" && !cfg.imgbbKey.trim() ? "freeimage" : cfg.provider;

  const chain: Provider[] = [prefer];
  if (cfg.imgbbKey.trim() && prefer !== "imgbb") chain.push("imgbb");
  for (const p of ["freeimage", "catbox"] as Provider[]) if (!chain.includes(p)) chain.push(p);

  for (const p of chain) {
    try {
      if (p === "imgbb") return { url: await withTimeout(uploadImgbb(file, cfg.imgbbKey.trim())), via: p };
      if (p === "freeimage") return { url: await withTimeout(uploadFreeimage(file)), via: p };
      return { url: await withTimeout(uploadCatbox(file)), via: p };
    } catch {
      /* جرّب المزوّد التالي */
    }
  }
  // حل أخير: حفظ محلي مؤقت
  return { url: await toBase64(file), via: "local" };
}

/** هوك يدير رفع مجموعة صور مع إشعارات الحالة */
export function useUploader() {
  const { toast } = useStore();
  const [busyCount, setBusyCount] = useState(0);

  const run = useCallback(
    async (files: File[]): Promise<string[]> => {
      if (!files.length) return [];
      setBusyCount((c) => c + 1);
      try {
        const results: string[] = [];
        let localCount = 0;
        let lastVia = "";
        for (const f of files) {
          try {
            const r = await uploadImage(f);
            results.push(r.url);
            if (r.via === "local") localCount++;
            else lastVia = PROVIDER_LABEL[r.via];
          } catch (e) {
            toast(
              e instanceof Error && e.message.includes("10MB")
                ? `«${f.name}» تتجاوز 10MB — صغّرها وجرّب مجددًا`
                : `«${f.name}» ليست صورة صالحة`,
              "error"
            );
          }
        }
        const remoteCount = results.length - localCount;
        if (remoteCount > 0) {
          toast(
            remoteCount === 1
              ? `تم الرفع — الرابط المباشر جاهز عبر ${lastVia}`
              : `تم رفع ${remoteCount} صور كروابط مباشرة عبر ${lastVia}`
          );
        }
        if (localCount > 0) {
          toast(
            `${localCount === 1 ? "صورة واحدة تعذّر رفعها" : `${localCount} صور تعذّر رفعها`} للسحابة — حُفظت محليًا مؤقتًا. بدّل المزوّد من إعدادات رفع الصور`,
            "error"
          );
        }
        return results;
      } finally {
        setBusyCount((c) => c - 1);
      }
    },
    [toast]
  );

  return { busy: busyCount > 0, run };
}
