import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/features/categories/components/Header";
import { Providers } from "./Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polymarket Clone — PLAEE Assignment",
  description:
    "Live-ticking prediction-market dashboard built on Polymarket's Gamma REST and CLOB WebSocket feeds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
