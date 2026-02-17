"use client";

import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Search,
  AlertCircle,
  Layers,
  Play,
  ChevronLeft,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";

// ── helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts?.toDate) return null;
  return ts.toDate().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── skeleton card ─────────────────────────────────────────────────────────────
function LectureCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-100">
      <Skeleton className="h-44 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-5/6 rounded-full" />
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        <Skeleton className="h-9 w-28 rounded-xl" />
      </CardFooter>
    </Card>
  );
}

// ── empty (no lectures at all) ────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-28 gap-5 text-center col-span-full"
    >
      <div className="h-24 w-24 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center">
        <BookOpen className="h-10 w-10 text-indigo-400" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-lg font-bold text-slate-800">لا توجد محاضرات بعد</h3>
        <p className="text-sm text-slate-400">
          لم يتم إضافة أي محاضرات حتى الآن. تحقق لاحقاً.
        </p>
      </div>
    </motion.div>
  );
}

// ── empty (search returned nothing) ──────────────────────────────────────────
function NoResultsState({ query, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-5 text-center col-span-full"
    >
      <div className="h-24 w-24 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center">
        <Search className="h-10 w-10 text-amber-400" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-lg font-bold text-slate-800">لا نتائج لـ "{query}"</h3>
        <p className="text-sm text-slate-400">
          جرّب كلمة مختلفة أو تحقق من الإملاء.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onClear} className="gap-2 rounded-xl">
        <RefreshCcw className="h-3.5 w-3.5" />
        مسح البحث
      </Button>
    </motion.div>
  );
}

// ── error state ───────────────────────────────────────────────────────────────
function ErrorState({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-28 gap-5 text-center col-span-full"
    >
      <div className="h-24 w-24 rounded-full bg-rose-50 border-2 border-rose-100 flex items-center justify-center">
        <AlertCircle className="h-10 w-10 text-rose-400" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-lg font-bold text-slate-800">حدث خطأ ما</h3>
        <p className="text-sm text-slate-400">
          تعذّر تحميل المحاضرات. تحقق من اتصالك وحاول مجدداً.
        </p>
      </div>
      <Button onClick={onRetry} size="sm" className="gap-2 rounded-xl bg-rose-500 hover:bg-rose-600">
        <RefreshCcw className="h-3.5 w-3.5" />
        إعادة المحاولة
      </Button>
    </motion.div>
  );
}

// ── lecture card ──────────────────────────────────────────────────────────────
function LectureCard({ lecture, index }) {
  const subCount = lecture.subLectures?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
    >
      <Link href={`/study-content/lectures/${lecture.id}`} className="block group">
        <Card className="overflow-hidden rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all duration-300 h-full flex flex-col">
          {/* thumbnail */}
          <div className="relative overflow-hidden bg-slate-100 h-44">
            {lecture.thumbnail ? (
              <img
                src={lecture.thumbnail}
                alt={lecture.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-slate-300" />
              </div>
            )}

            {/* active badge */}
            {lecture.isActive && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium shadow">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                نشط
              </span>
            )}

            {/* order badge */}
            <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
              #{lecture.order}
            </span>
          </div>

          <CardContent className="p-4 flex-1 space-y-2" dir="rtl">
            <h2 className="font-bold text-slate-800 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {lecture.title}
            </h2>
            {lecture.description && (
              <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                {lecture.description}
              </p>
            )}

            {/* meta row */}
            <div className="flex items-center gap-3 pt-1">
              {subCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Layers className="h-3.5 w-3.5" />
                  {subCount} دروس فرعية
                </span>
              )}
              {lecture.createdAt && (
                <span className="text-xs text-slate-400 mr-auto">
                  {formatDate(lecture.createdAt)}
                </span>
              )}
            </div>
          </CardContent>

          <CardFooter className="px-4 pb-4 pt-0" dir="rtl">
            <Button
              size="sm"
              className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white w-full"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              ابدأ المحاضرة
              <ChevronLeft className="h-3.5 w-3.5 mr-auto" />
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function LecturesPage() {
  const [lectures, setLectures] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [search, setSearch] = useState("");

  async function fetchLectures() {
    setStatus("loading");
    try {
      const collectionRef = collection(db, "lectures");
      const q = query(collectionRef, orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setLectures(list);
      setStatus("success");
    } catch (err) {
      console.error("error fetching lectures:", err);
      setStatus("error");
    }
  }

  useEffect(() => {
    fetchLectures();
  }, []);

  const filtered = lectures.filter((l) =>
    l.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-slate-800">المحاضرات</h1>
          {status === "success" && (
            <p className="text-sm text-slate-400 mt-0.5">
              {lectures.length} محاضرة متاحة
            </p>
          )}
        </div>

        {/* search */}
        {status === "success" && lectures.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="ابحث عن محاضرة…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 rounded-xl border-slate-200 text-sm"
            />
          </div>
        )}
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="wait">
          {status === "loading" &&
            Array.from({ length: 6 }).map((_, i) => (
              <LectureCardSkeleton key={i} />
            ))}

          {status === "error" && <ErrorState onRetry={fetchLectures} />}

          {status === "success" && lectures.length === 0 && <EmptyState />}

          {status === "success" &&
            lectures.length > 0 &&
            filtered.length === 0 && (
              <NoResultsState query={search} onClear={() => setSearch("")} />
            )}

          {status === "success" &&
            filtered.map((lecture, i) => (
              <LectureCard key={lecture.id} lecture={lecture} index={i} />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}