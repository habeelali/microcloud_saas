import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const { to, firstName, customerId, amount } = await request.json();

  const transporter = nodemailer.createTransport({
    host: "smtp.eu.mailgun.org", // Mailgun SMTP host
    port: 587, // Port for TLS (usually 587)
    auth: {
      user: process.env.MAILGUN_USER, // Your Mailgun SMTP user (e.g., postmaster@sandbox123.mailgun.org)
      pass: process.env.MAILGUN_PASS, // Your Mailgun SMTP password
    },
  });

  const mailOptions = {
    from: `Microcloud <postmaster@microcloud.tech>`, // Replace with a valid sender email address
    to,
    subject: "Your Order Confirmation",
    html: `
      <h1>Order Confirmation</h1>
      <p>Hi ${firstName},</p>
      <p>Thank you for your order! To complete the purchase, please pay within the next 30 minutes.</p>
      <p><strong>Order Amount: $${amount}</strong></p>
      <p>Click <a href="https://www.microcloud.tech/payment?customerId=${customerId}&planAmount=${amount}">here to proceed to payment</a>.</p>
      <p><em>Your order will be cancelled if payment is not received within 30 minutes.</em></p>
      <p>Thank you for choosing us!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ success: false, message: "Failed to send email" }, { status: 500 });
  }
}
