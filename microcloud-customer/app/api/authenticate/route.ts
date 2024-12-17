import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";  // Ensures this route is handled dynamically

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


export async function POST(req: NextRequest) {
  try {
    console.log("Request received for authentication");

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      console.error("Email or password not provided");
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    console.log("Attempting to connect to the database...");
    await sql.connect(dbConfig);

    console.log("Running SQL query...");
    const result = await sql.query`SELECT email, password FROM VW_CustomerAuth WHERE email = ${email}`;

    if (result.recordset.length === 0) {
      console.error("Invalid credentials: User not found");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const user = result.recordset[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.error("Invalid credentials: Password incorrect");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    console.log("Generating JWT token...");
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    console.log("Authentication successful");
    return NextResponse.json({
      token,
      email: user.email, // Include the email in the response
    });
  } catch (error: any) {
    console.error("Server error occurred:", error.message);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}


// export async function POST(req: NextRequest) {
//   try {
//     // Log to confirm request is received
//     console.log("Request received for authentication");

//     const body = await req.json();
//     const { email, password } = body;

//     // Ensure email and password are provided
//     if (!email || !password) {
//       console.error("Email or password not provided");
//       return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
//     }

//     // Connect to your database
//     console.log("Attempting to connect to the database...");
//     await sql.connect(dbConfig);

//     // Run the SQL query
//     console.log("Running SQL query...");
//     const result = await sql.query`SELECT email, password FROM VW_CustomerAuth WHERE email = ${email}`;

//     // Check if user exists
//     if (result.recordset.length === 0) {
//       console.error("Invalid credentials: User not found");
//       return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
//     }

//     const user = result.recordset[0];
//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     // Check if password is valid
//     if (!isPasswordValid) {
//       console.error("Invalid credentials: Password incorrect");
//       return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
//     }

//     // Generate a JWT token
//     console.log("Generating JWT token...");
//     const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, { expiresIn: "1h" });

//     // Return the JWT token
//     console.log("Authentication successful");
//     return NextResponse.json({ token });
//   } catch (error: any) {
//     console.error("Server error occurred:", error.message);
//     return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
//   }
// }
