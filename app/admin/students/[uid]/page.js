"use client";
import { useState, useEffect } from "react";
import {
    doc, getDoc, collection, query, where, getDocs, orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
    User, Phone, Mail, Shield, Calendar, Trophy,
    FileText, BookOpen, ArrowRight, Loader2, Ban,
    CheckCircle2, Clock, Star, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { use } from "react";

function formatDate(ts) {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

function StatChip({ value, label, icon: Icon, color, subColor }) {
    return (
        <div className={cn("rounded-3xl p-6 border bg-white shadow-sm flex flex-col gap-3", color)}>
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", subColor)}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-3xl font-black text-slate-900">{value ?? "—"}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</p>
            </div>
        </div>
    );
}

export default function StudentProfilePage({ params }) {
    const { uid } = use(params);
    const [student, setStudent] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [userDoc, asmSnap, quizSnap] = await Promise.all([
                    getDoc(doc(db, "users", uid)),
                    getDocs(query(collection(db, "assignmentsResult"), where("userId", "==", uid), orderBy("submittedAt", "desc"))),
                    getDocs(query(collection(db, "quizzesResult"), where("userId", "==", uid), orderBy("submittedAt", "desc"))),
                ]);

                if (userDoc.exists()) {
                    setStudent({ id: userDoc.id, ...userDoc.data() });
                }

                const asmData = await Promise.all(asmSnap.docs.map(async d => {
                    const data = d.data();
                    const taskDoc = await getDoc(doc(db, "assignments", data.assignmentId));
                    return { id: d.id, ...data, title: taskDoc.exists() ? taskDoc.data().title : "واجب محذوف" };
                }));

                const quizData = await Promise.all(quizSnap.docs.map(async d => {
                    const data = d.data();
                    const taskDoc = await getDoc(doc(db, "quizzes", data.quizId));
                    return { id: d.id, ...data, title: taskDoc.exists() ? taskDoc.data().title : "اختبار محذوف" };
                }));

                setAssignments(asmData);
                setQuizzes(quizData);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [uid]);

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-48 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white border border-slate-100 rounded-3xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-8 text-center py-32 bg-white rounded-[3rem] border border-slate-50 m-8">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <User className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-slate-900 font-black text-2xl mb-2">عذراً، الطالب غير موجود</h3>
                <p className="text-slate-400 font-bold mb-8">ربما تم حذف الحساب أو الرابط غير صحيح</p>
                <Link href="/admin/students">
                    <Button className="bg-slate-900 hover:bg-black text-white px-8 h-12 rounded-xl font-black">العودة لقائمة الطلاب</Button>
                </Link>
            </div>
        );
    }

    const avgAssignment = assignments.length > 0
        ? Math.round(assignments.reduce((s, a) => s + ((a.score / a.totalPoints) * 100), 0) / assignments.length)
        : null;
    const avgQuiz = quizzes.length > 0
        ? Math.round(quizzes.reduce((s, q) => s + ((q.score / q.totalPoints) * 100), 0) / quizzes.length)
        : null;

    const chartItems = [
        ...assignments.slice(0, 5).map(a => ({ ...a, type: "assignment" })),
        ...quizzes.slice(0, 5).map(q => ({ ...q, type: "quiz" })),
    ].sort((a, b) => {
        const at = a.submittedAt?.toDate?.() ?? new Date(0);
        const bt = b.submittedAt?.toDate?.() ?? new Date(0);
        return at - bt;
    });

    return (
        <div className="p-8 space-y-8 min-h-screen">
            <Link href="/admin/students">
                <div className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all text-xs font-black uppercase tracking-widest group w-fit">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
                    العودة للقائمة
                </div>
            </Link>

            {/* Profile Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-violet-50/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative">
                    <div className={cn(
                        "w-24 h-24 rounded-[2rem] flex items-center justify-center text-3xl font-black shrink-0 shadow-lg border-4 border-white",
                        student.role === "admin" ? "bg-violet-600 text-white" : "bg-slate-900 text-white"
                    )}>
                        {student.name?.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{student.name}</h1>
                            <div className="flex gap-2">
                                <span className={cn(
                                    "text-[10px] font-black px-3 py-1 rounded-lg border",
                                    student.role === "admin" ? "bg-violet-50 border-violet-100 text-violet-600" : "bg-slate-50 border-slate-100 text-slate-500"
                                )}>
                                    {student.role === "admin" ? "مشرف" : "طالب"}
                                </span>
                                {student.isBanned && (
                                    <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-red-50 border border-red-100 text-red-500 flex items-center gap-1">
                                        <Ban className="w-3 h-3" /> محظور
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Mail className="w-4 h-4" />
                                </div>
                                {student.email}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Phone className="w-4 h-4" />
                                </div>
                                {student.phoneNumber || "—"}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                انضم في {formatDate(student.createdAt)}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatChip value={assignments.length} label="واجبات مكتملة" icon={FileText} color="border-blue-50" subColor="bg-blue-50 text-blue-600" />
                <StatChip value={quizzes.length} label="اختبارات منجزة" icon={Trophy} color="border-orange-50" subColor="bg-orange-50 text-orange-600" />
                <StatChip value={avgAssignment !== null ? `%${avgAssignment}` : "—"} label="كفاءة الواجبات" icon={TrendingUp} color="border-indigo-50" subColor="bg-indigo-50 text-indigo-600" />
                <StatChip value={avgQuiz !== null ? `%${avgQuiz}` : "—"} label="كفاءة الاختبارات" icon={Star} color="border-emerald-50" subColor="bg-emerald-50 text-emerald-600" />
            </div>

            {/* Analytics Section */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Curve Card */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-slate-900 font-black text-xl">منحنى الأداء التعليمي</h2>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-[10px] font-black text-slate-400 uppercase">واجبات</span></div>
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /><span className="text-[10px] font-black text-slate-400 uppercase">اختبارات</span></div>
                        </div>
                    </div>

                    {chartItems.length === 0 ? (
                        <div className="h-48 flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-300 font-bold">لا تتوفر بيانات كافية للتحليل</p>
                        </div>
                    ) : (
                        <div className="h-60 flex items-end gap-4 px-4 border-b border-slate-100 relative pt-10">
                            {[0, 50, 100].map(v => (
                                <div key={v} className="absolute left-0 right-0 border-t border-slate-50 pointer-events-none" style={{ bottom: `${v}%` }}>
                                    <span className="absolute -right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">{v}%</span>
                                </div>
                            ))}
                            {chartItems.map((item, i) => {
                                const h = Math.round((item.score / item.totalPoints) * 100);
                                return (
                                    <div key={i} className="flex-1 flex items-end justify-center group relative h-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                                            className={cn(
                                                "w-full rounded-t-2xl relative shadow-md transition-all group-hover:brightness-110",
                                                item.type === "quiz" ? "bg-orange-500" : "bg-blue-500"
                                            )}
                                        />
                                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl z-10 whitespace-nowrap transition-all shadow-xl">
                                            {h}% · {item.title}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Status Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
                        <h3 className="text-slate-900 font-black text-lg mb-6">أحدث النشاطات</h3>
                        <div className="space-y-6">
                            {[...assignments, ...quizzes].sort((a, b) => b.submittedAt?.toDate?.() - a.submittedAt?.toDate?.()).slice(0, 4).map((activity, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl shrink-0 flex items-center justify-center", activity.quizId ? "bg-orange-50" : "bg-blue-50")}>
                                        {activity.quizId ? <Trophy className="w-5 h-5 text-orange-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 font-bold text-sm truncate">{activity.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-slate-400 text-[10px] font-bold">{formatDate(activity.submittedAt)}</p>
                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                            <p className="text-emerald-600 text-[10px] font-black">% {Math.round((activity.score / activity.totalPoints) * 100)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {assignments.length === 0 && quizzes.length === 0 && (
                                <div className="text-center py-10">
                                    <Clock className="w-10 h-10 text-slate-100 mx-auto mb-2" />
                                    <p className="text-slate-300 font-bold text-xs">لا توجد نشاطات مسجلة</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Records */}
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-slate-900 font-black text-sm uppercase">سجل الواجبات</span>
                        </div>
                        <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-slate-400 border border-slate-100">{assignments.length} تسليم</span>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-100 overflow-y-auto custom-scrollbar">
                        {assignments.map(a => (
                            <div key={a.id} className="p-6 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-900 font-black text-sm mb-1 truncate">{a.title}</p>
                                    <p className="text-slate-400 text-[10px] font-bold">{formatDate(a.submittedAt)}</p>
                                </div>
                                <div className="text-left bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-slate-900 font-black text-xs">{a.score} / {a.totalPoints}</p>
                                    <p className={cn("text-[9px] font-black mt-0.5", ((a.score / a.totalPoints) * 100) >= 60 ? "text-emerald-600" : "text-red-500")}>
                                        {Math.round((a.score / a.totalPoints) * 100)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <span className="text-slate-900 font-black text-sm uppercase">سجل الاختبارات</span>
                        </div>
                        <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-slate-400 border border-slate-100">{quizzes.length} إنجاز</span>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-100 overflow-y-auto custom-scrollbar">
                        {quizzes.map(q => (
                            <div key={q.id} className="p-6 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-900 font-black text-sm mb-1 truncate">{q.title}</p>
                                    <p className="text-slate-400 text-[10px] font-bold">{formatDate(q.submittedAt)}</p>
                                </div>
                                <div className="text-left bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-slate-900 font-black text-xs">{q.score} / {q.totalPoints}</p>
                                    <p className={cn("text-[9px] font-black mt-0.5", ((q.score / q.totalPoints) * 100) >= 60 ? "text-emerald-600" : "text-red-500")}>
                                        {Math.round((q.score / q.totalPoints) * 100)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
