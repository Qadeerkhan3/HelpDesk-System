import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/mongodb";
import Category from "../../../lib/models/Category";

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find().select("_id name defaultPriority");
    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}