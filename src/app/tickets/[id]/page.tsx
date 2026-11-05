"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Clock, User, Tag, AlertCircle, Loader2, Paperclip, Download } from "lucide-react";
import toast from "react-hot-toast";

function TicketDetailsClient() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { data: session } = useSession();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!ticketId || !session) return;
    
    fetchTicketAndMessages();
    
    if (session?.user?.role === "Admin") {
      fetchAgents();
    }

    const interval = setInterval(fetchTicketAndMessages, 5000);
    return () => clearInterval(interval);
  }, [ticketId, session]);

  const fetchTicketAndMessages = async () => {
    try {
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        
        if (session?.user?.role === "Agent") {
          const agentId = ticketData.assignedAgent?._id || ticketData.assignedAgent;
          if (agentId !== session?.user?.id) {
            toast.error("Unauthorized: Ticket not assigned to you.");
            router.push("/");
            return;
          }
        }

        setTicket(ticketData);
      }

      const msgRes = await fetch(`/api/tickets/${ticketId}/messages`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        const activeStaff = data.filter((u: any) => 
          (u.role === "Agent" || u.role === "Admin") && u.isActive !== false
        );
        setAgents(activeStaff);
      }
    } catch (error) {
      console.error("Failed to fetch agents", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTicket({ ...ticket, status: newStatus });
        toast.success(`Status updated to ${newStatus}!`, {
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
    setUpdating(false);
  };

  const handleAssignAgent = async (agentId: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAgent: agentId === "" ? null : agentId }),
      });
      if (res.ok) {
        toast.success(agentId === "" ? "Ticket unassigned!" : "Agent assigned successfully!", {
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
        fetchTicketAndMessages();
      } else {
        toast.error("Failed to assign agent");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
    setUpdating(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      
      if (res.ok) {
        setNewMessage("");
        fetchTicketAndMessages();
        toast.success("Message sent!");
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const safeRender = (val: any, fallback = "N/A") => {
    if (!val) return fallback;
    if (typeof val === "object") return val.name || val.title || fallback;
    return val;
  };

  const getCategoryName = (category: any) => {
    if (!category) return "General";
    if (typeof category === "object") return category.name || category.title || "General";
    if (typeof category === "string" && category.length > 20) {
      return `Cat-${category.substring(0, 4)}`;
    }
    return category;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Loading Ticket</h3>
        <p className="text-slate-500 text-sm animate-pulse mt-1">Please wait while we fetch the details...</p>
      </div>
    );
  }
  
  if (!ticket) return <div className="min-h-screen flex items-center justify-center text-red-500">Ticket not found.</div>;

  const isAdminOrAgent = session?.user?.role === "Admin" || session?.user?.role === "Agent";
  
  // 👇 NAYA: Ticket close ya resolve ho toh usay disable karne ka check
  const isTicketClosed = ticket.status === "Closed" || ticket.status === "Resolved";

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{ticket.title}</h1>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 uppercase">
                {ticket.ticketNumber || ticket._id.substring(ticket._id.length - 6)}
              </span>
              • Created by <span className="font-semibold text-slate-700">{safeRender(ticket.createdBy, "Unknown")}</span>
            </p>
          </div>
          
          {isAdminOrAgent ? (
            <select
              value={safeRender(ticket.status, "Open")}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-4 py-2.5 rounded-lg border-2 font-semibold text-sm cursor-pointer outline-none transition-all
                ${ticket.status === 'Open' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:border-blue-400' : 
                  ticket.status === 'In Progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:border-yellow-400' : 
                  'bg-green-50 text-green-700 border-green-200 focus:border-green-400'}`}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          ) : (
            <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${
              ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' : 
              ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-green-100 text-green-700'
            }`}>
              {safeRender(ticket.status, "Open")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 mb-8 items-start">
                <div className="break-words">
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1.5"><AlertCircle className="w-4 h-4"/> Priority</p>
                  <p className="font-semibold text-slate-800">{safeRender(ticket.priority, "Standard")}</p>
                </div>
                <div className="break-words overflow-hidden">
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1.5"><Tag className="w-4 h-4"/> Category</p>
                  <p className="font-semibold text-slate-800 truncate" title={ticket.category}>
                    {getCategoryName(ticket.category)}
                  </p>
                </div>
                <div className="break-words">
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1.5"><Clock className="w-4 h-4"/> Created Date</p>
                  <p className="font-semibold text-slate-800">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div className="break-words">
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1.5"><User className="w-4 h-4"/> Assigned Agent</p>
                  {session?.user?.role === "Admin" ? (
                    <select
                      value={ticket.assignedAgent?._id || ticket.assignedAgent || ""}
                      disabled={updating}
                      onChange={(e) => handleAssignAgent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none transition-all cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {agents.map(agent => (
                        <option key={agent._id} value={agent._id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-semibold text-slate-800 mt-2">{safeRender(ticket.assignedAgent, "Unassigned")}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3 border-b pb-2">Description</h3>
                <div className="bg-slate-50 p-5 rounded-xl text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                  {ticket.description}
                </div>
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-slate-500 mb-3 border-b pb-2">Attachments</h3>
                  <div className="flex flex-wrap gap-4">
                    {ticket.attachments.map((url: string, index: number) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group"
                      >
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">View Attachment {index + 1}</span>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px] sticky top-6">
              
              {/* 👇 NAYA: Header mein Assigned Agent ka Badge */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Conversation</h3>
                {ticket.assignedAgent && (
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                    Agent: {safeRender(ticket.assignedAgent)}
                  </span>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center mt-10">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender?._id === session?.user?.id || msg.sender?.email === session?.user?.email;
                    return (
                      <div key={msg._id} className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                        <span className="text-xs text-slate-500 mb-1 mx-1">{safeRender(msg.sender, "User")}</span>
                        <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                          isOwnMessage 
                            ? "bg-blue-600 text-white rounded-br-none" 
                            : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200"
                        }`}>
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 mx-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 👇 NAYA: Agar ticket Closed/Resolved hai toh form ki jagah message dikhayein */}
              {isTicketClosed ? (
                <div className="p-5 border-t border-slate-200 bg-slate-100 rounded-b-2xl text-center">
                  <p className="text-slate-500 text-sm font-medium">
                    This ticket is {ticket.status}. Chat is locked.
                  </p>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center w-11 h-11"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function TicketDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Loading Ticket</h3>
      </div>
    }>
      <TicketDetailsClient />
    </Suspense>
  );
}