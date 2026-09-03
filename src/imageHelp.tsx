import Swal from "sweetalert2";
import type { SweetAlertResult } from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { I } from "./icons";
import { useStore } from "./store";

export const IMAGE_HOST_URL = "https://www.image2url.com";

const step = (n: number, title: string, desc: string) => `
  <li style="display:flex;gap:12px;align-items:flex-start;text-align:right">
    <span style="flex:0 0 30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:#E19B10;color:#071A14;font-family:'Space Grotesk',monospace;font-weight:700;font-size:14px">${n}</span>
    <span style="font-size:13px;line-height:1.9;color:#0B241C">
      <b style="font-weight:800">${title}</b>
      <span style="display:block;color:#46705F;font-size:12px">${desc}</span>
    </span>
  </li>`;

/** يفتح نافذة شرح إضافة الصور كروابط مباشرة */
export function showImageHelp(): Promise<SweetAlertResult> {
  return Swal.fire({
    title: "إضافة الصور كروابط مباشرة",
    html: `
      <div style="text-align:right">
        <p style="margin:0 0 16px;font-size:13.5px;line-height:2;color:#46705F">
          الصور في الداشبورد تُضاف <b style="color:#0B241C">كروابط مباشرة فقط</b> — لا نرفع ملفات من جهازك.
          ارفع صورتك على موقع <b style="color:#0B241C">Image2URL</b> ثم الصق الرابط هنا في الداشبورد.
        </p>
        <ol style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px">
          ${step(1, "افتح Image2URL وارفع الصورة", "من الزر بالأسفل افتح الموقع وارفع الصورة من جهازك")}
          ${step(2, "انسخ الرابط المباشر", "بعد الرفع ستجد خانة Direct Link — انسخ الرابط منها")}
          ${step(3, "الصق الرابط في الداشبورد", "في خانة صورة المشروع أو المقال ثم اضغط «تعيين» أو «إضافة»")}
          ${step(4, "تظهر المعاينة فورًا", "تُحفظ الصورة كرابط خفيف يتزامن مع فايربيز دون تضخيم قاعدة البيانات")}
        </ol>
        <a href="${IMAGE_HOST_URL}" target="_blank" rel="noreferrer"
           style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:20px;background:#0B241C;color:#FCFDFB;padding:13px 18px;border-radius:12px;font-weight:800;font-size:14px;text-decoration:none;font-family:'Alexandria',sans-serif">
          افتح Image2URL لرفع الصور
          <span dir="ltr" style="font-family:'Space Grotesk',monospace;font-size:12px;font-weight:700;color:#E19B10">image2url.com ↗</span>
        </a>
        <p style="margin:14px 0 0;font-size:11.5px;line-height:1.9;color:#46705F;background:#EEF2ED;border:1px dashed #C2D4CA;border-radius:10px;padding:10px 14px">
          <b style="color:#996A05">نصيحة:</b> شكل الرابط المباشر كالتالي —
          <span dir="ltr" style="display:block;font-family:'Space Grotesk',monospace;font-size:10.5px;margin-top:4px;word-break:break-all;color:#0B241C">
            https://www.image2url.com/r2/default/images/1788264047480-….png
          </span>
        </p>
      </div>`,
    width: 640,
    background: "#FCFDFB",
    color: "#0B241C",
    confirmButtonText: "تمام، فهمت",
    confirmButtonColor: "#0E6E55",
    showDenyButton: true,
    denyButtonText: "نسخ رابط الموقع",
    denyButtonColor: "#E19B10",
    customClass: {
      popup: "dublex-swal",
    },
    didOpen: (el) => {
      el.setAttribute("dir", "rtl");
      el.style.fontFamily = "'IBM Plex Sans Arabic','Alexandria',sans-serif";
      const t = el.querySelector(".swal2-title");
      if (t instanceof HTMLElement) {
        t.style.fontFamily = "'Alexandria',sans-serif";
        t.style.fontWeight = "800";
      }
    },
  });
}

/** زر يفتح نافذة الشرح — ويُستخدم بجوار كل خانة صورة */
export function ImageHelpButton({ className = "" }: { className?: string }) {
  const { toast } = useStore();
  const open = async () => {
    const res = await showImageHelp();
    if (res.isDenied) {
      try {
        await navigator.clipboard.writeText(IMAGE_HOST_URL);
        toast("تم نسخ رابط موقع Image2URL");
      } catch {
        toast("تعذّر النسخ — الرابط: image2url.com", "error");
      }
    }
  };
  return (
    <button
      type="button"
      onClick={() => void open()}
      className={`btn-press flex items-center gap-1.5 rounded-lg border border-gold/50 bg-gold-soft/50 px-3 py-1.5 text-[11px] font-bold text-gold-deep transition-colors hover:border-gold hover:bg-gold-soft ${className}`}
    >
      <I n="bulb" className="h-3.5 w-3.5" />
      طريقة إضافة الصور؟
    </button>
  );
}
