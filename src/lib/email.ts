import nodemailer from "nodemailer";

// Humne yahan chotha parameter 'replyTo' add kiya hai
export const sendEmail = async (to: string, subject: string, html: string, replyTo?: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Helpdesk Pro" <${process.env.EMAIL_USER}>`,
      to,
      replyTo: replyTo || process.env.EMAIL_USER, // 👈 ReplyTo set kiya
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
};