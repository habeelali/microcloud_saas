import { NextResponse } from "next/server";
import sql from "mssql";
import { verifyToken } from "../middleware";

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
  try {
    // const decoded = await verifyToken(request);
    // if (!decoded || decoded instanceof NextResponse) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Parse the request body to get the email
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Step 1: Get the customer_id from TB_Customer where email matches the input email
    const customerQuery = `SELECT customer_id FROM TB_Customer WHERE email = @Email`;
    const customerResult = await pool
      .request()
      .input('Email', sql.VarChar, email)
      .query(customerQuery);

    if (!customerResult.recordset || customerResult.recordset.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customerId = customerResult.recordset[0].customer_id;

    // Step 2: Update the TB_Subscription to set status to 'Cancelled' for the given customer_id
    const updateQuery = `UPDATE TB_Subscription SET status = 'Cancelled' WHERE customer_id = @CustomerId`;
    await pool
      .request()
      .input('CustomerId', sql.Int, customerId)
      .query(updateQuery);

    return NextResponse.json({ message: "Subscription successfully cancelled" });
  } catch (error) {
    console.error("Error cancelling subscription:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
