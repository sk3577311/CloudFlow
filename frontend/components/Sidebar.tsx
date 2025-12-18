"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  Activity,
  Cpu,
  Users,
  Settings,
  Home,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { useSidebar } from "@/lib/sidebarContext";
import { useState } from "react";

const sidebarItems = [
  { name: "Overview", href: "/dashboard/", icon: Home },
  { name: "Jobs", href: "/dashboard/jobs", icon: Layers },
  { name: "Tasks", href: "/dashboard/tasks", icon: Activity },
  { name: "Workers", href: "/dashboard/workers", icon: Cpu },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleSidebar } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside
      className={`group h-screen bg-[var(--tf-card-dark)] border-r border-[var(--tf-border)] fixed top-0 left-0 flex flex-col z-50 transition-[width] duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"}`}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--tf-border)]">
        {!collapsed && (
          <h2 className="text-xl font-bold text-[var(--tf-accent)]">
            TaskFlow
          </h2>
        )}
        <button onClick={toggleSidebar} className="p-2 rounded-xl bg-[#1E1F22] hover:bg-[#2a2c2f] transition">
          {collapsed ? <Menu className="w-5 h-5 text-white/80" /> : <ChevronLeft className="w-5 h-5 text-white/80" />}
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 mt-4">
        {sidebarItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <div key={item.name} className="relative" onMouseEnter={() => setHoveredItem(item.name)} onMouseLeave={() => setHoveredItem(null)}>
              <Link href={item.href} className={`flex items-center gap-3 px-4 py-2 rounded-xl mx-2 transition ${isActive ? "bg-[var(--tf-card)] text-white" : "text-white/80 hover:bg-[#1E1F22]"}`}>
                <Icon className="w-5 h-5 text-white/80" />
                {!collapsed && <span>{item.name}</span>}
              </Link>

              {collapsed && hoveredItem === item.name && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded-md bg-[#121214] text-white text-xs shadow-lg whitespace-nowrap pointer-events-none opacity-100 transition-all duration-150">
                  {item.name}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto py-4 border-t border-[var(--tf-border)] text-center text-xs text-white/60">
        {!collapsed && (
          <>built by{" "}<span className="font-semibold text-[var(--tf-accent)]">Sameer Khan</span></>
        )}
      </div>
    </aside>
  );
}
