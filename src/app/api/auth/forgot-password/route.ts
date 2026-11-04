import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { sendEmail } from "../../../../lib/email";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email likhna lazmi hai!" }, { status: 400 });
    }

    // Check karein ke user database mein mojood hai ya nahi
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Is email par koi account registered nahi hai." }, { status: 404 });
    }

    // 6 digits ka random reset code generate karein
    const resetCode = Math.floor(100000 + Math.random() * 900000);

    // User ki real email par code bhejna
    await sendEmail(
      email,
      "Password Reset Code - Helpdesk System",
      `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px;">
        <h2 style="color: #1e40af; margin-top: 0;">Password Reset Request 🔑</h2>
        <p>Aapke account ka password reset karne ke liye yeh verification code istemal karein:</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin-top: 15px; font-size: 24px; font-weight: bold; color: #2563eb; text-align: center; letter-spacing: 4px;">
          ${resetCode}
        </div>
        <p style="margin-top: 20px; color: #64748b; font-size: 14px;">Agar aapne yeh darkhwast nahi di thi, toh is email ko nazar-andaz kar dein.</p>
      </div>`
    );

    return NextResponse.json({ message: "Reset code kamyabi se bhej diya gaya hai" }, { status: 200 });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}