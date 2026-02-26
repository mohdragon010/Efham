"use client"
import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
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
import { useAlert } from "@/components/providers/alert-provider";

export default function StartQuizPage({ params }) {
    const { showAlert } = useAlert();
    const { id } = use(params);
    const router = useRouter();
    const { user, userData, loading: authLoading } = useAuth();

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [resultId, setResultId] = useState(null);

    // Submission Logic (Refactored for Re-entry)
    const handleSubmit = async (isAuto = false, passedAnswers = null) => {
        if (submitting || resultId) return;

        const currentAnswers = passedAnswers || answers;
        if (!quiz) return;

        setSubmitting(true);
        try {
            let score = 0;
            const processedAnswers = quiz.questions.map(q => {
                const selected = currentAnswers[q.id];
                const correctValue = q.correct || (q.options && q.correctIndex !== undefined ? q.options[q.correctIndex] : null);
                const isCorrect = selected === correctValue;
                if (isCorrect) score += q.points;
                return {
                    questionId: q.id,
                    selected: selected || "لم يتم الحل",
                    isCorrect,
                    points: q.points
                };
            });

            // 1. Save Result
            const docRef = await addDoc(collection(db, "quizzesResult"), {
                quizId: id,
                userId: user.uid,
                userName: userData?.name || "طالب",
                score,
                totalPoints: quiz.totalPoints,
                answers: processedAnswers,
                wrongQuestionIds: processedAnswers.filter(a => !a.isCorrect).map(a => a.questionId),
                status: "graded",
                submittedAt: serverTimestamp(),
                gradedAt: serverTimestamp()
            });

            // 2. Clear Session
            const sessionRef = doc(db, "quizSessions", `${user.uid}_${id}`);
            await deleteDoc(sessionRef).catch(e => console.error("Session cleanup error:", e));

            if (isAuto) {
                setResultId(docRef.id);
            } else {
                router.push(`/study-content/quizzes/${id}/${docRef.id}/result`);
            }
        } catch (err) {
            console.error("Submission error:", err);
            if (!isAuto) showAlert("حدث خطأ أثناء حفظ الإجابات", "فشل التسليم", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // 1. Combined Fetch Quiz + Session logic
    useEffect(() => {
        const initSession = async () => {
            if (authLoading || !user || !id) return;

            try {
                // Check if already submitted
                const qResRef = query(
                    collection(db, "quizzesResult"),
                    where("quizId", "==", id),
                    where("userId", "==", user.uid)
                );
                const subSnap = await getDocs(qResRef);
                if (!subSnap.empty) {
                    router.push(`/study-content/quizzes/${id}`);
                    return;
                }

                // Fetch Quiz Data
                const qSnap = await getDoc(doc(db, "quizzes", id));
                if (!qSnap.exists()) {
                    router.push("/study-content/quizzes");
                    return;
                }
                const quizData = { id: qSnap.id, ...qSnap.data() };
                setQuiz(quizData);

                // Check for Active Session
                const sessionRef = doc(db, "quizSessions", `${user.uid}_${id}`);
                const sessionSnap = await getDoc(sessionRef);

                if (sessionSnap.exists()) {
                    const sessionData = sessionSnap.data();
                    const startTime = sessionData.startTime.toDate().getTime();
                    const now = Date.now();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    const totalAllowed = (quizData.duration || 30) * 60;

                    if (elapsedSeconds >= totalAllowed) {
                        // Time expired while away
                        const prevAnswers = sessionData.answers || {};
                        setAnswers(prevAnswers);
                        setIsTimeUp(true);
                        setLoading(false);
                        setTimeLeft(0);
                        await handleSubmit(true, prevAnswers);
                        return;
                    } else {
                        // Resume session
                        setTimeLeft(totalAllowed - elapsedSeconds);
                        setAnswers(sessionData.answers || {});
                    }
                } else {
                    // Start new session
                    const startTime = new Date();
                    await setDoc(sessionRef, {
                        userId: user.uid,
                        quizId: id,
                        startTime: startTime,
                        answers: {},
                        lastSync: serverTimestamp()
                    });
                    setTimeLeft((quizData.duration || 30) * 60);
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        initSession();
    }, [id, user, authLoading, router]);

    // 2. Timer Logic
    useEffect(() => {
        if (loading || isTimeUp || !quiz || submitting || resultId) return;

        if (timeLeft <= 0) {
            setIsTimeUp(true);
            handleSubmit(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, loading, isTimeUp, quiz, submitting, resultId]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = async (questionId, option) => {
        if (isTimeUp || submitting) return;

        const newAnswers = { ...answers, [questionId]: option };
        setAnswers(newAnswers);

        // Sync to Firestore
        try {
            const sessionRef = doc(db, "quizSessions", `${user.uid}_${id}`);
            await setDoc(sessionRef, {
                answers: newAnswers,
                lastSync: serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.error("Sync error:", err);
        }
    };

    if (loading || authLoading) return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6 text-right" dir="rtl">
            <Skeleton className="h-10 w-48 mb-8" />
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)}
        </div>
    );

    if (!quiz) return null;

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto text-right mb-24" dir="rtl">
            {/* Time Up Modal */}
            <AnimatePresence>
                {isTimeUp && (
                    <div className="fixed inset-0 z-110 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-md w-full shadow-2xl relative z-10 text-center"
                        >
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <TimerIcon className="w-10 h-10 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight text-right">انتهى الوقت!</h2>
                            <p className="text-slate-500 font-bold mb-8 leading-relaxed text-right">
                                لقد انتهى الوقت المخصص للاختبار. تم حفظ تسليمك وتصحيحه تلقائياً لضمان حقك. عرض نتيجتك الآن لمعرفة مستواك.
                            </p>

                            {!resultId ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-orange-500 font-bold">جاري حفظ وإرسال الإجابات...</p>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => router.push(`/study-content/quizzes/${id}/${resultId}/result`)}
                                    className="w-full py-7 text-lg font-black rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all font-outfit"
                                >
                                    انتقل لعرض النتيجة
                                </Button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Incomplete Modal */}
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
                                className="w-full py-7 text-lg font-black rounded-2xl bg-neutral-900 hover:bg-black text-white shadow-lg"
                            >
                                سأكمل الحل
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 sticky top-20 bg-slate-50/80 backdrop-blur-md z-30 py-4 border-b border-slate-200/50">
                <div className="text-right">
                    <h1 className="text-3xl font-black text-slate-900">{quiz.title}</h1>
                    <p className={cn(
                        "font-black flex items-center gap-2 mt-1 transition-colors",
                        timeLeft < 60 ? "text-red-500 animate-pulse" : "text-orange-600"
                    )}>
                        <TimerIcon className="w-5 h-5 ml-1" />
                        الوقت المتبقي: {formatTime(timeLeft)}
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
                    onClick={() => handleSubmit()}
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
