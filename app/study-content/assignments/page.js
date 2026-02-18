"use client"
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useAuth from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronLeft, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import AssignmentCard from "@/components/study/AssignmentCard";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function AssignmentsPage() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Fetch Assignments
        const q = query(collection(db, "assignments"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        // Fetch User Submissions to show status
        const fetchSubmissions = async () => {
            const qSub = query(collection(db, "submissions"), where("userId", "==", user.uid));
            const subSnap = await getDocs(qSub);
            const subData = {};
            subSnap.docs.forEach(doc => {
                subData[doc.data().assignmentId] = doc.data();
            });
            setSubmissions(subData);
        };

        fetchSubmissions();
        return () => unsub();
    }, [user]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-900">الواجبات الدراسية</h1>
                <p className="text-slate-500 font-medium italic">تابع مهامك وأنجز واجباتك أولاً بأول</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-3xl" />)
                    ) : assignments.length > 0 ? (
                        assignments.map((assignment, index) => {
                            const submission = submissions[assignment.id];
                            const isOverdue = new Date(assignment.deadline?.toDate ? assignment.deadline.toDate() : assignment.deadline) < new Date();

                            return (
                                <motion.div
                                    key={assignment.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative group"
                                >
                                    {/* Status Badge Enhancement */}
                                    <div className="absolute top-4 right-4 z-10">
                                        {submission ? (
                                            <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                                <CheckCircle2 className="w-3 h-3" /> تم الإنجاز
                                            </span>
                                        ) : isOverdue ? (
                                            <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                                <AlertCircle className="w-3 h-3" /> متأخر
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                                <Clock className="w-3 h-3" /> قيد الانتظار
                                            </span>
                                        )}
                                    </div>

                                    <AssignmentCard assignment={assignment} />
                                </motion.div>
                            )
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">لا يوجد واجبات حالياً</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}