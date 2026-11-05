import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import connectToDatabase from "../../../../../lib/mongodb";
import Message from "../../../../../lib/models/Message";
import Ticket from "../../../../../lib/models/Ticket";
import { sendEmail } from "../../../../../lib/email";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const messages = await Message.find({ ticket: id })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 });

    return NextResponse.json(messages, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ticket = await Ticket.findById(id).populate("createdBy", "name email");
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const newMessage = await Message.create({
      ticket: id,
      sender: session.user.id,
      message,
    });

    await newMessage.populate("sender", "name email role");

    const isStaff = session.user.role === "Admin" || session.user.role === "Agent";
    
    if (isStaff && ticket.createdBy && ticket.createdBy.email) {
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const displayId = ticket.ticketNumber || ticket._id.toString().substring(ticket._id.toString().length - 6).toUpperCase();
      
      await sendEmail(
        ticket.createdBy.email, 
        `New Reply on Your Ticket: #${displayId}`,
        `<div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 600px; background-color: #ffffff;">
          <h2 style="color: #2563eb; margin-top: 0; font-size: 20px;">New Message Received 📩</h2>
          <p style="color: #334155; font-size: 15px;">Hi <b>${ticket.createdBy.name}</b>,</p>
          <p style="color: #334155; font-size: 15px;"><b>${session.user.name}</b> (Support ${session.user.role}) has replied to your ticket: <b>"${ticket.title}"</b>.</p>
          
          <div style="background: #f8fafc; padding: 18px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6; font-style: italic; color: #475569; font-size: 15px; line-height: 1.5;">
            "${message}"
          </div>
          
          <div style="margin-top: 25px;">
            <a href="${appUrl}/tickets/${ticket._id}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View and Reply to Ticket</a>
          </div>
        </div>`,
        // 🌟 FIX: session.user.email ke sath || "" lagaya hai taake null error na aaye
        session.user.email || "" 
      );
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}