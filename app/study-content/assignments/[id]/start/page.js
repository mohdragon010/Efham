"use client"
import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useAuth from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    AlertCircle,
    Send,
    HelpCircle,
    Timer,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function StartAssignmentPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, userData } = useAuth();
    const [assignment, setAssignment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchAssignment = async () => {
            if (!id) return;
            const asmSnap = await getDoc(doc(db, "assignments", id));
            if (asmSnap.exists()) {
                const data = { id: asmSnap.id, ...asmSnap.data() };

                // Deadline Security Check
                const deadline = data.deadline?.toDate ? data.deadline.toDate() : new Date(data.deadline);
                if (deadline < new Date()) {
                    router.push(`/study-content/assignments/${id}`);
                    return;
                }

                setAssignment(data);
            }
            setLoading(false);
        };
        fetchAssignment();
    }, [id]);

    const handleOptionSelect = (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        const totalQuestions = assignment.questions.length;
        const answeredCount = Object.keys(answers).length;

        if (answeredCount < totalQuestions) {
            setShowModal(true);
            return;
        }

        setSubmitting(true);
        try {
            let score = 0;
            const processedAnswers = assignment.questions.map(q => {
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

            const docRef = await addDoc(collection(db, "assignmentsResult"), {
                assignmentId: id,
                userId: user.uid,
                userName: userData?.name || "طالب",
                score,
                totalPoints: assignment.totalPoints,
                answers: processedAnswers,
                wrongQuestionIds: processedAnswers.filter(a => !a.isCorrect).map(a => a.questionId),
                status: "graded",
                submittedAt: serverTimestamp(),
                gradedAt: serverTimestamp()
            });

            router.push(`/study-content/assignments/${id}/${docRef.id}/result`);
        } catch (err) {
            console.error(err);
            setShowModal(true); // Reuse modal for error or just alert for critical failure
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

    if (!assignment) return null;

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
                            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">واجب غير مكتمل</h2>
                            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                                يرجى الإجابة على جميع الأسئلة ({assignment.questions.length}) قبل تسليم الواجب لضمان أفضل نتيجة.
                            </p>
                            <Button
                                onClick={() => setShowModal(false)}
                                className="w-full py-7 text-lg font-black rounded-2xl text-neutral-300 hover:bg-black bg-neutral-900 shadow-lg"
                            >
                                فهمت، سأكمل الحل
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 sticky top-20 bg-slate-50/80 backdrop-blur-md z-30 py-4 border-b border-slate-200/50">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">{assignment.title}</h1>
                    <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        أجب على جميع الأسئلة بعناية
                    </p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                        <span className="text-slate-800 font-black">
                            {Object.keys(answers).length} / {assignment.questions.length}
                        </span>
                    </div>
                    <div className="h-6 w-px bg-slate-100" />
                    <div className="text-slate-400 font-bold text-sm">تمت الإجابة</div>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-12">
                {assignment.questions.map((q, idx) => (
                    <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="border-2 border-slate-100 shadow-xl shadow-slate-200/30 rounded-[2.5rem] overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                                <span className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black shadow-lg shadow-primary/20">
                                    {idx + 1}
                                </span>
                                <span className="text-slate-400 font-bold text-sm uppercase tracking-wider">
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
                                                        ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.01]"
                                                        : "bg-white border-slate-100 text-slate-600 hover:border-primary/30 hover:bg-slate-50"
                                                )}
                                            >
                                                <span className="relative z-10">{option}</span>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all relative z-10",
                                                    isSelected ? "bg-white border-white" : "border-slate-200 group-hover:border-primary"
                                                )}>
                                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10" />}
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
                    className="w-full max-w-md py-8 text-2xl font-black rounded-3xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex gap-3"
                >
                    {submitting ? (
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="w-7 h-7" />
                            تسليم الواجب الآن
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

}
