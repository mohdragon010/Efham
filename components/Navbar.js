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
    User as UserIcon
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    { href: "/study-content", label: "الرئيسية", icon: Home },
    { href: "/study-content/assignments", label: "الواجبات", icon: BookOpen },
    { href: "/study-content/quizzes", label: "الاختبارات", icon: Timer },
    { href: "/study-content/grades", label: "درجاتي", icon: Star },
];

export default function Navbar() {
    const pathname = usePathname();
    const { userData, logout } = useAuth();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <span className="text-2xl font-black text-primary italic transition-transform group-hover:scale-105">أفهم</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "relative px-4 py-2 text-sm font-bold transition-colors rounded-xl flex items-center gap-2",
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
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-bold text-slate-800">{userData?.name || "طالب"}</span>
                            <span className="text-[10px] text-slate-400 font-medium">حساب طالب</span>
                        </div>

                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-100">
                            <UserIcon className="w-5 h-5 text-slate-400" />
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

            {/* Mobile Navigation (Bottom Bar Style) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors",
                                isActive ? "text-primary" : "text-slate-400"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive ? "stroke-[3px]" : "stroke-[2px]")} />
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}