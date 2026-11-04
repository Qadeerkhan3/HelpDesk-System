import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/mongodb";
import User from "../../../lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Tamam fields fill karna lazmi hain" }, { status: 400 });
    }

    // Check karein ke email pehle se registered toh nahi
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Yeh email pehle se registered hai!" }, { status: 400 });
    }

    // Password ko secure (hash) karna
    const hashedPassword = await bcrypt.hash(password, 10);

    // Naya user banana (By default role "User" hoga)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "User",
    });

    return NextResponse.json({ message: "User created successfully", userId: newUser._id }, { status: 201 });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}