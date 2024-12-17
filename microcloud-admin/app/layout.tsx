import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"], // Adjust subsets as needed
  variable: "--font-inter", // Optional: Add a CSS variable for Tailwind integration
});

export const metadata = {
  title: "Admin Login",
  description: "Admin Login Page",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
