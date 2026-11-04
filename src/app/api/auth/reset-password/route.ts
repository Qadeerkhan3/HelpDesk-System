import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Tamam fields lazmi hain!" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User nahi mila." }, { status: 404 });
    }

    // Naye password ko hash karna
    const hashedPassword = await bcrypt.hash(password, 10);

    // Database mein password update karna
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}