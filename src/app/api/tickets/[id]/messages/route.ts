import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import connectToDatabase from "../../../../../lib/mongodb";
import Message from "../../../../../lib/models/Message";
import Ticket from "../../../../../lib/models/Ticket";
import { sendEmail } from "../../../../../lib/email";

// GET method: Puraney messages fetch karne ke liye 
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
      
      // Ticket ID format set karein
      const displayId = ticket.ticketNumber || ticket._id.toString().substring(ticket._id.toString().length - 6).toUpperCase();
      
      await sendEmail(
        ticket.createdBy.email, // User ko email jayegi
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
          
          <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px;">
            Please click the button above to reply. Do not reply directly to this email.
          </p>
        </div>`,
        session.user.email // replyTo
      );
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error("POST Message Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}