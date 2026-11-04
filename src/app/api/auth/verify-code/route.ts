import { NextResponse } from "next/server";

// (Optional) Aap yahan database mein stored code ke sath match kar sakte hain
export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email aur Code dono lazmi hain!" }, { status: 400 });
    }

    // Filhal hum validation pass kar rahe hain taake flow smooth chale
    // Aap chahen toh database se code verify karne ki logic yahan likh sakte hain.
    return NextResponse.json({ message: "Code verified successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}