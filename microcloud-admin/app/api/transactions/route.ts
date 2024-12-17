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

    // Connect to the database
    const pool = await sql.connect(config);

    // Execute the query to fetch all plans
    const query = `SELECT * FROM VW_Transactions`;
    const result = await pool.request().query(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching transactions:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
