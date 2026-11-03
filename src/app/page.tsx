export const instant = false;

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import TicketTable from "./TicketTable";
import Sidebar from "./Sidebar";
import DashboardChart from "./DashboardChart";
import connectToDatabase from "../lib/mongodb";
import Ticket from "../lib/models/Ticket";
import Link from "next/link";

export default async function HomePage() {
  await connection();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const userId = session.user.id;

  await connectToDatabase();
  
  let totalTickets = 0;
  let pendingActions = 0;
  let resolvedToday = 0;
  let slaBreached = 0;
  let chartData: any[] = []; 

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (role === "Admin") {
    const [
      total, pending, resolved, breached, 
      openCount, inProgressCount, closedCount
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ["Open", "In Progress"] } }),
      Ticket.countDocuments({ status: "Resolved", updatedAt: { $gte: today } }),
      Ticket.countDocuments({ status: "Open", createdAt: { $lte: yesterday } }),
      Ticket.countDocuments({ status: "Open" }),
      Ticket.countDocuments({ status: "In Progress" }),
      Ticket.countDocuments({ status: "Closed" })
    ]);

    totalTickets = total;
    pendingActions = pending;
    resolvedToday = resolved;
    slaBreached = breached;

    chartData = [
      { name: "Open", value: openCount, fill: "#3b82f6" },       
      { name: "In Progress", value: inProgressCount, fill: "#eab308" }, 
      { name: "Resolved", value: resolved, fill: "#22c55e" },     
      { name: "Closed", value: closedCount, fill: "#94a3b8" }       
    ];
  } else if (role === "Agent") {
    const [total, pending, resolved] = await Promise.all([
      Ticket.countDocuments({ assignedAgent: userId }),
      Ticket.countDocuments({ assignedAgent: userId, status: { $in: ["Open", "In Progress"] } }),
      Ticket.countDocuments({ assignedAgent: userId, status: "Resolved", updatedAt: { $gte: today } })
    ]);

    totalTickets = total;
    pendingActions = pending;
    resolvedToday = resolved;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} userName={session.user.name} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {role === "Admin" ? "Admin Control Panel" : 
                 role === "Agent" ? "Agent Workspace" : "My Dashboard"}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Welcome back, {session.user.name}. Here is what's happening today.
              </p>
            </div>
            {role === "User" && (
              <a 
                href="/new-ticket" 
                className="bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm inline-flex items-center gap-2"
              >
                + New Ticket
              </a>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          
          {role === "Admin" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
                <p className="text-sm font-medium text-slate-500">Total Tickets</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{totalTickets}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-yellow-500">
                <p className="text-sm font-medium text-slate-500">Pending Actions</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{pendingActions}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-green-500">
                <p className="text-sm font-medium text-slate-500">Resolved Today</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{resolvedToday}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                <p className="text-sm font-medium text-slate-500 text-red-600">SLA Breached</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{slaBreached}</p>
              </div>
            </div>
          )}

          {role === "Agent" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
                <p className="text-sm font-medium text-slate-500">Assigned to Me</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{totalTickets}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-yellow-500">
                <p className="text-sm font-medium text-slate-500">Pending Replies</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{pendingActions}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-green-500">
                <p className="text-sm font-medium text-slate-500">My Resolved (Today)</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{resolvedToday}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-8 pb-10">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">
                  {role === "User" ? "My Recent Tickets" : "Recent Tickets (Latest 5)"}
                </h3>
                {role !== "User" && (
                  <Link href="/manage-tickets" className="text-sm text-blue-600 hover:underline font-medium">
                    View All →
                  </Link>
                )}
              </div>
              <div className="p-4">
                <TicketTable limit={5} />
              </div>
            </div>

            {role === "Admin" && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-semibold text-slate-800">Tickets Overview</h3>
                </div>
                <div className="p-8 flex justify-center items-center bg-slate-50/50">
                  <div className="w-full max-w-2xl">
                    <DashboardChart data={chartData} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}