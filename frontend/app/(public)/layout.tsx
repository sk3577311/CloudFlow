// app/(public)/layout.tsx
"use client";

import { ToastProvider } from "@/components/Toast";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastProvider />
    </>
  );
}
