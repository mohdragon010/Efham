"use client"
import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useAuth from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
    Timer,
    ArrowRight,
    PlayCircle,
    Trophy,
    HelpCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Search,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function QuizDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [quiz, setQuiz] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !id) return;

            try {
                // 1. Fetch Quiz
                const qSnap = await getDoc(doc(db, "quizzes", id));
                if (qSnap.exists()) {
                    setQuiz({ id: qSnap.id, ...qSnap.data() });
                } else {
                    router.push("/study-content/quizzes");
                    return;
                }

                // 2. Fetch User Submission for this quiz
                const qSub = query(
                    collection(db, "quizzesResult"),
                    where("quizId", "==", id),
                    where("userId", "==", user.uid)
                );
                const subSnap = await getDocs(qSub);
                if (!subSnap.empty) {
                    setSubmission({ id: subSnap.docs[0].id, ...subSnap.docs[0].data() });
                }

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

    if (!quiz) return null;

    const formatDate = (date) => {
        const d = date?.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString("ar-EG", {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const hasSubmission = !!submission;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto text-right" dir="rtl">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <Button variant="ghost" asChild className="mb-4 hover:bg-slate-100 rounded-xl gap-2 text-slate-500">
                    <Link href="/study-content/quizzes">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة لجميع الاختبارات
                    </Link>
                </Button>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{quiz.title}</h1>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-2 border-orange-100 shadow-xl shadow-orange-100/20 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-orange-50/30 border-b border-orange-100 p-8">
                            <div className="flex flex-wrap gap-4 items-center justify-between">
                                <div className="space-y-1 text-right">
                                    <CardTitle className="text-2xl font-bold text-slate-800">تعليمات الاختبار</CardTitle>
                                    <p className="text-orange-600 font-bold text-sm">تنبيه: لا يمكن إعادة هذا الاختبار بعد التسليم</p>
                                </div>
                                <div className="bg-orange-500 text-white px-4 py-2 rounded-2xl font-bold text-sm flex items-center gap-2">
                                    <Timer className="w-4 h-4" />
                                    {quiz.duration} دقيقة
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 leading-relaxed font-bold text-slate-700">
                                {quiz.description}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg"><HelpCircle className="w-5 h-5 text-blue-600" /></div>
                                        <span className="text-slate-400 font-bold text-xs">عدد الأسئلة</span>
                                    </div>
                                    <span className="font-black text-blue-700 text-sm">{quiz.questions?.length || 0} أسئلة</span>
                                </div>
                                <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg"><Trophy className="w-5 h-5 text-purple-600" /></div>
                                        <span className="text-slate-400 font-bold text-xs">إجمالي الدرجات</span>
                                    </div>
                                    <span className="font-black text-purple-700 text-sm">{quiz.totalPoints} نقطة</span>
                                </div>
                            </div>

                            <div className="flex justify-center pt-4">
                                {hasSubmission ? (
                                    <div className="flex gap-4">
                                        <Button
                                            asChild
                                            className="px-10 py-8 text-xl font-black rounded-2xl bg-slate-900 hover:bg-black shadow-xl transition-all gap-3"
                                        >
                                            <Link href={`/study-content/quizzes/${id}/${submission.id}/result`}>
                                                <Trophy className="w-6 h-6" />
                                                عرض نتيجتك
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="px-10 py-8 text-xl font-black rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-all gap-3"
                                        >
                                            <Link href={`/study-content/quizzes/${id}/${submission.id}/revision`}>
                                                <Search className="w-6 h-6" />
                                                مراجعة الحل
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => router.push(`/study-content/quizzes/${quiz.id}/start`)}
                                        className="px-12 py-8 text-xl font-black rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all flex gap-3 hover:scale-105"
                                    >
                                        <PlayCircle className="w-6 h-6" />
                                        ابدأ الاختبار الآن
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar info */}
                <div className="space-y-6">
                    <div className="p-8 bg-linear-to-br from-orange-500 to-orange-600 rounded-3xl text-white shadow-xl shadow-orange-200">
                        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">تنبيه هام!</h3>
                        <p className="text-orange-50 font-medium text-sm leading-relaxed">
                            هذا اختبار رسمي. بمجرد البدء، لا يمكنك التراجع أو إعادة المحاولة. تأكد من استقرار اتصال الإنترنت لديك ومن جاهزيتك التامة قبل الضغط على زر البدء.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
