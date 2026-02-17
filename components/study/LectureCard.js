"use client"
import { motion } from "framer-motion";
import { Play, BookOpen, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function LectureCard({ lecture }) {
    if (!lecture) return null;

    return (
        <Link href={`/study-content/lectures/${lecture.id}`}>
            <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
            >
                <Card className="overflow-hidden border border-slate-200 hover:border-primary/50 transition-colors shadow-sm hover:shadow-xl hover:shadow-primary/5">
                    <CardContent className="p-0">
                        {/* Thumbnail Placeholder */}
                        <div className="relative aspect-video bg-slate-100 flex items-center justify-center group">
                            {lecture.thumbnail ? (
                                <img
                                    src={lecture.thumbnail}
                                    alt={lecture.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                    <BookOpen className="w-12 h-12 text-slate-300" />
                                </div>
                            )}
                            {/* Play Overlay */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                    <Play className="w-6 h-6 fill-current" />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 text-right">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                    المحاضرة {lecture.order}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mr-auto">
                                    <Clock className="w-3 h-3" />
                                    {lecture.subLectures?.length || 0} أجزاء
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2 truncate">
                                {lecture.title}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium line-clamp-2">
                                {lecture.description}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </Link>
    );
}
