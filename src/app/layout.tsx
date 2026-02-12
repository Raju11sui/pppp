import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Privacy Policy Simplifier — AI Privacy Analysis",
  description:
    "Instant AI breakdown of privacy policies. Understand data collection, hidden risks, and get a privacy risk score — clear, transparent, fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white text-[#111111] antialiased">
        {children}
      </body>
    </html>
  );
}
