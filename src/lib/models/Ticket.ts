import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  ticketNumber: string;
  title: string;
  description: string;
  category: mongoose.Types.ObjectId;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Waiting on User' | 'Resolved' | 'Closed' | 'SLA Breached';
  createdBy: mongoose.Types.ObjectId;
  assignedAgent?: mongoose.Types.ObjectId;
  attachments: string[]; // Cloudinary URLs
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
    }, // e.g., TKT-0001
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    category: { 
      type: Schema.Types.ObjectId, 
      ref: 'Category', 
      required: true 
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
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
    attachments: [{ type: String }],
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