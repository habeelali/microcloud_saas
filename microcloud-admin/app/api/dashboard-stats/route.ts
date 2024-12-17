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
    trustServerCertificate: true, // Set to true for development, false for production
  },
};

export async function GET(request: Request) {
  try {
    // Verify JWT token
    const decoded = await verifyToken(request);
    if (!decoded || decoded instanceof NextResponse) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query
    const query = `SELECT * FROM VW_Dashboard_Stats`;
    const result = await pool.request().query(query);

    // Close the database connection (optional, if using connection pooling, not required)
    await pool.close();

    // Return the result
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
