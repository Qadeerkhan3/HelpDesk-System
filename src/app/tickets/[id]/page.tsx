"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

function TicketDetailsContent() {
  const params = useParams();
  const ticketId = params?.id as string;

  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    
    Promise.all([
      fetch(`/api/tickets/${ticketId}`).then(res => res.ok ? res.json() : Promise.reject("Ticket not found")),
      fetch(`/api/tickets/${ticketId}/messages`).then(res => res.json()),
      fetch(`/api/auth/session`).then(res => res.json())
    ])
    .then(([ticketData, messagesData, sessionData]) => {
      setTicket(ticketData);
      setMessages(messagesData || []);
      setCurrentUser(sessionData?.user || null);
      setLoading(false);
    })
    .catch((err) => {
      setError(err);
      setLoading(false);
    });
  }, [ticketId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      
      const sentMsg = await res.json();
      setMessages((prev) => [...prev, sentMsg]);
      setNewMessage(""); 
    } catch (err) {
      console.error(err);
      alert("Message sending failed!");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      setTicket((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error(err);
      alert("Status update failed! You might not have permission.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center text-slate-500">Loading ticket details...</div>;
  if (error) return <div className="min-h-screen flex justify-center items-center text-red-500 font-medium">{error}</div>;
  if (!ticket) return null;

  const isStaff = currentUser?.role === "Admin" || currentUser?.role === "Agent";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        <a 
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 flex inline-flex items-center gap-2 transition cursor-pointer"
        >
          ← Back to Dashboard
        </a>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{ticket.title}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {ticket.ticketNumber} • Created by <span className="font-medium">{ticket.createdBy?.name}</span>
              </p>
            </div>
            
            {isStaff ? (
              <select
                value={ticket.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg border focus:outline-none cursor-pointer
                  ${ticket.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' : 
                    ticket.status === 'In Progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                    'bg-blue-50 text-blue-700 border-blue-200'}
                `}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            ) : (
              <span className="px-3 py-1.5 text-sm font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Status: {ticket.status}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-t border-b border-slate-100 mb-5">
            <div>
              <p className="text-xs text-slate-500 font-medium">Priority</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{ticket.priority}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Category</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{ticket.category?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Created Date</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Assigned Agent</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{ticket.assignedAgent?.name || "Unassigned"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">Description</p>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
              {ticket.description}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Conversation</h3>
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 text-sm mt-10">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, index) => {
                const isStaffMsg = msg.sender?.role === "Agent" || msg.sender?.role === "Admin";
                return (
                  <div key={index} className={`flex flex-col ${isStaffMsg ? "items-start" : "items-end"}`}>
                    <div className="text-xs text-slate-500 mb-1 px-1">
                      {msg.sender?.name} <span className="opacity-70">({msg.sender?.role})</span>
                    </div>
                    <div className={`p-3 rounded-xl max-w-[80%] text-sm ${
                      isStaffMsg 
                        ? "bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none" 
                        : "bg-slate-100 text-slate-800 border border-slate-200 rounded-tr-none"
                    }`}>
                      {msg.message}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-slate-100 mt-auto">
            <input
              type="text"
              required
              placeholder="Type your message here..."
              className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default function TicketDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center text-slate-500">Loading page...</div>}>
      <TicketDetailsContent />
    </Suspense>
  );
}