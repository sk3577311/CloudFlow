"use client";

import NovaLayout from "@/components/layout/NovaLayout";
import { RefreshProvider } from "@/lib/refreshContext";
import { ToastProvider } from "@/components/Toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RefreshProvider>
      <NovaLayout>
        {children}
      </NovaLayout>
      <ToastProvider />
    </RefreshProvider>
  );
}


// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import Sidebar from "@/components/Sidebar";
// import TopBar from "@/components/TopBar";
// import { isAuthenticated } from "@/lib/auth";
// import { RefreshProvider, useRefresh } from "@/lib/refreshContext";
// import { SidebarProvider, useSidebar } from "@/lib/sidebarContext";
// import { ToastProvider } from "@/components/Toast";

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <SidebarProvider>
//       <RefreshProvider>
//         <DashboardShell>{children}</DashboardShell>
//         <ToastProvider />
//       </RefreshProvider>
//     </SidebarProvider>
//   );
// }

// function DashboardShell({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const pathname = usePathname();

//   const { collapsed } = useSidebar();
//   const { trigger, isRefreshing } = useRefresh();

//   const [isAuthChecked, setIsAuthChecked] = useState(false);
//   const [lastUpdate, setLastUpdate] = useState("");

//   const isReloaderRoute = pathname.startsWith("/reloading");

//   useEffect(() => {
//     // skip checks for reloader
//     if (isReloaderRoute) {
//       setIsAuthChecked(true);
//       return;
//     }

//     // normal dashboard auth
//     if (!isAuthenticated()) {
//       router.replace("/login");
//       return;
//     }

//     setIsAuthChecked(true);
//     setLastUpdate(new Date().toLocaleTimeString());
//   }, [pathname]);

//   if (!isAuthChecked) return null;

//   if (isReloaderRoute) return <>{children}</>;

//   const pageTitle = pathname.split("/").filter(Boolean).pop() || "Dashboard";

//   return (
//     <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900">
//       <Sidebar />

//       <div className={`flex-1 flex flex-col transition-all ${collapsed ? "ml-20" : "ml-64"}`}>
//         <TopBar
//           title={pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)}
//           onRefresh={trigger}
//           loading={isRefreshing}
//           lastUpdate={lastUpdate}
//         />

//         <main className="flex-1 p-8 overflow-y-auto">{children}</main>
//       </div>
//     </div>
//   );
// }
