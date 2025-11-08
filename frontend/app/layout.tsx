import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "next-themes";

export const metadata = {
  title: "TaskFlow Cloud",
  description: "Async Job Queue & Scheduler Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 antialiased">
        <ThemeProvider>
            {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
