"use client"
import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useAuth from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    AlertCircle,
    Send,
    HelpCircle,
    Timer as TimerIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function StartQuizPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, userData } = useAuth();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!id || !user) return;

            // Check if already submitted (Security)
            const qSub = query(
                collection(db, "quizzesResult"),
                where("quizId", "==", id),
                where("userId", "==", user.uid)
            );
            const subSnap = await getDocs(qSub);
            if (!subSnap.empty) {
                router.push(`/study-content/quizzes/${id}`);
                return;
            }

            const qSnap = await getDoc(doc(db, "quizzes", id));
            if (qSnap.exists()) {
                setQuiz({ id: qSnap.id, ...qSnap.data() });
            }
            setLoading(false);
        };
        fetchQuiz();
    }, [id, user]);

    const handleOptionSelect = (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        const totalQuestions = quiz.questions.length;
        const answeredCount = Object.keys(answers).length;

        if (answeredCount < totalQuestions) {
            setShowModal(true);
            return;
        }

        setSubmitting(true);
        try {
            let score = 0;
            const processedAnswers = quiz.questions.map(q => {
                const selected = answers[q.id];
                const isCorrect = selected === q.correct;
                if (isCorrect) score += q.points;
                return {
                    questionId: q.id,
                    selected,
                    isCorrect,
                    points: q.points
                };
            });

            const docRef = await addDoc(collection(db, "quizzesResult"), {
                quizId: id,
                userId: user.uid,
                userName: userData?.name || "طالب",
                score,
                totalPoints: quiz.totalPoints,
                answers: processedAnswers,
                wrongQuestionIds: processedAnswers.filter(a => !a.isCorrect).map(a => a.questionId),
                submittedAt: serverTimestamp()
            });

            router.push(`/study-content/quizzes/${id}/${docRef.id}/result`);
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء حفظ الإجابات");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6 text-right" dir="rtl">
            <Skeleton className="h-10 w-48 mb-8" />
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)}
        </div>
    );

    if (!quiz) return null;

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto text-right mb-24" dir="rtl">
            {/* Custom Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-md w-full shadow-2xl relative z-10 text-center"
                        >
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">اختبار غير مكتمل</h2>
                            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                                يرجى الإجابة على جميع الأسئلة ({quiz.questions.length}) قبل تسليم الاختبار. تذكر أنه لا يمكنك التعديل لاحقاً.
                            </p>
                            <Button
                                onClick={() => setShowModal(false)}
                                className="w-full py-7 text-lg font-black rounded-2xl bg-slate-900 hover:bg-black shadow-lg"
                            >
                                سأكمل الحل
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 sticky top-20 bg-slate-50/80 backdrop-blur-md z-30 py-4 border-b border-slate-200/50">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">{quiz.title}</h1>
                    <p className="text-orange-600 font-bold flex items-center gap-2 mt-1">
                        <TimerIcon className="w-4 h-4" />
                        الوقت المتاح: {quiz.duration} دقيقة
                    </p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-slate-800 font-black">
                            {Object.keys(answers).length} / {quiz.questions.length}
                        </span>
                    </div>
                    <div className="h-6 w-px bg-slate-100" />
                    <div className="text-slate-400 font-bold text-sm">أجبت على</div>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-12">
                {quiz.questions.map((q, idx) => (
                    <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="border-2 border-slate-100 shadow-xl shadow-slate-200/30 rounded-[2.5rem] overflow-hidden">
                            <div className="bg-orange-50 border-b border-orange-100 p-6 flex items-center justify-between">
                                <span className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/20">
                                    {idx + 1}
                                </span>
                                <span className="text-orange-600 font-black text-sm uppercase tracking-wider">
                                    {q.points} نقاط
                                </span>
                            </div>
                            <CardContent className="p-8 md:p-10">
                                <h3 className="text-2xl font-black text-slate-800 mb-8 leading-snug">
                                    {q.text}
                                </h3>

                                <div className="grid gap-4">
                                    {q.options.map((option, optIdx) => {
                                        const isSelected = answers[q.id] === option;
                                        return (
                                            <button
                                                key={optIdx}
                                                onClick={() => handleOptionSelect(q.id, option)}
                                                className={cn(
                                                    "w-full p-6 py-5 rounded-2xl text-right font-bold transition-all flex items-center justify-between group border-2 relative overflow-hidden",
                                                    isSelected
                                                        ? "bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/20 translate-x-1"
                                                        : "bg-white border-slate-100 text-slate-600 hover:border-orange-500/30 hover:bg-orange-50/20"
                                                )}
                                            >
                                                <span className="relative z-10">{option}</span>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all relative z-10",
                                                    isSelected ? "bg-white border-white" : "border-slate-200 group-hover:border-orange-500"
                                                )}>
                                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Submit Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 flex justify-center shadow-2xl">
                <Button
                    size="lg"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="w-full max-w-md py-8 text-2xl font-black rounded-3xl bg-orange-500 hover:bg-orange-600 shadow-2xl shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all flex gap-3"
                >
                    {submitting ? (
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="w-7 h-7" />
                            تسليم الاختبار النهائي
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
