"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "../Sidebar";
import toast from "react-hot-toast";
import { Settings, Save } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    systemName: "",
    adminEmail: "",
    slaBreachHours: 24,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "Admin") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router, session]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) {
        setFormData({
          systemName: data.systemName || "",
          adminEmail: data.adminEmail || "",
          slaBreachHours: data.slaBreachHours || 24,
        });
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Settings updated successfully!");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading Settings...</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={session?.user?.role} userName={session?.user?.name} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-20 md:pt-0">
        <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">System Settings</h2>
              <p className="text-slate-500 text-sm mt-0.5">Manage your helpdesk global configuration.</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <form onSubmit={handleSave} className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
            
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">General Configuration</h3>
              <p className="text-slate-500 text-sm mb-4">Yeh settings poore system par apply hongi.</p>
            </div>

            <div className="space-y-5 pt-4 border-t border-slate-100">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">System Name</label>
                <input 
                  type="text" 
                  value={formData.systemName}
                  onChange={(e) => setFormData({...formData, systemName: e.target.value})}
                  className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Notification Email</label>
                <input 
                  type="email" 
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                  className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">SLA Breach Time (Hours)</label>
                <input 
                  type="number" 
                  value={formData.slaBreachHours}
                  onChange={(e) => setFormData({...formData, slaBreachHours: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                  min="1"
                  required
                />
                <p className="text-xs text-slate-500 mt-1.5">Kitne ghanton baad unresolved ticket ko SLA breach mana jaye?</p>
              </div>

            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Settings</>}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}