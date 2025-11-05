import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "TaskFlow Cloud",
  description: "Async Job Queue & Scheduler Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
