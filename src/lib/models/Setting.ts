import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    systemName: { type: String, default: "HelpdeskPro" },
    adminEmail: { type: String, default: "admin@example.com" },
    slaBreachHours: { type: Number, default: 24 }, // Kitne ghante baad ticket breach hoga
  },
  { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model("Setting", settingSchema);