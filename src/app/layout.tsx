import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import { Toaster } from "react-hot-toast"; // 👈 Naya Import

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Helpdesk Pro",
  description: "Next.js Helpdesk System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Toaster position="top-right" reverseOrder={false} /> {/* 👈 Yahan Toaster laga diya */}
          {children}
        </Providers>
      </body>
    </html>
  );
}