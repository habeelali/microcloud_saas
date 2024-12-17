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
//   const decoded = await verifyToken(request);
//   if (!decoded) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Query the view
    const query = `SELECT * FROM TB_Audit_Logs`;
    const result = await pool.request().query(query);

    // Return the result
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
