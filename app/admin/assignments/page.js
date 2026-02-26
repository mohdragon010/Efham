"use client";
import { useState, useEffect } from "react";
import {
    collection, query, orderBy, getDocs,
    addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, FileText, Edit2, Trash2, Eye, EyeOff, X,
    Save, Loader2, Calendar, Star, ChevronDown, ChevronUp,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Assignment Form Modal ──────────────────────────────────────────────────────
function AssignmentModal({ assignment, onClose, onSaved }) {
    const isEdit = !!assignment;
    const [form, setForm] = useState({
        title: assignment?.title || "",
        description: assignment?.description || "",
        totalPoints: assignment?.totalPoints ?? 0,
        isActive: assignment?.isActive ?? true,
        deadline: assignment?.deadline?.toDate
            ? assignment.deadline.toDate().toISOString().slice(0, 16)
            : "",
        questions: assignment?.questions || [],
    });
    const [saving, setSaving] = useState(false);

    // Auto-calculate total points
    useEffect(() => {
        const total = form.questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
        setForm(f => ({ ...f, totalPoints: total }));
    }, [form.questions]);

    const addQuestion = () => {
        setForm(f => ({
            ...f,
            questions: [...f.questions, { text: "", points: 10, options: ["", "", "", ""], correctIndex: 0, correct: "" }]
        }));
    };

    const updateQuestion = (i, updated) => {
        setForm(f => {
            const questions = [...f.questions];
            questions[i] = updated;
            return { ...f, questions };
        });
    };

    const updateOption = (qIdx, optIdx, val) => {
        const q = { ...form.questions[qIdx] };
        const opts = [...q.options];
        const oldVal = opts[optIdx];
        opts[optIdx] = val;
        q.options = opts;
        // If this was the correct one, update the correct string
        if (q.correct === oldVal) q.correct = val;
        updateQuestion(qIdx, q);
    };

    const addOption = (qIdx) => {
        const q = { ...form.questions[qIdx] };
        q.options = [...q.options, ""];
        updateQuestion(qIdx, q);
    };

    const removeOption = (qIdx, optIdx) => {
        const q = { ...form.questions[qIdx] };
        if (q.options.length <= 2) return alert("يجب أن يحتوي السؤال على خيارين على الأقل");

        const newOptions = q.options.filter((_, idx) => idx !== optIdx);
        let newCorrectIndex = q.correctIndex;

        if (q.correctIndex === optIdx) {
            newCorrectIndex = 0;
        } else if (q.correctIndex > optIdx) {
            newCorrectIndex = q.correctIndex - 1;
        }

        q.options = newOptions;
        q.correctIndex = newCorrectIndex;
        q.correct = newOptions[newCorrectIndex] || "";

        updateQuestion(qIdx, q);
    };

    const removeQuestion = (i) => {
        setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
    };

    const handleSave = async () => {
        if (!form.title.trim()) return alert("أدخل عنوان الواجب");
        if (form.questions.length === 0) return alert("يجب إضافة سؤال واحد على الأقل");
        for (const q of form.questions) {
            if (!q.text.trim()) return alert("أدخل نص السؤال");
            if (q.options.some(o => !o.trim())) return alert("أكمل جميع الخيارات");
            if (!q.correct.trim()) return alert("اختر الإجابة الصحيحة لكل سؤال");
        }
        setSaving(true);
        try {
            const data = {
                title: form.title,
                description: form.description,
                totalPoints: Number(form.totalPoints),
                isActive: form.isActive,
                questions: form.questions.map((q, idx) => ({ ...q, id: idx + 1 })),
                deadline: form.deadline ? new Date(form.deadline) : null,
                updatedAt: serverTimestamp(),
            };
            if (isEdit) {
                await updateDoc(doc(db, "assignments", assignment.id), data);
            } else {
                await addDoc(collection(db, "assignments"), { ...data, createdAt: serverTimestamp() });
            }
            onSaved();
            onClose();
        } catch (e) {
            alert("فشل الحفظ: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-slate-900 font-black text-2xl">{isEdit ? "تعديل الواجب" : "واجب جديد"}</h2>
                        <p className="text-slate-400 text-xs font-black uppercase mt-1 tracking-widest text-right">نظام الواجبات المؤتمتة</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-2 rounded-xl transition-all"><X className="w-7 h-7" /></button>
                </div>
                <div className="p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-slate-900 text-sm font-black mr-1">عنوان الواجب *</label>
                            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="مثال: واجب الأسبوع الثالث - القوى والحرارة"
                                className="bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus-visible:ring-violet-500 h-14 rounded-2xl font-bold text-lg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-slate-900 text-sm font-black mr-1">الإرشادات / الوصف</label>
                            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="تعليمات إضافية للطلاب..."
                                className="w-full bg-slate-50 text-slate-900 text-base rounded-2xl px-4 py-4 border border-slate-100 focus:outline-none focus:border-violet-500 resize-none font-medium" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-slate-900 text-sm font-black mr-1 flex items-center gap-1.5 opacity-60">
                                    <Star className="w-3.5 h-3.5" /> الدرجة الكلية (تلقائية)
                                </label>
                                <div className="bg-slate-50 border border-slate-100 text-slate-900 h-12 rounded-xl font-black text-center flex items-center justify-center text-lg">
                                    {form.totalPoints}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-slate-900 text-sm font-black mr-1">آخر موعد للتسليم</label>
                                <Input type="datetime-local" value={form.deadline}
                                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                                    className="bg-slate-50 border-slate-100 text-slate-900 h-12 rounded-xl font-bold px-4" />
                            </div>
                        </div>
                        <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 font-black text-xs transition-all",
                                form.isActive
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                    : "bg-slate-50 border-slate-100 text-slate-400"
                            )}>
                            <div className={cn("w-2 h-2 rounded-full", form.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                            {form.isActive ? "الواجب نشط ومتاح للطلاب" : "الواجب مخفي (مسودة)"}
                        </button>
                    </div>

                    {/* Questions Area */}
                    <div className="space-y-6 pt-6 border-t border-slate-50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <label className="text-slate-900 text-sm font-black uppercase tracking-widest">تحرير الأسئلة (اختيار من متعدد)</label>
                            <Button onClick={addQuestion}
                                className="h-10 text-xs bg-slate-900 hover:bg-black text-white gap-2 rounded-xl font-black">
                                <Plus className="w-4 h-4" /> إضافة سؤال جديد
                            </Button>
                        </div>

                        {form.questions.length === 0 && (
                            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-bold text-sm">لم تقم بإضافة أسئلة لهذا الواجب بعد</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            {form.questions.map((q, i) => (
                                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative group/q hover:shadow-md transition-shadow">
                                    <button onClick={() => removeQuestion(i)}
                                        className="absolute left-6 top-6 p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-start gap-4">
                                        <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-lg shadow-slate-200">{i + 1}</span>
                                        <div className="flex-1 space-y-6">
                                            <textarea rows={2}
                                                value={q.text}
                                                onChange={e => updateQuestion(i, { ...q, text: e.target.value })}
                                                placeholder="اكتب نص السؤال هنا..."
                                                className="w-full bg-transparent text-slate-900 text-lg font-black focus:outline-none placeholder:text-slate-200 resize-none pr-2"
                                            />

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="relative group/opt">
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={e => updateOption(i, optIdx, e.target.value)}
                                                            placeholder={`الخيار ${optIdx + 1}`}
                                                            className={cn(
                                                                "w-full bg-slate-50 border-2 py-3 pr-12 pl-12 rounded-2xl text-sm font-bold transition-all focus:outline-none",
                                                                q.correct === opt && opt !== ""
                                                                    ? "border-emerald-500/30 text-emerald-700 bg-emerald-50 shadow-sm shadow-emerald-50"
                                                                    : "border-transparent text-slate-600 focus:border-slate-200"
                                                            )}
                                                        />
                                                        <button
                                                            onClick={() => updateQuestion(i, { ...q, correctIndex: optIdx, correct: opt })}
                                                            className={cn(
                                                                "absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                                                q.correctIndex === optIdx
                                                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                                                                    : "bg-white text-slate-300 border border-slate-100 hover:border-emerald-200 hover:text-emerald-500 shadow-sm"
                                                            )}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeOption(i, optIdx)}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center bg-white text-slate-300 border border-slate-100 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/opt:opacity-100 transition-all"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addOption(i)}
                                                    className="w-full h-13.5 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-300 font-black text-xs hover:border-slate-200 hover:text-slate-400 transition-all"
                                                >
                                                    <Plus className="w-4 h-4" /> إضافة خيار
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                        <Star className="w-3.5 h-3.5 text-yellow-500" />
                                                    </div>
                                                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-tight">الدرجات</span>
                                                    <input type="number" min={1} value={q.points}
                                                        onChange={e => updateQuestion(i, { ...q, points: Number(e.target.value) })}
                                                        className="bg-transparent text-slate-900 w-12 font-black text-center focus:outline-none" />
                                                </div>
                                                {q.correct && (
                                                    <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        تم تحديد الإجابة
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-8 border-t border-slate-50 flex justify-end gap-3 sticky bottom-0 bg-white/80 backdrop-blur-md">
                    <Button variant="ghost" onClick={onClose} className="rounded-2xl font-black text-slate-400 hover:text-slate-900 h-12 px-6">إلغاء</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-black gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-105">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isEdit ? "تحديث الواجب" : "إنشاء الواجب"}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Assignment Row ─────────────────────────────────────────────────────────────
function AssignmentRow({ assignment, onEdit, onDelete, onToggle }) {
    const [expanded, setExpanded] = useState(false);

    const formatDeadline = (dl) => {
        if (!dl?.toDate) return null;
        return dl.toDate().toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const isOverdue = assignment.deadline?.toDate && assignment.deadline.toDate() < new Date();

    return (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group">
            <div className="flex items-center gap-6 p-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm shadow-blue-50">
                    <FileText className="w-7 h-7 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="text-slate-900 font-black text-lg group-hover:text-blue-600 transition-colors uppercase">{assignment.title}</h3>
                        <span className={cn(
                            "text-[10px] font-black px-2.5 py-1 rounded-lg border",
                            assignment.isActive ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-400"
                        )}>
                            {assignment.isActive ? "منشور" : "مسودة"}
                        </span>
                        {assignment.deadline && (
                            <div className={cn(
                                "text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm",
                                isOverdue ? "bg-red-50 border-red-100 text-red-500" : "bg-yellow-50 border-yellow-100 text-yellow-600"
                            )}>
                                <Calendar className="w-3 h-3" />
                                {isOverdue ? "انتهى الموعد" : "متاح للتسليم"}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold font-outfit uppercase tracking-tight">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {assignment.totalPoints} درجة</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span>{assignment.questions?.length ?? 0} سؤال مؤتمت</span>
                        {assignment.deadline && (
                            <>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDeadline(assignment.deadline)}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => onToggle(assignment)}
                        className={cn("w-10 h-10 rounded-xl", assignment.isActive ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-300 hover:bg-slate-50")}>
                        {assignment.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onEdit(assignment)}
                        className="w-10 h-10 rounded-xl text-blue-500 hover:bg-blue-50">
                        <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(assignment.id)}
                        className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50">
                        <Trash2 className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-8 bg-slate-100 mx-1" />
                    <Button size="icon" variant="ghost" onClick={() => setExpanded(!expanded)}
                        className={cn("w-12 h-12 rounded-2xl transition-all shadow-sm", expanded ? "bg-slate-900 text-white" : "text-slate-300 hover:bg-slate-100 hover:text-slate-600")}>
                        {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {expanded && assignment.questions?.length > 0 && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="bg-slate-50/50 border-t border-slate-100 overflow-hidden"
                    >
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignment.questions.map((q, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group/card">
                                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 font-bold text-sm line-clamp-1 group-hover/card:line-clamp-none transition-all">{q.text}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-emerald-600 text-[10px] font-black uppercase bg-emerald-50 px-2 py-0.5 rounded-md">✓ {q.correct}</span>
                                            <span className="text-yellow-600 text-[10px] font-black uppercase bg-yellow-50 px-2 py-0.5 rounded-md self-end mr-auto">{q.points} د</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminAssignmentsPage() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        let cancelled = false;
        getDocs(query(collection(db, "assignments"), orderBy("createdAt", "desc")))
            .then(snap => {
                if (!cancelled) {
                    setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                }
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("حذف هذا الواجب نهائياً؟")) return;
        await deleteDoc(doc(db, "assignments", id));
        setAssignments(prev => prev.filter(a => a.id !== id));
    };

    const handleToggle = async (assignment) => {
        const newVal = !assignment.isActive;
        await updateDoc(doc(db, "assignments", assignment.id), { isActive: newVal });
        setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, isActive: newVal } : a));
    };

    const filtered = assignments.filter(a => {
        if (filter === "active") return a.isActive;
        if (filter === "inactive") return !a.isActive;
        return true;
    });

    return (
        <div className="p-8 space-y-8 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 font-outfit">إدارة الواجبات</h1>
                    <p className="text-slate-400 text-sm font-black mt-1 tracking-tight uppercase">تصميم ورفع المهام الدراسية الآلية</p>
                </div>
                <Button onClick={() => setModal("add")} className="bg-slate-900 hover:bg-black text-white px-8 h-12 rounded-2xl font-black gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-105">
                    <Plus className="w-5 h-5" /> إضافة واجب جديد
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm">
                {[{ value: "all", label: "جميع الواجبات" }, { value: "active", label: "المنشورة" }, { value: "inactive", label: "المسودة" }].map(f => (
                    <button key={f.value} onClick={() => setFilter(f.value)}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-black transition-all",
                            filter === f.value
                                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                        )}>
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] border border-slate-50 animate-pulse shadow-sm" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-50 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-12 h-12 text-slate-200" />
                    </div>
                    <h3 className="text-slate-900 font-black text-2xl mb-2">قائمة الواجبات فارغة</h3>
                    <p className="text-slate-400 font-bold mb-8">ابدأ بإنشاء أول واجب لإختبار معلومات طلابك</p>
                    <Button onClick={() => setModal("add")} className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-xl font-black gap-2">
                        إضافة أول واجب
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(assignment => (
                            <motion.div key={assignment.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <AssignmentRow
                                    assignment={assignment}
                                    onEdit={setModal}
                                    onDelete={handleDelete}
                                    onToggle={handleToggle}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {modal && (
                <AssignmentModal
                    assignment={modal === "add" ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => {
                        getDocs(query(collection(db, "assignments"), orderBy("createdAt", "desc")))
                            .then(snap => setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
                    }}
                />
            )}
        </div>
    );
}
