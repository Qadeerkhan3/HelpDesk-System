"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function TicketTable({ limit, filterType }: { limit?: number, filterType?: "assigned" | "resolved" | "all" }) {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]); // 👈 Admin dropdown ke liye
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

    // 🌟 YAHAN AGENTS FETCH HOTE HAIN (SIRF ACTIVE WALE) 🌟
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/users");
        const users = await res.json();
        // Sirf unhein rakhein jo Agent hain aur Admin ne unhe disabled nahi kiya
        const activeAgents = users.filter((user: any) => user.role === "Agent" && user.isActive !== false);
        setAgents(activeAgents);
      } catch (error) {
        console.error("Failed to fetch agents", error);
      }
    };

    if (session?.user?.id) {
      fetchTickets();
      
      // Agar Admin hai toh dropdown ke liye active agents bhi laye
      if (session?.user?.role === "Admin") {
        fetchAgents();
      }

      const interval = setInterval(fetchTickets, 5000);
      return () => clearInterval(interval);
    }
  }, [limit, filterType, session]);

  // Admin Ticket Assign karne ka function
  const handleAssignAgent = async (ticketId: string, agentId: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAgent: agentId })
      });

      if (res.ok) {
        toast.success("Ticket assigned successfully!");
        // Foran UI update karein taake 5 second wait na karna pare
        setTickets(tickets.map(t => t._id === ticketId ? { ...t, assignedAgent: agentId } : t));
      } else {
        toast.error("Failed to assign ticket");
      }
    } catch (error) {
      toast.error("An error occurred while assigning");
    }
  };

  if (loading) return <div className="text-slate-500 text-sm p-4">Loading tickets...</div>;
  if (tickets.length === 0) return <div className="text-slate-500 text-sm p-4">No tickets found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
            <th className="px-4 py-3 font-semibold">Ticket ID</th>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            {/* 👇 Admin ke liye Assign ka column */}
            {session?.user?.role === "Admin" && (
              <th className="px-4 py-3 font-semibold">Assign Agent</th>
            )}
            <th className="px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
              <td className="px-4 py-3 font-medium text-slate-800 uppercase">#{ticket.ticketNumber || ticket._id.slice(-6)}</td>
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
              
              {/* 👇 Admin ke liye Dropdown jisme disabled agents nahi aayenge */}
              {session?.user?.role === "Admin" && (
                <td className="px-4 py-3">
                  <select
                    value={ticket.assignedAgent?._id || ticket.assignedAgent || ""}
                    onChange={(e) => handleAssignAgent(ticket._id, e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 outline-none px-2 py-1.5 cursor-pointer w-36"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </td>
              )}

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