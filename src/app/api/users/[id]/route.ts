import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth"; 
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();
    
    // Naye Next.js versions (15+) mein params Promise ho sakta hai
    const resolvedParams = await Promise.resolve(params);
    
    // Explicitly batana ke kya update karna hai
    const updateData: any = {};
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updatedUser = await User.findByIdAndUpdate(
      resolvedParams.id, 
      { $set: updateData }, 
      { new: true }
    );
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}