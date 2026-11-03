import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  ticketId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  action: string;
  previousValue?: string;
  newValue?: string;
  createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    ticketId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Ticket', 
      required: true 
    },
    actorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    action: { 
      type: String, 
      required: true 
    }, // e.g., 'STATUS_CHANGED', 'ASSIGNED', 'PRIORITY_CHANGED'
    previousValue: { type: String },
    newValue: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // Sirf creation time chahiye update nahi
);

const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;