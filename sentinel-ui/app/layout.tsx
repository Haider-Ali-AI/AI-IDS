import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sentinel — AI Threat Intelligence",
  description:
    "LLM-Powered Intrusion Detection System with real-time network monitoring, AI-driven threat analysis, and SOC dashboard.",
  keywords: ["IDS", "intrusion detection", "cybersecurity", "AI", "network security"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${orbitron.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full"
        style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          background: "var(--bg-deep)",
          color: "var(--text-primary)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
