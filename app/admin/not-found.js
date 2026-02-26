"use client"
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-right" dir="rtl">
            <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-16">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 space-y-10"
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-red-600 font-black text-xs uppercase tracking-widest leading-none mb-1">خطأ في الوصول للمسار</h4>
                                <p className="text-slate-400 text-[10px] font-bold uppercase leading-none">Admin Management Security</p>
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">
                            عفواً سيادة المشرف، <br />
                            <span className="text-slate-400">هذا المسار غير معرف.</span>
                        </h1>

                        <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
                            المجلد أو الصفحة التي تحاول الوصول إليها لا تتبع نظام الإدارة الحالي. يرجى العودة للوحة الإحصائيات لمتابعة النشاط.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild size="lg" className="h-14 px-10 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-black text-white font-black text-lg gap-3 shadow-2xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                            <Link href="/admin/stats">
                                <LayoutDashboard className="w-5 h-5" />
                                لوحة التحكم الرئيسية
                            </Link>
                        </Button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4 max-w-sm">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed">
                            إذا كنت تعتقد أن هذا خطأ برمجياً، يرجى مراجعة ملفات التوجيه (Routing) في مسار <code className="bg-slate-50 px-1.5 py-0.5 rounded text-primary">app/admin/</code>
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 relative"
                >
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-slate-200/50 blur-[120px] rounded-full" />
                    <img
                        src="/admin_404.png"
                        alt="Admin 404"
                        className="relative z-10 w-full max-w-lg mx-auto drop-shadow-sm opacity-90"
                    />
                </motion.div>
            </div>
        </div>
    );
}
