import AdminGuard from "@/components/adminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
    title: "لوحة التحكم - أفهم",
    description: "لوحة تحكم المشرفين",
};

export default function AdminLayout({ children }) {
    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" dir="rtl">
                <AdminSidebar />
                {/* Main Content — offset by sidebar width on desktop, no offset on mobile */}
                <main className="flex-1 md:mr-64 min-h-screen overflow-x-hidden pt-16 md:pt-0">
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}
