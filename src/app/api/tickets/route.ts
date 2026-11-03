import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import connectToDatabase from "../../../lib/mongodb";
import Ticket from "../../../lib/models/Ticket";
import Category from "../../../lib/models/Category";
import { sendEmail } from "../../../lib/email";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Turbopack Tree-Shaking fix
    const _categoryCheck = Category.modelName;

    // Role-based fetching
    let tickets;
    if (session.user.role === "Admin" || session.user.role === "Agent") {
      tickets = await Ticket.find().populate("category", "name").sort({ createdAt: -1 });
    } else {
      tickets = await Ticket.find({ createdBy: session.user.id })
        .populate("category", "name")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(tickets, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { title, description, priority, category } = body;

    if (!title || !description || !priority || !category) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Unique Ticket Number generate karein
    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket = await Ticket.create({
      ticketNumber,
      title,
      description,
      priority,
      category,
      createdBy: session.user.id,
      status: "Open",
    });

    // 📧 EMAIL ALERT TO ADMIN
    const adminEmail = "qadeeru89@gmail.com"; 
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    await sendEmail(
      adminEmail,
      `New Ticket Created: ${title}`,
      `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px;">
        <h2 style="color: #1e40af; margin-top: 0;">New Ticket Alert 🚨</h2>
        <p>A new ticket has been submitted by <b>${session.user.name}</b>.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 10px 0;"><b>Ticket ID:</b> ${ticketNumber}</p>
          <p style="margin: 0 0 10px 0;"><b>Title:</b> ${title}</p>
          <p style="margin: 0;"><b>Priority:</b> ${priority}</p>
        </div>
        <a href="${appUrl}/tickets/${newTicket._id}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold;">View in Dashboard</a>
      </div>`
    );

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}