import AuthGuard from "@/components/authGuard"
import Navbar from "@/components/Navbar"

export default function StudyContentLayout({ children }) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50/30 flex flex-col">
                <Navbar />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </AuthGuard>
    )
}