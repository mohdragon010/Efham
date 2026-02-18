"use client"
import { motion } from "framer-motion";
import { Timer, ArrowLeft, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function QuizCard({ quiz }) {
    if (!quiz) return null;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden border-2 border-orange-100 shadow-lg shadow-orange-50/50 bg-linear-to-br from-white to-orange-50/20">
                <CardContent className="p-0">
                    <div className="bg-orange-500 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Timer className="w-5 h-5" />
                            </div>
                            <span className="font-bold">اختبار متاح</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                            <Trophy className="w-4 h-4 text-orange-200" />
                            {quiz.totalPoints} نقطة
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{quiz.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium">
                            {quiz.description}
                        </p>

                        <div className="flex items-center justify-between gap-4">
                            <div className="text-sm font-bold text-slate-400">
                                المدة: {quiz.duration} دقيقة
                            </div>
                            <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-xl gap-2 px-6">
                                <Link href={`/study-content/quizzes/${quiz.id}`}>
                                    ابدأ الآن
                                    <ArrowLeft className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
