import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/authGuard";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "أفهم - منصة تعليميه",
  description: "منصة أفهم التعليمية",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className="light">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${ibmPlexArabic.variable} font-sans antialiased bg-slate-50/50 text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}

