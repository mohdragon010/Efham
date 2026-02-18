"use client"
import { motion } from "framer-motion";
import { FileText, Calendar, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AssignmentCard({ assignment }) {
    if (!assignment) return null;

    const formatDate = (timestamp) => {
        if (!timestamp) return "";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("ar-EG", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden border-2 border-blue-100 shadow-lg shadow-blue-50/50 bg-linear-to-brrom-white to-blue-50/20">
                <CardContent className="p-0">
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="font-bold">واجب جديد</span>
                        </div>
                        <div className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                            {assignment.totalPoints} درجة
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{assignment.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium">
                            {assignment.description}
                        </p>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 p-3 rounded-xl">
                                <Calendar className="w-4 h-4" />
                                آخر موعد: {formatDate(assignment.deadline)}
                            </div>

                            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 py-6">
                                <Link href={`/study-content/assignments/${assignment.id}`}>
                                    فتح الواجب
                                    <ArrowLeft className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
