import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/mongodb";
import Ticket from "../../../../lib/models/Ticket";
import { sendEmail } from "../../../../lib/email";

export async function GET(req: Request) {
  try {
    // Note: Production mein yahan ek secret key lagate hain taake koi aur isay hit na kar sake.
    await connectToDatabase();

    // Pichle 24 ghante ka waqt nikalen
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Wo tickets dhoondein jo 24 ghante se purani hain aur abhi tak "Open" hain
    const breachedTickets = await Ticket.find({
      status: "Open",
      createdAt: { $lte: yesterday }
    }).populate("createdBy", "name email");

    if (breachedTickets.length === 0) {
      return NextResponse.json({ message: "System check: No SLA breached tickets today. Great job!" }, { status: 200 });
    }

    // Email ka table/design banayein
    let ticketsHtml = "";
    breachedTickets.forEach((ticket) => {
      ticketsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><b>${ticket.ticketNumber}</b></td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${ticket.title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${ticket.createdBy?.name || "Unknown"}</td>
        </tr>
      `;
    });

    // 📧 EMAIL ALERT TO ADMIN
    const adminEmail = process.env.EMAIL_USER as string; // Admin ko jayegi
    
    await sendEmail(
      adminEmail,
      `🚨 SLA Breach Alert: ${breachedTickets.length} Tickets Overdue!`,
      `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px; max-width: 600px;">
        <h2 style="color: #dc2626; margin-top: 0;">SLA Breach Alert 🚨</h2>
        <p>You have <b>${breachedTickets.length}</b> ticket(s) that have been Open for more than 24 hours without any action.</p>
        
        <table style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
          <tr style="background: #f8fafc;">
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb;">Ticket ID</th>
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb;">Title</th>
            <th style="padding: 10px; border-bottom: 2px solid #e5e7eb;">User</th>
          </tr>
          ${ticketsHtml}
        </table>
        
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold;">Go to Dashboard</a>
      </div>`
    );

    return NextResponse.json({ 
      message: `SLA Alert sent successfully for ${breachedTickets.length} tickets.` 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}