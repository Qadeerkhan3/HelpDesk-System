"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  Users,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  FolderKanban,
  AlertTriangle,
  Settings
} from "lucide-react";

export default function Sidebar({ role, userName }: { role?: string | null; userName?: string | null }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all
    ${isActive(path)
      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
      : "text-slate-400 hover:text-white hover:bg-slate-800/60"}
  `;

  return (
    <>
      {/* Mobile Header Bar with Hamburger Toggle */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-6 py-4 border-b border-slate-800 fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">Helpdesk<span className="text-blue-500">Pro</span></span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for Mobile when Sidebar is Open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800
        transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        <div className="p-6">
          <div className="hidden md:flex items-center gap-2 mb-8">
            <h1 className="text-xl font-bold text-white tracking-tight">Helpdesk<span className="text-blue-500">Pro</span></h1>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 p-3.5 rounded-xl mb-6">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-semibold text-white capitalize">{role || "User"}</p>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Menu</div>

          <nav className="space-y-1.5">
            <Link href="/" onClick={() => setIsOpen(false)} className={linkClass("/")}>
              <LayoutDashboard className="w-4 h-4" />
              {role === "Admin" ? "Admin Dashboard" : role === "Agent" ? "Agent Workspace" : "My Dashboard"}
            </Link>

            {role === "User" && (
              <Link href="/new-ticket" onClick={() => setIsOpen(false)} className={linkClass("/new-ticket")}>
                <PlusCircle className="w-4 h-4" />
                Submit New Ticket
              </Link>
            )}

            {role === "Agent" && (
              <>
                <Link href="/assigned" onClick={() => setIsOpen(false)} className={linkClass("/assigned")}>
                  <Ticket className="w-4 h-4" />
                  Assigned to Me
                </Link>
                {/* 👇 Yahan 'linkCode =' hata diya gaya hai */}
                <Link href="/resolved" onClick={() => setIsOpen(false)} className={linkClass("/resolved")}>
                  <CheckCircle2 className="w-4 h-4" />
                  Resolved Tickets
                </Link>
              </>
            )}

            {role === "Admin" && (
              <>
                <Link href="/manage-tickets" onClick={() => setIsOpen(false)} className={linkClass("/manage-tickets")}>
                  <FolderKanban className="w-4 h-4" />
                  Manage Tickets
                </Link>
                <Link href="/users" onClick={() => setIsOpen(false)} className={linkClass("/users")}>
                  <Users className="w-4 h-4" />
                  Users & Agents
                </Link>
                {/* 👇 Yeh raha SLA Breach aur Settings ka izafa */}
                <Link href="/sla-breach" onClick={() => setIsOpen(false)} className={linkClass("/sla-breach")}>
                  <AlertTriangle className="w-4 h-4" />
                  SLA Breaches
                </Link>
                <Link href="/settings" onClick={() => setIsOpen(false)} className={linkClass("/settings")}>
                  <Settings className="w-4 h-4" />
                  System Settings
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-inner">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{userName || "User"}</p>
              <p className="text-xs text-slate-400 truncate">Active Session</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium border border-slate-700/50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

      </aside>
    </>
  );
}