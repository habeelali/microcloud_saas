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

export async function GET(request: Request) {
  try {
    // Extract ticket_id from query parameters
    const url = new URL(request.url);
    const ticket_id = url.searchParams.get("ticket_id");

    // Validate ticket_id input
    if (!ticket_id) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to fetch messages for the ticket
    const query = `
      SELECT message_id, ticket_id, message_content, admin_reply
      FROM TB_Ticket_Messages
      WHERE ticket_id = @ticket_id
      ORDER BY message_id ASC
    `;
    const result = await pool.request()
      .input("ticket_id", sql.Int, ticket_id)
      .query(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching ticket messages:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
