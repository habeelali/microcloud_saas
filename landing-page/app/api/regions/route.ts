import { NextResponse } from "next/server";
import sql from "mssql";

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

// GET handler to fetch plans
export async function GET(request: Request) {
  try {


    // Connect to the database
    const pool = await sql.connect(config);

    // Query the VW_Plans view
    const query = `SELECT * from TB_Region where available = 1`;
    const result = await pool.request().query(query);

    // Return the query result
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching plans:", error.message, error.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
