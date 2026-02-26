"use client";

import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, BookX, Loader2, AlertCircle, ArrowRight,
  Video, FileText, ImageIcon, FileArchive, Tag,
} from "lucide-react";

// ── empty states (same as before) ────────────────────────────────────────────
function LoadingState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center"
    >
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-20 w-20 rounded-full bg-indigo-100 animate-ping opacity-60" />
        <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-indigo-50 border-2 border-indigo-200">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-slate-700 font-semibold text-lg">جارٍ تحميل الدرس…</p>
        <p className="text-slate-400 text-sm">يرجى الانتظار لحظة</p>
      </div>
      <div className="w-full max-w-md space-y-3 mt-2">
        {[80, 60, 70].map((w, i) => (
          <div key={i} className="h-3 rounded-full bg-slate-200 animate-pulse"
            style={{ width: `${w}%`, marginInline: "auto" }} />
        ))}
      </div>
    </motion.div>
  );
}

function NotFoundState() {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center"
    >
      <div className="h-24 w-24 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
        <BookX className="h-10 w-10 text-amber-500" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-slate-800">الدرس غير موجود</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          الدرس الذي تحاول الوصول إليه غير موجود أو قد تم حذفه.
        </p>
      </div>
      <button onClick={() => history.back()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white text-sm font-medium shadow-sm"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للخلف
      </button>
    </motion.div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center"
    >
      <div className="h-24 w-24 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-slate-800">حدث خطأ ما</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          تعذّر تحميل الدرس. تحقق من اتصالك وحاول مجدداً.
        </p>
      </div>
      <button onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all text-white text-sm font-medium shadow-sm"
      >
        <Loader2 className="h-4 w-4" />
        إعادة المحاولة
      </button>
    </motion.div>
  );
}

// ── type config ───────────────────────────────────────────────────────────────
const TYPE_META = {
  video: { label: "فيديو", Icon: Video, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
  rich_text: { label: "نص", Icon: FileText, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
  image: { label: "صورة", Icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
  pdf: { label: "PDF", Icon: FileArchive, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
};

function CardHeader({ type, label }) {
  const meta = TYPE_META[type] ?? {
    label: type, Icon: Tag,
    color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100",
  };
  const { Icon, label: typeLabel, color, bg, border } = meta;
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 bg-slate-50" dir="rtl">
      <div className={`h-8 w-8 rounded-lg ${bg} border ${border} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{typeLabel}</p>
        {label && <p className="text-sm font-semibold text-slate-700 truncate">{label}</p>}
      </div>
    </div>
  );
}

// ── content renderers ─────────────────────────────────────────────────────────
import CustomVideoPlayer from "@/components/CustomVideoPlayer";

// ... (other components)

function VideoBlock({ item }) {
  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
      <CustomVideoPlayer videoId={item.value} title={item.label} />
    </div>
  );
}

function RichTextBlock({ item }) {
  return (
    <div dir="rtl"
      className="px-5 py-4 prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed
        [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold
        [&_p]:my-2 [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5
        [&_strong]:font-semibold [&_a]:text-indigo-600 [&_a]:underline"
      dangerouslySetInnerHTML={{ __html: item.value }}
    />
  );
}

function ImageBlock({ item }) {
  return (
    <div className="p-4">
      <img src={item.value} alt={item.label ?? "image"}
        className="w-full rounded-xl object-cover max-h-120" />
    </div>
  );
}

function PdfBlock({ item }) {
  return (
    <div className="p-4">
      <iframe src={item.value} title={item.label ?? "pdf"}
        className="w-full node rounded-xl border border-slate-100" />
      <a href={item.value} target="_blank" rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        dir="rtl"
      >
        <FileArchive className="h-4 w-4" />
        فتح الملف في تبويب جديد
      </a>
    </div>
  );
}

function ContentCard({ item, index }) {
  const renderBody = () => {
    switch (item.type) {
      case "video": return <VideoBlock item={item} />;
      case "rich_text": return <RichTextBlock item={item} />;
      case "image": return <ImageBlock item={item} />;
      case "pdf": return <PdfBlock item={item} />;
      default:
        return (
          <div className="px-5 py-4 text-xs text-slate-400 font-mono" dir="rtl">
            نوع غير معروف: {item.type}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm"
    >
      <CardHeader type={item.type} label={item.label} />
      {renderBody()}
    </motion.div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function SubLecturePage() {
  const { lectureId, subLectureId } = useParams();
  const [subLecture, setSubLecture] = useState(null);
  const [status, setStatus] = useState("loading");

  async function fetchSubLecture() {
    setStatus("loading");
    try {
      const docSnap = await getDoc(doc(db, "lectures", lectureId));
      if (!docSnap.exists()) { setStatus("not-found"); return; }

      const found = (docSnap.data().subLectures ?? []).find(s => s.id === subLectureId);
      if (!found) { setStatus("not-found"); return; }

      setSubLecture(found);
      setStatus("found");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  useEffect(() => { fetchSubLecture(); }, []);

  if (status === "loading") return <div className="p-6"><LoadingState /></div>;
  if (status === "not-found") return <div className="p-6"><NotFoundState /></div>;
  if (status === "error") return <div className="p-6"><ErrorState onRetry={fetchSubLecture} /></div>;

  const content = subLecture?.content ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-6 max-w-2xl mx-auto"
      dir="rtl"
    >
      {/* header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => history.back()}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:text-indigo-500 transition-all text-slate-400 shrink-0"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 shrink-0">
          <BookOpen className="h-4 w-4 text-indigo-500" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">درس فرعي</p>
          <h1 className="text-lg font-extrabold text-[#005b9e] leading-tight truncate">
            {subLecture?.title}
          </h1>
        </div>
        {/* type badge */}
        {subLecture?.type && (() => {
          const meta = TYPE_META[subLecture.type];
          if (!meta) return null;
          const { Icon, label, color, bg, border } = meta;
          return (
            <span className={`mr-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bg} ${border} border ${color}`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          );
        })()}
      </div>

      <div className="h-px bg-slate-100 my-5" />

      {/* content blocks */}
      {content.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <BookOpen className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">لا يوجد محتوى لهذا الدرس بعد</p>
        </div>
      ) : (
        <div className="space-y-5">
          {content.map((item, i) => (
            <ContentCard key={i} item={item} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}