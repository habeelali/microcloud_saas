import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import sql from "mssql";

// SQL Connection Configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export async function POST(request: Request) {
  // Parse the request payload to get a customer ID
  const { customerId } = await request.json();

  try {
    // Establish SQL connection
    const pool = await sql.connect(config);

    // SQL query to fetch the data for the specific customer
    const query = `
      SELECT * 
      FROM VW_PaidOrderInfo 
      WHERE customer_id = @customerId
    `;

    // Execute the query with a parameterized value
    const result = await pool.request()
      .input("customerId", sql.Int, customerId)
      .query(query);

    // Close the SQL connection
    await sql.close();

    // Ensure there is at least one result
    if (result.recordset.length === 0) {
      return NextResponse.json({ success: false, message: "No order found for this customer" }, { status: 404 });
    }


    const {
      first_name: firstName,
      email: to,
      region_name: regionName,
      plan_name: planName,
      amount_usd: amount,
      purchase_date: purchaseDate,
    } = result.recordset[0];

    const transporter = nodemailer.createTransport({
      host: "smtp.eu.mailgun.org",
      port: 587,
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASS,
      },
    });

    const mailOptions = {
      from: `Microcloud <postmaster@microcloud.tech>`,
      to,
      subject: "Payment Confirmation",
      html: `
        <h1>Payment Confirmation</h1>
        <p>Hi ${firstName},</p>
        <p>We are pleased to confirm that your payment has been successfully received.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li><strong>Region:</strong> ${regionName}</li>
          <li><strong>Plan:</strong> ${planName}</li>
          <li><strong>Amount Paid:</strong> $${amount}</li>
          <li><strong>Purchase Date:</strong> ${new Date(purchaseDate).toLocaleDateString()}</li>
        </ul>
        <p>Your order will be delivered within the next 24 hours. If you have any questions, please contact us.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Payment confirmation email sent successfully" });
  } catch (error) {
    console.error("Error:", error);

    return NextResponse.json({ success: false, message: "An error occurred while processing the request" }, { status: 500 });
  } finally {
    // Ensure the connection is closed
    if (sql.connected) {
      await sql.close();
    }
  }
}
