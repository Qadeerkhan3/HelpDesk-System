import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import connectToDatabase from "../../../../lib/mongodb";
import Ticket from "../../../../lib/models/Ticket";
import Category from "../../../../lib/models/Category";
import User from "../../../../lib/models/User";
import { sendEmail } from "../../../../lib/email";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Turbopack Check
    const _categoryCheck = Category.modelName;
    const _userCheck = User.modelName;
    
    const { id } = await params;

    const ticket = await Ticket.findById(id)
      .populate("category", "name")
      .populate("createdBy", "name email")
      .populate("assignedAgent", "name email");

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Security check
    if (session.user.role === "User" && ticket.createdBy._id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    return NextResponse.json(ticket, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔒 RBAC CHECK
    if (session.user.role === 'User') {
      return NextResponse.json({ error: "Only Agents and Admins can update status" }, { status: 403 });
    }

    await connectToDatabase();
    
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Status update karein aur 'createdBy' (User) ka data nikaalein
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    ).populate("createdBy", "name email");

    if (!updatedTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 📧 EMAIL ALERT TO USER
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    if (updatedTicket.createdBy && updatedTicket.createdBy.email) {
      await sendEmail(
        updatedTicket.createdBy.email, 
        `Ticket Status Updated: ${updatedTicket.ticketNumber}`,
        `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px;">
          <h2 style="color: #1e40af; margin-top: 0;">Ticket Update 📝</h2>
          <p>Hi <b>${updatedTicket.createdBy.name}</b>,</p>
          <p>The status of your ticket has been changed to <span style="background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${status}</span> by our support team.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0 0 10px 0;"><b>Ticket ID:</b> ${updatedTicket.ticketNumber}</p>
            <p style="margin: 0;"><b>Title:</b> ${updatedTicket.title}</p>
          </div>
          <a href="${appUrl}/tickets/${updatedTicket._id}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold;">View Your Ticket</a>
        </div>`
      );
    }

    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}