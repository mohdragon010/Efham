"use client"
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { auth, db, provider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";


export default function Login() {
    const { user } = useAuth()
    const router = useRouter();
    const [error, setError] = useState("");
    
    useEffect(() => {
        if(user){
            router.push("/")
        }
    },[user])


    async function handleSignIn() {
        try {
            setError("");
            const result = await signInWithPopup(auth, provider);
            const userRef = doc(db, "users", result.user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                router.push("/");
            } else {
                await signOut(auth);
                setError("يرجى التسجيل أولاً قبل تسجيل الدخول.");
            }
        } catch (err) {
            console.error(err);
            setError("فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.");
        }
    }
    return (
        <div className="flex items-center justify-center min-h-screen p-6">
            <Card className="w-full max-w-sm shadow-2xl shadow-slate-200/50 border-slate-300 overflow-hidden">
                <CardHeader className="text-center pt-8 pb-4">
                    <CardTitle className="text-4xl font-bold tracking-tight text-slate-800">منصة أفهم</CardTitle>
                    <p className="text-slate-500 mt-2 text-sm font-medium">سجل دخولك لبدء التعلم</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 pt-6 px-8">
                    <Button
                        variant="outline"
                        className="w-full py-8 text-lg font-semibold border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 flex gap-4 transition-all duration-300 rounded-2xl group cursor-pointer"
                        onClick={handleSignIn}
                    >
                        <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span>متابعة باستخدام جوجل</span>
                    </Button>
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-4 pb-10 px-8">
                    <div className="w-full flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-slate-400 text-xs font-medium">أو</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <Button variant="link" className="text-base font-bold text-primary hover:text-primary/80 transition-colors">
                        <Link href="/signup">
                            ليس لديك حساب؟ سجل الآن
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
