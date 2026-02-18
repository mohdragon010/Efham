"use client";

import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, BookX, Loader2, AlertCircle, ArrowRight,
  Layers, ChevronLeft, Video, FileText, ImageIcon, FileArchive,
} from "lucide-react";
import Link from "next/link";

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts?.toDate) return null;
  return ts.toDate().toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });
}

const TYPE_META = {
  video:     { label: "فيديو",  Icon: Video,        color: "text-rose-500",    bg: "bg-rose-50",    border: "border-rose-100"    },
  rich_text: { label: "نص",     Icon: FileText,      color: "text-indigo-500",  bg: "bg-indigo-50",  border: "border-indigo-100"  },
  image:     { label: "صورة",   Icon: ImageIcon,     color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
  pdf:       { label: "PDF",    Icon: FileArchive,   color: "text-orange-500",  bg: "bg-orange-50",  border: "border-orange-100"  },
};

// ── empty states ──────────────────────────────────────────────────────────────
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
        <p className="text-slate-700 font-semibold text-lg">جارٍ تحميل المحاضرة…</p>
        <p className="text-slate-400 text-sm">يرجى الانتظار لحظة</p>
      </div>
      <div className="w-full max-w-md space-y-3 mt-2">
        {[80, 60, 70].map((w, i) => (
          <div key={i} className="h-3 rounded-full bg-slate-100 animate-pulse"
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
        <h2 className="text-xl font-bold text-slate-800">المحاضرة غير موجودة</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          المحاضرة التي تحاول الوصول إليها غير موجودة أو قد تم حذفها.
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
          تعذّر تحميل تفاصيل المحاضرة. تحقق من اتصالك بالإنترنت وحاول مجدداً.
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

// ── sub-lecture card ──────────────────────────────────────────────────────────
function SubLectureCard({ sub, lectureId, index }) {
  const meta = TYPE_META[sub.type];
  const Icon = meta?.Icon ?? BookOpen;
  const color = meta?.color ?? "text-slate-500";
  const bg = meta?.bg ?? "bg-slate-50";
  const border = meta?.border ?? "border-slate-100";
  const label = meta?.label ?? sub.type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
    >
      <Link href={`/study-content/lectures/${lectureId}/${sub.id}`} className="block group">
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all duration-300">

          {/* type icon */}
          <div className={`shrink-0 h-10 w-10 rounded-xl ${bg} border ${border} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>

          {/* title + badge */}
          <div className="flex-1 min-w-0" dir="rtl">
            <p className="font-semibold text-slate-800 text-sm leading-snug truncate group-hover:text-indigo-600 transition-colors">
              {sub.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-xs ${color} ${bg} border ${border} px-2 py-0.5 rounded-full`}>
                <Icon className="h-3 w-3" />
                {label}
              </span>
              {sub.content?.length > 0 && (
                <span className="text-xs text-slate-400">
                  {sub.content.length} {sub.content.length === 1 ? "عنصر" : "عناصر"}
                </span>
              )}
            </div>
          </div>

          {/* index + arrow */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">
              {String(index + 1).padStart(2, "0")}
            </span>
            <ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:-translate-x-0.5 transition-all duration-200" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function LectureDetailsPage() {
  const [lecture, setLecture] = useState(null);
  const [status, setStatus]   = useState("loading");
  const lectureId             = useParams().lectureId;

  async function getLectureDetails() {
    setStatus("loading");
    try {
      const docSnap = await getDoc(doc(db, "lectures", lectureId));
      if (docSnap.exists()) {
        setLecture({ ...docSnap.data(), id: docSnap.id });
        setStatus("found");
      } else {
        setStatus("not-found");
      }
    } catch (err) {
      console.error("Error fetching lecture details:", err);
      setStatus("error");
    }
  }

  useEffect(() => { getLectureDetails(); }, []);

  if (status === "loading")   return <div className="p-6"><LoadingState /></div>;
  if (status === "not-found") return <div className="p-6"><NotFoundState /></div>;
  if (status === "error")     return <div className="p-6"><ErrorState onRetry={getLectureDetails} /></div>;

  const subLectures = lecture?.subLectures ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-6 max-w-2xl mx-auto"
      dir="rtl"
    >
      {/* ── header ── */}
      <div className="flex items-start gap-3 mb-5">
        <button onClick={() => history.back()}
          className="mt-1 h-9 w-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:text-indigo-500 transition-all text-slate-400 shrink-0"
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 shrink-0 mt-0.5">
          <BookOpen className="h-5 w-5 text-indigo-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-slate-400 font-medium">تفاصيل المحاضرة</p>
            {lecture?.isActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                نشطة
              </span>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-[#005b9e] leading-tight mt-0.5">
            {lecture?.title}
          </h1>
          {lecture?.createdAt && (
            <p className="text-xs text-slate-400 mt-1">{formatDate(lecture.createdAt)}</p>
          )}
        </div>

        {lecture?.order != null && (
          <span className="shrink-0 text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg mt-1">
            #{lecture.order}
          </span>
        )}
      </div>

      {/* thumbnail */}
      {lecture?.thumbnail && (
        <div className="rounded-2xl overflow-hidden mb-5 border border-slate-100">
          <img src={lecture.thumbnail} alt={lecture.title}
            className="w-full h-48 object-cover" />
        </div>
      )}

      {/* description */}
      {lecture?.description && (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 mb-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            {lecture.description}
          </p>
        </div>
      )}

      {/* ── sub-lectures ── */}
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-4 w-4 text-slate-400" />
        <h2 className="text-sm font-bold text-slate-700">الدروس:</h2>
        <span className="mr-auto text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {subLectures.length}
        </span>
      </div>

      {subLectures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <BookOpen className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">لا توجد دروس فرعية لهذه المحاضرة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subLectures.map((sub, i) => (
            <SubLectureCard key={sub.id} sub={sub} lectureId={lectureId} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}