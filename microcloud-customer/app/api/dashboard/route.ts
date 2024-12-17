import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER,
  options: {
    encrypt: false, // Use this if you're using Azure SQL
    trustServerCertificate: true, // Change to false if you have a valid certificate
  },
};

export async function GET(req: NextRequest) {
  try {
    // Extract email from request headers
    const email = req.headers.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    console.log("Attempting to connect to the database...");
    await sql.connect(dbConfig);

    console.log("Running SQL query...");
    const result = await sql.query`
      SELECT 
        s.renewal_date, 
        p.plan_name, 
        p.ram, 
        p.vcpu, 
        p.storage, 
        n.node_ip, 
        i.instance_status 
      FROM TB_Customer c
      JOIN TB_Subscription s ON s.customer_id = c.customer_id
      JOIN TB_Plans p ON p.plan_id = s.plan_id
      JOIN TB_Instances i ON i.subscription_id = s.sub_id
      JOIN TB_Nodes n ON n.node_id = i.node_id
      WHERE c.email = ${email}`;

    // Check if the query returned any results
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { message: "No data found for the provided email" },
        { status: 404 }
      );
    }

    // Return the data
    return NextResponse.json(result.recordset, { status: 200 });
  } catch (error: any) {
    console.error("Server error occurred:", error.message);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
