"use client"
import React, { createContext, useContext, useState, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const AlertContext = createContext(null)

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState(null)
    const [confirm, setConfirm] = useState(null)

    const showAlert = useCallback((message, title = "تنبيه", type = "info") => {
        setAlert({ message, title, type })
    }, [])

    const showConfirm = useCallback((message, onConfirm, title = "تأكيد الإجراء") => {
        setConfirm({ message, title, onConfirm })
    }, [])

    const closeAlert = useCallback(() => {
        setAlert(null)
    }, [])

    const handleConfirm = useCallback(() => {
        if (confirm?.onConfirm) confirm.onConfirm()
        setConfirm(null)
    }, [confirm])

    const getIcon = (type) => {
        switch (type) {
            case "error": return <XCircle className="w-12 h-12 text-red-500" />
            case "success": return <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            case "warning": return <AlertCircle className="w-12 h-12 text-orange-500" />
            default: return <Info className="w-12 h-12 text-blue-500" />
        }
    }

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            {/* Alert Dialog */}
            <Dialog open={!!alert} onOpenChange={closeAlert}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 md:p-10 max-w-sm text-center shadow-2xl">
                    <div className="flex flex-col items-center gap-6">
                        <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center bg-slate-50",
                            alert?.type === 'error' && "bg-red-50",
                            alert?.type === 'success' && "bg-emerald-50",
                            alert?.type === 'warning' && "bg-orange-50",
                            alert?.type === 'info' && "bg-blue-50"
                        )}>
                            {getIcon(alert?.type)}
                        </div>

                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                {alert?.title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-bold text-base leading-relaxed text-center">
                                {alert?.message}
                            </DialogDescription>
                        </div>

                        <Button
                            onClick={closeAlert}
                            className="w-full py-7 text-lg font-black rounded-2xl bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-200 transition-all active:scale-95"
                        >
                            فهمت
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog */}
            <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 md:p-10 max-w-sm text-center shadow-2xl">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-orange-50">
                            <AlertCircle className="w-12 h-12 text-orange-500" />
                        </div>

                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                {confirm?.title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-bold text-base leading-relaxed text-center">
                                {confirm?.message}
                            </DialogDescription>
                        </div>

                        <div className="flex flex-col w-full gap-3">
                            <Button
                                onClick={handleConfirm}
                                className="w-full py-7 text-lg font-black rounded-2xl bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-200 transition-all active:scale-95"
                            >
                                نعم، متأكد
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setConfirm(null)}
                                className="w-full py-4 text-slate-400 font-black"
                            >
                                تراجع
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AlertContext.Provider>
    )
}

export const useAlert = () => {
    const context = useContext(AlertContext)
    if (!context) throw new Error("useAlert must be used within AlertProvider")
    return context
}
