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
  { name: "Overview", href: "/dashboard/", icon: Home, color: "text-green-600" },
  { name: "Jobs", href: "/dashboard/jobs", icon: Layers, color: "text-indigo-600" },
  { name: "Tasks", href: "/dashboard/tasks", icon: Activity, color: "text-green-600" },
  { name: "Workers", href: "/dashboard/workers", icon: Cpu, color: "text-yellow-600" },
  { name: "Users", href: "/dashboard/users", icon: Users, color: "text-purple-600" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, color: "text-gray-600" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleSidebar } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside
      className={`group h-screen bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 shadow-sm fixed top-0 left-0 flex flex-col z-50 transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand + Toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-neutral-800">
        {!collapsed && (
          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            TaskFlow
          </h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        >
          {collapsed ? (
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 mt-4">
        {sidebarItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg mx-2 transition-colors ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? item.color : "text-gray-400 dark:text-gray-500"
                  }`}
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>

              {/* Tooltip */}
              {collapsed && hoveredItem === item.name && (
                <div
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded-md bg-gray-800 text-white text-xs shadow-lg whitespace-nowrap pointer-events-none 
                  opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out"
                  style={{ opacity: hoveredItem === item.name ? 1 : 0, transform: "translateX(0)" }}
                >
                  {item.name}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Signature */}
      <div className="mt-auto py-4 border-t border-gray-200 dark:border-neutral-800 text-center text-xs text-gray-400 dark:text-gray-500">
        {!collapsed && (
          <>
            built by{" "}
            <span className="font-semibold text-indigo-500">
              <Link href="https://github.com/sk3577311">Sameer Khan</Link>
            </span>
          </>
        )}
      </div>
    </aside>
  );
}
