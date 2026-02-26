"use client"
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentNotFound() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-right" dir="rtl">
            <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-12">

                {/* Image Side */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 order-2 md:order-1"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 transform -z-10" />
                        <img
                            src="/student_404.png"
                            alt="Student 404"
                            className="w-full max-w-md mx-auto drop-shadow-sm brightness-105"
                        />
                    </div>
                </motion.div>

                {/* Text Side */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 space-y-8 order-1 md:order-2"
                >
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
                            <Search className="w-3.5 h-3.5" />
                            هذه الصفحة تائهة مثلك تماماً!
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                            عذراً، لم نجد ما <br />
                            <span className="text-primary">تبحث عنه هنا.</span>
                        </h1>

                        <p className="text-slate-500 text-lg font-bold leading-relaxed max-w-sm">
                            ربما قمت بكتابة العنوان بشكل خاطئ، أو أن المحاضرة قد تم نقلها لمكان آخر. دعنا نعد للمسار الصحيح.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild size="lg" className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg gap-3 shadow-xl shadow-primary/20">
                            <Link href="/study-content">
                                <Home className="w-5 h-5" />
                                العودة للرئيسية
                            </Link>
                        </Button>

                        <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-bold text-lg gap-3">
                            <Link href="/study-content/lectures">
                                <BookOpen className="w-5 h-5" />
                                تصفح المحاضرات
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
