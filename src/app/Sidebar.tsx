"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();

  // Role ke hisaab se alag alag menus
  const menus = {
    Admin: [
      { name: "Dashboard Overview", path: "/" },
      { name: "Manage Tickets", path: "/tickets" },
      { name: "Users & Agents", path: "/users" },
      { name: "SLA Reports", path: "/reports" },
      { name: "Settings", path: "/settings" },
    ],
    Agent: [
      { name: "Agent Workspace", path: "/" },
      { name: "Assigned to Me", path: "/assigned" },
      { name: "Resolved Tickets", path: "/resolved" },
    ],
    User: [
      { name: "My Tickets", path: "/" },
      { name: "Submit New Ticket", path: "/new-ticket" },
    ],
  };

  const currentMenu = menus[role as keyof typeof menus] || menus.User;

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col transition-all">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-500 tracking-tight">Helpdesk<span className="text-white">Pro</span></h1>
        <p className="text-xs text-slate-400 mt-2 font-medium">Logged in as {role}</p>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</p>
        {currentMenu.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
          </div>
        </div>
        <a 
          href="/api/auth/signout" 
          className="mt-4 block w-full text-center px-4 py-2 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 text-sm font-medium rounded-lg transition-colors"
        >
          Logout
        </a>
      </div>
    </aside>
  );
}