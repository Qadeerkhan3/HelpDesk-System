import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check karein ke email pehle se majood toh nahi
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Password ko secure (Hash) karein
    const hashedPassword = await bcrypt.hash(password, 10);

    // Naya User create karein (Default role 'User' hoga)
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "User", 
    });

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}