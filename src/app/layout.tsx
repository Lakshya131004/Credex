import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpendLens — Free AI Spend Audit",
  description:
    "Find out if your team is overpaying for Cursor, Claude, ChatGPT, GitHub Copilot, and more. Free, instant AI spend audit. No signup required.",
  openGraph: {
    title: "SpendLens — Free AI Spend Audit",
    description:
      "Most startups overspend 20–40% on AI tools. This free audit finds exactly where in 2 minutes.",
    type: "website",
    siteName: "SpendLens",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendLens — Free AI Spend Audit",
    description:
      "Find out if you're overpaying for Cursor, Claude, ChatGPT & more. Free 2-minute audit.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
