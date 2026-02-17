"use client";

import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, BookX, Loader2, AlertCircle, ArrowRight } from "lucide-react";

// ── empty-state variants ─────────────────────────────────────────────────────
function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center"
    >
      {/* pulsing ring */}
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

      {/* skeleton lines */}
      <div className="w-full max-w-md space-y-3 mt-2">
        {[80, 60, 70].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-slate-100 animate-pulse"
            style={{ width: `${w}%`, marginInline: "auto" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function NotFoundState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center"
    >
      <div className="relative flex items-center justify-center">
        <div className="h-24 w-24 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
          <BookX className="h-10 w-10 text-amber-500" />
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-slate-800">المحاضرة غير موجودة</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          المحاضرة التي تحاول الوصول إليها غير موجودة أو قد تم حذفها.
        </p>
      </div>

      <button
        onClick={() => history.back()}
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
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

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all text-white text-sm font-medium shadow-sm"
      >
        <Loader2 className="h-4 w-4" />
        إعادة المحاولة
      </button>
    </motion.div>
  );
}

// ── main page ────────────────────────────────────────────────────────────────
export default function LectureDetailsPage() {
  const [lecture, setLecture]   = useState(null);
  const [status, setStatus]     = useState("loading"); // "loading" | "found" | "not-found" | "error"
  const lectureId               = useParams().lectureId;

  async function getLectureDetails() {
    setStatus("loading");
    const docRef = doc(db, "lectures", lectureId);
    try {
      const docSnap = await getDoc(docRef);
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

  useEffect(() => {
    getLectureDetails();
  }, []);

  // ── render states ────────────────────────────────────────────────────────
  if (status === "loading")   return <div className="p-6"><LoadingState /></div>;
  if (status === "not-found") return <div className="p-6"><NotFoundState /></div>;
  if (status === "error")     return <div className="p-6"><ErrorState onRetry={getLectureDetails} /></div>;

  // ── success ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-6 max-w-2xl"
      dir="rtl"
    >
      {/* icon + title row */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100">
          <BookOpen className="h-5 w-5 text-indigo-500" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium mb-0.5">تفاصيل المحاضرة</p>
          <h1 className="text-xl font-extrabold text-slate-800 leading-tight">
            {lecture?.title}
          </h1>
        </div>
      </div>

      {/* divider */}
      <div className="h-px bg-slate-100 mb-5" />

      {/* description card */}
      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
          {lecture?.description ?? "لا يوجد وصف لهذه المحاضرة."}
        </p>
      </div>
    </motion.div>
  );
}