"use client"
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useAuth from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import QuizCard from "@/components/study/QuizCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizzesPage() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [submissions, setSubmissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Fetch Quizzes
        const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        // Fetch User Submissions for quizzes
        const fetchSubmissions = async () => {
            const qSub = query(collection(db, "quizzesResult"), where("userId", "==", user.uid));
            const subSnap = await getDocs(qSub);
            const subData = {};
            subSnap.docs.forEach(doc => {
                subData[doc.data().quizId] = doc.data();
            });
            setSubmissions(subData);
        };

        fetchSubmissions();
        return () => unsub();
    }, [user]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10" dir="rtl">
            <div className="flex flex-col gap-2 text-right">
                <h1 className="text-4xl font-black text-slate-900">الاختبارات</h1>
                <p className="text-slate-500 font-bold italic">اختبر معلوماتك وتابع تقدمك الدراسي</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-3xl" />)
                    ) : quizzes.length > 0 ? (
                        quizzes.map((quiz, index) => {
                            const submission = submissions[quiz.id];

                            return (
                                <motion.div
                                    key={quiz.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative group"
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4 z-10">
                                        {submission ? (
                                            <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                                <CheckCircle2 className="w-3 h-3" /> تم الاختبار
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                                <Clock className="w-3 h-3" /> متاح الآن
                                            </span>
                                        )}
                                    </div>

                                    <QuizCard quiz={quiz} />
                                </motion.div>
                            )
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <Timer className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold text-xl">لا توجد اختبارات حالياً</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}