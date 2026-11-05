export const instant = false;
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Sidebar from "../Sidebar";
import connectToDatabase from "../../lib/mongodb";
import Ticket from "../../lib/models/Ticket";
import Link from "next/link";

export default async function SLAReportsPage() {
  await connection();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "Admin") {
    redirect("/");
  }

  await connectToDatabase();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const breachedTickets = await Ticket.find({
    status: { $nin: ["Resolved", "Closed"] },
    priority: "High",
    createdAt: { $lte: yesterday }
  }).populate("createdBy", "name email").sort({ createdAt: 1 });

  return (
    // 🌟 FIX 1: Layout ko proper flex banaya gaya hai
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role={session.user.role} userName={session.user.name} />
      
      <main className="flex-1 flex flex-col h-screen w-full overflow-hidden">
        {/* 🌟 FIX 2: Mobile ke liye 'pt-20' add kiya taake text neeli patti ke neechay na chhupe */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-5 pt-20 md:pt-5">
          <h2 className="text-xl md:text-2xl font-bold text-red-600">SLA Breached Reports</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">High priority critical tickets unresolved for more than 24 hours.</p>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* 🌟 FIX 3: 'overflow-x-auto' lagaya taake mobile par table side par scroll ho */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            {/* 🌟 FIX 4: 'whitespace-nowrap' lagaya taake text toot kar neechay na aaye */}
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="px-4 md:px-6 py-4 font-semibold">Ticket #</th>
                  <th className="px-4 md:px-6 py-4 font-semibold">Title</th>
                  <th className="px-4 md:px-6 py-4 font-semibold">Customer</th>
                  <th className="px-4 md:px-6 py-4 font-semibold">Status</th>
                  <th className="px-4 md:px-6 py-4 font-semibold">Created Date</th>
                  <th className="px-4 md:px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {breachedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium whitespace-normal">
                      No SLA breached high-priority tickets found. Great job!
                    </td>
                  </tr>
                ) : (
                  breachedTickets.map((ticket: any) => (
                    <tr key={ticket._id} className="border-b border-slate-100 hover:bg-red-50 transition">
                      <td className="px-4 md:px-6 py-4 font-medium text-slate-800">
                        #{ticket.ticketNumber || ticket._id.toString().substring(ticket._id.toString().length - 6).toUpperCase()}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-slate-600">{ticket.title}</td>
                      <td className="px-4 md:px-6 py-4 text-slate-600">{ticket.createdBy?.name || "Unknown"}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full 
                          ${ticket.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-red-500 font-medium">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <Link href={`/tickets/${ticket._id}`} className="text-blue-600 hover:underline text-sm font-medium">
                          View Ticket
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}