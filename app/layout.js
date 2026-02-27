import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
// If you aren't using AuthGuard in the return below, 
// commenting it out can also prevent "undefined" errors during build.
// import AuthGuard from "@/components/authGuard"; 

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
  icons: {
    icon: "/icon.png"
  },
};

import { AlertProvider } from "@/components/providers/alert-provider";

export default function RootLayout({ children }) {
  // Added optional chaining (?.) to font variables to prevent .toString() crashes
  const fontClasses = `${inter?.variable || ''} ${ibmPlexArabic?.variable || ''}`;

  return (
    <html lang="ar" dir="rtl" className="light">
      <body
        suppressHydrationWarning
        className={`${fontClasses} font-sans antialiased bg-slate-50/50 text-slate-900`}
      >
        <AlertProvider>
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}