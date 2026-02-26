import AdminGuard from "@/components/adminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
    title: "لوحة التحكم - أفهم",
    description: "لوحة تحكم المشرفين",
};

export default function AdminLayout({ children }) {
    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-50 flex" dir="rtl">
                <AdminSidebar />
                {/* Main Content — offset by sidebar width */}
                <main className="flex-1 mr-64 min-h-screen overflow-x-hidden">
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}
