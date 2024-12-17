import { NextResponse } from "next/server";
import sql from "mssql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
    const { email, password } = await request.json();
    const pool = await sql.connect(config);
    const query = `SELECT * FROM TB_Admins WHERE email = @Email`;
    const result = await pool
      .request()
      .input("Email", sql.NVarChar, email)
      .query(query);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const admin = result.recordset[0];
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = jwt.sign(
      { admin_id: admin.admin_id, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    await logEvent(pool, "Successful Login", admin.admin_id);
    return NextResponse.json({ token, role: admin.role });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function logEvent(pool: sql.ConnectionPool, eventType: string, adminId: number) {
  const query = `
    INSERT INTO TB_Admin_Logs (event_type, admin_id)
    VALUES (@EventType, @AdminId)
  `;
  await pool
    .request()
    .input("EventType", sql.NVarChar, eventType)
    .input("AdminId", sql.Int, adminId)
    .query(query);
}
