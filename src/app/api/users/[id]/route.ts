import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Security Check: Sirf Admin roles change kar sakta hai
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await req.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Role update karein
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: role },
      { new: true }
    ).select("-password"); // Password wapas bhejne ki zaroorat nahi

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}