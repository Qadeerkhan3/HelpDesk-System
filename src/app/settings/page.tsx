"use client";

import { useSession } from "next-auth/react";
import Sidebar from "../Sidebar";

export default function SettingsPage() {
  const { data: session } = useSession();

  if (!session) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={session.user.role} userName={session.user.name} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <h2 className="text-2xl font-bold text-slate-800">Account Settings</h2>
          <p className="text-slate-500 text-sm mt-1">View your profile and system preferences.</p>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-4">Personal Information</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  disabled 
                  value={session.user.name || ""} 
                  className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  disabled 
                  value={session.user.email || ""} 
                  className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
                <input 
                  type="text" 
                  disabled 
                  value={session.user.role || ""} 
                  className="w-full p-3 border border-slate-200 rounded-lg bg-blue-50 text-blue-700 font-semibold cursor-not-allowed" 
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500">
              * Note: To update your profile details or change your password, please contact the system administrator.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}