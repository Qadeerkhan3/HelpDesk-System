import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import User from '../../../lib/models/User';
import Category from '../../../lib/models/Category';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectToDatabase();

    // Check if database is already seeded to prevent duplicates
    const adminExists = await User.findOne({ email: 'admin@test.com' });
    if (adminExists) {
      return NextResponse.json({ message: 'Database is already seeded! You can login now.' }, { status: 200 });
    }

    // Hash a common password for all test accounts
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Users (1 Admin, 2 Agents, 3 Users)
    const usersData = [
      { name: 'System Admin', email: 'admin@test.com', password: hashedPassword, role: 'Admin' },
      { name: 'Support Agent One', email: 'agent1@test.com', password: hashedPassword, role: 'Agent' },
      { name: 'Support Agent Two', email: 'agent2@test.com', password: hashedPassword, role: 'Agent' },
      { name: 'John Doe', email: 'user1@test.com', password: hashedPassword, role: 'User' },
      { name: 'Jane Smith', email: 'user2@test.com', password: hashedPassword, role: 'User' },
      { name: 'Alice Johnson', email: 'user3@test.com', password: hashedPassword, role: 'User' },
    ];

    await User.insertMany(usersData);

    // 2. Create Default Categories
    const categoriesData = [
      { name: 'Technical Support', description: 'App bugs and tech issues', defaultPriority: 'High' },
      { name: 'Billing', description: 'Payment and invoice issues', defaultPriority: 'Medium' },
      { name: 'General Inquiry', description: 'Basic questions', defaultPriority: 'Low' },
      { name: 'Urgent Outage', description: 'System is completely down', defaultPriority: 'Urgent' },
    ];

    await Category.insertMany(categoriesData);

    return NextResponse.json(
      { message: 'Database Seeded Successfully! 🎉 (Users and Categories created)' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Seeding Error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: (error as Error).message },
      { status: 500 }
    );
  }
}