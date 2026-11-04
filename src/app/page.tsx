// export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import connectToDatabase from "../lib/mongodb";
import Ticket from "../lib/models/Ticket";
import Sidebar from "./Sidebar";
import TicketTable from "./TicketTable";
import Link from "next/link";
import { Plus, CheckCircle2, Clock, Ticket as TicketIcon } from "lucide-react";

export default async function DashboardPage() {
  await connection();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();
  const userId = session.user.id;
  const role = session.user.role;

  let totalTickets = 0;
  let pendingTickets = 0;
  let resolvedTickets = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (role === "User") {
    totalTickets = await Ticket.countDocuments({ createdBy: userId });
    pendingTickets = await Ticket.countDocuments({ createdBy: userId, status: { $in: ["Open", "In Progress"] } });
    resolvedTickets = await Ticket.countDocuments({ createdBy: userId, status: { $in: ["Resolved", "Closed"] } });
  } else if (role === "Agent") {
    totalTickets = await Ticket.countDocuments({ assignedAgent: userId });
    pendingTickets = await Ticket.countDocuments({ assignedAgent: userId, status: { $in: ["Open", "In Progress"] } });
    resolvedTickets = await Ticket.countDocuments({ assignedAgent: userId, status: "Resolved", updatedAt: { $gte: today } });
  } else if (role === "Admin") {
    totalTickets = await Ticket.countDocuments();
    pendingTickets = await Ticket.countDocuments({ status: { $in: ["Open", "In Progress"] } });
    resolvedTickets = await Ticket.countDocuments({ status: { $in: ["Resolved", "Closed"] } });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} userName={session.user.name} />

      {/* Main Content Container - Mobile par 'pt-20' lagaya hai taake header ke neechay chup na jaye */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pt-20 md:pt-0">

        <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">
              {role === "Admin" ? "Admin Dashboard" : role === "Agent" ? "Agent Workspace" : "My Dashboard"}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Welcome back, <span className="font-semibold text-slate-700">{session.user.name}</span>. Here's what's happening today.
            </p>
          </div>

          {/* 👇 Yeh check lagane se button sirf User ko dikhega, Admin aur Agent se hat jayega */}
          {role === "User" && (
            <Link
              href="/new-ticket"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Submit New Ticket
            </Link>
          )}
        </header>

        <div className="p-6 md:p-8 space-y-8 flex-1">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-600"></div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {role === "Admin" ? "Total System Tickets" : role === "Agent" ? "Assigned to Me" : "Total My Tickets"}
              </p>
              <h3 className="text-3xl font-bold text-slate-800">{totalTickets}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500"></div>
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Replies</p>
              <h3 className="text-3xl font-bold text-slate-800">{pendingTickets}</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500"></div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {role === "Agent" ? "My Resolved (Today)" : "Resolved Tickets"}
              </p>
              <h3 className="text-3xl font-bold text-slate-800">{resolvedTickets}</h3>
            </div>
          </div>

          {/* Recent Tickets Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800">Recent Tickets (Latest 5)</h3>
              {role !== "User" && (
                <Link
                  href={role === "Admin" ? "/manage-tickets" : "/assigned"}
                  className="text-sm text-blue-600 hover:underline font-semibold"
                >
                  View All →
                </Link>
              )}
            </div>

            <TicketTable limit={5} />
          </div>

        </div>
      </main>
    </div>
  );
}