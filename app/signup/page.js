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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth, db, provider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { signInWithPopup, signOut } from "firebase/auth";
import Link from "next/link";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import useAuth from "@/hooks/useAuth";

export default function Signup() {
    const { user } = useAuth()
    const router = useRouter();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);

    useEffect(() => {
        // Only redirect if the user is logged in AND we aren't currently 
        // in the middle of creating their Firestore document.
        if (user && !isCreatingAccount) {
            router.push("/")
        }
    }, [user, isCreatingAccount, router])

    const validatePhone = (number) => {
        const regex = /^01[0125][0-9]{8}$/;
        return regex.test(number);
    };

    async function handleSignup() {
        setError("");

        if (!name.trim()) {
            setError("يرجى إدخال الاسم");
            return;
        }

        if (!validatePhone(phone)) {
            setError("يرجى إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 01)");
            return;
        }

        setLoading(true);
        setIsCreatingAccount(true); // Prevent useEffect redirect during the process

        try {
            // 1. Auth with Google First
            // We must auth first because your rules only allow reading/writing 
            // if the user is authenticated.
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;

            // 2. Check if UID already has a profile
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                setError("هذا الحساب مسجل بالفعل، يرجى تسجيل الدخول");
                setLoading(false);
                setIsCreatingAccount(false);
                return;
            }

            // 3. Optional: Phone uniqueness check 
            // Note: This will only work if your rules allow "list" on the users collection,
            // otherwise, this query will throw a "Permissions Denied" error.
            const phoneQuery = query(collection(db, "users"), where("phone", "==", phone));
            const phoneSnapshot = await getDocs(phoneQuery);
            
            if (!phoneSnapshot.empty) {
                await signOut(auth);
                setError("رقم الهاتف هذا مسجل بحساب آخر");
                setLoading(false);
                setIsCreatingAccount(false);
                return;
            }

            // 4. Create user in Firestore
            await setDoc(userDocRef, {
                name: name,
                phone: phone,
                email: firebaseUser.email,
                uid: firebaseUser.uid,
                createdAt: serverTimestamp(), // Better than new Date() for DB consistency
                isBanned: false,              // FIXED TYPO
                role: "student" 
            });

            setIsCreatingAccount(false);
            router.push("/");

        } catch (err) {
            console.error(err);
            setIsCreatingAccount(false);
            if (err.code === 'auth/popup-closed-by-user') {
                setError("تم إغلاق نافذة التسجيل");
            } else if (err.code === 'permission-denied') {
                setError("عفواً، لا تملك الصلاحية لإتمام العملية. يرجى التواصل مع الدعم.");
            } else {
                setError("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-6">
            <Card className="w-full max-w-sm shadow-2xl shadow-slate-200/50 border-slate-400 overflow-hidden">
                <CardHeader className="text-center pt-8 pb-4">
                    <CardTitle className="text-4xl font-bold tracking-tight text-slate-800">إنشاء حساب</CardTitle>
                    <p className="text-slate-500 mt-2 text-sm font-medium">انضم إلى منصة أفهم اليوم</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-5 pt-6 px-8">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-700 font-bold">الاسم بالكامل</Label>
                        <Input
                            id="name"
                            placeholder="أدخل اسمك"
                            className="h-12 border-slate-200 rounded-xl focus-visible:ring-primary/20"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-700 font-bold">رقم الهاتف</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="01xxxxxxxxx"
                            className="h-12 border-slate-200 rounded-xl focus-visible:ring-primary/20 text-left"
                            dir="ltr"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        disabled={loading}
                        className="w-full py-8 mt-2 text-lg font-semibold border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 flex gap-4 transition-all duration-300 rounded-2xl group cursor-pointer"
                        onClick={handleSignup}
                    >
                        {loading ? (
                            <span className="animate-pulse">جاري التحميل...</span>
                        ) : (
                            <>
                                <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                                </svg>
                                <span>تسجيل باستخدام جوجل</span>
                            </>
                        )}
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
                    <Button variant="link" asChild className="text-base font-bold text-primary hover:text-primary/80 transition-colors">
                        <Link href="/login">
                            لديك حساب بالفعل؟ سجل دخولك
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
