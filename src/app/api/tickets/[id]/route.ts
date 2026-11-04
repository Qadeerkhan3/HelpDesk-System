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

export async function PATCH(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Request ki body se data nikalna (isme status bhi ho sakta hai ya assignedAgent bhi)
    const body = await req.json();

    // Database mein ticket ko update karna
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { $set: body }, // 👈 Yeh line ab har us cheez ko update karegi jo frontend se aayegi
      { new: true }
    );

    if (!updatedTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}