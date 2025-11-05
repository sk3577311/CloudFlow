"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Activity, Cpu, Users, Settings, Home } from "lucide-react";

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

  return (
    <aside className="w-64 bg-white shadow-md h-screen fixed top-0 left-0 flex flex-col py-6 px-4 overflow-y-auto">
      {/* Brand */}
      <h2 className="text-2xl font-bold text-indigo-600 mb-8 text-center">TaskFlow</h2>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {sidebarItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition 
                          ${isActive
                            ? "bg-indigo-50 text-indigo-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? item.color : "text-gray-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Signature */}
      <div className="mt-auto pt-4 border-t text-center text-xs text-gray-400">
         built by <span className="font-semibold text-indigo-500"><Link href="http://github.com/sk3577311">Sameer Khan</Link></span>
      </div>
    </aside>
  );
}
