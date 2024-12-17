import { NextResponse } from "next/server";
import sql from "mssql";
// import { verifyToken } from "../middleware";

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

// Modify /api/ticket to fetch tickets for a specific user by email
export async function GET(request: Request) {
    try {
      // Get the user email from session storage (assuming it's stored in session storage)
      const userEmail = request.headers.get("userEmail"); // Fetch user email from the request headers

      if (!userEmail) {
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
      }

      // Connect to the database
      const pool = await sql.connect(config);

      // Execute the query to fetch tickets for the user
      const query = `use microcloud; SELECT t.* FROM TB_Tickets t join TB_Customer c on c.customer_id = t.customer_id WHERE email = @user_email`;
      const result = await pool.request()
        .input("user_email", sql.NVarChar, userEmail)
        .query(query);

      return NextResponse.json(result.recordset);
    } catch (error) {
      console.error("Error fetching tickets:", error.message, error.stack);
      return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
  }


// Add a message to a tickets
export async function POST(request: Request) {
    try {
      // Verify JWT token
      // const decoded = await verifyToken(request);
      // if (!decoded || decoded instanceof NextResponse) {
      //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // }

      // Parse request body
      const body = await request.json();
      const { ticket_id, message_content, admin_reply } = body;

      // Validate input
      if (!ticket_id || !message_content || admin_reply === undefined) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }

      // Connect to the database
      const pool = await sql.connect(config);

      // Execute the query to insert a new message
      const query = `
      use microcloud;
        INSERT INTO TB_Ticket_Messages (ticket_id, message_content, admin_reply)
        VALUES (@ticket_id, @message_content, @admin_reply)
        SELECT SCOPE_IDENTITY() AS message_id;  -- Retrieve the ID of the inserted message
      `;
      const result = await pool.request()
        .input("ticket_id", sql.Int, ticket_id)
        .input("message_content", sql.NVarChar, message_content)
        .input("admin_reply", sql.Bit, admin_reply)
        .query(query);

      const newMessage = {
        message_id: result.recordset[0].message_id,
        ticket_id: ticket_id,
        message_content: message_content,
        admin_reply: admin_reply,
      };

      return NextResponse.json(newMessage);  // Return the newly created message as response

    } catch (error) {
      console.error("Error adding message:", error.message, error.stack);
      return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
  }

  export async function PUT(request: Request) {
    try {
      // Verify JWT token
      // const decoded = await verifyToken(request);
      // if (!decoded || decoded instanceof NextResponse) {
      //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // }

      // Get the ticket_id and resolved from the query parameters
      const url = new URL(request.url);
      const ticket_id = url.searchParams.get("ticket_id");
      const resolved = url.searchParams.get("resolved");

      // Validate input
      if (!ticket_id || resolved === null) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }

      // Convert resolved to a boolean (0 or 1 to false or true)
      const resolvedStatus = resolved === "1" ? true : false;

      // Connect to the database
      const pool = await sql.connect(config);

      // Execute the query to update the ticket status
      const query = `
      use microcloud;
        UPDATE TB_Tickets
        SET resolved = @resolved
        WHERE ticket_id = @ticket_id
      `;
      await pool.request()
        .input("ticket_id", sql.Int, parseInt(ticket_id))
        .input("resolved", sql.Bit, resolvedStatus)
        .query(query);

      return NextResponse.json({ message: "Ticket status updated successfully" });
    } catch (error) {
      console.error("Error updating ticket status:", error.message, error.stack);
      return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
  }


// Optionally, delete a message (if needed)
export async function DELETE(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const url = new URL(request.url);
    const message_id = url.searchParams.get("message_id");

    // Validate input
    if (!message_id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to delete the message
    const query = `
    use microcloud;
      DELETE FROM TB_Ticket_Messages WHERE message_id = @message_id
    `;
    await pool.request()
      .input("message_id", sql.Int, message_id)
      .query(query);

    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
