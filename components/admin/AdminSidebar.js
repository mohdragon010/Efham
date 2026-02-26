"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    BarChart3,
    BookOpen,
    FileText,
    HelpCircle,
    Users,
    LogOut,
    ChevronLeft,
    LayoutDashboard,
    Eye,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const adminNavItems = [
    { href: "/admin/stats", label: "الإحصائيات", icon: BarChart3, color: "text-sky-500", activeColor: "bg-sky-50 text-sky-600 border-sky-100" },
    { href: "/admin/content", label: "المحتوى", icon: BookOpen, color: "text-indigo-500", activeColor: "bg-indigo-50 text-indigo-600 border-indigo-100" },
    { href: "/admin/assignments", label: "الواجبات", icon: FileText, color: "text-blue-500", activeColor: "bg-blue-50 text-blue-600 border-blue-100" },
    { href: "/admin/quizzes", label: "الاختبارات", icon: HelpCircle, color: "text-orange-500", activeColor: "bg-orange-50 text-orange-600 border-orange-100" },
    { href: "/admin/students", label: "الطلاب", icon: Users, color: "text-pink-500", activeColor: "bg-pink-50 text-pink-600 border-pink-100" },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { userData, logout } = useAuth();

    return (
        <aside className="w-64 min-h-screen bg-white border-l border-slate-200 flex flex-col fixed right-0 top-0 z-40 shadow-sm shadow-slate-200">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-50">
                <Link href="/admin/stats" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                        <LayoutDashboard className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <p className="text-slate-900 font-black text-base leading-none">أفهم</p>
                        <p className="text-violet-600 text-[11px] font-bold mt-0.5">لوحة التحكم</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 mb-3">القائمة الرئيسية</p>
                {adminNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                whileHover={{ x: -4 }}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border",
                                    isActive
                                        ? `${item.activeColor} border-opacity-100 shadow-sm`
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                                )}
                            >
                                <item.icon className={cn("w-4.5 h-4.5 transition-colors", isActive ? "" : item.color)} />
                                <span className="font-bold text-sm">{item.label}</span>
                                {isActive && (
                                    <ChevronLeft className="w-3.5 h-3.5 mr-auto opacity-60 text-current" />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-50 space-y-2 pb-6">
                <Link href="/study-content">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer border border-transparent">
                        <Eye className="w-4.5 h-4.5" />
                        <span className="font-bold text-sm">عرض منصة الطلاب</span>
                    </div>
                </Link>

                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-100 flex items-center justify-center shrink-0">
                        <span className="text-violet-600 font-black text-xs">
                            {userData?.name?.charAt(0) || "م"}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-slate-900 text-xs font-bold truncate">{userData?.name || "مشرف"}</p>
                        <p className="text-slate-400 text-[10px] font-bold">مشرف النظام</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </aside>
    );
}
