"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, KeyRound, ArrowLeft, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: Code verification
  const [loading, setLoading] = useState(false);

  // Step 1: Email bhejna
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Apni email likhein!");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        toast.success("Verification code email par bhej diya gaya hai!");
        setStep(2); // Step 2 par move ho jao
      } else {
        const data = await res.json();
        toast.error(data.error || "Email nahi mil saki.");
      }
    } catch (error) {
      toast.error("Kuch kharabi ho gayi.");
    }
    setLoading(false);
  };

  // Step 2: Code verify karna
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return toast.error("Verification code likhein!");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        toast.success("Code verify ho gaya! Ab naya password set karein.");
        // Email ko query parameter mein agle page par bhejna taake password update ho sake
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Ghalat verification code!");
      }
    } catch (error) {
      toast.error("Kuch kharabi ho gayi.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-8">
        
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Forgot Password?</h1>
          <p className="text-slate-500 text-sm mt-1">
            {step === 1 ? "Apni registered email likhein" : "Email par aya hua 6 digits ka code likhein"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-xs text-center mb-4">
              Code aapki email <b>{email}</b> par bhej diya gaya hai.
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Verification Code</label>
              <div className="relative">
                <ShieldCheck className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-bold tracking-widest text-center text-lg"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}