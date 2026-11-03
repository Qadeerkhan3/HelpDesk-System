import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional because OAuth might not have a password
  role: 'User' | 'Agent' | 'Admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true 
    },
    password: { 
      type: String 
    },
    role: {
      type: String,
      enum: ['User', 'Agent', 'Admin'],
      default: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Mongoose model caching to prevent re-compilation in Next.js dev environment
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;