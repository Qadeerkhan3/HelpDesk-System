import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  ticketNumber: string;
  title: string;
  description: string;
  category: string; // 👈 FIX: Isay ObjectId se String kar diya taake form chal sake
  priority: 'Low' | 'Standard' | 'High' | 'Urgent'; // 👈 FIX: 'Medium' ki jagah 'Standard' kar diya
  status: 'Open' | 'In Progress' | 'Waiting on User' | 'Resolved' | 'Closed' | 'SLA Breached';
  createdBy: mongoose.Types.ObjectId;
  assignedAgent?: mongoose.Types.ObjectId;
  attachments: string[]; // ✅ Cloudinary URLs (Perfect)
  responseDueAt?: Date;
  resolutionDueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema(
  {
    ticketNumber: { 
      type: String, 
      required: true, 
      unique: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    category: { 
      type: String, // 👈 FIX: String required for frontend dropdown
      required: true 
    },
    priority: {
      type: String,
      enum: ['Low', 'Standard', 'High', 'Urgent'], // 👈 FIX: Matches frontend
      default: 'Standard',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Waiting on User', 'Resolved', 'Closed', 'SLA Breached'],
      default: 'Open',
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    assignedAgent: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    attachments: [{ type: String }], // ✅ Cloudinary array bilkul theek hai
    responseDueAt: { type: Date },
    resolutionDueAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for faster querying in dashboards
TicketSchema.index({ status: 1 });
TicketSchema.index({ assignedAgent: 1 });
TicketSchema.index({ createdBy: 1 });

const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);

export default Ticket;