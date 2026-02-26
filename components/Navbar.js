"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    Home,
    BookOpen,
    Timer,
    Star,
    LogOut,
    User as UserIcon,
    ShieldCheck,
    LayoutDashboard,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const studentNavItems = [
    { href: "/study-content", label: "الرئيسية", icon: Home },
    { href: "/study-content/lectures", label: "المحاضرات", icon: BookOpen },
    { href: "/study-content/assignments", label: "الواجبات", icon: BookOpen },
    { href: "/study-content/quizzes", label: "الاختبارات", icon: Timer },
    { href: "/study-content/grades", label: "درجاتي", icon: Star },
];

export default function Navbar() {
    const pathname = usePathname();
    const { userData, logout, isAdmin } = useAuth();

    const navItems = studentNavItems;

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <span className="text-2xl font-black text-primary italic transition-transform group-hover:scale-105">أفهم</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/study-content" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "relative px-3 py-2 text-sm font-bold transition-colors rounded-xl flex items-center gap-1.5",
                                            isActive ? "text-primary bg-primary/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        )}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill"
                                                className="absolute inset-0 bg-primary/5 rounded-xl -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <Link href="/admin">
                                <Button
                                    variant={pathname.startsWith("/admin") ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "hidden sm:flex gap-2 rounded-xl font-bold text-xs",
                                        pathname.startsWith("/admin")
                                            ? "bg-violet-600 hover:bg-violet-700 text-white border-0"
                                            : "border-violet-200 text-violet-600 hover:bg-violet-50"
                                    )}
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    لوحة التحكم
                                </Button>
                            </Link>
                        )}

                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-800">{userData?.name || "طالب"}</span>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                isAdmin ? "bg-violet-100 text-violet-600" : "text-slate-400"
                            )}>
                                {isAdmin ? "مشرف" : "طالب"}
                            </span>
                        </div>

                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm ring-1",
                            isAdmin
                                ? "bg-violet-100 border-violet-200 ring-violet-100"
                                : "bg-slate-100 border-white ring-slate-100"
                        )}>
                            {isAdmin
                                ? <ShieldCheck className="w-5 h-5 text-violet-600" />
                                : <UserIcon className="w-5 h-5 text-slate-400" />
                            }
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex justify-around items-center z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                {navItems.slice(0, 4).map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/study-content" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all px-3 py-1.5 rounded-2xl relative",
                                isActive ? "text-primary bg-primary/5" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <item.icon className={cn("w-5.5 h-5.5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
                            <span className="text-[10px] font-black">{item.label}</span>
                        </Link>
                    );
                })}

                {/* Mobile Logout Button */}
                <button
                    onClick={logout}
                    className="flex flex-col items-center gap-1 transition-all px-3 py-1.5 rounded-2xl text-slate-400 active:text-red-500 active:bg-red-50"
                >
                    <LogOut className="w-5.5 h-5.5 stroke-[1.5px]" />
                    <span className="text-[10px] font-black">خروج</span>
                </button>
            </div>
        </nav>
    );
}