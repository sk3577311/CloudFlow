// app/layout.tsx  (SERVER COMPONENT)
import "./globals.css";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"], weight: ["300","400","500","600"] });

export const metadata = {
  title: "TaskFlow Cloud",
  description: "Async Job Queue & Scheduler Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} dark`}>
      <body className="min-h-screen bg-[var(--tf-bg)] text-white antialiased">
        <ToastProvider/>
        {children}
      </body>
    </html>
  );
}
