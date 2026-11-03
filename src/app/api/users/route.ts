import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import connectToDatabase from "../../../lib/mongodb";
import User from "../../../lib/models/User";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Sirf Admin is API ko hit kar sakta hai
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Saare users ko unke banne ki date ke hisaab se fetch karein
    const users = await User.find().sort({ createdAt: -1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}