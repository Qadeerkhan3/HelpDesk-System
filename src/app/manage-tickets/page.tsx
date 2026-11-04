export const instant = false;
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Sidebar from "../Sidebar";
import TicketTable from "../TicketTable";

export default async function ManageTicketsPage() {
  await connection();
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role === "User") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={session.user.role} userName={session.user.name} />
      
      {/* 👇 Yahan pt-20 md:pt-0 add kiya gaya hai taake mobile header overlap na kare */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-20 md:pt-0">
        
        <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-5">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Manage All Tickets</h2>
          <p className="text-slate-500 text-sm mt-1">View and manage the complete history of system tickets.</p>
        </header>
        
        {/* Mobile par padding thori kam (p-4) aur desktop par zyada (md:p-8) kar di hai */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <TicketTable />
          </div>
        </div>
        
      </main>
    </div>
  );
}