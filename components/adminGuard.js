"use client";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldX } from "lucide-react";

export default function AdminGuard({ children }) {
    const router = useRouter();
    const { user, userData, loading, isAdmin } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (!isAdmin) {
                router.push("/study-content");
            }
        }
    }, [user, userData, loading, isAdmin, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex">
                {/* Sidebar skeleton */}
                <div className="w-64 bg-slate-800 p-6 flex flex-col gap-4">
                    <Skeleton className="h-8 w-32 rounded-lg bg-slate-700" />
                    <div className="mt-8 flex flex-col gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-xl bg-slate-700" />
                        ))}
                    </div>
                </div>
                {/* Main content skeleton */}
                <div className="flex-1 p-8 flex flex-col gap-6">
                    <Skeleton className="h-10 w-64 rounded-xl bg-slate-800" />
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-28 rounded-2xl bg-slate-800" />
                        ))}
                    </div>
                    <Skeleton className="h-80 rounded-3xl bg-slate-800" />
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <ShieldX className="w-16 h-16 text-red-500 mx-auto" />
                    <p className="text-white font-bold text-xl">غير مصرح بالدخول</p>
                    <p className="text-slate-400">هذه الصفحة خاصة بالمشرفين فقط</p>
                </div>
            </div>
        );
    }

    return children;
}
