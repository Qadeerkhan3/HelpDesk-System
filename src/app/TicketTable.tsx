"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TicketTable() {
  const router = useRouter(); // 👈 Router initialize kar diya
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => {
        setTickets(data);
        setLoading(false);
      })
      .catch((err) => console.error("Failed to fetch tickets:", err));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open": return "bg-blue-100 text-blue-700";
      case "In Progress": return "bg-yellow-100 text-yellow-700";
      case "Resolved": return "bg-green-100 text-green-700";
      case "Closed": return "bg-slate-100 text-slate-700";
      case "SLA Breached": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent": return "text-red-600 bg-red-50";
      case "High": return "text-orange-600 bg-orange-50";
      case "Medium": return "text-yellow-600 bg-yellow-50";
      case "Low": return "text-slate-600 bg-slate-50";
      default: return "text-slate-600";
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading tickets...</div>;
  }

  if (tickets.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 mt-6">
        <h3 className="text-lg font-medium text-slate-800">No tickets found</h3>
        <p className="text-slate-500 mt-1">You don't have any tickets yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
              <th className="p-4">Ticket ID</th>
              <th className="p-4">Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <tr 
                key={ticket._id} 
                onClick={() => router.push(`/tickets/${ticket._id}`)} // 👈 Clickable row
                className="hover:bg-slate-50 transition cursor-pointer" // 👈 Pointer cursor
              >
                <td className="p-4 font-medium text-slate-900">{ticket.ticketNumber}</td>
                <td className="p-4 text-slate-800">{ticket.title}</td>
                <td className="p-4 text-slate-600">{ticket.category?.name || "N/A"}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500 text-sm">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}