/**
 * @ai-restriction
 * Primary Owner: Umer
 * Mohsin: Do not modify UI/UX design, only permitted to hook up backend APIs.
 * Talha: Do not modify UI/UX design, only permitted to hook up Voice APIs.
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Buslingo",
  description: "Master the language of business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
