"use client"
import { useState, useEffect, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
    Trophy,
    XCircle,
    ArrowRight,
    RotateCcw,
    FileText,
    Percent,
    CheckCircle2,
    Share2,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from 'canvas-confetti';

export default function ResultPage({ params }) {
    const { id, submissionId } = use(params);
    const router = useRouter();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            if (!submissionId) return;
            const resSnap = await getDoc(doc(db, "assignmentsResult", submissionId));
            if (resSnap.exists()) {
                const data = resSnap.data();
                setResult(data);

                // WOW effect: Confetti if score > 70%
                if ((data.score / data.totalPoints) >= 0.7) {
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335']
                    });
                }
            }
            setLoading(false);
        };
        fetchResult();
    }, [submissionId]);

    if (loading) return (
        <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6 text-right" dir="rtl">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
    );

    if (!result) return (
        <div className="p-20 text-center">
            <p className="text-slate-400 font-bold text-xl">نتيجة الاختبار غير موجودة</p>
            <Button asChild className="mt-4"><Link href="/study-content/assignments">العودة للواجبات</Link></Button>
        </div>
    );

    const percentage = Math.round((result.score / result.totalPoints) * 100);
    const isExcellent = percentage >= 85;
    const isPass = percentage >= 50;

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto text-right" dir="rtl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center space-y-8 py-12"
            >
                {/* Main Score Circle */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="128"
                            cy="128"
                            r="120"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="transparent"
                            className="text-slate-100"
                        />
                        <motion.circle
                            cx="128"
                            cy="128"
                            r="120"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="transparent"
                            strokeDasharray={754}
                            initial={{ strokeDashoffset: 754 }}
                            animate={{ strokeDashoffset: 754 - (754 * percentage) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={isExcellent ? "text-green-500" : isPass ? "text-blue-500" : "text-red-500"}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-6xl font-black text-slate-900"
                        >
                            {percentage}%
                        </motion.div>
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">المعدل</div>
                    </div>
                </div>

                {/* Verdict Message */}
                <div className="text-center space-y-3">
                    <h1 className="text-4xl font-black text-slate-900">
                        {isExcellent ? "عمل مذهل يا بطل! 🚀" : isPass ? "أحسنت صنعاً! 👍" : "محاولة جيدة، يمكنك التحسن 📚"}
                    </h1>
                    <p className="text-slate-500 font-bold text-lg max-w-md mx-auto">
                        لقد حصلت على {result.score} من أصل {result.totalPoints} في هذا الواجب.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-2xl text-green-600"><CheckCircle2 /></div>
                            <div>
                                <div className="font-black text-slate-800">{result.answers.filter(a => a.isCorrect).length}</div>
                                <div className="text-xs font-bold text-slate-400">إجابات صحيحة</div>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-green-500 opacity-20">SCORE</div>
                    </div>
                    <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 rounded-2xl text-red-600"><XCircle /></div>
                            <div>
                                <div className="font-black text-slate-800">{result.wrongQuestionIds.length}</div>
                                <div className="text-xs font-bold text-slate-400">إجابات خاطئة</div>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-red-500 opacity-20">LOST</div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl pt-8">
                    <Button
                        asChild
                        className="text-neutral-200 flex-1 py-8 text-xl font-black rounded-3xl bg-slate-900 hover:bg-black shadow-xl transition-all gap-3"
                    >
                        <Link href={`/study-content/assignments/${id}/${submissionId}/revision`}>
                            <Search className="w-6 h-6" />
                            مراجعة أخطائك
                        </Link>
                    </Button>
                    <div className="flex gap-4 flex-1">
                        <Button
                            asChild
                            variant="outline"
                            className="flex-1 py-8 text-xl font-black rounded-3xl border-2 hover:bg-slate-50 gap-3"
                        >
                            <Link href={`/study-content/assignments/${id}/start`}>
                                <RotateCcw className="w-6 h-6" />
                                إعادة الاختبار
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="ghost"
                            className="py-8 px-6 rounded-3xl text-slate-400 hover:text-slate-900"
                        >
                            <Link href="/study-content/assignments">
                                <ArrowRight className="w-6 h-6" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
