"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Lock, ShieldCheck } from "lucide-react";

// 🌟 NAYA TAREEQA: Asal logic ko Client Component mein alag kar diya gaya hai
function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error("Tamam fields fill karein!");
    if (password !== confirmPassword) return toast.error("Passwords match nahi ho rahe!");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        toast.success("Password kamyabi se tabdeel ho gaya! Ab login karein.");
        router.push("/login");
      } else {
        const data = await res.json();
        toast.error(data.error || "Password reset nahi ho saka.");
      }
    } catch (error) {
      toast.error("Kuch kharabi ho gayi.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-8">
      
      <div className="text-center mb-8">
        <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Set New Password</h1>
        <p className="text-slate-500 text-sm mt-1">Apna naya password enter karein</p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
          <div className="relative">
            <ShieldCheck className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-sm"
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
        </button>
      </form>
    </div>
  );
}

// 🌟 MAIN PAGE: Jisne asal component ko Suspense ke andar wrap kar diya hai
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium">Loading form...</p>
        </div>
      }>
        <ResetPasswordClient />
      </Suspense>
    </div>
  );
}