"use client"
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useAuth from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    BookOpen,
    Timer,
    TrendingUp,
    ChevronLeft,
    FileText,
    CheckCircle2,
    ArrowRight,
    Search,
    Clock,
    Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function GradesPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("quizzes");
    const [stats, setStats] = useState({
        overall: 0,
        assignmentsAvg: 0,
        quizzesAvg: 0,
        assignmentsCount: 0,
        quizzesCount: 0
    });
    const [history, setHistory] = useState({
        assignments: [],
        quizzes: []
    });

    useEffect(() => {
        const fetchGrades = async () => {
            if (!user) return;

            try {
                // Fetch All Submissions
                const [asmSnap, quizSnap] = await Promise.all([
                    getDocs(query(collection(db, "assignmentsResult"), where("userId", "==", user.uid), orderBy("submittedAt", "desc"))),
                    getDocs(query(collection(db, "quizzesResult"), where("userId", "==", user.uid), orderBy("submittedAt", "desc")))
                ]);

                const asmData = [];
                const quizData = [];

                // Enrich with titles (since results only have IDs)
                const asmPromises = asmSnap.docs.map(async (d) => {
                    const data = d.data();
                    const taskDoc = await getDoc(doc(db, "assignments", data.assignmentId));
                    return { id: d.id, ...data, title: taskDoc.exists() ? taskDoc.data().title : "واجب محذوف" };
                });

                const quizPromises = quizSnap.docs.map(async (d) => {
                    const data = d.data();
                    const taskDoc = await getDoc(doc(db, "quizzes", data.quizId));
                    return { id: d.id, ...data, title: taskDoc.exists() ? taskDoc.data().title : "اختبار محذوف" };
                });

                const fullAsm = await Promise.all(asmPromises);
                const fullQuiz = await Promise.all(quizPromises);

                setHistory({ assignments: fullAsm, quizzes: fullQuiz });

                // Calculate Stats
                const totalAsmPoints = fullAsm.reduce((acc, curr) => acc + curr.totalPoints, 0);
                const earnedAsmPoints = fullAsm.reduce((acc, curr) => acc + curr.score, 0);

                const totalQuizPoints = fullQuiz.reduce((acc, curr) => acc + curr.totalPoints, 0);
                const earnedQuizPoints = fullQuiz.reduce((acc, curr) => acc + curr.score, 0);

                const asmAvg = totalAsmPoints > 0 ? (earnedAsmPoints / totalAsmPoints) * 100 : 0;
                const quizAvg = totalQuizPoints > 0 ? (earnedQuizPoints / totalQuizPoints) * 100 : 0;

                const overall = (totalAsmPoints + totalQuizPoints) > 0
                    ? ((earnedAsmPoints + earnedQuizPoints) / (totalAsmPoints + totalQuizPoints)) * 100
                    : 0;

                setStats({
                    overall: Math.round(overall),
                    assignmentsAvg: Math.round(asmAvg),
                    quizzesAvg: Math.round(quizAvg),
                    assignmentsCount: fullAsm.length,
                    quizzesCount: fullQuiz.length
                });

            } catch (err) {
                console.error("Error fetching grades:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, [user]);

    const formatDate = (date) => {
        const d = date?.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString("ar-EG", { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 text-right" dir="rtl">
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
            </div>
            <Skeleton className="h-96 rounded-3xl w-full" />
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 text-right mb-20" dir="rtl">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-black text-slate-900"
                    >
                        سجل الدرجات 🏆
                    </motion.h1>
                    <p className="text-slate-500 font-bold mt-2">مرآة أداؤك الأكاديمي وتطورك في المنصة</p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-primary/5 text-primary px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-2 font-black text-sm">
                        <TrendingUp className="w-4 h-4" />
                        مستوى تصاعدي
                    </div>
                </div>
            </section>

            {/* Top Stats Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="المعدل التراكمي العام"
                    value={`${stats.overall}%`}
                    subtitle="إجمالي مستواك في المجموع"
                    icon={<Target className="w-6 h-6 text-blue-600" />}
                    gradient="from-blue-50 to-white border-blue-100"
                    progress={stats.overall}
                    progressColor="bg-blue-600"
                />
                <StatCard
                    title="متوسط الواجبات"
                    value={`${stats.assignmentsAvg}%`}
                    subtitle={`${stats.assignmentsCount} واجب تم تسليمه`}
                    icon={<BookOpen className="w-6 h-6 text-purple-600" />}
                    gradient="from-purple-50 to-white border-purple-100"
                    progress={stats.assignmentsAvg}
                    progressColor="bg-purple-600"
                />
                <StatCard
                    title="متوسط الاختبارات"
                    value={`${stats.quizzesAvg}%`}
                    subtitle={`${stats.quizzesCount} اختبار مكتمل`}
                    icon={<Trophy className="w-6 h-6 text-orange-600" />}
                    gradient="from-orange-50 to-white border-orange-100"
                    progress={stats.quizzesAvg}
                    progressColor="bg-orange-600"
                />
            </section>

            {/* Detailed History Table */}
            <section className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
                        <TabButton
                            active={activeTab === "quizzes"}
                            onClick={() => setActiveTab("quizzes")}
                            icon={<Trophy className="w-4 h-4" />}
                            label="الاختبارات"
                        />
                        <TabButton
                            active={activeTab === "assignments"}
                            onClick={() => setActiveTab("assignments")}
                            icon={<FileText className="w-4 h-4" />}
                            label="الواجبات"
                        />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 hidden md:block">سجل النشاطات المفصل</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 text-slate-400 font-black text-xs uppercase tracking-widest text-[10px]">المهمة</th>
                                <th className="p-6 text-slate-400 font-black text-xs uppercase tracking-widest text-[10px]">تاريخ التسليم</th>
                                <th className="p-6 text-slate-400 font-black text-xs uppercase tracking-widest text-[10px]">الدرجة</th>
                                <th className="p-6 text-slate-400 font-black text-xs uppercase tracking-widest text-[10px]">الحالة</th>
                                <th className="p-6 text-slate-400 font-black text-xs uppercase tracking-widest text-[10px]">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence mode="wait">
                                {history[activeTab].length > 0 ? history[activeTab].map((item, idx) => (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="p-6">
                                            <div className="font-black text-slate-900 group-hover:text-primary transition-colors cursor-pointer">
                                                {item.title}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                                <Clock className="w-4 h-4 text-slate-300" />
                                                {formatDate(item.submittedAt)}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-black text-slate-900 text-lg">
                                                {item.score} <span className="text-slate-300 text-sm font-bold">/ {item.totalPoints}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-black w-fit">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                تم التصحيح
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="font-black text-slate-400 hover:text-primary group-hover:bg-primary/5 rounded-xl gap-2 pr-0"
                                            >
                                                <Link href={`/study-content/${activeTab === 'quizzes' ? 'quizzes' : 'assignments'}/${activeTab === 'quizzes' ? item.quizId : item.assignmentId}/${item.id}/revision`}>
                                                    عرض التفاصيل
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center">
                                            <FileText className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                            <p className="text-slate-300 font-bold text-xl">لا توجد بيانات متاحة بعد</p>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Progress Chart Simulation */}
            <section className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex justify-between items-center mb-10">
                    <Button variant="outline" className="rounded-2xl font-black gap-2">
                        آخر 10 نشاطات
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-slate-800">منحنى التطور</h2>
                        <p className="text-slate-400 font-bold text-sm">تتبع تقدمك في آخر النشاطات</p>
                    </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-4 px-4 pt-4 border-b-2 border-slate-100 relative">
                    {/* Horizontal grid lines */}
                    {[0, 25, 50, 75, 100].map(val => (
                        <div key={val} className="absolute left-0 right-0 border-t border-slate-50 flex items-center gap-2 pointer-events-none" style={{ bottom: `${val}%` }}>
                            <span className="text-[10px] font-black text-slate-200 pr-2">{val}%</span>
                        </div>
                    ))}

                    {/* Bars - Last 10 results */}
                    {history.quizzes.slice(0, 5).concat(history.assignments.slice(0, 5)).sort((a, b) => a.submittedAt - b.submittedAt).map((item, i) => {
                        const h = (item.score / item.totalPoints) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group relative z-10 h-full justify-end">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.1, type: "spring" }}
                                    className={cn(
                                        "w-full max-w-10 rounded-t-xl transition-all relative overflow-hidden",
                                        item.quizId ? "bg-orange-400/80 hover:bg-orange-500" : "bg-blue-400/80 hover:bg-blue-500"
                                    )}
                                >
                                    <div className="absolute top-0 left-0 right-0 h-2 bg-white/20" />
                                </motion.div>
                                <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg z-20">
                                    {Math.round(h)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-center gap-8 mt-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-400 rounded-full" />
                        <span className="text-xs font-black text-slate-400">اختبارات</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full" />
                        <span className="text-xs font-black text-slate-400">واجبات</span>
                    </div>
                </div>
            </section>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, gradient, progress, progressColor }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn("bg-white p-8 rounded-[2.5rem] border-2 shadow-xl shadow-slate-200/40 space-y-4", gradient)}
        >
            <div className="flex justify-between items-start">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    {icon}
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
            </div>
            <div>
                <h3 className="font-black text-slate-800 text-lg mb-1">{title}</h3>
                <p className="text-slate-400 font-bold text-xs">{subtitle}</p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={cn("h-full", progressColor)}
                />
            </div>
        </motion.div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-black transition-all",
                active
                    ? "bg-white text-primary shadow-md"
                    : "text-slate-400 hover:text-slate-600"
            )}
        >
            {icon}
            <span className="text-sm">{label}</span>
        </button>
    );
}