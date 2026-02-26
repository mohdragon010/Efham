"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
    Users, BookOpen, FileText, GraduationCap,
    TrendingUp, Clock, AlertCircle, HelpCircle, BarChart3,
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

function StatCard({ title, value, subtitle, icon, iconBg, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="rounded-2xl p-6 border border-slate-100 bg-white flex flex-col gap-4 shadow-sm shadow-slate-200/50"
        >
            <div className="flex items-start justify-between">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
                    {icon}
                </div>
                <span className="text-3xl font-black text-slate-900">{value ?? "—"}</span>
            </div>
            <div>
                <p className="font-bold text-slate-800 text-sm">{title}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{subtitle}</p>
            </div>
        </motion.div>
    );
}

function ActivityItem({ type, time, score, totalPoints }) {
    return (
        <div className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                type === "quiz" ? "bg-orange-500/10" : "bg-blue-500/10"
            )}>
                {type === "quiz"
                    ? <HelpCircle className="w-4 h-4 text-orange-600" />
                    : <FileText className="w-4 h-4 text-blue-600" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{type === "quiz" ? "اختبار" : "واجب"} · {time}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-800 font-bold text-sm">تم الحل والمراجعة</span>
                </div>
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                {score} / {totalPoints}
            </span>
        </div>
    );
}

export default function AdminStatsPage() {
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const fetchAll = async () => {
            try {
                const [
                    usersSnap,
                    lecturesSnap,
                    assignmentsSnap,
                    quizzesSnap,
                    asmResultSnap,
                    quizResultSnap,
                ] = await Promise.all([
                    getDocs(collection(db, "users")),
                    getDocs(collection(db, "lectures")),
                    getDocs(collection(db, "assignments")),
                    getDocs(collection(db, "quizzes")),
                    getDocs(query(collection(db, "assignmentsResult"), orderBy("submittedAt", "desc"), limit(5))),
                    getDocs(query(collection(db, "quizzesResult"), orderBy("submittedAt", "desc"), limit(5))),
                ]);

                if (cancelled) return;

                setStats({
                    students: usersSnap.size,
                    lectures: lecturesSnap.size,
                    assignments: assignmentsSnap.size,
                    quizzes: quizzesSnap.size,
                });

                const formatTime = (ts) => {
                    if (!ts?.toDate) return "—";
                    return ts.toDate().toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
                };

                const items = [
                    ...asmResultSnap.docs.map(d => ({ ...d.data(), id: d.id, type: "assignment" })),
                    ...quizResultSnap.docs.map(d => ({ ...d.data(), id: d.id, type: "quiz" })),
                ].sort((a, b) => {
                    const at = a.submittedAt?.toDate?.() ?? new Date(0);
                    const bt = b.submittedAt?.toDate?.() ?? new Date(0);
                    return bt - at;
                }).slice(0, 8).map(item => ({
                    ...item,
                    time: formatTime(item.submittedAt),
                }));

                setRecentActivity(items);
            } catch (e) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchAll();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />)}
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
                    <div className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-screen gap-4">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <p className="text-slate-900 font-black text-xl">فشل تحميل البيانات</p>
                <p className="text-slate-500 text-sm text-center max-w-sm font-bold">
                    {error.includes("permission") || error.includes("permissions")
                        ? "تأكد من نشر قواعد Firestore الجديدة: firebase deploy --only firestore:rules"
                        : error}
                </p>
                <button onClick={() => window.location.reload()} className="bg-violet-600 text-white px-6 py-2 rounded-xl font-black text-sm hover:shadow-lg transition-all">
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    const statCards = [
        {
            title: "إجمالي الطلاب",
            value: stats.students,
            subtitle: "مستخدم مسجل في المنصة",
            icon: <Users className="w-5 h-5 text-sky-600" />,
            iconBg: "bg-sky-50 shadow-sm shadow-sky-100",
        },
        {
            title: "المحاضرات المنشورة",
            value: stats.lectures,
            subtitle: "محاضرة في المكتبة",
            icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
            iconBg: "bg-indigo-50 shadow-sm shadow-indigo-100",
        },
        {
            title: "الواجبات / الاختبارات",
            value: `${stats.assignments} / ${stats.quizzes}`,
            subtitle: "إجمالي المهام المنشأة",
            icon: <GraduationCap className="w-5 h-5 text-emerald-600" />,
            iconBg: "bg-emerald-50 shadow-sm shadow-emerald-100",
        },
    ];

    return (
        <div className="p-8 space-y-8 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">لوحة الإحصائيات</h1>
                    <p className="text-slate-400 text-sm font-bold mt-1 tracking-tight uppercase">مراقبة أداء المنصة والنشاط العام</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تحديث تلقائي</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card, i) => (
                    <StatCard key={i} {...card} delay={i * 0.08} />
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-200/40"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-violet-50 flex items-center justify-center">
                                <TrendingUp className="w-4.5 h-4.5 text-violet-600" />
                            </div>
                            <h2 className="text-slate-900 font-black text-lg">آخر التسليمات</h2>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">التصحيح آلي</span>
                    </div>
                    {recentActivity.length === 0 ? (
                        <div className="py-16 text-center">
                            <Clock className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-300 font-bold text-lg">لا توجد تسليمات بعد</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {recentActivity.map((item) => (
                                <ActivityItem key={item.id} type={item.type} time={item.time} score={item.score} totalPoints={item.totalPoints} />
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-200/40"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-9 h-9 rounded-2xl bg-sky-50 flex items-center justify-center">
                            <BarChart3 className="w-4.5 h-4.5 text-sky-600" />
                        </div>
                        <h2 className="text-slate-900 font-black text-lg">إجراءات سريعة</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { href: "/admin/content", label: "أضف محاضرة", icon: BookOpen, color: "text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100" },
                            { href: "/admin/assignments", label: "أضف واجب", icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100" },
                            { href: "/admin/quizzes", label: "أضف اختبار", icon: HelpCircle, color: "text-orange-600 bg-orange-50 border-orange-100 hover:bg-orange-100" },
                            { href: "/admin/students", label: "إدارة الطلاب", icon: Users, color: "text-pink-600 bg-pink-50 border-pink-100 hover:bg-pink-100" },
                        ].map(({ href, label, icon: Icon, color }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn("flex items-center gap-3 p-4 rounded-2xl border transition-all group", color)}
                            >
                                <Icon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">{label}</span>
                                <ChevronLeft className="w-4 h-4 mr-auto opacity-40" />
                            </Link>
                        ))}
                    </div>
                    {/* Visual Placeholder for more stats */}
                    <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                        <p className="text-slate-300 font-bold text-xs">احصائيات إضافية قريباً ⚡</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
