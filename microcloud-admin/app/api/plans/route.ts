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

// Fetch all plans
export async function GET(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to fetch all plans
    const query = `SELECT * FROM TB_Plans`;
    const result = await pool.request().query(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching plans:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Add a new plan
export async function POST(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { plan_name, vcpu, ram, storage, bandwidth, price } = body;

    // Validate input
    if (!plan_name || !vcpu || !ram || !storage || !bandwidth || !price) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to insert a new plan
    const query = `
      EXEC P_CreatePlan @plan_name, @vcpu, @ram, @storage, @bandwidth, @price
    `;
    await pool.request()
      .input("plan_name", sql.VarChar, plan_name)
      .input("vcpu", sql.Real, vcpu)
      .input("ram", sql.Int, ram)
      .input("storage", sql.Int, storage)
      .input("bandwidth", sql.Int, bandwidth)
      .input("price", sql.Real, price)
      .query(query);

    return NextResponse.json({ message: "Plan added successfully" });
  } catch (error) {
    console.error("Error adding plan:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Edit an existing plan
export async function PUT(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { plan_id, plan_name, vcpu, ram, storage, bandwidth, price, available, stock } = body;

    // Validate input
    if (!plan_id || !plan_name || !vcpu || !ram || !storage || !bandwidth || !price || available === undefined || !stock) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to update the plan
    const query = `
      EXEC P_UpdatePlan @plan_id, @plan_name, @vcpu, @ram, @storage, @bandwidth, @price, @available, @stock
    `;
    await pool.request()
      .input("plan_id", sql.Int, plan_id)
      .input("plan_name", sql.VarChar, plan_name)
      .input("vcpu", sql.Real, vcpu)
      .input("ram", sql.Int, ram)
      .input("storage", sql.Int, storage)
      .input("bandwidth", sql.Int, bandwidth)
      .input("price", sql.Real, price)
      .input("available", sql.Bit, available)
      .input("stock", sql.Int, stock)
      .query(query);

    return NextResponse.json({ message: "Plan updated successfully" });
  } catch (error) {
    console.error("Error updating plan:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Delete a plan
export async function DELETE(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const url = new URL(request.url);
    const plan_id = url.searchParams.get("plan_id");

    // Validate input
    if (!plan_id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to delete the plan
    const query = `
      EXEC P_DeletePlan @plan_id
    `;
    await pool.request()
      .input("plan_id", sql.Int, plan_id)
      .query(query);

    return NextResponse.json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
