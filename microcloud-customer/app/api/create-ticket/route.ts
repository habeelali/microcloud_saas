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

export async function POST(request: Request) {
    try {
        // Parse request body
        const body = await request.json();
        const { userEmail } = body; // Extract userEmail from the request body

        // Validate input
        if (!userEmail) {
            return NextResponse.json({ error: "Invalid input: userEmail is required" }, { status: 400 });
        }

        // Connect to the database
        const pool = await sql.connect(config);

        // Fetch customer_id using userEmail
        const customerQuery = `
        use microcloud;
        SELECT customer_id
        FROM TB_Customer
        WHERE email = @userEmail;
        `;

        const customerResult = await pool.request()
            .input("userEmail", sql.NVarChar, userEmail)
            .query(customerQuery);

        // Validate if a customer was found
        if (customerResult.recordset.length === 0) {
            return NextResponse.json({ error: "Customer not found for the provided email" }, { status: 404 });
        }

        const customer_id = customerResult.recordset[0].customer_id;

        // Insert into TB_Tickets
        const ticketQuery = `
        use microcloud;
        INSERT INTO TB_Tickets (customer_id, create_date, resolved)
        VALUES (@customer_id, GETDATE(), 0);
        SELECT SCOPE_IDENTITY() AS ticket_id;  -- Retrieve the ID of the inserted ticket
        `;

        const ticketResult = await pool.request()
            .input("customer_id", sql.Int, customer_id)
            .query(ticketQuery);

        const newTicket = {
            ticket_id: ticketResult.recordset[0].ticket_id,
            customer_id: customer_id,
            create_date: new Date(),
            resolved: false,
        };

        return NextResponse.json(newTicket); // Return the newly created ticket as response

    } catch (error) {
        console.error("Error processing request:", error.message, error.stack);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
