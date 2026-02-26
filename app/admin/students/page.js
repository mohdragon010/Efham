"use client";
import { useState, useEffect } from "react";
import {
    collection, query, orderBy, getDocs,
    doc, updateDoc
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Search, Shield, Ban, ShieldCheck, Eye,
    Phone, User, Filter, Loader2, ChevronLeft,
    CheckCircle2, XCircle, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        let cancelled = false;
        getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")))
            .then(snap => {
                if (!cancelled) {
                    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                }
            })
            .catch(err => {
                if (!cancelled) {
                    console.error("students:", err);
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    const handleBanToggle = async (student) => {
        const action = student.isBanned ? "رفع الحظر عن" : "حظر";
        if (!confirm(`${action} ${student.name}؟`)) return;
        setUpdatingId(student.id);
        try {
            await updateDoc(doc(db, "users", student.id), { isBanned: !student.isBanned });
            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isBanned: !s.isBanned } : s));
        } finally {
            setUpdatingId(null);
        }
    };

    const handlePromoteToggle = async (student) => {
        if (student.id === auth.currentUser?.uid) {
            return alert("لا يمكنك إزالة صلاحيات المشرف عن نفسك!");
        }
        const isAdmin = student.role === "admin";
        const action = isAdmin ? "إزالة صلاحيات المشرف من" : "ترقية";
        if (!confirm(`${action} ${student.name} إلى ${isAdmin ? "طالب" : "مشرف"}؟`)) return;
        setUpdatingId(student.id);
        try {
            const newRole = isAdmin ? "student" : "admin";
            await updateDoc(doc(db, "users", student.id), { role: newRole });
            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, role: newRole } : s));
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = students.filter(s => {
        const matchesSearch = !search ||
            s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.phoneNumber?.includes(search) ||
            s.email?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            filter === "all" ||
            (filter === "banned" && s.isBanned) ||
            (filter === "active" && !s.isBanned) ||
            (filter === "admin" && s.role === "admin");
        return matchesSearch && matchesFilter;
    });

    const formatDate = (ts) => {
        if (!ts?.toDate) return "—";
        return ts.toDate().toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="p-8 space-y-8 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">إدارة الطلاب</h1>
                    <p className="text-slate-400 text-sm font-black mt-1 tracking-tight uppercase">قائمة المستخدمين وصلاحيات الوصول</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="بحث بالاسم، البريد، أو رقم الهاتف..."
                            className="bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 h-14 rounded-2xl pr-12 focus-visible:ring-violet-500 font-bold"
                        />
                    </div>
                    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl overflow-x-auto">
                        {[
                            { value: "all", label: "الجميع", count: students.length },
                            { value: "active", label: "نشط", count: students.filter(s => !s.isBanned).length },
                            { value: "banned", label: "محظور", count: students.filter(s => s.isBanned).length },
                            { value: "admin", label: "مشرفين", count: students.filter(s => s.role === "admin").length },
                        ].map(f => (
                            <button key={f.value} onClick={() => setFilter(f.value)}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0",
                                    filter === f.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}>
                                {f.label}
                                <span className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-lg",
                                    filter === f.value ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
                                )}>{f.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop View Table */}
                <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-100">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-5 text-slate-400 text-[10px] font-black uppercase tracking-widest text-right">المستخدم</th>
                                <th className="p-5 text-slate-400 text-[10px] font-black uppercase tracking-widest text-right">رقم الهاتف</th>
                                <th className="p-5 text-slate-400 text-[10px] font-black uppercase tracking-widest text-right">الدور</th>
                                <th className="p-5 text-slate-400 text-[10px] font-black uppercase tracking-widest text-right">الحالة</th>
                                <th className="p-5 text-slate-400 text-[10px] font-black uppercase tracking-widest text-right">تاريخ الانضمام</th>
                                <th className="p-5 text-slate-400 text-[10px] font-black uppercase tracking-widest text-right">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-6"><div className="h-8 bg-slate-50 rounded-xl" /></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                        <p className="text-slate-300 font-bold">لا يوجد طلاب يطابقون البحث حالياً</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm border-2",
                                                    student.role === "admin" ? "bg-violet-50 border-violet-100 text-violet-600" : "bg-slate-50 border-slate-100 text-slate-400"
                                                )}>
                                                    {student.name?.charAt(0) || <User className="w-5 h-5" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 font-black text-sm">{student.name}</span>
                                                    <span className="text-slate-400 text-[10px] font-bold">{student.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-slate-600 font-black text-xs font-mono tracking-tighter">{student.phoneNumber || "—"}</span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={cn(
                                                "text-[10px] font-black px-3 py-1 rounded-lg border",
                                                student.role === "admin" ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-500"
                                            )}>
                                                {student.role === "admin" ? "مشرف نظام" : "طالب"}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", student.isBanned ? "bg-red-500" : "bg-emerald-500")} />
                                                <span className={cn(
                                                    "text-[10px] font-black",
                                                    student.isBanned ? "text-red-500" : "text-emerald-600"
                                                )}>
                                                    {student.isBanned ? "محظور" : "فعال"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-400 font-bold text-xs">
                                            {formatDate(student.createdAt)}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Link href={`/admin/students/${student.id}`}>
                                                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-xl text-sky-500 hover:bg-sky-50 transition-all">
                                                        <Eye className="w-4.5 h-4.5" />
                                                    </Button>
                                                </Link>
                                                <Button size="icon" variant="ghost" onClick={() => handlePromoteToggle(student)}
                                                    className={cn("w-9 h-9 rounded-xl transition-all", student.role === "admin" ? "text-violet-500 hover:bg-violet-50" : "text-slate-300 hover:bg-slate-50")}>
                                                    <ShieldCheck className="w-4.5 h-4.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleBanToggle(student)}
                                                    className={cn("w-9 h-9 rounded-xl transition-all", student.isBanned ? "text-emerald-500 hover:bg-emerald-50" : "text-red-500 hover:bg-red-50")}>
                                                    {student.isBanned ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Ban className="w-4.5 h-4.5" />}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden space-y-4">
                    {filtered.map(student => (
                        <div key={student.id} className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-lg font-black shrink-0 border border-slate-200">
                                {student.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-slate-900 font-black text-sm truncate">{student.name}</p>
                                    <span className={cn(
                                        "text-[9px] font-black px-2 py-0.5 rounded-md",
                                        student.isBanned ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                                    )}>{student.isBanned ? "محظور" : "نشط"}</span>
                                </div>
                                <p className="text-slate-400 text-xs truncate mb-3">{student.email}</p>
                                <div className="flex gap-2">
                                    <Link href={`/admin/students/${student.id}`} className="flex-1">
                                        <Button className="w-full bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 h-9 rounded-xl text-xs font-black">التفاصيل</Button>
                                    </Link>
                                    <Button onClick={() => handleBanToggle(student)} variant="ghost" className="w-9 h-9 border border-slate-200 rounded-xl p-0">
                                        <Ban className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
