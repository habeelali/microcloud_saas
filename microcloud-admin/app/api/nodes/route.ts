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

// Fetch all nodes
export async function GET(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to fetch all nodes
    const query = `SELECT * FROM VW_AdminNodes`;
    const result = await pool.request().query(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching nodes:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Add a new node
export async function POST(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { node_ip, node_ssh_port, node_region } = body;

    // Validate input
    if (!node_ip || !node_ssh_port || !node_region) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to insert a new node
    const query = `
      INSERT INTO TB_Nodes (node_ip, node_ssh_port, node_region)
      VALUES (@node_ip, @node_ssh_port, @node_region)
    `;
    await pool.request()
      .input("node_ip", sql.NVarChar, node_ip)
      .input("node_ssh_port", sql.Int, node_ssh_port)
      .input("node_region", sql.Int, node_region)
      .query(query);

    return NextResponse.json({ message: "Node added successfully" });
  } catch (error) {
    console.error("Error adding node:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Edit an existing node
export async function PUT(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { node_id, node_ip, node_ssh_port, node_region } = body;

    // Validate input
    if (!node_id || !node_ip || !node_ssh_port || !node_region) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to update the node
    const query = `
    IP PORT REGION
      UPDATE TB_Nodes
      SET node_ip = @node_ip, node_ssh_port = @node_ssh_port, node_region = @node_region
      WHERE node_id = @node_id
    `;
    await pool.request()
      .input("node_id", sql.Int, node_id)
      .input("node_ip", sql.NVarChar, node_ip)
      .input("node_ssh_port", sql.Int, node_ssh_port)
      .input("node_region", sql.Int, node_region)
      .query(query);

    return NextResponse.json({ message: "Node updated successfully" });
  } catch (error) {
    console.error("Error editing node:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}


// Delete a node
export async function DELETE(request: Request) {
    try {
      // Verify JWT token
      const decoded = await verifyToken(request);
      if (!decoded || decoded instanceof NextResponse) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Parse request body
      const url = new URL(request.url);
      const node_ip = url.searchParams.get("node_ip");

      // Validate input
      if (!node_ip) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }

      // Connect to the database
      const pool = await sql.connect(config);

      // Execute the query to delete the node
      const query = `
        DELETE FROM TB_Nodes
        WHERE node_ip = @node_ip
      `;
      await pool.request()
        .input("node_ip", sql.NVarChar, node_ip)
        .query(query);

      return NextResponse.json({ message: "Node deleted successfully" });
    } catch (error) {
      console.error("Error deleting node:", error.message, error.stack);
      return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
  }
