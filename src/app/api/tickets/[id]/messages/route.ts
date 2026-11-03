import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import connectToDatabase from "../../../../../lib/mongodb";
import Message from "../../../../../lib/models/Message";
import Ticket from "../../../../../lib/models/Ticket";
import { sendEmail } from "../../../../../lib/email";

// GET method: Puraney messages fetch karne ke liye (Ye same rahega)
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

// POST method: Naya message bhejne aur Email alert ke liye
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

    // Pehle ticket dhoondein aur uske User (createdBy) ka data nikaalein
    const ticket = await Ticket.findById(id).populate("createdBy", "name email");
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Database mein naya message save karein
    const newMessage = await Message.create({
      ticket: id,
      sender: session.user.id,
      message,
    });

    // Populate the sender so UI updates immediately
    await newMessage.populate("sender", "name email role");

    // 📧 EMAIL ALERT LOGIC: Agar Admin ya Agent ne message kiya hai toh User ko email bhejein
    const isStaff = session.user.role === "Admin" || session.user.role === "Agent";
    
    if (isStaff && ticket.createdBy && ticket.createdBy.email) {
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      
      await sendEmail(
        ticket.createdBy.email, // User ko email jayegi
        `New Reply on Your Ticket: ${ticket.ticketNumber}`,
        `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px;">
          <h2 style="color: #1e40af; margin-top: 0;">New Message Received 📩</h2>
          <p>Hi <b>${ticket.createdBy.name}</b>,</p>
          <p><b>${session.user.name}</b> (Support ${session.user.role}) has replied to your ticket: <b>"${ticket.title}"</b>.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #3b82f6; font-style: italic; color: #475569;">
            "${message}"
          </div>
          
          <a href="${appUrl}/tickets/${ticket._id}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold;">Click to Reply</a>
        </div>`,
        session.user.email // replyTo: Agar user direct email par reply kare toh Agent/Admin ko wapas jaye
      );
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}