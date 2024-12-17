import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};


const transporter = nodemailer.createTransport({
    host: "smtp.eu.mailgun.org",
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASS,
    },
});


const otpStore: { [key: string]: string } = {};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, action, otp, newPassword } = body;


        if (action === "sendOtp") {
            await sql.connect(dbConfig);
            const result = await sql.query`SELECT email FROM TB_Customer WHERE email = ${email}`;

            if (result.recordset.length === 0) {
                return NextResponse.json({ message: "Email not found" }, { status: 404 });
            }


            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore[email] = generatedOtp;


            const mailOptions = {
                from: "noreply@yourdomain.com",
                to: email,
                subject: "Your Password Reset Code",
                text: `Your OTP code is: ${generatedOtp}`,
            };

            await transporter.sendMail(mailOptions);

            return NextResponse.json({ message: "OTP sent successfully" });
        }


        if (action === "validateOtp") {
            if (otpStore[email] && otpStore[email] === otp) {
                return NextResponse.json({ message: "OTP validated" });
            } else {
                return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
            }
        }


        if (action === "updatePassword") {
            if (!newPassword) {
                return NextResponse.json({ message: "New password required" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await sql.connect(dbConfig);
            await sql.query`UPDATE TB_Customer SET password = ${hashedPassword} WHERE email = ${email}`;


            delete otpStore[email];

            return NextResponse.json({ message: "Password updated successfully" });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Server error:", error.message);
        return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
    }
}
