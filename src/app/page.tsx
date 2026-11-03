export const instant = false;

import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import TicketTable from "./TicketTable";
import Sidebar from "./Sidebar";
import connectToDatabase from "../lib/mongodb";
import Ticket from "../lib/models/Ticket";

export default async function HomePage() {
  await connection();
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const userId = session.user.id;

  // 👈 DYNAMIC STATS LOGIC START
  await connectToDatabase();
  
  let totalTickets = 0;
  let pendingActions = 0;
  let resolvedToday = 0;
  let slaBreached = 0;

  // Aaj ki date nikalne ke liye (taake aaj ke resolved tickets count hon)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pichle 24 ghante ka time (SLA Breach check karne ke liye)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (role === "Admin") {
    totalTickets = await Ticket.countDocuments();
    pendingActions = await Ticket.countDocuments({ status: { $in: ["Open", "In Progress"] } });
    resolvedToday = await Ticket.countDocuments({ status: "Resolved", updatedAt: { $gte: today } });
    // SLA Breached: Wo tickets jo 24 ghante pehle banay gaye thay aur abhi tak "Open" hain
    slaBreached = await Ticket.countDocuments({ status: "Open", createdAt: { $lte: yesterday } });
  } else if (role === "Agent") {
    totalTickets = await Ticket.countDocuments({ assignedAgent: userId });
    pendingActions = await Ticket.countDocuments({ assignedAgent: userId, status: { $in: ["Open", "In Progress"] } });
    resolvedToday = await Ticket.countDocuments({ assignedAgent: userId, status: "Resolved", updatedAt: { $gte: today } });
  }
  // 👈 DYNAMIC STATS LOGIC END

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Sidebar Component */}
      <Sidebar role={role} userName={session.user.name} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Role-Based Stats Cards (Dynamic Numbers) */}
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-800">
                {role === "User" ? "My Recent Tickets" : "Ticket Queue"}
              </h3>
            </div>
            
            {/* Ticket Table */}
            <div className="p-4">
              <TicketTable />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}