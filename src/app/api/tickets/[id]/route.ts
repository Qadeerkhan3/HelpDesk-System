import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/mongodb";
import Ticket from "../../../../lib/models/Ticket";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    // 🌟 FIX: Params ko await kiya gaya hai
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const ticket = await Ticket.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedAgent", "name email");

    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    return NextResponse.json(ticket, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    // 🌟 FIX: Params ko await kiya gaya hai
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await req.json();
    const updatedTicket = await Ticket.findByIdAndUpdate(id, body, { new: true });
    
    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    // 🌟 FIX: Params ko await kiya gaya hai
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await Ticket.findByIdAndDelete(id);
    return NextResponse.json({ message: "Ticket deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}