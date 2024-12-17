import { NextResponse } from "next/server";
import sql from "mssql";
import bcrypt from "bcrypt";

const SECRET_KEY = process.env.NEXT_PUBLIC_PATCH_API_KEY;



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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const planAmount = searchParams.get("planAmount");

  if (!customerId || !planAmount) {
    return NextResponse.json(
      { error: "Missing required query parameters: customerId or planAmount" },
      { status: 400 }
    );
  }

  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Query the database
    const query = `
      SELECT * FROM VW_OrderDetails
      WHERE customer_id = @CustomerId AND price = @PlanAmount AND status = 'Payment Pending';
    `;

    const result = await pool
      .request()
      .input("CustomerId", sql.Int, parseInt(customerId, 10))
      .input("PlanAmount", sql.Float, parseFloat(planAmount))
      .query(query);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Order not found for the provided customerId and planAmount" },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json({
      status: "Payment Pending",
      orderDetails: result.recordset[0],
    });
  } catch (error) {
    console.error("Error querying the database:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Parse the incoming order data
    const body = await request.json();
    const { customer, subscription } = body;

    if (!customer || !subscription) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    // Hash the password using bcrypt
    const saltRounds = 10; // Number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(customer.password, saltRounds);

    // Connect to the database
    const pool = await sql.connect(config);

    // Begin a transaction
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Insert customer into the Customers table
      const customerInsertResult = await transaction.request()
        .input("FirstName", sql.NVarChar(50), customer.firstName)
        .input("LastName", sql.NVarChar(50), customer.lastName)
        .input("Email", sql.NVarChar(255), customer.email)
        .input("Password", sql.NVarChar(255), hashedPassword) // Save hashed password
        .input("RegionId", sql.Int, customer.region_id)
        .query(`
          INSERT INTO TB_Customer (first_name, last_name, email, password, region_id)
          OUTPUT INSERTED.customer_id
          VALUES (@FirstName, @LastName, @Email, @Password, @RegionId);
        `);

      const customerId = customerInsertResult.recordset[0]?.customer_id;

      if (!customerId) {
        throw new Error("Failed to insert customer");
      }

      // Insert subscription into the Subscriptions table
      await transaction.request()
        .input("CustomerId", sql.Int, customerId)
        .input("PlanId", sql.Int, subscription.plan_id)
        .input("Status", sql.NVarChar(50), subscription.status)
        .query(`
          INSERT INTO TB_Subscription (customer_id, plan_id, status)
          VALUES (@CustomerId, @PlanId, @Status);
        `);

      // Commit the transaction
      await transaction.commit();

      return NextResponse.json({
        message: "Order created successfully",
        customerId,
      });
    } catch (error) {
      // Rollback the transaction if something goes wrong
      await transaction.rollback();
      console.error("Transaction error:", error.message, error.stack);
      return NextResponse.json(
        { error: "Transaction failed", details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error handling POST request:", error.message, error.stack);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const authorizationHeader = request.headers.get("Authorization");

  // Validate API key only server-side
  if (authorizationHeader !== `Bearer ${SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("PATCH request received");
  try {
    // Parse request body
    const body = await request.json();
    console.log("Request body:", body);
    const { customer_id, from_address, to_address, amount_sol, amount_usd } = body;

    // Validate inputs
    if (!customer_id || !from_address || !to_address || !amount_sol || !amount_usd) {
      console.error("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Connecting to the database...");
    const pool = await sql.connect(config);

    // Begin a transaction
    const transaction = new sql.Transaction(pool);
    console.log("Transaction started...");

    try {
      await transaction.begin();

      // Step 1: Update TB_Subscription to set status to "Provisioning"
      console.log("Updating subscription status...");
      const subscriptionUpdateResult = await transaction.request()
        .input("CustomerId", sql.Int, customer_id)
        .input("Status", sql.NVarChar(50), "Provisioning")
        .query(`
          UPDATE TB_Subscription
          SET status = @Status,
          renewal_date = DATEADD(MONTH, 1, GETDATE())
          WHERE customer_id = @CustomerId;
          SELECT sub_id FROM TB_Subscription WHERE customer_id = @CustomerId;
        `);

      console.log("Subscription update result:", subscriptionUpdateResult);

      const subscription = subscriptionUpdateResult.recordset[0];
      if (!subscription) {
        console.error("No subscription found for the given customer_id");
        throw new Error("No subscription found for the given customer_id");
      }
      const subscription_id = subscription.sub_id;
      console.log("Retrieved subscription_id:", subscription_id);

      // Step 2: Insert transaction details into TB_Transactions
      console.log("Inserting transaction details...");
      await transaction.request()
        .input("FromAddress", sql.NVarChar(255), from_address)
        .input("ToAddress", sql.NVarChar(255), to_address)
        .input("AmountSol", sql.Float, amount_sol)
        .input("AmountUsd", sql.Float, amount_usd)
        .input("Timestamp", sql.DateTime, new Date())
        .input("SubscriptionId", sql.Int, subscription_id)
        .input("TrxType", sql.NVarChar(50), "First Payment")
        .query(`
          INSERT INTO TB_Transactions (from_address, to_address, amount_sol, amount_usd, timestamp, subscription_id, trx_type)
          VALUES (@FromAddress, @ToAddress, @AmountSol, @AmountUsd, @Timestamp, @SubscriptionId, @TrxType);
        `);

      // Commit the transaction
      await transaction.commit();
      console.log("Transaction committed successfully");

      return NextResponse.json({ message: "Order status and transaction updated successfully" });
    } catch (error) {
      await transaction.rollback();
      console.error("Transaction failed:", error);
      return NextResponse.json(
        { error: "Transaction failed", details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing PATCH request:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
