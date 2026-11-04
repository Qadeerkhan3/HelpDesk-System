"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import toast from "react-hot-toast"; // Toast import kar liya

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Sirf Admin is page ko dekh sakta hai
      if (session?.user?.role !== "Admin") {
        router.push("/"); 
      } else {
        fetchUsers();
      }
    }
  }, [status, router, session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch users");
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        // State update taake screen par foran change nazar aaye
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        
        // 🌟 Purane alert() ki jagah Naya Premium Toast
        toast.success(`${newRole} role assigned successfully!`, {
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
      } else {
        toast.error("Failed to update role");
      }
    } catch (error) {
      toast.error("An error occurred while updating role");
    }
  };

  if (loading || status === "loading") return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Users...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={session?.user?.role} userName={session?.user?.name} />
      
      {/* 👇 Yahan pt-20 md:pt-0 ka izafa kiya gaya hai */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-20 md:pt-0">
        
        {/* Header ko bhi responsive padding di gayi hai */}
        <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-5">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Users & Agents</h2>
          <p className="text-slate-500 text-sm mt-1">Manage system users and assign roles.</p>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Table container mein overflow-x-auto lagaya hai taake mobile par scroll ho sakay */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Current Role</th>
                  <th className="px-6 py-4 font-semibold">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full 
                        ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
                          user.role === 'Agent' ? 'bg-blue-100 text-blue-700' : 
                          'bg-slate-100 text-slate-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={user._id === session?.user?.id} 
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none transition-all"
                      >
                        <option value="User">User</option>
                        <option value="Agent">Agent</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}