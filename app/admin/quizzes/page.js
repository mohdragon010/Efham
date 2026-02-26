"use client";
import { useState, useEffect } from "react";
import {
    collection, query, orderBy, getDocs,
    addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, HelpCircle, Edit2, Trash2, Eye, EyeOff, X,
    Save, Loader2, ChevronDown, ChevronUp, CheckCircle2,
    Star, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAlert } from "@/components/providers/alert-provider";

// ── MCQ Question Builder ───────────────────────────────────────────────────────
function MCQQuestion({ question, index, onChange, onRemove }) {
    const { showAlert } = useAlert();
    const { text = "", options = ["", "", "", ""], correctIndex = 0, points = 5 } = question;

    const addOption = () => {
        onChange({ ...question, options: [...options, ""] });
    };

    const removeOption = (optIdx) => {
        if (options.length <= 2) return showAlert("يجب أن يحتوي السؤال على خيارين على الأقل", "تنبيه", "warning");
        const newOptions = options.filter((_, idx) => idx !== optIdx);
        let newCorrect = correctIndex;
        if (correctIndex === optIdx) newCorrect = 0;
        else if (correctIndex > optIdx) newCorrect = correctIndex - 1;

        // Update both index and text
        onChange({
            ...question,
            options: newOptions,
            correctIndex: newCorrect,
            correct: newOptions[newCorrect]
        });
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative group/q hover:shadow-md transition-shadow">
            <button onClick={onRemove} className="absolute left-6 top-6 p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2 mt-1">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-200">{index + 1}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">MCQ</span>
                </div>
                <div className="flex-1 space-y-6">
                    <textarea rows={2} value={text} placeholder="اكتب نص السؤال الاختياري هنا..."
                        onChange={e => onChange({ ...question, text: e.target.value })}
                        className="w-full bg-transparent text-slate-900 text-lg font-black focus:outline-none placeholder:text-slate-200 resize-none pr-2"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {options.map((opt, i) => (
                            <div key={i} className="relative group/opt">
                                <input
                                    type="text"
                                    value={opt}
                                    placeholder={`الخيار ${i + 1}`}
                                    onChange={e => {
                                        const newOptions = [...options];
                                        newOptions[i] = e.target.value;
                                        // If this option is the correct one, update the 'correct' text too
                                        const update = { options: newOptions };
                                        if (correctIndex === i) update.correct = e.target.value;
                                        onChange({ ...question, ...update });
                                    }}
                                    className={cn(
                                        "w-full bg-slate-50 border-2 py-3 pr-12 pl-12 rounded-2xl text-sm font-bold transition-all focus:outline-none",
                                        correctIndex === i
                                            ? "border-emerald-500/30 text-emerald-700 bg-emerald-50 shadow-sm shadow-emerald-50"
                                            : "border-transparent text-slate-600 focus:border-slate-200"
                                    )}
                                />
                                <button
                                    onClick={() => onChange({ ...question, correctIndex: i, correct: options[i] })}
                                    className={cn(
                                        "absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                        correctIndex === i
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                                            : "bg-white text-slate-300 border border-slate-100 hover:border-emerald-200 hover:text-emerald-500 shadow-sm"
                                    )}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => removeOption(i)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center bg-white text-slate-300 border border-slate-100 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/opt:opacity-100 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addOption}
                            className="w-full h-13.5 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-300 font-black text-xs hover:border-slate-200 hover:text-slate-400 transition-all"
                        >
                            <Plus className="w-4 h-4" /> إضافة خيار
                        </button>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="text-slate-500 text-[10px] font-black uppercase">الدرجات</span>
                            <input type="number" min={1} value={points}
                                onChange={e => onChange({ ...question, points: Number(e.target.value) })}
                                className="bg-transparent text-slate-900 w-12 font-black text-center focus:outline-none" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Quiz Form Modal ────────────────────────────────────────────────────────────
function QuizModal({ quiz, onClose, onSaved }) {
    const { showAlert } = useAlert();
    const isEdit = !!quiz;
    const [form, setForm] = useState({
        title: quiz?.title || "",
        description: quiz?.description || "",
        isActive: quiz?.isActive ?? true,
        duration: quiz?.duration || 30,
        questions: quiz?.questions || [],
    });
    const [saving, setSaving] = useState(false);

    const addQuestion = () => {
        const newQ = { type: "mcq", text: "", points: 5, options: ["", "", "", ""], correctIndex: 0 };
        setForm(f => ({ ...f, questions: [...f.questions, newQ] }));
    };

    const updateQuestion = (i, updated) => {
        setForm(f => {
            const questions = [...f.questions];
            questions[i] = updated;
            return { ...f, questions };
        });
    };

    const removeQuestion = (i) => {
        setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
    };

    const totalPoints = form.questions.reduce((sum, q) => sum + (q.points || 0), 0);

    const handleSave = async () => {
        if (!form.title.trim()) return showAlert("أدخل عنوان الاختبار", "حقل مطلوب", "warning");
        if (!form.duration || form.duration <= 0) return showAlert("أدخل مدة صالحة للاختبار", "خطأ في البيانات", "warning");
        if (form.questions.length === 0) return showAlert("أضف سؤالاً واحداً على الأقل", "نقص بيانات", "warning");

        // Validation
        for (const q of form.questions) {
            if (!q.text.trim()) return showAlert("أكمل جميع نصوص الأسئلة", "تنبيه", "warning");
            if (q.options.some(o => !o.trim())) return showAlert("أكمل جميع خيارات الإجابة", "تنبيه", "warning");
        }

        setSaving(true);
        try {
            const data = {
                title: form.title,
                description: form.description,
                isActive: form.isActive,
                duration: Number(form.duration),
                questions: form.questions,
                totalPoints,
                updatedAt: serverTimestamp(),
            };
            if (isEdit) {
                await updateDoc(doc(db, "quizzes", quiz.id), data);
            } else {
                await addDoc(collection(db, "quizzes"), { ...data, createdAt: serverTimestamp() });
            }
            onSaved();
            onClose();
        } catch (e) {
            showAlert("فشل الحفظ: " + e.message, "خطأ", "error");
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
                        <h2 className="text-slate-900 font-black text-2xl">{isEdit ? "تعديل الاختبار" : "اختبار جديد"}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">منظومة الاختبارات الآلية</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-orange-600 text-[10px] font-black uppercase tracking-tight">{totalPoints} درجة إجمالية</span>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-violet-600 text-[10px] font-black uppercase tracking-tight">{form.duration} دقيقة</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-2 rounded-xl transition-all"><X className="w-7 h-7" /></button>
                </div>
                <div className="p-8 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-slate-900 text-sm font-black mr-1">عنوان الاختبار *</label>
                            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="مثال: الاختبار النهائي - كيمياء"
                                className="bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus-visible:ring-violet-500 h-14 rounded-2xl font-bold text-lg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-slate-900 text-sm font-black mr-1">عن الاختبار</label>
                            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="وصف موجز يظهر للطلاب..."
                                className="w-full bg-slate-50 text-slate-900 text-base rounded-2xl px-4 py-4 border border-slate-100 focus:outline-none focus:border-violet-500 resize-none font-medium" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-slate-900 text-sm font-black mr-1">مدة الاختبار (بالدقائق) *</label>
                                <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                                    placeholder="مثال: 30"
                                    className="bg-slate-50 border-slate-100 text-slate-900 h-12 rounded-xl font-bold" />
                            </div>
                            <div className="space-y-2 flex flex-col justify-end">
                                <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2.5 h-12 rounded-xl border-2 font-black text-xs transition-all",
                                        form.isActive
                                            ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-50"
                                            : "bg-slate-50 border-slate-100 text-slate-400"
                                    )}>
                                    <div className={cn("w-2 h-2 rounded-full", form.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                    {form.isActive ? "الاختبار نشط الآن" : "الاختبار مخفي (مسودة)"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <label className="text-slate-900 text-sm font-black uppercase tracking-widest">تحرير الأسئلة الاختيارية</label>
                            <Button onClick={addQuestion}
                                className="h-10 text-xs bg-orange-600 hover:bg-orange-700 text-white gap-2 rounded-xl shadow-lg shadow-orange-100 font-black px-6">
                                <Plus className="w-4 h-4" /> إضافة سؤال اختيار من متعدد
                            </Button>
                        </div>

                        {form.questions.length === 0 && (
                            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mx-auto mb-4">
                                    <HelpCircle className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-bold text-sm">أضف الأسئلة لتبدأ في بناء الاختبار</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            {form.questions.map((q, i) => (
                                <MCQQuestion key={i} question={q} index={i}
                                    onChange={(u) => updateQuestion(i, u)}
                                    onRemove={() => removeQuestion(i)} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-8 border-t border-slate-50 flex justify-end gap-3 sticky bottom-0 bg-white/80 backdrop-blur-md">
                    <Button variant="ghost" onClick={onClose} className="rounded-2xl font-black text-slate-400 hover:text-slate-900 h-12 px-6">إلغاء</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-black gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-105">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isEdit ? "تحديث الاختبار" : "إنشاء الاختبار"}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Quiz Row ──────────────────────────────────────────────────────────────────
function QuizRow({ quiz, onEdit, onDelete, onToggle }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 shadow-sm">
                    <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="text-slate-900 font-black text-lg group-hover:text-orange-600 transition-colors truncate">{quiz.title}</h3>
                        <span className={cn(
                            "text-[10px] font-black px-2.5 py-1 rounded-lg border",
                            quiz.isActive ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-400"
                        )}>
                            {quiz.isActive ? "فعال" : "مسودة"}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-tight flex-wrap">
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" /> {quiz.totalPoints ?? 0} درجة</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="flex items-center gap-1.5 text-slate-500/80"><Clock className="w-3 h-3" /> {quiz.duration || 30} دقيقة</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="truncate">{quiz.questions?.length ?? 0} سؤال مؤتمت</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-slate-50">
                    <Button size="icon" variant="ghost" onClick={() => onToggle(quiz)}
                        className={cn("w-10 h-10 rounded-xl", quiz.isActive ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-300 hover:bg-slate-50")}>
                        {quiz.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onEdit(quiz)}
                        className="w-10 h-10 rounded-xl text-blue-500 hover:bg-blue-50">
                        <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(quiz.id)}
                        className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50">
                        <Trash2 className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-8 bg-slate-100 mx-1 hidden sm:block" />
                    <Button size="icon" variant="ghost" onClick={() => setExpanded(!expanded)}
                        className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl transition-all shadow-sm mr-auto sm:mr-0", expanded ? "bg-slate-900 text-white" : "text-slate-300 hover:bg-slate-100 group-hover:text-slate-600")}>
                        {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {expanded && quiz.questions?.length > 0 && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        className="bg-slate-50/50 border-t border-slate-100 overflow-hidden">
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quiz.questions.map((q, i) => (
                                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative group/card hover:shadow-md transition-all">
                                    <div className="flex gap-4">
                                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-900 font-bold text-sm mb-2 line-clamp-2 group-hover/card:line-clamp-none transition-all">{q.text || "—"}</p>
                                            <div className="flex items-center gap-2 mt-auto">
                                                <span className="text-orange-600 text-[9px] font-black uppercase bg-orange-50 px-2 py-0.5 rounded-md">اختياري (MCQ)</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-yellow-600 text-[9px] font-black uppercase bg-yellow-50 px-2 py-0.5 rounded-md">{q.points} درجة</span>
                                            </div>
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
export default function AdminQuizzesPage() {
    const { showConfirm } = useAlert();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        let cancelled = false;
        getDocs(query(collection(db, "quizzes"), orderBy("createdAt", "desc")))
            .then(snap => {
                if (!cancelled) {
                    setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                }
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const handleDelete = async (id) => {
        showConfirm("حذف هذا الاختبار نهائياً؟", async () => {
            await deleteDoc(doc(db, "quizzes", id));
            setQuizzes(prev => prev.filter(q => q.id !== id));
        });
    };

    const handleToggle = async (quiz) => {
        const newVal = !quiz.isActive;
        await updateDoc(doc(db, "quizzes", quiz.id), { isActive: newVal });
        setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, isActive: newVal } : q));
    };

    const filtered = quizzes.filter(q => {
        if (filter === "active") return q.isActive;
        if (filter === "inactive") return !q.isActive;
        return true;
    });

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 min-h-screen">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">إدارة الاختبارات</h1>
                    <p className="text-slate-400 text-xs sm:text-sm font-black mt-1 tracking-tight uppercase">منظومة التقييم والقياس المؤتمت</p>
                </div>
                <Button onClick={() => setModal("add")} className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-8 h-12 rounded-2xl font-black gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                    <Plus className="w-5 h-5" /> إضافة اختبار جديد
                </Button>
            </div>

            <div className="flex gap-1 sm:gap-2 p-1 bg-white border border-slate-100 rounded-2xl w-fit shadow-xs overflow-x-auto max-w-full no-scrollbar">
                {[{ value: "all", label: "الكل" }, { value: "active", label: "النشطة" }, { value: "inactive", label: "المسودات" }].map(f => (
                    <button key={f.value} onClick={() => setFilter(f.value)}
                        className={cn(
                            "px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all whitespace-nowrap",
                            filter === f.value
                                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                : "text-slate-400 hover:text-slate-900"
                        )}>
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-[2rem] animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-50 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center mx-auto mb-6">
                        <HelpCircle className="w-12 h-12 text-slate-200" />
                    </div>
                    <h3 className="text-slate-900 font-black text-2xl mb-2">بنك الاختبارات فارغ</h3>
                    <p className="text-slate-400 font-bold mb-8">ابدأ بتجهيز أول اختبار شامل لطلابك</p>
                    <Button onClick={() => setModal("add")} className="bg-orange-600 hover:bg-orange-700 text-white px-8 h-12 rounded-xl font-black gap-2">
                        إضافة أول اختبار
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(quiz => (
                            <motion.div key={quiz.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <QuizRow quiz={quiz} onEdit={setModal} onDelete={handleDelete} onToggle={handleToggle} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {modal && (
                <QuizModal
                    quiz={modal === "add" ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => {
                        getDocs(query(collection(db, "quizzes"), orderBy("createdAt", "desc")))
                            .then(snap => setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
                    }}
                />
            )}
        </div>
    );
}
