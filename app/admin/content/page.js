"use client";
import { useState, useEffect } from "react";
import {
    collection, query, orderBy, getDocs,
    addDoc, updateDoc, deleteDoc, doc, serverTimestamp, arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, BookOpen, ChevronDown, ChevronUp, Edit2, Trash2,
    Eye, EyeOff, Upload, X, Save, Loader2, Video, Type,
    Image as ImageIcon, GripVertical, FileText, Link as LinkIcon,
    Layers, Hash, Info, FileArchive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAlert } from "@/components/providers/alert-provider";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file, resourceType = "auto") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) throw new Error("فشل رفع الملف");
    const data = await res.json();
    return data.secure_url;
}

const TYPE_ICONS = {
    video: Video,
    pdf: FileArchive,
    rich_text: Type,
    image: ImageIcon,
};

// ── Content Entry Row (Internal items of a lesson) ──────────────────────────────
function ContentEntryRow({ entry, index, total, onChange, onRemove }) {
    const { showAlert } = useAlert();
    const [uploading, setUploading] = useState(false);

    const extractYouTubeId = (url) => {
        if (!url) return "";
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : url;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const isVideo = file.type.startsWith("video/");
            const url = await uploadToCloudinary(file, isVideo ? "video" : "auto");
            onChange({ ...entry, value: url });
        } catch (err) {
            showAlert("فشل رفع الملف: " + err.message, "خطأ في الرفع", "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-4 relative group">
            <button onClick={onRemove} className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-white border border-slate-100 text-red-500 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Trash2 className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-wider mr-1">تسمية العنصر (Label)</label>
                    <Input
                        value={entry.label}
                        onChange={e => onChange({ ...entry, label: e.target.value })}
                        placeholder="مثال: فيديو الشرح الأساسي"
                        className="h-10 text-xs font-bold rounded-xl border-slate-200"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-wider mr-1">نوع العنصر</label>
                    <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
                        {[
                            { id: "video", label: "فيديو" },
                            { id: "rich_text", label: "نص" },
                            { id: "image", label: "صورة" },
                            { id: "pdf", label: "ملف/PDF" }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => onChange({ ...entry, type: t.id })}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all",
                                    entry.type === t.id ? "bg-slate-900 text-white shadow-sm" : "bg-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-wider mr-1">المحتوى ({entry.type === "video" ? "YouTube ID or URL" : "Value"})</label>
                {entry.type === "rich_text" ? (
                    <textarea
                        value={entry.value}
                        onChange={e => onChange({ ...entry, value: e.target.value })}
                        placeholder="أدخل النص هنا (يدعم HTML)..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/5 resize-none h-24"
                    />
                ) : (
                    <div className="flex gap-2">
                        <Input
                            value={entry.value}
                            onChange={e => {
                                const val = e.target.value;
                                onChange({ ...entry, value: entry.type === "video" ? extractYouTubeId(val) : val });
                            }}
                            placeholder={entry.type === "video" ? "أدخل رابط يوتيوب أو معرف الفيديو" : "ضع رابطاً هنا أو ارفع ملفاً..."}
                            className="h-10 text-xs font-bold rounded-xl border-slate-200 flex-1"
                        />
                        <label className={cn(
                            "h-10 px-4 rounded-xl border border-dashed flex items-center justify-center cursor-pointer transition-all",
                            uploading ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-white border-slate-300 text-slate-600 hover:border-violet-500 hover:text-violet-500"
                        )}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Sub-Lecture (Lesson) Form Modal ───────────────────────────────────────────
function SubLectureModal({ lecture, subLecture, onClose, onSaved }) {
    const { showAlert } = useAlert();
    const isEdit = !!subLecture;
    // We use a flat state for editing
    const [form, setForm] = useState({
        title: subLecture?.title || "",
        type: subLecture?.type || "video",
        id: subLecture?.id || "",
        content: subLecture?.content || [],
    });
    const [saving, setSaving] = useState(false);

    // Auto-generate ID if empty and title changes
    useEffect(() => {
        if (!isEdit && !form.id && form.title) {
            // e.g., sub_1_2
            const lectureOrder = lecture.order || 1;
            const nextIdx = (lecture.subLectures?.length || 0) + 1;
            setForm(f => ({ ...f, id: `sub_${lectureOrder}_${nextIdx}` }));
        }
    }, [form.title, isEdit, lecture]);

    const addEntry = () => {
        setForm(f => ({
            ...f,
            content: [...f.content, { label: "", type: "video", value: "" }]
        }));
    };

    const updateEntry = (i, updated) => {
        setForm(f => {
            const content = [...f.content];
            content[i] = updated;
            return { ...f, content };
        });
    };

    const removeEntry = (i) => {
        setForm(f => ({ ...f, content: f.content.filter((_, idx) => idx !== i) }));
    };

    const handleSave = async () => {
        if (!form.title.trim()) return showAlert("أدخل عنوان الدرس", "حقل مطلوب", "warning");
        if (!form.id.trim()) return showAlert("أدخل معرف الدرس (ID)", "حقل مطلوب", "warning");

        setSaving(true);
        try {
            const currentSubLectures = [...(lecture.subLectures || [])];
            const newSub = {
                id: form.id,
                title: form.title,
                type: form.type,
                content: form.content
            };

            let updatedList;
            if (isEdit) {
                updatedList = currentSubLectures.map(s => s.id === subLecture.id ? newSub : s);
            } else {
                updatedList = [...currentSubLectures, newSub];
            }

            await updateDoc(doc(db, "lectures", lecture.id), {
                subLectures: updatedList,
                updatedAt: serverTimestamp()
            });

            onSaved();
            onClose();
        } catch (e) {
            showAlert("فشل الحفظ: " + e.message, "خطأ في الحفظ", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-60 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-slate-900 font-black text-2xl">{isEdit ? "تعديل الدرس" : "درس تعليمي جديد"}</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">منصة أفهم التعليمية</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><X className="w-8 h-8" /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-slate-900 text-[11px] font-black mr-1 uppercase">عنوان الدرس *</label>
                            <Input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="مثال: البعد الثالث في الفراغ"
                                className="h-14 text-lg font-black rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-900 text-[11px] font-black mr-1 uppercase flex items-center gap-1.5">
                                <Hash className="w-3 h-3" /> معرف الدرس (ID) *
                            </label>
                            <Input
                                value={form.id}
                                onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                                placeholder="sub_1_1"
                                className="h-12 text-sm font-bold rounded-xl border-slate-100 bg-slate-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-900 text-[11px] font-black mr-1 uppercase">أيقونة العرض الرئيسية</label>
                            <div className="flex gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                {Object.entries(TYPE_ICONS).map(([t, Icon]) => (
                                    <button
                                        key={t}
                                        onClick={() => setForm(f => ({ ...f, type: t }))}
                                        className={cn(
                                            "flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg transition-all",
                                            form.type === t ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <Icon className="w-4 h-4 mb-1" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">{t}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Builder */}
                    <div className="space-y-6 pt-8 border-t border-slate-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <label className="text-slate-900 text-sm font-black uppercase tracking-widest">الموارد والمحلقات</label>
                            </div>
                            <Button onClick={addEntry} variant="outline" className="h-10 rounded-xl px-5 font-black text-xs gap-2 border-slate-200 hover:bg-slate-50">
                                <Plus className="w-4 h-4" /> إضافة مورد (فيديو/نص/ملف)
                            </Button>
                        </div>

                        {form.content.length === 0 && (
                            <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                <Info className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold text-sm leading-relaxed">لم تضف أي موارد لهذا الدرس بعد.<br />الدروس غالباً ما تحتوي على فيديو شرح وملف PDF وسؤال تمهيدي.</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {form.content.map((entry, i) => (
                                <ContentEntryRow
                                    key={i}
                                    index={i}
                                    total={form.content.length}
                                    entry={entry}
                                    onChange={(u) => updateEntry(i, u)}
                                    onRemove={() => removeEntry(i)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-50 flex justify-end gap-3 bg-white shrink-0">
                    <Button variant="ghost" onClick={onClose} className="px-6 rounded-2xl font-black text-slate-400 hover:text-slate-900">إلغاء</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-black gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isEdit ? "تحديث الدرس" : "إضافة للجدول"}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Lecture Form Modal ────────────────────────────────────────────────────────
function LectureModal({ lecture, onClose, onSaved, nextOrder }) {
    const { showAlert } = useAlert();
    const isEdit = !!lecture;
    const [form, setForm] = useState({
        title: lecture?.title || "",
        description: lecture?.description || "",
        order: lecture?.order ?? nextOrder ?? 1,
        isActive: lecture?.isActive ?? true,
        thumbnail: lecture?.thumbnail || "",
    });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // If it's a new lecture, we try to set the next order automatically if provided
    useEffect(() => {
        if (!isEdit && nextOrder) {
            setForm(f => ({ ...f, order: nextOrder }));
        }
    }, [nextOrder, isEdit]);

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadToCloudinary(file, "image");
            setForm(f => ({ ...f, thumbnail: url }));
        } catch (err) {
            showAlert("فشل رفع الصورة: " + err.message, "خطأ في الرفع", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!form.title.trim()) return showAlert("أدخل عنوان المحاضرة", "حقل مطلوب", "warning");
        setSaving(true);
        try {
            const data = {
                title: form.title,
                description: form.description,
                order: Number(form.order),
                isActive: form.isActive,
                thumbnail: form.thumbnail,
                updatedAt: serverTimestamp(),
            };
            if (isEdit) {
                await updateDoc(doc(db, "lectures", lecture.id), data);
            } else {
                await addDoc(collection(db, "lectures"), {
                    ...data,
                    subLectures: [],
                    createdAt: serverTimestamp()
                });
            }
            onSaved();
            onClose();
        } catch (e) {
            showAlert("فشل الحفظ: " + e.message, "خطأ في الحفظ", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 w-full max-w-xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-slate-900 font-black text-2xl">{isEdit ? "تعديل المحاضرة" : "محاضرة جديدة"}</h2>
                        <p className="text-slate-400 text-xs font-black uppercase mt-1 tracking-widest text-right">إعدادات المنهج والجدولة</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 transition-all"><X className="w-7 h-7 text-slate-300 hover:text-slate-900" /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-slate-900 text-sm font-black mr-1 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> عنوان المحاضرة *</label>
                        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="مثال: الباب الأول - مقدمة الكيمياء الحرارية"
                            className="bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 text-slate-900 h-14 rounded-2xl font-bold text-lg transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-slate-900 text-sm font-black mr-1">وصف المنهج</label>
                        <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="وصف مختصر يظهر للطلاب في البطاقة الترحيبية..."
                            className="w-full bg-slate-50 text-slate-900 text-base rounded-2xl px-4 py-4 border-transparent focus:bg-white focus:ring-4 focus:ring-slate-100 focus:outline-none resize-none font-medium leading-relaxed transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-slate-900 text-sm font-black mr-1">رقم المحاضرة (الترتيب)</label>
                            <Input type="number" min={1} value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                                className="bg-slate-50 border-transparent h-12 rounded-xl font-black text-center text-lg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-slate-900 text-sm font-black mr-1">الرؤية العامة</label>
                            <button
                                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                className={cn(
                                    "w-full h-12 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center gap-2",
                                    form.isActive
                                        ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                        : "bg-slate-50 border-slate-100 text-slate-400"
                                )}
                            >
                                <div className={cn("w-2 h-2 rounded-full", form.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                {form.isActive ? "مرئية للجميع" : "مخفية مؤقتاً"}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-slate-900 text-sm font-black mr-1">غلاف المحاضرة (Thumbnail)</label>
                        {form.thumbnail ? (
                            <div className="relative w-full h-48 rounded-[2.5rem] overflow-hidden bg-slate-100 border-4 border-white shadow-xl group">
                                <img src={form.thumbnail} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <button onClick={() => setForm(f => ({ ...f, thumbnail: "" }))}
                                        className="w-12 h-12 rounded-2xl bg-white text-red-500 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all">
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className={cn(
                                "flex flex-col items-center justify-center gap-4 w-full h-48 rounded-[3rem] border-4 border-dashed font-black text-sm cursor-pointer transition-all",
                                uploading
                                    ? "bg-slate-50 border-slate-100 text-slate-300 cursor-wait"
                                    : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:border-slate-200"
                            )}>
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-slate-50">
                                    {uploading ? <Loader2 className="w-8 h-8 animate-spin text-slate-400" /> : <ImageIcon className="w-8 h-8 text-slate-300" />}
                                </div>
                                <div className="text-center">
                                    <p>{uploading ? "جاري المعالجة..." : "انقر لاختيار صورة الغلاف"}</p>
                                    <p className="text-[9px] text-slate-300 uppercase tracking-widest mt-1">Recommended: 1280x720 PNG/JPG</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>
                <div className="p-8 border-t border-slate-50 flex justify-end gap-3 bg-white">
                    <Button variant="ghost" onClick={onClose} className="rounded-2xl font-black text-slate-400 hover:text-slate-900 h-12 px-6">إلغاء</Button>
                    <Button onClick={handleSave} disabled={saving || uploading} className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-black gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-105">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isEdit ? "حفظ كمدخل معدل" : "نشر المحاضرة"}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Lecture Row ───────────────────────────────────────────────────────────────
function LectureRow({ lecture, onEdit, onDelete, onToggle, onRefresh }) {
    const { showConfirm } = useAlert();
    const [expanded, setExpanded] = useState(false);
    const [subModal, setSubModal] = useState(null);
    const [deletingSubId, setDeletingSubId] = useState(null);

    const handleDeleteSub = async (subId) => {
        showConfirm("هل تريد حذف هذا الدرس نهائياً من المحاضرة؟", async () => {
            setDeletingSubId(subId);
            try {
                const updatedList = (lecture.subLectures || []).filter(s => s.id !== subId);
                await updateDoc(doc(db, "lectures", lecture.id), {
                    subLectures: updatedList,
                    updatedAt: serverTimestamp()
                });
                onRefresh();
            } finally {
                setDeletingSubId(null);
            }
        });
    };

    const subLectures = lecture.subLectures || [];

    return (
        <motion.div
            layout
            className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group"
        >
            <div className="flex flex-col md:flex-row md:items-center gap-6 p-8">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    {lecture.thumbnail ? (
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shrink-0 shadow-lg border-2 border-white group-hover:scale-105 transition-transform duration-500">
                            <img src={lecture.thumbnail} alt={lecture.title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                            <BookOpen className="w-10 h-10 text-slate-200" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="bg-slate-900 text-[10px] font-black text-white px-3 py-1.5 rounded-xl uppercase tracking-tighter">وحدة {lecture.order}</span>
                            <span className={cn(
                                "text-[10px] font-black px-3 py-1.5 rounded-xl border",
                                lecture.isActive ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-400"
                            )}>
                                {lecture.isActive ? "منشورة" : "نسخة مسودة"}
                            </span>
                        </div>
                        <h3 className="text-slate-900 font-black text-xl sm:text-2xl mb-1.5 truncate group-hover:text-blue-600 transition-colors uppercase">{lecture.title}</h3>
                        <p className="text-slate-400 font-medium text-sm line-clamp-1 h-5">{lecture.description || "لا يوجد وصف لهذه المحاضرة حالياً."}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => onToggle(lecture)}
                            className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-2xl", lecture.isActive ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-300 hover:bg-slate-50")}>
                            {lecture.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onEdit(lecture)}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl text-blue-500 hover:bg-blue-50">
                            <Edit2 className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(lecture.id)}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl text-red-500 hover:bg-red-50">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="w-px h-10 bg-slate-100 mx-2 hidden md:block" />
                    <Button size="icon" variant="ghost" onClick={() => setExpanded(!expanded)}
                        className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-4xl transition-all shadow-sm", expanded ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "border border-slate-100 text-slate-300 hover:bg-slate-100")}>
                        {expanded ? <ChevronUp className="w-7 h-7" /> : <ChevronDown className="w-7 h-7" />}
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50 border-t border-slate-100 overflow-hidden"
                    >
                        <div className="p-6 sm:p-10 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                                        <Layers className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-black text-sm uppercase tracking-widest leading-none">محتويات المحاضرة</p>
                                        <p className="text-slate-400 text-[10px] font-bold mt-1.5 uppercase leading-none">{subLectures.length} دروس تعليمية مبرمجة</p>
                                    </div>
                                </div>
                                <Button onClick={() => setSubModal("add")}
                                    className="bg-slate-900 hover:bg-black text-white px-6 h-12 rounded-2xl font-black text-xs gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto">
                                    <Plus className="w-4 h-4" /> إضافة درس (قسيمة جديدة)
                                </Button>
                            </div>

                            {subLectures.length === 0 ? (
                                <div className="py-20 bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center justify-center gap-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                                        <Layers className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h4 className="text-slate-400 font-black text-lg mb-1">المحاضرة لا تحتوي على دروس حالياً</h4>
                                        <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">اضغط على زر الإضافة للبدء في تجهيز الدروس</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {subLectures.map((sub, i) => {
                                        const Icon = TYPE_ICONS[sub.type] || Video;
                                        return (
                                            <div key={sub.id || i} className="flex items-center gap-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:border-violet-100 hover:shadow-xl hover:shadow-slate-100 transition-all group/card">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg shadow-slate-200 transition-transform group-hover/card:scale-110">
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-slate-900 text-lg font-black truncate leading-tight mb-1">{sub.title}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-tighter bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{sub.id}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <span className="text-violet-600 text-[9px] font-black uppercase tracking-tighter bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">{sub.content?.length || 0} موارد</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-100 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" onClick={() => setSubModal(sub)}
                                                        className="w-10 h-10 rounded-xl text-blue-500 hover:bg-white hover:shadow-sm">
                                                        <Edit2 className="w-4.5 h-4.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteSub(sub.id)}
                                                        disabled={deletingSubId === sub.id}
                                                        className="w-10 h-10 rounded-xl text-red-500 hover:bg-white hover:shadow-sm">
                                                        {deletingSubId === sub.id ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Trash2 className="w-4.5 h-4.5" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {subModal && (
                <SubLectureModal
                    lecture={lecture}
                    subLecture={subModal === "add" ? null : subModal}
                    onClose={() => setSubModal(null)}
                    onSaved={onRefresh}
                />
            )}
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminContentPage() {
    const { showConfirm } = useAlert();
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);

    const fetchLectures = async () => {
        try {
            const snap = await getDocs(query(collection(db, "lectures"), orderBy("order", "asc")));
            setLectures(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error("fetchLectures:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLectures();
    }, []);

    const handleDelete = async (id) => {
        showConfirm("تحذير: سيتم حذف المحاضرة وجميع الدروس داخلها نهائياً! هل أنت متأكد؟", async () => {
            await deleteDoc(doc(db, "lectures", id));
            setLectures(l => l.filter(x => x.id !== id));
        });
    };

    const handleToggle = async (lecture) => {
        const newVal = !lecture.isActive;
        await updateDoc(doc(db, "lectures", lecture.id), { isActive: newVal });
        setLectures(l => l.map(x => x.id === lecture.id ? { ...x, isActive: newVal } : x));
    };

    const nextOrder = lectures.length > 0 ? Math.max(...lectures.map(l => l.order || 0)) + 1 : 1;

    return (
        <div className="p-4 sm:p-8 space-y-10 min-h-screen bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase">مستودع المنهج</h1>
                    <p className="text-slate-400 text-sm font-black mt-1.5 tracking-widest uppercase opacity-60">تجهيز وتنظيم المحتوى التعليمي التفاعلي</p>
                </div>
                <Button onClick={() => setModal("add")} className="bg-slate-900 hover:bg-black text-white px-8 sm:px-10 h-14 rounded-[1.5rem] font-black gap-3 shadow-2xl shadow-slate-200 transition-all hover:scale-105 active:scale-95 group w-full sm:w-auto">
                    <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" /> إضافة محاضرة جديدة
                </Button>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-slate-200 rounded-[3rem] animate-pulse" />
                    ))}
                </div>
            ) : lectures.length === 0 ? (
                <div className="py-40 text-center bg-white rounded-[4rem] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-violet-500 via-blue-500 to-emerald-500" />
                    <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <BookOpen className="w-16 h-16 text-slate-200" />
                    </div>
                    <h2 className="text-slate-900 font-black text-3xl mb-3 tracking-tighter">أكاديميتك بانتظار المحتوى!</h2>
                    <p className="text-slate-400 font-bold mb-10 max-w-md mx-auto leading-relaxed px-6">لم تقم بإضافة أي محاضرات دراسية بعد. ابدأ الآن ببناء الباب الأول ليرى طلابك المحتوى الجاهز.</p>
                    <Button onClick={() => setModal("add")} className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-black shadow-xl shadow-slate-200">
                        إنشاء أولى محاضرات المنهج
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {lectures.map(lecture => (
                        <LectureRow
                            key={lecture.id}
                            lecture={lecture}
                            onEdit={setModal}
                            onRefresh={fetchLectures}
                            onDelete={handleDelete}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}

            {modal && (
                <LectureModal
                    lecture={modal === "add" ? null : modal}
                    nextOrder={nextOrder}
                    onClose={() => setModal(null)}
                    onSaved={fetchLectures}
                />
            )}
        </div>
    );
}
