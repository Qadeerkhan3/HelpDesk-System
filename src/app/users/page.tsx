"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    // Agar user logged in nahi hai ya Admin nahi hai, toh wapas bhej dein
    if (status === "unauthenticated" || (session?.user && session.user.role !== "Admin")) {
      router.push("/");
      return;
    }

    if (status === "authenticated" && session.user.role === "Admin") {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          setUsers(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch users", err);
          setLoading(false);
        });
    }
  }, [status, session, router]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to make this user an ${newRole}?`)) return;
    
    setUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");
      
      // UI mein list update karein
      setUsers(users.map(user => user._id === userId ? { ...user, role: newRole } : user));
      alert(`Role updated successfully to ${newRole}`);
    } catch (error) {
      console.error(error);
      alert("Error updating user role");
    } finally {
      setUpdating(null);
    }
  };

  if (loading || status === "loading") {
    return <div className="min-h-screen flex justify-center items-center text-slate-500">Loading Users...</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Component */}
      <Sidebar role={session?.user?.role || "User"} userName={session?.user?.name || "User"} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
            <p className="text-slate-500 text-sm mt-1">Manage system users, agents, and administrators.</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Joined Date</th>
                  <th className="px-6 py-4 font-semibold">System Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                    <td className="px-6 py-4 text-slate-500">{user.email}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {/* Agar user khud hai, toh apni role change na kar sake (lock out se bachne ke liye) */}
                      {session?.user?.email === user.email ? (
                        <span className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-100 text-blue-700">
                          {user.role} (You)
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={updating === user._id}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className={`px-3 py-1.5 text-sm font-semibold rounded-lg border focus:outline-none cursor-pointer
                            ${user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                              user.role === 'Agent' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              'bg-slate-50 text-slate-700 border-slate-200'}
                          `}
                        >
                          <option value="User">User</option>
                          <option value="Agent">Agent</option>
                          <option value="Admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="p-8 text-center text-slate-500">No users found.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}