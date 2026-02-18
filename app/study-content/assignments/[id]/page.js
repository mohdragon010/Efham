"use client"
import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useAuth from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
    FileText,
    ArrowRight,
    PlayCircle,
    RotateCcw,
    Trophy,
    HelpCircle,
    Calendar,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AssignmentDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !id) return;

            try {
                // 1. Fetch Assignment
                const asmSnap = await getDoc(doc(db, "assignments", id));
                if (asmSnap.exists()) {
                    setAssignment({ id: asmSnap.id, ...asmSnap.data() });
                } else {
                    router.push("/study-content/assignments");
                    return;
                }

                // 2. Fetch All User Submissions for this assignment
                const qSub = query(
                    collection(db, "assignmentsResult"),
                    where("assignmentId", "==", id),
                    where("userId", "==", user.uid),
                    orderBy("submittedAt", "desc")
                );
                const subSnap = await getDocs(qSub);
                setSubmissions(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, id]);

    if (loading) {
        return (
            <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 text-right" dir="rtl">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
        );
    }

    if (!assignment) return null;

    const formatDate = (date) => {
        const d = date?.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString("ar-EG", {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const hasSubmissions = submissions.length > 0;
    const bestScore = hasSubmissions ? Math.max(...submissions.map(s => s.score)) : 0;

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto text-right" dir="rtl">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <Button variant="ghost" asChild className="mb-4 hover:bg-slate-100 rounded-xl gap-2 text-slate-500">
                    <Link href="/study-content/assignments">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للواجبات
                    </Link>
                </Button>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{assignment.title}</h1>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-12">
                <div className="space-y-8">
                    <Card className="border-2 border-slate-100 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                            <div className="flex flex-wrap gap-4 items-center justify-between">
                                <div className="space-y-1 text-right">
                                    <CardTitle className="text-2xl font-bold text-slate-800">تفاصيل الواجب</CardTitle>
                                    <p className="text-slate-500 font-medium text-sm">يرجى قراءة التعليمات بعناية قبل البدء</p>
                                </div>
                                <div className="bg-blue-600/10 text-blue-600 px-4 py-2 rounded-2xl font-bold text-sm">
                                    {assignment.questions?.length || 0} أسئلة
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 leading-relaxed font-bold text-slate-700">
                                {assignment.description}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg"><Calendar className="w-5 h-5 text-orange-600" /></div>
                                        <span className="text-slate-400 font-bold text-xs">الموعد النهائي</span>
                                    </div>
                                    <span className="font-black text-orange-700 text-sm">{formatDate(assignment.deadline)}</span>
                                </div>
                                <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg"><Trophy className="w-5 h-5 text-purple-600" /></div>
                                        <span className="text-slate-400 font-bold text-xs">أفضل درجة</span>
                                    </div>
                                    <span className="font-black text-purple-700 text-sm">{bestScore} / {assignment.totalPoints}</span>
                                </div>
                            </div>

                            <div className="flex justify-center pt-4">
                                <Button
                                    onClick={() => router.push(`/study-content/assignments/${assignment.id}/start`)}
                                    className="px-10 py-8 text-xl font-black rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex gap-3 hover:scale-105"
                                >
                                    <PlayCircle className="w-6 h-6" />
                                    {hasSubmissions ? "إعادة محاولة الواجب" : "ابدأ الواجب الآن"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Previous Attempts Section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <Clock className="w-6 h-6 text-slate-400" />
                            محاولاتك السابقة
                        </h2>

                        <div className="space-y-4">
                            {hasSubmissions ? submissions.map((sub, idx) => (
                                <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 border border-slate-100">
                                            #{submissions.length - idx}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-slate-800">{formatDate(sub.submittedAt)}</div>
                                            <div className="text-xs font-bold text-slate-400">تاريخ التسليم</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-primary">{sub.score} / {sub.totalPoints}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">النتيجة</div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" asChild className="rounded-xl font-bold hover:bg-slate-50 border-2">
                                                <Link href={`/study-content/assignments/${id}/${sub.id}/result`}>النتيجة</Link>
                                            </Button>
                                            <Button size="sm" asChild className="rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white">
                                                <Link href={`/study-content/assignments/${id}/${sub.id}/revision`}>مراجعة</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold">لم تقم بأي محاولة لهذا الواجب بعد</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar info (now at bottom) */}
                <div className="p-8 bg-linear-to-br from-primary to-primary/80 rounded-3xl text-white shadow-xl shadow-primary/20">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Trophy className="w-12 h-12 opacity-50 shrink-0" />
                        <div className="text-center md:text-right">
                            <h3 className="text-xl font-bold mb-2">كن من المتفوقين!</h3>
                            <p className="text-primary-foreground/80 font-medium text-sm leading-relaxed">
                                كل محاولة هي فرصة جديدة للتعلم. راجع أخطاءك جيداً قبل إعادة المحاولة لضمان الحصول على الدرجة النهائية.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
