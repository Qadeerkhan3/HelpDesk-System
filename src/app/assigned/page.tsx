export const instant = false;

import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Sidebar from "../Sidebar";
import TicketTable from "../TicketTable";

export default async function AssignedTicketsPage() {
  await connection();
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "Agent") redirect("/");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={session.user.role} userName={session.user.name} />
      <main className="flex-1 overflow-y-auto pt-20 md:pt-0">
        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <h2 className="text-2xl font-bold text-slate-800">Assigned to Me</h2>
          <p className="text-slate-500 text-sm mt-1">Tickets currently assigned to your queue.</p>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <TicketTable filterType="assigned" />
          </div>
        </div>
      </main>
    </div>
  );
}