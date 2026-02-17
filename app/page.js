"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/study-content");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-20 pb-12">
          <Skeleton className="h-16 w-64 mb-6 rounded-2xl" />
          <Skeleton className="h-4 w-96 mb-12 rounded-lg opacity-50" />
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
            <Skeleton className="h-16 flex-1 rounded-2xl" />
            <Skeleton className="h-16 flex-1 rounded-2xl border-2" />
          </div>
        </main>
      </div>
    );
  }


  // If user is logged in, we are redirecting, but render null to avoid flashing guest content
  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-black text-slate-900 mb-6 tracking-tight">
            منصة <span className="text-primary italic">أفهم</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mb-12 font-medium leading-relaxed">
            طريقك نحو التميز الدراسي يبدأ من هنا. منصة تعليمية متكاملة تهدف لتبسيط المفاهيم الصعبة ومساعدتك على تحقيق أحلامك.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
            <Button asChild className="flex-1 py-8 text-xl font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/signup">ابدأ الآن </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 py-8 text-xl font-bold rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:scale-105 transition-transform text-slate-700">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
          </div>
        </motion.div>
      </main>

      {/* About Us Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-white border-t border-slate-100 py-24 px-6"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-primary uppercase bg-primary/5 rounded-full">
            من نحن؟
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-8">رؤيتنا للتعليم الحديث</h2>
          <div className="grid gap-8 text-right">
            <p className="text-lg text-slate-600 leading-loose">
              <strong className="text-slate-800">منصة أفهم</strong> هي مبادرة تعليمية شبابية تسعى لتحويل تجربة التعلم التقليدية إلى رحلة ممتعة وتفاعلية. نؤمن أن التعليم يجب أن يكون متاحاً للجميع، مفهوماً، وبسيطاً.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              <motion.div
                whileHover={{ y: -5 }}
                className="p-6 bg-slate-50 rounded-3xl border border-slate-100"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-3">شرح مبسط</h3>
                <p className="text-slate-500">نكسر حواجز التعقيد ونشرح أصعب الدروس بأكثر الطرق بساطة ووضوحاً.</p>
              </motion.div>
              <motion.div
                whileHover={{ y: -5 }}
                className="p-6 bg-slate-50 rounded-3xl border border-slate-100"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-3">دعم متواصل</h3>
                <p className="text-slate-500">نحن معك في كل خطوة، نوفر لك الأدوات والمصادر التي تضمن تفوقك.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-400 text-sm border-t border-slate-50">
        <p>© {new Date().getFullYear()} منصة أفهم. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}


