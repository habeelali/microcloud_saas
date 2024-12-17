import { NextResponse } from "next/server";
import sql from "mssql";
import { verifyToken } from "../middleware";

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

// GET all customers from VW_AdminCustomerView
export async function GET(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to fetch all customers from the view
    const query = `SELECT * FROM VW_AdminCustomerView`;
    const result = await pool.request().query(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching customers:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Update an existing customer and subscription status
export async function PUT(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { customer_id, first_name, last_name, email, status } = body;

    // Validate input
    if (!customer_id || !first_name || !last_name || !email || typeof status !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to update the customer in TB_Customer
    const customerQuery = `
      UPDATE TB_Customer
      SET first_name = @first_name, last_name = @last_name, email = @email
      WHERE customer_id = @customer_id
    `;
    await pool.request()
      .input("customer_id", sql.Int, customer_id)
      .input("first_name", sql.VarChar, first_name)
      .input("last_name", sql.VarChar, last_name)
      .input("email", sql.VarChar, email)
      .query(customerQuery);

    // Execute the query to update the subscription status in TB_Subscription
    const subscriptionQuery = `
      UPDATE TB_Subscription
      SET status = @status
      WHERE customer_id = @customer_id
    `;
    await pool.request()
      .input("customer_id", sql.Int, customer_id)
      .input("status", sql.VarChar, status)
      .query(subscriptionQuery);

    return NextResponse.json({ message: "Customer and subscription updated successfully" });
  } catch (error) {
    console.error("Error updating customer:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Delete a customer by customer_id
export async function DELETE(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { customer_id } = body;

    // Validate input
    if (!customer_id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to delete the customer from TB_Customer
    const deleteQuery = `
      DELETE FROM TB_Customer
      WHERE customer_id = @customer_id
    `;
    await pool.request()
      .input("customer_id", sql.Int, customer_id)
      .query(deleteQuery);

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
