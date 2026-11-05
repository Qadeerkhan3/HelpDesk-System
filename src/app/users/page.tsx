"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import toast from "react-hot-toast";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "Admin") {
        router.push("/"); 
      } else {
        fetchUsers();
      }
    }
  }, [status, router, session]);

  const fetchUsers = async () => {
    try {
      // const res = await fetch("/api/users");
      const res = await fetch(`/api/users?t=${Date.now()}`, { cache: "no-store" });
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
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
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

  // 👇 STATUS CHANGE KARNE KA NAYA FUNCTION
  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
        toast.success(`Account ${!currentStatus ? 'Activated' : 'Deactivated'} successfully!`, {
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred while updating status");
    }
  };

  if (loading || status === "loading") return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Users...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={session?.user?.role} userName={session?.user?.name} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-20 md:pt-0">
        <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-5">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Users & Agents</h2>
          <p className="text-slate-500 text-sm mt-1">Manage system users, assign roles, and control access.</p>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Current Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  // Fallback for older users who don't have isActive field yet
                  const isUserActive = user.isActive !== false; 
                  
                  return (
                    <tr key={user._id} className={`border-b border-slate-100 transition ${!isUserActive ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      
                      {/* Role Dropdown */}
                      <td className="px-6 py-4">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          disabled={user._id === session?.user?.id || !isUserActive} 
                          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 block px-3 py-2 cursor-pointer disabled:opacity-50 outline-none"
                        >
                          <option value="User">User</option>
                          <option value="Agent">Agent</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full 
                          ${isUserActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {isUserActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      {/* Deactivate/Activate Button */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleStatusChange(user._id, isUserActive)}
                          disabled={user._id === session?.user?.id} // Admin khud ko block na kar de
                          className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                            ${isUserActive 
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                        >
                          {isUserActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                      
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}