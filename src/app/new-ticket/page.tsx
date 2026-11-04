"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "../Sidebar";
import toast from "react-hot-toast";
import { Paperclip, Loader2, Sparkles } from "lucide-react";

export default function NewTicketPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Standard");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadToCloudinary = async (fileToUpload: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Error: .env file se keys load nahi huin!");
      throw new Error("Missing Cloudinary keys in .env");
    }

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Cloudinary Error Details:", data);
      throw new Error(data.error?.message || "Cloudinary error");
    }
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return toast.error("Title and description are required!");

    setLoading(true);
    let attachmentUrl = null;

    try {
      if (file) {
        toast.loading("Uploading attachment...", { id: "upload" });
        attachmentUrl = await uploadToCloudinary(file);
        toast.dismiss("upload");
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          attachments: attachmentUrl ? [attachmentUrl] : []
        }),
      });

      if (res.ok) {
        toast.success("Ticket created successfully!");
        router.push("/");
      } else {
        toast.error("Failed to create ticket");
      }
    } catch (error) {
      console.error(error);
      toast.dismiss("upload");
      toast.error("An error occurred while submitting.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role={session?.user?.role} userName={session?.user?.name || "User"} />

      <main className="flex-1 overflow-y-auto pt-20 md:pt-0">
        <header className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Submit New Ticket</h2>
              <p className="text-slate-500 text-sm mt-0.5">Describe your issue clearly so our support team can assist you.</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">

            {/* Title Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Issue Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="e.g., Unable to login to dashboard"
                required
              />
            </div>

            {/* Category & Priority Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="General" className="text-slate-800 bg-white">General</option>
                  <option value="Billing" className="text-slate-800 bg-white">Billing</option>
                  <option value="Technical Support" className="text-slate-800 bg-white">Technical Support</option>
                  <option value="Feature Request" className="text-slate-800 bg-white">Feature Request</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="Low" className="text-slate-800 bg-white">Low</option>
                  <option value="Standard" className="text-slate-800 bg-white">Standard</option>
                  <option value="High" className="text-slate-800 bg-white">High</option>
                  <option value="Urgent" className="text-slate-800 bg-white">Urgent</option>
                </select>
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="Provide detailed steps or information about your issue..."
                required
              />
            </div>

            {/* File Attachment */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Attachment (Optional)</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-xl cursor-pointer transition-all border-2 border-dashed border-slate-300 w-full md:w-auto">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold">{file ? file.name : "Choose File to Attach"}</span>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                </label>
                {file && (
                  <button type="button" onClick={() => setFile(null)} className="text-sm font-semibold text-red-500 hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-70 transition-all flex justify-center items-center gap-2 mt-6 text-base"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Ticket...</> : "Submit Ticket"}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}