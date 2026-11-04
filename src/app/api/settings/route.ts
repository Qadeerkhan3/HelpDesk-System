import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import connectToDatabase from "../../../lib/mongodb";
import Setting from "../../../lib/models/Setting";

// Settings GET karne ke liye
export async function GET() {
  try {
    await connectToDatabase();
    let settings = await Setting.findOne();
    
    // Agar database mein settings nahi hain, toh default create kar do
    if (!settings) {
      settings = await Setting.create({});
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// Settings UPDATE karne ke liye
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();
    
    // Upsert = true ka matlab hai agar nahi mili toh nayi bana dega
    const updatedSettings = await Setting.findOneAndUpdate({}, body, { new: true, upsert: true });
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}