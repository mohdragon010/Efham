"use client";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default function AuthGuard({ children }) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, router, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/30 flex flex-col p-6 gap-6">
                {/* Navbar Skeleton */}
                <div className="h-16 w-full flex items-center justify-between px-4 bg-white border border-slate-100 rounded-2xl">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col gap-8 pt-8">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-96 rounded-lg opacity-50" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
                                <Skeleton className="h-48 w-full rounded-2xl" />
                                <Skeleton className="h-6 w-3/4 rounded-lg" />
                                <Skeleton className="h-4 w-full rounded-lg opacity-50" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return user ? children : null;
}