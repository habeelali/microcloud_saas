import { NextResponse } from "next/server";
import sql from "mssql";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  const config = {
    user: "",
    password: "", // These will be dynamically assigned below
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };

  try {
    const { username, password } = await request.json();

    // Dynamically assign username and password
    const connectionConfig = {
      ...config,
      user: username,
      password: password,
    };

    // Explicitly create a new connection pool for this request
    let pool;
    try {
      pool = new sql.ConnectionPool(connectionConfig);
      await pool.connect();
    } catch (authError) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Get the roles of the authenticated user
    const roleQuery = `
      SELECT dp.name AS RoleName
      FROM sys.database_principals dp
      JOIN sys.database_role_members drm
          ON dp.principal_id = drm.role_principal_id
      WHERE drm.member_principal_id = DATABASE_PRINCIPAL_ID();
    `;
    const rolesResult = await pool.request().query(roleQuery);

    const roles = rolesResult.recordset.map((record) => record.RoleName);

    // Create a JWT token
    const token = jwt.sign(
      { username, roles },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    // Close the connection explicitly
    await pool.close();

    return NextResponse.json({ token, roles });
  } catch (error) {
    console.error("Error during authentication:", error);

    // Ensure the pool is closed in case of any errors
    if (pool && pool.connected) {
      await pool.close();
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
