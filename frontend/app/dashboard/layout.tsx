"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { isAuthenticated } from "@/lib/auth";
import { RefreshProvider, useRefresh } from "@/lib/refreshContext";
import { SidebarProvider, useSidebar } from "@/lib/sidebarContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <RefreshProvider>
        <DashboardShell>{children}</DashboardShell>
      </RefreshProvider>
    </SidebarProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState("");
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const router = useRouter();
  const { trigger, isRefreshing } = useRefresh();
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const pageTitle = pathname.split("/").filter(Boolean).pop() || "Dashboard";

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setIsAuthChecked(true);
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [router]);

  const handleRefresh = () => {
    trigger();
    setLastUpdate(new Date().toLocaleTimeString());
  };

  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-900">
        <p className="text-gray-600 dark:text-gray-400 text-sm animate-pulse">
          Checking authentication...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content (auto expand/collapse) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <TopBar
          title={pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)}
          onRefresh={handleRefresh}
          lastUpdate={lastUpdate}
          loading={isRefreshing}
        />
        <main className="flex-1 p-8 overflow-y-auto transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
