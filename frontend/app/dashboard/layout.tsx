'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { isAuthenticated } from '@/lib/auth';
import { RefreshProvider, useRefresh } from '@/lib/refreshContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RefreshProvider>
      <DashboardShell>{children}</DashboardShell>
    </RefreshProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState('');
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const router = useRouter();
  const { trigger, isRefreshing } = useRefresh(); // 🔥 connects refresh
  const pathname = usePathname();
  const pageTitle = pathname.split('/').filter(Boolean).pop() || 'Dashboard';

  // Check auth
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthChecked(true);
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [router]);

  const handleRefresh = () => {
    trigger(); // ✅ broadcast to all pages
    setLastUpdate(new Date().toLocaleTimeString());
  };

  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600 text-sm">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <div className="sticky top-0 z-50 bg-gray-50 shadow-sm">
          <TopBar
            title={pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)}
            onRefresh={handleRefresh}
            lastUpdate={lastUpdate}
            loading={isRefreshing}
          />
        </div>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
