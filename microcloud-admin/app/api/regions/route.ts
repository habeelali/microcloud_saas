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

export async function GET(request: Request) {
    try {
      const decoded = await verifyToken(request);
      if (!decoded || decoded instanceof NextResponse) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const pool = await sql.connect(config);
      const query = `SELECT * FROM TB_Region`;
      const result = await pool.request().query(query);
      return NextResponse.json(result.recordset);
    } catch (error) {
      console.error("Error fetching regions:", error.message, error.stack);
      return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
  }
  

// Add a new region
export async function POST(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { region_name, available } = body;

    // Validate input
    if (!region_name || typeof available !== "boolean") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to insert a new region
    const query = `
      INSERT INTO TB_Region (region_name, available)
      VALUES (@region_name, @available)
    `;
    await pool.request()
      .input("region_name", sql.VarChar, region_name)
      .input("available", sql.Bit, available)
      .query(query);

    return NextResponse.json({ message: "Region added successfully" });
  } catch (error) {
    console.error("Error adding region:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Edit an existing region
export async function PUT(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { region_id, region_name, available } = body;

    // Validate input
    if (!region_id || !region_name || typeof available !== "boolean") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to update the region
    const query = `
      UPDATE TB_Region
      SET region_name = @region_name, available = @available
      WHERE region_id = @region_id
    `;
    await pool.request()
      .input("region_id", sql.Int, region_id)
      .input("region_name", sql.VarChar, region_name)
      .input("available", sql.Bit, available)
      .query(query);

    return NextResponse.json({ message: "Region updated successfully" });
  } catch (error) {
    console.error("Error editing region:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Delete a region by ID
export async function DELETE(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract region_id from the request query
    const { searchParams } = new URL(request.url);
    const region_id = searchParams.get("region_id");

    // Validate input
    if (!region_id || isNaN(Number(region_id))) {
      return NextResponse.json({ error: "Invalid region ID" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to delete the region
    const query = `
      DELETE FROM TB_Region
      WHERE region_id = @region_id
    `;
    const result = await pool.request()
      .input("region_id", sql.Int, Number(region_id))
      .query(query);

    // Check if the region was deleted
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Region deleted successfully" });
  } catch (error) {
    console.error("Error deleting region:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
