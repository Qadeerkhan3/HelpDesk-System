"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function TicketTable({ limit, filterType }: { limit?: number, filterType?: "assigned" | "resolved" | "all" }) {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const fetchTickets = () => {
      fetch("/api/tickets")
        .then((res) => res.json())
        .then((data) => {
          let filteredData = data;

          if (session?.user?.role === "Agent") {
            // 👈 FIX: Yahan ab dono check honge, chahay object ho ya direct string ID
            filteredData = data.filter((t: any) => {
              const agentId = t.assignedAgent?._id || t.assignedAgent;
              return agentId === session.user.id;
            });
            
            if (filterType === "resolved") {
              filteredData = filteredData.filter((t: any) => t.status === "Resolved" || t.status === "Closed");
            } else if (filterType === "assigned") {
              filteredData = filteredData.filter((t: any) => t.status === "Open" || t.status === "In Progress");
            }
          } 
          else if (session?.user?.role === "User") {
            filteredData = data.filter((t: any) => {
              const creatorId = t.createdBy?._id || t.createdBy;
              return creatorId === session.user.id;
            });
          }

          if (limit) {
            setTickets(filteredData.slice(0, limit));
          } else {
            setTickets(filteredData);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch tickets", err);
          setLoading(false);
        });
    };

    if (session?.user?.id) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 5000);
      return () => clearInterval(interval);
    }
  }, [limit, filterType, session]);

  if (loading) return <div className="text-slate-500 text-sm p-4">Loading tickets...</div>;
  if (tickets.length === 0) return <div className="text-slate-500 text-sm p-4">No tickets found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
            <th className="px-4 py-3 font-semibold">Ticket ID</th>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
              <td className="px-4 py-3 font-medium text-slate-800">{ticket.ticketNumber}</td>
              <td className="px-4 py-3 text-slate-600">{ticket.title}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full 
                  ${ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' : 
                    ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-green-100 text-green-700'}`}>
                  {ticket.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm">
                {mounted ? new Date(ticket.createdAt).toLocaleDateString() : "..."}
              </td>
              <td className="px-4 py-3">
                <Link href={`/tickets/${ticket._id}`} className="text-blue-600 hover:underline text-sm font-medium">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}