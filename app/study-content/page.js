"use client"
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useAuth from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import QuizCard from "@/components/study/QuizCard";
import AssignmentCard from "@/components/study/AssignmentCard";
import LectureCard from "@/components/study/LectureCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudyContent() {
    const { userData } = useAuth();
    const [search, setSearch] = useState("");
    const [lectures, setLectures] = useState([]);
    const [latestQuiz, setLatestQuiz] = useState(null);
    const [latestAssignment, setLatestAssignment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Fetch Lectures
        const lecturesRef = collection(db, "lectures");
        const qLectures = query(lecturesRef, where("isActive", "==", true), orderBy("order", "asc"));

        // 2. Fetch Latest Quiz
        const quizzesRef = collection(db, "quizzes");
        const qQuiz = query(quizzesRef, where("isActive", "==", true), orderBy("createdAt", "desc"), limit(1));

        // 3. Fetch Latest Assignment
        const assignmentsRef = collection(db, "assignments");
        const qAssignment = query(assignmentsRef, where("isActive", "==", true), orderBy("createdAt", "desc"), limit(1));

        const unsubLectures = onSnapshot(qLectures, (snapshot) => {
            setLectures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubQuiz = onSnapshot(qQuiz, (snapshot) => {
            if (!snapshot.empty) {
                setLatestQuiz({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            }
        });

        const unsubAssignment = onSnapshot(qAssignment, (snapshot) => {
            if (!snapshot.empty) {
                setLatestAssignment({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            }
            setLoading(false);
        });

        return () => {
            unsubLectures();
            unsubQuiz();
            unsubAssignment();
        };
    }, []);

    const filteredLectures = lectures.filter(l =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
            {/* Welcome Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-2"
                    >
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-primary font-bold tracking-wide text-sm">أهلاً بك مجدداً</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-slate-900"
                    >
                        مرحباً، {userData?.name?.split(" ")[0] || "طالبنا العزيز"} 👋
                    </motion.h1>
                    <p className="text-slate-500 mt-3 font-medium text-lg">
                        جاهز لتكمل رحلتك التعليمية اليوم؟
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="ابحث عن محاضرة..."
                        className="pl-12 h-14 rounded-2xl border-2 border-slate-100 bg-white shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-lg font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </section>

            {/* Highlights (Quiz & Assignment) */}
            <section className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-8 bg-blue-600 rounded-full" />
                        آخر واجب
                    </h2>
                    {loading ? (
                        <Skeleton className="h-70 w-full rounded-3xl" />
                    ) : latestAssignment ? (
                        <AssignmentCard assignment={latestAssignment} />
                    ) : (
                        <div className="h-70late-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-3">
                            <BookOpen className="w-10 h-10 opacity-30" />
                            <p className="font-bold">لا يوجد واجبات حالياً</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-8 bg-orange-500 rounded-full" />
                        آخر أختبار
                    </h2>
                    {loading ? (
                        <Skeleton className="h-70 w-full rounded-3xl" />
                    ) : latestQuiz ? (
                        <QuizCard quiz={latestQuiz} />
                    ) : (
                        <div className="h-70 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Sparkles className="w-10 h-10 opacity-30" />
                            <p className="font-bold">لا توجد اختبارات متاحة</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Lectures List */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900">المحاضرات الدراسية</h2>
                    <span className="text-sm font-bold text-slate-400">{filteredLectures.length} محاضرة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-3xl" />)
                        ) : filteredLectures.length > 0 ? (
                            filteredLectures.map((lecture, index) => (
                                <motion.div
                                    key={lecture.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <LectureCard lecture={lecture} />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-20 text-center space-y-4"
                            >
                                <div className="text-slate-300 flex justify-center italic text-4xl font-black">
                                    لا توجد نتائج
                                </div>
                                <p className="text-slate-400 font-medium">جرب البحث بكلمة مفتاحية أخرى</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
}