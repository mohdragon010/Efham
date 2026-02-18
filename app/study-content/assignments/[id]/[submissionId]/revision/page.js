"use client"
import { useState, useEffect, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    ArrowRight,
    Trophy,
    Info,
    ChevronLeft,
    RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function RevisionPage({ params }) {
    const { id, submissionId } = use(params);
    const [assignment, setAssignment] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!submissionId || !id) return;

            const [asmSnap, resSnap] = await Promise.all([
                getDoc(doc(db, "assignments", id)),
                getDoc(doc(db, "assignmentsResult", submissionId))
            ]);

            if (asmSnap.exists() && resSnap.exists()) {
                setAssignment(asmSnap.data());
                setResult(resSnap.data());
            }
            setLoading(false);
        };
        fetchData();
    }, [id, submissionId]);

    if (loading) return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6 text-right" dir="rtl">
            <Skeleton className="h-12 w-64 mb-8" />
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />)}
        </div>
    );

    if (!assignment || !result) return null;

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto text-right mb-12" dir="rtl">
            {/* Header Section */}
            <div className="mb-12">
                <Button variant="ghost" asChild className="mb-6 hover:bg-slate-100 rounded-xl gap-2 text-slate-500">
                    <Link href={`/study-content/assignments/${id}`}>
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للتفاصيل
                    </Link>
                </Button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">مراجعة الإجابات</h1>
                        <p className="text-slate-500 font-bold italic">حلل أخطاءك لتتعلم منها للمحاولات القادمة</p>
                    </div>
                    <div className="bg-white px-8 py-5 rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-black text-primary">{result.score} / {result.totalPoints}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">النتيجة</div>
                        </div>
                        <div className="h-10 w-px bg-slate-100" />
                        <Trophy className="w-8 h-8 text-primary/40" />
                    </div>
                </div>
            </div>

            {/* Questions Breakdown */}
            <div className="space-y-12">
                {assignment.questions.map((q, idx) => {
                    const userAnswer = result.answers.find(a => a.questionId === q.id);
                    const isCorrect = userAnswer?.isCorrect;

                    return (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className={cn(
                                "border-2 rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500",
                                isCorrect
                                    ? "border-green-100 shadow-green-200/20"
                                    : "border-red-100 shadow-red-200/20"
                            )}>
                                <div className={cn(
                                    "p-6 flex items-center justify-between border-b",
                                    isCorrect ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg",
                                            isCorrect ? "bg-green-500 shadow-green-500/20" : "bg-red-500 shadow-red-500/20"
                                        )}>
                                            {idx + 1}
                                        </span>
                                        <span className={cn(
                                            "font-black text-sm",
                                            isCorrect ? "text-green-700" : "text-red-700"
                                        )}>
                                            {isCorrect ? "إجابة صحيحة" : "إجابة خاطئة"}
                                        </span>
                                    </div>
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                        {q.points} نقاط
                                    </div>
                                </div>

                                <CardContent className="p-8 md:p-10">
                                    <h3 className="text-2xl font-black text-slate-800 mb-10 leading-snug">
                                        {q.text}
                                    </h3>

                                    <div className="grid gap-4">
                                        {q.options.map((option, optIdx) => {
                                            const isChosen = userAnswer?.selected === option;
                                            const isCorrectOption = q.correct === option;

                                            let stateClass = "border-slate-100 bg-white text-slate-600";
                                            if (isChosen && isCorrect) stateClass = "border-green-500 bg-green-500 text-white shadow-lg shadow-green-500/20";
                                            else if (isChosen && !isCorrect) stateClass = "border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/20";
                                            else if (!isChosen && isCorrectOption) stateClass = "border-green-500/30 bg-green-50 text-green-700 font-black";

                                            return (
                                                <div
                                                    key={optIdx}
                                                    className={cn(
                                                        "w-full p-6 py-5 rounded-2xl text-right font-bold border-2 transition-all flex items-center justify-between",
                                                        stateClass
                                                    )}
                                                >
                                                    <span>{option}</span>
                                                    <div className="flex items-center gap-2">
                                                        {isChosen && !isCorrect && <XCircle className="w-6 h-6" />}
                                                        {isCorrectOption && <CheckCircle2 className="w-6 h-6" />}
                                                        {!isChosen && !isCorrectOption && <div className="w-6 h-6 rounded-full border-2 border-slate-100" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Explanation Section - Always visible */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "mt-8 p-6 rounded-3xl border-2 border-dashed flex items-start gap-4 transition-colors",
                                            isCorrect ? "bg-green-50/30 border-green-100" : "bg-slate-50 border-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-xl shrink-0",
                                            isCorrect ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-600"
                                        )}>
                                            <Info className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className={cn(
                                                "font-black text-sm mb-1",
                                                isCorrect ? "text-green-800" : "text-slate-800"
                                            )}>
                                                توضيح تعليمي:
                                            </div>
                                            <p className={cn(
                                                "font-medium text-sm leading-relaxed",
                                                isCorrect ? "text-green-700/80" : "text-slate-500"
                                            )}>
                                                {q.explanation || `الإجابة الصحيحة هي "${q.correct}".`}
                                            </p>
                                        </div>
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="mt-16 flex flex-col sm:flex-row justify-center gap-4">
                <Button
                    asChild
                    className="px-10 py-8 text-xl font-black rounded-3xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all gap-3 hover:scale-105"
                >
                    <Link href={`/study-content/assignments/${id}/start`}>
                        <RotateCcw className="w-6 h-6" />
                        محاولة جديدة
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    asChild
                    className="px-10 py-8 text-xl font-black rounded-3xl border-2 border-slate-100 hover:bg-slate-50 transition-all"
                >
                    <Link href="/study-content/assignments">
                        العودة لقائمة الواجبات
                    </Link>
                </Button>
            </div>
        </div>
    );
}
