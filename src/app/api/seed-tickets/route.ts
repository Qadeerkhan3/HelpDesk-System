import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import User from '../../../lib/models/User';
import Category from '../../../lib/models/Category';
import Ticket from '../../../lib/models/Ticket';

export async function GET() {
  try {
    await connectToDatabase();

    // Check karein ke tickets pehle se maujood toh nahi hain
    const existingTickets = await Ticket.countDocuments();
    if (existingTickets > 0) {
      return NextResponse.json({ message: 'Tickets already exist in DB!' }, { status: 200 });
    }

    // Database se existing users aur categories nikalein
    const users = await User.find({ role: 'User' });
    const agent = await User.findOne({ role: 'Agent' });
    const categories = await Category.find();

    if (users.length === 0 || categories.length === 0) {
       return NextResponse.json({ error: 'Please run /api/seed first.' }, { status: 400 });
    }

    // 3 Fake Tickets create karein
    const sampleTickets = [
      {
        ticketNumber: 'TKT-1001',
        title: 'Cannot access my billing portal',
        description: 'I keep getting a 404 error when I click on billing.',
        category: categories[1]._id, // Billing Category
        priority: 'High',
        status: 'Open',
        createdBy: users[0]._id, // user1@test.com ka ticket
        responseDueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        resolutionDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        ticketNumber: 'TKT-1002',
        title: 'System is completely down!',
        description: 'No one in the office can login.',
        category: categories[3]._id, // Urgent Category
        priority: 'Urgent',
        status: 'In Progress',
        createdBy: users[1]._id, // user2@test.com ka ticket
        assignedAgent: agent?._id, // Ek agent ko assign kar diya
        responseDueAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        resolutionDueAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
      },
      {
        ticketNumber: 'TKT-1003',
        title: 'How to update profile picture?',
        description: 'Just a general question.',
        category: categories[2]._id, // General Category
        priority: 'Low',
        status: 'Resolved',
        createdBy: users[0]._id, // user1@test.com ka doosra ticket
        responseDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        resolutionDueAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
      }
    ];

    await Ticket.insertMany(sampleTickets);

    return NextResponse.json({ message: 'Fake Tickets Created Successfully! 🎉' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}